import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Square,
  Maximize2,
  Trash2,
  ChevronDown,
  Globe,
  Key,
  Clock,
  Sparkles,
  Send,
  AlertCircle,
} from 'lucide-react';
import { ProviderId, ModelResponse, ProviderSettings, ConnectionType } from '../types';
import { PROVIDERS_CONFIG } from '../constants/providers';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatDuration } from '../utils/crypto';

interface ModelCardProps {
  provider: ProviderId;
  response?: ModelResponse;
  settings: ProviderSettings;
  onUpdateModel: (provider: ProviderId, modelId: string) => void;
  onRegenerate: (provider: ProviderId) => void;
  onStop: (provider: ProviderId) => void;
  onClear: (provider: ProviderId) => void;
  onExpand: (provider: ProviderId) => void;
  onSendSingleFollowUp: (provider: ProviderId, message: string) => void;
  syncScrollRef?: (node: HTMLDivElement | null) => void;
  isGeneratingAny: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  provider,
  response,
  settings,
  onUpdateModel,
  onRegenerate,
  onStop,
  onClear,
  onExpand,
  onSendSingleFollowUp,
  syncScrollRef,
  isGeneratingAny,
}) => {
  const info = PROVIDERS_CONFIG[provider];
  const [copied, setCopied] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const status = response?.status || 'idle';
  const isGenerating = status === 'generating' || status === 'connecting' || status === 'waiting';

  const handleCopy = () => {
    if (response?.content) {
      navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || isGenerating) return;
    onSendSingleFollowUp(provider, followUpInput.trim());
    setFollowUpInput('');
    setShowFollowUp(false);
  };

  // Auto scroll down during streaming
  useEffect(() => {
    if (isGenerating && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [response?.content, isGenerating]);

  // Combine local ref with parent syncScrollRef
  const setRefs = (el: HTMLDivElement | null) => {
    (contentRef as any).current = el;
    if (syncScrollRef) syncScrollRef(el);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/40 border border-neutral-800/80 rounded-xl overflow-hidden shadow-sm transition-all duration-150 hover:border-neutral-700/80">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/90 border-b border-neutral-800/80 shrink-0 select-none">
        {/* Left: Provider Identity & Model Dropdown */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: info.accentColor }}
            title={info.name}
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-xs text-neutral-200 tracking-tight whitespace-nowrap">
              {info.name}
            </span>

            {/* Model switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Switch model variant"
              >
                <span className="truncate max-w-[110px]">{settings.selectedModel}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0" />
              </button>

              {showModelDropdown && (
                <div className="absolute left-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] text-neutral-500 font-mono border-b border-neutral-800 uppercase tracking-wider">
                    {info.name} Models
                  </div>
                  {info.availableModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onUpdateModel(provider, m.id);
                        setShowModelDropdown(false);
                      }}
                      className={`flex flex-col text-left w-full px-3 py-1.5 hover:bg-neutral-800 transition-colors ${
                        settings.selectedModel === m.id ? 'bg-neutral-800/60 text-amber-300 font-medium' : 'text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{m.name}</span>
                        {m.contextWindow && <span className="text-[10px] text-neutral-500">{m.contextWindow}</span>}
                      </div>
                      {m.description && <span className="text-[10px] text-neutral-500 truncate">{m.description}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Connection mode indicator: API vs Browser Session */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                settings.connectionType === 'api'
                  ? 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/40'
                  : 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
              }`}
              title={settings.connectionType === 'api' ? 'Official API Mode' : 'Local Browser Session Mode'}
            >
              {settings.connectionType === 'api' ? (
                <>
                  <Key className="w-2.5 h-2.5" />
                  <span>API</span>
                </>
              ) : (
                <>
                  <Globe className="w-2.5 h-2.5" />
                  <span>Session</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isGenerating ? (
            <button
              onClick={() => onStop(provider)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Stop generation for this model"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <>
              {response?.content && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                    title="Copy response"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onRegenerate(provider)}
                    disabled={isGeneratingAny}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
                    title="Regenerate this model response"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => onExpand(provider)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Expand full screen reading mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {response?.content && (
                <button
                  onClick={() => onClear(provider)}
                  className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Clear this model's conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Response Viewport */}
      <div
        ref={setRefs}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-neutral-300 selection:bg-neutral-800"
      >
        {status === 'idle' && !response?.content && (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 py-12 px-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 opacity-40 border border-neutral-700/50"
              style={{ backgroundColor: info.brandBg }}
            >
              <Sparkles className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs font-medium text-neutral-400">{info.name} ({settings.selectedModel})</p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
              Ready. Enter a prompt below to evaluate {info.name} alongside the other frontier models.
            </p>
          </div>
        )}

        {(status === 'waiting' || status === 'connecting') && !response?.content && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 py-4 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Connecting to {info.name} stream...</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Generation Failed</span>
            </div>
            <p className="text-rose-200/80 leading-relaxed font-mono text-[11px]">
              {response?.errorMessage || 'An error occurred during communication.'}
            </p>
            {settings.connectionType === 'api' && !settings.apiKey && (
              <p className="text-[11px] text-amber-300 pt-1">
                Tip: Configure your {info.name} API key in Model Settings, or set environment variables.
              </p>
            )}
          </div>
        )}

        {response?.content && (
          <div className="relative">
            <MarkdownRenderer content={response.content} />
            {isGenerating && (
              <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Follow-up Trigger */}
      <div className="px-3.5 py-2 bg-neutral-900/80 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          {response?.durationMs ? (
            <span className="flex items-center gap-1 text-neutral-400 tabular-nums">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span>{formatDuration(response.durationMs)}</span>
            </span>
          ) : (
            <span className="text-neutral-600">--</span>
          )}

          {response?.outputTokens ? (
            <span className="text-neutral-400 tabular-nums">
              ~{response.outputTokens} tok
            </span>
          ) : null}

          {status === 'generating' && (
            <span className="text-amber-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              streaming
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {response?.content && !isGenerating && (
            <button
              onClick={() => setShowFollowUp(!showFollowUp)}
              className="text-[11px] text-neutral-400 hover:text-amber-300 transition-colors font-sans"
              title="Continue isolated conversation with this single model"
            >
              {showFollowUp ? 'Close reply' : 'Reply only to this'}
            </button>
          )}
        </div>
      </div>

      {/* Isolated Follow-up Input */}
      {showFollowUp && (
        <form onSubmit={handleFollowUpSubmit} className="p-2.5 bg-neutral-950 border-t border-neutral-800">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder={`Send private follow-up only to ${info.name}...`}
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!followUpInput.trim() || isGenerating}
              className="p-1.5 rounded-lg bg-neutral-200 text-neutral-950 hover:bg-white disabled:opacity-40 transition-colors"
              title="Send to this model"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
