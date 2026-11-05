# OMNIA AI — Local Browser Extension Bridge
### 3-Step Setup for Windows, macOS, and Linux

This extension enables OMNIA AI (`http://localhost:3000`) to communicate with your existing authenticated browser sessions on ChatGPT, Gemini, Claude, and Grok without extracting session cookies or requiring API keys.

---

### Strict Security & Zero-Cookie Policy
1. **Zero Cookie Access**: The extension does NOT read or copy session cookies.
2. **Zero Password Collection**: Your account password is never collected.
3. **Localhost Only**: Communicates exclusively with `http://localhost:3000`.
4. **Tab Isolation**: Each model runs in its own official browser tab without cross-contamination.

---

### Installation Instructions (Chrome / Brave / Edge)

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`
   - **Edge**: `edge://extensions/`
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `public/browser-extension` folder inside your OMNIA AI project.
5. Done! Now keep your ChatGPT, Gemini, Claude, and Grok tabs open in your browser, and OMNIA AI will detect them automatically.
