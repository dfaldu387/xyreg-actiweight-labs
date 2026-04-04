import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHelpMode } from '@/context/HelpModeContext';
import { helpContentRegistry, type HelpEntry } from './contextualHelpContent';
import { HelpDrawer } from './HelpDrawer';
import { BookOpen } from 'lucide-react';

interface HelpAnchorProps {
  helpKey: string;
  children: React.ReactNode;
  trigger?: 'hover' | 'click';
}

export function HelpAnchor({ helpKey, children, trigger = 'hover' }: HelpAnchorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isComplianceMode, isHelpEnabled } = useHelpMode();
  const openTimeout = useRef<ReturnType<typeof setTimeout>>();
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>();

  const entry = helpContentRegistry[helpKey];
  if (!entry || !isHelpEnabled) return <>{children}</>;

  const card = isComplianceMode && entry.complianceCard ? entry.complianceCard : entry.card;
  const article = isComplianceMode && entry.complianceArticle ? entry.complianceArticle : entry.article;

  const seenKey = `help-seen-${helpKey}`;
  const hasSeen = localStorage.getItem(seenKey) === 'true';

  const markSeen = () => localStorage.setItem(seenKey, 'true');

  const scheduleOpen = () => {
    clearTimeout(closeTimeout.current);
    openTimeout.current = setTimeout(() => { setIsOpen(true); markSeen(); }, 400);
  };

  const scheduleClose = () => {
    clearTimeout(openTimeout.current);
    closeTimeout.current = setTimeout(() => setIsOpen(false), 300);
  };

  const cancelClose = () => clearTimeout(closeTimeout.current);

  const hoverProps = trigger === 'hover' ? {
    onMouseEnter: scheduleOpen,
    onMouseLeave: scheduleClose,
  } : {};

  return (
    <>
      <Popover open={isOpen} onOpenChange={(open) => { if (!open) scheduleClose(); }}>
        <PopoverTrigger asChild>
          <div className="relative w-full" {...hoverProps}>
            {children}
            {/* Layer 1: Pulsing dot */}
            {!hasSeen && (
              <span
                className="absolute -top-0.5 -right-0.5 z-10 flex h-2.5 w-2.5"
                onClick={(e) => { e.stopPropagation(); scheduleOpen(); }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
            )}
          </div>
        </PopoverTrigger>

        {/* Layer 2: Glassmorphism floating card */}
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[280px] rounded-xl border border-border/30 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl bg-background/85 z-[9999]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            {'standard' in card && card.standard && (
              <p className="text-[10px] font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded">
                📎 {card.standard}
              </p>
            )}
            {'example' in card && card.example && (
              <p className="text-[10px] italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                {card.example}
              </p>
            )}
            {article && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setDrawerOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors mt-2"
              >
                <BookOpen className="h-3 w-3" />
                Read More
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Layer 3: Side drawer */}
      {article && (
        <HelpDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={card.title}
          content={article}
          isCompliance={isComplianceMode}
        />
      )}
    </>
  );
}
