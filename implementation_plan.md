# Implementation Plan: Bio for Dummies Browser Extension

## Overview

This document provides a step-by-step implementation plan for building the Bio for Dummies browser extension. The plan is structured in phases, each building on the previous one, allowing for iterative development and testing.

**Total Estimated Time:** 6-8 weeks (MVP)
**Skill Level Required:** Intermediate JavaScript, basic understanding of browser extensions
**Prerequisites:** Node.js, npm/yarn, code editor, Chrome browser for testing

## Phase 0: Project Setup (Week 1, Days 1-2)

### Objective
Set up development environment and project structure.

### Tasks

#### 1. Initialize Project Structure

```bash
bio-for-dummies/
├── extension/
│   ├── manifest.json          # Extension configuration
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── content/
│   │   ├── content.js         # Content script
│   │   └── content.css        # Styles for injected UI
│   ├── popup/
│   │   ├── popup.html         # Popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styles
│   ├── settings/
│   │   ├── settings.html      # Settings page
│   │   ├── settings.js
│   │   └── settings.css
│   ├── lib/
│   │   ├── api-client.js      # Agent API client
│   │   ├── storage.js         # Storage utilities
│   │   └── constants.js       # Shared constants
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── prd.md
│   ├── system_architecture.md
│   ├── claude.md
│   └── implementation_plan.md
├── package.json
├── .gitignore
├── README.md
└── webpack.config.js          # If using bundler
```

#### 2. Create `manifest.json` (Manifest V3)

```json
{
  "manifest_version": 3,
  "name": "Bio for Dummies",
  "version": "0.1.0",
  "description": "Instantly understand biological terms while browsing. Highlight any term for a plain-English explanation.",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ],
  "host_permissions": [],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src http://localhost:* https://*"
  }
}
```

#### 3. Initialize npm Project

```bash
npm init -y
npm install --save-dev webpack webpack-cli
npm install --save-dev jest @testing-library/jest-dom

# Optional: TypeScript
npm install --save-dev typescript @types/chrome
```

#### 4. Create Basic Files

**extension/background/service-worker.js:**
```javascript
// Basic service worker
console.log('Bio for Dummies service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});
```

**extension/content/content.js:**
```javascript
// Basic content script
console.log('Bio for Dummies content script loaded');
```

**extension/popup/popup.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bio for Dummies</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <h1>Bio for Dummies</h1>
    <p>Select a biological term on any page to get started!</p>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

#### 5. Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `bio-for-dummies/extension` folder
5. Verify extension loads without errors

**Deliverables:**
- [ ] Project structure created
- [ ] manifest.json configured
- [ ] Extension loads in Chrome
- [ ] Basic files in place
- [ ] Git repository initialized

**Time Estimate:** 4-6 hours

---

## Phase 1: Core Selection & UI (Week 1, Days 3-7)

### Objective
Implement text selection detection and basic UI for displaying explanations.

### Tasks

#### 1.1 Text Selection Detection

**File:** `extension/content/content.js`

```javascript
// Text selection detector

let selectedText = '';
let selectionPosition = { x: 0, y: 0 };

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection(event) {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0 && text.length <= 100) {
    selectedText = text;

    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    selectionPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY
    };

    // Show floating button
    showFloatingButton(selectionPosition);
  } else {
    hideFloatingButton();
  }
}

function showFloatingButton(position) {
  // Remove existing button
  hideFloatingButton();

  // Create button
  const button = document.createElement('button');
  button.id = 'bio-for-dummies-btn';
  button.textContent = '🧬 Explain';
  button.style.position = 'absolute';
  button.style.left = `${position.x}px`;
  button.style.top = `${position.y - 40}px`;
  button.style.zIndex = '999999';

  // Add click handler
  button.addEventListener('click', handleExplainClick);

  document.body.appendChild(button);
}

function hideFloatingButton() {
  const existingButton = document.getElementById('bio-for-dummies-btn');
  if (existingButton) {
    existingButton.remove();
  }
}

function handleExplainClick() {
  console.log('Explain clicked for:', selectedText);

  // Extract page context
  const context = extractPageContext();

  // Send to background worker
  chrome.runtime.sendMessage({
    type: 'QUERY',
    term: selectedText,
    context: context
  });

  hideFloatingButton();
}

function extractPageContext() {
  return {
    pageTitle: document.title,
    pageUrl: window.location.href,
    domain: window.location.hostname,
    // TODO: Extract surrounding text
    surroundingText: ''
  };
}
```

**File:** `extension/content/content.css`

```css
#bio-for-dummies-btn {
  padding: 8px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: background 0.2s;
}

#bio-for-dummies-btn:hover {
  background: #45a049;
}
```

**Test:**
1. Reload extension
2. Select text on any webpage
3. Verify floating button appears
4. Click button, check console for message

#### 1.2 Context Extraction

Add function to get surrounding text:

```javascript
function extractPageContext() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  // Get parent element
  const parentElement = container.nodeType === 3
    ? container.parentElement
    : container;

  // Get surrounding text (up to 500 chars before and after)
  const fullText = parentElement.textContent;
  const selectionStart = fullText.indexOf(selectedText);

  const start = Math.max(0, selectionStart - 250);
  const end = Math.min(fullText.length, selectionStart + selectedText.length + 250);
  const surroundingText = fullText.substring(start, end);

  return {
    pageTitle: document.title,
    pageUrl: window.location.href,
    domain: window.location.hostname,
    surroundingText: surroundingText,
    contentType: detectContentType()
  };
}

function detectContentType() {
  const hostname = window.location.hostname;

  if (hostname.includes('pubmed') || hostname.includes('ncbi')) {
    return 'research';
  } else if (hostname.includes('wikipedia')) {
    return 'educational';
  } else if (hostname.includes('news') || hostname.includes('cnn') || hostname.includes('bbc')) {
    return 'news';
  }

  return 'other';
}
```

#### 1.3 Message Handling in Background Worker

**File:** `extension/background/service-worker.js`

```javascript
// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'QUERY') {
    handleQuery(message.term, message.context)
      .then(response => {
        // Send response back to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'QUERY_RESPONSE',
          data: response
        });
      })
      .catch(error => {
        console.error('Query failed:', error);
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'QUERY_ERROR',
          error: error.message
        });
      });

    // Return true to indicate async response
    return true;
  }
});

async function handleQuery(term, context) {
  console.log('Handling query:', term);

  // For now, return mock data
  return {
    term: term,
    explanation: {
      short: `${term} is a biological concept.`,
      detailed: `This is a detailed explanation of ${term}...`
    },
    sources: [
      {
        title: `${term} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${term.replace(' ', '_')}`
      }
    ]
  };
}
```

#### 1.4 Display Explanation in Popup

**File:** `extension/content/content.js` (add listener)

```javascript
// Listen for responses from background worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUERY_RESPONSE') {
    displayExplanation(message.data);
  } else if (message.type === 'QUERY_ERROR') {
    displayError(message.error);
  }
});

function displayExplanation(data) {
  // Create modal/popup
  const modal = document.createElement('div');
  modal.id = 'bio-for-dummies-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${data.term}</h2>
      <div class="explanation">
        <h3>Quick Summary</h3>
        <p>${data.explanation.short}</p>
        <h3>Detailed Explanation</h3>
        <p>${data.explanation.detailed}</p>
      </div>
      <div class="sources">
        <h3>Sources</h3>
        <ul>
          ${data.sources.map(s => `<li><a href="${s.url}" target="_blank">${s.title}</a></li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on click
  modal.querySelector('.close').addEventListener('click', () => {
    modal.remove();
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function displayError(error) {
  alert(`Error: ${error}`);
}
```

**File:** `extension/content/content.css` (add modal styles)

```css
#bio-for-dummies-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-top: 0;
  color: #333;
}

.modal-content h3 {
  margin-top: 16px;
  color: #555;
  font-size: 16px;
}

.close {
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #f44336;
}

.sources ul {
  list-style: none;
  padding: 0;
}

.sources li {
  margin: 8px 0;
}

.sources a {
  color: #4CAF50;
  text-decoration: none;
}

.sources a:hover {
  text-decoration: underline;
}
```

**Test:**
1. Reload extension
2. Select text
3. Click "Explain" button
4. Verify modal appears with mock explanation
5. Test close button and background click

**Deliverables:**
- [ ] Text selection detection works
- [ ] Floating button appears on selection
- [ ] Page context extracted correctly
- [ ] Modal displays explanation
- [ ] UI is clean and responsive

**Time Estimate:** 12-16 hours

---

## Phase 2: Agent API Integration (Week 2)

### Objective
Implement communication with the AI agent service.

### Tasks

#### 2.1 Create API Client Library

**File:** `extension/lib/constants.js`

```javascript
export const DEFAULT_AGENT_ENDPOINT = 'http://localhost:3000/api';
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const CACHE_TTL = 86400000; // 24 hours
```

**File:** `extension/lib/api-client.js`

```javascript
import { DEFAULT_AGENT_ENDPOINT, REQUEST_TIMEOUT } from './constants.js';

export class AgentAPIClient {
  constructor(endpoint = DEFAULT_AGENT_ENDPOINT) {
    this.endpoint = endpoint;
  }

  async explain(term, context, userLevel = 'beginner') {
    const requestId = this.generateRequestId();

    const requestBody = {
      term,
      context,
      userLevel,
      requestId
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${this.endpoint}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Agent took too long to respond');
      }
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET'
      });

      if (response.ok) {
        return await response.json();
      }

      return { status: 'unhealthy' };
    } catch (error) {
      return { status: 'unreachable', error: error.message };
    }
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }
}
```

#### 2.2 Implement Caching

**File:** `extension/lib/cache.js`

```javascript
import { CACHE_TTL } from './constants.js';

export class QueryCache {
  constructor() {
    this.storageKey = 'bio-for-dummies-cache';
  }

  async get(term, pageUrl) {
    const cacheKey = this.makeCacheKey(term, pageUrl);

    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        const cache = result[this.storageKey] || {};
        const entry = cache[cacheKey];

        if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  async set(term, pageUrl, data) {
    const cacheKey = this.makeCacheKey(term, pageUrl);

    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        const cache = result[this.storageKey] || {};

        cache[cacheKey] = {
          data,
          timestamp: Date.now()
        };

        // Limit cache size (keep last 100 entries)
        const entries = Object.entries(cache);
        if (entries.length > 100) {
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          const limitedCache = Object.fromEntries(entries.slice(0, 100));
          chrome.storage.local.set({ [this.storageKey]: limitedCache }, resolve);
        } else {
          chrome.storage.local.set({ [this.storageKey]: cache }, resolve);
        }
      });
    });
  }

  async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(this.storageKey, resolve);
    });
  }

  makeCacheKey(term, pageUrl) {
    return `${term.toLowerCase()}|${pageUrl}`;
  }
}
```

#### 2.3 Update Background Worker

**File:** `extension/background/service-worker.js`

```javascript
import { AgentAPIClient } from '../lib/api-client.js';
import { QueryCache } from '../lib/cache.js';

const apiClient = new AgentAPIClient();
const cache = new QueryCache();

// Load settings on startup
let settings = {};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  loadSettings();
});

chrome.runtime.onStartup.addListener(() => {
  loadSettings();
});

function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    settings = result.settings || {
      agentEndpoint: 'http://localhost:3000/api',
      userLevel: 'beginner'
    };

    apiClient.setEndpoint(settings.agentEndpoint);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUERY') {
    handleQuery(message.term, message.context, sender.tab.id);
    return true;
  }

  if (message.type === 'SETTINGS_UPDATED') {
    loadSettings();
  }
});

async function handleQuery(term, context, tabId) {
  try {
    // Check cache first
    const cached = await cache.get(term, context.pageUrl);
    if (cached) {
      console.log('Returning cached result');
      chrome.tabs.sendMessage(tabId, {
        type: 'QUERY_RESPONSE',
        data: cached
      });
      return;
    }

    // Call agent API
    console.log('Calling agent API');
    const response = await apiClient.explain(term, context, settings.userLevel);

    // Cache the response
    await cache.set(term, context.pageUrl, response);

    // Send to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'QUERY_RESPONSE',
      data: response
    });

  } catch (error) {
    console.error('Query failed:', error);
    chrome.tabs.sendMessage(tabId, {
      type: 'QUERY_ERROR',
      error: error.message
    });
  }
}
```

**Test:**
1. Start a local agent service (see `claude.md` for simple Flask example)
2. Reload extension
3. Select text and request explanation
4. Verify request goes to agent
5. Verify response displayed in modal
6. Request same term again, verify cache is used

**Deliverables:**
- [ ] API client implemented
- [ ] Caching system working
- [ ] Background worker integrates with agent
- [ ] Error handling in place
- [ ] Works with local agent service

**Time Estimate:** 10-12 hours

---

## Phase 3: Settings & Configuration (Week 3, Days 1-3)

### Objective
Create settings page for users to configure the extension.

### Tasks

#### 3.1 Create Settings Page

**File:** `extension/settings/settings.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bio for Dummies - Settings</title>
  <link rel="stylesheet" href="settings.css">
</head>
<body>
  <div class="container">
    <h1>Bio for Dummies Settings</h1>

    <section>
      <h2>Agent Configuration</h2>

      <label>
        <input type="radio" name="agentType" value="local" id="agentLocal">
        Local Agent (recommended for development)
      </label>

      <label>
        <input type="radio" name="agentType" value="remote" id="agentRemote">
        Remote Agent
      </label>

      <div id="localConfig" class="config-section">
        <label for="localEndpoint">Local Endpoint:</label>
        <input type="text" id="localEndpoint" placeholder="http://localhost:3000/api">
        <button id="testLocal">Test Connection</button>
        <span id="localStatus"></span>
      </div>

      <div id="remoteConfig" class="config-section" style="display: none;">
        <label for="remoteEndpoint">Remote Endpoint:</label>
        <input type="text" id="remoteEndpoint" placeholder="https://api.example.com">
        <button id="testRemote">Test Connection</button>
        <span id="remoteStatus"></span>
      </div>
    </section>

    <section>
      <h2>Display Preferences</h2>

      <label for="userLevel">Explanation Level:</label>
      <select id="userLevel">
        <option value="beginner">Beginner (plain English)</option>
        <option value="intermediate">Intermediate (some technical terms)</option>
        <option value="advanced">Advanced (detailed scientific)</option>
      </select>
    </section>

    <section>
      <h2>Features</h2>

      <label>
        <input type="checkbox" id="voiceEnabled">
        Enable voice input (experimental)
      </label>

      <label>
        <input type="checkbox" id="ttsEnabled">
        Enable text-to-speech
      </label>
    </section>

    <section>
      <h2>Data Management</h2>

      <button id="clearCache">Clear Cache</button>
      <button id="clearHistory">Clear History</button>
    </section>

    <div class="actions">
      <button id="save" class="primary">Save Settings</button>
      <button id="reset">Reset to Defaults</button>
    </div>

    <div id="status" class="status"></div>
  </div>

  <script src="settings.js"></script>
</body>
</html>
```

**File:** `extension/settings/settings.js`

```javascript
// Load current settings
document.addEventListener('DOMContentLoaded', loadSettings);

// Radio button toggle
document.querySelectorAll('input[name="agentType"]').forEach(radio => {
  radio.addEventListener('change', toggleAgentConfig);
});

// Test connection buttons
document.getElementById('testLocal').addEventListener('click', () => testConnection('local'));
document.getElementById('testRemote').addEventListener('click', () => testConnection('remote'));

// Save and reset
document.getElementById('save').addEventListener('click', saveSettings);
document.getElementById('reset').addEventListener('click', resetSettings);

// Clear data
document.getElementById('clearCache').addEventListener('click', clearCache);
document.getElementById('clearHistory').addEventListener('click', clearHistory);

function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || getDefaultSettings();

    document.getElementById('agentLocal').checked = settings.agentType === 'local';
    document.getElementById('agentRemote').checked = settings.agentType === 'remote';
    document.getElementById('localEndpoint').value = settings.localEndpoint;
    document.getElementById('remoteEndpoint').value = settings.remoteEndpoint;
    document.getElementById('userLevel').value = settings.userLevel;
    document.getElementById('voiceEnabled').checked = settings.voiceEnabled;
    document.getElementById('ttsEnabled').checked = settings.ttsEnabled;

    toggleAgentConfig();
  });
}

function saveSettings() {
  const settings = {
    agentType: document.querySelector('input[name="agentType"]:checked').value,
    localEndpoint: document.getElementById('localEndpoint').value,
    remoteEndpoint: document.getElementById('remoteEndpoint').value,
    agentEndpoint: document.querySelector('input[name="agentType"]:checked').value === 'local'
      ? document.getElementById('localEndpoint').value
      : document.getElementById('remoteEndpoint').value,
    userLevel: document.getElementById('userLevel').value,
    voiceEnabled: document.getElementById('voiceEnabled').checked,
    ttsEnabled: document.getElementById('ttsEnabled').checked
  };

  chrome.storage.local.set({ settings }, () => {
    // Notify background worker
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

    showStatus('Settings saved!', 'success');
  });
}

function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    const settings = getDefaultSettings();
    chrome.storage.local.set({ settings }, () => {
      loadSettings();
      chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
      showStatus('Settings reset to defaults', 'success');
    });
  }
}

function getDefaultSettings() {
  return {
    agentType: 'local',
    localEndpoint: 'http://localhost:3000/api',
    remoteEndpoint: '',
    agentEndpoint: 'http://localhost:3000/api',
    userLevel: 'beginner',
    voiceEnabled: false,
    ttsEnabled: false
  };
}

function toggleAgentConfig() {
  const type = document.querySelector('input[name="agentType"]:checked').value;
  document.getElementById('localConfig').style.display = type === 'local' ? 'block' : 'none';
  document.getElementById('remoteConfig').style.display = type === 'remote' ? 'block' : 'none';
}

async function testConnection(type) {
  const endpoint = type === 'local'
    ? document.getElementById('localEndpoint').value
    : document.getElementById('remoteEndpoint').value;

  const statusEl = document.getElementById(`${type}Status`);
  statusEl.textContent = 'Testing...';
  statusEl.className = '';

  try {
    const response = await fetch(`${endpoint}/health`);
    if (response.ok) {
      const data = await response.json();
      statusEl.textContent = `✓ Connected (v${data.version || '?'})`;
      statusEl.className = 'success';
    } else {
      statusEl.textContent = `✗ Failed (${response.status})`;
      statusEl.className = 'error';
    }
  } catch (error) {
    statusEl.textContent = `✗ ${error.message}`;
    statusEl.className = 'error';
  }
}

function clearCache() {
  chrome.storage.local.remove('bio-for-dummies-cache', () => {
    showStatus('Cache cleared', 'success');
  });
}

function clearHistory() {
  chrome.storage.local.remove('bio-for-dummies-history', () => {
    showStatus('History cleared', 'success');
  });
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}
```

#### 3.2 Add Settings Link to Manifest

```json
{
  "options_page": "settings/settings.html"
}
```

#### 3.3 Add Settings Button to Popup

**File:** `extension/popup/popup.html` (updated)

```html
<div id="app">
  <h1>Bio for Dummies</h1>
  <p>Select a biological term on any page to get started!</p>
  <button id="openSettings">Settings</button>
</div>
```

**File:** `extension/popup/popup.js`

```javascript
document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
```

**Test:**
1. Reload extension
2. Right-click extension icon > Options (or click Settings in popup)
3. Verify settings page loads
4. Change settings and save
5. Verify settings persist after reload
6. Test connection check with running agent

**Deliverables:**
- [ ] Settings page functional
- [ ] Agent endpoint configurable
- [ ] Settings persist across reloads
- [ ] Connection test works
- [ ] Clear cache/history works

**Time Estimate:** 8-10 hours

---

## Phase 4: Enhanced UX & Error Handling (Week 3, Days 4-7)

### Objective
Improve user experience with loading states, error messages, and polish.

### Tasks

#### 4.1 Loading States

**File:** `extension/content/content.js` (update)

```javascript
function handleExplainClick() {
  hideFloatingButton();

  // Show loading indicator
  showLoadingIndicator(selectionPosition);

  const context = extractPageContext();

  chrome.runtime.sendMessage({
    type: 'QUERY',
    term: selectedText,
    context: context
  });
}

function showLoadingIndicator(position) {
  const loader = document.createElement('div');
  loader.id = 'bio-for-dummies-loader';
  loader.innerHTML = `
    <div class="spinner"></div>
    <span>Getting explanation...</span>
  `;
  loader.style.position = 'fixed';
  loader.style.top = '20px';
  loader.style.right = '20px';
  loader.style.zIndex = '999999';

  document.body.appendChild(loader);
}

function hideLoadingIndicator() {
  const loader = document.getElementById('bio-for-dummies-loader');
  if (loader) {
    loader.remove();
  }
}

// Update message listener
chrome.runtime.onMessage.addListener((message) => {
  hideLoadingIndicator();

  if (message.type === 'QUERY_RESPONSE') {
    displayExplanation(message.data);
  } else if (message.type === 'QUERY_ERROR') {
    displayError(message.error);
  }
});
```

**File:** `extension/content/content.css` (add spinner)

```css
#bio-for-dummies-loader {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### 4.2 Better Error Messages

```javascript
function displayError(error) {
  const modal = document.createElement('div');
  modal.id = 'bio-for-dummies-modal';
  modal.innerHTML = `
    <div class="modal-content error">
      <span class="close">&times;</span>
      <h2>⚠️ Error</h2>
      <p>${getReadableError(error)}</p>
      <div class="error-actions">
        <button id="retry">Try Again</button>
        <button id="openSettings">Open Settings</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.close').addEventListener('click', () => modal.remove());
  modal.querySelector('#retry').addEventListener('click', () => {
    modal.remove();
    handleExplainClick();
  });
  modal.querySelector('#openSettings').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
    modal.remove();
  });
}

function getReadableError(error) {
  if (error.includes('timeout')) {
    return 'The agent took too long to respond. Please try again or check your connection.';
  }
  if (error.includes('fetch')) {
    return 'Could not connect to the agent. Make sure it\'s running and check your settings.';
  }
  return `Something went wrong: ${error}`;
}
```

#### 4.3 Keyboard Shortcuts

**File:** `extension/manifest.json` (add commands)

```json
{
  "commands": {
    "explain-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+E",
        "mac": "Command+Shift+E"
      },
      "description": "Explain selected text"
    }
  }
}
```

**File:** `extension/background/service-worker.js` (add command listener)

```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'explain-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_EXPLAIN' });
    });
  }
});
```

**File:** `extension/content/content.js` (handle trigger)

```javascript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TRIGGER_EXPLAIN') {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      selectedText = selection.toString().trim();
      handleExplainClick();
    }
  }
  // ... existing code
});
```

**Deliverables:**
- [ ] Loading indicator shown during requests
- [ ] Error messages user-friendly
- [ ] Retry functionality works
- [ ] Keyboard shortcut functional
- [ ] Overall UX polished

**Time Estimate:** 8-10 hours

---

## Phase 5: Advanced Features (Week 4-5)

### Objective
Implement voice input, text-to-speech, and history tracking.

### Tasks

#### 5.1 Voice Input (Optional)

**File:** `extension/content/content.js`

```javascript
let recognition = null;

function initVoiceInput() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      selectedText = transcript;
      handleExplainClick();
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
    };
  }
}

// Add button to trigger voice input
function showVoiceButton() {
  const button = document.createElement('button');
  button.id = 'bio-for-dummies-voice';
  button.textContent = '🎤';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';

  button.addEventListener('click', () => {
    if (recognition) {
      recognition.start();
      button.textContent = '🔴 Listening...';
      recognition.onend = () => {
        button.textContent = '🎤';
      };
    }
  });

  document.body.appendChild(button);
}
```

#### 5.2 Text-to-Speech

**File:** `extension/content/content.js` (update modal)

```javascript
function displayExplanation(data) {
  const modal = document.createElement('div');
  modal.id = 'bio-for-dummies-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${data.term}</h2>

      <button id="speakBtn">🔊 Read Aloud</button>

      <div class="explanation">
        <h3>Quick Summary</h3>
        <p id="shortExplanation">${data.explanation.short}</p>
        <h3>Detailed Explanation</h3>
        <p id="detailedExplanation">${data.explanation.detailed}</p>
      </div>
      <!-- ... rest -->
    </div>
  `;

  document.body.appendChild(modal);

  // Add TTS handler
  modal.querySelector('#speakBtn').addEventListener('click', () => {
    speakText(data.explanation.short + '. ' + data.explanation.detailed);
  });

  // ... existing code
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }
}
```

#### 5.3 History Tracking

**File:** `extension/lib/history.js`

```javascript
export class QueryHistory {
  constructor() {
    this.storageKey = 'bio-for-dummies-history';
    this.maxEntries = 500;
  }

  async add(term, pageUrl, pageTitle) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        const history = result[this.storageKey] || [];

        const entry = {
          id: Date.now(),
          term,
          pageUrl,
          pageTitle,
          timestamp: Date.now(),
          bookmarked: false
        };

        history.unshift(entry);

        // Limit size
        if (history.length > this.maxEntries) {
          history.length = this.maxEntries;
        }

        chrome.storage.local.set({ [this.storageKey]: history }, resolve);
      });
    });
  }

  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        resolve(result[this.storageKey] || []);
      });
    });
  }

  async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(this.storageKey, resolve);
    });
  }
}
```

**File:** `extension/background/service-worker.js` (add history tracking)

```javascript
import { QueryHistory } from '../lib/history.js';

const history = new QueryHistory();

async function handleQuery(term, context, tabId) {
  try {
    // ... existing code

    // Add to history
    await history.add(term, context.pageUrl, context.pageTitle);

    // ... existing code
  } catch (error) {
    // ... error handling
  }
}
```

**Deliverables:**
- [ ] Voice input works (if enabled)
- [ ] Text-to-speech functional
- [ ] History tracked and stored
- [ ] All advanced features configurable

**Time Estimate:** 12-16 hours

---

## Phase 6: Testing & Debugging (Week 6)

### Objective
Thoroughly test the extension and fix bugs.

### Tasks

#### 6.1 Unit Tests

Create tests for key functions using Jest.

**File:** `tests/unit/api-client.test.js`

```javascript
import { AgentAPIClient } from '../../extension/lib/api-client';

describe('AgentAPIClient', () => {
  let client;

  beforeEach(() => {
    client = new AgentAPIClient('http://localhost:3000/api');
  });

  test('should generate unique request IDs', () => {
    const id1 = client.generateRequestId();
    const id2 = client.generateRequestId();
    expect(id1).not.toBe(id2);
  });

  test('should set endpoint correctly', () => {
    client.setEndpoint('https://api.example.com');
    expect(client.endpoint).toBe('https://api.example.com');
  });

  // Add more tests
});
```

Run tests:
```bash
npm test
```

#### 6.2 Manual Testing Checklist

Create a comprehensive testing checklist:

**Functional Tests:**
- [ ] Text selection works on different websites
- [ ] Floating button appears correctly
- [ ] Modal displays explanations
- [ ] Agent API integration works
- [ ] Caching works correctly
- [ ] Settings persist
- [ ] Connection test functional
- [ ] Error handling works
- [ ] Keyboard shortcuts work
- [ ] Voice input works (if enabled)
- [ ] TTS works (if enabled)
- [ ] History tracking works

**Cross-Browser Tests:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Edge

**Performance Tests:**
- [ ] Extension loads quickly
- [ ] No noticeable page slowdown
- [ ] Memory usage acceptable
- [ ] API calls complete in < 5s

**Edge Cases:**
- [ ] Very long selected text
- [ ] Special characters in text
- [ ] Multiple rapid selections
- [ ] Agent unreachable
- [ ] Agent returns error
- [ ] Network timeout

#### 6.3 Debug and Fix Issues

Use Chrome DevTools:
1. Inspect background page: `chrome://extensions` > Details > Inspect views: background page
2. Inspect content script: Right-click page > Inspect > Sources > Content scripts
3. Check console for errors
4. Use `debugger` statements for breakpoints

**Common issues to check:**
- CORS errors (agent needs proper headers)
- Content Security Policy violations
- Manifest permissions
- Storage quota exceeded
- Race conditions in async code

**Deliverables:**
- [ ] Unit tests written and passing
- [ ] Manual testing completed
- [ ] All critical bugs fixed
- [ ] Extension stable and reliable

**Time Estimate:** 12-16 hours

---

## Phase 7: Polish & Documentation (Week 7-8)

### Objective
Final polish, documentation, and preparation for release.

### Tasks

#### 7.1 UI/UX Polish

- [ ] Improve visual design (colors, fonts, spacing)
- [ ] Add animations/transitions
- [ ] Ensure accessibility (ARIA labels, keyboard nav)
- [ ] Test on different screen sizes
- [ ] Dark mode support (optional)

#### 7.2 Create User Documentation

**File:** `README.md`

```markdown
# Bio for Dummies

Instantly understand biological terms while browsing. Highlight any term for a plain-English explanation powered by AI.

## Features

- 🧬 Explain any biological term with one click
- 📚 Get information from reliable sources (PubMed, Wikipedia, UniProt)
- 🎯 Context-aware explanations tailored to what you're reading
- 💾 Smart caching for fast repeat queries
- 🔊 Text-to-speech support (optional)
- 🎤 Voice input (optional)

## Installation

### From Chrome Web Store
1. Visit [Chrome Web Store link]
2. Click "Add to Chrome"
3. Start browsing!

### Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder

## Usage

1. Browse any webpage with biological content
2. Highlight a confusing term (e.g., "cytokine storm")
3. Click the "🧬 Explain" button that appears
4. Read the plain-English explanation

**Keyboard shortcut:** `Ctrl+Shift+E` (Windows) or `Cmd+Shift+E` (Mac)

## Agent Setup

Bio for Dummies requires an AI agent service to provide explanations.

### Quick Start (Local Agent)

See `claude.md` for instructions on setting up a local agent with Claude.

### Using Remote Agent

1. Click extension icon > Settings
2. Select "Remote Agent"
3. Enter your agent URL
4. Click "Test Connection"
5. Save

## Configuration

- **Agent Endpoint:** Local or remote agent URL
- **Explanation Level:** Beginner, Intermediate, or Advanced
- **Voice Input:** Enable microphone for voice queries
- **Text-to-Speech:** Read explanations aloud

## Privacy

- Queries are only sent when you explicitly request an explanation
- No data is collected or tracked by default
- All query history stored locally in your browser
- Works with local agent for complete privacy

## Troubleshooting

**Extension button doesn't appear:**
- Make sure you've selected text (1-100 characters)
- Check that extension is enabled in `chrome://extensions`

**"Could not connect to agent" error:**
- Verify agent service is running
- Check Settings > Agent Endpoint is correct
- Try "Test Connection" in settings

**Explanation takes too long:**
- Check your internet connection
- Verify agent is responding (check agent logs)
- Try clearing cache in settings

## Development

See `implementation_plan.md` for build instructions.

## License

MIT
```

#### 7.3 Create Icons

Create icons in three sizes:
- 16x16 (toolbar)
- 48x48 (extension management)
- 128x128 (Chrome Web Store)

Use a design tool or hire a designer on Fiverr/99designs.

**Icon ideas:**
- DNA helix with book
- Microscope with light bulb
- Brain with biology symbols

#### 7.4 Prepare for Distribution

**File:** Update `manifest.json` for production

```json
{
  "name": "Bio for Dummies",
  "version": "1.0.0",
  "description": "Instantly understand biological terms. Highlight any term for a plain-English AI-powered explanation.",
  "author": "Your Name",
  "homepage_url": "https://github.com/yourusername/bio-for-dummies"
}
```

**Create privacy policy** (required for Chrome Web Store):

**File:** `PRIVACY.md`

```markdown
# Privacy Policy

Bio for Dummies respects your privacy.

## Data Collection

The extension does NOT collect, store, or transmit any personal information.

## Query Data

When you request an explanation:
- Selected text and page context are sent to your configured AI agent
- Queries are cached locally in your browser for performance
- No data is sent to our servers (we don't have any!)

## Third-Party Services

If you use a remote AI agent, data is sent to that service. Please review their privacy policy.

## Permissions

- `activeTab`: Access webpage content only when you click the extension
- `storage`: Store settings and cache locally
- `contextMenus`: Add right-click menu option

## Contact

Questions? Email privacy@example.com
```

**Create screenshots** for Chrome Web Store:
1. Extension in action (highlighting term)
2. Explanation modal
3. Settings page
4. Different use cases (research paper, Wikipedia, news)

#### 7.5 Final Testing

- [ ] Test on fresh Chrome install
- [ ] Test with default settings
- [ ] Verify all links work
- [ ] Check spelling/grammar in all text
- [ ] Ensure no console errors
- [ ] Test installation flow

**Deliverables:**
- [ ] UI polished and professional
- [ ] README comprehensive
- [ ] Icons created
- [ ] Privacy policy written
- [ ] Screenshots prepared
- [ ] Ready for Chrome Web Store submission

**Time Estimate:** 12-16 hours

---

## Phase 8: Deployment (Week 8)

### Objective
Deploy extension to Chrome Web Store and Firefox Add-ons.

### Tasks

#### 8.1 Package Extension

```bash
# Create production build
cd extension
zip -r bio-for-dummies-v1.0.0.zip * -x "*.DS_Store" "*/node_modules/*"
```

Verify package:
- Contains all necessary files
- manifest.json is valid
- No development files (node_modules, .git, etc.)

#### 8.2 Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 one-time registration fee
3. Click "New Item"
4. Upload ZIP file
5. Fill out:
   - Store listing (name, description, category)
   - Upload screenshots
   - Upload promotional images (optional but recommended)
   - Privacy policy
6. Submit for review
7. Wait 1-3 days for approval

**Store Listing Template:**

**Name:** Bio for Dummies

**Summary:** Instantly understand biological terms while browsing

**Description:**
```
Bio for Dummies helps you understand complex biological and medical terms while browsing the web.

🧬 How it works:
1. Highlight any biological term on any webpage
2. Click "Explain"
3. Get a plain-English explanation instantly

✨ Features:
- Context-aware AI explanations
- Reliable sources (PubMed, Wikipedia, UniProt)
- Smart caching for instant repeat queries
- Optional voice input and text-to-speech
- Complete privacy - all data stored locally

Perfect for students, curious readers, journalists, or anyone encountering scientific content online.

⚙️ Setup Required:
This extension requires an AI agent service. See our GitHub for setup instructions.

📖 Open Source:
github.com/yourusername/bio-for-dummies
```

**Category:** Productivity or Education

#### 8.3 Submit to Firefox Add-ons (Optional)

1. Create Firefox-compatible manifest (V2 or V2/V3 hybrid)
2. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
3. Create account
4. Submit add-on
5. Wait for review (usually 1-7 days)

#### 8.4 Create Landing Page (Optional)

Simple GitHub Pages site:

**File:** `docs/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bio for Dummies - Understand Biology While Browsing</title>
  <meta name="description" content="Browser extension to explain biological terms in plain English">
</head>
<body>
  <header>
    <h1>Bio for Dummies</h1>
    <p>Understand biology while browsing</p>
    <a href="[Chrome Web Store link]">Add to Chrome</a>
  </header>

  <section>
    <h2>Features</h2>
    <ul>
      <li>Instant explanations for any biological term</li>
      <li>Plain English, no PhD required</li>
      <li>Reliable sources</li>
      <li>Complete privacy</li>
    </ul>
  </section>

  <section>
    <h2>How It Works</h2>
    <img src="screenshot1.png" alt="Extension in action">
  </section>

  <footer>
    <a href="https://github.com/yourusername/bio-for-dummies">GitHub</a>
    <a href="privacy.html">Privacy Policy</a>
  </footer>
</body>
</html>
```

Enable GitHub Pages in repository settings.

**Deliverables:**
- [ ] Extension packaged
- [ ] Chrome Web Store submission complete
- [ ] Firefox submission complete (optional)
- [ ] Landing page live (optional)
- [ ] Extension available to users

**Time Estimate:** 4-6 hours (plus review wait time)

---

## Post-Launch Tasks

### Monitoring

- Set up error tracking (optional)
- Monitor user reviews and feedback
- Track installation numbers

### Maintenance

- Respond to user issues on GitHub
- Fix bugs reported by users
- Update dependencies
- Ensure compatibility with new browser versions

### Future Enhancements

Based on user feedback, consider:
- Mobile browser support
- Additional languages
- Batch query support
- Integration with note-taking apps
- Community-contributed explanations
- Offline mode with pre-loaded definitions

---

## Development Best Practices

### Code Quality

- Use ESLint for code linting
- Format with Prettier
- Write meaningful commit messages
- Create branches for features
- Use pull requests for code review

### Security

- Never hardcode API keys
- Validate all user inputs
- Sanitize HTML before rendering
- Use HTTPS for all API calls
- Follow OWASP security guidelines

### Performance

- Minimize bundle size
- Lazy-load features
- Cache aggressively
- Debounce expensive operations
- Profile memory usage

### Accessibility

- Full keyboard navigation
- Screen reader support
- High contrast mode
- Respect prefers-reduced-motion
- WCAG 2.1 AA compliance

---

## Troubleshooting Common Issues

### Issue: "Unchecked runtime.lastError"

**Cause:** Not checking for errors in async Chrome API calls

**Solution:**
```javascript
chrome.storage.local.get(['key'], (result) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  // Use result
});
```

### Issue: CORS errors when calling agent

**Cause:** Agent not sending proper CORS headers

**Solution:** Add to agent:
```python
# Flask example
from flask_cors import CORS
CORS(app, origins=["chrome-extension://*"])
```

### Issue: Content script not loading

**Cause:** Incorrect matches pattern or timing

**Solution:** Check manifest.json:
```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],  // Or specific patterns
    "run_at": "document_end"     // Or document_idle
  }]
}
```

### Issue: Extension breaks on some websites

**Cause:** CSS conflicts or JavaScript errors

**Solution:**
- Use unique IDs/classes (prefixed)
- Isolate CSS with Shadow DOM
- Wrap code in try-catch blocks
- Test on popular sites (YouTube, Twitter, etc.)

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 0. Setup | 2 days | Project structure, manifest |
| 1. Core Selection & UI | 4-5 days | Text selection, modal display |
| 2. Agent API | 2-3 days | API client, caching |
| 3. Settings | 2-3 days | Settings page |
| 4. Enhanced UX | 2-3 days | Loading states, error handling |
| 5. Advanced Features | 3-4 days | Voice, TTS, history |
| 6. Testing | 2-3 days | Unit tests, bug fixes |
| 7. Polish | 3-4 days | UI polish, documentation |
| 8. Deployment | 1 day | Package, submit |
| **Total** | **6-8 weeks** | Production-ready extension |

---

## Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Firefox Extension Docs](https://extensionworkshop.com/)

### Tools
- [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)
- [Plasmo Framework](https://www.plasmo.com/) (alternative to manual setup)
- [Extension DevTools](https://chrome.google.com/webstore/detail/extension-reloader)

### Communities
- [r/chrome_extensions](https://reddit.com/r/chrome_extensions)
- [Chrome Extension Discord](https://discord.gg/chrome-extensions)
- Stack Overflow (tag: chrome-extension)

---

## Success Metrics

Track these to measure success:

### User Metrics
- Daily active users (DAU)
- Queries per user per day
- Retention rate (7-day, 30-day)
- Install → first query time

### Quality Metrics
- Average response time
- Cache hit rate
- Error rate
- User ratings/reviews

### Growth Metrics
- New installs per week
- Uninstall rate
- Referral sources
- Feature usage (voice, TTS, etc.)

---

## Conclusion

This implementation plan provides a structured approach to building the Bio for Dummies browser extension. By following these phases sequentially, you'll build a robust, user-friendly extension that integrates cleanly with an AI agent service.

Remember:
- Start simple, iterate based on feedback
- Focus on core functionality first (Phases 0-3)
- Test thoroughly before adding features
- Keep the extension lightweight and fast
- Prioritize user privacy and security

Good luck building! 🚀
