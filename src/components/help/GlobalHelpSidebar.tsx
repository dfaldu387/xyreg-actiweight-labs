import React, { useState, useCallback, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContextualHelpTopic, helpTopicMap } from '@/hooks/useContextualHelpTopic';
import { getHelpContent } from './helpContentRegistry';
import { HelpSearch } from './HelpSearch';
import { RelatedTopics } from './RelatedTopics';
import { UDIHelpContent } from './UDIHelpContent';
import { EudamedHelpContent } from './EudamedHelpContent';
import { HelpTopicDetailScreen, navigableTopics } from './HelpTopicDetailScreen';
import { HelpHintsToggle } from './HelpHintsToggle';
import { ComplianceModeToggle } from './ComplianceModeToggle';
import { AdvisoryBoardToggle } from './AdvisoryBoardToggle';
import { PlatformGuideTab } from './PlatformGuideTab';
import { ReferenceTab } from './ReferenceTab';
import { VersionHistoryTab } from './VersionHistoryTab';
import { useTranslation } from '@/hooks/useTranslation';
import { Compass, GraduationCap, BookOpen, History } from 'lucide-react';

interface GlobalHelpSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listenForGlobalEvents?: boolean;
  onStartTour?: () => void;
}

export function GlobalHelpSidebar({ open, onOpenChange, listenForGlobalEvents = false, onStartTour }: GlobalHelpSidebarProps) {
  const { lang } = useTranslation();
  const contextualTopic = useContextualHelpTopic();
  const [overrideTopic, setOverrideTopic] = useState<string | null>(null);
  const [detailScreen, setDetailScreen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('context');
  const [glossarySearchTerm, setGlossarySearchTerm] = useState<string | null>(null);
  
  const currentTopicKey = overrideTopic || contextualTopic.key;
  const currentTopic = overrideTopic 
    ? helpTopicMap[overrideTopic] || contextualTopic
    : contextualTopic;
  
  const HelpContent = getHelpContent(currentTopicKey);
  const IconComponent = currentTopic.icon;

  const handleNavigateToTopic = useCallback((topicKey: string) => {
    setOverrideTopic(topicKey);
  }, []);

  const handleClearOverride = useCallback(() => {
    setOverrideTopic(null);
  }, []);

  const handleNavigateToDetail = useCallback((detailId: string) => {
    setDetailScreen(detailId);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setDetailScreen(null);
  }, []);

  const handleNavigateToGlossary = useCallback((searchTerm: string) => {
    setGlossarySearchTerm(searchTerm);
    setActiveTab('reference');
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setOverrideTopic(null);
      setDetailScreen(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Defensive: if a guided tour starts from anywhere, force-close this sheet.
  useEffect(() => {
    const handler = () => {
      if (open) onOpenChange(false);
    };
    window.addEventListener('xyreg:tour-start', handler);
    return () => window.removeEventListener('xyreg:tour-start', handler);
  }, [open, onOpenChange]);

  // Listen for global glossary navigation events (from NavigationSearchDialog)
  // Only the primary instance (AppLayout) should listen to avoid duplicate opens
  useEffect(() => {
    if (!listenForGlobalEvents) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.searchTerm) {
        setGlossarySearchTerm(detail.searchTerm);
        setActiveTab('reference');
        onOpenChange(true);
      }
    };
    window.addEventListener('xyreg:open-glossary', handler);
    return () => window.removeEventListener('xyreg:open-glossary', handler);
  }, [onOpenChange, listenForGlobalEvents]);

  const useSpecializedContent = currentTopicKey === 'udi-management' || currentTopicKey === 'eudamed';

  if (detailScreen) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange} modal={false}>
        <SheetContent 
          side="right" 
          className="w-[90vw] sm:w-[900px] md:w-[1080px] p-0 flex flex-col text-base top-16 h-[calc(100vh-4rem)] z-40"
          onPointerDownOutside={(e: any) => {
            const t = e?.target as HTMLElement | null;
            if (t?.closest?.('[data-help-toggle]')) e.preventDefault();
          }}
          onInteractOutside={(e: any) => {
            const t = e?.target as HTMLElement | null;
            if (t?.closest?.('[data-help-toggle]')) e.preventDefault();
          }}
        >
          <ScrollArea className="flex-1">
            <HelpTopicDetailScreen topicId={detailScreen} onBack={handleBackFromDetail} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Sheet open={open} onOpenChange={handleOpenChange} modal={false}>
        <SheetContent 
          side="right" 
          className="w-[90vw] sm:w-[900px] md:w-[1080px] p-0 flex flex-col text-base top-16 h-[calc(100vh-4rem)] z-40"
          onPointerDownOutside={(e: any) => {
            const t = e?.target as HTMLElement | null;
            if (t?.closest?.('[data-help-toggle]')) e.preventDefault();
          }}
          onInteractOutside={(e: any) => {
            const t = e?.target as HTMLElement | null;
            if (t?.closest?.('[data-help-toggle]')) e.preventDefault();
          }}
        >
        <SheetHeader className="p-6 pb-4 border-b space-y-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {lang('help.sidebar.title')}
          </SheetTitle>
          {/* Toggles row */}
          <div className="flex gap-2">
            <div className="flex-1"><HelpHintsToggle /></div>
            <div className="flex-1"><ComplianceModeToggle /></div>
            <div className="flex-1"><AdvisoryBoardToggle /></div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="context" className="flex-1 gap-1.5">
                <Compass className="h-4 w-4" /> {lang('help.sidebar.tabs.context')}
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex-1 gap-1.5">
                <GraduationCap className="h-4 w-4" /> {lang('help.sidebar.tabs.guide')}
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex-1 gap-1.5">
                <BookOpen className="h-4 w-4" /> {lang('help.sidebar.tabs.reference')}
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex-1 gap-1.5">
                <History className="h-4 w-4" /> {lang('help.sidebar.tabs.versions')}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="context" className="mt-0 p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{lang(`help.topicTitles.${currentTopicKey}`) !== `help.topicTitles.${currentTopicKey}` ? lang(`help.topicTitles.${currentTopicKey}`) : currentTopic.title}</h2>
                </div>
                {!useSpecializedContent && (
                  <HelpSearch 
                    onSelectTopic={handleNavigateToTopic} 
                    onClear={handleClearOverride}
                    onNavigateToGlossary={handleNavigateToGlossary}
                  />
                )}
              </div>
              <div className="text-base leading-relaxed">
                {currentTopicKey === 'udi-management' ? (
                  <UDIHelpContent />
                ) : currentTopicKey === 'eudamed' ? (
                  <EudamedHelpContent />
                ) : (
                  <>
                    <HelpContent targetMarkets={[]} onNavigateToDetail={handleNavigateToDetail} />
                    <RelatedTopics 
                      currentTopic={currentTopicKey} 
                      onNavigate={handleNavigateToTopic}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="guide" className="mt-0 p-6">
              <PlatformGuideTab onStartTour={onStartTour ? () => { onOpenChange(false); onStartTour(); } : undefined} />
            </TabsContent>

            <TabsContent value="reference" className="mt-0 p-6">
              <ReferenceTab initialGlossarySearch={glossarySearchTerm} onGlossaryOpened={() => setGlossarySearchTerm(null)} />
            </TabsContent>

            <TabsContent value="versions" className="mt-0 p-6">
              <VersionHistoryTab onClose={() => handleOpenChange(false)} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
