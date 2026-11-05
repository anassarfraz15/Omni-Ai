import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ProviderId,
  Conversation,
  ComparisonRequest,
  ModelResponse,
  ProviderSettings,
  PromptTemplate,
  ViewLayout,
  AnalysisResult,
  Attachment,
} from './types';
import { PROVIDERS_CONFIG } from './constants/providers';
import { calculatePromptHash } from './utils/crypto';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ComparisonGrid } from './components/ComparisonGrid';
import { PromptComposer } from './components/PromptComposer';
import { CompareAnalyzeModal } from './components/CompareAnalyzeModal';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { BrowserExtensionModal } from './components/BrowserExtensionModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { ExpandedModelModal } from './components/ExpandedModelModal';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Layout & View Controls
  const [layout, setLayout] = useState<ViewLayout>('grid-2x2');
  const [isSyncScroll, setIsSyncScroll] = useState(false);

  // Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<ProviderId[]>([
    'chatgpt',
    'gemini',
    'claude',
    'grok',
  ]);

  // Provider Settings
  const [providerSettings, setProviderSettings] = useState<Record<ProviderId, ProviderSettings>>({
    chatgpt: {
      id: 'chatgpt',
      connectionType: 'api',
      selectedModel: 'gpt-4o',
      apiKey: '',
      enabled: true,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are ChatGPT by OpenAI. Provide direct, rigorous, and insightful answers.',
    },
    gemini: {
      id: 'gemini',
      connectionType: 'api',
      selectedModel: 'gemini-3.8-flash',
      apiKey: '',
      enabled: true,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are Gemini by Google. Provide helpful, accurate, well-structured, and comprehensive responses.',
    },
    claude: {
      id: 'claude',
      connectionType: 'api',
      selectedModel: 'claude-3-7-sonnet-20250219',
      apiKey: '',
      enabled: true,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are Claude by Anthropic. Provide nuanced, clear, thoughtful, and technically sound answers.',
    },
    grok: {
      id: 'grok',
      connectionType: 'api',
      selectedModel: 'grok-2-1212',
      apiKey: '',
      enabled: true,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are Grok by xAI. Provide direct, witty, truth-seeking, and mathematically precise responses.',
    },
  });

  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);

  // Active Responses state for current view
  const [activeResponses, setActiveResponses] = useState<Record<ProviderId, ModelResponse>>({
    chatgpt: createEmptyResponse('chatgpt'),
    gemini: createEmptyResponse('gemini'),
    claude: createEmptyResponse('claude'),
    grok: createEmptyResponse('grok'),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const activeAbortController = useRef<AbortController | null>(null);

  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>(null);

  function createEmptyResponse(provider: ProviderId): ModelResponse {
    return {
      id: `resp-${Date.now()}-${provider}`,
      provider,
      modelId: providerSettings?.[provider]?.selectedModel || PROVIDERS_CONFIG[provider].defaultModel,
      content: '',
      status: 'idle',
      durationMs: 0,
      createdAt: new Date().toISOString(),
      connectionType: providerSettings?.[provider]?.connectionType || 'api',
    };
  }

  // -------------------------------------------------------------
  // Initial Data Fetch
  // -------------------------------------------------------------
  useEffect(() => {
    // Load conversations
    fetch('/api/db/conversations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data);
          loadConversation(data[0]);
        } else {
          startNewComparison();
        }
      })
      .catch(() => startNewComparison());

    // Load provider settings
    fetch('/api/settings/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setProviderSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to load settings', err));

    // Load templates
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPromptTemplates(data);
        }
      })
      .catch((err) => console.error('Failed to load templates', err));
  }, []);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        startNewComparison();
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsSecurityOpen(false);
        setIsExtensionOpen(false);
        setIsLibraryOpen(false);
        setIsAnalysisOpen(false);
        setExpandedProvider(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------
  // Conversation Helpers
  // -------------------------------------------------------------
  const startNewComparison = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Multi-Model Comparison',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requests: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newId);
    setCurrentPrompt('');
    setAnalysis(null);
    setActiveResponses({
      chatgpt: createEmptyResponse('chatgpt'),
      gemini: createEmptyResponse('gemini'),
      claude: createEmptyResponse('claude'),
      grok: createEmptyResponse('grok'),
    });
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    const lastRequest = conv.requests[conv.requests.length - 1];
    if (lastRequest) {
      setCurrentPrompt(lastRequest.prompt);
      setActiveResponses(lastRequest.responses);
    } else {
      setCurrentPrompt('');
      setActiveResponses({
        chatgpt: createEmptyResponse('chatgpt'),
        gemini: createEmptyResponse('gemini'),
        claude: createEmptyResponse('claude'),
        grok: createEmptyResponse('grok'),
      });
    }
    setAnalysis(null);
  };

  const currentConv = conversations.find((c) => c.id === currentConversationId);

  const handleUpdateTitle = (newTitle: string) => {
    if (!currentConversationId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversationId ? { ...c, title: newTitle } : c))
    );
    // Persist to server
    if (currentConv) {
      fetch('/api/db/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentConv, title: newTitle }),
      }).catch(console.error);
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/db/conversations/${id}`, { method: 'DELETE' }).catch(console.error);
    if (currentConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        loadConversation(remaining[0]);
      } else {
        startNewComparison();
      }
    }
  };

  // -------------------------------------------------------------
  // THE SIMULTANEOUS MULTI-MODEL EXECUTION
  // -------------------------------------------------------------
  const handleSendPrompt = async (
    promptText: string,
    targets: ProviderId[],
    attachments?: Attachment[]
  ) => {
    if (isGenerating || targets.length === 0) return;

    setIsGenerating(true);
    setCurrentPrompt(promptText);
    setAnalysis(null);

    const promptHash = await calculatePromptHash(promptText);

    // Initialize responses in UI
    const initialResponses = { ...activeResponses };
    targets.forEach((p) => {
      initialResponses[p] = {
        id: `resp-${Date.now()}-${p}`,
        provider: p,
        modelId: providerSettings[p].selectedModel,
        content: '',
        status: 'waiting',
        durationMs: 0,
        createdAt: new Date().toISOString(),
        connectionType: providerSettings[p].connectionType,
      };
    });
    setActiveResponses(initialResponses);

    // Build independent turn history for each provider
    const histories: Record<string, any[]> = {};
    if (currentConv && currentConv.requests.length > 0) {
      targets.forEach((p) => {
        histories[p] = [];
        currentConv.requests.forEach((req) => {
          histories[p].push({ role: 'user', content: req.prompt });
          if (req.responses[p]?.content) {
            histories[p].push({ role: 'assistant', content: req.responses[p].content });
          }
        });
      });
    }

    // Set up AbortController for cancellation
    const abortController = new AbortController();
    activeAbortController.current = abortController;

    try {
      const response = await fetch('/api/compare/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          prompt: promptText,
          promptHash,
          selectedProviders: targets,
          providerSettings,
          histories,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));
            handleStreamEvent(event);
          } catch {
            // ignore partial json
          }
        }
      }

      // Stream fully completed
      setIsGenerating(false);

      // Trigger celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#38bdf8', '#10a37f', '#d97706', '#ec4899'],
      });

      // Save comparison to conversation history
      saveComparisonRequest(promptText, promptHash, targets, attachments);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Comparison cancelled by user.');
      } else {
        console.error('Multi-model comparison failed:', err);
      }
      setIsGenerating(false);
    }
  };

  const handleStreamEvent = (event: any) => {
    const { type, provider, text, durationMs, outputTokens, error } = event;

    if (type === 'start') {
      setActiveResponses((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider as ProviderId],
          status: 'generating',
        },
      }));
    } else if (type === 'chunk') {
      setActiveResponses((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider as ProviderId],
          content: prev[provider as ProviderId].content + text,
          durationMs: durationMs || prev[provider as ProviderId].durationMs,
          status: 'generating',
        },
      }));
    } else if (type === 'done') {
      setActiveResponses((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider as ProviderId],
          status: 'completed',
          durationMs: durationMs || prev[provider as ProviderId].durationMs,
          outputTokens,
        },
      }));
    } else if (type === 'error') {
      setActiveResponses((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider as ProviderId],
          status: 'failed',
          errorMessage: error,
          durationMs: durationMs || prev[provider as ProviderId].durationMs,
        },
      }));
    }
  };

  const saveComparisonRequest = (
    prompt: string,
    promptHash: string,
    targets: ProviderId[],
    attachments?: Attachment[]
  ) => {
    setActiveResponses((currentResponses) => {
      const newRequest: ComparisonRequest = {
        id: `req-${Date.now()}`,
        conversationId: currentConversationId || `conv-${Date.now()}`,
        prompt,
        promptHash,
        attachments,
        createdAt: new Date().toISOString(),
        selectedProviders: targets,
        responses: { ...currentResponses },
      };

      setConversations((prev) => {
        let updatedTitle = currentConv?.title || prompt.slice(0, 32);
        if (currentConv?.title === 'New Multi-Model Comparison') {
          updatedTitle = prompt.slice(0, 38).trim() + (prompt.length > 38 ? '...' : '');
        }

        const updated = prev.map((c) => {
          if (c.id === currentConversationId) {
            return {
              ...c,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              requests: [...c.requests, newRequest],
            };
          }
          return c;
        });

        // Persist to server
        const currentSaved = updated.find((c) => c.id === currentConversationId);
        if (currentSaved) {
          fetch('/api/db/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentSaved),
          }).catch(console.error);
        }

        return updated;
      });

      return currentResponses;
    });
  };

  const handleStopAll = () => {
    if (activeAbortController.current) {
      activeAbortController.current.abort();
      activeAbortController.current = null;
    }
    setIsGenerating(false);
    setActiveResponses((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        const p = key as ProviderId;
        if (copy[p].status === 'generating' || copy[p].status === 'waiting') {
          copy[p].status = 'cancelled';
        }
      });
      return copy;
    });
  };

  const handleStopSingle = (provider: ProviderId) => {
    setActiveResponses((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        status: 'cancelled',
      },
    }));
  };

  const handleRegenerateSingle = (provider: ProviderId) => {
    if (!currentPrompt) return;
    handleSendPrompt(currentPrompt, [provider]);
  };

  const handleClearSingle = (provider: ProviderId) => {
    setActiveResponses((prev) => ({
      ...prev,
      [provider]: createEmptyResponse(provider),
    }));
  };

  const handleSendSingleFollowUp = (provider: ProviderId, message: string) => {
    handleSendPrompt(message, [provider]);
  };

  // -------------------------------------------------------------
  // Compare & Analyze
  // -------------------------------------------------------------
  const handleRunAnalysis = async () => {
    const completedList = Object.values(activeResponses).filter(
      (r) => r.status === 'completed' && r.content.trim().length > 0
    );

    if (completedList.length < 1) {
      alert('Please wait until responses have completed before analyzing.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/compare/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          responses: completedList.map((r) => ({
            provider: r.provider,
            modelId: r.modelId,
            content: r.content,
          })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Analysis service failed');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -------------------------------------------------------------
  // Exports
  // -------------------------------------------------------------
  const handleExportMarkdown = () => {
    const lines = [
      `# OMNIA AI Multi-Model Comparison Report`,
      `**Conversation**: ${currentConv?.title || 'Comparison'}`,
      `**Date**: ${new Date().toISOString()}`,
      `**Prompt**:`,
      `> ${currentPrompt}`,
      '',
      `---`,
      '',
    ];

    (['chatgpt', 'gemini', 'claude', 'grok'] as ProviderId[]).forEach((p) => {
      const resp = activeResponses[p];
      const info = PROVIDERS_CONFIG[p];
      lines.push(`## ${info.name} (${resp.modelId})`);
      lines.push(`- **Status**: ${resp.status}`);
      lines.push(`- **Response Time**: ${resp.durationMs}ms`);
      lines.push('');
      lines.push(resp.content || '_No response generated._');
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnia_comparison_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const data = {
      omnia_version: '1.0.0',
      exported_at: new Date().toISOString(),
      conversation: currentConv,
      active_responses: activeResponses,
      analysis,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnia_comparison_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAllResponses = () => {
    const text = (['chatgpt', 'gemini', 'claude', 'grok'] as ProviderId[])
      .map((p) => {
        const info = PROVIDERS_CONFIG[p];
        const resp = activeResponses[p];
        return `=== ${info.name.toUpperCase()} (${resp.modelId}) ===\n\n${resp.content || '(No response)'}\n`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleClearAllData = async () => {
    await fetch('/api/db/clear', { method: 'POST' }).catch(console.error);
    setConversations([]);
    startNewComparison();
  };

  const hasCompletedResponses = Object.values(activeResponses).some(
    (r) => r.status === 'completed' && r.content.trim().length > 0
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          const conv = conversations.find((c) => c.id === id);
          if (conv) loadConversation(conv);
        }}
        onNewComparison={startNewComparison}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenExtension={() => setIsExtensionOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Comparison Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
        {/* Top Header */}
        <Header
          title={currentConv?.title || 'New Multi-Model Comparison'}
          onUpdateTitle={handleUpdateTitle}
          layout={layout}
          onChangeLayout={setLayout}
          isSyncScroll={isSyncScroll}
          onToggleSyncScroll={() => setIsSyncScroll(!isSyncScroll)}
          onOpenAnalysis={() => setIsAnalysisOpen(true)}
          hasCompletedResponses={hasCompletedResponses}
          onExportMarkdown={handleExportMarkdown}
          onExportJson={handleExportJson}
          onCopyAllResponses={handleCopyAllResponses}
        />

        {/* Four-Model Comparison Grid */}
        <ComparisonGrid
          layout={layout}
          selectedProviders={selectedProviders}
          responses={activeResponses}
          settings={providerSettings}
          onUpdateModel={(p, modelId) => {
            setProviderSettings((prev) => ({
              ...prev,
              [p]: { ...prev[p], selectedModel: modelId },
            }));
            fetch('/api/settings/providers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [p]: { selectedModel: modelId } }),
            }).catch(console.error);
          }}
          onRegenerate={handleRegenerateSingle}
          onStop={handleStopSingle}
          onClear={handleClearSingle}
          onExpand={(p) => setExpandedProvider(p)}
          onSendSingleFollowUp={handleSendSingleFollowUp}
          isSyncScroll={isSyncScroll}
          isGeneratingAny={isGenerating}
        />

        {/* Central Unified Prompt Composer */}
        <PromptComposer
          onSend={handleSendPrompt}
          onStopAll={handleStopAll}
          isGenerating={isGenerating}
          selectedProviders={selectedProviders}
          onToggleProvider={(p) => {
            setSelectedProviders((prev) =>
              prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
            );
          }}
          onSelectAllProviders={() =>
            setSelectedProviders(['chatgpt', 'gemini', 'claude', 'grok'])
          }
          onOpenPromptLibrary={() => setIsLibraryOpen(true)}
        />
      </main>

      {/* Modals */}
      <CompareAnalyzeModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        prompt={currentPrompt}
        responses={activeResponses}
        analysis={analysis}
        isLoading={isAnalyzing}
        onRunAnalysis={handleRunAnalysis}
      />

      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={providerSettings}
        onSaveSettings={(newSettings) => {
          setProviderSettings(newSettings);
          fetch('/api/settings/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
          }).catch(console.error);
        }}
      />

      <SecurityCenterModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onClearAllData={handleClearAllData}
      />

      <BrowserExtensionModal
        isOpen={isExtensionOpen}
        onClose={() => setIsExtensionOpen(false)}
      />

      <PromptLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        templates={promptTemplates}
        onSelectTemplate={(prompt) => {
          handleSendPrompt(prompt, selectedProviders);
        }}
        onCreateTemplate={(newTpl) => {
          setPromptTemplates((prev) => [newTpl, ...prev]);
          fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTpl),
          }).catch(console.error);
        }}
        onDeleteTemplate={(id) => {
          setPromptTemplates((prev) => prev.filter((t) => t.id !== id));
          fetch(`/api/templates/${id}`, { method: 'DELETE' }).catch(console.error);
        }}
      />

      <ExpandedModelModal
        isOpen={expandedProvider !== null}
        onClose={() => setExpandedProvider(null)}
        provider={expandedProvider}
        response={expandedProvider ? activeResponses[expandedProvider] : undefined}
        settings={expandedProvider ? providerSettings[expandedProvider] : undefined}
      />
    </div>
  );
};

export default App;
