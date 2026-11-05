import React, { useState } from 'react';
import {
  LayoutGrid,
  Columns4,
  Columns2,
  Maximize2,
  Sparkles,
  Download,
  Copy,
  Check,
  Share2,
  ScrollText,
} from 'lucide-react';
import { ViewLayout, ProviderId } from '../types';

interface HeaderProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  layout: ViewLayout;
  onChangeLayout: (layout: ViewLayout) => void;
  isSyncScroll: boolean;
  onToggleSyncScroll: () => void;
  onOpenAnalysis: () => void;
  hasCompletedResponses: boolean;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onCopyAllResponses: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onUpdateTitle,
  layout,
  onChangeLayout,
  isSyncScroll,
  onToggleSyncScroll,
  onOpenAnalysis,
  hasCompletedResponses,
  onExportMarkdown,
  onExportJson,
  onCopyAllResponses,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
  };

  const handleCopyAll = () => {
    onCopyAllResponses();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md select-none shrink-0 z-20">
      {/* Zone 1: Title and Status */}
      <div className="flex items-center gap-3 min-w-0 max-w-md">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-sm font-semibold text-neutral-100 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 focus:outline-none focus:border-amber-400 w-full"
          />
        ) : (
          <div
            onClick={() => {
              setTempTitle(title);
              setIsEditingTitle(true);
            }}
            className="group flex items-center gap-2 cursor-pointer truncate"
            title="Click to rename comparison"
          >
            <h1 className="text-sm font-semibold text-neutral-100 truncate tracking-tight hover:text-amber-300 transition-colors">
              {title || 'New Multi-Model Comparison'}
            </h1>
            <span className="text-[11px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
              edit
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Layout Controls & Sync Scroll */}
      <div className="hidden lg:flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
        <button
          onClick={() => onChangeLayout('grid-2x2')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
            layout === 'grid-2x2' ? 'bg-neutral-800 text-neutral-100 shadow-sm font-medium' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="2x2 Grid View"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>2×2 Grid</span>
        </button>

        <button
          onClick={() => onChangeLayout('columns-4')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
            layout === 'columns-4' ? 'bg-neutral-800 text-neutral-100 shadow-sm font-medium' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="4-Column Side-by-Side"
        >
          <Columns4 className="w-3.5 h-3.5" />
          <span>4 Columns</span>
        </button>

        <button
          onClick={() => onChangeLayout('split-2')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
            layout === 'split-2' ? 'bg-neutral-800 text-neutral-100 shadow-sm font-medium' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="2-Column Split"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>Split 2</span>
        </button>

        <div className="w-[1px] h-4 bg-neutral-800 mx-1" />

        <button
          onClick={onToggleSyncScroll}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
            isSyncScroll ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Synchronized Scrolling across all panels"
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Sync Scroll</span>
        </button>
      </div>

      {/* Zone 3: Actions (Compare & Analyze, Export) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAnalysis}
          disabled={!hasCompletedResponses}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
            hasCompletedResponses
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 text-neutral-950 shadow hover:opacity-90 active:scale-95'
              : 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
          }`}
          title="Synthesize and evaluate responses across all models"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Compare &amp; Analyze</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 transition-colors text-xs whitespace-nowrap shrink-0"
            title="Export or copy responses"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  onExportMarkdown();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Markdown (.md)</span>
              </button>
              <button
                onClick={() => {
                  onExportJson();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export JSON (.json)</span>
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => {
                  handleCopyAll();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copiedAll ? 'Copied to Clipboard!' : 'Copy All Side-by-Side'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
