// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyToClipboard') {
    navigator.clipboard.writeText(request.text).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = request.text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        sendResponse({ success: true });
      } catch (ex) {
        sendResponse({ success: false, error: ex.message });
      }
      document.body.removeChild(textArea);
    });
    return true; // Keep channel open for async response
  }
});
