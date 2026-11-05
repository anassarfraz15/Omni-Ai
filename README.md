# OMNIA AI — Private Multi-Model AI Comparison & Unified Chat Workspace
## Personal AI Research Laboratory

OMNIA AI is a private, single-user, local-first web application designed to evaluate and compare the four frontier AI platforms simultaneously:
1. **ChatGPT** by OpenAI
2. **Gemini** by Google
3. **Claude** by Anthropic
4. **Grok** by xAI

### Core Mission
**ONE PROMPT → FOUR AI MODELS → FOUR INDEPENDENT RESPONSES → ONE COMPARISON WORKSPACE.**

---

## 1. Architectural Highlights

- **Local-First & Private**: Runs on `http://localhost:3000`. No public registration, no telemetry, no multi-tenant database.
- **Simultaneous Execution**: Concurrent requests executed via `Promise.allSettled` and streamed independently in real time over Server-Sent Events (SSE).
- **Independent Conversation Histories**: Each model maintains its own multi-turn memory without cross-contamination.
- **Dual Connection Modes**:
  1. **Official APIs**: Fast direct streaming using `@google/genai`, OpenAI, Anthropic, and xAI with encrypted local key storage.
  2. **Local Browser Session Adapter**: Optional integration connecting directly to authenticated browser tabs (`chatgpt.com`, `gemini.google.com`, `claude.ai`, `grok.com`) with **strict zero-cookie and zero-password policies**.
- **Compare & Analyze Engine**: In-depth evaluative synthesis identifying points of consensus, divergence, unique model insights, and reasoning strengths.
- **Prompt Parity Verification**: Real-time SHA-256 fingerprinting ensures all models receive the exact byte-for-byte identical prompt.
- **Local Persistence**: File-backed storage at `.data/omnia_storage.json` with 1-click JSON/Markdown export, backup, and complete data wipe.

---

## 2. Quickstart & Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm (installed with Node.js)

### Installation (Windows, macOS, Linux)

1. Clone or extract the repository:
   ```bash
   cd omnia-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):
   Create a `.env` file based on `.env.example`:
   ```env
   # Google Gemini API Key (injected automatically in AI Studio)
   GEMINI_API_KEY="your-gemini-key"

   # Optional keys (can also be entered directly in Model Settings in the UI)
   OPENAI_API_KEY="your-openai-key"
   ANTHROPIC_API_KEY="your-anthropic-key"
   XAI_API_KEY="your-xai-key"
   ```

4. Start OMNIA AI:
   ```bash
   npm run dev
   ```

5. Open your browser:
   Visit [http://localhost:3000](http://localhost:3000)

---

## 3. Windows Setup Guide (PowerShell / Command Prompt)

1. Open PowerShell or Terminal.
2. Run:
   ```powershell
   npm install
   npm run dev
   ```
3. To build for production on Windows:
   ```powershell
   npm run build
   npm run start
   ```

---

## 4. Local Browser Extension Bridge (Zero-Cookie)

To connect your existing browser logins without API keys:

1. Open **Chrome**, **Brave**, or **Edge**.
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the `public/browser-extension` folder inside this directory.
6. Open your regular tabs for:
   - [ChatGPT](https://chatgpt.com)
   - [Gemini](https://gemini.google.com)
   - [Claude](https://claude.ai)
   - [Grok](https://grok.com)
7. In OMNIA AI, switch the respective provider to **Local Browser Session** in Model Settings!

---

## 5. Security & Privacy Audit Verification

| Privacy Principle | Implementation |
|---|---|
| **Zero Cookie Extraction** | Verified. No cookies are read, transferred, or stored in SQLite. |
| **Zero Password Collection** | Verified. Passwords are never requested or handled. |
| **Localhost Isolation** | Verified. Server binds strictly to localhost port 3000. |
| **No External Telemetry** | Verified. No Google Analytics, Mixpanel, or ad trackers. |
| **Local Data Storage** | Verified. `.data/omnia_storage.json` stays on your machine. |

---

## 6. Keyboard Shortcuts

- `Enter`: Send prompt to all selected models
- `Shift + Enter`: New line in composer
- `Cmd + Enter` / `Ctrl + Enter`: Send prompt
- `Cmd + N` / `Ctrl + N`: New Comparison
- `Escape`: Close modals and full-screen viewers
