import React, { useState, useMemo } from 'react';
import { QualityManualStepRow } from './QualityManualStepRow';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Ban, AlertTriangle, FileEdit, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QualityManualSection, QualityManualData } from '@/hooks/useQualityManual';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { getClassBasedExclusions, getHighestDeviceClass, getExclusionSummaryLabel } from '@/config/classBasedExclusions';
import { QualityManualGenerationConfig, getDefaultConfig, type GenerationConfig } from './QualityManualGenerationConfig';
import { useLanguage } from '@/context/LanguageContext';
import { useDraftDocumentNavigation } from '@/hooks/useDraftDocumentNavigation';

interface QualityManualLaunchViewProps {
  sections: QualityManualSection[];
  exclusions: Map<string, string>;
  onSelectSection: (sectionKey: string) => void;
  onToggleExclusion: (clause: string) => void;
  companyId?: string;
  companyName?: string;
  companyData?: QualityManualData;
  applyClassBasedExclusions?: (deviceClass: string) => void;
  onGenerateAll?: (config: GenerationConfig) => void;
  generatingAll?: boolean;
}

export function QualityManualLaunchView({
  sections,
  exclusions,
  onSelectSection,
  onToggleExclusion,
  companyId,
  companyName,
  companyData,
  applyClassBasedExclusions,
  onGenerateAll,
  generatingAll,
}: QualityManualLaunchViewProps) {
  const { language } = useLanguage();
  const { handleDraftClick, checking } = useDraftDocumentNavigation(companyId, companyName || '');
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [genConfig, setGenConfig] = useState<GenerationConfig>(() => getDefaultConfig(companyData, language));
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const [exclusionBannerDismissed, setExclusionBannerDismissed] = useState(false);

  const totalSteps = sections.length;
  const completedCount = sections.filter(s => s.content && s.content.length > 20).length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const nextIncomplete = sections.find(s => !s.content || s.content.length <= 20);

  // Exclusions are at sub-clause level; count unique excluded sub-clauses
  const excludedCount = exclusions.size;

  // Determine highest device class from company products
  const highestClass = useMemo(() => {
    if (!companyData?.products || companyData.products.length === 0) return null;
    const riskClasses = companyData.products
      .map(p => p.risk_class)
      .filter((rc): rc is string => !!rc);
    return getHighestDeviceClass(riskClasses);
  }, [companyData?.products]);

  const suggestedExclusions = useMemo(() => {
    if (!highestClass) return [];
    return getClassBasedExclusions(highestClass);
  }, [highestClass]);

  const hasUnappliedSuggestions = suggestedExclusions.some(e => !exclusions.has(e.clause));
  const showExclusionBanner = highestClass && hasUnappliedSuggestions && !exclusionBannerDismissed;

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
              Build your lean Quality Manual in 8 chapters. Each chapter covers a full ISO 13485 clause group as a functional process narrative — not a clause-by-clause checklist.
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
                <span>N/A sub-clauses excluded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class-Based Exclusion Banner */}
      {showExclusionBanner && (
        <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Suggested Exclusions for {highestClass}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {getExclusionSummaryLabel(highestClass)}
              </p>
              <div className="space-y-1 mb-3">
                {suggestedExclusions.filter(e => !exclusions.has(e.clause)).map(e => (
                  <div key={e.clause} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-semibold text-primary flex-shrink-0">§{e.clause}</span>
                    <span className="text-muted-foreground">{e.justification}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => applyClassBasedExclusions?.(highestClass)}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Apply Suggested Exclusions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExclusionBannerDismissed(true)}
                  className="text-muted-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scope & Exclusions Summary */}
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
            Per ISO 13485:2016 §4.2.2, the following sub-clauses are excluded from scope with documented justification:
          </p>
          <div className="space-y-1.5">
            {exclusionEntries.map(([clause, justification]) => (
              <div key={clause} className="flex items-start gap-2 text-xs">
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 flex-shrink-0">§{clause}</span>
                <span className="text-muted-foreground"><em>{justification}</em></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Generation Settings */}
      <QualityManualGenerationConfig
        config={genConfig}
        onChange={setGenConfig}
        companyData={companyData}
      />

      {/* Generate All Button */}
      {onGenerateAll && totalSteps > completedCount && (
        <div className="mb-6">
          <Button
            onClick={() => onGenerateAll(genConfig)}
            disabled={generatingAll}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generatingAll ? 'Generating…' : `Generate All Remaining Chapters (${totalSteps - completedCount})`}
          </Button>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Overall Progress</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedCount}/{totalSteps} chapters complete
              {excludedCount > 0 && ` · ${excludedCount} sub-clause${excludedCount > 1 ? 's' : ''} excluded`}
              {nextIncomplete && !progress && ` · Next: ${nextIncomplete.title}`}
              {progress >= 100 && ' · All chapters addressed'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {companyId && companyName && completedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDraftClick(`QM-FULL-${companyId}`, () => setShowDocCIDialog(true))}
                disabled={checking}
                className="gap-1.5"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />}
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

      {/* Section List — flat 8 chapters */}
      <div className="space-y-2">
        {sections.map(section => {
          const isComplete = !!(section.content && section.content.length > 20);
          // Check if any covered sub-clauses are excluded
          const excludedSubClauses = section.coveredClauses.filter(c => exclusions.has(c));
          return (
            <div key={section.sectionKey}>
              <QualityManualStepRow
                section={section}
                isComplete={isComplete}
                isExcluded={false}
                exclusionJustification={undefined}
                onToggleExclusion={() => {}}
                onClick={() => onSelectSection(section.sectionKey)}
              />
              {excludedSubClauses.length > 0 && (
                <div className="ml-14 mt-1 mb-2 flex flex-wrap gap-1">
                  {excludedSubClauses.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                      <Ban className="h-2.5 w-2.5" />
                      §{c} N/A
                    </span>
                  ))}
                </div>
              )}
            </div>
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
              .filter(s => s.content && s.content.length > 20)
              .map(s => `<h2>Ch.${s.chapterNumber} ${s.title}</h2>${s.content}`)
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
