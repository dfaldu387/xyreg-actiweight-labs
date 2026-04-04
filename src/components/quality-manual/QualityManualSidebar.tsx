import React, { useMemo } from 'react';
import { CheckCircle, Circle, Home, ChevronRight, Target, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ISO_13485_SECTIONS, ISO_13485_GROUPS } from '@/config/gapISO13485Sections';
import type { QualityManualSection } from '@/hooks/useQualityManual';

export interface QMSubStep {
  id: string;
  label: string;
  complete: boolean;
}

interface QualityManualSidebarProps {
  sections: QualityManualSection[];
  activeSection: string | null;
  onSelectSection: (sectionKey: string | null) => void;
  generating: string | null;
  activeSteps?: QMSubStep[];
  activeStepIndex?: number;
  onStepClick?: (index: number) => void;
}

export function QualityManualSidebar({
  sections,
  activeSection,
  onSelectSection,
  generating,
  activeSteps,
  activeStepIndex,
  onStepClick,
}: QualityManualSidebarProps) {
  const groups = ISO_13485_GROUPS;

  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    sections.forEach(s => {
      map.set(s.sectionKey, !!(s.content && s.content.length > 20));
    });
    return map;
  }, [sections]);

  const totalSteps = sections.length;
  const completedCount = sections.filter(s => s.content && s.content.length > 20).length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const currentSection = activeSection
    ? sections.find(s => s.sectionKey === activeSection)
    : sections.find(s => !completionMap.get(s.sectionKey));

  const isAllComplete = completedCount >= totalSteps;

  // Build "To Complete This Step" items
  const activeStepItems = useMemo(() => {
    if (!currentSection) return null;
    const isComplete = completionMap.get(currentSection.sectionKey);
    if (isComplete) return null;

    // If we have activeSteps from parent, use those
    if (activeSection && activeSteps && activeSteps.length > 0) {
      return activeSteps.map(step => ({
        label: step.label,
        complete: step.complete,
      }));
    }

    // Otherwise derive from ISO config
    const isoConfig = ISO_13485_SECTIONS.find(s => s.section === currentSection.clause);
    if (isoConfig?.subItems && isoConfig.subItems.length > 0) {
      const items = isoConfig.subItems.map(sub => ({
        label: `§${isoConfig.section}.${sub.letter} ${sub.description}`,
        complete: false,
      }));
      items.push({ label: 'Publish-Ready Narrative', complete: false });
      return items;
    }

    return [{ label: 'Publish-Ready Narrative', complete: false }];
  }, [currentSection, completionMap, activeSection, activeSteps]);

  return (
    <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-64px)] z-30">
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            ISO 13485 Quality Manual
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-sm truncate">
          {currentSection
            ? `§${currentSection.clause}: ${currentSection.title}`
            : 'Getting Started'
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
            ? 'All Quality Manual sections have been completed.'
            : currentSection
              ? `§${currentSection.clause}: ${currentSection.title}`
              : 'Select a section to begin'
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
        {activeStepItems && !isAllComplete && currentSection && !activeSection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectSection(currentSection.sectionKey)}
            className="mt-2 h-7 text-xs gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-2"
          >
            Go to step
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Back to Quality Manual + All Sections */}
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
          All Sections
        </h4>

        <div className="space-y-4">
          {groups.map(group => {
            const groupSections = sections.filter(s => s.groupId === group.id);
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    §{group.id} {group.name}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupSections.map(section => {
                    const isComplete = completionMap.get(section.sectionKey) || false;
                    const isActive = section.sectionKey === activeSection;
                    const isCurrent = section.sectionKey === currentSection?.sectionKey && !activeSection;
                    return (
                      <React.Fragment key={section.sectionKey}>
                        <button
                          onClick={() => onSelectSection(section.sectionKey)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                            isActive && "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium",
                            isCurrent && !isActive && "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
                            !isCurrent && !isActive && !isComplete && "text-muted-foreground hover:bg-muted/50",
                            isComplete && !isActive && "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className={cn(
                              "h-3.5 w-3.5 flex-shrink-0",
                              (isCurrent || isActive) ? "text-blue-500" : "text-muted-foreground/50"
                            )} />
                          )}
                          <span className="truncate">§{section.clause} {section.title}</span>
                        </button>
                        {/* Nested sub-steps for active section */}
                        {isActive && activeSteps && activeSteps.length > 0 && (
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
    </div>
  );
}
