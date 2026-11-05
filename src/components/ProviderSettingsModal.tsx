import React, { useState } from 'react';
import {
  X,
  Key,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ProviderId, ProviderSettings, ConnectionType } from '../types';
import { PROVIDERS_CONFIG } from '../constants/providers';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Record<ProviderId, ProviderSettings>;
  onSaveSettings: (settings: Record<ProviderId, ProviderSettings>) => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<ProviderId>('chatgpt');
  const [localSettings, setLocalSettings] = useState<Record<ProviderId, ProviderSettings>>({ ...settings });
  const [testResults, setTestResults] = useState<Record<string, { testing: boolean; success?: boolean; latencyMs?: number; error?: string }>>({});
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const currentProvider = PROVIDERS_CONFIG[activeTab];
  const currentConfig = localSettings[activeTab];

  const handleUpdate = (field: keyof ProviderSettings, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const runConnectionTest = async () => {
    setTestResults((prev) => ({ ...prev, [activeTab]: { testing: true } }));

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeTab,
          apiKey: currentConfig.apiKey,
          model: currentConfig.selectedModel,
        }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [activeTab]: {
          testing: false,
          success: data.success,
          latencyMs: data.latencyMs,
          error: data.error,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [activeTab]: {
          testing: false,
          success: false,
          error: err.message || 'Connection test failed',
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
              Model &amp; Provider Settings
            </h2>
            <p className="text-xs text-neutral-400">
              Configure credentials, connection methods, and model parameters locally
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (4 Providers) */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/40 px-6 pt-2 gap-2 overflow-x-auto select-none">
          {(['chatgpt', 'gemini', 'claude', 'grok'] as ProviderId[]).map((p) => {
            const info = PROVIDERS_CONFIG[p];
            const isActive = activeTab === p;
            return (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-amber-400 text-neutral-100 font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.accentColor }} />
                <span>{info.name}</span>
                <span className="text-[10px] text-neutral-500 font-mono">({localSettings[p].connectionType})</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
          {/* Connection Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-200">
              Connection Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleUpdate('connectionType', 'api')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  currentConfig.connectionType === 'api'
                    ? 'bg-neutral-900 border-amber-400/80 shadow-sm'
                    : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-100">Official API</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Direct server-side API connection using your personal API key. Fast native streaming and token tracking.
                </p>
              </div>

              <div
                onClick={() => handleUpdate('connectionType', 'browser_session')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  currentConfig.connectionType === 'browser_session'
                    ? 'bg-neutral-900 border-purple-400/80 shadow-sm'
                    : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-neutral-100">Local Browser Session</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Connects to your active tab ({currentProvider.browserUrl}) via local extension. Zero cookies collected.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Field (if API mode) */}
          {currentConfig.connectionType === 'api' && (
            <div className="space-y-2 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-200 flex items-center gap-2">
                  <span>{currentProvider.name} API Key</span>
                  <span className="text-[10px] text-neutral-500 font-mono">(Encrypted locally)</span>
                </label>
                {activeTab === 'gemini' && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Auto-configured via AI Studio
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={
                  activeTab === 'gemini'
                    ? 'Using server GEMINI_API_KEY (leave blank or override)'
                    : `Enter your ${currentProvider.name} API Key...`
                }
                value={currentConfig.apiKey || ''}
                onChange={(e) => handleUpdate('apiKey', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
              />
              <p className="text-[11px] text-neutral-500">
                Stored exclusively in your computer&apos;s local application storage. Never shared or exported.
              </p>
            </div>
          )}

          {/* Model Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-200">
              Selected Model Variant
            </label>
            <select
              value={currentConfig.selectedModel}
              onChange={(e) => handleUpdate('selectedModel', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
            >
              {currentProvider.availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.contextWindow || 'Standard'}) — {m.description || ''}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt Instructions */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-200">
              Custom System Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={currentConfig.systemPrompt || ''}
              onChange={(e) => handleUpdate('systemPrompt', e.target.value)}
              placeholder={`Enter specific system persona or output guidelines for ${currentProvider.name}...`}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-sans"
            />
          </div>

          {/* Temperature & Token Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-200">Temperature</span>
                <span className="font-mono text-neutral-400">{currentConfig.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={currentConfig.temperature}
                onChange={(e) => handleUpdate('temperature', parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>Deterministic (0.0)</span>
                <span>Creative (1.5)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-200">Max Tokens</span>
                <span className="font-mono text-neutral-400">{currentConfig.maxTokens}</span>
              </div>
              <input
                type="number"
                min="512"
                max="8192"
                step="256"
                value={currentConfig.maxTokens}
                onChange={(e) => handleUpdate('maxTokens', parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Test Connection Result Box */}
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-neutral-200">
                Validate {currentProvider.name} Connection
              </div>
              <div className="text-[11px] text-neutral-500">
                Sends a minimal test ping to measure latency and verify credentials
              </div>
            </div>

            <button
              onClick={runConnectionTest}
              disabled={testResults[activeTab]?.testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>{testResults[activeTab]?.testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {testResults[activeTab] && !testResults[activeTab]?.testing && (
            <div
              className={`p-3 rounded-lg text-xs font-mono border ${
                testResults[activeTab]?.success
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
              }`}
            >
              {testResults[activeTab]?.success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Connection Verified! Latency: {testResults[activeTab]?.latencyMs}ms</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Test Failed: {testResults[activeTab]?.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 select-none">
          <div className="flex items-center gap-2 text-xs">
            {savedNotice && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settings saved to local storage</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-neutral-100 text-neutral-950 text-xs font-semibold hover:bg-white transition-all shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
