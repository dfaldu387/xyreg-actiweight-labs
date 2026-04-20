import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, GraduationCap, Play } from 'lucide-react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { platformGuideModule } from './moduleContent/platformGuideModule';
import { ModuleDeepDive } from './ModuleDeepDive';
import { CircularProgress } from '@/components/common/CircularProgress';
import { useTranslation } from '@/hooks/useTranslation';

const sectionKeys: Record<string, { title: string; desc: string }> = {
  'client-compass': { title: 'help.platformGuide.sections.clientCompass.title', desc: 'help.platformGuide.sections.clientCompass.desc' },
  'welcome-to-xyreg': { title: 'help.platformGuide.sections.welcomeToXyreg.title', desc: 'help.platformGuide.sections.welcomeToXyreg.desc' },
  'platform-architecture': { title: 'help.platformGuide.sections.platformArchitecture.title', desc: 'help.platformGuide.sections.platformArchitecture.desc' },
  'navigation-sidebar': { title: 'help.platformGuide.sections.navigationSidebar.title', desc: 'help.platformGuide.sections.navigationSidebar.desc' },
  'mission-control': { title: 'help.platformGuide.sections.missionControl.title', desc: 'help.platformGuide.sections.missionControl.desc' },
  'mission-control-widgets': { title: 'Mission Control Widgets', desc: 'What each widget on the right rail does and how to customise them' },
  'company-dashboard-portfolio': { title: 'help.platformGuide.sections.companyDashboard.title', desc: 'help.platformGuide.sections.companyDashboard.desc' },
  'supplier-management': { title: 'help.platformGuide.sections.supplierManagement.title', desc: 'help.platformGuide.sections.supplierManagement.desc' },
  'company-documents-compliance': { title: 'help.platformGuide.sections.companyDocuments.title', desc: 'help.platformGuide.sections.companyDocuments.desc' },
  'company-operations': { title: 'help.platformGuide.sections.companyOperations.title', desc: 'help.platformGuide.sections.companyOperations.desc' },
  'device-dashboard-definition': { title: 'help.platformGuide.sections.deviceDashboard.title', desc: 'help.platformGuide.sections.deviceDashboard.desc' },
  'classification-regulatory-pathway': { title: 'help.platformGuide.sections.classificationRegulatory.title', desc: 'help.platformGuide.sections.classificationRegulatory.desc' },
  'design-risk-controls': { title: 'help.platformGuide.sections.designRiskControls.title', desc: 'help.platformGuide.sections.designRiskControls.desc' },
  'device-compliance-instances': { title: 'help.platformGuide.sections.deviceCompliance.title', desc: 'help.platformGuide.sections.deviceCompliance.desc' },
  'device-operations-lifecycle': { title: 'help.platformGuide.sections.deviceOperations.title', desc: 'help.platformGuide.sections.deviceOperations.desc' },
  'business-case-genesis': { title: 'help.platformGuide.sections.businessCaseGenesis.title', desc: 'help.platformGuide.sections.businessCaseGenesis.desc' },
  'draft-studio': { title: 'help.platformGuide.sections.draftStudio.title', desc: 'help.platformGuide.sections.draftStudio.desc' },
};

const sectionEstimates: Record<string, string> = {
  'welcome-to-xyreg': '5 min',
  'platform-architecture': '5 min',
  'navigation-sidebar': '4 min',
  'mission-control': '4 min',
  'mission-control-widgets': '5 min',
  'client-compass': '3 min',
  'company-dashboard-portfolio': '4 min',
  'supplier-management': '5 min',
  'company-documents-compliance': '5 min',
  'company-operations': '5 min',
  'device-dashboard-definition': '6 min',
  'classification-regulatory-pathway': '4 min',
  'design-risk-controls': '5 min',
  'device-compliance-instances': '4 min',
  'device-operations-lifecycle': '4 min',
  'business-case-genesis': '4 min',
  'draft-studio': '3 min',
};

const tierLabelKeys: Record<number, string> = {
  0: 'help.platformGuide.tiers.orientation',
  1: 'help.platformGuide.tiers.company',
  2: 'help.platformGuide.tiers.device',
  3: 'help.platformGuide.tiers.strategic',
};

interface PlatformGuideTabProps {
  onStartTour?: () => void;
}

export function PlatformGuideTab({ onStartTour }: PlatformGuideTabProps) {
  const { lang } = useTranslation();
  const { companyRoles } = useCompanyRole();
  const isMultiCompany = companyRoles.length > 1;

  const [selectedModule, setSelectedModule] = useState<typeof platformGuideModule | null>(null);
  const [initialStep, setInitialStep] = useState(0);

  const filteredGuideSteps = platformGuideModule.steps.filter(
    step => step.id !== 'client-compass' || isMultiCompany
  );

  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('platform-guide-completed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('platform-guide-completed', JSON.stringify(completedSections));
  }, [completedSections]);

  const guideProgress = Math.round((completedSections.length / filteredGuideSteps.length) * 100);

  const handleOpenSection = (filteredIndex: number) => {
    const step = filteredGuideSteps[filteredIndex];
    const realIndex = platformGuideModule.steps.findIndex(s => s.id === step.id);
    setSelectedModule(null);
    setTimeout(() => {
      setInitialStep(realIndex >= 0 ? realIndex : filteredIndex);
      setSelectedModule(platformGuideModule);
    }, 0);
  };

  const toggleSectionComplete = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (selectedModule) {
    return (
      <ModuleDeepDive
        key={`${selectedModule.id}-${initialStep}`}
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onCloseDialog={() => setSelectedModule(null)}
        initialStep={initialStep}
      />
    );
  }

  // Group steps by tier — note: 'mission-control-widgets' was added inside the Company tier,
  // so the Company range now spans 6 sections (3..9) instead of 5, and Device/Strategic shift by +1.
  const tierRanges = [
    { start: 0, end: 3 },   // Orientation: welcome, architecture, navigation
    { start: 3, end: 10 },  // Company: mission-control, mission-control-widgets, dashboard, suppliers, docs, operations (+ optional client-compass at idx 0 only when isMultiCompany)
    { start: 10, end: 15 }, // Device
    { start: 15, end: 17 }, // Strategic
  ];

  // First incomplete section gets the amber "next-up" pulse — same visual language as the main CTA.
  const nextUpId = filteredGuideSteps.find(s => !completedSections.includes(s.id))?.id;

  return (
    <div className="space-y-6">
      {/* Interactive Tour Launch */}
      {onStartTour && (
        <Button
          onClick={onStartTour}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          <Play className="h-4 w-4" />
          Start Platform Basics Tour
        </Button>
      )}

      {/* Progress */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
        <CircularProgress percentage={guideProgress} size={48} />
        <div>
          <p className="text-sm font-medium">{lang('help.platformGuide.progress')}</p>
          <p className="text-xs text-muted-foreground">
            {lang('help.platformGuide.sectionsCompleted', { completed: completedSections.length, total: filteredGuideSteps.length })}
          </p>
        </div>
      </div>

      {/* Sections grouped by tier */}
      {tierRanges.map((range, tierIdx) => {
        const tierSteps = filteredGuideSteps.filter((_, i) => i >= range.start && i < range.end);
        if (tierSteps.length === 0) return null;

        return (
          <div key={tierIdx} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {lang(tierLabelKeys[tierIdx])}
            </h3>
            <div className="space-y-1.5">
              {tierSteps.map((step) => {
                const isCompleted = completedSections.includes(step.id);
                const isNextUp = step.id === nextUpId;
                const filteredIdx = filteredGuideSteps.indexOf(step);
                return (
                  <Card
                    key={step.id}
                    className={`group p-3 cursor-pointer hover:bg-accent/50 transition-all border-border/50 ${
                      isNextUp
                        ? 'ring-2 ring-amber-500/60 border-amber-500/40 animate-pulse'
                        : ''
                    } ${isCompleted ? 'opacity-70' : ''}`}
                    onClick={() => handleOpenSection(filteredIdx)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => toggleSectionComplete(step.id, e)}
                        className="mt-0.5 shrink-0"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 transition-colors ${
                            isCompleted ? 'text-primary fill-primary/20' : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {sectionKeys[step.id] ? lang(sectionKeys[step.id].title) : step.title}
                        </p>
                        {sectionKeys[step.id] && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {lang(sectionKeys[step.id].desc)}
                          </p>
                        )}
                      </div>
                      {/* Hover "Start this section" affordance */}
                      <div className="hidden group-hover:flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                        <Play className="h-3 w-3 fill-current" />
                        Start
                      </div>
                      {sectionEstimates[step.id] && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 gap-1 group-hover:hidden ${
                            isNextUp ? 'border-amber-500/60 text-amber-600 dark:text-amber-400' : ''
                          }`}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {sectionEstimates[step.id]}
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
