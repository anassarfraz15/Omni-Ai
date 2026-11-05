import { StreamChunk } from './geminiAdapter';

export async function* streamXAIResponse(params: {
  prompt: string;
  model: string;
  apiKey?: string;
  systemPrompt?: string;
  temperature?: number;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): AsyncGenerator<StreamChunk> {
  const effectiveKey = params.apiKey || process.env.XAI_API_KEY;

  if (!effectiveKey) {
    yield {
      text: '',
      isComplete: true,
      error: 'xAI API key is missing. Add your API key in Model Settings or provide XAI_API_KEY.',
    };
    return;
  }

  const model = params.model || 'grok-2-1212';

  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: 'system', content: params.systemPrompt });
  }
  if (params.history && params.history.length > 0) {
    messages.push(...params.history);
  }
  messages.push({ role: 'user', content: params.prompt });

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: params.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      yield {
        text: '',
        isComplete: true,
        error: `Grok Error: ${errMsg}`,
      };
      return;
    }

    if (!response.body) {
      yield {
        text: '',
        isComplete: true,
        error: 'xAI returned an empty response body.',
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') {
          yield { text: '', isComplete: true };
          return;
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              yield { text: delta, isComplete: false };
            }
          } catch {
            // ignore JSON parse error on partial chunks
          }
        }
      }
    }

    yield { text: '', isComplete: true };
  } catch (err: any) {
    yield {
      text: '',
      isComplete: true,
      error: `Grok Connection Error: ${err.message || String(err)}`,
    };
  }
}
