import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Circle, Shield, Home, ChevronRight, Target, Loader2, FileEdit } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ISO_13485_SECTIONS, ISO_13485_GROUPS, type ISO13485SectionItem } from '@/config/gapISO13485Sections';
import type { GapAnalysisItem } from '@/types/client';
import { useRegisterRightRail } from '@/context/RightRailContext';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompanyId } from '@/hooks/useCompanyId';

interface GapISO13485SidebarProps {
  items: GapAnalysisItem[];
  disabled?: boolean;
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

export function GapISO13485Sidebar({ items, disabled = false }: GapISO13485SidebarProps) {
  useRegisterRightRail();
  const navigate = useNavigate();
  const { companyName } = useParams();
  const companyId = useCompanyId();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const completionMap = getCompletionMap(items);
  const [creating, setCreating] = useState(false);
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);

  const totalSteps = ISO_13485_SECTIONS.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
  const completedCount = ISO_13485_SECTIONS.reduce((sum, s) => {
    const isComplete = completionMap.get(s.section)?.isComplete || false;
    return sum + (isComplete ? (s.subItems?.length || 1) : 0);
  }, 0);
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const currentStepIndex = ISO_13485_SECTIONS.findIndex(s => !completionMap.get(s.section)?.isComplete);
  const currentConfig = ISO_13485_SECTIONS[currentStepIndex >= 0 ? currentStepIndex : ISO_13485_SECTIONS.length - 1];

  const handleStepClick = async (config: ISO13485SectionItem) => {
    if (disabled || creating) return;
    const baseUrl = `/app/company/${companyName}`;

    if (config.type === 'navigate' && config.route) {
      navigate(`${baseUrl}/${config.route}?returnTo=gap-analysis`);
      return;
    }

    // Evidence type — navigate to existing item
    const entry = completionMap.get(config.section);
    if (entry?.itemId) {
      navigate(`${baseUrl}/gap-analysis/${entry.itemId}`);
      return;
    }

    // Auto-create gap_analysis_items row
    if (config.type === 'evidence') {
      setCreating(true);
      try {
        const { data, error } = await supabase
          .from('gap_analysis_items')
          .insert({
            product_id: null,
            requirement: config.title,
            framework: 'ISO_13485',
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
    }
  };

  // "To Complete This Step" items for the current incomplete step
  const activeStepItems = useMemo(() => {
    if (!currentConfig) return null;
    const isComplete = completionMap.get(currentConfig.section)?.isComplete || false;
    if (isComplete) return null;
    if (currentConfig.subItems && currentConfig.subItems.length > 0) {
      return currentConfig.subItems.map(sub => ({
        label: `§${currentConfig.section}.${sub.letter} ${sub.description}`,
        complete: false,
      }));
    }
    return [{ label: currentConfig.title, complete: false }];
  }, [currentConfig, completionMap]);

  const isAllComplete = completedCount >= totalSteps;

  return (
    <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-60px)] z-30">
      {/* Back to Gap Analysis — always visible at top */}
      <div className="px-4 pt-3 pb-2 border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/app/company/${companyName}/gap-analysis`)}
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
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ISO 13485 QMS
            </span>
          </div>
          {companyId && decodedCompanyName && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowDocCIDialog(true)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Create Document Draft</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <h3 className="font-semibold text-foreground text-sm truncate">
          Step {(currentStepIndex >= 0 ? currentStepIndex : ISO_13485_SECTIONS.length - 1) + 1}: {currentConfig?.title || 'Getting Started'}
        </h3>

        {/* Progress Bar */}
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

      {/* "To Complete This Step" Panel — amber/green like Annex II */}
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
            ? 'All ISO 13485 requirements have been addressed.'
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
          {ISO_13485_GROUPS.map(group => {
            const groupItems = ISO_13485_SECTIONS.filter(s => s.sectionGroup === group.id);
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
                    return (
                      <button
                        key={config.section}
                        onClick={() => handleStepClick(config)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                          isCurrent && "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-medium",
                          !isCurrent && !isComplete && "text-muted-foreground hover:bg-muted/50",
                          isComplete && "text-emerald-600 dark:text-emerald-400"
                        )}
                        disabled={disabled}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            isCurrent ? "text-green-500" : "text-muted-foreground/50"
                          )} />
                        )}
                        <span className="truncate">§{config.section} {config.title}</span>
                      </button>
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
            title="ISO 13485 Gap Analysis Report"
            htmlContent={ISO_13485_SECTIONS
              .map(s => {
                const entry = completionMap.get(s.section);
                const status = entry?.isComplete ? '✅ Compliant' : '⚠️ Non-compliant';
                return `<h2>§${s.section} ${s.title}</h2><p><strong>Status:</strong> ${status}</p>`;
              })
              .join('\n')}
            templateIdKey={`GAP-ISO13485-${companyId}`}
            companyId={companyId}
            companyName={decodedCompanyName}
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
