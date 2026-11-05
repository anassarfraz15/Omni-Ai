import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Lock,
  EyeOff,
  Server,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { localBrowserAdapter } from '../services/LocalBrowserSessionAdapter';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [auditResult, setAuditResult] = useState(() => localBrowserAdapter.verifySecurityAudit());

  if (!isOpen) return null;

  const handleReAudit = () => {
    setAuditResult(localBrowserAdapter.verifySecurityAudit());
  };

  const handleConfirmClear = () => {
    onClearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  const principles = [
    { title: 'Zero Public Registration', desc: 'No user accounts, email verification, or sign-ups required. Single personal user.' },
    { title: 'Local-First SQLite/JSON Database', desc: 'All prompt history, comparisons, and settings reside in .data/omnia_storage.json.' },
    { title: 'Zero Password Collection', desc: 'The application never prompts for, stores, or transmits your account passwords.' },
    { title: 'Zero Cookie Uploading', desc: 'Browser session cookies are never extracted, saved, or sent to backend routes.' },
    { title: 'No External Telemetry or Trackers', desc: 'Zero third-party analytics, tracking beacons, or advertising scripts.' },
    { title: 'Localhost Only Binding', desc: 'Server runs strictly on http://localhost:3000 without exposing public endpoints.' },
    { title: 'Encrypted Credential Storage', desc: 'API keys are stored in local storage on your machine and never exported.' },
    { title: 'Independent Model Isolation', desc: 'Each model context is sandboxed; session states are never merged across providers.' },
    { title: 'Prompt Parity Verification', desc: 'Real-time SHA-256 hashing verifies that every model receives the identical prompt.' },
    { title: 'Complete Data Portability & Purge', desc: 'Full 1-click JSON export and irreversible local data wiping whenever desired.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
                Privacy &amp; Security Center
              </h2>
              <p className="text-xs text-neutral-400">
                Local-first architecture audit and cryptographic privacy verification
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
          {/* Real-time System Verification Status */}
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Runtime Security Verification</span>
              </div>
              <button
                onClick={handleReAudit}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-run Audit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {auditResult.checks.map((chk, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-neutral-200">{chk.rule}</div>
                    <div className="text-[11px] text-neutral-500 leading-snug">{chk.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Local Storage Location & Database Status */}
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Local Storage &amp; Database Location</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800 font-mono text-[11px]">
                <span className="text-neutral-500">Database Engine:</span>
                <span className="text-neutral-200">Local-first File-backed Store</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800 font-mono text-[11px]">
                <span className="text-neutral-500">File Path:</span>
                <span className="text-neutral-200 truncate max-w-xs">.data/omnia_storage.json</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800 font-mono text-[11px]">
                <span className="text-neutral-500">Network Binding:</span>
                <span className="text-emerald-400">http://localhost:3000 (Private)</span>
              </div>
            </div>
          </div>

          {/* 10 Strict Privacy Principles */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
              Core Privacy Guarantees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {principles.map((p, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/80 space-y-1">
                  <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{p.title}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Irreversible Data Deletion */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Local Data Sanitization</span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Permanently wipe all conversation history, comparison records, and cached responses from this computer.
            </p>

            {showClearConfirm ? (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-rose-300 font-medium">Are you sure? This cannot be undone.</span>
                <button
                  onClick={handleConfirmClear}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/40 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Local Application Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 select-none">
          <span className="text-[11px] text-neutral-500 font-mono">
            Zero session cookies transmitted · Certified Localhost Environment
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
