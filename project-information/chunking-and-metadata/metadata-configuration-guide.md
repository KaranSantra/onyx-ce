# Metadata Configuration Guide for Onyx

## Overview

This guide covers all the environment variables, constants, and configuration parameters you can use to control how Onyx handles metadata during document ingestion, chunking, and search. These settings allow you to fine-tune metadata behavior for your specific use case.

## Core Metadata Configuration

### Primary Metadata Controls

**`SKIP_METADATA_IN_CHUNK`**
- **Type**: Environment Variable
- **Default**: `false`
- **Description**: Controls whether metadata is included in chunks during processing
- **Impact**: 
  - `true`: Metadata is NOT added to chunk content (faster processing, less context)
  - `false`: Metadata is included in chunks (better search context, slower processing)

```bash
# Disable metadata in chunks for faster processing
SKIP_METADATA_IN_CHUNK=true

# Enable metadata in chunks for better search quality (default)
SKIP_METADATA_IN_CHUNK=false
```

**`ONYX_METADATA_FILENAME`**
- **Type**: Constant
- **Value**: `".onyx_metadata.json"`
- **Description**: Filename that Onyx looks for when processing ZIP files with metadata
- **Usage**: Cannot be changed via environment variable

### Chunk Size and Content Limits

**`BLURB_SIZE`**
- **Type**: Constant
- **Value**: `128`
- **Description**: Number of encoder tokens included in the chunk blurb (summary)
- **Impact**: Affects how much context is preserved in chunk summaries

**`MINI_CHUNK_SIZE`**
- **Type**: Constant
- **Value**: `150`
- **Description**: Size of mini-chunks for multipass indexing
- **Impact**: Affects granularity of search results when multipass is enabled

**`MAX_METADATA_PERCENTAGE`**
- **Type**: Constant
- **Value**: `0.25` (25%)
- **Description**: Maximum percentage of chunk that can be metadata
- **Impact**: Prevents metadata from overwhelming actual content
- **Example**: For a 512-token chunk, max metadata is 128 tokens

**`CHUNK_MIN_CONTENT`**
- **Type**: Constant
- **Value**: `256`
- **Description**: Minimum content size required for chunks
- **Impact**: If metadata/title takes too much space, they get removed to ensure minimum content

## Advanced Metadata Features

### Contextual RAG Settings

**`ENABLE_CONTEXTUAL_RAG`**
- **Type**: Environment Variable
- **Default**: `false`
- **Description**: Enable contextual retrieval with document/chunk summaries
- **Impact**: Adds context to chunks, improving search quality but using more tokens

```bash
# Enable contextual RAG for better search context
ENABLE_CONTEXTUAL_RAG=true
```

**`USE_DOCUMENT_SUMMARY`**
- **Type**: Environment Variable
- **Default**: `true`
- **Description**: Include document summary in contextual RAG
- **Impact**: Adds document-level context to chunks

**`USE_CHUNK_SUMMARY`**
- **Type**: Environment Variable
- **Default**: `true`
- **Description**: Include chunk summary in contextual RAG
- **Impact**: Adds chunk-level context summaries

### Multipass Indexing

**`ENABLE_MULTIPASS_INDEXING`**
- **Type**: Environment Variable
- **Default**: `false`
- **Description**: Store additional mini-chunk vectors for more accurate results
- **Impact**: Better search accuracy but 4x more storage and slower indexing

```bash
# Enable multipass indexing for better accuracy
ENABLE_MULTIPASS_INDEXING=true
```

## Text Processing Configuration

### Separators and Formatting

**`RETURN_SEPARATOR`**
- **Type**: Constant
- **Value**: `"\n\r\n"`
- **Description**: Separator used between title/metadata and content
- **Impact**: How metadata is visually separated in chunks

**`SECTION_SEPARATOR`**
- **Type**: Constant
- **Value**: `"\n\n"`
- **Description**: Separator used between sections within chunks
- **Impact**: How content sections are combined

**`INDEX_SEPARATOR`**
- **Type**: Constant
- **Value**: `"==="`
- **Description**: Separator used for metadata_list format in Vespa
- **Impact**: How metadata key-value pairs are stored for filtering

**`IGNORE_FOR_QA`**
- **Type**: Constant
- **Value**: `"ignore_for_qa"`
- **Description**: Metadata key to exclude chunks from QA
- **Usage**: Add this key to metadata to exclude from search results

## Embedding and Model Configuration

### Document Embedding Settings

**`DOC_EMBEDDING_CONTEXT_SIZE`**
- **Type**: Constant
- **Value**: `512`
- **Description**: Token limit for document embeddings
- **Impact**: Maximum size of chunk + metadata that gets embedded

**`DOCUMENT_ENCODER_MODEL`**
- **Type**: Environment Variable
- **Default**: `"nomic-ai/nomic-embed-text-v1"`
- **Description**: Model used for generating embeddings
- **Impact**: Different models have different context sizes and capabilities

**`DOC_EMBEDDING_DIM`**
- **Type**: Environment Variable
- **Default**: `768`
- **Description**: Dimension of embedding vectors
- **Impact**: Storage size and potential search quality

**`NORMALIZE_EMBEDDINGS`**
- **Type**: Environment Variable
- **Default**: `true`
- **Description**: Whether to normalize embedding vectors
- **Impact**: Affects similarity calculations

```bash
# Use different embedding model
DOCUMENT_ENCODER_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Change embedding dimensions
DOC_EMBEDDING_DIM=384
```

## Performance and Processing Controls

### Indexing Performance

**`INDEX_BATCH_SIZE`**
- **Type**: Environment Variable
- **Default**: `16`
- **Description**: Number of documents processed in each batch
- **Impact**: Higher = faster but more memory usage

**`INDEXING_EMBEDDING_MODEL_NUM_THREADS`**
- **Type**: Environment Variable
- **Default**: `8`
- **Description**: Number of threads for parallel embedding generation
- **Impact**: Higher = faster processing but more CPU usage

**`INDEXING_EXCEPTION_LIMIT`**
- **Type**: Environment Variable
- **Default**: `0`
- **Description**: Number of failed batches before aborting indexing
- **Impact**: Higher = more fault tolerance but potential quality issues

```bash
# Optimize for faster indexing
INDEX_BATCH_SIZE=32
INDEXING_EMBEDDING_MODEL_NUM_THREADS=16
INDEXING_EXCEPTION_LIMIT=5
```

### Memory and Size Limits

**`MAX_DOCUMENT_CHARS`**
- **Type**: Environment Variable
- **Default**: `5,000,000`
- **Description**: Maximum document size in characters
- **Impact**: Documents exceeding this are truncated or rejected

**`MAX_FILE_SIZE_BYTES`**
- **Type**: Environment Variable
- **Default**: `2,147,483,648` (2GB)
- **Description**: Maximum file size in bytes
- **Impact**: Files exceeding this are rejected

**`INDEXING_SIZE_WARNING_THRESHOLD`**
- **Type**: Environment Variable
- **Default**: `104,857,600` (100MB)
- **Description**: Size threshold for warnings during indexing
- **Impact**: Logs warnings for large documents

```bash
# Increase size limits for large documents
MAX_DOCUMENT_CHARS=10000000
MAX_FILE_SIZE_BYTES=5368709120  # 5GB
```

## Search and Retrieval Configuration

### Chat and Context Settings

**`MAX_CHUNKS_FED_TO_CHAT`**
- **Type**: Environment Variable
- **Default**: `10.0`
- **Description**: Maximum number of chunks sent to chat
- **Impact**: Higher = more context but slower responses

**`CONTEXT_CHUNKS_ABOVE`**
- **Type**: Environment Variable
- **Default**: `1`
- **Description**: Number of chunks above the best match to include
- **Impact**: Provides more context around relevant chunks

**`CONTEXT_CHUNKS_BELOW`**
- **Type**: Environment Variable
- **Default**: `1`
- **Description**: Number of chunks below the best match to include
- **Impact**: Provides more context around relevant chunks

```bash
# Increase context for better chat responses
MAX_CHUNKS_FED_TO_CHAT=20
CONTEXT_CHUNKS_ABOVE=2
CONTEXT_CHUNKS_BELOW=2
```

## Strict Token Limits

**`STRICT_CHUNK_TOKEN_LIMIT`**
- **Type**: Environment Variable
- **Default**: `false`
- **Description**: Strictly enforce token limits for chunking
- **Impact**: 
  - `true`: Hard cutoff at token limit (may cut sentences)
  - `false`: Soft limit allowing sentence completion

```bash
# Enable strict token limits
STRICT_CHUNK_TOKEN_LIMIT=true
```

## Connector-Specific Metadata Settings

### File Size Thresholds

**`CONFLUENCE_CONNECTOR_ATTACHMENT_SIZE_THRESHOLD`**
- **Type**: Environment Variable
- **Default**: `10,485,760` (10MB)
- **Description**: Maximum size for Confluence attachments
- **Impact**: Larger attachments are skipped

**`GOOGLE_DRIVE_CONNECTOR_SIZE_THRESHOLD`**
- **Type**: Environment Variable
- **Default**: `10,485,760` (10MB)
- **Description**: Maximum size for Google Drive files
- **Impact**: Larger files are skipped

**`JIRA_CONNECTOR_MAX_TICKET_SIZE`**
- **Type**: Environment Variable
- **Default**: `102,400` (100KB)
- **Description**: Maximum size for Jira tickets
- **Impact**: Larger tickets are truncated

```bash
# Increase connector size limits
CONFLUENCE_CONNECTOR_ATTACHMENT_SIZE_THRESHOLD=20971520  # 20MB
GOOGLE_DRIVE_CONNECTOR_SIZE_THRESHOLD=20971520           # 20MB
JIRA_CONNECTOR_MAX_TICKET_SIZE=204800                    # 200KB
```

## Common Configuration Scenarios

### Scenario 1: Maximum Search Quality

```bash
# Enable all quality features
SKIP_METADATA_IN_CHUNK=false
ENABLE_CONTEXTUAL_RAG=true
ENABLE_MULTIPASS_INDEXING=true
USE_DOCUMENT_SUMMARY=true
USE_CHUNK_SUMMARY=true
MAX_CHUNKS_FED_TO_CHAT=20
CONTEXT_CHUNKS_ABOVE=2
CONTEXT_CHUNKS_BELOW=2
STRICT_CHUNK_TOKEN_LIMIT=false
```

**Trade-offs**: 
- ✅ Best search quality and context
- ❌ Slower indexing and search
- ❌ Higher storage requirements

### Scenario 2: Maximum Performance

```bash
# Optimize for speed
SKIP_METADATA_IN_CHUNK=true
ENABLE_CONTEXTUAL_RAG=false
ENABLE_MULTIPASS_INDEXING=false
INDEX_BATCH_SIZE=32
INDEXING_EMBEDDING_MODEL_NUM_THREADS=16
MAX_CHUNKS_FED_TO_CHAT=5
STRICT_CHUNK_TOKEN_LIMIT=true
```

**Trade-offs**:
- ✅ Fastest indexing and search
- ✅ Lower storage requirements
- ❌ Reduced search quality
- ❌ Less context in results

### Scenario 3: Balanced Configuration

```bash
# Balance between quality and performance
SKIP_METADATA_IN_CHUNK=false
ENABLE_CONTEXTUAL_RAG=false
ENABLE_MULTIPASS_INDEXING=false
INDEX_BATCH_SIZE=16
MAX_CHUNKS_FED_TO_CHAT=10
CONTEXT_CHUNKS_ABOVE=1
CONTEXT_CHUNKS_BELOW=1
STRICT_CHUNK_TOKEN_LIMIT=false
```

**Trade-offs**:
- ✅ Good search quality
- ✅ Reasonable performance
- ✅ Moderate storage requirements

### Scenario 4: Large Document Processing

```bash
# Handle large documents efficiently
MAX_DOCUMENT_CHARS=20000000
MAX_FILE_SIZE_BYTES=10737418240  # 10GB
INDEXING_SIZE_WARNING_THRESHOLD=209715200  # 200MB
INDEX_BATCH_SIZE=8  # Smaller batches for large docs
DOC_EMBEDDING_CONTEXT_SIZE=1024  # Larger context
```

**Trade-offs**:
- ✅ Can handle very large documents
- ✅ More content per chunk
- ❌ Higher memory usage
- ❌ Slower processing

## Monitoring and Debugging

### Indexing Monitoring

**`INDEXING_TRACER_INTERVAL`**
- **Type**: Environment Variable
- **Default**: `0` (disabled)
- **Description**: Log memory stats every N batches
- **Usage**: Set to positive number to enable memory monitoring

```bash
# Enable memory monitoring every 10 batches
INDEXING_TRACER_INTERVAL=10
```

### Information Content Classification

**`USE_INFORMATION_CONTENT_CLASSIFICATION`**
- **Type**: Environment Variable
- **Default**: `false`
- **Description**: Use ML model to evaluate chunk quality
- **Impact**: Lowers scores for low-quality chunks

```bash
# Enable information content classification
USE_INFORMATION_CONTENT_CLASSIFICATION=true
```

## Best Practices

### For Production Environments

1. **Start with balanced configuration**
2. **Monitor performance and adjust gradually**
3. **Test metadata inclusion impact on your specific content**
4. **Use contextual RAG for knowledge-intensive applications**
5. **Enable multipass indexing for critical search accuracy**

### For Development/Testing

1. **Use performance-optimized settings**
2. **Disable metadata initially to speed up testing**
3. **Use smaller batch sizes for easier debugging**
4. **Enable detailed logging and monitoring**

### For Large-Scale Deployments

1. **Optimize batch sizes based on available memory**
2. **Use multiple threads for embedding generation**
3. **Monitor storage usage with multipass indexing**
4. **Set appropriate size limits for your content**

## Configuration File Template

Create a `.env` file with your desired settings:

```bash
# Core metadata settings
SKIP_METADATA_IN_CHUNK=false
ENABLE_CONTEXTUAL_RAG=true
ENABLE_MULTIPASS_INDEXING=false

# Performance settings
INDEX_BATCH_SIZE=16
INDEXING_EMBEDDING_MODEL_NUM_THREADS=8

# Size limits
MAX_DOCUMENT_CHARS=5000000
MAX_FILE_SIZE_BYTES=2147483648

# Search settings
MAX_CHUNKS_FED_TO_CHAT=10
CONTEXT_CHUNKS_ABOVE=1
CONTEXT_CHUNKS_BELOW=1

# Model settings
DOC_EMBEDDING_CONTEXT_SIZE=512
DOCUMENT_ENCODER_MODEL=nomic-ai/nomic-embed-text-v1
DOC_EMBEDDING_DIM=768
NORMALIZE_EMBEDDINGS=true

# Token limits
STRICT_CHUNK_TOKEN_LIMIT=false
```

This comprehensive configuration guide gives you full control over how Onyx handles metadata, from basic inclusion/exclusion to advanced contextual processing and performance optimization.