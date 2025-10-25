# Claude Integration Guide

## Overview

This document describes how to integrate the Bio for Dummies browser extension with an AI agent powered by Claude (Anthropic's language model). While the extension is agent-agnostic, Claude is recommended for its:

- Strong scientific and medical knowledge
- Ability to explain complex topics simply
- Context awareness and reasoning capabilities
- Citation and source attribution skills
- Safety features (appropriate for medical/health content)

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Bio for Dummies    │  HTTPS  │   Agent Service      │
│  Browser Extension  │────────→│   (Your Backend)     │
│                     │  JSON   │                      │
└─────────────────────┘         └──────────────────────┘
                                          │
                                          │ API Call
                                          ↓
                                ┌──────────────────────┐
                                │  Claude API          │
                                │  (Anthropic)         │
                                │                      │
                                │  messages API        │
                                └──────────────────────┘
```

**Important:** The extension does NOT call Claude directly. You must build a backend agent service that:
1. Receives requests from the extension
2. Calls Claude API with appropriate prompts
3. Fetches additional sources (PubMed, Wikipedia, etc.)
4. Returns formatted responses to the extension

This architecture ensures:
- API keys are never exposed in browser extension
- Agent logic can be updated without updating extension
- Rate limiting and cost control
- Compliance with Anthropic's usage policies

## Agent Service Requirements

Your agent service must implement the API contract defined in `system_architecture.md`. Here's a quick reference:

### Endpoint: POST `/api/explain`

**Request from Extension:**
```json
{
  "term": "cytokine storm",
  "context": {
    "pageTitle": "COVID-19 Complications",
    "pageUrl": "https://example.com/covid-19",
    "surroundingText": "In severe cases, patients may develop a cytokine storm...",
    "domain": "example.com",
    "contentType": "news"
  },
  "userLevel": "beginner",
  "requestId": "uuid-1234"
}
```

**Response to Extension:**
```json
{
  "requestId": "uuid-1234",
  "term": "cytokine storm",
  "explanation": {
    "short": "A cytokine storm is an overreaction of the immune system...",
    "detailed": "In more detail, cytokines are proteins...",
    "plainEnglish": true
  },
  "sources": [
    {
      "title": "Cytokine Storm - PubMed",
      "url": "https://pubmed.ncbi.nlm.nih.gov/...",
      "type": "research"
    }
  ],
  "relatedTerms": ["immune response", "inflammation"],
  "confidence": 0.95
}
```

## Claude Integration Strategy

### Option 1: Direct Claude API (Recommended for MVP)

The simplest approach: your agent service directly calls Claude's Messages API.

**Pros:**
- Simple to implement
- No additional infrastructure
- Direct access to latest Claude models

**Cons:**
- Costs per API call
- Rate limits from Anthropic
- Requires internet connection

**Implementation:**

```python
# Example: Python/Flask agent service

from anthropic import Anthropic
import os

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def explain_term(term, context, user_level):
    # Build prompt for Claude
    prompt = f"""You are a biology tutor helping someone understand biological terms.

Context:
- The user is reading: {context['pageTitle']}
- URL: {context['pageUrl']}
- Surrounding text: {context['surroundingText']}
- User expertise: {user_level}

Term to explain: {term}

Provide a clear, plain-English explanation suitable for someone with {user_level} biology knowledge.

Format your response as JSON:
{{
  "short": "One-sentence definition in simple terms",
  "detailed": "2-3 paragraphs explaining the concept, its significance, and context",
  "relatedTerms": ["term1", "term2", "term3"],
  "suggestedSources": [
    {{"title": "Source name", "searchQuery": "query to find this source"}}
  ]
}}

Remember: explain as if talking to an intelligent person who hasn't studied biology."""

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",  # or latest model
        max_tokens=2048,
        temperature=0.3,  # Lower temp for factual content
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # Parse Claude's response
    response_text = message.content[0].text

    # Extract JSON from response
    # (you may need to handle markdown code blocks)
    import json
    explanation = json.loads(response_text)

    return explanation
```

**Prompt Engineering Tips:**

1. **Be specific about audience:** "Explain to someone with no biology background"
2. **Request structured output:** Ask for JSON to ensure consistent parsing
3. **Provide context:** Include the webpage content so Claude can tailor explanations
4. **Set temperature low (0.2-0.3):** For factual, consistent explanations
5. **Use system prompts:** Define Claude's role clearly

### Option 2: Claude + RAG (Retrieval-Augmented Generation)

For more accurate, source-backed explanations:

1. **Fetch relevant sources first** (PubMed, Wikipedia, UniProt)
2. **Include sources in Claude prompt**
3. **Claude synthesizes and simplifies**

**Example workflow:**

```
1. User queries "monoclonal antibody"
   ↓
2. Agent fetches:
   - PubMed articles (via NCBI E-utilities API)
   - Wikipedia summary (via MediaWiki API)
   - UniProt entry if protein-related
   ↓
3. Agent builds prompt with sources:
   "Here are authoritative sources about monoclonal antibody:
    [Source 1 text...]
    [Source 2 text...]

    Synthesize this into a plain-English explanation..."
   ↓
4. Claude reads sources and generates explanation
   ↓
5. Agent returns explanation + source links
```

**Benefits:**
- More accurate (grounded in real sources)
- Reduces hallucination
- Provides citations
- Matches user's request for "reliable sources"

**Implementation considerations:**
- Add caching to avoid re-fetching sources
- Handle API rate limits (PubMed, Wikipedia)
- Parse scientific PDFs/abstracts appropriately

### Option 3: Fine-tuned Claude (Future)

For specialized use cases, you could fine-tune Claude on:
- Biology textbooks
- Simplified medical explanations
- Common biology FAQs

**Note:** Anthropic offers fine-tuning for enterprise customers. This is overkill for MVP but could improve quality long-term.

## Prompt Templates

Here are battle-tested prompt templates for different scenarios:

### Template 1: Basic Term Explanation

```
You are an expert biology tutor. Explain the following term in plain English to someone with {{user_level}} biology knowledge.

Term: {{term}}
Context: The user is reading "{{page_title}}" at {{page_url}}
Surrounding text: "{{surrounding_text}}"

Provide:
1. A one-sentence simple definition
2. A detailed explanation (2-3 paragraphs) covering:
   - What it is
   - Why it matters
   - How it relates to the user's reading context
3. 3-5 related terms the user might want to explore

Format as JSON:
{
  "short": "...",
  "detailed": "...",
  "relatedTerms": [...]
}

Guidelines:
- Use analogies and everyday examples
- Avoid jargon; if you must use technical terms, explain them too
- Be accurate but accessible
- Assume the reader is intelligent but not specialized
```

### Template 2: Context-Aware Explanation

```
You are a biology teaching assistant. The user is reading about {{topic_area}} and encountered a confusing term.

User's reading: {{page_title}}
Term highlighted: {{term}}
Surrounding context: "{{surrounding_text}}"

Given this context, explain "{{term}}" in a way that:
1. Connects to what they're already reading
2. Uses simple language (10th-grade reading level)
3. Highlights why this term matters in this specific context

Also suggest 2-3 reliable sources where they can learn more.

Response format (JSON):
{
  "short": "One sentence that connects to their reading",
  "detailed": "Contextual explanation",
  "sources": [
    {"title": "...", "searchQuery": "...", "type": "research|educational"}
  ]
}
```

### Template 3: Research Paper Terms

```
The user is reading a scientific research paper and needs help understanding a technical term.

Paper title: {{page_title}}
Term: {{term}}
Context: "{{surrounding_text}}"

Provide two levels of explanation:
1. **Quick version** (1-2 sentences): What does this mean in the context of this paper?
2. **Detailed version** (3-4 paragraphs):
   - General definition
   - How it's used in research
   - Why it's relevant to this paper
   - Common methods or implications

Include:
- Links to PubMed reviews or educational resources
- Related terms commonly seen in papers

Format as JSON with "quick" and "detailed" fields.

Important: This is a research context, so you can be slightly more technical than usual, but still explain clearly.
```

## Source Integration

### Fetching Reliable Sources

Your agent should supplement Claude's explanations with real sources:

#### 1. PubMed (Research Articles)

**API:** NCBI E-utilities (free)
**Endpoint:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`

**Example search:**
```python
import requests

def search_pubmed(term):
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {
        "db": "pubmed",
        "term": term,
        "retmax": 3,
        "retmode": "json",
        "sort": "relevance"
    }
    response = requests.get(url, params=params)
    ids = response.json()["esearchresult"]["idlist"]

    # Fetch summaries
    summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    summary_params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "json"
    }
    summaries = requests.get(summary_url, params=summary_params)

    return summaries.json()
```

#### 2. Wikipedia (Educational Overviews)

**API:** MediaWiki API (free)
**Endpoint:** `https://en.wikipedia.org/w/api.php`

**Example search:**
```python
def search_wikipedia(term):
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "titles": term,
        "prop": "extracts|info",
        "exintro": True,
        "explaintext": True,
        "inprop": "url"
    }
    response = requests.get(url, params=params)
    pages = response.json()["query"]["pages"]

    # Extract first page
    page = next(iter(pages.values()))
    return {
        "title": page.get("title"),
        "url": page.get("fullurl"),
        "extract": page.get("extract")
    }
```

#### 3. UniProt (Protein Database)

**API:** UniProt REST API (free)
**Endpoint:** `https://rest.uniprot.org/`

**Use for:** Protein names, gene names, enzyme names

```python
def search_uniprot(term):
    url = f"https://rest.uniprot.org/uniprotkb/search?query={term}&format=json&size=3"
    response = requests.get(url)
    return response.json()
```

### Combining Sources with Claude

**Workflow:**
1. User queries "CRISPR-Cas9"
2. Agent fetches:
   - Wikipedia summary
   - Top 2 PubMed review articles
3. Agent sends to Claude:
   ```
   Sources:
   [Wikipedia extract]
   [PubMed abstract 1]
   [PubMed abstract 2]

   Using these sources, explain CRISPR-Cas9 to a beginner...
   ```
4. Claude generates explanation grounded in sources
5. Agent returns explanation + source links

**Benefits:**
- Factually accurate (based on real sources)
- Reduces hallucination
- Provides user with further reading
- Meets "reliable sources" requirement

## Model Selection

### Recommended Claude Models

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| **Claude 3.5 Sonnet** | Production (best balance) | $$ | Fast |
| Claude 3 Opus | Maximum quality | $$$ | Slower |
| Claude 3 Haiku | Development/testing | $ | Fastest |

**For Bio for Dummies:**
- **MVP/Production:** Claude 3.5 Sonnet (latest)
  - Excellent scientific knowledge
  - Fast responses (~2-3 seconds)
  - Good cost/quality balance
- **Development:** Claude 3 Haiku
  - Cheap for testing
  - Still good quality for most terms
- **Complex terms:** Claude 3 Opus (fallback)
  - For very technical research terms
  - When Sonnet struggles

### API Parameters

```python
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,        # Enough for detailed explanations
    temperature=0.3,        # Low = more factual, less creative
    system="You are a biology tutor...",  # Define role
    messages=[
        {"role": "user", "content": prompt}
    ]
)
```

**Key parameters:**
- **Temperature:** 0.2-0.3 for factual explanations (lower = more consistent)
- **Max tokens:** 2048 is usually enough; 4096 for very detailed
- **System prompt:** Define Claude's role and constraints

## Cost Estimation

### Claude API Pricing (as of 2024)

**Claude 3.5 Sonnet:**
- Input: $3 per million tokens (~750k words)
- Output: $15 per million tokens (~750k words)

**Estimated cost per query:**
- Input: ~500 tokens (prompt + context) = $0.0015
- Output: ~800 tokens (explanation) = $0.012
- **Total: ~$0.014 per query** (~1.4 cents)

**Monthly cost estimates:**
- 100 queries/month: $1.40
- 1,000 queries/month: $14.00
- 10,000 queries/month: $140.00

**Cost optimization:**
1. **Cache responses** - Same term on same page = reuse
2. **Use Haiku for simple terms** - 5x cheaper
3. **Batch requests** - If possible (advanced)
4. **Prompt compression** - Send only relevant context, not full pages

## Agent Service Architecture

### Minimal Flask Example

```python
# agent.py - Simple agent service

from flask import Flask, request, jsonify
from anthropic import Anthropic
import os

app = Flask(__name__)
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "version": "1.0.0"})

@app.route('/api/explain', methods=['POST'])
def explain():
    data = request.json
    term = data.get('term')
    context = data.get('context', {})
    user_level = data.get('userLevel', 'beginner')

    # Build prompt
    prompt = f"""Explain "{term}" in plain English for a {user_level}.

Context: User is reading "{context.get('pageTitle', '')}"
Surrounding text: {context.get('surroundingText', '')}

Provide JSON:
{{
  "short": "one-sentence definition",
  "detailed": "2-3 paragraph explanation",
  "relatedTerms": ["term1", "term2"]
}}"""

    # Call Claude
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse response
    import json
    explanation = json.loads(message.content[0].text)

    # Add sources (fetch from PubMed, Wikipedia, etc.)
    sources = fetch_sources(term)  # Your implementation

    return jsonify({
        "requestId": data.get('requestId'),
        "term": term,
        "explanation": explanation,
        "sources": sources,
        "confidence": 0.9
    })

def fetch_sources(term):
    # TODO: Implement source fetching
    return [
        {
            "title": f"{term} - Wikipedia",
            "url": f"https://en.wikipedia.org/wiki/{term}",
            "type": "educational"
        }
    ]

if __name__ == '__main__':
    app.run(port=3000)
```

**Run it:**
```bash
export ANTHROPIC_API_KEY=your_key_here
python agent.py
```

**Test it:**
```bash
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "term": "cytokine storm",
    "context": {"pageTitle": "COVID-19"},
    "userLevel": "beginner"
  }'
```

### Production-Ready Architecture

For production, add:

1. **Caching** - Redis for query caching
2. **Rate limiting** - Prevent abuse
3. **Error handling** - Retry logic, timeouts
4. **Monitoring** - Logging, metrics (Prometheus, Datadog)
5. **Authentication** - API keys for extension users (optional)
6. **Scaling** - Deploy to cloud (AWS Lambda, Google Cloud Run, Railway)

**Example with caching:**

```python
import redis
import hashlib
import json

# Connect to Redis
cache = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_explanation(term, context):
    # Create cache key
    cache_key = hashlib.md5(f"{term}|{context.get('pageUrl')}".encode()).hexdigest()

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)

    return None

def cache_explanation(term, context, explanation):
    cache_key = hashlib.md5(f"{term}|{context.get('pageUrl')}".encode()).hexdigest()
    cache.setex(cache_key, 86400, json.dumps(explanation))  # 24h TTL
```

## Deployment Options

### 1. Local Development (Localhost)

**Use case:** Development, testing
**Pros:** Free, private, fast iteration
**Cons:** Not accessible to others

```bash
# Run agent locally
python agent.py

# Extension connects to http://localhost:3000
```

### 2. Cloud Hosting (Production)

**Option A: Railway / Render / Fly.io**
- Easy deployment
- ~$5-10/month for hobby tier
- Auto-scaling

**Option B: AWS Lambda / Google Cloud Functions**
- Serverless (pay per use)
- Cheap for low traffic
- More complex setup

**Option C: Dedicated server (VPS)**
- Full control
- $5-20/month (DigitalOcean, Linode)
- Requires DevOps knowledge

**Recommended for MVP:** Railway or Render
- One-click deploy from GitHub
- Built-in HTTPS
- Environment variable management
- Auto-restart on crash

### 3. Hybrid (Extension + Cloud Agent)

```
User's Extension → Cloud Agent Service → Claude API
                → Cache (Redis Cloud)
                → PubMed/Wikipedia APIs
```

## Configuration in Extension

The extension should allow users to configure the agent endpoint:

**Default settings:**
```javascript
// extension/config.js

const DEFAULT_AGENT_ENDPOINT = "http://localhost:3000/api";

// Allow override in settings
chrome.storage.local.get(['agentEndpoint'], (result) => {
  const endpoint = result.agentEndpoint || DEFAULT_AGENT_ENDPOINT;
  // Use endpoint for API calls
});
```

**Settings UI:**
```
┌────────────────────────────────────────┐
│ Bio for Dummies Settings               │
├────────────────────────────────────────┤
│                                        │
│ Agent Endpoint:                        │
│ [http://localhost:3000/api        ]   │
│                                        │
│ [ ] Use default (local agent)          │
│ [ ] Use remote agent                   │
│                                        │
│ Remote URL:                            │
│ [https://api.bio4dummies.com/api  ]   │
│                                        │
│ [Test Connection]  [Save]              │
└────────────────────────────────────────┘
```

## Testing the Integration

### 1. Unit Tests (Agent Service)

```python
# test_agent.py

import pytest
from agent import explain

def test_explain_simple_term():
    response = explain(
        term="mitochondria",
        context={"pageTitle": "Cell Biology"},
        user_level="beginner"
    )

    assert "explanation" in response
    assert "sources" in response
    assert len(response["sources"]) > 0
    assert "powerhouse" in response["explanation"]["short"].lower()
```

### 2. Integration Tests (Extension → Agent)

```javascript
// test/integration.test.js

describe('Agent API Integration', () => {
  test('should fetch explanation from agent', async () => {
    const response = await fetch('http://localhost:3000/api/explain', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        term: 'CRISPR',
        context: {pageTitle: 'Gene Editing'},
        userLevel: 'beginner'
      })
    });

    const data = await response.json();
    expect(data.term).toBe('CRISPR');
    expect(data.explanation.short).toBeTruthy();
    expect(data.sources.length).toBeGreaterThan(0);
  });
});
```

### 3. Manual Testing

**Test cases:**
1. Simple term: "DNA"
2. Complex term: "cytokine storm"
3. Protein: "monoclonal antibody"
4. Process: "apoptosis"
5. Disease: "diabetes mellitus"
6. Technique: "PCR"

For each, verify:
- Response time < 5s
- Explanation is plain English
- Sources are relevant
- Related terms make sense

## Error Handling

### Claude API Errors

```python
from anthropic import APIError, RateLimitError

try:
    message = client.messages.create(...)
except RateLimitError:
    return jsonify({"error": "rate_limit", "message": "Too many requests"}), 429
except APIError as e:
    return jsonify({"error": "agent_error", "message": str(e)}), 500
```

### Graceful Degradation

If Claude fails:
1. Try cache first
2. Return basic Wikipedia summary
3. Show error to user with retry option

## Privacy & Compliance

### Data Handling

**What gets sent to Claude:**
- Term to explain (e.g., "cytokine storm")
- Page context (title, URL, snippet)
- User level (beginner/intermediate/advanced)

**What does NOT get sent:**
- User identity
- Full page content (only snippets)
- User history across sessions

**Compliance with Anthropic's Usage Policy:**
- No PII in prompts
- Medical info is educational, not diagnostic
- Proper attribution of Claude-generated content
- Respect rate limits

### User Consent

In extension settings:
```
[ ] I understand that queries are sent to an AI service for processing
[ ] Anonymous usage statistics (optional)
```

## Advanced Features

### 1. Streaming Responses (Future)

Use Claude's streaming API for real-time responses:

```python
with client.messages.stream(
    model="claude-3-5-sonnet-20241022",
    messages=[{"role": "user", "content": prompt}]
) as stream:
    for text in stream.text_stream:
        # Send chunk to extension via WebSocket
        yield text
```

**Benefits:**
- User sees response appear gradually
- Feels faster (perceived latency)
- Can stop mid-stream if satisfied

### 2. Multi-Turn Conversations (Future)

Allow follow-up questions:

```
User: "What is CRISPR?"
Agent: [Explains CRISPR]
User: "How is it different from older gene editing?"
Agent: [Compares with context from previous turn]
```

**Implementation:**
- Store conversation history in extension
- Send full history to Claude for context
- Limit to last 3-5 turns to control costs

### 3. Image Analysis (Future)

For diagrams and figures in papers:

```python
# Send image to Claude Vision
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "data": image_b64}},
            {"type": "text", "text": "Explain this biological diagram"}
        ]
    }]
)
```

## Summary

### Integration Checklist

- [ ] Set up agent service (Flask/Express/FastAPI)
- [ ] Get Anthropic API key
- [ ] Implement `/api/explain` endpoint
- [ ] Test with Claude 3.5 Sonnet
- [ ] Add source fetching (PubMed, Wikipedia)
- [ ] Implement caching (Redis or in-memory)
- [ ] Add error handling
- [ ] Deploy to cloud (Railway, Render, AWS)
- [ ] Test with extension
- [ ] Monitor costs and usage

### Quick Start

1. **Install dependencies:**
   ```bash
   pip install anthropic flask redis
   ```

2. **Create `.env`:**
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

3. **Run agent:**
   ```bash
   python agent.py
   ```

4. **Configure extension:**
   Set agent endpoint to `http://localhost:3000/api`

5. **Test:**
   Highlight a biology term on any webpage!

### Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)
- [UniProt API](https://www.uniprot.org/help/api)

---

**Next Steps:** See `implementation_plan.md` for step-by-step build instructions.
