// background.js
importScripts('config.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "shorten-link",
    title: "Shorten this link",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "shorten-selection",
    title: "Shorten selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let urlToShorten = null;

  if (info.menuItemId === "shorten-link") {
    urlToShorten = info.linkUrl;
  } else if (info.menuItemId === "shorten-selection") {
    const text = info.selectionText.trim();
    if (/^https?:\/\//i.test(text)) {
      urlToShorten = text;
    } else {
      showNotification('Error', 'Selected text is not a valid URL.');
      return;
    }
  }

  if (urlToShorten) {
    try {
      const storage = await chrome.storage.local.get('token');
      const token = storage.token;
      
      let endpoint = `${CONFIG.API_BASE_URL}/api/guest/shorten`;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        endpoint = `${CONFIG.API_BASE_URL}/api/urls`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url: urlToShorten })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to shorten URL');
      }

      const finalUrl = data.shortUrl || (data.url && data.url.shortUrl) || `${CONFIG.API_BASE_URL}/${data.shortCode}`;
      
      // Inject content script logic to copy to clipboard in the active tab context
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          chrome.tabs.sendMessage(tab.id, { action: 'copyToClipboard', text: finalUrl });
        });
      }

      showNotification('Success', 'Short URL copied to clipboard!');
    } catch (error) {
      showNotification('Error', error.message);
    }
  }
});

function showNotification(title, message) {
  // Use a transparent 1x1 pixel base64 image as fallback icon
  const fallbackIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: fallbackIcon,
    title: title,
    message: message
  });
}
