import React, { useState } from 'react';
import { GapAnnexIISectionGroup } from '@/components/product/gap-analysis/GapAnnexIISectionGroup';
import { QualityManualStepRow } from './QualityManualStepRow';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, BookOpen, Ban, AlertTriangle, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ISO_13485_GROUPS } from '@/config/gapISO13485Sections';
import type { QualityManualSection } from '@/hooks/useQualityManual';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';

interface QualityManualLaunchViewProps {
  sections: QualityManualSection[];
  exclusions: Map<string, string>;
  onSelectSection: (sectionKey: string) => void;
  onToggleExclusion: (clause: string) => void;
  companyId?: string;
  companyName?: string;
}

export function QualityManualLaunchView({ sections, exclusions, onSelectSection, onToggleExclusion, companyId, companyName }: QualityManualLaunchViewProps) {
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const groups = ISO_13485_GROUPS;

  const totalSteps = sections.length;
  const excludedCount = exclusions.size;
  const applicableCount = totalSteps - excludedCount;
  const completedCount = sections.filter(s => !exclusions.has(s.clause) && s.content && s.content.length > 20).length;
  const progress = applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 0;
  const nextIncomplete = sections.find(s => !exclusions.has(s.clause) && (!s.content || s.content.length <= 20));

  // Build exclusion summary for §4.2.2 compliance
  const exclusionEntries = Array.from(exclusions.entries());

  return (
    <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px]">
      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Quality Manual — ISO 13485 §4.2.2</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white uppercase tracking-wider">ISO 13485</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build your complete ISO 13485:2016 Quality Manual. Sections marked <strong>"Optional"</strong> can be excluded with justification if not applicable to your organisation. Click <strong>N/A</strong> on any section to exclude it.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-700 dark:text-blue-400">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Incomplete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Complete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ban className="h-3 w-3" />
                <span>N/A = excluded from scope</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope & Exclusions Summary (§4.2.2 compliance) */}
      {exclusionEntries.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Scope Exclusions (§4.2.2)</h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              {excludedCount} excluded
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Per ISO 13485:2016 §4.2.2, the following clauses are excluded from the scope of this Quality Manual with documented justification:
          </p>
          <div className="space-y-1.5">
            {exclusionEntries.map(([clause, justification]) => {
              const section = sections.find(s => s.clause === clause);
              return (
                <div key={clause} className="flex items-start gap-2 text-xs">
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 flex-shrink-0">§{clause}</span>
                  <span className="text-muted-foreground">
                    {section?.title} — <em>{justification}</em>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Overall Progress</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedCount}/{applicableCount} sections complete
              {excludedCount > 0 && ` (${excludedCount} excluded as N/A)`}
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
        {groups.map(group => {
          const groupSections = sections.filter(s => s.groupId === group.id);
          const groupExcluded = groupSections.filter(s => exclusions.has(s.clause)).length;
          const groupApplicable = groupSections.length - groupExcluded;
          const groupCompleted = groupSections.filter(s => !exclusions.has(s.clause) && s.content && s.content.length > 20).length;

          return (
            <GapAnnexIISectionGroup
              key={group.id}
              groupNumber={group.id}
              groupName={group.name}
              completedCount={groupCompleted}
              totalCount={groupApplicable}
            >
              {groupSections.map(section => {
                const isExcluded = exclusions.has(section.clause);
                const isComplete = !isExcluded && !!(section.content && section.content.length > 20);
                return (
                  <QualityManualStepRow
                    key={section.sectionKey}
                    section={section}
                    isComplete={isComplete}
                    isExcluded={isExcluded}
                    exclusionJustification={exclusions.get(section.clause)}
                    onToggleExclusion={() => onToggleExclusion(section.clause)}
                    onClick={() => onSelectSection(section.sectionKey)}
                  />
                );
              })}
            </GapAnnexIISectionGroup>
          );
        })}
      </div>

      {/* Full QM Export Dialog */}
      {companyId && companyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title="Complete Quality Manual — ISO 13485"
            htmlContent={sections
              .filter(s => !exclusions.has(s.clause) && s.content && s.content.length > 20)
              .map(s => `<h2>§${s.clause} ${s.title}</h2>${s.content}`)
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
