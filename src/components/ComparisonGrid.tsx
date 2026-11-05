import React, { useRef, useEffect } from 'react';
import { ProviderId, ModelResponse, ProviderSettings, ViewLayout } from '../types';
import { ModelCard } from './ModelCard';

interface ComparisonGridProps {
  layout: ViewLayout;
  selectedProviders: ProviderId[];
  responses: Record<ProviderId, ModelResponse>;
  settings: Record<ProviderId, ProviderSettings>;
  onUpdateModel: (provider: ProviderId, modelId: string) => void;
  onRegenerate: (provider: ProviderId) => void;
  onStop: (provider: ProviderId) => void;
  onClear: (provider: ProviderId) => void;
  onExpand: (provider: ProviderId) => void;
  onSendSingleFollowUp: (provider: ProviderId, message: string) => void;
  isSyncScroll: boolean;
  isGeneratingAny: boolean;
}

export const ComparisonGrid: React.FC<ComparisonGridProps> = ({
  layout,
  selectedProviders,
  responses,
  settings,
  onUpdateModel,
  onRegenerate,
  onStop,
  onClear,
  onExpand,
  onSendSingleFollowUp,
  isSyncScroll,
  isGeneratingAny,
}) => {
  const panelRefs = useRef<Map<ProviderId, HTMLDivElement | null>>(new Map());
  const isScrollingSync = useRef(false);

  // Synchronized scrolling mechanism
  useEffect(() => {
    if (!isSyncScroll) return;

    const cleanups: (() => void)[] = [];

    panelRefs.current.forEach((node, provider) => {
      if (!node) return;

      const handleScroll = () => {
        if (isScrollingSync.current) return;
        isScrollingSync.current = true;

        const percentage = node.scrollTop / (node.scrollHeight - node.clientHeight || 1);

        panelRefs.current.forEach((otherNode, otherProvider) => {
          if (otherProvider !== provider && otherNode) {
            otherNode.scrollTop = percentage * (otherNode.scrollHeight - otherNode.clientHeight);
          }
        });

        setTimeout(() => {
          isScrollingSync.current = false;
        }, 30);
      };

      node.addEventListener('scroll', handleScroll, { passive: true });
      cleanups.push(() => node.removeEventListener('scroll', handleScroll));
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [isSyncScroll, selectedProviders]);

  const activeList: ProviderId[] = ['chatgpt', 'gemini', 'claude', 'grok'];

  // Determine grid container styling based on layout
  let containerClasses = 'grid h-full gap-3 p-4 overflow-hidden';
  if (layout === 'grid-2x2') {
    containerClasses += ' grid-cols-1 md:grid-cols-2 grid-rows-2';
  } else if (layout === 'columns-4') {
    containerClasses += ' grid-cols-1 md:grid-cols-4 grid-rows-1 overflow-x-auto min-w-[1000px]';
  } else if (layout === 'split-2') {
    containerClasses += ' grid-cols-1 md:grid-cols-2 grid-rows-1';
  } else if (layout === 'single') {
    containerClasses += ' grid-cols-1 grid-rows-1';
  }

  // Filter models for split or single view if needed
  const displayedProviders =
    layout === 'single'
      ? [activeList[0]]
      : layout === 'split-2'
      ? activeList.slice(0, 2)
      : activeList;

  return (
    <div className="flex-1 overflow-hidden relative">
      <div className={containerClasses}>
        {displayedProviders.map((provider) => (
          <div key={provider} className="h-full min-h-[300px] overflow-hidden">
            <ModelCard
              provider={provider}
              response={responses[provider]}
              settings={settings[provider]}
              onUpdateModel={onUpdateModel}
              onRegenerate={onRegenerate}
              onStop={onStop}
              onClear={onClear}
              onExpand={onExpand}
              onSendSingleFollowUp={onSendSingleFollowUp}
              syncScrollRef={(el) => panelRefs.current.set(provider, el)}
              isGeneratingAny={isGeneratingAny}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
