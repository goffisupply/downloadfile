// background.js
// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askGemini",
    title: "Ask Gemini",
    contexts: ["selection"]
  });
  console.log("Context menu created");
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askGemini" && info.selectionText) {
    console.log("Selected text:", info.selectionText);
    processSelectedText(info.selectionText, tab.id);
  }
});

async function processSelectedText(selectedText, tabId) {
  try {
    console.log("Processing text for tab:", tabId);
    
    // Inject content script if needed
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"]
      });
      console.log("Content script injected");
    } catch (error) {
      console.log("Content script may already be loaded or failed to inject:", error);
    }
    
    // Get settings
    const settings = await chrome.storage.sync.get(['apiKey', 'speakRate']);
    
    if (!settings.apiKey) {
      console.error("API key not set");
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: "API key not set. Please set your Gemini API key in the extension settings."
      });
      return;
    }
    
    // Notify user that we're processing
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: "Querying Gemini..."
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
    
    // Query Gemini API
    console.log("Querying Gemini API");
    const response = await queryGeminiAPI(selectedText, settings.apiKey);
    console.log("Got response:", response);
    
    // Send response to content script for speech
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "speakResponse",
        response: response,
        speakRate: settings.speakRate || 150
      });
      console.log("Sent speech command to content script");
    } catch (error) {
      console.error("Error sending speech command:", error);
      // Try injecting the content script again
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"]
      });
      
      // Try again after a short delay
      setTimeout(async () => {
        await chrome.tabs.sendMessage(tabId, {
          action: "speakResponse",
          response: response,
          speakRate: settings.speakRate || 150
        });
      }, 500);
    }
  } catch (error) {
    console.error("Error processing selected text:", error);
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: "Error: " + error.message
      });
    } catch (contentError) {
      console.error("Could not send error notification:", contentError);
    }
  }
}

async function queryGeminiAPI(text, apiKey) {
  try {
    // Updated to use Gemini 2.0 model, which is the current production model
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const fullUrl = `${url}?key=${apiKey}`;
    
    console.log("Sending request to Gemini API");
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: text
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}