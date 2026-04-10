import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GapAnnexIISectionGroup } from '@/components/product/gap-analysis/GapAnnexIISectionGroup';
import { GapISO13485StepRow } from './GapISO13485StepRow';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, LucideIcon, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GapAnalysisItem } from '@/types/client';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { StandardStatusBadge } from './StandardStatusBadge';
import type { StandardVersionStatus } from '@/hooks/useStandardVersionStatus';

export interface GenericSectionSubItem {
  letter: string;
  description: string;
  route?: string;
}

export interface GenericSectionItem {
  section: string;
  title: string;
  description?: string;
  sectionGroup: number;
  sectionGroupName: string;
  type: 'navigate' | 'evidence';
  route?: string;
  iconHint?: string;
  subItems?: GenericSectionSubItem[];
}

export interface GenericSectionGroup {
  id: number;
  name: string;
}

interface GenericGapLaunchViewProps {
  sections: GenericSectionItem[];
  groups: GenericSectionGroup[];
  items: GapAnalysisItem[];
  standardName: string;
  standardTag: string;
  standardIcon: LucideIcon;
  bannerDescription: string;
  disabled?: boolean;
  baseUrl?: string;
  headerActions?: React.ReactNode;
  companyName_?: string;
  /** Family sharing context */
  companyId?: string;
  isFrameworkShared?: boolean;
  clauseExclusions?: Record<string, string[]>;
  onClauseExclusionChange?: (framework: string, section: string, excludedIds: string[]) => void;
  standardStatus?: StandardVersionStatus;
}

function getCompletionMap(items: GapAnalysisItem[]): Map<string, { isComplete: boolean; itemId: string; isInherited: boolean; inheritedFromName: string | null }> {
  const map = new Map<string, { isComplete: boolean; itemId: string; isInherited: boolean; inheritedFromName: string | null }>();
  items.forEach(item => {
    const section = (item as any).section;
    if (section) {
      const existing = map.get(section);
      const isInherited = !!(item as any)._inherited;
      const inheritedFromName = (item as any)._inheritedFromProductName || null;
      if (!existing) {
        map.set(section, { isComplete: item.status === 'compliant', itemId: item.id, isInherited, inheritedFromName });
      } else if (!existing.isComplete && item.status === 'compliant') {
        map.set(section, { isComplete: true, itemId: item.id, isInherited, inheritedFromName });
      }
    }
  });
  return map;
}

export function GenericGapLaunchView({
  sections,
  groups,
  items,
  standardName,
  standardTag,
  standardIcon: Icon,
  bannerDescription,
  disabled = false,
  baseUrl,
  headerActions,
  companyId,
  isFrameworkShared = false,
  clauseExclusions = {},
  onClauseExclusionChange,
  standardStatus,
}: GenericGapLaunchViewProps) {
  const { productId, companyName } = useParams();
  const resolvedBaseUrl = baseUrl || (productId ? `/app/product/${productId}` : `/app/company/${companyName}`);
  const completionMap = getCompletionMap(items);
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const resolvedCompanyName = companyName ? decodeURIComponent(companyName) : '';

  const totalSteps = sections.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
  const completedCount = sections.reduce((sum, s) => {
    const isComplete = completionMap.get(s.section)?.isComplete || false;
    return sum + (isComplete ? (s.subItems?.length || 1) : 0);
  }, 0);
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const nextIncomplete = sections.find(s => !completionMap.get(s.section)?.isComplete);

  return (
    <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px]">
      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-blue-700 dark:text-blue-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">{standardName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white uppercase tracking-wider">{standardTag}</span>
              <StandardStatusBadge status={standardStatus} />
              {headerActions && <div className="ml-auto">{headerActions}</div>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{bannerDescription}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-700 dark:text-blue-400">
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
            {companyId && resolvedCompanyName && completedCount > 0 && (
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
        {groups.map(group => {
          const groupItems = sections.filter(s => s.sectionGroup === group.id);
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
                    config={config as any}
                    itemId={entry?.itemId}
                    isComplete={entry?.isComplete || false}
                    disabled={disabled}
                    completionPercentage={entry?.isComplete ? 100 : 0}
                    framework={standardTag}
                    productId={productId || null}
                    companyId={companyId || null}
                    baseUrl={resolvedBaseUrl}
                    isInherited={entry?.isInherited || false}
                    inheritedFromName={entry?.inheritedFromName || undefined}
                    isFrameworkShared={isFrameworkShared}
                    clauseExcludedProductIds={clauseExclusions[`${standardTag}.${config.section}`] || []}
                    onClauseExclusionChange={onClauseExclusionChange}
                  />
                );
              })}
            </GapAnnexIISectionGroup>
          );
        })}
      </div>

      {/* Full Gap Analysis Export Dialog */}
      {companyId && resolvedCompanyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title={`${standardName} Gap Analysis Report`}
            htmlContent={sections
              .filter(s => completionMap.get(s.section)?.isComplete)
              .map(s => `<h2>§${s.section} ${s.title}</h2><p>Status: Compliant</p>`)
              .join('\n')}
            templateIdKey={`GAP-${standardTag.replace(/\s+/g, '_')}-FULL-${productId || companyId}`}
            companyId={companyId}
            companyName={resolvedCompanyName}
            productId={productId || undefined}
            defaultScope={productId ? 'device' : 'enterprise'}
            onDocumentCreated={(docId, docName, docType) => setDraftDrawerDoc({ id: docId, name: docName, type: docType })}
          />
          <DocumentDraftDrawer
            open={!!draftDrawerDoc}
            onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
            documentId={draftDrawerDoc?.id || ''}
            documentName={draftDrawerDoc?.name || ''}
            documentType={draftDrawerDoc?.type || ''}
            productId={productId || undefined}
            companyId={companyId}
          />
        </>
      )}
    </div>
  );
}
