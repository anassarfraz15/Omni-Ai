import React, { useState } from 'react';
import {
  X,
  Chrome,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  FolderArchive,
  ToggleRight,
  FolderOpen,
  RefreshCw,
  Eye,
  Key,
} from 'lucide-react';
import { PROVIDERS_CONFIG } from '../constants/providers';
import { ProviderId } from '../types';
import { localBrowserAdapter } from '../services/LocalBrowserSessionAdapter';

interface BrowserExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrowserExtensionModal: React.FC<BrowserExtensionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const tabStatuses = localBrowserAdapter.getAllStatuses();

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/browser-extension/download');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omnia-browser-bridge.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: trigger direct link
      window.open('/api/browser-extension/download', '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestBridge = () => {
    setTestingConnection(true);
    localBrowserAdapter.pingExtension();
    setTimeout(() => {
      const isConnected = localBrowserAdapter.isBridgeInstalled();
      setConnectionStatus(isConnected);
      setTestingConnection(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center">
              <Chrome className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
                Local Browser Extension Bridge Setup Guide
              </h2>
              <p className="text-xs text-neutral-400">
                Use your existing free ChatGPT, Claude, Grok, and Gemini web accounts without paying for API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
          {/* Hero Download Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900 border border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Ready to Install
                </span>
                <span className="text-xs text-neutral-400 font-mono">Manifest V3 · Zero Cookies</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-100">
                Download OMNIA Browser Bridge (.zip)
              </h3>
              <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
                Click below to download the extension bundle. Unzip it and load it into your Chrome, Brave, or Edge browser in under 60 seconds.
              </p>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-950/50 hover:shadow-purple-900/40 transition-all shrink-0 active:scale-95 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Extension (.zip)</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy & Zero-Cookie Guarantee */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>How This Works Safely (Strict Zero-Cookie Policy)</span>
            </div>
            <p className="leading-relaxed">
              When you use official web accounts (like free ChatGPT, Gemini, Claude, or Grok), the bridge simply forwards the prompt text into your open browser tab and reads the rendered response. 
              <strong> It never touches, reads, or copies your session cookies, tokens, or passwords.</strong> Communication occurs strictly on your local machine.
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
              Complete Step-by-Step Installation (3 Minutes)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span className="text-neutral-200">Download &amp; Unzip</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Click the <strong>Download Extension (.zip)</strong> button above. Right-click the downloaded <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">omnia-browser-bridge.zip</code> file and choose <strong>Extract All</strong> (or Unzip).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span className="text-neutral-200">Open Browser Extensions</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  In your browser address bar (Chrome, Brave, or Edge), copy and open this address:
                </p>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px]">
                  <span className="text-amber-300">chrome://extensions/</span>
                  <button
                    onClick={() => handleCopy('chrome://extensions/')}
                    className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                  >
                    {copiedUrl === 'chrome://extensions/' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span className="text-neutral-200">Enable Developer Mode</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  In the top-right corner of the Extensions page, switch on the <strong>Developer mode</strong> toggle. This reveals the unpacked extension buttons.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/80 text-[11px] text-neutral-300">
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>Developer mode: ON</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">
                    4
                  </span>
                  <span className="text-neutral-200">Load Unpacked</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Click the <strong>Load unpacked</strong> button in the top-left, navigate to the unzipped <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">omnia-browser-bridge</code> folder, and select it.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/80 text-[11px] text-neutral-300">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  <span>Select folder with manifest.json</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Provider Tabs and Login */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Step 5: Open &amp; Sign in to Your Free Tabs
              </h3>
              <button
                onClick={handleTestBridge}
                disabled={testingConnection}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>Check Bridge Connection</span>
              </button>
            </div>

            {connectionStatus !== null && (
              <div
                className={`p-3.5 rounded-xl text-xs font-mono border ${
                  connectionStatus
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                }`}
              >
                {connectionStatus ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bridge detected! Connected tabs communicate automatically.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-semibold text-neutral-100">Extension not detected on this page yet</div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
                          Chrome only activates newly loaded extensions on pages that are <strong>refreshed</strong> after installation. 
                          Also ensure you downloaded the updated ZIP with cloud preview support.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 font-sans">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh This Page Now</span>
                      </button>
                      <button
                        onClick={handleDownloadZip}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors"
                      >
                        Re-download Updated ZIP (v1.0.1)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['chatgpt', 'gemini', 'claude', 'grok'] as ProviderId[]).map((p) => {
                const info = PROVIDERS_CONFIG[p];
                return (
                  <div key={p} className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.accentColor }} />
                        <span className="text-xs font-semibold text-neutral-100">{info.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">{info.browserUrl}</div>
                    </div>

                    <a
                      href={info.browserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                    >
                      <span>Open Free Tab</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 6: Activate in OMNIA AI */}
          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2 text-xs">
            <div className="font-semibold text-neutral-200">
              Step 6: Switch Connection to &quot;Local Browser Session&quot; in OMNIA AI
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Open <strong>Model Settings</strong> (in the left sidebar) $\rightarrow$ click on ChatGPT, Claude, or Grok $\rightarrow$ select <strong>Local Browser Session</strong> as the Connection Architecture. 
              Now when you send a prompt, OMNIA AI will communicate with your open tabs!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 select-none shrink-0">
          <span className="text-[11px] text-neutral-500 font-mono">
            Direct download: /api/browser-extension/download
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
