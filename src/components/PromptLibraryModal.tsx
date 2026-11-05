import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Send,
  Search,
  Code,
  Brain,
  Layers,
  PenTool,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { PromptTemplate } from '../types';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  onSelectTemplate: (prompt: string) => void;
  onCreateTemplate: (template: PromptTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
  onCreateTemplate,
  onDeleteTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplate['category']>('Custom');
  const [newDesc, setNewDesc] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  if (!isOpen) return null;

  const categories = ['All', 'Coding', 'Reasoning', 'Architecture', 'Writing', 'Fact-Checking', 'Custom'];

  const filtered = templates.filter((t) => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (!search) return true;
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.prompt.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    onCreateTemplate({
      id: `tpl-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || 'Custom user template',
      prompt: newPrompt.trim(),
    });

    setNewTitle('');
    setNewDesc('');
    setNewPrompt('');
    setIsCreating(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Coding': return <Code className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Reasoning': return <Brain className="w-3.5 h-3.5 text-amber-400" />;
      case 'Architecture': return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      case 'Writing': return <PenTool className="w-3.5 h-3.5 text-rose-400" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
                Benchmark Prompt Library
              </h2>
              <p className="text-xs text-neutral-400">
                Rigorous multi-model test scenarios designed to probe reasoning, coding, and factual boundaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Cancel' : 'New Template'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-neutral-800 bg-neutral-900/40 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-neutral-100 font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-48 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Filter prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-neutral-300">
          {/* Create Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="text-xs font-semibold text-neutral-200">Create Custom Prompt Template</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Template Title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                  required
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Coding">Coding</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Writing">Writing</option>
                  <option value="Fact-Checking">Fact-Checking</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Short description or goal..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              />
              <textarea
                rows={3}
                placeholder="Enter prompt content..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none font-sans"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 rounded bg-neutral-800 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-neutral-100 text-xs text-neutral-950 font-semibold hover:bg-white"
                >
                  Save to Library
                </button>
              </div>
            </form>
          )}

          {/* List of Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                      {getCategoryIcon(tpl.category)}
                      <span>{tpl.category}</span>
                    </span>
                    {tpl.category === 'Custom' && (
                      <button
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="text-neutral-500 hover:text-rose-400"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-100">{tpl.title}</h4>
                  <p className="text-[11px] text-neutral-400 leading-snug">{tpl.description}</p>
                </div>

                <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800/80 text-[11px] font-mono text-neutral-300 line-clamp-3">
                  {tpl.prompt}
                </div>

                <button
                  onClick={() => {
                    onSelectTemplate(tpl.prompt);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors"
                >
                  <Send className="w-3 h-3 text-amber-400" />
                  <span>Use This Prompt</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 select-none">
          <span className="text-[11px] text-neutral-500 font-mono">
            {filtered.length} benchmark templates available
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
