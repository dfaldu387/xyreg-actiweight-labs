import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Circle, Home, ChevronRight, Target, FileText, Loader2, FileEdit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ANNEX_II_SECTIONS, ANNEX_II_GROUPS, type AnnexIISectionItem } from '@/config/gapAnnexIISections';
import type { GapAnalysisItem } from '@/types/client';
import type { ActiveSubStep } from '@/components/company/gap-analysis/GenericGapSidebar';
import { useRegisterRightRail } from '@/context/RightRailContext';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useDraftDocumentNavigation } from '@/hooks/useDraftDocumentNavigation';

interface GapAnnexIISidebarProps {
  items: GapAnalysisItem[];
  disabled?: boolean;
  /** Currently active section (e.g. '1.1') — shows nested sub-steps */
  activeSection?: string;
  /** Sub-steps for the active section */
  activeSteps?: ActiveSubStep[];
  /** Index of the currently active sub-step */
  activeStepIndex?: number;
  /** Callback when a sub-step is clicked */
  onStepClick?: (index: number) => void;
}

function getCompletionMap(items: GapAnalysisItem[]): Map<string, { isComplete: boolean; itemId: string }> {
  const map = new Map<string, { isComplete: boolean; itemId: string }>();
  items.forEach(item => {
    const section = (item as any).section;
    if (section) {
      const existing = map.get(section);
      if (!existing) {
        map.set(section, { isComplete: item.status === 'compliant', itemId: item.id });
      } else if (!existing.isComplete && item.status === 'compliant') {
        map.set(section, { isComplete: true, itemId: item.id });
      }
    }
  });
  return map;
}

export function GapAnnexIISidebar({
  items,
  disabled = false,
  activeSection,
  activeSteps,
  activeStepIndex,
  onStepClick,
}: GapAnnexIISidebarProps) {
  useRegisterRightRail();
  const navigate = useNavigate();
  const { productId, companyName } = useParams();
  const companyId = useCompanyId();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const [creating, setCreating] = useState(false);
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const annexTemplateIdKey = `GAP-ANNEX-II-${productId || companyId}`;
  const { handleDraftClick, checking: checkingDraft } = useDraftDocumentNavigation(companyId, decodedCompanyName, productId || undefined);

  const completionMap = getCompletionMap(items);
  const baseUrl = `/app/product/${productId}`;

  const totalSteps = ANNEX_II_SECTIONS.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
  const completedCount = ANNEX_II_SECTIONS.reduce((sum, s) => {
    const isComplete = completionMap.get(s.section)?.isComplete || false;
    return sum + (isComplete ? (s.subItems?.length || 1) : 0);
  }, 0);
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const currentStepIndex = ANNEX_II_SECTIONS.findIndex(s => !completionMap.get(s.section)?.isComplete);
  const currentConfig = ANNEX_II_SECTIONS[currentStepIndex >= 0 ? currentStepIndex : ANNEX_II_SECTIONS.length - 1];

  const viewedConfig = activeSection ? ANNEX_II_SECTIONS.find(s => s.section === activeSection) : currentConfig;

  const handleStepClick = async (config: AnnexIISectionItem) => {
    if (disabled || creating) return;
    const entry = completionMap.get(config.section);
    if (entry?.itemId) {
      navigate(`${baseUrl}/gap-analysis/${entry.itemId}`);
      return;
    }
    // Auto-create
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .insert({
          product_id: productId || null,
          requirement: config.title,
          framework: 'MDR_ANNEX_II',
          section: config.section,
          clause_id: config.section,
          clause_summary: config.title,
          status: 'non_compliant',
          action_needed: '',
        })
        .select('id')
        .single();
      if (error) throw error;
      if (data) {
        navigate(`${baseUrl}/gap-analysis/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create gap item:', err);
      toast.error('Failed to create gap analysis item');
    } finally {
      setCreating(false);
    }
  };

  const activeStepItems = useMemo(() => {
    const cfg = viewedConfig || currentConfig;
    if (!cfg) return null;
    const isComplete = completionMap.get(cfg.section)?.isComplete || false;
    if (isComplete) return null;
    if (activeSection && activeSteps && activeSteps.length > 0) {
      return activeSteps.map(step => ({ label: step.label, complete: step.complete }));
    }
    if (cfg.subItems && cfg.subItems.length > 0) {
      return cfg.subItems.map(sub => ({
        label: `§${cfg.section}.${sub.letter} ${sub.description}`,
        complete: false,
      }));
    }
    return [{ label: cfg.title, complete: false }];
  }, [viewedConfig, currentConfig, completionMap, activeSection, activeSteps]);

  const isAllComplete = completedCount >= totalSteps;

  return (
    <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-64px)] z-30">
      {/* Back to Gap Analysis — always visible at top */}
      <div className="px-4 pt-3 pb-2 border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${baseUrl}/gap-analysis`)}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="text-xs">Back to Gap Analysis</span>
        </Button>
      </div>

      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Technical Documentation
            </span>
          </div>
          {companyId && decodedCompanyName && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDraftClick(annexTemplateIdKey, () => setShowDocCIDialog(true))}
                    disabled={checkingDraft}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {checkingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileEdit className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Create Document Draft</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <h3 className="font-semibold text-foreground text-sm truncate">
          {viewedConfig
            ? `§${viewedConfig.section}: ${viewedConfig.title}`
            : `Step ${(currentStepIndex >= 0 ? currentStepIndex : ANNEX_II_SECTIONS.length - 1) + 1}: ${currentConfig?.title || 'Getting Started'}`
          }
        </h3>
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

      {/* "To Complete This Step" Panel */}
      <div className={cn(
        "p-4 border-b flex-shrink-0",
        isAllComplete || !activeStepItems
          ? "bg-emerald-50 dark:bg-emerald-950/20"
          : "bg-amber-50 dark:bg-amber-950/20"
      )}>
        <h4 className={cn(
          "text-sm font-medium flex items-center gap-2",
          isAllComplete || !activeStepItems
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-amber-800 dark:text-amber-300"
        )}>
          <Target className="h-4 w-4" />
          {isAllComplete || !activeStepItems ? 'Step Complete ✓' : 'To Complete This Step'}
        </h4>
        <p className={cn(
          "text-xs mt-1",
          isAllComplete || !activeStepItems
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400"
        )}>
          {isAllComplete
            ? 'All Annex II requirements have been addressed.'
            : viewedConfig
              ? `§${viewedConfig.section}: ${viewedConfig.title}`
              : `§${currentConfig?.section}: ${currentConfig?.title}`
          }
        </p>
        {activeStepItems && activeStepItems.length > 0 && (
          <div className="relative mt-2">
            {activeStepItems.length > 4 && (
              <span className="text-[10px] text-muted-foreground mb-1 block">
                {activeStepItems.filter(i => !i.complete).length}/{activeStepItems.length} remaining
              </span>
            )}
            <div className="max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <ul className="space-y-1.5">
                {activeStepItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    {item.complete ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <span className={cn("text-foreground", item.complete && "line-through opacity-60")}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {activeStepItems.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-50 dark:from-amber-950/20 to-transparent pointer-events-none" />
            )}
          </div>
        )}
        {activeStepItems && !isAllComplete && currentConfig && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStepClick(currentConfig)}
            disabled={disabled}
            className="mt-2 h-7 text-xs gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-2"
          >
            Go to step
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Back to Gap Analysis + All Sections */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          All Sections
        </h4>

        <div className="space-y-4">
          {ANNEX_II_GROUPS.map(group => {
            const groupItems = ANNEX_II_SECTIONS.filter(s => s.sectionGroup === group.id);
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    §{group.id} {group.name}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupItems.map(config => {
                    const isComplete = completionMap.get(config.section)?.isComplete || false;
                    const isCurrent = config.section === currentConfig?.section;
                    const isActiveSec = config.section === activeSection;
                    return (
                      <React.Fragment key={config.section}>
                        <button
                          onClick={() => handleStepClick(config)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                            isActiveSec && "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium",
                            isCurrent && !isActiveSec && "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
                            !isCurrent && !isActiveSec && !isComplete && "text-muted-foreground hover:bg-muted/50",
                            isComplete && !isActiveSec && "text-emerald-600 dark:text-emerald-400"
                          )}
                          disabled={disabled || creating}
                        >
                          {creating && isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                          ) : isComplete ? (
                            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className={cn(
                              "h-3.5 w-3.5 flex-shrink-0",
                              (isCurrent || isActiveSec) ? "text-blue-500" : "text-muted-foreground/50"
                            )} />
                          )}
                          <span className="truncate">§{config.section} {config.title}</span>
                        </button>
                        {/* Nested sub-steps for active section */}
                        {isActiveSec && activeSteps && activeSteps.length > 0 && (
                          <div className="ml-5 pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-0.5 my-1">
                            {activeSteps.map((step, idx) => {
                              const isCurrentStep = idx === activeStepIndex;
                              return (
                                <button
                                  key={step.id}
                                  onClick={() => onStepClick?.(idx)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-colors text-left",
                                    isCurrentStep && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium",
                                    !isCurrentStep && !step.complete && "text-muted-foreground hover:bg-muted/30",
                                    step.complete && !isCurrentStep && "text-emerald-600 dark:text-emerald-400"
                                  )}
                                >
                                  {step.complete ? (
                                    <CheckCircle className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                                  ) : (
                                    <div className={cn(
                                      "h-3 w-3 rounded-full flex items-center justify-center text-[8px] font-bold border flex-shrink-0",
                                      isCurrentStep
                                        ? "border-blue-500 text-blue-600"
                                        : "border-muted-foreground/40 text-muted-foreground"
                                    )}>
                                      {idx + 1}
                                    </div>
                                  )}
                                  <span className="truncate">{step.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Draft Dialog */}
      {companyId && decodedCompanyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title="Annex II Technical Documentation Gap Analysis"
            htmlContent={ANNEX_II_SECTIONS
              .map(s => {
                const entry = completionMap.get(s.section);
                const status = entry?.isComplete ? '✅ Compliant' : '⚠️ Non-compliant';
                return `<h2>§${s.section} ${s.title}</h2><p><strong>Status:</strong> ${status}</p>`;
              })
              .join('\n')}
            templateIdKey={`GAP-ANNEX-II-${productId || companyId}`}
            companyId={companyId}
            companyName={decodedCompanyName}
            productId={productId || undefined}
            defaultScope="device"
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
