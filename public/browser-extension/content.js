/**
 * OMNIA AI - Content Script
 * 
 * Strict Zero-Cookie & Privacy Policy:
 * This script interacts only with the visible DOM composer of the provider
 * when the user explicitly triggers a prompt from OMNIA AI.
 * It NEVER reads cookies, tokens, or local storage credentials.
 */

const hostname = window.location.hostname;
let provider = 'unknown';

if (hostname.includes('chatgpt.com')) provider = 'chatgpt';
else if (hostname.includes('gemini.google.com')) provider = 'gemini';
else if (hostname.includes('claude.ai')) provider = 'claude';
else if (hostname.includes('grok.com')) provider = 'grok';

console.log(`[OMNIA AI Bridge] Initialized on ${provider} tab.`);

// Notify background worker of active authenticated session tab
chrome.runtime.sendMessage({
  type: 'PROVIDER_TAB_ACTIVE',
  provider,
  url: window.location.href,
});

// Listen for execution commands from OMNIA AI application
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_STATUS') {
    // Check if input element is present (means logged in)
    let composer = null;
    if (provider === 'chatgpt') composer = document.querySelector('#prompt-textarea');
    else if (provider === 'gemini') composer = document.querySelector('.ql-editor') || document.querySelector('rich-textarea');
    else if (provider === 'claude') composer = document.querySelector('fieldset [contenteditable="true"]') || document.querySelector('.ProseMirror');
    else if (provider === 'grok') composer = document.querySelector('textarea');

    sendResponse({
      provider,
      status: composer ? 'connected' : 'login_required',
      url: window.location.href,
    });
    return true;
  }
});
