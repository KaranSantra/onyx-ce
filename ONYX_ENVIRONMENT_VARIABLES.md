# 🔧 Onyx Environment Variables Configuration Guide

> **Complete reference for configuring Onyx's RAG system through environment variables**

This document provides a comprehensive list of environment variables that can be configured to customize Onyx's RAG (Retrieval-Augmented Generation) system to meet your specific project requirements.

## 📋 Table of Contents

| Section | Description | Key Variables |
|---------|-------------|---------------|
| [🤖 Embedding & Models](#-embedding-and-model-configuration) | Embedding models and encoding settings | `DOCUMENT_ENCODER_MODEL`, `EMBEDDING_BATCH_SIZE` |
| [📄 Document Processing](#-document-processing-and-chunking) | Chunking and document preparation | `CHUNK_SIZE`, `CHUNK_OVERLAP` |
| [🔍 Search & Retrieval](#-search-and-retrieval) | Search behavior and result ranking | `HYBRID_SEARCH_ALPHA`, `NUM_RETURNED_HITS` |
| [⚙️ Indexing & Processing](#️-indexing-and-background-processing) | Background processing and workers | `NUM_INDEXING_WORKERS`, `DASK_JOB_CLIENT_ENABLED` |
| [🚀 Advanced RAG](#-advanced-rag-features) | Contextual RAG and AI features | `ENABLE_CONTEXTUAL_RAG`, `ENABLE_RERANKING_REAL_TIME_FLOW` |
| [⚡ Performance](#-performance-and-optimization) | Timeouts and optimization | `VESPA_TIMEOUT`, `INDEXING_THREADS` |
| [💾 Database & Storage](#-database-and-storage) | Database connections and storage | `POSTGRES_HOST`, `VESPA_HOST` |
| [🤖 Agent & Tools](#-agent-and-tool-configuration) | Agent-based features | `AGENTIC_ENABLED`, `TOOL_SEARCH_ENABLED` |
| [📊 System & Monitoring](#-system-and-monitoring) | Logging and system settings | `LOG_LEVEL`, `DISABLE_TELEMETRY` |

---

## 🤖 Embedding and Model Configuration

> **Core settings for document and query embedding models**

### 📦 `DOCUMENT_ENCODER_MODEL`
| Property | Value |
|----------|-------|
| **Default** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Type** | String |
| **Description** | The embedding model used to encode documents and queries for semantic search |
| **Impact** | 🔄 Different models have varying performance characteristics, language support, and computational requirements. Larger models typically provide better semantic understanding but require more resources |

### ⚙️ `NORMALIZE_EMBEDDINGS`
| Property | Value |
|----------|-------|
| **Default** | `true` |
| **Type** | Boolean |
| **Description** | Whether to normalize embedding vectors to unit length |
| **Impact** | ✅ Normalization can improve search consistency and performance with certain distance metrics. Disabling may be needed for specific embedding models or use cases |

### 🏷️ `ASYM_QUERY_PREFIX`
| Property | Value |
|----------|-------|
| **Default** | `"query: "` |
| **Type** | String |
| **Description** | Prefix added to queries when using asymmetric embedding models |
| **Impact** | ⚠️ Some embedding models are trained with specific prefixes to distinguish between queries and documents. Incorrect prefixes can significantly degrade search quality |

### 📄 `ASYM_PASSAGE_PREFIX`
| Property | Value |
|----------|-------|
| **Default** | `"passage: "` |
| **Type** | String |
| **Description** | Prefix added to document passages when using asymmetric embedding models |
| **Impact** | ⚠️ Must match the training format of your embedding model for optimal performance |

### 📊 `EMBEDDING_BATCH_SIZE`
| Property | Value |
|----------|-------|
| **Default** | `32` |
| **Type** | Integer |
| **Description** | Number of documents processed in each embedding batch |
| **Impact** | ⚖️ Higher values improve throughput but increase memory usage. Lower values reduce memory pressure but may slow processing |

### 🌐 `EMBEDDING_MODEL_SERVER_HOST`
| Property | Value |
|----------|-------|
| **Default** | `None` |
| **Type** | String (URL) |
| **Description** | Host for external embedding model server |
| **Impact** | 🚀 Allows offloading embedding computation to dedicated servers for better scalability and resource management |

---

## 📄 Document Processing and Chunking

> **Settings for how documents are split and prepared for indexing**

### 📏 `CHUNK_SIZE`
| Property | Value |
|----------|-------|
| **Default** | `512` |
| **Type** | Integer (tokens) |
| **Description** | Target size for document chunks in tokens |
| **Impact** | ⚖️ Smaller chunks provide more precise retrieval but may lose context. Larger chunks retain more context but may dilute relevant information |
| **Recommended Range** | `256-1024` |

### 🔗 `CHUNK_OVERLAP`
| Property | Value |
|----------|-------|
| **Default** | `0` |
| **Type** | Integer (tokens) |
| **Description** | Number of tokens to overlap between adjacent chunks |
| **Impact** | 🔄 Overlap helps preserve context across chunk boundaries but increases storage requirements and processing time |
| **Recommended Range** | `0-128` |

### 🔍 `MINI_CHUNK_SIZE`
| Property | Value |
|----------|-------|
| **Default** | `150` |
| **Type** | Integer (tokens) |
| **Description** | Size of mini-chunks used for fine-grained retrieval |
| **Impact** | 🎯 Smaller mini-chunks enable more precise information extraction but require more processing overhead |

### 📐 `DOC_EMBEDDING_CONTEXT_SIZE`
| Property | Value |
|----------|-------|
| **Default** | `512` |
| **Type** | Integer (tokens) |
| **Description** | Context window size used when embedding documents |
| **Impact** | ⚠️ Must not exceed your embedding model's maximum context length. Larger contexts provide better semantic understanding |

### 🏆 `NUM_RERANK_CHUNKS`
| Property | Value |
|----------|-------|
| **Default** | `15` |
| **Type** | Integer |
| **Description** | Number of chunks to rerank after initial retrieval |
| **Impact** | ⚖️ More chunks improve recall but increase computational cost. Fewer chunks may miss relevant information |

### 🔄 `ENABLE_MULTIPASS_INDEXING`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable multi-pass indexing for better chunk relationships |
| **Impact** | 🚀 Improves search quality by understanding document structure but significantly increases indexing time |

---

## 🔍 Search and Retrieval

> **Controls for search behavior, ranking, and result quality**

### 🏆 `NUM_RETURNED_HITS`
| Property | Value |
|----------|-------|
| **Default** | `50` |
| **Type** | Integer |
| **Description** | Maximum number of search results returned from initial retrieval |
| **Impact** | ⚖️ Higher values improve recall but increase processing time and may introduce noise |
| **Recommended Range** | `10-200` |

### 🎯 `SEARCH_DISTANCE_CUTOFF`
| Property | Value |
|----------|-------|
| **Default** | `null` |
| **Type** | Float (0.0-1.0) |
| **Description** | Minimum similarity threshold for search results |
| **Impact** | ⚖️ Higher thresholds filter out low-quality matches but may reduce recall. Lower thresholds include more results but may add noise |

### ⚖️ `HYBRID_SEARCH_ALPHA`
| Property | Value |
|----------|-------|
| **Default** | `0.6` |
| **Type** | Float (0.0-1.0) |
| **Description** | Weighting factor for semantic vs keyword search (0=keyword only, 1=semantic only) |
| **Impact** | 🎯 Values closer to 1 favor semantic similarity, closer to 0 favor exact keyword matches. Optimal value depends on your content and use cases |
| **Tuning Guide** | `0.0-0.3`: Keyword-focused, `0.4-0.7`: Balanced, `0.8-1.0`: Semantic-focused |

### ⚡ `ENABLE_RERANKING_REAL_TIME_FLOW`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable real-time reranking of search results |
| **Impact** | 🚀 Improves result quality but adds latency. Consider for accuracy-critical applications |

### 🌍 `MULTILINGUAL_QUERY_EXPANSION`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Expand queries across multiple languages |
| **Impact** | ⚖️ Improves search in multilingual documents but may introduce irrelevant results |

### 📝 `QUERY_MAX_WORDS`
| Property | Value |
|----------|-------|
| **Default** | `100` |
| **Type** | Integer |
| **Description** | Maximum number of words allowed in search queries |
| **Impact** | ⚠️ Longer queries may be more specific but can overwhelm the search system |

---

## ⚙️ Indexing and Background Processing

> **Configuration for document indexing and background job processing**

### 👥 `NUM_INDEXING_WORKERS`
| Property | Value |
|----------|-------|
| **Default** | `1` |
| **Type** | Integer |
| **Description** | Number of parallel workers for document indexing |
| **Impact** | ⚖️ More workers speed up indexing but consume more CPU and memory. Set based on your hardware capabilities |
| **Recommended Range** | `1-8` (based on CPU cores) |

### 🌐 `DASK_JOB_CLIENT_ENABLED`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable Dask for distributed processing |
| **Impact** | 🚀 Enables horizontal scaling for large document processing but adds complexity |

### 🖥️ `INDEXING_MODEL_SERVER_HOST`
| Property | Value |
|----------|-------|
| **Default** | `None` |
| **Type** | String (URL) |
| **Description** | Host for dedicated indexing model server |
| **Impact** | 📊 Offloads indexing computation for better resource management in high-volume scenarios |

### 📋 `BATCH_SIZE_ENCODE_CHUNKS`
| Property | Value |
|----------|-------|
| **Default** | `8` |
| **Type** | Integer |
| **Description** | Batch size for encoding document chunks during indexing |
| **Impact** | ⚖️ Larger batches improve GPU utilization but require more memory |

### 🚫 `DISABLE_GENERATIVE_AI`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Disable AI-powered features during indexing |
| **Impact** | ⚡ Reduces resource usage but may limit advanced features like content classification |

---

## 🚀 Advanced RAG Features

> **Cutting-edge AI features for enhanced document understanding and retrieval**

### 🧠 `ENABLE_CONTEXTUAL_RAG`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable contextual RAG for better document understanding |
| **Impact** | 🚀 Significantly improves search quality by maintaining document context but increases computational requirements |
| **Resource Impact** | 🔴 High - Requires substantial additional processing |

### 📝 `CONTEXTUAL_RAG_PROMPT`
| Property | Value |
|----------|-------|
| **Default** | Detailed context extraction prompt |
| **Type** | String (Multi-line) |
| **Description** | Prompt template for contextual RAG processing |
| **Impact** | 🎯 Customize to improve context extraction for your specific domain or document types |

### 🏷️ `ENABLE_INFORMATION_CONTENT_CLASSIFICATION`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable automatic classification of information content |
| **Impact** | 🔍 Improves search precision by understanding content types but adds processing overhead |

### 📊 `ENABLE_LARGE_CHUNK_SEARCH`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable search over larger document chunks |
| **Impact** | ⚖️ Provides more context but may reduce precision. Useful for documents requiring broader context understanding |

### 🔄 `AUTO_DETECT_DANSWER_DOCS`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Automatically detect and process Danswer-format documents |
| **Impact** | 🔗 Enables compatibility with Danswer document formats but may affect processing of other document types |

---

## ⚡ Performance and Optimization

> **Settings to optimize system performance and resource usage**

### ⏱️ `VESPA_TIMEOUT`
| Property | Value |
|----------|-------|
| **Default** | `120` |
| **Type** | Integer (seconds) |
| **Description** | Timeout in seconds for Vespa search operations |
| **Impact** | ⚖️ Higher values accommodate slower searches but may lead to user experience issues. Lower values improve responsiveness but may timeout complex queries |
| **Recommended Range** | `30-300` |

### 🚀 `VESPA_STARTUP_TIMEOUT`
| Property | Value |
|----------|-------|
| **Default** | `120` |
| **Type** | Integer (seconds) |
| **Description** | Timeout for Vespa service startup |
| **Impact** | ⚠️ Increase if Vespa takes longer to start in your environment |

### 🧵 `INDEXING_THREADS`
| Property | Value |
|----------|-------|
| **Default** | `1` |
| **Type** | Integer |
| **Description** | Number of threads used for indexing operations |
| **Impact** | ⚖️ More threads can speed up indexing but may overwhelm the system if set too high |
| **Recommended Range** | `1-4` |

### 💾 `POSTGRES_COMMIT_FREQUENCY`
| Property | Value |
|----------|-------|
| **Default** | `1000` |
| **Type** | Integer |
| **Description** | Frequency of database commits during bulk operations |
| **Impact** | ⚖️ Higher values improve performance but increase memory usage and potential data loss on failure |

### 🚫 `DISABLE_LLM_CHUNK_FILTER`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Disable LLM-based chunk filtering |
| **Impact** | ⚡ Reduces processing time but may include lower-quality chunks in search results |

---

## 💾 Database and Storage

> **Database connections and storage configuration**

### 🐘 PostgreSQL Configuration

#### 🏠 `POSTGRES_HOST`
| Property | Value |
|----------|-------|
| **Default** | `localhost` |
| **Type** | String (hostname/IP) |
| **Description** | PostgreSQL database host |
| **Impact** | 🎯 Point to your database server. Critical for data persistence and multi-instance deployments |

#### 🔌 `POSTGRES_PORT`
| Property | Value |
|----------|-------|
| **Default** | `5432` |
| **Type** | Integer |
| **Description** | PostgreSQL database port |
| **Impact** | ⚠️ Must match your database configuration |

#### 📊 `POSTGRES_DB`
| Property | Value |
|----------|-------|
| **Default** | `onyx` |
| **Type** | String |
| **Description** | PostgreSQL database name |
| **Impact** | 🏷️ Allows separation of different Onyx instances or environments |

#### 👤 `POSTGRES_USER`
| Property | Value |
|----------|-------|
| **Default** | `postgres` |
| **Type** | String |
| **Description** | PostgreSQL username |
| **Impact** | 🔒 Should use dedicated user with appropriate permissions for security |

#### 🔐 `POSTGRES_PASSWORD`
| Property | Value |
|----------|-------|
| **Default** | `None` (Required) |
| **Type** | String |
| **Description** | PostgreSQL password |
| **Impact** | 🔴 Critical for database security. Use strong passwords and secure storage |

### 🔍 Vespa Search Engine

#### 🏠 `VESPA_HOST`
| Property | Value |
|----------|-------|
| **Default** | `localhost` |
| **Type** | String (hostname/IP) |
| **Description** | Vespa search engine host |
| **Impact** | 🎯 Point to your Vespa instance. Critical for search functionality |

#### 🔌 `VESPA_PORT`
| Property | Value |
|----------|-------|
| **Default** | `8081` |
| **Type** | Integer |
| **Description** | Vespa search engine port |
| **Impact** | ⚠️ Must match your Vespa configuration |

---

## 🤖 Agent and Tool Configuration

> **Advanced AI agent features for sophisticated query processing**

### 🧠 `AGENTIC_ENABLED`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable agent-based search and reasoning |
| **Impact** | 🚀 Provides more sophisticated query understanding and multi-step reasoning but requires additional computational resources |
| **Resource Impact** | 🔴 High |

### 🔧 `TOOL_SEARCH_ENABLED`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable tool-based search capabilities |
| **Impact** | ⚙️ Allows agents to use specialized search tools but adds complexity to the system |

### 🧘 `ENABLE_REFLEXION_AGENT`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable reflexion-based agent reasoning |
| **Impact** | 🧠 Improves agent decision-making through self-reflection but increases processing time |

### 🔄 `AGENT_SEARCH_MAX_ITERATIONS`
| Property | Value |
|----------|-------|
| **Default** | `5` |
| **Type** | Integer |
| **Description** | Maximum iterations for agent search processes |
| **Impact** | ⚖️ Higher values allow more thorough search but may increase response time significantly |
| **Recommended Range** | `3-10` |

---

## 📊 System and Monitoring

> **System-wide configuration and monitoring settings**

### 📝 `LOG_LEVEL`
| Property | Value |
|----------|-------|
| **Default** | `INFO` |
| **Type** | String |
| **Options** | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| **Description** | Logging verbosity level |
| **Impact** | ⚖️ DEBUG provides detailed troubleshooting information but may impact performance. ERROR reduces logs but may hide important issues |

### 🌐 `WEB_DOMAIN`
| Property | Value |
|----------|-------|
| **Default** | `None` (Required for web deployment) |
| **Type** | String (domain name) |
| **Description** | Domain name for the web interface |
| **Impact** | ⚠️ Required for proper URL generation and CORS configuration |

### 📊 `DISABLE_TELEMETRY`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Disable telemetry data collection |
| **Impact** | ⚖️ Improves privacy but reduces ability to monitor system health and usage patterns |

### 🔬 `ENABLE_EXPENSIVE_EXPERT_CALLS`
| Property | Value |
|----------|-------|
| **Default** | `false` |
| **Type** | Boolean |
| **Description** | Enable computationally expensive expert system calls |
| **Impact** | 🔴 Provides more sophisticated analysis but significantly increases resource usage |
| **Resource Impact** | Very High |

### 🔒 `MODEL_SERVER_ALLOWED_HOST`
| Property | Value |
|----------|-------|
| **Default** | `None` |
| **Type** | String (hostname/IP) |
| **Description** | Allowed hosts for model server connections |
| **Impact** | 🔒 Security feature to restrict model server access to authorized hosts only |

---

## 🎯 Usage Recommendations

> **Deployment-specific configuration guides**

### 🏠 Small-Scale Deployments
| Setting | Recommendation | Value |
|---------|----------------|-------|
| 📊 **General** | Keep default values for most settings | - |
| 👥 **Workers** | Reduce if CPU-limited | `NUM_INDEXING_WORKERS=1` |
| 📏 **Chunking** | Smaller chunks for precision | `CHUNK_SIZE=256-384` |
| ⚡ **Performance** | Disable heavy features | `ENABLE_CONTEXTUAL_RAG=false` |

### 🏭 Large-Scale Deployments
| Setting | Recommendation | Value |
|---------|----------------|-------|
| 👥 **Workers** | Scale based on CPU cores | `NUM_INDEXING_WORKERS=4-8` |
| 🌐 **Distribution** | Use external servers | `EMBEDDING_MODEL_SERVER_HOST=<dedicated-server>` |
| 📊 **Processing** | Enable distributed processing | `DASK_JOB_CLIENT_ENABLED=true` |
| 📋 **Batching** | Increase for throughput | `EMBEDDING_BATCH_SIZE=64-128` |

### 🏆 High-Quality Retrieval
| Setting | Recommendation | Value |
|---------|----------------|-------|
| 🧠 **Context** | Enable contextual understanding | `ENABLE_CONTEXTUAL_RAG=true` |
| 🏆 **Reranking** | Real-time result improvement | `ENABLE_RERANKING_REAL_TIME_FLOW=true` |
| 📋 **Recall** | More chunks for better coverage | `NUM_RERANK_CHUNKS=25-50` |
| ⚖️ **Balance** | Tune based on content type | `HYBRID_SEARCH_ALPHA=0.7` (semantic-focused) |

### ⚡ Performance Optimization
| Setting | Recommendation | Value |
|---------|----------------|-------|
| 🏷️ **Classification** | Disable if not needed | `ENABLE_INFORMATION_CONTENT_CLASSIFICATION=false` |
| 🚫 **Filtering** | Skip LLM filtering for speed | `DISABLE_LLM_CHUNK_FILTER=true` |
| 💾 **Database** | Batch commits | `POSTGRES_COMMIT_FREQUENCY=5000` |
| ⏱️ **Timeouts** | Optimize for query complexity | `VESPA_TIMEOUT=60-180` |

---

## 🔒 Security Considerations

> **Critical security settings and best practices**

### 🔴 Critical Security Variables
| Variable | Security Level | Recommendation |
|----------|----------------|----------------|
| `POSTGRES_PASSWORD` | 🔴 **Critical** | Use strong, unique passwords. Store in secure secret management |
| `MODEL_SERVER_ALLOWED_HOST` | 🟡 **High** | Restrict to specific trusted hosts only |
| Database connection params | 🟡 **High** | Use dedicated database users with minimal required permissions |

### 🌐 Network Security
| Variable | Consideration | Best Practice |
|----------|---------------|---------------|
| `EMBEDDING_MODEL_SERVER_HOST` | External service access | Use HTTPS and validate certificates |
| `VESPA_HOST` | Search engine access | Restrict network access to authorized clients |
| `POSTGRES_HOST` | Database access | Use private networks and firewall rules |
| `WEB_DOMAIN` | Web interface | Configure proper CORS and SSL/TLS |

### 🔐 Additional Security Notes
- 🚫 Never commit secrets to version control
- 🔄 Rotate passwords and API keys regularly
- 📋 Monitor access logs for suspicious activity
- 🌐 Use environment-specific configurations

---

## 📚 Quick Reference

> **Essential variables for common scenarios**

### 🚀 Getting Started (Minimal Setup)
```bash
# Core configuration
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=your-secure-password
VESPA_HOST=localhost

# Basic performance
CHUNK_SIZE=512
EMBEDDING_BATCH_SIZE=32
NUM_INDEXING_WORKERS=1
```

### 🏆 Production Setup (High Performance)
```bash
# Optimized performance
NUM_INDEXING_WORKERS=4
EMBEDDING_BATCH_SIZE=64
ENABLE_CONTEXTUAL_RAG=true
ENABLE_RERANKING_REAL_TIME_FLOW=true

# Advanced features
HYBRID_SEARCH_ALPHA=0.7
NUM_RERANK_CHUNKS=25
```

---

*📄 This document covers the major environment variables available in Onyx. For the most current and complete list, refer to the source code and configuration files in your Onyx installation.*

*🔄 Last updated: [Current Date] | 💬 For questions or contributions, please refer to the Onyx documentation.*