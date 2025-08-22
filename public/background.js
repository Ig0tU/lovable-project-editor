
// Background script for Chrome extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'YOOtheme Alchemy Suite Installed!',
      message: 'Click the extension icon to start modifying web pages with natural language.'
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (this is handled automatically by manifest.json)
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: request.title || 'YOOtheme Alchemy Suite',
      message: request.message
    });
  }
  
  sendResponse({ success: true });
});

// Context menu integration
chrome.contextMenus.create({
  id: 'yootheme-quick-modify',
  title: 'Quick Modify with YOOtheme',
  contexts: ['all']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'yootheme-quick-modify') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleAgent'
    });
  }
});
