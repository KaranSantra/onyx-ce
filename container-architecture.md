# Onyx Container Architecture

This document explains the purpose and role of each container in the Onyx deployment architecture.

## Document Processing Pipeline

Understanding how documents flow through the system helps clarify why each container is necessary:

1. **Document Ingestion**: Users upload documents or connect data sources
2. **Chunking**: The `background` container breaks documents into smaller chunks
3. **Embedding Generation**: Chunks are sent to `indexing_model_server` which converts text to vector embeddings
4. **Storage**: The embeddings and metadata are stored in the `index` (Vespa) container
5. **Search**: When users query, Vespa performs vector similarity search on stored embeddings
6. **Inference**: Real-time chat uses `inference_model_server` for generating responses

### Key Insight: Indexing Model Server vs Vespa
- **indexing_model_server**: Creates embeddings (ML computation)
- **index (Vespa)**: Stores and searches embeddings (vector database)

These are complementary services - one generates the data, the other stores and retrieves it.

## Core Infrastructure Containers

### `background`
**Purpose**: Asynchronous task processor for heavy document operations

Think of this as a dedicated worker that handles time-consuming jobs without blocking user requests.

**What it does:**
- Extracts text from uploaded PDFs, Word docs, and other files
- Breaks documents into chunks for better search performance
- Orchestrates the entire document processing pipeline
- Handles scheduled tasks like connector syncing and cleanup

**Technical details:**
- Uses supervisord to manage multiple background processes
- Processes jobs from Redis queues (Celery task queue)
- Communicates with all other containers for document processing
- Same codebase as API server but runs different entry points

**Key functions:** `index_doc_batch()`, `chunker.chunk()`, document parsing

### `relational_db`
**Purpose**: Central database for all application state and metadata

This is the "source of truth" for everything except the actual document content and search indexes.

**What it stores:**
- User accounts, permissions, and authentication data
- Document metadata (title, upload date, source, permissions)
- Connector configurations (Slack, Google Drive, etc.)
- Search settings and indexing status
- Chat history and user preferences

**Technical details:**
- PostgreSQL 15.2-alpine (lightweight Linux distribution)
- Configured for 250 concurrent connections (high-traffic support)
- Uses connection pooling for performance
- Persistent storage mounted at `/var/lib/postgresql/data`

**Key tables:** `users`, `documents`, `chunks`, `connector_credential_pairs`, `chat_sessions`

### `index`
**Purpose**: High-performance search engine that stores and retrieves document content

Think of this as a specialized database optimized for finding relevant documents quickly.

**What it does:**
- Stores document chunks with their vector embeddings (numerical representations)
- Performs lightning-fast semantic search ("find documents similar to this concept")
- Handles traditional keyword search ("find documents containing these words")
- Combines both approaches for best results (hybrid search)

**Technical details:**
- Powered by Vespa search engine (enterprise-grade distributed system)
- Stores embeddings as 384-dimensional float vectors
- Uses HNSW algorithm for approximate nearest neighbor search
- Exposes REST API on ports 8081 (search) and 19071 (admin)
- Builds inverted indexes for fast keyword matching

**Key APIs:** `/search/` (query), `/document/v1/` (indexing), vector similarity functions

### `cache`
**Purpose**: In-memory data store for fast access to frequently used information

Think of this as a high-speed temporary storage that makes everything faster.

**What it caches:**
- User session data (login status, permissions)
- Frequently accessed search results
- Background job queues and status
- Temporary data during document processing

**Technical details:**
- Redis 7.4-alpine (in-memory key-value store)
- Configured as ephemeral (data doesn't survive restarts)
- Single-threaded but extremely fast (sub-millisecond access)
- Uses Redis protocol on port 6379
- Automatic memory eviction when full (LRU policy)

**Key data structures:** Hash tables for sessions, lists for job queues, sets for permissions

## AI/ML Model Servers

### `inference_model_server`
**Purpose**: Real-time AI model server for user-facing features

This handles AI operations that users are actively waiting for (like chat responses).

**What it does:**
- Generates embeddings for user search queries
- Runs reranking models to improve search result quality
- Handles intent classification (determining what users want)
- Processes real-time chat requests

**Technical details:**
- Same codebase as indexing model server but optimized for speed
- Loads models into GPU/CPU memory for fast inference
- Uses Hugging Face transformers library
- Exposes FastAPI endpoints on port 9000
- Can be horizontally scaled for high user load

**Key endpoints:** `/embed`, `/rerank`, `/intent`, model health checks

### `indexing_model_server`
**Purpose**: Batch AI processing server that converts documents into searchable vectors

This is the "heavy lifting" AI server that processes documents in the background.

**What it does:**
- Converts text chunks into 384-dimensional embedding vectors
- Uses transformer models (like all-MiniLM-L6-v2) for semantic understanding
- Processes documents in batches for efficiency
- Handles large volumes without blocking user operations

**Technical details:**
- Configured with `INDEXING_ONLY=True` (disables user-facing endpoints)
- Optimized for throughput over latency (batch processing)
- Uses separate model cache to avoid conflicts with inference server
- Runs same FastAPI framework but different endpoints enabled
- Can utilize GPU acceleration for faster processing

**Key functions:** `embed_chunks()`, batch text processing, model loading from HuggingFace

## Storage and File Management

### `minio`
**Purpose**: Self-hosted file storage system for uploaded documents

Think of this as your own personal Amazon S3 that stores all the actual files.

**What it stores:**
- Original uploaded files (PDFs, Word docs, images)
- User profile pictures and assets
- Extracted document content and plaintext
- Temporary files during processing

**Technical details:**
- MinIO server (open-source S3-compatible object storage)
- Exposes S3-compatible REST API for file operations
- Web console on port 9001 for administration
- Default bucket: `onyx-file-store-bucket`
- Persistent storage mounted at `/data`
- Built-in health checks and monitoring

**Key operations:** PUT/GET/DELETE objects, bucket management, presigned URLs for secure access

## Load Balancing and Routing

### `nginx`
**Purpose**: Front-door web server that routes traffic to the right places

This is the only container directly accessible from the internet - everything else goes through nginx.

**What it does:**
- Routes `/api/*` requests to the API server backend
- Serves the React frontend application (static files)
- Handles SSL/TLS encryption for HTTPS
- Load balances traffic across multiple backend instances
- Blocks malicious requests and provides security headers

**Technical details:**
- nginx 1.23.4-alpine (high-performance web server)
- Configurable via templates for different environments
- Exposes ports 80 (HTTP) and 443 (HTTPS)
- Uses reverse proxy to hide internal container network
- Supports websockets for real-time features

**Key config files:** `app.conf.template`, SSL certificate management, upstream definitions

## Container Dependencies

The containers have a clear dependency hierarchy:
1. **Foundation**: `relational_db`, `cache`, `index`, `minio`
2. **AI Layer**: `inference_model_server`, `indexing_model_server`
3. **Application Layer**: `api_server`, `background`
4. **Frontend Layer**: `web_server`
5. **Gateway Layer**: `nginx`

## Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐     ┌─────────┐
│   Users     │────▶│  Web Server  │────▶│    API Server      │────▶│  Cache  │
└─────────────┘     └──────────────┘     └────────────────────┘     └─────────┘
                                                    │
                                                    ▼
                                         ┌────────────────────┐
                                         │  Background Jobs   │
                                         └────────────────────┘
                                                    │
                    ┌───────────────────────────────┴────────────────────────┐
                    │                                                        │
                    ▼                                                        ▼
         ┌──────────────────┐                                    ┌─────────────────┐
         │  Document Store  │                                    │  Relational DB  │
         │    (MinIO)       │                                    └─────────────────┘
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   Chunking &     │
         │   Processing     │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐     ┌─────────────────────┐
         │ Indexing Model   │────▶│   Vector Embeddings │
         │     Server       │     └─────────────────────┘
         └──────────────────┘                 │
                                             ▼
                                    ┌─────────────────┐
                                    │  Vespa Index    │
                                    │  (Storage &     │
                                    │   Search)       │
                                    └─────────────────┘
```

## Volume Management

- **Persistent Data**: Database, Vespa index, MinIO files
- **Model Caches**: Hugging Face models for faster startup
- **Logs**: Centralized logging for debugging and monitoring
- **Configuration**: SSL certificates and nginx configurations

## Why Both indexing_model_server and index (Vespa) Are Needed

The `indexing_model_server` and `index` containers serve completely different purposes:

1. **indexing_model_server**: A compute service that runs ML models to transform text into vectors
2. **index (Vespa)**: A storage and retrieval service that indexes and searches those vectors

Think of it like a factory:
- `indexing_model_server` is the manufacturing plant (creates embeddings)
- `index (Vespa)` is the warehouse (stores and retrieves embeddings)

You cannot store what you haven't created, and creating embeddings without storing them would be pointless.

This architecture provides a scalable, modular system where each container has a specific responsibility, enabling easier maintenance, scaling, and deployment flexibility.