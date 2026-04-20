
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { EnhancedHelpSystem } from './EnhancedHelpSystem';
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingTour } from '@/context/OnboardingTourContext';
import { platformGuideModule } from './moduleContent/platformGuideModule';
import { ComplianceModeToggle } from './ComplianceModeToggle';
import { HelpHintsToggle } from './HelpHintsToggle';
import { AdvisoryBoardToggle } from './AdvisoryBoardToggle';

export function HelpButton() {
  const { lang } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [autoOpenSectionIndex, setAutoOpenSectionIndex] = useState<number | null>(null);
  const [autoOpenTrigger, setAutoOpenTrigger] = useState(0);
  const [autoCompleteSection, setAutoCompleteSection] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('help-button-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const isMobile = useIsMobile();
  const { setOnPlatformTourComplete, setOnPlatformTourStart } = useOnboardingTour();

  // Register callback: when a platform tour finishes, reopen help at the next section
  const handleTourComplete = useCallback((completedSectionId: string, completed: boolean) => {
    const steps = platformGuideModule.steps;
    const completedIndex = steps.findIndex(s => s.id === completedSectionId);
    // If completed (Done), advance to next section; if skipped, stay on same section
    const nextIndex = completed && completedIndex >= 0 && completedIndex < steps.length - 1
      ? completedIndex + 1
      : Math.max(completedIndex, 0);
    setAutoOpenSectionIndex(nextIndex);
    setAutoOpenTrigger(prev => prev + 1); // unique trigger to force re-open
    if (completed) {
      setAutoCompleteSection(completedSectionId); // mark as complete
    }
    setIsHelpOpen(true);
  }, []);

  // When a platform tour starts, dismiss the Help panel so it doesn't cover the page
  const handleTourStart = useCallback(() => {
    setIsHelpOpen(false);
    setAutoOpenSectionIndex(null);
  }, []);

  useEffect(() => {
    setOnPlatformTourComplete(handleTourComplete);
    setOnPlatformTourStart(handleTourStart);
    return () => {
      setOnPlatformTourComplete(null);
      setOnPlatformTourStart(null);
    };
  }, [handleTourComplete, handleTourStart, setOnPlatformTourComplete, setOnPlatformTourStart]);

  // Belt-and-braces: also listen for the global tour-start event in case the
  // ref-based callback is not yet registered when the tour fires.
  useEffect(() => {
    const close = () => {
      setIsHelpOpen(false);
      setAutoOpenSectionIndex(null);
    };
    window.addEventListener('xyreg:tour-start', close);
    return () => window.removeEventListener('xyreg:tour-start', close);
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('help-button-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Keyboard shortcut (F1) to toggle help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const handleOpenHelp = () => {
    setIsHelpOpen(true);
  };

  // Smart positioning based on screen size and collapsed state
  const getPositionClasses = () => {
    if (isCollapsed) {
      return isMobile 
        ? "fixed top-1/2 -translate-y-1/2 right-0 z-40" 
        : "fixed top-1/2 -translate-y-1/2 right-0 z-40";
    }
    return isMobile 
      ? "fixed bottom-4 right-4 z-40" 
      : "fixed bottom-[9rem] right-6 z-40";
  };

  if (isCollapsed) {
    return (
      <>
        {/* Collapsed state - small tab on the edge */}
        <div className={`${getPositionClasses()} group`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHelp}
            className="
              bg-gradient-to-r from-help-primary to-help-secondary
              hover:from-help-primary/90 hover:to-help-secondary/90
              border-0 text-white
              shadow-xl hover:shadow-2xl 
              transition-all duration-300 ease-out
              rounded-l-full h-10 w-8 p-0
              hover:w-12 hover:shadow-glow
              flex items-center justify-center"
            title={lang('helpButton.title')}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          {/* Expand button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="
              absolute -left-6 top-1/2 -translate-y-1/2
              bg-muted/80 hover:bg-muted
              border border-border/50
              w-6 h-6 p-0 rounded-full
              opacity-0 group-hover:opacity-100
              transition-all duration-200"
            title={lang('helpButton.expand')}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
        
        <EnhancedHelpSystem
          isOpen={isHelpOpen}
          onClose={() => { setIsHelpOpen(false); setAutoOpenSectionIndex(null); }}
          autoOpenSectionIndex={autoOpenSectionIndex}
          autoOpenTrigger={autoOpenTrigger}
          autoCompleteSection={autoCompleteSection}
          onAutoCompleteConsumed={() => setAutoCompleteSection(null)}
        />
      </>
    );
  }

  return (
    <>
      {/* Expanded state - full button with compliance toggle */}
      <div className={`${getPositionClasses()} group flex flex-col items-end gap-2`}>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col gap-1">
          <HelpHintsToggle />
          <ComplianceModeToggle />
          <AdvisoryBoardToggle />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenHelp}
          className="
            bg-gradient-to-r from-help-primary to-help-secondary
            hover:from-help-primary/90 hover:to-help-secondary/90
            border-0 text-white
            shadow-2xl hover:shadow-3xl 
            transition-all duration-300 ease-out
            rounded-full h-14 w-14 p-0
            hover:scale-110 active:scale-95
            animate-pulse-glow"
          title="XyReg Guide & Help (F1)"
        >
          <div className="relative">
            <HelpCircle className="h-6 w-6 transition-transform group-hover:rotate-12" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        </Button>
        
        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleCollapse}
          className="
            absolute -top-2 -left-2
            bg-muted/80 hover:bg-muted
            border border-border/50
            w-6 h-6 p-0 rounded-full
            opacity-0 group-hover:opacity-100
            transition-all duration-200"
          title={lang('helpButton.minimize')}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      
      <EnhancedHelpSystem
        isOpen={isHelpOpen}
        onClose={() => { setIsHelpOpen(false); setAutoOpenSectionIndex(null); }}
        autoOpenSectionIndex={autoOpenSectionIndex}
        autoOpenTrigger={autoOpenTrigger}
        autoCompleteSection={autoCompleteSection}
        onAutoCompleteConsumed={() => setAutoCompleteSection(null)}
      />
    </>
  );
}
