import React, { useState } from 'react';
import { ISO_13485_SECTIONS, ISO_13485_GROUPS } from '@/config/gapISO13485Sections';
import { GapAnnexIISectionGroup } from '@/components/product/gap-analysis/GapAnnexIISectionGroup';
import { GapISO13485StepRow } from './GapISO13485StepRow';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Shield, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GapAnalysisItem } from '@/types/client';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { StandardStatusBadge } from './StandardStatusBadge';
import type { StandardVersionStatus } from '@/hooks/useStandardVersionStatus';

interface GapISO13485LaunchViewProps {
  items: GapAnalysisItem[];
  disabled?: boolean;
  companyId?: string;
  companyName?: string;
  standardStatus?: StandardVersionStatus;
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

export function GapISO13485LaunchView({ items, disabled = false, companyId, companyName, standardStatus }: GapISO13485LaunchViewProps) {
  const completionMap = getCompletionMap(items);
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);

  const totalSteps = ISO_13485_SECTIONS.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
  const completedCount = ISO_13485_SECTIONS.reduce((sum, s) => {
    const isComplete = completionMap.get(s.section)?.isComplete || false;
    return sum + (isComplete ? (s.subItems?.length || 1) : 0);
  }, 0);
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const nextIncomplete = ISO_13485_SECTIONS.find(s => !completionMap.get(s.section)?.isComplete);

  return (
    <div>
      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-green-200 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-green-700 dark:text-green-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">ISO 13485 — Quality Management System</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-600 text-white uppercase tracking-wider">ISO 13485</span>
              <StandardStatusBadge status={standardStatus} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build your complete ISO 13485:2016 QMS compliance file. Each section maps directly to a standard clause — click any step to navigate to the relevant enterprise module, fill in the data, and track your progress.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-green-700 dark:text-green-400">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Amber = incomplete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Green = complete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                <span>Click any step to fill in data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Header */}
      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Overall Progress</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedCount}/{totalSteps} sections complete
              {nextIncomplete && !progress && ` · Next: ${nextIncomplete.title}`}
              {progress >= 100 && ' · All sections addressed'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {companyId && companyName && completedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocCIDialog(true)}
                className="gap-1.5"
              >
                <FileEdit className="h-4 w-4" />
                Create Document
              </Button>
            )}
            <div className={cn(
              "text-2xl font-bold tabular-nums",
              progress >= 100 ? "text-emerald-600 dark:text-emerald-400"
                : progress >= 50 ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
            )}>
              {progress}%
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Section Groups */}
      <div className="space-y-6">
        {ISO_13485_GROUPS.map(group => {
          const groupItems = ISO_13485_SECTIONS.filter(s => s.sectionGroup === group.id);
          const groupTotal = groupItems.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
          const groupCompleted = groupItems.reduce((sum, s) => {
            const isComplete = completionMap.get(s.section)?.isComplete || false;
            return sum + (isComplete ? (s.subItems?.length || 1) : 0);
          }, 0);

          return (
            <GapAnnexIISectionGroup
              key={group.id}
              groupNumber={group.id}
              groupName={group.name}
              completedCount={groupCompleted}
              totalCount={groupTotal}
            >
              {groupItems.map(config => {
                const entry = completionMap.get(config.section);
                return (
                  <GapISO13485StepRow
                    key={config.section}
                    config={config}
                    itemId={entry?.itemId}
                    isComplete={entry?.isComplete || false}
                    disabled={disabled}
                    completionPercentage={entry?.isComplete ? 100 : 0}
                  />
                );
              })}
            </GapAnnexIISectionGroup>
          );
        })}
      </div>

      {/* Full Gap Analysis Export Dialog */}
      {companyId && companyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title="ISO 13485 Gap Analysis Report"
            htmlContent={ISO_13485_SECTIONS
              .filter(s => completionMap.get(s.section)?.isComplete)
              .map(s => `<h2>§${s.section} ${s.title}</h2><p>Status: Compliant</p>`)
              .join('\n')}
            templateIdKey={`GAP-ISO13485-FULL-${companyId}`}
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
