# System Architecture: Bio for Dummies

## 1. Architecture Overview

Bio for Dummies follows a **client-agent architecture** where the browser extension acts as a lightweight client that communicates with a separate AI agent service. This separation ensures the extension remains performant, maintainable, and allows the AI agent to be upgraded or replaced independently.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Webpage (any site)                   │  │
│  │                                                       │  │
│  │  User selects: "cytokine storm"                      │  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                    │
│         │ DOM events                                         │
│         ↓                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Bio for Dummies Extension                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │  Content    │  │  Background  │  │   Popup/    │  │  │
│  │  │   Script    │←→│   Service    │←→│   Sidebar   │  │  │
│  │  └─────────────┘  │   Worker     │  └─────────────┘  │  │
│  │                   └──────────────┘                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │ ↑                                 │
└──────────────────────────┼─┼─────────────────────────────────┘
                           │ │ HTTPS/WebSocket
                           │ │ JSON API
                           ↓ │
              ┌────────────────────────────┐
              │    AI Agent Service        │
              │  ┌──────────────────────┐  │
              │  │   API Gateway        │  │
              │  └──────────────────────┘  │
              │  ┌──────────────────────┐  │
              │  │ Context Processor    │  │
              │  └──────────────────────┘  │
              │  ┌──────────────────────┐  │
              │  │  LLM (Claude/GPT)    │  │
              │  └──────────────────────┘  │
              │  ┌──────────────────────┐  │
              │  │  Source Fetcher      │  │
              │  │  (PubMed, UniProt,   │  │
              │  │   Wikipedia)         │  │
              │  └──────────────────────┘  │
              └────────────────────────────┘
```

## 2. Extension Architecture (Focus of This Project)

### 2.1 High-Level Components

The extension consists of three main components following Manifest V3 architecture:

1. **Content Script** - Runs in webpage context, captures user interactions
2. **Background Service Worker** - Manages API calls, state, and cross-component communication
3. **UI Components** - Popup/Sidebar for displaying explanations

```
Extension Architecture (Manifest V3)

┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Content Script (per-tab)                 │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ Selection       │      │  Context Extractor  │    │  │
│  │  │ Detector        │      │  - Page title       │    │  │
│  │  │ - Mouse events  │      │  - URL              │    │  │
│  │  │ - Context menu  │      │  - Surrounding text │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ UI Injector     │      │  Voice Input        │    │  │
│  │  │ - Floating btn  │      │  - Speech API       │    │  │
│  │  │ - Highlights    │      │  - STT conversion   │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │ ↑                                │
│                          │ │ chrome.runtime.sendMessage     │
│                          ↓ │                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Background Service Worker (singleton)         │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ Message Router  │      │  Agent API Client   │    │  │
│  │  │ - Event handler │      │  - HTTP/WS client   │    │  │
│  │  │ - Dispatch      │      │  - Request builder  │    │  │
│  │  └─────────────────┘      │  - Response parser  │    │  │
│  │                           └─────────────────────┘    │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ State Manager   │      │  Cache Manager      │    │  │
│  │  │ - Active queries│      │  - Query cache      │    │  │
│  │  │ - Settings      │      │  - Response cache   │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ Error Handler   │      │  Analytics (opt)    │    │  │
│  │  │ - Retry logic   │      │  - Usage metrics    │    │  │
│  │  │ - Timeouts      │      │  - Error tracking   │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │ ↑                                │
│                          │ │ chrome.runtime.sendMessage     │
│                          ↓ │                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              UI Components (Popup/Sidebar)            │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ Explanation     │      │  Settings Panel     │    │  │
│  │  │ Renderer        │      │  - Agent endpoint   │    │  │
│  │  │ - Markdown      │      │  - Display mode     │    │  │
│  │  │ - Source links  │      │  - Voice/TTS opts   │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐    │  │
│  │  │ TTS Controller  │      │  History Viewer     │    │  │
│  │  │ - Play/pause    │      │  - Past queries     │    │  │
│  │  │ - Voice select  │      │  - Bookmarks        │    │  │
│  │  └─────────────────┘      └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Storage (chrome.storage.local)           │  │
│  │  - User settings                                      │  │
│  │  - Query history                                      │  │
│  │  - Cached responses                                   │  │
│  │  - Agent endpoint configuration                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Details

#### A. Content Script (`content.js`)

**Purpose:** Runs in the context of each webpage, detects user interactions, extracts context.

**Responsibilities:**
- Listen for text selection events
- Show floating button/icon near selection
- Extract selected text and surrounding context
- Capture page metadata (title, URL, domain)
- Inject UI elements (floating button, highlights)
- Handle voice input (microphone access)
- Send query requests to background worker
- Receive and display responses

**APIs Used:**
- `window.getSelection()` - Get selected text
- `document.querySelector()` - DOM manipulation
- `chrome.runtime.sendMessage()` - Communicate with background
- Web Speech API - Voice input (optional)

**Isolation:**
- Runs in isolated JavaScript context
- Limited access to page's JavaScript
- Can read/modify DOM
- Cannot access extension's background context directly

#### B. Background Service Worker (`background.js`)

**Purpose:** Central hub for business logic, API communication, state management.

**Responsibilities:**
- Receive requests from content scripts
- Manage agent API communication
- Handle authentication/API keys (if needed)
- Implement retry logic and error handling
- Cache responses for performance
- Manage extension state (active queries, settings)
- Coordinate between content scripts and UI
- Handle browser action clicks

**APIs Used:**
- `chrome.runtime.onMessage` - Receive messages from content/UI
- `fetch()` or `XMLHttpRequest` - API calls to agent
- `chrome.storage.local` - Persist settings and cache
- `chrome.contextMenus` - Right-click menu integration
- `chrome.commands` - Keyboard shortcuts

**State Management:**
- Active queries (in-flight requests)
- User settings (agent endpoint, display preferences)
- Cache (query → response mapping)

#### C. UI Components (`popup.html`, `sidebar.html`)

**Purpose:** Display explanations, settings, and history to user.

**Popup UI:**
- Triggered by clicking extension icon
- Shows latest explanation or welcome screen
- Quick settings toggle
- Link to full settings

**Sidebar UI (optional):**
- Persistent panel alongside webpage
- Shows explanation without covering content
- Better for long explanations

**Settings Page:**
- Configure agent endpoint (local/remote)
- Display preferences (popup vs sidebar)
- Enable/disable voice and TTS
- Manage history and cache

**Explanation Display:**
- Plain-English definition
- Context-aware details
- Source links (PubMed, UniProt, Wikipedia)
- Speak button (TTS)
- Copy/share options

**Rendering:**
- Use simple templating or React/Vue/Svelte
- Markdown rendering for formatted text
- Syntax highlighting for chemical formulas (optional)

### 2.3 Data Flow

#### Query Flow (Text Selection)
```
1. User highlights "cytokine storm" on webpage
   ↓
2. Content Script detects selection via mouseup event
   ↓
3. Content Script shows floating button
   ↓
4. User clicks button
   ↓
5. Content Script:
   - Extracts selected text: "cytokine storm"
   - Gets page context: {title, url, surroundingText}
   - Sends message to Background Worker
   ↓
6. Background Worker receives message:
   {
     type: "QUERY",
     term: "cytokine storm",
     context: {
       pageTitle: "COVID-19 Complications",
       pageUrl: "https://example.com/covid",
       surroundingText: "...severe cases may develop...",
       domain: "example.com"
     }
   }
   ↓
7. Background Worker checks cache
   - If cached: return immediately
   - If not: proceed to agent call
   ↓
8. Background Worker sends to Agent API:
   POST /api/explain
   {
     "term": "cytokine storm",
     "context": {...},
     "userLevel": "beginner"
   }
   ↓
9. Agent processes and returns:
   {
     "term": "cytokine storm",
     "explanation": "A cytokine storm is when...",
     "sources": [
       {"title": "PubMed", "url": "..."},
       {"title": "Wikipedia", "url": "..."}
     ],
     "confidence": 0.95
   }
   ↓
10. Background Worker:
    - Caches response
    - Sends to Content Script
    ↓
11. Content Script displays in popup/sidebar
    ↓
12. User reads explanation and clicks source links
```

#### Settings Update Flow
```
1. User opens extension popup
   ↓
2. Clicks "Settings" button
   ↓
3. Settings page opens (settings.html)
   ↓
4. User changes agent endpoint to "http://localhost:3000"
   ↓
5. Settings page saves to chrome.storage.local:
   {
     agentEndpoint: "http://localhost:3000",
     displayMode: "popup",
     voiceEnabled: true,
     ttsEnabled: true
   }
   ↓
6. Settings page sends message to Background Worker:
   {type: "SETTINGS_UPDATED"}
   ↓
7. Background Worker reloads settings from storage
   ↓
8. Next query uses new endpoint
```

### 2.4 Storage Schema

```javascript
// chrome.storage.local

{
  // User Settings
  "settings": {
    "agentEndpoint": "http://localhost:3000/api",
    "agentType": "local", // "local" | "remote"
    "displayMode": "popup", // "popup" | "sidebar"
    "voiceEnabled": true,
    "ttsEnabled": true,
    "ttsVoice": "en-US-Standard-A",
    "autoActivateDomains": ["pubmed.ncbi.nlm.nih.gov", "*.wikipedia.org"],
    "theme": "light" // "light" | "dark" | "auto"
  },

  // Query Cache (LRU, max 100 entries)
  "cache": {
    "cytokine storm|https://example.com": {
      "term": "cytokine storm",
      "explanation": "...",
      "sources": [...],
      "timestamp": 1678901234567,
      "ttl": 86400000 // 24 hours
    }
  },

  // History (max 500 entries)
  "history": [
    {
      "id": "uuid-1",
      "term": "monoclonal antibody",
      "pageUrl": "https://example.com/cancer",
      "timestamp": 1678901234567,
      "bookmarked": false
    }
  ],

  // Usage Statistics (optional)
  "stats": {
    "totalQueries": 42,
    "lastUsed": 1678901234567,
    "favoriteTerms": ["CRISPR", "mRNA"]
  }
}
```

## 3. Agent Interface (API Contract)

The extension communicates with the AI agent via a simple JSON API. This interface is intentionally minimal to allow flexibility in agent implementation.

### 3.1 API Endpoints

#### POST `/api/explain`

Request an explanation for a biological term.

**Request:**
```json
{
  "term": "cytokine storm",
  "context": {
    "pageTitle": "COVID-19 Complications",
    "pageUrl": "https://example.com/covid-19",
    "surroundingText": "In severe cases, patients may develop a cytokine storm...",
    "domain": "example.com",
    "contentType": "news" // "research" | "news" | "educational" | "other"
  },
  "userLevel": "beginner", // "beginner" | "intermediate" | "advanced"
  "requestId": "uuid-1234" // for tracking
}
```

**Response (200 OK):**
```json
{
  "requestId": "uuid-1234",
  "term": "cytokine storm",
  "explanation": {
    "short": "A cytokine storm is an overreaction of the immune system...",
    "detailed": "In more detail, cytokines are proteins that help cells communicate...",
    "plainEnglish": true
  },
  "sources": [
    {
      "title": "Cytokine Storm - PubMed",
      "url": "https://pubmed.ncbi.nlm.nih.gov/...",
      "type": "research",
      "snippet": "A review of cytokine storm in..."
    },
    {
      "title": "Cytokine release syndrome - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Cytokine_release_syndrome",
      "type": "educational"
    }
  ],
  "relatedTerms": ["immune response", "inflammation", "interleukin"],
  "confidence": 0.95,
  "processingTimeMs": 1234
}
```

**Response (400 Bad Request):**
```json
{
  "error": "invalid_request",
  "message": "Missing required field: term"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "agent_error",
  "message": "Failed to fetch from PubMed",
  "retryable": true
}
```

#### GET `/api/health`

Check if agent is alive and ready.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123456
}
```

### 3.2 Communication Protocols

**Primary: HTTP/HTTPS**
- Simple, stateless, widely supported
- Use `fetch()` API in background worker
- JSON request/response bodies
- Timeout: 30 seconds

**Alternative: WebSocket (future)**
- For streaming responses
- Real-time feedback ("searching PubMed...")
- More efficient for multiple queries

**Error Handling:**
- Timeout after 30s, show error to user
- Retry on network errors (3 attempts, exponential backoff)
- Show user-friendly messages for agent errors
- Fallback to cached responses if available

## 4. Security Architecture

### 4.1 Content Security Policy (CSP)

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src http://localhost:* https://*"
  }
}
```

- Only allow extension's own scripts
- Allow connections to localhost (local agent) and HTTPS (remote agent)
- No inline scripts or `eval()`

### 4.2 Permissions

**Minimal Permissions:**
```json
{
  "permissions": [
    "activeTab",      // Access current tab when user invokes
    "storage",        // Store settings and cache
    "contextMenus"    // Right-click menu integration
  ],
  "optional_permissions": [
    "tts",           // Text-to-speech
    "unlimitedStorage" // For extensive history
  ],
  "host_permissions": [] // No host permissions needed
}
```

**Why minimal:**
- `activeTab` only grants access when user clicks, not all tabs
- No broad `<all_urls>` permission
- User privacy preserved

### 4.3 Data Privacy

- **No telemetry by default** - all tracking opt-in
- **Local-first** - queries stored locally, not cloud
- **No PII collection** - extension doesn't know who user is
- **HTTPS only** for remote agent communication
- **No third-party scripts** - all code bundled

### 4.4 Agent Authentication (optional)

If agent requires authentication:
- API key stored in `chrome.storage.local` (encrypted)
- Sent via `Authorization` header
- User provides key in settings
- Never hardcoded in extension

## 5. Technology Stack

### 5.1 Extension Frontend

**Core:**
- **JavaScript/TypeScript** - Primary language
- **Manifest V3** - Extension format
- **HTML/CSS** - UI structure and styling

**UI Framework (choose one):**
- **Vanilla JS** - Lightweight, no dependencies (recommended for MVP)
- **React** - If complex UI needed
- **Svelte** - Smaller bundle size
- **Vue** - Middle ground

**Bundler:**
- **Webpack** - Most common for extensions
- **Vite** - Faster builds, modern alternative
- **Rollup** - Smaller bundles

**Testing:**
- **Jest** - Unit tests
- **Puppeteer/Playwright** - E2E tests for extension

### 5.2 Extension Libraries

- **Marked** or **Markdown-it** - Markdown rendering
- **DOMPurify** - Sanitize HTML (security)
- **Fuse.js** - Fuzzy search for history (optional)

### 5.3 Browser APIs Used

**Manifest V3 APIs:**
- `chrome.runtime` - Messaging, lifecycle
- `chrome.storage` - Persistent storage
- `chrome.contextMenus` - Right-click menu
- `chrome.commands` - Keyboard shortcuts
- `chrome.action` - Extension icon/popup

**Web APIs:**
- `window.getSelection()` - Text selection
- `fetch()` - Network requests
- Web Speech API - Voice input (optional)
- Speech Synthesis API - TTS (optional)

## 6. Deployment Architecture

```
Development:
┌─────────────┐     ┌──────────────┐
│  Extension  │────→│ Local Agent  │
│   (local)   │     │ localhost:   │
│             │     │   3000       │
└─────────────┘     └──────────────┘

Production (Local Agent):
┌─────────────┐     ┌──────────────┐
│  Extension  │────→│ Local Agent  │
│  (Chrome    │     │ (user's      │
│   Store)    │     │  machine)    │
└─────────────┘     └──────────────┘

Production (Remote Agent):
┌─────────────┐     ┌──────────────┐
│  Extension  │────→│ Remote Agent │
│  (Chrome    │     │ (cloud       │
│   Store)    │     │  service)    │
└─────────────┘     └──────────────┘
                    https://api.
                    bioforum.com/
```

### 6.1 Extension Distribution

**Chrome Web Store:**
- Package as `.zip` with manifest
- Submit for review (1-3 days)
- Auto-updates for users

**Firefox Add-ons:**
- Package as `.xpi`
- Submit to AMO (addons.mozilla.org)
- Manifest V2/V3 hybrid support

**Edge Add-ons:**
- Same package as Chrome
- Submit to Edge store
- Usually faster review

**Manual Installation (development):**
- Load unpacked extension
- Developer mode required

## 7. Scalability & Performance

### 7.1 Extension Performance

**Bundle Size:**
- Target: < 500KB uncompressed
- Tree-shaking to remove unused code
- Lazy-load UI components

**Memory:**
- Content script: < 10MB per tab
- Background worker: < 50MB
- Popup: < 20MB

**CPU:**
- Content script: minimal event listeners
- Background worker: async I/O, no heavy computation
- No polling, event-driven only

### 7.2 Caching Strategy

**Query Cache:**
- LRU cache, max 100 entries
- TTL: 24 hours
- Cache key: `${term}|${pageUrl}`
- Invalidate on agent version change

**Source Cache:**
- Cache source links for 7 days
- Separate from query cache

**Cache Eviction:**
- Automatic LRU eviction
- User can clear cache in settings

### 7.3 Rate Limiting

**Client-Side:**
- Max 10 queries per minute
- Show warning if exceeded
- Prevent accidental spam

**Agent-Side:**
- Agent should implement rate limiting
- Extension respects 429 status codes
- Exponential backoff on rate limit

## 8. Error Handling & Resilience

### 8.1 Error Types

| Error Type | Cause | User Message | Action |
|------------|-------|--------------|--------|
| Network timeout | Agent unreachable | "Agent took too long to respond" | Show cached result if available |
| Agent error 500 | Agent crashed | "Agent encountered an error" | Retry once, then fail |
| Agent error 400 | Bad request | "Invalid query" | Log error, don't retry |
| Rate limit 429 | Too many requests | "Too many queries, try again in 1 min" | Block new queries temporarily |
| Parse error | Invalid JSON | "Unexpected response format" | Log error, notify developers |

### 8.2 Fallback Mechanisms

1. **Cached responses** - If agent fails, show last cached result with warning
2. **Graceful degradation** - If voice fails, fall back to text input
3. **Partial results** - Show explanation even if sources fail to load
4. **Offline mode** - Show message if agent is unreachable

### 8.3 Monitoring & Debugging

**User-Facing:**
- Error messages in popup
- "Report Issue" button with logs
- Settings page shows agent status

**Developer-Facing:**
- Console logging (development mode only)
- Error tracking (opt-in, e.g., Sentry)
- Performance marks for profiling

## 9. Extensibility & Future Enhancements

### 9.1 Plugin Architecture (future)

Allow third-party developers to add:
- Custom source providers (e.g., textbooks, journals)
- Custom renderers (e.g., 3D molecules)
- Custom languages

### 9.2 Multi-Agent Support (future)

- Allow users to configure multiple agents
- Route queries based on domain (research papers → specialized agent)
- Aggregate responses from multiple agents

### 9.3 Collaboration Features (future)

- Share explanations with others
- Public knowledge base of queries
- Upvote/downvote explanations

## 10. Non-Functional Architecture

### 10.1 Logging

**Levels:**
- ERROR: Critical failures
- WARN: Recoverable issues
- INFO: User actions (query sent)
- DEBUG: Detailed traces (dev only)

**Storage:**
- In-memory ring buffer (last 100 logs)
- Exportable for bug reports
- Never log PII or query content (privacy)

### 10.2 Analytics (opt-in)

If user opts in:
- Query count per day
- Average response time
- Error rate
- Most queried terms (anonymized)

Send to privacy-preserving analytics (e.g., Plausible, not Google Analytics).

### 10.3 Accessibility

- Full keyboard navigation
- ARIA labels for screen readers
- High contrast mode support
- Respects `prefers-reduced-motion`

## 11. Conclusion

This architecture provides:
- **Clean separation** between extension (client) and agent (service)
- **Simple API contract** for easy agent swapping
- **Manifest V3 compliance** for modern browsers
- **Privacy-first** design with minimal permissions
- **Extensible** foundation for future enhancements

The extension is intentionally lightweight, delegating all AI/ML and source fetching to the agent. This keeps the extension maintainable, performant, and allows the agent to evolve independently.
