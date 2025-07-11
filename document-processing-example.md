# Document Processing Example: A Complete Walkthrough

This document provides a comprehensive example of how a document flows through Onyx's processing pipeline, from upload to searchable content.

## Example: Processing a Python Tutorial PDF

Let's follow "python_basics.pdf" (50 pages, 2.5MB) through the entire system.

### Step 1: Document Upload (Web Server → API Server)

**Time: 0.00s - 0.15s**

When a user uploads the PDF through the web interface:

```
Web Browser → nginx (port 80/443) → web_server (port 3000) → api_server (port 8080)
```

The API server:
1. Validates the file (checks size, type, permissions)
2. Stores the PDF in MinIO object storage
3. Creates a database record in PostgreSQL
4. Triggers a background indexing job

**Data at this stage:**
```json
{
  "document_id": "doc_abc123",
  "filename": "python_basics.pdf",
  "source": "file_upload",
  "size_bytes": 2621440,
  "status": "pending_index",
  "connector_id": 1,
  "credential_id": 1
}
```

### Step 2: Document Processing (Background Container)

**Time: 0.15s - 2.00s**

The `background` container picks up the indexing job from the queue:

1. **Fetches document from MinIO** (0.05s)
2. **Extracts text from PDF** (1.2s)
   - Uses PDF parsing libraries
   - Preserves formatting and structure
   - Extracts metadata (title, author, creation date)

**Extracted content example:**
```python
{
  "sections": [
    {
      "text": "Chapter 1: Introduction to Python\n\nPython is a high-level programming language...",
      "page": 1,
      "link": "python_basics.pdf#page=1"
    },
    {
      "text": "Chapter 2: Variables and Data Types\n\nIn Python, variables are created when...",
      "page": 5,
      "link": "python_basics.pdf#page=5"
    }
    # ... 48 more sections
  ],
  "metadata": {
    "title": "Python Basics Tutorial",
    "author": "Jane Developer",
    "total_pages": 50,
    "word_count": 15000
  }
}
```

### Step 3: Chunking (Background Container)

**Time: 2.00s - 2.50s**

The document is split into smaller, overlapping chunks for better search results:

```python
# Chunking parameters
CHUNK_SIZE = 512 tokens (~2000 characters)
CHUNK_OVERLAP = 128 tokens (~500 characters)

# Result: 50-page PDF → 95 chunks
```

**Example chunk:**
```json
{
  "chunk_id": 1,
  "content": "Chapter 1: Introduction to Python\n\nPython is a high-level programming language known for its simplicity and readability. Created by Guido van Rossum in 1991, Python has become one of the most popular programming languages in the world. This tutorial will guide you through the basics of Python programming, from installation to writing your first programs.",
  "source_document_id": "doc_abc123",
  "chunk_context": "Previous: Table of Contents | Next: Installing Python",
  "metadata_suffix": "Page 1 of Python Basics Tutorial by Jane Developer"
}
```

### Step 4: Embedding Generation (Indexing Model Server)

**Time: 2.50s - 8.00s**

Each chunk is sent to the `indexing_model_server` for embedding generation:

1. **Text preprocessing** (0.1s per chunk)
   - Tokenization
   - Special token addition
   - Truncation if needed

2. **Model inference** (0.05s per chunk)
   - Uses transformer model (e.g., all-MiniLM-L6-v2)
   - Generates 384-dimensional vector per chunk

**Process:**
```python
# For each chunk:
chunk_text = "Chapter 1: Introduction to Python..."
tokens = tokenizer.encode(chunk_text)  # [101, 2058, 1015, 1024, ...]
embedding = model.encode(tokens)  # [0.023, -0.145, 0.892, ...] (384 dimensions)
```

**Result for 95 chunks:**
- 95 embedding vectors
- Each vector: 384 floating-point numbers
- Total embedding data: ~146KB

### Step 5: Storage in Vespa (Index Container)

**Time: 8.00s - 9.50s**

The embeddings and metadata are stored in Vespa:

```json
{
  "document_id": "doc_abc123",
  "chunks": [
    {
      "chunk_id": "chunk_1",
      "content": "Chapter 1: Introduction to Python...",
      "embedding": [0.023, -0.145, 0.892, ...],
      "metadata": {
        "page": 1,
        "boost": 1.0,
        "access_control": ["public"],
        "document_sets": ["tutorials", "python"]
      }
    }
    // ... 94 more chunks
  ]
}
```

**Vespa operations:**
1. Creates inverted index for keyword search (BM25)
2. Builds HNSW index for vector similarity search
3. Stores document metadata and access controls

### Step 6: Search Query Processing

**Time: Query takes 50-200ms**

When a user searches for "python variables":

1. **Query Processing (API Server)** - 10ms
   - Parse query
   - Check user permissions
   - Route to search service

2. **Embedding Generation (Inference Model Server)** - 40ms
   - Convert query to embedding vector
   - Same model as indexing, but optimized for speed

3. **Search Execution (Vespa)** - 80ms
   - Keyword search: Find chunks containing "python" AND "variables"
   - Vector search: Find chunks with similar embeddings
   - Hybrid ranking: Combine both scores

4. **Result Processing (API Server)** - 20ms
   - Filter by permissions
   - Format results
   - Add highlighting

**Search result:**
```json
{
  "results": [
    {
      "chunk_id": "chunk_12",
      "content": "Chapter 2: Variables and Data Types\n\nIn Python, variables are created when you assign a value to them...",
      "score": 0.95,
      "highlights": ["Python", "variables"],
      "source_link": "python_basics.pdf#page=5"
    }
  ],
  "total_results": 15,
  "query_time_ms": 150
}
```

## Performance Insights

### Processing Times by Document Type
- **PDF (50 pages)**: 8-10 seconds
- **Word Doc (30 pages)**: 6-8 seconds
- **Markdown (100KB)**: 2-3 seconds
- **Web page**: 1-2 seconds

### Bottlenecks and Optimizations

1. **Embedding Generation** (60% of time)
   - Solution: Batch processing (25 chunks at once)
   - GPU acceleration reduces time by 5x

2. **PDF Parsing** (20% of time)
   - Solution: Cached extraction for unchanged documents
   - Parallel processing for multi-file uploads

3. **Vespa Indexing** (15% of time)
   - Solution: Bulk insertion API
   - Async processing for large batches

## Container Resource Usage

During our example PDF processing:

- **background**: 500MB RAM, 1 CPU core at 40%
- **indexing_model_server**: 2GB RAM, 1 CPU core at 80%
- **vespa**: 1GB RAM, 0.5 CPU cores at 20%
- **postgresql**: 200MB RAM for this operation
- **minio**: 100MB RAM for file storage

## Common Issues and Solutions

### Issue 1: Embedding Generation Timeout
**Symptom**: Large documents fail after 30 seconds
**Solution**: Increase chunk batch size or add more model server replicas

### Issue 2: Out of Memory on Model Server
**Symptom**: Container restarts during processing
**Solution**: Reduce batch size or increase container memory limit

### Issue 3: Slow Search Performance
**Symptom**: Searches take >1 second
**Solution**: Verify Vespa indices are built, check heap size configuration

## Debugging Tips

1. **Check logs in order**:
   ```bash
   # 1. API server (initial request)
   docker logs onyx-api-server | grep doc_abc123
   
   # 2. Background (processing)
   docker logs onyx-background | grep doc_abc123
   
   # 3. Model server (embeddings)
   docker logs onyx-indexing-model-server | grep embedding
   
   # 4. Vespa (storage)
   docker logs onyx-index | grep doc_abc123
   ```

2. **Monitor processing progress**:
   - Check PostgreSQL: `index_attempt` table
   - Redis keys: `onyx:tenant_id:cc_pair:*`
   - Vespa document count: `http://localhost:8081/search/?query=*`

3. **Performance profiling**:
   - Enable debug logging: `LOG_LEVEL=debug`
   - Check model server GPU usage: `nvidia-smi`
   - Monitor Vespa metrics: `http://localhost:19071/metrics`

This example demonstrates how Onyx transforms a simple PDF upload into searchable, permission-controlled content through its sophisticated multi-container architecture.