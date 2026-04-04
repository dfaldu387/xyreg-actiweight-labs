import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { QualityManualSidebar, type QMSubStep } from './QualityManualSidebar';
import { QualityManualSectionView } from './QualityManualSection';
import { QualityManualLaunchView } from './QualityManualLaunchView';
import { useQualityManual } from '@/hooks/useQualityManual';
import { ISO_13485_SECTIONS } from '@/config/gapISO13485Sections';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QualityManualDashboardProps {
  companyId: string;
}

export function QualityManualDashboard({ companyId }: QualityManualDashboardProps) {
  const { companyName: companyNameParam } = useParams<{ companyName: string }>();
  const decodedCompanyName = companyNameParam ? decodeURIComponent(companyNameParam) : '';
  const {
    sections,
    exclusions,
    subStepContents,
    companyData,
    loading,
    saving,
    generating,
    updateSectionContent,
    generateSection,
    toggleExclusion,
    getSubStepKey,
  } = useQualityManual(companyId);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generatingAll, setGeneratingAll] = useState(false);

  const currentSection = activeSection ? sections.find(s => s.sectionKey === activeSection) : null;

  // Build hybrid steps for active section, with completion from actual content
  const activeSteps: QMSubStep[] = useMemo(() => {
    if (!currentSection) return [];
    const isoConfig = ISO_13485_SECTIONS.find(s => s.section === currentSection.clause);
    const steps: QMSubStep[] = [];
    if (isoConfig?.subItems && isoConfig.subItems.length > 0) {
      isoConfig.subItems.forEach((sub, i) => {
        const subKey = getSubStepKey(currentSection.sectionKey, i);
        const subContent = subStepContents.get(subKey);
        steps.push({
          id: `sub_${i}`,
          label: `§${isoConfig.section}.${sub.letter} ${sub.description}`,
          complete: !!(subContent?.content && subContent.content.length > 20),
        });
      });
    }
    steps.push({
      id: 'narrative',
      label: 'Publish-Ready Narrative',
      complete: !!(currentSection.content && currentSection.content.length > 20),
    });
    return steps;
  }, [currentSection, subStepContents, getSubStepKey]);

  const handleSelectSection = useCallback((sectionKey: string | null) => {
    setActiveSection(sectionKey);
    setCurrentStepIndex(0);
  }, []);

  const handleGenerateAll = useCallback(async () => {
    // Skip excluded sections
    const missing = sections.filter(s => !exclusions.has(s.clause) && (!s.content || s.content.length <= 20));
    if (missing.length === 0) {
      toast.info('All applicable sections already have content');
      return;
    }
    setGeneratingAll(true);
    let generated = 0;
    for (const section of missing) {
      try {
        await generateSection(section.sectionKey);
        generated++;
      } catch { /* continue */ }
    }
    setGeneratingAll(false);
    toast.success(`Generated ${generated} of ${missing.length} sections`);
  }, [sections, exclusions, generateSection]);

  // Navigation helpers
  const sectionIndex = activeSection ? sections.findIndex(s => s.sectionKey === activeSection) : -1;
  const prevSection = sectionIndex > 0 ? sections[sectionIndex - 1] : null;
  const nextSection = sectionIndex >= 0 && sectionIndex < sections.length - 1 ? sections[sectionIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSteps = activeSteps.length;
  const isLastStep = currentStepIndex >= totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  const btnBase = '!bg-slate-100 hover:!bg-slate-200 text-slate-700 border border-slate-500 shadow-sm';
  const btnDone = '!bg-emerald-50 hover:!bg-emerald-100 text-emerald-700 border border-emerald-400 shadow-sm';

  return (
    <div className="relative min-h-[calc(100vh-200px)]">
      {/* Content area */}
      {activeSection && currentSection ? (
        <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px] p-6 pb-24">
          <QualityManualSectionView
            section={currentSection}
            companyData={companyData}
            onContentChange={updateSectionContent}
            onGenerate={generateSection}
            generating={generating}
            saving={saving}
            currentStepIndex={currentStepIndex}
            activeSteps={activeSteps}
            subStepContents={subStepContents}
            getSubStepKey={getSubStepKey}
            companyId={companyId}
            companyName={decodedCompanyName}
          />
        </div>
      ) : (
        <QualityManualLaunchView
          sections={sections}
          exclusions={exclusions}
          onSelectSection={handleSelectSection}
          onToggleExclusion={toggleExclusion}
          companyId={companyId}
          companyName={decodedCompanyName}
        />
      )}

      {/* Sidebar */}
      <QualityManualSidebar
        sections={sections}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        generating={generating}
        activeSteps={activeSection ? activeSteps : undefined}
        activeStepIndex={activeSection ? currentStepIndex : undefined}
        onStepClick={activeSection ? setCurrentStepIndex : undefined}
      />

      {/* Floating bottom navigation bar — only in edit mode */}
      {activeSection && currentSection && totalSteps > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-[28px] border shadow-xl px-3 py-1.5">
            {/* Previous button */}
            {(currentStepIndex > 0 || prevSection) && (
              <Button
                onClick={() => {
                  if (currentStepIndex > 0) {
                    setCurrentStepIndex(currentStepIndex - 1);
                  } else if (prevSection) {
                    handleSelectSection(prevSection.sectionKey);
                    const prevConfig = ISO_13485_SECTIONS.find(s => s.section === prevSection.clause);
                    const lastIdx = (prevConfig?.subItems?.length || 0);
                    setCurrentStepIndex(lastIdx);
                  }
                }}
                size="sm"
                className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-start ${btnBase}`}
              >
                <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-500" />
                <span className="text-xs font-medium truncate flex-1 text-left">
                  {currentStepIndex > 0
                    ? activeSteps[currentStepIndex - 1]?.label
                    : prevSection
                      ? `§${prevSection.clause} ${prevSection.title}`
                      : ''
                  }
                </span>
              </Button>
            )}

            {/* Current step pill */}
            <div className="flex flex-col items-center px-6 py-2 min-w-[220px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-2">
              <div className="flex items-center gap-2">
                {activeSteps[currentStepIndex]?.complete && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                  {activeSteps[currentStepIndex]?.label || currentSection.title}
                </span>
              </div>
              <span className="text-[10px] text-white/70">Step {currentStepIndex + 1}/{totalSteps}</span>
            </div>

            {/* Next button */}
            <Button
              onClick={() => {
                if (!isLastStep) {
                  setCurrentStepIndex(currentStepIndex + 1);
                } else if (nextSection) {
                  handleSelectSection(nextSection.sectionKey);
                  setCurrentStepIndex(0);
                } else {
                  handleSelectSection(null);
                }
              }}
              size="sm"
              className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-end ${btnBase}`}
            >
              <span className="text-xs font-medium truncate flex-1 text-right">
                {!isLastStep
                  ? activeSteps[currentStepIndex + 1]?.label
                  : nextSection
                    ? `§${nextSection.clause} ${nextSection.title}`
                    : 'Back to Quality Manual'
                }
              </span>
              <span className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-500" />
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
