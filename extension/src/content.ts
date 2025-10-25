// Content script that runs on web pages

console.log('Bio for Dummies content script loaded');

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_CONTEXT') {
    const context = {
      url: window.location.href,
      title: document.title,
      selection: window.getSelection()?.toString() || '',
      surroundingText: getSelectedTextContext()
    };
    
    sendResponse({ context });
  }
  
  return false;
});

function getSelectedTextContext(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return '';
  }
  
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  // Get the parent element's text content for context
  const parentElement = container.nodeType === Node.TEXT_NODE 
    ? container.parentElement 
    : container as Element;
  
  if (parentElement) {
    return parentElement.textContent?.slice(0, 500) || '';
  }
  
  return '';
}

// Highlight-to-explain feature (future enhancement)
document.addEventListener('mouseup', () => {
  const selection = window.getSelection()?.toString();
  if (selection && selection.trim().length > 2) {
    // Could show a floating button here to trigger explanation
    console.log('Selected text:', selection);
  }
});

export {};

