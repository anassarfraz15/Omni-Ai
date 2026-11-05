import { GoogleGenAI } from '@google/genai';

export interface StreamChunk {
  text: string;
  isComplete: boolean;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export async function* streamGeminiResponse(params: {
  prompt: string;
  model: string;
  apiKey?: string;
  systemPrompt?: string;
  temperature?: number;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
}): AsyncGenerator<StreamChunk> {
  const effectiveKey = params.apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    yield {
      text: '',
      isComplete: true,
      error: 'Gemini API key is not configured. Please set GEMINI_API_KEY or configure it in Provider Settings.',
    };
    return;
  }

  // Model selection enforcement as per skill: default to gemini-3.8-flash
  const modelName = params.model || 'gemini-3.8-flash';

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      contents.push(...params.history);
    }
    contents.push({
      role: 'user',
      parts: [{ text: params.prompt }],
    });

    const config: any = {};
    if (params.systemPrompt) {
      config.systemInstruction = params.systemPrompt;
    }

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      if (chunkText) {
        fullText += chunkText;
        yield {
          text: chunkText,
          isComplete: false,
        };
      }
    }

    yield {
      text: '',
      isComplete: true,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    yield {
      text: '',
      isComplete: true,
      error: `Gemini Error: ${msg}`,
    };
  }
}
