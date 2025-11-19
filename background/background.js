// background/background.js

// Listen untuk installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Forms Auto-Fill extension installed');
});

// Optional: Listen untuk messages dari content script atau popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Placeholder untuk future features
  return true;
});