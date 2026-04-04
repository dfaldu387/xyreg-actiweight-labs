import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crosshair, Map, CheckCircle, Circle, Target, BookOpen, Eye, ChevronUp, ChevronDown, Menu, X, Home, Cpu, FlaskConical, AlertTriangle, LayoutGrid, Flag, Users, Shield, Scale, Factory, Cog, DollarSign, TrendingUp, Banknote } from 'lucide-react';
import { GlobalHelpSidebar } from '@/components/help/GlobalHelpSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
interface ChecklistItem {
  label: string;
  complete: boolean;
  route: string;
}

interface StepRequirement {
  label: string;
  isMet: boolean;
  targetId?: string; // ID of the element to scroll to when clicked
}

interface StepCompletionInfo {
  description: string;
  requirements: StepRequirement[];
}

interface VentureBlueprintGuideSidebarProps {
  productId: string;
  readinessChecklist: ChecklistItem[];
  currentStepIndex: number;
  overallProgress: number;
  returnTo: string;
  completionData?: {
    hasDeviceName?: boolean;
    hasDeviceType?: boolean;
    hasPrimaryRegulatoryType?: boolean;
    hasInvasivenessLevel?: boolean;
    isIVD?: boolean; // IVD devices don't require invasiveness
    hasActiveDevice?: boolean;
    hasTRL?: boolean;
    hasSystemArchitecture?: boolean;
    hasIntendedUse?: boolean;
    hasDescription?: boolean;
    hasMedia?: boolean;
    hasCompetitor?: boolean;
    hasTAM?: boolean;
    hasSAM?: boolean;
    hasSOM?: boolean;
    hasTargetPopulation?: boolean;
    hasUseEnvironment?: boolean;
    hasTargetMarkets?: boolean;
    hasBuyerProfile?: boolean;
    hasValueProposition?: boolean;
    canvasSectionsFilled?: number;
    hasTeamMembers?: boolean;
    hasGatesProgress?: boolean;
    hasPhasesWithDates?: boolean;
    hasTimelineConfirmed?: boolean;
    hasEvidenceContent?: boolean;
    hasLiteratureComplete?: boolean;
    hasReimbursementData?: boolean;
    hasTargetCodes?: boolean;
    hasCoverageStatus?: boolean;
    hasPayerMix?: boolean;
    hasRisks?: boolean;
    blueprintNotesCount?: number;
    hasRegulatoryPathway?: boolean;
    hasGtmStrategy?: boolean;
    hasUseOfProceeds?: boolean;
    hasManufacturing?: boolean;
    hasIPStrategy?: boolean;
    hasIPAssessment?: boolean;
    hasFTOAssessment?: boolean;
    hasHealthEconomics?: boolean;
    hasRevenueForecast?: boolean;
    hasExitStrategy?: boolean;
    hasStrategicPartners?: boolean;
    hasKeyActivities?: boolean;
  };
  onTogglePreviewDrawer?: () => void;
  isPreviewDrawerOpen?: boolean;
}

// Module color and icon mapping (matches GenesisLaunchStepsSidebar)
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

// Map step labels to module labels
const STEP_TO_MODULE: Record<string, string> = {
  'Device Name': 'Device Definition',
  'TRL Assessment': 'Device Definition',
  'Technical Readiness Level (TRL)': 'Device Definition',
  'Technical Readiness': 'Device Definition',
  'System Architecture': 'Device Definition',
  'Team Composition': 'Team Profile',
  'Key Activities': 'Business Case',
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
  'Hazard Traceability Matrix': 'Risk Analysis',
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
  'Strategic Horizon': 'Business Case',
  'Business Model Canvas': 'Business Case',
};

// Get module for a step label
const getModuleForStep = (label: string): string => {
  const shortLabel = label.replace(/^[✓❌]\s*/, '').trim();
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

// Get step-specific completion requirements (17 items matching readinessChecklist)
const getStepRequirements = (
  stepIndex: number,
  data: VentureBlueprintGuideSidebarProps['completionData'] = {}
): StepCompletionInfo | null => {
  // Requirements indexed to match readinessChecklist order from useViabilityFunnelProgress
  // Genesis 26 steps: indices 0-25
  const requirements: Record<number, StepCompletionInfo> = {
    // Step 1 (index 0): Device Name
    0: {
      description: "Set your device's official name (done during creation)",
      requirements: [
        { label: "Fill in Device Name", isMet: Boolean(data.hasDeviceName) },
      ]
    },
    // Step 2 (index 1): Device Description
    1: {
      description: "Describe what your device is - its physical form and technology",
      requirements: [
        { label: "Add device description", isMet: Boolean(data.hasDescription) },
      ]
    },
    // Step 3 (index 2): Upload Device Image
    2: {
      description: "Upload visual documentation of your device",
      requirements: [
        { label: "Upload at least one device image", isMet: Boolean(data.hasMedia) },
      ]
    },
    // Step 4 (index 3): Intended Use and Value Proposition
    3: {
      description: "Define why your device exists and the measurable benefit",
      requirements: [
        { label: "Fill in Intended Use", isMet: Boolean(data.hasIntendedUse), targetId: "genesis-intended-use" },
        { label: "Add Value Proposition", isMet: Boolean(data.hasValueProposition), targetId: "genesis-value-proposition" },
      ]
    },
    // Step 5 (index 4): Device Type (3 required fields, but invasiveness is N/A for IVD)
    4: {
      description: data.isIVD 
        ? "Define regulatory type and active status (invasiveness N/A for IVD)"
        : "Define regulatory type, invasiveness, and active status",
      requirements: [
        { label: "Select Primary Regulatory Type", isMet: Boolean(data.hasPrimaryRegulatoryType), targetId: "primary-regulatory-type-section" },
        // Only show invasiveness requirement for non-IVD devices
        ...(data.isIVD ? [] : [{ label: "Select Core Device Nature", isMet: Boolean(data.hasInvasivenessLevel), targetId: "core-device-nature-section" }]),
        { label: "Indicate if device is Active", isMet: Boolean(data.hasActiveDevice), targetId: "active-device-section" },
      ]
    },
    // Step 6 (index 5): TRL and System Architecture
    5: {
      description: "Assess technology maturity and define your device architecture",
      requirements: [
        { label: "Select Technology Readiness Level (TRL)", isMet: Boolean(data.hasTRL) },
        { label: "Select System Architecture type", isMet: Boolean(data.hasSystemArchitecture) },
      ]
    },
    // Step 7 (index 6): Classify Device
    6: {
      description: "Set device classification for target markets",
      requirements: [
        { label: "Set risk class for ALL selected target markets", isMet: Boolean(data.hasRegulatoryPathway) },
      ]
    },
    // Step 8 (index 7): Profile User
    7: {
      description: "Define your target users",
      requirements: [
        { label: "Add target population", isMet: Boolean(data.hasTargetPopulation) },
        { label: "Define use environment", isMet: Boolean(data.hasUseEnvironment) },
      ]
    },
    // Step 9 (index 8): Profile Economic Buyer
    8: {
      description: "Define who pays for your device",
      requirements: [
        { label: "Select market with budget & buyer type", isMet: Boolean(data.hasBuyerProfile) },
      ]
    },
    // Step 10 (index 9): Select Target Markets
    9: {
      description: "Choose which markets you plan to enter",
      requirements: [
        { label: "Select at least one target market", isMet: Boolean(data.hasTargetMarkets) },
      ]
    },
    // Step 11 (index 10): Market Sizing
    10: {
      description: "Define your market opportunity",
      requirements: [
        { label: "Enter TAM value", isMet: Boolean(data.hasTAM), targetId: "genesis-tam-value" },
        { label: "Enter SAM value", isMet: Boolean(data.hasSAM), targetId: "genesis-sam-value" },
        { label: "Enter SOM value", isMet: Boolean(data.hasSOM), targetId: "genesis-som-value" },
      ]
    },
    // Step 12 (index 11): Competitor Analysis
    11: {
      description: "Identify your competition",
      requirements: [
        { label: "Add at least 1 competitor", isMet: Boolean(data.hasCompetitor) },
      ]
    },
    // Step 13 (index 12): IP Strategy & Freedom to Operate
    12: {
      description: "Map your defensive moat and assess FTO",
      requirements: [
        { label: "Add at least one IP asset", isMet: Boolean(data.hasIPAssessment), targetId: "genesis-ip-assets" },
        { label: "Complete FTO assessment (Certainty + Status)", isMet: Boolean(data.hasFTOAssessment), targetId: "genesis-fto-assessment" },
      ]
    },
    // Step 14 (index 13): Clinical Evidence Strategy
    13: {
      description: "Plan clinical evidence strategy",
      requirements: [
        { label: "Fill in evidence requirements or study design", isMet: Boolean(data.hasEvidenceContent), targetId: "genesis-evidence-requirements" },
        { label: "Supporting Literature", isMet: Boolean(data.hasLiteratureComplete), targetId: "genesis-supporting-literature" },
      ]
    },
    // Step 15 (index 14): Health Economic Model (HEOR)
    14: {
      description: "Prove the ROI to economic buyers",
      requirements: [
        { label: "Complete Cost Savings", isMet: Boolean(data.hasHealthEconomics) },
      ]
    },
    // Step 16 (index 15): Reimbursement & Market Access
    15: {
      description: "Define reimbursement pathway",
      requirements: [
        { label: "Add Target Reimbursement Codes", isMet: Boolean(data.hasTargetCodes), targetId: "genesis-target-codes" },
        { label: "Set Payer Mix (100%)", isMet: Boolean(data.hasPayerMix), targetId: "genesis-payer-mix" },
        { label: "Fill Coverage Status (status, timeline, notes)", isMet: Boolean(data.hasCoverageStatus), targetId: "genesis-coverage-status" },
      ]
    },
    // Step 17 (index 16): Revenue Forecast
    16: {
      description: "Project your expected sales and pricing",
      requirements: [
        { label: "Fill in all 8 forecast fields (units, price, COGS, etc.)", isMet: Boolean(data.hasRevenueForecast) },
      ]
    },
    // Step 18 (index 17): Go-to-Market Strategy
    17: {
      description: "Plan your go-to-market approach",
      requirements: [
        { label: "Configure channels or territory priority", isMet: Boolean(data.hasGtmStrategy) },
      ]
    },
    // Step 19 (index 18): Strategic Partners (was Step 20)
    18: {
      description: "Add market-specific strategic partners",
      requirements: [
        { label: "Add at least 2 partners across any categories", isMet: Boolean(data.hasStrategicPartners) },
      ]
    },
    // Step 20 (index 19): Manufacturing & Supply Chain (was Step 21)
    19: {
      description: "Define manufacturing approach",
      requirements: [
        { label: "Set manufacturing stage and model", isMet: Boolean(data.hasManufacturing) },
      ]
    },
    // Step 21 (index 20): Team Composition (was Step 22)
    20: {
      description: "Add team members to showcase your expertise",
      requirements: [
        { label: "Add at least one team member", isMet: Boolean(data.hasTeamMembers) },
      ]
    },
    // Step 22 (index 21): High-Level Project & Resource Plan (was Step 23)
    21: {
      description: "Set phase timeline dates",
      requirements: [
        { label: "Set start and end dates for all phases and confirm", isMet: Boolean(data.hasPhasesWithDates && data.hasTimelineConfirmed) },
      ]
    },
    // Step 23 (index 22): Risk Assessment (was Step 24)
    22: {
      description: "Add risks in High Level Assessment OR Hazard Traceability Matrix",
      requirements: [
        { label: "Add at least 1 risk in either tab", isMet: Boolean(data.hasRisks) },
      ]
    },
    // Step 24 (index 23): Business Model Canvas
    23: {
      description: "Complete your business model",
      requirements: [
        { label: "Fill in Key Activities in Business Canvas", isMet: Boolean(data.hasKeyActivities) },
      ]
    },
    // Step 25 (index 24): Strategic Horizon
    24: {
      description: "Define your exit strategy and timeline",
      requirements: [
        { label: "Select strategic horizon", isMet: Boolean(data.hasExitStrategy) },
      ]
    },
    // Step 26 (index 25): Funding & Use of Proceeds
    25: {
      description: "Allocate your funding",
      requirements: [
        { label: "Set at least one allocation percentage", isMet: Boolean(data.hasUseOfProceeds) },
      ]
    },
  };

  return requirements[stepIndex] || null;
};

// Get short label from full label (remove ✓/❌ prefix and step number)
const getShortLabel = (label: string): string => {
  return label.replace(/^[✓❌]\s*/, '').replace(/^\d+\.\s*/, '').trim();
};

export function VentureBlueprintGuideSidebar({
  productId,
  readinessChecklist,
  currentStepIndex,
  overallProgress,
  returnTo,
  completionData = {},
  onTogglePreviewDrawer,
  isPreviewDrawerOpen = false,
}: VentureBlueprintGuideSidebarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [helpSidebarOpen, setHelpSidebarOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isVentureBlueprint = returnTo === 'venture-blueprint';
  const isGenesis = returnTo === 'genesis' || returnTo === 'investor-share';

  const currentStepLabel = currentStepIndex >= 0
    ? getShortLabel(readinessChecklist[currentStepIndex].label)
    : 'Getting Started';

  // Use 1-based index for step number display
  const currentStepNumber = String(currentStepIndex + 1);

  // Get completion requirements for current step
  const stepRequirements = currentStepIndex >= 0 ? getStepRequirements(currentStepIndex, completionData) : null;
  const isStepComplete = currentStepIndex >= 0 && readinessChecklist[currentStepIndex]?.complete;

  // Detect if sidebar is floating (scrolled past initial position)
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        // Consider floating when sidebar is at top of viewport
        setIsFloating(rect.top <= 16);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReturnToList = () => {
    if (isVentureBlueprint) {
      navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`);
    } else {
      navigate(`/app/product/${productId}/business-case?tab=genesis`);
    }
  };

  const handleStepClick = (index: number) => {
    setIsMobileExpanded(false); // Close mobile sidebar
    const route = readinessChecklist[index].route;
    const separator = route.includes('?') ? '&' : '?';
    navigate(`${route}${separator}returnTo=${returnTo}`);
  };

  const completedCount = readinessChecklist.filter(item => item.complete).length;
  const totalSteps = readinessChecklist.length;

  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom (only on small screens) */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className={cn(
          "md:hidden fixed bottom-4 right-4 z-50",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 transition-all duration-200",
          "hover:scale-105 active:scale-95"
        )}
      >
        {isMobileExpanded ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">{completedCount}/{totalSteps} Steps</span>
          </>
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={cn(
          // Base styles
          "bg-background flex flex-col overflow-hidden",
          "rounded-lg",
          "transition-all duration-300 ease-out",

          // Mobile: Fixed bottom sheet style
          "fixed md:relative",
          "inset-x-0 md:inset-x-auto",
          "bottom-0 md:bottom-auto",
          "z-50 md:z-auto",

          // Mobile: Slide up animation
          isMobileExpanded
            ? "translate-y-0 opacity-100"
            : "translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto",

          // Width responsive
          "w-full md:w-[260px] lg:w-[280px] xl:w-[300px]",

          // Height responsive - use h-full on md+ to fill parent container
          "max-h-[85vh] md:max-h-none",
          "h-auto md:h-full",

          // Border styles
          "border-t md:border-t-0 md:border-l border-border",

          // Floating effect on desktop
          isFloating && "md:shadow-lg md:shadow-black/5 md:dark:shadow-black/20 md:border md:border-border/50"
        )}
      >
      {/* Mobile drag handle */}
      <div className="md:hidden flex justify-center py-2 border-b">
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header - fixed at top */}
      <div className={cn(
        "p-3 sm:p-4 border-b flex-shrink-0",
        "transition-colors duration-300",
        isFloating
          ? "bg-background/95 backdrop-blur-md"
          : "bg-background/50"
      )}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(`/app/product/${productId}/business-case?tab=genesis`)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            {isVentureBlueprint ? (
              <Map className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            ) : (
              <Crosshair className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isVentureBlueprint ? 'Venture Blueprint' : 'XYReg Genesis'}
            </span>
          </button>
          <div className="flex items-center gap-1">
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
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
            {onTogglePreviewDrawer && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onTogglePreviewDrawer}
                      className={`p-1.5 rounded-md transition-colors ${
                        isPreviewDrawerOpen 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {isPreviewDrawerOpen ? 'Close Investor Preview' : 'Preview Investor View'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-foreground truncate" title={currentStepIndex >= 0 ? `Step ${currentStepNumber}: ${currentStepLabel}` : currentStepLabel}>
          {currentStepIndex >= 0 ? `Step ${currentStepNumber}: ${currentStepLabel}` : currentStepLabel}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
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
            "text-xs font-medium tabular-nums",
            overallProgress >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
          )}>
            {completedCount}/{totalSteps}
          </span>
        </div>
      </div>

      {/* To Complete This Step section - fixed, not scrolling */}
      {stepRequirements && (
        <div className={`p-4 border-b flex-shrink-0 ${isStepComplete ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
          <h4 className={`text-sm font-medium flex items-center gap-2 ${isStepComplete ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
            <Target className="h-4 w-4" />
            {isStepComplete ? 'Step Complete!' : 'To Complete This Step'}
          </h4>
          <p className={`text-xs mt-1 ${isStepComplete ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {stepRequirements.description}
          </p>
          <ul className="mt-2 space-y-1.5">
            {stepRequirements.requirements.map((req, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 text-xs",
                  req.targetId && "cursor-pointer"
                )}
                onClick={() => {
                  if (req.targetId) {
                    const element = document.getElementById(req.targetId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Focus the input if it's an input element
                      const input = element.querySelector('input, textarea, select');
                      if (input) {
                        (input as HTMLElement).focus();
                      }
                    }
                  }
                }}
              >
                {req.isMet ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <span className={cn(
                  req.isMet ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-foreground',
                  req.targetId && !req.isMet && 'hover:underline underline-offset-2'
                )}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main content area with native scrolling */}
      <div
        ref={scrollAreaRef}
        style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
        className="scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-muted/30 hover:scrollbar-thumb-muted-foreground/60"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          setShowScrollTop(target.scrollTop > 100);
        }}
      >
        {/* Compact Checklist */}
        <div className="p-4 pb-16">
          {/* Back to Launch Button - prominent position above steps */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsMobileExpanded(false);
              handleReturnToList();
            }}
            className="w-full justify-start gap-2 mb-3 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="text-xs">Back to Genesis Home</span>
          </Button>

          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            All Steps
          </h4>
          <div className="space-y-1">
            {/* Part I Header */}
            <div className="pt-1 pb-2">
              <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Part I: Product & Technology Foundation
              </h5>
              <p className="text-[10px] text-muted-foreground italic mt-0.5">
                The "What" and the "How."
              </p>
            </div>
            {readinessChecklist.map((item, index) => {
              const isActive = index === currentStepIndex;
              const shortLabel = getShortLabel(item.label);
              const moduleName = getModuleForStep(item.label);
              const moduleStyle = MODULE_STYLES[moduleName] || { icon: LayoutGrid, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/50' };
              const ModuleIcon = moduleStyle.icon;

              return (
                <>
                  {/* Part II Header before Step 8 "Profile User" (index 7) */}
                  {index === 7 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Part II: Market & Stakeholder Analysis
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        The "Who" and the "Why."
                      </p>
                    </div>
                  )}
                  {/* Part III Header before Step 13 (index 12) */}
                  {index === 12 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Part III: Strategy & Evidence
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        The "Barriers" and the "Validation."
                      </p>
                    </div>
                  )}
                  {/* Part V Header before Step 19 Strategic Partners (index 18) */}
                  {index === 18 && (
                    <div className="pt-4 pb-2 mt-2 border-t">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Part V: Operational Execution & Logistics
                      </h5>
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        The "Action Plan."
                      </p>
                    </div>
                  )}
                  
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 sm:px-2 py-2.5 sm:py-1.5 rounded-md text-left transition-colors",
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

        {/* Scroll to top button - appears when scrolled down */}
        {showScrollTop && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none">
            <button
              onClick={() => {
                scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                "pointer-events-auto",
                "p-2 rounded-full",
                "bg-primary/90 hover:bg-primary text-primary-foreground",
                "shadow-lg shadow-primary/20",
                "transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "animate-in fade-in slide-in-from-bottom-2 duration-200"
              )}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer with Return button - fixed at bottom */}
      <div className={cn(
        "p-3 sm:p-4 border-t flex-shrink-0",
        "bg-gradient-to-t from-background via-background to-background/80",
        "backdrop-blur-sm",
        "pb-6 md:pb-4" // Extra padding on mobile for safe area
      )}>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 shadow-sm border border-foreground/50"
          onClick={() => {
            setIsMobileExpanded(false);
            handleReturnToList();
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to {isVentureBlueprint ? 'Blueprint' : 'Genesis'}
        </Button>
      </div>

      {/* Help Sidebar */}
      <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />
    </div>
    </>
  );
}
