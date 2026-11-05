/**
 * OMNIA AI - Webpage Bridge Content Script
 * 
 * Runs on the OMNIA AI workspace (localhost & preview URLs).
 * Enables the OMNIA AI webpage to detect the installed extension and
 * query active provider tabs without accessing cookies or sensitive tokens.
 */

// Mark on DOM so the app can instantly detect the extension
document.documentElement.setAttribute('data-omnia-bridge-installed', 'true');
window.__OMNIA_BRIDGE_ACTIVE__ = true;

// Notify the page immediately
window.postMessage({
  source: 'OMNIA_EXTENSION_BRIDGE',
  type: 'BRIDGE_READY',
  version: '1.0.1',
}, '*');

// Listen for messages from the OMNIA AI app
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'OMNIA_APP') return;

  if (data.type === 'PING') {
    window.postMessage({
      source: 'OMNIA_EXTENSION_BRIDGE',
      type: 'PONG',
      installed: true,
      timestamp: Date.now(),
    }, '*');
  }

  if (data.type === 'CHECK_TABS') {
    chrome.runtime.sendMessage({ type: 'QUERY_TABS' }, (response) => {
      window.postMessage({
        source: 'OMNIA_EXTENSION_BRIDGE',
        type: 'TABS_STATUS',
        tabs: response || {},
      }, '*');
    });
  }
});

// Periodic ping to keep connection state synchronized
chrome.runtime.sendMessage({ type: 'QUERY_TABS' }, (response) => {
  if (response) {
    window.postMessage({
      source: 'OMNIA_EXTENSION_BRIDGE',
      type: 'TABS_STATUS',
      tabs: response,
    }, '*');
  }
});
