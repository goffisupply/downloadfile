// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'speakRate'], function(items) {
    if (items.apiKey) {
      document.getElementById('apiKey').value = items.apiKey;
    }
    if (items.speakRate) {
      document.getElementById('speakRate').value = items.speakRate;
    }
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const speakRate = document.getElementById('speakRate').value;
    
    if (!apiKey) {
      showStatus('Please enter a valid API key', false);
      return;
    }
    
    chrome.storage.sync.set({
      apiKey: apiKey,
      speakRate: speakRate
    }, function() {
      showStatus('Settings saved successfully!', true);
    });
  });
  
  function showStatus(message, isSuccess) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'status success' : 'status error';
    
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
});