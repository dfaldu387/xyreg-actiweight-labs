import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crosshair, CheckCircle, Circle, ChevronUp, Eye, BookOpen, Cpu, FlaskConical, AlertTriangle, LayoutGrid, Flag, Users, Shield, Scale, Factory, Cog, DollarSign, TrendingUp, Banknote, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GlobalHelpSidebar } from '@/components/help/GlobalHelpSidebar';
import { cn } from '@/lib/utils';
import { useInvestorPreview } from '@/contexts/InvestorPreviewContext';
import { useTranslation } from '@/hooks/useTranslation';

interface ChecklistItem {
  label: string;
  labelKey?: string;
  complete: boolean;
  route: string;
}

interface GenesisLaunchStepsSidebarProps {
  productId: string;
  readinessChecklist: ChecklistItem[];
  overallProgress: number;
}

// Module color and icon mapping (matches GenesisStepRow)
const MODULE_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }> = {
  // Device-related (blue)
  'Device Definition': { icon: Cpu, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/50' },
  'Device Info': { icon: Cpu, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/50' },
  // Clinical-related (pink)
  'Clinical Trials': { icon: FlaskConical, colorClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-50 dark:bg-pink-950/50' },
  'Clinical Evidence': { icon: FlaskConical, colorClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-50 dark:bg-pink-950/50' },
  // Risk-related (red)
  'Risk Management': { icon: AlertTriangle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-950/50' },
  'Risk Analysis': { icon: AlertTriangle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-950/50' },
  // Business Case umbrella (amber)
  'Business Case': { icon: LayoutGrid, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'Market Analysis': { icon: LayoutGrid, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'Reimbursement': { icon: Banknote, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'Use of Proceeds': { icon: DollarSign, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'Revenue Forecast': { icon: TrendingUp, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'GTM Strategy': { icon: LayoutGrid, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  'Exit Strategy': { icon: TrendingUp, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/50' },
  // Milestones/Gates (rose)
  'Milestones': { icon: Flag, colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/50' },
  'Essential Gates': { icon: Flag, colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/50' },
  // Team (cyan)
  'Team': { icon: Users, colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-950/50' },
  'Team Profile': { icon: Users, colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-950/50' },
  // IP (purple)
  'IP Portfolio': { icon: Shield, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/50' },
  'IP Strategy': { icon: Shield, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/50' },
  // Regulatory (indigo)
  'Regulatory Pathway': { icon: Scale, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/50' },
  'Regulatory': { icon: Scale, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/50' },
  // Manufacturing/Operations (teal)
  'Manufacturing & Operations': { icon: Factory, colorClass: 'text-teal-600 dark:text-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-950/50' },
  'Manufacturing': { icon: Factory, colorClass: 'text-teal-600 dark:text-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-950/50' },
  // Design Controls (slate)
  'Design Controls': { icon: Cog, colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-50 dark:bg-slate-950/50' },
};

// Map step labels to module labels based on blueprintStepMapping
const STEP_TO_MODULE: Record<string, string> = {
  'Device Name': 'Device Definition',
  'TRL Assessment': 'Device Definition',
  'Technical Readiness Level (TRL)': 'Device Definition',
  'Technical Readiness': 'Device Definition',
  'System Architecture': 'Device Definition',
  'Team Composition': 'Team Profile',
  'Key Activities': 'Business Canvas',
  'Device Type': 'Device Definition',
  'Intended Use': 'Device Definition',
  'Intended Use and Value Proposition': 'Device Definition',
  'Fill in Intended Use': 'Device Definition',
  'Device Description': 'Device Definition',
  'Add Device Description': 'Device Definition',
  'Device Image': 'Device Definition',
  'Upload Device Image': 'Device Definition',
  'Target Markets': 'Device Definition',
  'Select Target Markets': 'Device Definition',
  'Classify Device': 'Regulatory',
  'Device Classification': 'Regulatory',
  'Market Sizing': 'Market Analysis',
  'Competitor Analysis': 'Market Analysis',
  'Profile User': 'Device Definition',
  'User Profile': 'Device Definition',
  'Profile Economic Buyer': 'Device Definition',
  'Economic Buyer': 'Device Definition',
  'Strategic Partners': 'Device Definition',
  'Value Proposition': 'Device Definition',
  'Articulate Value Proposition': 'Device Definition',
  'Health Economic Model': 'Reimbursement',
  'Health Economics': 'Reimbursement',
  'Reimbursement': 'Reimbursement',
  'Reimbursement & Market Access': 'Reimbursement',
  'Risk Assessment': 'Risk Analysis',
  'Clinical Evidence': 'Clinical Evidence',
  'Clinical Evidence Strategy': 'Clinical Evidence',
  'IP Strategy': 'IP Strategy',
  'IP Strategy & Freedom to Operate': 'IP Strategy',
  'Project Plan': 'Essential Gates',
  'High-Level Project & Resource Plan': 'Essential Gates',
  'Essential Gates': 'Essential Gates',
  'Use of Proceeds': 'Use of Proceeds',
  'Funding & Use of Proceeds': 'Use of Proceeds',
  'Revenue Forecast': 'Revenue Forecast',
  'Team Profile': 'Team Profile',
  'GTM Strategy': 'GTM Strategy',
  'Go-to-Market Strategy': 'GTM Strategy',
  'Manufacturing': 'Manufacturing',
  'Manufacturing & Supply Chain': 'Manufacturing',
  'Exit Strategy': 'Exit Strategy',
  'Exit Strategy & Comparable Valuations': 'Exit Strategy',
};

// Get short label from full label (remove ✓/❌ prefix)
const getShortLabel = (label: string): string => {
  return label.replace(/^[✓❌]\s*/, '').trim();
};

// Get module for a step label
const getModuleForStep = (label: string): string => {
  const shortLabel = getShortLabel(label);
  // Try exact match first
  if (STEP_TO_MODULE[shortLabel]) {
    return STEP_TO_MODULE[shortLabel];
  }
  // Try partial match
  for (const [key, module] of Object.entries(STEP_TO_MODULE)) {
    if (shortLabel.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(shortLabel.toLowerCase())) {
      return module;
    }
  }
  return 'Business Case'; // Default fallback
};

export function GenesisLaunchStepsSidebar({
  productId,
  readinessChecklist,
  overallProgress,
}: GenesisLaunchStepsSidebarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnStep = searchParams.get('returnTo') === 'genesis';
  const [helpSidebarOpen, setHelpSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { lang } = useTranslation();

  // Get preview drawer control from context
  const { openPreview } = useInvestorPreview();

  // Find first incomplete step as "current"
  const currentStepIndex = readinessChecklist.findIndex(item => !item.complete);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : readinessChecklist.length - 1;
  const currentStepItem = readinessChecklist[currentStep];
  const currentStepLabel = currentStepItem?.labelKey ? lang(currentStepItem.labelKey) : getShortLabel(currentStepItem?.label || 'Getting Started');
  const isCurrentComplete = readinessChecklist[currentStep]?.complete;

  const completedCount = readinessChecklist.filter(item => item.complete).length;
  const totalSteps = readinessChecklist.length;

  const handleStepClick = (index: number) => {
    const route = readinessChecklist[index].route;
    const separator = route.includes('?') ? '&' : '?';
    navigate(`${route}${separator}returnTo=genesis`);
  };

  const handleViewPreview = () => {
    openPreview();
  };

  return (
    <>
      <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-60px)] z-30">
        {/* Header */}
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                XYReg Genesis
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setHelpSidebarOpen(true)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Help & Documentation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                   <TooltipTrigger asChild>
                     <button
                       onClick={handleViewPreview}
                       className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                     >
                       <Eye className="h-4 w-4" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent side="left">View Investor Preview</TooltipContent>
                 </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Current Step */}
          <h3 className="font-semibold text-foreground text-sm truncate" title={`Step ${currentStep + 1}: ${currentStepLabel}`}>
            Step {currentStep + 1}: {currentStepLabel}
          </h3>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  overallProgress >= 100
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : overallProgress >= 50
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                      : "bg-gradient-to-r from-amber-500 to-blue-500"
                )}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-medium tabular-nums whitespace-nowrap",
              overallProgress >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}>
              {completedCount}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Step Status Card - Clickable to navigate to current step */}
        <button
          onClick={() => handleStepClick(currentStep)}
          className={cn(
            "mx-4 mt-4 p-3 rounded-lg border w-[calc(100%-2rem)] text-left transition-all hover:shadow-md",
            isCurrentComplete
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700"
          )}
        >
          <div className="flex items-center gap-2">
            {isCurrentComplete ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-amber-500" />
            )}
            <h4 className={cn(
              "text-sm font-medium",
              isCurrentComplete ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"
            )}>
              {isCurrentComplete ? lang('genesis.sidebar.stepComplete') : lang('genesis.sidebar.nextStep')}
            </h4>
          </div>
          <p className={cn(
            "text-xs mt-1",
            isCurrentComplete ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
          )}>
            {isCurrentComplete
              ? lang('genesis.sidebar.clickToContinue')
              : lang('genesis.sidebar.completeToProceed').replace('{{step}}', currentStepLabel)
            }
          </p>
        </button>

        {/* All Steps List */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-16"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setShowScrollTop(target.scrollTop > 100);
          }}
        >
          {/* Back to Launch Button - only show when on a step (has returnTo=genesis) */}
          {isOnStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/app/product/${productId}/business-case?tab=genesis`)}
              className="w-full justify-start gap-2 mb-3 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="text-xs">{lang('genesis.sidebar.backToGenesisHome')}</span>
            </Button>
          )}

          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {lang('genesis.sidebar.allSteps')}
          </h4>
          <div className="space-y-1">
            {/* Part I Header */}
            <div className="pt-1 pb-2">
              <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                {lang('genesis.sidebar.partITitle')}
              </h5>
              <p className="text-[10px] text-muted-foreground italic mt-0.5">
                {lang('genesis.sidebar.partISubtitle')}
              </p>
            </div>
            {readinessChecklist.map((item, index) => {
              const isActive = index === currentStep;
              const shortLabel = item.labelKey ? lang(item.labelKey) : getShortLabel(item.label);
              const moduleName = getModuleForStep(item.label);
              const moduleStyle = MODULE_STYLES[moduleName] || { icon: LayoutGrid, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/50' };
              const ModuleIcon = moduleStyle.icon;

              return (
                <>
                  {/* Part II Header before Step 8 "Profile User" (index 7) */}
                  {index === 7 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        {lang('genesis.sidebar.partIITitle')}
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        {lang('genesis.sidebar.partIISubtitle')}
                      </p>
                    </div>
                  )}
                  {/* Part III Header before Step 13 (index 12) */}
                  {index === 12 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        {lang('genesis.sidebar.partIIITitle')}
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        {lang('genesis.sidebar.partIIISubtitle')}
                      </p>
                    </div>
                  )}
                  {/* Part V Header before Step 19 Strategic Partners (index 18) */}
                  {index === 18 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        {lang('genesis.sidebar.partVTitle')}
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        {lang('genesis.sidebar.partVSubtitle')}
                      </p>
                    </div>
                  )}
                  
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors",
                      isActive
                        ? item.complete
                          ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-600'
                          : 'bg-primary/10 text-primary ring-2 ring-primary'
                        : item.complete
                          ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-500/15'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.complete ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive ? 'text-primary' : 'text-muted-foreground/50'
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs block truncate",
                        (isActive || item.complete) && 'font-medium'
                      )}>
                        {index + 1}. {shortLabel}
                      </span>
                    </div>
                    {/* Module Badge */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "flex-shrink-0 p-1 rounded",
                            moduleStyle.bgClass
                          )}>
                            <ModuleIcon className={cn("h-3 w-3", moduleStyle.colorClass)} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          {moduleName}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </button>
                </>
              );
            })}
          </div>
        </div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <div className="absolute bottom-20 right-4 z-10">
            <button
              onClick={() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className={cn(
                "p-2 rounded-full",
                "bg-primary/90 hover:bg-primary text-primary-foreground",
                "shadow-lg transition-all duration-200",
                "hover:scale-105 active:scale-95"
              )}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Help Sidebar */}
      <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />
    </>
  );
}
