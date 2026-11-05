import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  X,
  Hash,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ProviderId, Attachment } from '../types';
import { PROVIDERS_CONFIG } from '../constants/providers';
import { calculatePromptHash } from '../utils/crypto';

interface PromptComposerProps {
  onSend: (prompt: string, selectedProviders: ProviderId[], attachments?: Attachment[]) => void;
  onStopAll: () => void;
  isGenerating: boolean;
  selectedProviders: ProviderId[];
  onToggleProvider: (provider: ProviderId) => void;
  onSelectAllProviders: () => void;
  onOpenPromptLibrary: () => void;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSend,
  onStopAll,
  isGenerating,
  selectedProviders,
  onToggleProvider,
  onSelectAllProviders,
  onOpenPromptLibrary,
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [promptHash, setPromptHash] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute SHA-256 hash in real time to show byte-for-byte fidelity
  useEffect(() => {
    if (prompt) {
      calculatePromptHash(prompt).then(setPromptHash);
    } else {
      setPromptHash('');
    }
  }, [prompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 52)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter creates a new line
        return;
      }
      // Enter or Cmd/Ctrl+Enter sends the prompt
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    if (selectedProviders.length === 0) {
      alert('Please select at least one AI model to evaluate.');
      return;
    }
    onSend(prompt.trim(), selectedProviders, attachments.length > 0 ? attachments : undefined);
    setPrompt('');
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content,
          },
        ]);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charCount = prompt.length;

  return (
    <div className="border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-6 py-3 shrink-0 z-10">
      <div className="max-w-5xl mx-auto space-y-2.5">
        {/* Top Controls: Provider Target Selection & Hash Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs select-none">
          {/* Provider Selection Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-neutral-500 font-medium mr-1">Target Models:</span>
            {(['chatgpt', 'gemini', 'claude', 'grok'] as ProviderId[]).map((p) => {
              const isSelected = selectedProviders.includes(p);
              const info = PROVIDERS_CONFIG[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onToggleProvider(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-medium'
                      : 'bg-neutral-900/60 text-neutral-500 hover:text-neutral-300 border border-transparent'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? info.accentColor : '#525252' }}
                  />
                  <span>{info.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onSelectAllProviders}
              className="text-[11px] text-neutral-400 hover:text-amber-300 px-1.5 py-0.5 rounded ml-1 transition-colors"
            >
              All 4
            </button>
          </div>

          {/* Prompt Verification Hash & Prompt Library shortcut */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
            {promptHash && (
              <span className="flex items-center gap-1 text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800" title="Identical prompt SHA-256 fingerprint dispatched to all models">
                <Hash className="w-3 h-3 text-neutral-500" />
                <span>SHA-256: {promptHash}</span>
              </span>
            )}
            <button
              onClick={onOpenPromptLibrary}
              className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors font-sans"
              title="Browse benchmark comparison prompts"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prompt Library</span>
            </button>
          </div>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono"
              >
                <Paperclip className="w-3 h-3 text-neutral-500" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-neutral-500 hover:text-rose-400 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Textarea Box */}
        <div className="relative flex items-end gap-2 p-2 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner focus-within:border-neutral-700 transition-colors">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type one prompt to compare ChatGPT, Gemini, Claude, and Grok simultaneously... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="w-full bg-transparent resize-none px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none leading-relaxed font-sans max-h-48"
          />

          {/* Action buttons inside composer */}
          <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              title="Attach code or text file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-sm transition-all"
                title="Stop all active generations"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop All</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim() || selectedProviders.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-medium text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send to all selected models (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-semibold">Compare</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-1">
          <div className="flex items-center gap-3">
            <span>{charCount} chars</span>
            <span>·</span>
            <span>{wordCount} words</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <span>Enter to Send</span>
            <span>·</span>
            <span>Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
