import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProviderId, ModelResponse, ProviderSettings } from '../types';
import { PROVIDERS_CONFIG } from '../constants/providers';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatDuration } from '../utils/crypto';

interface ExpandedModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderId | null;
  response?: ModelResponse;
  settings?: ProviderSettings;
}

export const ExpandedModelModal: React.FC<ExpandedModelModalProps> = ({
  isOpen,
  onClose,
  provider,
  response,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !provider) return null;

  const info = PROVIDERS_CONFIG[provider];

  const handleCopy = () => {
    if (response?.content) {
      navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: info.accentColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                  {info.name}
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  ({settings?.selectedModel || info.defaultModel})
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Full-Screen Reading &amp; Code Inspection View
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {response?.durationMs ? (
              <span className="flex items-center gap-1 text-xs text-neutral-400 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{formatDuration(response.durationMs)}</span>
              </span>
            ) : null}

            {response?.content && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
                title="Copy entire response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-8 font-sans text-neutral-200 selection:bg-neutral-800 leading-relaxed">
          {response?.content ? (
            <div className="max-w-4xl mx-auto">
              <MarkdownRenderer content={response.content} />
            </div>
          ) : (
            <div className="text-center py-24 text-neutral-500 text-sm">
              No content generated yet for {info.name}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 select-none text-xs text-neutral-500 font-mono shrink-0">
          <span>{response?.outputTokens ? `~${response.outputTokens} tokens` : 'Ready'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Close Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
};
