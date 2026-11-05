/**
 * OMNIA AI - Background Service Worker
 * 
 * Coordinates local tab discovery using Chrome Tabs API without
 * collecting, reading, or storing session cookies or passwords.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[OMNIA AI Bridge] Background service worker initialized.');
});

// Listen for tab queries from the OMNIA AI webpage content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUERY_TABS') {
    chrome.tabs.query({}, (tabs) => {
      const activeTabs = {
        chatgpt: false,
        gemini: false,
        claude: false,
        grok: false,
      };

      for (const tab of tabs) {
        if (!tab.url) continue;
        if (tab.url.includes('chatgpt.com')) activeTabs.chatgpt = true;
        if (tab.url.includes('gemini.google.com') || tab.url.includes('google.com/gemini')) activeTabs.gemini = true;
        if (tab.url.includes('claude.ai')) activeTabs.claude = true;
        if (tab.url.includes('grok.com')) activeTabs.grok = true;
      }

      sendResponse(activeTabs);
    });
    return true; // Indicates async response
  }
});
