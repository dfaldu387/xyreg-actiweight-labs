import React from 'react';
import { useParams } from 'react-router-dom';
import { ANNEX_II_SECTIONS, ANNEX_II_GROUPS } from '@/config/gapAnnexIISections';
import { GapAnnexIISectionGroup } from './GapAnnexIISectionGroup';
import { GapAnnexIIStepRow } from './GapAnnexIIStepRow';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnnexIISectionItem } from '@/config/gapAnnexIISections';
import type { GapAnalysisItem } from '@/types/client';

interface GapAnnexIILaunchViewProps {
  items: GapAnalysisItem[];
  disabled?: boolean;
  headerActions?: React.ReactNode;
  /** Family sharing context */
  companyId?: string;
  isFrameworkShared?: boolean;
  clauseExclusions?: Record<string, string[]>;
  onClauseExclusionChange?: (framework: string, section: string, excludedIds: string[]) => void;
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

export function GapAnnexIILaunchView({ items, disabled = false, headerActions, companyId, isFrameworkShared = false, clauseExclusions = {}, onClauseExclusionChange }: GapAnnexIILaunchViewProps) {
  const { productId } = useParams();
  const completionMap = getCompletionMap(items);
  // Flat step count: sections with sub-items count each sub-item, others count as 1
  const totalSteps = ANNEX_II_SECTIONS.reduce((sum, s) => sum + (s.subItems?.length || 1), 0);
  const completedCount = ANNEX_II_SECTIONS.reduce((sum, s) => {
    const isComplete = completionMap.get(s.section)?.isComplete || false;
    return sum + (isComplete ? (s.subItems?.length || 1) : 0);
  }, 0);
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Find next incomplete step
  const nextIncomplete = ANNEX_II_SECTIONS.find(s => !completionMap.get(s.section)?.isComplete);

  const framework = 'MDR_ANNEX_II';

  return (
    <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px]">
      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">MDR Annex II — Technical Documentation</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500 text-white uppercase tracking-wider">MDR</span>
              {headerActions && <div className="ml-auto">{headerActions}</div>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build your complete MDR Technical Documentation file. Each section maps directly to an MDR Annex II requirement — click any step to navigate to the relevant input area, fill in the data, and track your progress.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-indigo-700 dark:text-indigo-400">
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
          <div className={cn(
            "text-2xl font-bold tabular-nums",
            progress >= 100 ? "text-emerald-600 dark:text-emerald-400"
              : progress >= 50 ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
          )}>
            {progress}%
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Section Groups */}
      <div className="space-y-6">
        {ANNEX_II_GROUPS.map(group => {
          const groupItems = ANNEX_II_SECTIONS.filter(s => s.sectionGroup === group.id);
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
                  <GapAnnexIIStepRow
                    key={config.section}
                    config={config}
                    itemId={entry?.itemId}
                    isComplete={entry?.isComplete || false}
                    disabled={disabled}
                    completionPercentage={entry?.isComplete ? 100 : 0}
                    framework={framework}
                    companyId={companyId || null}
                    productId={productId || null}
                    isFrameworkShared={isFrameworkShared}
                    clauseExcludedProductIds={clauseExclusions[`${framework}.${config.section}`] || []}
                    onClauseExclusionChange={onClauseExclusionChange}
                  />
                );
              })}
            </GapAnnexIISectionGroup>
          );
        })}
      </div>
    </div>
  );
}
