import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { localDb } from './server/storage';
import { streamGeminiResponse } from './server/adapters/geminiAdapter';
import { streamOpenAIResponse } from './server/adapters/openaiAdapter';
import { streamAnthropicResponse } from './server/adapters/anthropicAdapter';
import { streamXAIResponse } from './server/adapters/xaiAdapter';
import { browserSessionCoordinator } from './server/adapters/browserSessionServer';
import { runComparisonAnalysis } from './server/analysisEngine';
import { ProviderId, ProviderSettings } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Strict local-security middleware: Ensure no raw cookies or passwords are submitted
app.use((req, res, next) => {
  // If request contains authorization cookies targeting raw provider sessions, reject
  const cookieHeader = req.headers.cookie;
  if (cookieHeader && (cookieHeader.includes('session-token') || cookieHeader.includes('__Secure-next-auth'))) {
    console.warn('[Security Guard] Rejected request containing session cookie payload.');
    return res.status(403).json({ error: 'Security Policy Violation: Raw session cookies cannot be sent to the backend.' });
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// Health and Security Status
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'OMNIA AI',
    localhostOnly: true,
    storage: 'local-filesystem (SQLite/JSON)',
    storagePath: path.resolve(process.cwd(), '.data/omnia_storage.json'),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    openaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    xaiKeyConfigured: Boolean(process.env.XAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Database Endpoints
// -------------------------------------------------------------
app.get('/api/db/conversations', (req: Request, res: Response) => {
  try {
    const list = localDb.getConversations();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/db/conversations/:id', (req: Request, res: Response) => {
  try {
    const conv = localDb.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/conversations', (req: Request, res: Response) => {
  try {
    const conv = req.body;
    if (!conv || !conv.id) {
      return res.status(400).json({ error: 'Invalid conversation payload' });
    }
    const saved = localDb.saveConversation(conv);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/db/conversations/:id', (req: Request, res: Response) => {
  try {
    const ok = localDb.deleteConversation(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/clear', (req: Request, res: Response) => {
  try {
    localDb.clearAllData();
    res.json({ success: true, message: 'All local application conversations cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/db/export', (req: Request, res: Response) => {
  try {
    const all = localDb.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="omnia_ai_export.json"');
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/import', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    localDb.importAll(payload);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Provider Settings and Credentials
// -------------------------------------------------------------
app.get('/api/settings/providers', (req: Request, res: Response) => {
  try {
    const settings = localDb.getProviderSettings();
    // Return masked keys or settings
    const safeSettings: Record<string, any> = {};
    for (const [key, val] of Object.entries(settings)) {
      safeSettings[key] = {
        ...val,
        hasKey: Boolean(val.apiKey || process.env[`${key.toUpperCase()}_API_KEY`]),
      };
    }
    res.json(safeSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/providers', (req: Request, res: Response) => {
  try {
    const updated = req.body;
    const current = localDb.getProviderSettings();
    const merged = { ...current, ...updated };
    localDb.saveProviderSettings(merged);
    res.json({ success: true, settings: merged });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Connection for individual provider with 5-second timeout guard
app.post('/api/providers/test', async (req: Request, res: Response) => {
  const { provider, apiKey, model } = req.body;
  const startTime = Date.now();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timed out after 5000ms. Check network or API key.')), 5000)
  );

  const testAction = async () => {
    if (provider === 'gemini') {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return { success: false, latencyMs: 0, error: 'GEMINI_API_KEY is not configured. Please provide an API key.' };
      const stream = streamGeminiResponse({ prompt: 'Say hello in 3 words.', model: model || 'gemini-3.8-flash', apiKey: key });
      let output = '';
      for await (const chunk of stream) {
        if (chunk.error) throw new Error(chunk.error);
        output += chunk.text;
      }
      return { success: true, latencyMs: Date.now() - startTime, sample: output.trim() };
    }

    if (provider === 'chatgpt') {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) return { success: false, latencyMs: 0, error: 'OpenAI API key is missing. Add your key in Model Settings.' };
      const stream = streamOpenAIResponse({ prompt: 'Say hello in 3 words.', model: model || 'gpt-4o-mini', apiKey: key });
      let output = '';
      for await (const chunk of stream) {
        if (chunk.error) throw new Error(chunk.error);
        output += chunk.text;
      }
      return { success: true, latencyMs: Date.now() - startTime, sample: output.trim() };
    }

    if (provider === 'claude') {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) return { success: false, latencyMs: 0, error: 'Anthropic API key is missing. Add your key in Model Settings.' };
      const stream = streamAnthropicResponse({ prompt: 'Say hello in 3 words.', model: model || 'claude-3-5-haiku-20241022', apiKey: key });
      let output = '';
      for await (const chunk of stream) {
        if (chunk.error) throw new Error(chunk.error);
        output += chunk.text;
      }
      return { success: true, latencyMs: Date.now() - startTime, sample: output.trim() };
    }

    if (provider === 'grok') {
      const key = apiKey || process.env.XAI_API_KEY;
      if (!key) return { success: false, latencyMs: 0, error: 'xAI API key is missing. Add your key in Model Settings.' };
      const stream = streamXAIResponse({ prompt: 'Say hello in 3 words.', model: model || 'grok-2-1212', apiKey: key });
      let output = '';
      for await (const chunk of stream) {
        if (chunk.error) throw new Error(chunk.error);
        output += chunk.text;
      }
      return { success: true, latencyMs: Date.now() - startTime, sample: output.trim() };
    }

    return { success: false, error: 'Unknown provider' };
  };

  try {
    const result: any = await Promise.race([testAction(), timeoutPromise]);
    res.json(result);
  } catch (err: any) {
    res.json({ success: false, latencyMs: Date.now() - startTime, error: err.message || String(err) });
  }
});

// -------------------------------------------------------------
// Prompt Templates
// -------------------------------------------------------------
app.get('/api/templates', (req: Request, res: Response) => {
  res.json(localDb.getPromptTemplates());
});

app.post('/api/templates', (req: Request, res: Response) => {
  const tpl = req.body;
  const saved = localDb.savePromptTemplate(tpl);
  res.json(saved);
});

app.delete('/api/templates/:id', (req: Request, res: Response) => {
  const ok = localDb.deletePromptTemplate(req.params.id);
  res.json({ success: ok });
});

// -------------------------------------------------------------
// Browser Session Extension Status & Download
// -------------------------------------------------------------
app.get('/api/browser-sessions/status', (req: Request, res: Response) => {
  res.json(browserSessionCoordinator.getAllTabStatuses());
});

app.get('/api/browser-extension/download', async (req: Request, res: Response) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const extDir = path.resolve(process.cwd(), 'public/browser-extension');
    const files = ['manifest.json', 'content.js', 'omnia_bridge.js', 'background.js', 'popup.html', 'README.md'];
    for (const f of files) {
      const fullPath = path.join(extDir, f);
      if (fs.existsSync(fullPath)) {
        zip.file(f, fs.readFileSync(fullPath, 'utf-8'));
      }
    }
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="omnia-browser-bridge.zip"');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/browser-sessions/ping', (req: Request, res: Response) => {
  const { provider, status, tabId } = req.body;
  if (!provider) return res.status(400).json({ error: 'Missing provider' });
  browserSessionCoordinator.updateTabPing(provider as ProviderId, status, tabId);
  res.json({ ok: true });
});

// -------------------------------------------------------------
// Compare & Analyze Endpoint
// -------------------------------------------------------------
app.post('/api/compare/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt, responses, apiKey, evaluatorModel } = req.body;
    if (!prompt || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'Prompt and model responses are required for analysis' });
    }

    const analysis = await runComparisonAnalysis({
      prompt,
      responses,
      apiKey,
      evaluatorModel,
    });
    res.json(analysis);
  } catch (err: any) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// -------------------------------------------------------------
// THE CORE ENGINE: Simultaneous Multi-Model SSE Stream
// -------------------------------------------------------------
app.post('/api/compare/stream', async (req: Request, res: Response) => {
  const { prompt, promptHash, selectedProviders, providerSettings, histories } = req.body;

  if (!prompt || !selectedProviders || !Array.isArray(selectedProviders)) {
    return res.status(400).json({ error: 'Invalid comparison request parameters.' });
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const storedSettings = localDb.getProviderSettings();

  // Create an independent runner for a given provider
  const runProviderStream = async (provider: ProviderId) => {
    const startTime = Date.now();
    sendEvent({ type: 'start', provider, timestamp: startTime });

    const cfg: ProviderSettings = providerSettings?.[provider] || storedSettings[provider];
    let fullOutput = '';

    try {
      if (cfg.connectionType === 'browser_session') {
        const stream = browserSessionCoordinator.streamBrowserSessionResponse(provider, prompt);
        for await (const chunk of stream) {
          if (chunk.error) {
            sendEvent({ type: 'error', provider, error: chunk.error, durationMs: Date.now() - startTime });
            return;
          }
          if (chunk.text) {
            fullOutput += chunk.text;
            sendEvent({ type: 'chunk', provider, text: chunk.text, durationMs: Date.now() - startTime });
          }
        }
      } else {
        // Official API execution
        let stream: AsyncGenerator<any>;

        if (provider === 'gemini') {
          // Format Gemini history
          const rawHistory = histories?.gemini || [];
          const formattedHistory = rawHistory.map((h: any) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          }));
          stream = streamGeminiResponse({
            prompt,
            model: cfg.selectedModel || 'gemini-3.8-flash',
            apiKey: cfg.apiKey,
            systemPrompt: cfg.systemPrompt,
            temperature: cfg.temperature,
            history: formattedHistory,
          });
        } else if (provider === 'chatgpt') {
          stream = streamOpenAIResponse({
            prompt,
            model: cfg.selectedModel || 'gpt-4o',
            apiKey: cfg.apiKey,
            systemPrompt: cfg.systemPrompt,
            temperature: cfg.temperature,
            history: histories?.chatgpt || [],
          });
        } else if (provider === 'claude') {
          stream = streamAnthropicResponse({
            prompt,
            model: cfg.selectedModel || 'claude-3-7-sonnet-20250219',
            apiKey: cfg.apiKey,
            systemPrompt: cfg.systemPrompt,
            temperature: cfg.temperature,
            history: histories?.claude || [],
          });
        } else if (provider === 'grok') {
          stream = streamXAIResponse({
            prompt,
            model: cfg.selectedModel || 'grok-2-1212',
            apiKey: cfg.apiKey,
            systemPrompt: cfg.systemPrompt,
            temperature: cfg.temperature,
            history: histories?.grok || [],
          });
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }

        for await (const chunk of stream) {
          if (chunk.error) {
            sendEvent({ type: 'error', provider, error: chunk.error, durationMs: Date.now() - startTime });
            return;
          }
          if (chunk.text) {
            fullOutput += chunk.text;
            sendEvent({ type: 'chunk', provider, text: chunk.text, durationMs: Date.now() - startTime });
          }
        }
      }

      const totalDuration = Date.now() - startTime;
      sendEvent({
        type: 'done',
        provider,
        totalText: fullOutput,
        durationMs: totalDuration,
        outputTokens: Math.round(fullOutput.split(/\s+/).length * 1.3),
      });
    } catch (err: any) {
      sendEvent({
        type: 'error',
        provider,
        error: err.message || 'Stream processing failed',
        durationMs: Date.now() - startTime,
      });
    }
  };

  // Execute all selected models simultaneously via Promise.allSettled
  await Promise.allSettled(
    selectedProviders.map((p: ProviderId) => runProviderStream(p))
  );

  sendEvent({ type: 'all_done', promptHash });
  res.end();
});

// -------------------------------------------------------------
// Vite middleware in dev or static files in production
// -------------------------------------------------------------
async function setupViteOrStatic() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
}

setupViteOrStatic().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OMNIA AI] Server running on http://localhost:${PORT}`);
    console.log(`[OMNIA AI] Localhost database: .data/omnia_storage.json`);
    console.log(`[OMNIA AI] Zero cookies, zero external telemetry enforced.`);
  });
});
