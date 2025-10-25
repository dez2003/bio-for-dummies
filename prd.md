# Product Requirements Document: Bio for Dummies

## 1. Overview

**Product Name:** Bio for Dummies
**Product Type:** Browser Extension (Chrome/Firefox/Edge)
**Target Users:** Students, casual readers, journalists, and anyone encountering biological/medical terminology online
**Core Value Proposition:** Instantly demystify complex biological terms while browsing, with context-aware AI explanations in plain English

## 2. Problem Statement

Users frequently encounter complex biological and medical terminology while reading research papers, news articles, Wikipedia pages, and educational content. Current solutions require:
- Context switching (opening new tabs, searching)
- Manual copy-paste into search engines
- Sorting through technical results not suitable for beginners
- Loss of reading flow and focus

## 3. Product Goals

### Primary Goals
1. Enable seamless, in-context explanations of biological terms
2. Provide explanations at an appropriate level (plain English, no prerequisites)
3. Maintain reading flow with minimal interruption
4. Surface reliable, authoritative sources

### Secondary Goals
1. Support multiple interaction modes (text highlighting, voice)
2. Provide accessibility features (text-to-speech)
3. Build foundation for easy AI agent integration

## 4. Target Audience

### Primary Personas
1. **Curious Student** - High school or early college student reading beyond their current knowledge
2. **Informed Citizen** - Adult reading health/science news, wants to understand without formal training
3. **Cross-disciplinary Researcher** - Expert in one field, needs quick primers on biological concepts

### User Characteristics
- Has internet access and uses modern browsers
- Reads biology/health content at least weekly
- Comfortable with basic browser extensions
- May or may not have formal biology education

## 5. Core Features (MVP)

### 5.1 Text Selection & Query
**Priority:** P0 (Must Have)

**User Story:** As a user, I want to highlight any biological term and get an explanation, so I can understand it without leaving the page.

**Requirements:**
- Detect text selection on any webpage
- Show context menu or floating button near selection
- Capture selected text as query term
- Send query + page context to AI agent
- Display explanation in popup/sidebar

**Acceptance Criteria:**
- User can select 1-50 characters of text
- Extension responds within 500ms of selection
- Works on 95%+ of standard webpages

### 5.2 Context Awareness
**Priority:** P0 (Must Have)

**User Story:** As a user, I want explanations relevant to what I'm reading, not generic definitions.

**Requirements:**
- Extract page metadata (title, URL, domain)
- Capture surrounding text context (paragraph or section)
- Identify if page is academic paper, news, Wikipedia, etc.
- Pass context to AI agent for contextualized responses

**Acceptance Criteria:**
- Captures at minimum: page title, URL, selected term, surrounding 200 words
- Correctly identifies content type (research/news/educational/other)

### 5.3 AI Agent Communication Layer
**Priority:** P0 (Must Have)

**User Story:** As a developer, I want a clean interface between extension and AI agent, so we can swap or upgrade the agent easily.

**Requirements:**
- Define JSON API contract between extension and agent
- Support both local and remote agent endpoints
- Handle agent timeouts and errors gracefully
- Include retry logic with exponential backoff

**Acceptance Criteria:**
- API contract documented in OpenAPI/JSON Schema
- Agent endpoint configurable via extension settings
- Failed requests show user-friendly error messages
- Requests timeout after 30 seconds

### 5.4 Explanation Display
**Priority:** P0 (Must Have)

**User Story:** As a user, I want to read explanations clearly without losing my place on the page.

**Requirements:**
- Show explanation in modal, sidebar, or popup (configurable)
- Include: plain-English definition, context, source links
- Format with clear typography and spacing
- Dismissable with click-away or ESC key

**Acceptance Criteria:**
- Explanation visible within 3 seconds of query
- Readable at default browser text sizes
- Includes at least one authoritative source link
- Doesn't obscure original page content

### 5.5 Source Attribution
**Priority:** P0 (Must Have)

**User Story:** As a user, I want to see where information comes from, so I can verify and learn more.

**Requirements:**
- Display clickable links to sources (PubMed, UniProt, Wikipedia, etc.)
- Show source domain/type clearly
- Open links in new tab without disrupting current page

**Acceptance Criteria:**
- Each explanation includes 1-3 source links
- Links are clearly labeled with source type
- Links verified to be working URLs

## 6. Enhanced Features (Post-MVP)

### 6.1 Voice Query
**Priority:** P1 (Should Have)

- Activate extension with keyboard shortcut or button
- Record user voice query ("What is cytokine storm?")
- Convert speech to text via browser API
- Process as standard query

### 6.2 Text-to-Speech Output
**Priority:** P1 (Should Have)

- Option to read explanation aloud
- Use browser's speech synthesis API
- Pause/stop controls
- Configurable voice and speed

### 6.3 History & Bookmarks
**Priority:** P2 (Nice to Have)

- Save query history locally
- Bookmark useful explanations
- Export saved explanations

### 6.4 Domain Detection & Auto-Activation
**Priority:** P2 (Nice to Have)

- Detect biology-related websites automatically
- Show subtle indicator when extension is active
- Allow whitelist/blacklist of domains

### 6.5 Multi-Language Support
**Priority:** P3 (Future)

- Detect page language
- Provide explanations in user's preferred language
- Support non-English biological terms

## 7. Technical Requirements

### Browser Support
- **Must Support:** Chrome 100+, Firefox 100+, Edge 100+
- **Extension Format:** Manifest V3 (Chrome/Edge), Manifest V2/V3 hybrid (Firefox)

### Performance
- Extension bundle < 2MB
- Memory footprint < 50MB idle, < 100MB active
- Query response time < 5 seconds (P95)
- No noticeable page load impact

### Security & Privacy
- No data collection without explicit consent
- Queries processed only when user initiates
- Option for local-only AI agent (no cloud)
- No tracking, analytics optional and opt-in
- Secure HTTPS communication with agent

### Accessibility
- Keyboard navigation for all features
- Screen reader compatible
- WCAG 2.1 AA compliance
- Configurable font sizes and contrast

## 8. User Interaction Flow

### Primary Flow: Text Highlight Query
1. User browses biology-related content
2. User encounters unfamiliar term (e.g., "cytokine storm")
3. User highlights term with mouse/keyboard
4. Extension shows floating button/icon near selection
5. User clicks button or presses keyboard shortcut
6. Extension:
   - Captures term + page context
   - Sends to AI agent via API
   - Shows loading indicator
7. Agent responds with explanation
8. Extension displays:
   - Plain-English explanation
   - Context-aware details
   - Source links (PubMed, Wikipedia, etc.)
9. User reads explanation
10. User clicks link to learn more OR dismisses to continue reading

### Secondary Flow: Voice Query
1. User presses keyboard shortcut or clicks extension icon
2. Extension activates microphone (with permission)
3. User speaks query: "What is monoclonal antibody?"
4. Extension converts speech to text
5. Follows same flow as text highlight from step 6

## 9. Non-Functional Requirements

### Reliability
- 99% uptime for extension (no crashes)
- Graceful degradation if agent unavailable
- Error messages actionable and clear

### Usability
- Zero-config installation (works out of box)
- One-click to get explanation
- Settings accessible but not required

### Maintainability
- Modern JavaScript/TypeScript codebase
- Comprehensive unit and integration tests
- Clear documentation for developers
- Modular architecture for easy updates

## 10. Success Metrics

### User Engagement
- Daily active users (DAU)
- Queries per user per session
- Query success rate (response received)

### Quality
- Average time to response
- User satisfaction (if feedback collected)
- Source link click-through rate

### Technical
- Extension crash rate < 0.1%
- API timeout rate < 1%
- Page performance impact < 5%

## 11. Out of Scope (for Extension)

The extension will NOT:
- Implement the AI agent itself (agent is separate component)
- Train or fine-tune AI models
- Scrape PubMed/UniProt/Wikipedia directly (agent's responsibility)
- Store user data in cloud
- Require user accounts or authentication
- Modify webpage content (non-invasive)

## 12. Open Questions

1. Should extension support mobile browsers (Firefox Android, etc.)?
2. What's the default agent endpoint (localhost? cloud service?)?
3. Should we support batch queries (multiple terms at once)?
4. Should explanations be cached locally for repeat queries?
5. Do we need rate limiting to prevent agent overload?

## 13. Dependencies

### Extension Dependencies
- Browser Extension APIs (Manifest V3)
- Web Speech API (for voice features)
- Fetch API / XMLHttpRequest for agent communication

### External Dependencies
- AI agent service (separate component, to be specified)
- Agent must provide RESTful or WebSocket API
- Agent must handle source fetching (PubMed, UniProt, Wikipedia)

## 14. Timeline & Phases

### Phase 1: MVP (Weeks 1-4)
- Core extension structure
- Text selection & query
- Basic AI agent communication
- Simple popup display
- Chrome support only

### Phase 2: Enhanced UX (Weeks 5-6)
- Improved UI/UX design
- Firefox and Edge support
- Settings panel
- Error handling polish

### Phase 3: Advanced Features (Weeks 7-8)
- Voice query support
- Text-to-speech
- History tracking
- Domain detection

## 15. Constraints & Assumptions

### Constraints
- Must comply with browser extension store policies
- Cannot require user payment (free to use)
- Must work offline if agent is local
- Bundle size limits (browser store requirements)

### Assumptions
- AI agent exists or will be developed separately
- Agent can return responses in 3-5 seconds
- Users have modern browsers (past 2 years)
- Biological sources (PubMed, etc.) remain accessible
