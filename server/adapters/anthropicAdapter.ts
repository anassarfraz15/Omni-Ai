import { StreamChunk } from './geminiAdapter';

export async function* streamAnthropicResponse(params: {
  prompt: string;
  model: string;
  apiKey?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): AsyncGenerator<StreamChunk> {
  const effectiveKey = params.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!effectiveKey) {
    yield {
      text: '',
      isComplete: true,
      error: 'Anthropic API key is missing. Add your API key in Model Settings or provide ANTHROPIC_API_KEY.',
    };
    return;
  }

  const model = params.model || 'claude-3-7-sonnet-20250219';

  const messages: any[] = [];
  if (params.history && params.history.length > 0) {
    messages.push(...params.history);
  }
  messages.push({ role: 'user', content: params.prompt });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages,
        system: params.systemPrompt || undefined,
        max_tokens: params.maxTokens || 4096,
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
        error: `Claude Error: ${errMsg}`,
      };
      return;
    }

    if (!response.body) {
      yield {
        text: '',
        isComplete: true,
        error: 'Anthropic returned an empty response body.',
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
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { text: parsed.delta.text, isComplete: false };
            } else if (parsed.type === 'message_stop') {
              yield { text: '', isComplete: true };
              return;
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
      error: `Claude Connection Error: ${err.message || String(err)}`,
    };
  }
}
