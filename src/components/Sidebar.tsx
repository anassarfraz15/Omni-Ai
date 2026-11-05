import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Bookmark,
  BookOpen,
  Settings,
  ShieldCheck,
  Chrome,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Star,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Conversation, ProviderId } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewComparison: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onOpenExtension: () => void;
  onOpenLibrary: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewComparison,
  onDeleteConversation,
  onOpenSettings,
  onOpenSecurity,
  onOpenExtension,
  onOpenLibrary,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const filtered = conversations.filter((c) => {
    if (filterFavorites && !c.isFavorite) return false;
    if (!searchQuery) return true;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-neutral-800 bg-neutral-950 text-neutral-300 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 p-[1.5px] flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center">
                <span className="font-bold text-xs tracking-wider text-neutral-100">Ω</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-neutral-100">OMNIA AI</span>
                <span className="text-[10px] text-neutral-500 font-mono">v1.0</span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate">Multi-Model Comparison</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center">
              <span className="font-bold text-xs text-neutral-100">Ω</span>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Comparison Action */}
      <div className="p-3">
        <button
          onClick={onNewComparison}
          className={`flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-100 text-neutral-950 font-medium text-xs shadow-sm hover:bg-white transition-all ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="New Comparison (Cmd+N)"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">New Comparison</span>}
        </button>
      </div>

      {/* Primary Navigation Tools */}
      <div className="px-3 space-y-1">
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          title="Prompt Library"
        >
          <BookOpen className="w-4 h-4 shrink-0 text-cyan-400" />
          {!isCollapsed && <span>Prompt Library</span>}
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          title="Model & Provider Settings"
        >
          <Settings className="w-4 h-4 shrink-0 text-amber-400" />
          {!isCollapsed && <span>Model Settings</span>}
        </button>
        <button
          onClick={onOpenSecurity}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          title="Privacy & Security Center"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          {!isCollapsed && <span>Security Center</span>}
        </button>
        <button
          onClick={onOpenExtension}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          title="Browser Extension Bridge"
        >
          <Chrome className="w-4 h-4 shrink-0 text-purple-400" />
          {!isCollapsed && <span>Browser Bridge</span>}
        </button>
      </div>

      <div className="my-2 border-t border-neutral-900" />

      {/* Conversation History Section */}
      {!isCollapsed && (
        <div className="px-3 pt-1 pb-2">
          <div className="flex items-center justify-between mb-2 text-xs text-neutral-500 font-medium px-1">
            <span>Conversations</span>
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`p-1 rounded hover:text-neutral-300 ${filterFavorites ? 'text-amber-400' : 'text-neutral-500'}`}
              title="Show Favorites"
            >
              <Star className="w-3.5 h-3.5" fill={filterFavorites ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Search filter */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900/80 border border-neutral-800/80 rounded-md text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {filtered.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-8 text-neutral-500 text-xs px-4">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p>No saved comparisons yet</p>
              <p className="text-[11px] text-neutral-600 mt-1">Send a prompt to start comparing</p>
            </div>
          )
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === currentConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-neutral-800/90 text-neutral-100 font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
                title={conv.title}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-400" />
                  {!isCollapsed && <span className="truncate">{conv.title}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => onDeleteConversation(conv.id, e)}
                      className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800"
                      title="Delete comparison"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status & Theme */}
      <div className="p-3 border-t border-neutral-900 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-neutral-400" />
              <span>localhost:3000</span>
            </span>
            <span className="text-emerald-400">Local-first</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1.5 rounded-md hover:bg-neutral-900 transition-colors"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
