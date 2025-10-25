// Background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Bio for Dummies Voice extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.type === 'GET_PAGE_CONTEXT') {
    // Forward to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTEXT' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true; // Keep channel open for async response
  }
  
  return false;
});

export {};

