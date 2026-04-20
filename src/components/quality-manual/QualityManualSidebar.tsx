import React, { useEffect, useMemo, useState } from 'react';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { CheckCircle, Circle, Home, BookOpen, FileEdit, Loader2, Sparkles, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QualityManualSection, QualityManualData } from '@/hooks/useQualityManual';
import { useRegisterRightRail } from '@/context/RightRailContext';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useDraftDocumentNavigation } from '@/hooks/useDraftDocumentNavigation';
import { stripLeadingChapterHeading } from '@/utils/qualityManualContent';
import { QualityManualGenerationDialog, getConfigSummary, type GenerationConfig } from './QualityManualGenerationConfig';

interface QualityManualSidebarProps {
  sections: QualityManualSection[];
  activeSection: string | null;
  onSelectSection: (sectionKey: string | null) => void;
  generating: string | null;
  companyId: string;
  companyName: string;
  exclusions: Map<string, string>;
  onGenerateAll?: (config: GenerationConfig) => void;
  onRegenerateAll?: (config: GenerationConfig) => void;
  generatingAll?: boolean;
  genConfig: GenerationConfig;
  onGenConfigChange: (config: GenerationConfig) => void;
  companyData?: QualityManualData;
}

export function QualityManualSidebar({
  sections,
  activeSection,
  onSelectSection,
  generating,
  companyId,
  companyName,
  exclusions,
  onGenerateAll,
  onRegenerateAll,
  generatingAll,
  genConfig,
  onGenConfigChange,
  companyData,
}: QualityManualSidebarProps) {
  useRegisterRightRail();
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const templateIdKey = `QM-FULL-${companyId}`;
  const { handleDraftClick, checking } = useDraftDocumentNavigation(companyId, companyName);
  const [draftExists, setDraftExists] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'generate' | 'regenerate' | null>(null);

  useEffect(() => {
    if (!companyId) return;
    DocumentStudioPersistenceService.getDocumentCIsByReference(companyId, templateIdKey)
      .then(result => setDraftExists(!!(result.data && result.data.length > 0)))
      .catch(() => setDraftExists(false));
  }, [companyId, templateIdKey]);

  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    sections.forEach(s => {
      map.set(s.sectionKey, !!(s.content && s.content.length > 20));
    });
    return map;
  }, [sections]);

  const totalSteps = sections.length;
  const completedCount = sections.filter(s => s.content && s.content.length > 20).length;
  const remainingCount = totalSteps - completedCount;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const handleOpenSettings = (action: 'generate' | 'regenerate') => {
    setPopoverOpen(false);
    setPendingAction(action);
    setSettingsDialogOpen(true);
  };

  const handleDraft = () => {
    setPopoverOpen(false);
    handleDraftClick(
      templateIdKey,
      () => setShowDocCIDialog(true),
      (doc) => setDraftDrawerDoc(doc)
    );
  };

  return (
    <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-64px)] z-30">
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ISO 13485 Quality Manual
            </span>
          </div>
          {companyId && companyName && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "p-1 rounded-md hover:bg-muted/50 transition-colors",
                    draftExists ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileEdit className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" align="start" className="w-56 p-2">
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-[10px] text-muted-foreground">{getConfigSummary(genConfig)}</p>
                </div>
                {remainingCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={generatingAll}
                    onClick={() => handleOpenSettings('generate')}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Generate Remaining ({remainingCount})
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  disabled={checking}
                  onClick={handleDraft}
                >
                  {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileEdit className="h-3.5 w-3.5" />}
                  {draftExists ? 'Open Document Draft' : 'Create Document Draft'}
                </Button>
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  disabled={generatingAll}
                  onClick={() => handleOpenSettings('regenerate')}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Regenerate All Chapters
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {completedCount}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Section List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16">
        {activeSection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectSection(null)}
            className="w-full justify-start gap-2 mb-3 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="text-xs">Back to Quality Manual</span>
          </Button>
        )}

        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Chapters
        </h4>

        <div className="space-y-0.5">
          {sections.map(section => {
            const isComplete = completionMap.get(section.sectionKey) || false;
            const isActive = section.sectionKey === activeSection;
            return (
              <button
                key={section.sectionKey}
                onClick={() => onSelectSection(section.sectionKey)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                  isActive && "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium",
                  !isActive && !isComplete && "text-muted-foreground hover:bg-muted/50",
                  isComplete && !isActive && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Circle className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    isActive ? "text-blue-500" : "text-muted-foreground/50"
                  )} />
                )}
                <span className="truncate">
                  {section.chapterNumber}. {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation Settings Dialog */}
      <QualityManualGenerationDialog
        open={settingsDialogOpen}
        onOpenChange={(open) => { if (!open) setPendingAction(null); setSettingsDialogOpen(open); }}
        config={genConfig}
        onChange={onGenConfigChange}
        companyData={companyData}
        onConfirm={pendingAction ? () => {
          if (pendingAction === 'generate') {
            onGenerateAll?.(genConfig);
          } else if (pendingAction === 'regenerate') {
            onRegenerateAll?.(genConfig);
          }
          setPendingAction(null);
        } : undefined}
        confirmLabel={pendingAction === 'generate' ? `Generate ${remainingCount} Chapters` : pendingAction === 'regenerate' ? 'Regenerate All Chapters' : undefined}
      />

      {/* Document Draft Dialog */}
      {companyId && companyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title="Complete Quality Manual — ISO 13485"
            htmlContent={sections
              .filter(s => !exclusions.has(s.clause) && s.content && s.content.length > 20)
              .map(s => `<h2>Chapter ${s.chapterNumber}: ${s.title}</h2>${stripLeadingChapterHeading(s.content || '')}`)
              .join('\n')}
            templateIdKey={`QM-FULL-${companyId}`}
            companyId={companyId}
            companyName={companyName}
            defaultScope="enterprise"
            onDocumentCreated={(docId, docName, docType) => setDraftDrawerDoc({ id: docId, name: docName, type: docType })}
          />
          <DocumentDraftDrawer
            open={!!draftDrawerDoc}
            onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
            documentId={draftDrawerDoc?.id || ''}
            documentName={draftDrawerDoc?.name || ''}
            documentType={draftDrawerDoc?.type || ''}
            companyId={companyId}
          />
        </>
      )}
    </div>
  );
}
