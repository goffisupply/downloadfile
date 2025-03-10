// content.js
// Create notification element
let notificationElement = null;
let speechSynthesisUtterance = null;

function createNotificationElement() {
  if (notificationElement) return;
  
  notificationElement = document.createElement('div');
  notificationElement.style.position = 'fixed';
  notificationElement.style.bottom = '20px';
  notificationElement.style.right = '20px';
  notificationElement.style.backgroundColor = '#4285F4';
  notificationElement.style.color = 'white';
  notificationElement.style.padding = '10px 15px';
  notificationElement.style.borderRadius = '4px';
  notificationElement.style.zIndex = '10000';
  notificationElement.style.maxWidth = '300px';
  notificationElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notificationElement.style.display = 'none';
  
  document.body.appendChild(notificationElement);
}

function showNotification(message, duration = 3000) {
  createNotificationElement();
  
  notificationElement.textContent = message;
  notificationElement.style.display = 'block';
  
  setTimeout(() => {
    notificationElement.style.display = 'none';
  }, duration);
}

function speakText(text, rate = 150) {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Make sure we have text to speak
  if (!text || text.trim() === '') {
    showNotification("Error: No text to speak", 3000);
    return;
  }
  
  // Create new utterance
  speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
  speechSynthesisUtterance.rate = rate / 100;
  
  // Add event listeners for debugging
  speechSynthesisUtterance.onstart = () => {
    console.log("Speech started");
    showNotification("Speaking...", 2000);
  };
  
  speechSynthesisUtterance.onend = () => {
    console.log("Speech ended");
  };
  
  speechSynthesisUtterance.onerror = (event) => {
    console.error("Speech error:", event);
    showNotification("Speech error: " + event.error, 3000);
  };
  
  // Start speaking
  window.speechSynthesis.speak(speechSynthesisUtterance);
  
  // Show what's being spoken
  showNotification("Gemini says: " + (text.length > 50 ? text.substring(0, 50) + "..." : text), 5000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.action === "showNotification") {
    showNotification(message.message);
    sendResponse({ status: "success" });
  } else if (message.action === "speakResponse") {
    console.log("Speaking response:", message.response);
    try {
      speakText(message.response, message.speakRate);
      sendResponse({ status: "success" });
    } catch (error) {
      console.error("Speech error:", error);
      showNotification("Error with speech: " + error.message, 5000);
      sendResponse({ status: "error", message: error.message });
    }
  }
  return true;
});

// Notify that content script is loaded
console.log("Gemini Voice Assistant content script loaded");

// Test speech synthesis on load
setTimeout(() => {
  try {
    const voices = window.speechSynthesis.getVoices();
    console.log("Available voices:", voices.length);
  } catch (error) {
    console.error("Error accessing speech synthesis:", error);
  }
}, 1000);