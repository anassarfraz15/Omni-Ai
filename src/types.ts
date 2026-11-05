export type ProviderId = 'chatgpt' | 'gemini' | 'claude' | 'grok';

export type ConnectionType = 'api' | 'browser_session';

export type ModelResponseStatus = 
  | 'idle' 
  | 'waiting' 
  | 'connecting' 
  | 'generating' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type BrowserSessionStatus =
  | 'connected'
  | 'not_connected'
  | 'login_required'
  | 'session_expired'
  | 'provider_unavailable'
  | 'integration_unsupported';

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  company: string;
  defaultModel: string;
  availableModels: { id: string; name: string; contextWindow?: string; description?: string }[];
  accentColor: string;
  brandBg: string;
  logo: string;
  browserUrl: string;
}

export interface ProviderSettings {
  id: ProviderId;
  connectionType: ConnectionType;
  selectedModel: string;
  apiKey?: string;
  enabled: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  browserSessionStatus?: BrowserSessionStatus;
  lastConnectedAt?: string;
}

export interface ModelResponse {
  id: string;
  provider: ProviderId;
  modelId: string;
  content: string;
  status: ModelResponseStatus;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  createdAt: string;
  connectionType: ConnectionType;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface ComparisonRequest {
  id: string;
  conversationId: string;
  prompt: string;
  promptHash: string;
  attachments?: Attachment[];
  createdAt: string;
  selectedProviders: ProviderId[];
  responses: Record<ProviderId, ModelResponse>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  requests: ComparisonRequest[];
  isFavorite?: boolean;
  tags?: string[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Coding' | 'Reasoning' | 'Architecture' | 'Writing' | 'Fact-Checking' | 'Custom';
  description: string;
  prompt: string;
}

export interface AnalysisResult {
  agreements: string[];
  disagreements: string[];
  uniqueInsights: Record<ProviderId, string[]>;
  factualContradictions: string[];
  bestExplanation: { provider: ProviderId; title: string; rationale: string };
  bestTechnical: { provider: ProviderId; title: string; rationale: string };
  strongestReasoning: { provider: ProviderId; title: string; rationale: string };
  executiveSummary: string;
  overallScorecard: Record<ProviderId, { clarity: number; depth: number; speed: number; highlights: string }>;
  evaluatedAt: string;
  evaluatedByModel: string;
}

export type ViewLayout = 'grid-2x2' | 'columns-4' | 'split-2' | 'single';

export interface SecurityStatus {
  isLocalhost: boolean;
  zeroCookiesTransmitted: boolean;
  zeroExternalTelemetry: boolean;
  noPasswordCollection: boolean;
  noAuthTokensInDatabase: boolean;
  localEncryptedKeyStorage: boolean;
  localStoragePath: string;
  lastSecurityAudit: string;
}
