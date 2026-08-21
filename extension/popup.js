document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('urlInput');
  const shortenBtn = document.getElementById('shortenBtn');
  const resultContainer = document.getElementById('resultContainer');
  const shortUrlInput = document.getElementById('shortUrl');
  const copyBtn = document.getElementById('copyBtn');
  const messageEl = document.getElementById('message');

  // Get current active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      const currentUrl = tabs[0].url;
      // Filter out non-http URLs (like chrome://)
      if (currentUrl.startsWith('http')) {
        urlInput.value = currentUrl;
      }
    }
  });

  const showMessage = (msg, type) => {
    messageEl.textContent = msg;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3000);
  };

  shortenBtn.addEventListener('click', async () => {
    const urlToShorten = urlInput.value.trim();
    if (!urlToShorten) {
      showMessage('Please enter a URL', 'error');
      return;
    }

    try {
      shortenBtn.disabled = true;
      shortenBtn.textContent = 'Shortening...';

      // Get token if exists
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

      // Display result
      const finalUrl = data.shortUrl || (data.url && data.url.shortUrl) || `${CONFIG.API_BASE_URL}/${data.shortCode}`;
      shortUrlInput.value = finalUrl;

      resultContainer.classList.remove('hidden');
      showMessage('URL shortened successfully!', 'success');

    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      shortenBtn.disabled = false;
      shortenBtn.textContent = 'Shorten URL';
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shortUrlInput.value);
      showMessage('Copied to clipboard!', 'success');
    } catch (err) {
      shortUrlInput.select();
      document.execCommand('copy');
      showMessage('Copied to clipboard!', 'success');
    }
  });
});
