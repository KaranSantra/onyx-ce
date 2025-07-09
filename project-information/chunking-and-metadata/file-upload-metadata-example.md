# File Upload with Metadata Example

## Overview

This document demonstrates how metadata flows through the Onyx system when uploading files with a `.onyx_metadata.json` file. We'll follow a realistic scenario where a company uploads training documents with structured metadata.

## Example Scenario

**Company**: TechCorp Engineering Team  
**Use Case**: Uploading training documentation with structured metadata for better searchability  
**Files**: 3 DOCX files with associated metadata  

## Step 1: File Preparation

### Files to Upload
```
training_docs.zip
├── .onyx_metadata.json
├── python_basics.docx
├── machine_learning_guide.docx
└── api_documentation.docx
```

### Metadata JSON File (`.onyx_metadata.json`)
```json
[
    {
        "filename": "python_basics.docx",
        "link": "https://wiki.techcorp.com/python-basics",
        "file_display_name": "Python Programming Basics",
        "primary_owners": ["john.doe@techcorp.com"],
        "secondary_owners": ["jane.smith@techcorp.com"],
        "title": "Python Fundamentals for Beginners",
        "department": "Engineering",
        "tags": ["python", "programming", "tutorial", "beginner"],
        "last_updated": "2024-01-15",
        "difficulty": "beginner",
        "category": "programming-language",
        "estimated_reading_time": "30 minutes"
    },
    {
        "filename": "machine_learning_guide.docx",
        "link": "https://wiki.techcorp.com/ml-guide",
        "file_display_name": "Machine Learning Implementation Guide",
        "primary_owners": ["alice.wilson@techcorp.com"],
        "secondary_owners": ["bob.chen@techcorp.com", "carol.davis@techcorp.com"],
        "title": "ML Models in Production",
        "department": "Data Science",
        "tags": ["machine-learning", "AI", "models", "production"],
        "last_updated": "2024-01-20",
        "difficulty": "advanced",
        "category": "artificial-intelligence",
        "estimated_reading_time": "45 minutes"
    },
    {
        "filename": "api_documentation.docx",
        "link": "https://api.techcorp.com/docs",
        "file_display_name": "TechCorp API Documentation",
        "primary_owners": ["dev-team@techcorp.com"],
        "title": "REST API Developer Guide",
        "department": "Engineering",
        "tags": ["API", "REST", "documentation", "developer"],
        "last_updated": "2024-01-25",
        "difficulty": "intermediate",
        "category": "API-documentation",
        "estimated_reading_time": "20 minutes"
    }
]
```

## Step 2: Upload Processing

### File Upload Request
```bash
curl -X POST "http://localhost:8080/manage/admin/connector/file/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@training_docs.zip" \
  -F "cc_pair_id=123"
```

### System Processing

**1. ZIP File Detection**
```python
# System detects ZIP file and extracts metadata
zip_metadata = extract_zip_metadata(zip_file)
# Result: Dictionary mapping filenames to metadata
```

**2. Metadata Extraction Result**
```python
zip_metadata = {
    "python_basics.docx": {
        "link": "https://wiki.techcorp.com/python-basics",
        "file_display_name": "Python Programming Basics",
        "primary_owners": ["john.doe@techcorp.com"],
        "secondary_owners": ["jane.smith@techcorp.com"],
        "title": "Python Fundamentals for Beginners",
        "department": "Engineering",
        "tags": ["python", "programming", "tutorial", "beginner"],
        "last_updated": "2024-01-15",
        "difficulty": "beginner",
        "category": "programming-language",
        "estimated_reading_time": "30 minutes"
    },
    # ... similar entries for other files
}
```

## Step 3: Document Processing

### File Connector Processing

For each DOCX file, the system:

**1. Retrieves File Metadata**
```python
def _get_file_metadata(self, file_name: str) -> dict[str, Any]:
    # Looks up metadata for "python_basics.docx"
    return self.zip_metadata.get("python_basics.docx", {})
```

**2. Separates Onyx Metadata from Custom Tags**
```python
# Onyx recognizes these structured fields
onyx_metadata = {
    "link": "https://wiki.techcorp.com/python-basics",
    "file_display_name": "Python Programming Basics",
    "primary_owners": ["john.doe@techcorp.com"],
    "secondary_owners": ["jane.smith@techcorp.com"],
    "title": "Python Fundamentals for Beginners"
}

# Everything else becomes custom tags
custom_tags = {
    "department": "Engineering",
    "tags": ["python", "programming", "tutorial", "beginner"],
    "last_updated": "2024-01-15",
    "difficulty": "beginner",
    "category": "programming-language",
    "estimated_reading_time": "30 minutes"
}
```

**3. Creates Document Object**
```python
document = Document(
    id="file_python_basics_docx",
    sections=[TextSection(text="Python is a high-level programming language...")],
    source=DocumentSource.FILE,
    semantic_identifier="Python Programming Basics",
    title="Python Fundamentals for Beginners",
    doc_updated_at=datetime(2024, 1, 15),
    primary_owners=[BasicExpertInfo(email="john.doe@techcorp.com")],
    secondary_owners=[BasicExpertInfo(email="jane.smith@techcorp.com")],
    metadata=custom_tags,  # Custom tags stored here
    additional_info=None
)
```

## Step 4: Chunking with Metadata

### Metadata Suffix Generation

**Input Metadata** (custom_tags):
```python
{
    "department": "Engineering",
    "tags": ["python", "programming", "tutorial", "beginner"],
    "last_updated": "2024-01-15",
    "difficulty": "beginner",
    "category": "programming-language",
    "estimated_reading_time": "30 minutes"
}
```

**Processing Function**:
```python
def _get_metadata_suffix_for_document_index(metadata):
    # Converts to two formats
    
    # Semantic version (for AI embeddings)
    semantic = """Metadata:
    department - Engineering
    tags - python, programming, tutorial, beginner
    last_updated - 2024-01-15
    difficulty - beginner
    category - programming-language
    estimated_reading_time - 30 minutes"""
    
    # Keyword version (for keyword search)
    keyword = "Engineering python programming tutorial beginner 2024-01-15 beginner programming-language 30 minutes"
    
    return semantic, keyword
```

### Chunk Creation

**Example Chunk for Python Basics Document**:
```python
chunk = DocAwareChunk(
    chunk_id=0,
    blurb="Python is a high-level programming language known for its readability...",
    content="Python is a high-level programming language known for its readability and versatility. It's widely used in web development, data science, artificial intelligence, and automation. This guide will teach you the fundamentals of Python programming, starting with basic syntax and gradually building up to more complex concepts.",
    source_links={0: "https://wiki.techcorp.com/python-basics"},
    image_file_id=None,
    section_continuation=False,
    source_document=document,
    title_prefix="Python Fundamentals for Beginners\n\r\n",
    metadata_suffix_semantic="Metadata:\n\tdepartment - Engineering\n\ttags - python, programming, tutorial, beginner\n\tlast_updated - 2024-01-15\n\tdifficulty - beginner\n\tcategory - programming-language\n\testimated_reading_time - 30 minutes",
    metadata_suffix_keyword="Engineering python programming tutorial beginner 2024-01-15 beginner programming-language 30 minutes",
    contextual_rag_reserved_tokens=0,
    doc_summary="",
    chunk_context="",
    mini_chunk_texts=None,
    large_chunk_id=None,
    large_chunk_reference_ids=[]
)
```

## Step 5: Vector Database Storage (Vespa)

### Vespa Document Creation

**For the Python Basics chunk**:

```python
vespa_document = {
    # Core content fields
    "document_id": "file_python_basics_docx_chunk_0",
    "content": "Python Fundamentals for Beginners\n\r\nPython is a high-level programming language known for its readability and versatility. It's widely used in web development, data science, artificial intelligence, and automation. This guide will teach you the fundamentals of Python programming, starting with basic syntax and gradually building up to more complex concepts. Engineering python programming tutorial beginner 2024-01-15 beginner programming-language 30 minutes",
    "blurb": "Python is a high-level programming language known for its readability...",
    
    # Title and semantic identifier
    "title": "Python Fundamentals for Beginners",
    "semantic_identifier": "Python Programming Basics",
    
    # Source information
    "source_type": "file",
    "link": "https://wiki.techcorp.com/python-basics",
    "doc_updated_at": 1705363200,  # Unix timestamp for 2024-01-15
    
    # Ownership information
    "primary_owners": ["john.doe@techcorp.com"],
    "secondary_owners": ["jane.smith@techcorp.com"],
    
    # Three metadata storage formats
    "metadata": '{"department": "Engineering", "tags": ["python", "programming", "tutorial", "beginner"], "last_updated": "2024-01-15", "difficulty": "beginner", "category": "programming-language", "estimated_reading_time": "30 minutes"}',
    
    "metadata_list": [
        "department===Engineering",
        "tags===python",
        "tags===programming", 
        "tags===tutorial",
        "tags===beginner",
        "last_updated===2024-01-15",
        "difficulty===beginner",
        "category===programming-language",
        "estimated_reading_time===30 minutes"
    ],
    
    "metadata_suffix": "Engineering python programming tutorial beginner 2024-01-15 beginner programming-language 30 minutes",
    
    # Embedding vectors
    "embeddings": [0.1, 0.2, 0.3, ...],  # 512-dimensional vector
    
    # Access control and document sets
    "access_control_list": {},
    "document_sets": [],
    "boost": 0,
    "hidden": false,
    "tenant_id": "default"
}
```

### Embedding Generation

**Text sent to embedding model**:
```
Python Fundamentals for Beginners

Python is a high-level programming language known for its readability and versatility. It's widely used in web development, data science, artificial intelligence, and automation. This guide will teach you the fundamentals of Python programming, starting with basic syntax and gradually building up to more complex concepts.

Metadata:
    department - Engineering
    tags - python, programming, tutorial, beginner
    last_updated - 2024-01-15
    difficulty - beginner
    category - programming-language
    estimated_reading_time - 30 minutes
```

This enriched content gets converted to a 512-dimensional vector that captures both content and metadata context.

## Step 6: Search and Retrieval

### Example Search Queries

**Query 1: "Python programming tutorials"**

**Vector Search**:
- Searches using embeddings that include metadata context
- Finds documents where content + metadata matches the query
- The word "tutorial" in metadata helps boost relevance

**Keyword Search**:
- Searches in content + metadata_suffix
- Finds "python programming tutorial" in the metadata suffix

**Combined Results**: Python Basics document ranks highly due to exact matches in both content and metadata

---

**Query 2: "Find Engineering department documents"**

**Metadata Filter**:
```python
vespa_query = 'metadata_list contains "department===Engineering"'
```

**Results**: Returns both Python Basics and API Documentation (both from Engineering department)

---

**Query 3: "Show me beginner-level content"**

**Metadata Filter**:
```python
vespa_query = 'metadata_list contains "difficulty===beginner"'
```

**Results**: Returns Python Basics document (marked as beginner difficulty)

---

**Query 4: "Documents by john.doe@techcorp.com"**

**Metadata Filter**:
```python
vespa_query = 'primary_owners contains "john.doe@techcorp.com"'
```

**Results**: Returns Python Basics document (John Doe is primary owner)

## Step 7: Complete Storage Summary

### Final State in Vespa

After processing all three files, the system contains:

**Document 1: Python Basics**
- **Content**: Python programming tutorial content
- **Metadata**: Engineering, python, programming, tutorial, beginner, etc.
- **Searchable by**: Content keywords, metadata values, author, difficulty level
- **Filterable by**: Department, tags, difficulty, category, author

**Document 2: Machine Learning Guide**
- **Content**: ML implementation guide content  
- **Metadata**: Data Science, machine-learning, AI, models, production, etc.
- **Searchable by**: ML terms, metadata values, author, difficulty level
- **Filterable by**: Department, tags, difficulty, category, author

**Document 3: API Documentation**
- **Content**: REST API documentation content
- **Metadata**: Engineering, API, REST, documentation, developer, etc.
- **Searchable by**: API terms, metadata values, author, difficulty level
- **Filterable by**: Department, tags, difficulty, category, author

### Search Benefits

**Enhanced Context**: AI understands that a Python document is:
- From Engineering department
- Beginner-level content
- A tutorial (not reference material)
- Recently updated (2024-01-15)

**Precise Filtering**: Users can filter by:
- Department (Engineering vs Data Science)
- Difficulty level (beginner vs advanced)
- Content type (tutorial vs documentation)
- Author/owner
- Tags and categories

**Improved Relevance**: Search results are ranked considering:
- Content matching the query
- Metadata context enhancing understanding
- User preferences and access controls
- Document freshness and authority

## Configuration Impact

### If `SKIP_METADATA_IN_CHUNK=true`

**Chunking Changes**:
```python
chunk = DocAwareChunk(
    # ... same fields ...
    metadata_suffix_semantic="",  # Empty!
    metadata_suffix_keyword="",   # Empty!
)
```

**Vespa Storage**:
```python
vespa_document = {
    # ... same fields ...
    "content": "Python Fundamentals for Beginners\n\r\nPython is a high-level programming language...",  # No metadata suffix
    "metadata": '{"department": "Engineering", ...}',  # Still stored
    "metadata_list": ["department===Engineering", ...],  # Still stored
    "metadata_suffix": "",  # Empty!
}
```

**Search Impact**:
- Metadata still available for filtering
- Metadata NOT included in vector embeddings
- Metadata NOT included in keyword search
- Reduced search context but better performance

### If Metadata Exceeds Size Limit

**Token Calculation**:
```python
chunk_token_limit = 512
metadata_tokens = 150  # Calculated from metadata
max_metadata_tokens = 512 * 0.25 = 128  # 25% limit

if metadata_tokens > max_metadata_tokens:
    # Semantic metadata discarded
    metadata_suffix_semantic = ""
    # Keyword metadata kept (usually shorter)
    metadata_suffix_keyword = "Engineering python programming..."
```

**Result**: Metadata preserved for filtering but not included in embeddings

## Best Practices Demonstrated

**1. Structured Metadata Design**
- Consistent field names across documents
- Appropriate data types (strings, arrays)
- Meaningful categorization

**2. Metadata Optimization**
- Concise but descriptive values
- Relevant tags that enhance search
- Proper owner attribution

**3. Search Enhancement**
- Metadata complements content
- Multiple filtering dimensions
- Context-aware search results

This example shows how a simple metadata JSON file transforms into a rich, searchable knowledge base that enhances both finding relevant documents and understanding their context.