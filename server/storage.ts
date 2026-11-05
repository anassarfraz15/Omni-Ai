import fs from 'fs';
import path from 'path';
import { Conversation, ProviderSettings, PromptTemplate, ProviderId } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORAGE_FILE = path.resolve(DATA_DIR, 'omnia_storage.json');

export interface OmniaStorageSchema {
  version: number;
  conversations: Conversation[];
  providerSettings: Record<ProviderId, ProviderSettings>;
  promptTemplates: PromptTemplate[];
  lastUpdated: string;
}

const DEFAULT_PROVIDER_SETTINGS: Record<ProviderId, ProviderSettings> = {
  chatgpt: {
    id: 'chatgpt',
    connectionType: 'api',
    selectedModel: 'gpt-4o',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are ChatGPT by OpenAI. Provide direct, rigorous, and insightful answers.',
    browserSessionStatus: 'not_connected',
  },
  gemini: {
    id: 'gemini',
    connectionType: 'api',
    selectedModel: 'gemini-3.8-flash',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are Gemini by Google. Provide helpful, accurate, well-structured, and comprehensive responses.',
    browserSessionStatus: 'not_connected',
  },
  claude: {
    id: 'claude',
    connectionType: 'api',
    selectedModel: 'claude-3-7-sonnet-20250219',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are Claude by Anthropic. Provide nuanced, clear, thoughtful, and technically sound answers.',
    browserSessionStatus: 'not_connected',
  },
  grok: {
    id: 'grok',
    connectionType: 'api',
    selectedModel: 'grok-2-1212',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are Grok by xAI. Provide direct, witty, truth-seeking, and mathematically precise responses.',
    browserSessionStatus: 'not_connected',
  },
};

const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'template-1',
    title: 'Distributed System Concurrency & Consensus',
    category: 'Architecture',
    description: 'Compare Raft, Paxos, and Vector Clocks under high-network partition scenarios.',
    prompt: 'Compare Raft, Multi-Paxos, and Vector Clocks in a globally distributed database with high cross-region latency and frequent network partitions. Address: 1. Failure detection latency, 2. Split-brain prevention, 3. Read throughput tradeoffs under linearizable vs casual consistency. Provide concrete architectural diagrams or ASCII flows.'
  },
  {
    id: 'template-2',
    title: 'Zero-Allocation TypeScript Parsing Algorithm',
    category: 'Coding',
    description: 'Write an optimized streaming token parser in TypeScript with zero buffer reallocations.',
    prompt: 'Write an optimized token scanner in TypeScript for a nested JSON/JSONL stream that operates on an ArrayBuffer with zero heap memory allocations during parsing. Include benchmarks, byte offset traversal, and handle UTF-8 multi-byte boundary cases gracefully.'
  },
  {
    id: 'template-3',
    title: 'Quantum Computing vs RSA Cryptography',
    category: 'Reasoning',
    description: 'Evaluate Shor algorithm impact on 2048-bit RSA and migration timelines to Post-Quantum Cryptography.',
    prompt: 'Provide a rigorous technical breakdown of Shor algorithm applied to factoring a 2048-bit RSA key. What physical qubit count and logical error rates (surface codes) are theoretically required? What are the exact tradeoffs between Kyber/ML-KEM and classic ECDH?'
  },
  {
    id: 'template-4',
    title: 'Philosophical Nuance: Determinism & Free Agency',
    category: 'Writing',
    description: 'Compose an intellectual dialogue between Spinoza, Daniel Dennett, and a modern neuroscientist.',
    prompt: 'Write an intellectually rigorous philosophical dialogue between Baruch Spinoza, Daniel Dennett (compatibilism), and a contemporary cognitive neuroscientist studying readiness potentials (Libet experiments). Focus on the definition of voluntary agency and moral culpability.'
  },
  {
    id: 'template-5',
    title: 'Factual Accuracy: Microprocessor Vulnerabilities',
    category: 'Fact-Checking',
    description: 'Compare Meltdown, Spectre v1/v2, and Downfall across Intel, AMD, and ARM architectures.',
    prompt: 'Detail the hardware transient execution mechanics behind Spectre (v1 bounds check bypass, v2 branch target injection), Meltdown (rogue data cache load), and Downfall (gather instruction leak). Which CPU generations of Intel, AMD, and ARM were vulnerable, and what was the measured performance cost of hardware vs OS microcode mitigations?'
  }
];

class LocalStorageManager {
  private memoryCache: OmniaStorageSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(STORAGE_FILE)) {
        const initialData: OmniaStorageSchema = {
          version: 1,
          conversations: [],
          providerSettings: DEFAULT_PROVIDER_SETTINGS,
          promptTemplates: DEFAULT_PROMPT_TEMPLATES,
          lastUpdated: new Date().toISOString(),
        };
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        this.memoryCache = initialData;
      } else {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        this.memoryCache = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to initialize local storage:', err);
      this.memoryCache = {
        version: 1,
        conversations: [],
        providerSettings: DEFAULT_PROVIDER_SETTINGS,
        promptTemplates: DEFAULT_PROMPT_TEMPLATES,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private save() {
    try {
      if (!this.memoryCache) return;
      this.memoryCache.lastUpdated = new Date().toISOString();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write storage file:', err);
    }
  }

  public getConversations(): Conversation[] {
    this.ensureInitialized();
    return this.memoryCache?.conversations || [];
  }

  public getConversation(id: string): Conversation | undefined {
    this.ensureInitialized();
    return this.memoryCache?.conversations.find((c) => c.id === id);
  }

  public saveConversation(conv: Conversation): Conversation {
    this.ensureInitialized();
    if (!this.memoryCache) throw new Error('Storage unavailable');

    const index = this.memoryCache.conversations.findIndex((c) => c.id === conv.id);
    conv.updatedAt = new Date().toISOString();
    if (index >= 0) {
      this.memoryCache.conversations[index] = conv;
    } else {
      this.memoryCache.conversations.unshift(conv);
    }
    this.save();
    return conv;
  }

  public deleteConversation(id: string): boolean {
    this.ensureInitialized();
    if (!this.memoryCache) return false;

    const initialLen = this.memoryCache.conversations.length;
    this.memoryCache.conversations = this.memoryCache.conversations.filter((c) => c.id !== id);
    if (this.memoryCache.conversations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public clearAllData(): boolean {
    this.memoryCache = {
      version: 1,
      conversations: [],
      providerSettings: DEFAULT_PROVIDER_SETTINGS,
      promptTemplates: DEFAULT_PROMPT_TEMPLATES,
      lastUpdated: new Date().toISOString(),
    };
    this.save();
    return true;
  }

  public getProviderSettings(): Record<ProviderId, ProviderSettings> {
    this.ensureInitialized();
    return {
      ...DEFAULT_PROVIDER_SETTINGS,
      ...(this.memoryCache?.providerSettings || {}),
    };
  }

  public saveProviderSettings(settings: Record<ProviderId, ProviderSettings>): Record<ProviderId, ProviderSettings> {
    this.ensureInitialized();
    if (!this.memoryCache) throw new Error('Storage unavailable');
    this.memoryCache.providerSettings = settings;
    this.save();
    return this.memoryCache.providerSettings;
  }

  public getPromptTemplates(): PromptTemplate[] {
    this.ensureInitialized();
    return this.memoryCache?.promptTemplates || DEFAULT_PROMPT_TEMPLATES;
  }

  public savePromptTemplate(template: PromptTemplate): PromptTemplate {
    this.ensureInitialized();
    if (!this.memoryCache) throw new Error('Storage unavailable');
    const idx = this.memoryCache.promptTemplates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.memoryCache.promptTemplates[idx] = template;
    } else {
      this.memoryCache.promptTemplates.push(template);
    }
    this.save();
    return template;
  }

  public deletePromptTemplate(id: string): boolean {
    this.ensureInitialized();
    if (!this.memoryCache) return false;
    this.memoryCache.promptTemplates = this.memoryCache.promptTemplates.filter((t) => t.id !== id);
    this.save();
    return true;
  }

  public exportAll(): OmniaStorageSchema {
    this.ensureInitialized();
    return this.memoryCache!;
  }

  public importAll(payload: OmniaStorageSchema): boolean {
    this.memoryCache = payload;
    this.save();
    return true;
  }
}

export const localDb = new LocalStorageManager();
