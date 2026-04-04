import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Book, 
  Play, 
  FileText, 
  Users, 
  Settings, 
  Activity, 
  X,
  Video,
  HelpCircle,
  Clock,
  BookOpen,
  Lightbulb,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGenesisRestrictions } from "@/hooks/useGenesisRestrictions";
import { MarkdownRenderer } from './MarkdownRenderer';
import { HelpSearchBox } from './HelpSearchBox';
import { ModuleDeepDive } from './ModuleDeepDive';
import { ModuleContent } from '@/types/onboarding';
import { platformGuideModule } from './moduleContent/platformGuideModule';
import { CircularProgress } from '@/components/common/CircularProgress';

interface HelpTopic {
  id: string;
  translationKey: string;
  title: string;
  description: string;
  category: string;
  content: string;
  userRoles: string[];
  tags: string[];
  videoUrl?: string;
}

// Only keep specialised topics that have unique value
const helpTopics: HelpTopic[] = [
  // Smart Cost Intelligence (4 topics)
  {
    id: 'smart-cost-overview',
    translationKey: 'smartCostOverview',
    title: 'Smart Cost Intelligence Overview',
    description: 'AI-powered cost estimation and market analysis',
    category: 'Smart Cost Intelligence',
    content: `
# Smart Cost Intelligence System

The Smart Cost Intelligence system provides AI-powered cost estimation for medical device market extensions, combining regulatory data, device complexity, and market intelligence.

## Key Features

### 1. Market-Specific Cost Templates
- Validated cost data for major global markets
- Regulatory submission fees and requirements
- Clinical trial costs and timelines
- Marketing and distribution expenses

### 2. Device Complexity Intelligence
- Automatic cost adjustments based on device class
- Risk-based multipliers for accuracy
- Specialized handling for IVD and SaMD devices
- Regulatory pathway optimization

### 3. Scenario Planning
- Conservative: Safe, higher-end cost estimates (+15-25%)
- Typical: Balanced, market-standard costs (baseline)
- Aggressive: Optimistic, lower-end estimates (-10-20%)

### 4. Smart Adjustments
- Real-time currency conversion
- Inflation modeling for multi-year timelines
- Market-specific economic factors
- Historical cost validation

## How to Use

1. Select Market: Choose your target market extension
2. Configure Device Class: System auto-detects complexity
3. Choose Scenario: Pick conservative, typical, or aggressive
4. Review Templates: Examine market-specific cost categories
5. Apply Smart Estimates: Use AI-calculated costs or customize
6. Analyze Adjustments: Review detailed cost breakdowns
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['cost-intelligence', 'ai', 'estimation', 'market-analysis']
  },
  {
    id: 'device-class-multipliers',
    translationKey: 'deviceClassMultipliers',
    title: 'Understanding Device Class Cost Multipliers',
    description: 'How device complexity affects regulatory costs',
    category: 'Smart Cost Intelligence',
    content: `
# Device Class Cost Multipliers

The system automatically adjusts costs based on your device's regulatory classification and complexity.

## Classification Impact

### Class I Devices
- Base Multiplier: 1.0x
- Regulatory: 1.0x (minimal requirements)
- Clinical: 0.8x (often exempt)

### Class II Devices  
- Base Multiplier: 1.2x
- Regulatory: 1.5x (510(k) required)
- Clinical: 1.2x (often required)

### Class III Devices
- Base Multiplier: 1.8x
- Regulatory: 2.5x (PMA required)
- Clinical: 2.0x (extensive studies)

### IVD Devices
- Base Multiplier: Variable (1.1-2.0x)
- Risk-based: A (1.1x) to D (2.0x)

### SaMD (Software as Medical Device)
- Base Multiplier: Variable (1.0-1.8x)  
- Risk categories: I (1.0x) to IV (1.8x)
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['device-class', 'multipliers', 'classification', 'regulatory']
  },
  {
    id: 'cost-scenario-planning',
    translationKey: 'costScenarioPlanning',
    title: 'Cost Scenario Planning & Risk Management',
    description: 'Strategic cost modeling for different business scenarios',
    category: 'Smart Cost Intelligence',
    content: `
# Cost Scenario Planning

Strategic cost modeling helps you plan for different business and regulatory scenarios.

## Scenario Types

### Conservative Scenario (+15-25%)
- First-time market entry, novel or complex devices
- Higher regulatory costs, extended timelines

### Typical Scenario (Baseline)
- Standard market extensions, well-understood devices
- Market-standard costs, normal timelines

### Aggressive Scenario (-10-20%)
- Fast-follower strategy, streamlined devices
- Optimized costs, accelerated timelines

## Best Practices
1. Always model multiple scenarios
2. Document assumptions clearly
3. Update as new information emerges
4. Consider scenario probability weighting
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['scenarios', 'planning', 'risk-management', 'strategy']
  },
  {
    id: 'currency-inflation-modeling',
    translationKey: 'currencyInflation',
    title: 'Currency Conversion & Inflation Modeling',
    description: 'Financial modeling for multi-year, multi-market projects',
    category: 'Smart Cost Intelligence',
    content: `
# Currency & Inflation Intelligence

Advanced financial modeling for accurate multi-year, multi-market cost projections.

## Currency Conversion
- Live market rates updated daily
- Market-specific costs (not just converted)
- Currency risk management alerts

## Inflation Modeling
- Configurable annual inflation rates
- Compound calculations across multi-year timelines
- Conservative (4-6%), Typical (2-4%), Aggressive (1-3%)

## Best Practices
1. Use local currency data when available
2. Use conservative estimates for long timelines
3. Update projections regularly
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['currency', 'inflation', 'financial-modeling', 'economics']
  },
  // Genesis Guide
  {
    id: 'genesis-guide',
    translationKey: 'genesisGuide',
    title: 'Genesis Step-by-Step Guide',
    description: 'Complete walkthrough of the 26-step Genesis checklist and how to share with investors',
    category: 'Guides',
    content: `
# Genesis Step-by-Step Guide

Genesis is your structured pathway to building an investor-ready business case for a medical device. It guides you through 26 steps organized into four parts.

## The 26-Step Checklist

### Part I: Product & Technology Foundation (Steps 1–7)
1. **Device Name** — Official product name
2. **Device Description** — What your device does and the problem it solves
3. **Upload Device Image** — Product photo, render, or prototype image
4. **Intended Use & Value Proposition** — Purpose and differentiation
5. **Device Type** — Product category selection
6. **TRL & System Architecture** — Technology readiness and architecture details
7. **Classify Device** — Regulatory classification (EU MDR, FDA)

### Part II: Market & Stakeholder Analysis (Steps 8–12)
8. **Profile User** — End-user demographics and needs
9. **Profile Economic Buyer** — Decision-maker priorities
10. **Select Target Markets** — Geographic market selection
11. **Market Sizing** — TAM, SAM, SOM estimates
12. **Competitor Analysis** — Competitive landscape mapping

### Part III: Strategy & Evidence (Steps 13–18)
13. **IP Strategy & Freedom to Operate** — Patent and IP planning
14. **Clinical Evidence Strategy** — Evidence generation plan
15. **Health Economic Model (HEOR)** — Cost-effectiveness analysis
16. **Reimbursement & Market Access** — Payment pathway strategy
17. **Revenue Forecast** — Financial projections
18. **Go-to-Market Strategy** — Launch and distribution plan

### Part IV: Operational Execution (Steps 19–26)
19. **Strategic Partners** — Key partnerships
20. **Manufacturing & Supply Chain** — Production planning
21. **Team Composition** — Key team members and roles
22. **Project & Resource Plan** — Timeline and milestones
23. **Risk Assessment** — Business and technical risks
24. **Business Model Canvas** — Strategic synthesis
25. **Strategic Horizon** — 3–5 year vision
26. **Funding & Use of Proceeds** — Investment ask and allocation

## Tips
- Complete steps in order for the best flow
- Use the Investor Preview (eye icon) to see what investors will see
- Higher completion percentage signals thoroughness to investors
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    tags: ['genesis', 'business-case', 'investor', 'checklist'],
  },
  // Business Analysis & NPV
  {
    id: 'business-analysis',
    translationKey: 'businessAnalysis',
    title: 'Business Analysis & NPV Tools',
    description: 'Using business analysis tools for commercial planning',
    category: 'Business & Finance',
    content: `
# Business Analysis & NPV Tools

Leverage built-in business analysis tools for commercial planning and investment decision-making.

## NPV Analysis (Net Present Value)
- Cash Flow Modeling: Model development costs, revenues, and ongoing expenses
- Risk Assessment: Incorporate uncertainty and risk factors into financial models
- Scenario Analysis: Compare different development and commercialization scenarios
- Sensitivity Analysis: Understand key drivers of project economics

## Business Case Development
1. Market Opportunity: Define target market and value proposition
2. Technical Feasibility: Assess technical risks and development requirements
3. Regulatory Strategy: Plan regulatory pathway and associated costs
4. Financial Projections: Develop comprehensive financial models
5. Risk Assessment: Identify and quantify key business risks
6. Decision Framework: Create clear go/no-go decision criteria
    `,
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['business-analysis', 'NPV', 'financial-modeling', 'commercial-planning']
  },
  // Billing & Subscription
  {
    id: 'billing-subscriptions',
    translationKey: 'billing',
    title: 'Billing & Subscription Management',
    description: 'Managing billing, subscriptions, and plan features',
    category: 'Business & Finance',
    content: `
# Billing & Subscription Management

Manage your subscription plans, billing, and access to premium features.

## Subscription Plans
- Starter Plan: Basic features for small teams and single products
- Professional Plan: Enhanced features for growing companies
- Business Plan: Advanced features for established organizations
- Enterprise Plan: Full feature access with custom integrations

## Billing Management
- Payment Methods: Credit card, invoicing, and other payment options
- Billing Cycles: Monthly, annual, and custom billing arrangements
- Usage Monitoring: Track usage against plan limits
    `,
    userRoles: ['admin', 'company_admin'],
    tags: ['billing', 'subscriptions', 'plans', 'financial-management']
  },
];

interface EnhancedHelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, automatically opens the guide at this section index */
  autoOpenSectionIndex?: number | null;
  /** Incremented each time to force re-trigger even for the same index */
  autoOpenTrigger?: number;
  /** Section ID to auto-mark as completed */
  autoCompleteSection?: string | null;
  /** Called after auto-complete is consumed */
  onAutoCompleteConsumed?: () => void;
}

// Section descriptions for the Platform Guide cards
// Section descriptions for the Platform Guide cards — 16 sections in 4 tiers
const sectionDescriptions: Record<string, string> = {
  // Tier 1: Platform Orientation
  'welcome-to-xyreg': 'What XyReg is, the Living Technical File, the Digital Thread',
  'platform-architecture': 'Three levels: Client Compass → Company → Device',
  'navigation-sidebar': 'L1/L2 sidebar, context switching, breadcrumbs',
  // Tier 2: Company Level
  'mission-control': 'Your daily command centre — portfolio health, action items',
  'client-compass': 'Multi-company management and quick-switching',
  'company-dashboard-portfolio': 'Company metrics, device portfolio, adding products',
  'supplier-management': 'Approved Supplier List, evaluations, certifications',
  'company-documents-compliance': 'QMS documents, gap analysis, audits, activities',
  'company-operations': 'Budget, CAPA, Change Control, PMS, Training, Audit Log',
  // Tier 3: Device Level
  'device-dashboard-definition': 'Device description, purpose, UDI, markets',
  'classification-regulatory-pathway': 'EU MDR and FDA classification wizards',
  'design-risk-controls': 'Requirements, FMEA, V&V, usability, traceability',
  'device-compliance-instances': 'Device-scoped documents, gap analysis, audits',
  'device-operations-lifecycle': 'Design review, PMS, CAPA, milestones, manufacturing',
  // Tier 4: Strategic Tools
  'business-case-genesis': 'Venture Blueprint, market analysis, rNPV, Genesis checklist',
  'draft-studio': 'Document templates, composer, data integration',
};

const sectionEstimates: Record<string, string> = {
  'welcome-to-xyreg': '5 min',
  'platform-architecture': '5 min',
  'navigation-sidebar': '4 min',
  'mission-control': '4 min',
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

export function EnhancedHelpSystem({ isOpen, onClose, autoOpenSectionIndex, autoOpenTrigger = 0, autoCompleteSection, onAutoCompleteConsumed }: EnhancedHelpSystemProps) {
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<ModuleContent | null>(null);
  const [initialStep, setInitialStep] = useState(0);

  // Track last consumed trigger to avoid re-firing
  const [lastConsumedTrigger, setLastConsumedTrigger] = useState(0);

  // Auto-open a section when returning from a tour
  useEffect(() => {
    if (isOpen && autoOpenSectionIndex != null && autoOpenSectionIndex >= 0 && autoOpenTrigger > lastConsumedTrigger) {
      setLastConsumedTrigger(autoOpenTrigger);
      setSelectedModule(null);
      setTimeout(() => {
        setInitialStep(autoOpenSectionIndex);
        setSelectedModule(platformGuideModule);
      }, 50);
    }
  }, [isOpen, autoOpenSectionIndex, autoOpenTrigger, lastConsumedTrigger]);

  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('platform-guide-completed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { userRole } = useAuth();
  const { companyRoles } = useCompanyRole();
  const { lang } = useTranslation();
  const { isGenesis } = useGenesisRestrictions();

  // Only show Client Compass section for multi-company users
  const isMultiCompany = companyRoles.length > 1;
  const filteredGuideSteps = platformGuideModule.steps.filter(
    step => step.id !== 'client-compass' || isMultiCompany
  );

  useEffect(() => {
    localStorage.setItem('platform-guide-completed', JSON.stringify(completedSections));
  }, [completedSections]);

  // Auto-mark section as complete when returning from a successful tour
  useEffect(() => {
    if (autoCompleteSection && !completedSections.includes(autoCompleteSection)) {
      setCompletedSections(prev => [...prev, autoCompleteSection]);
    }
    if (autoCompleteSection && onAutoCompleteConsumed) {
      onAutoCompleteConsumed();
    }
  }, [autoCompleteSection]);

  // Genesis-relevant help topic IDs
  const GENESIS_TOPIC_IDS = [
    'genesis-guide',
    'business-analysis',
  ];

  const visibleTopics = isGenesis
    ? helpTopics.filter(t => GENESIS_TOPIC_IDS.includes(t.id))
    : helpTopics;

  const categories = ['all', ...Array.from(new Set(visibleTopics.map(topic => topic.category)))];

  const filteredTopics = visibleTopics.filter(topic => {
    if (!topic.userRoles.includes(userRole || 'viewer')) return false;
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Guides': return <Play className="h-4 w-4" />;
      case 'Smart Cost Intelligence': return <Activity className="h-4 w-4" />;
      case 'Business & Finance': return <FileText className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  const getTranslatedCategory = (category: string): string => {
    const categoryKeyMap: Record<string, string> = {
      'Smart Cost Intelligence': 'smartCostIntelligence',
      'Guides': 'guides',
      'Business & Finance': 'businessFinance',
    };
    const key = categoryKeyMap[category];
    return key ? (lang(`enhancedHelp.categories.${key}`) || category) : category;
  };

  const getTopicTitle = (topic: HelpTopic): string => {
    return lang(`enhancedHelp.helpTopics.${topic.translationKey}.title`) || topic.title;
  };

  const getTopicDescription = (topic: HelpTopic): string => {
    return lang(`enhancedHelp.helpTopics.${topic.translationKey}.description`) || topic.description;
  };

  const getTopicContent = (topic: HelpTopic): string => {
    const translatedContent = lang(`enhancedHelp.helpTopics.${topic.translationKey}.content`);
    return (translatedContent && !translatedContent.includes('enhancedHelp.helpTopics'))
      ? translatedContent
      : topic.content;
  };

  const handleOpenSection = (filteredIndex: number) => {
    // Map filtered index back to real index in platformGuideModule.steps
    const step = filteredGuideSteps[filteredIndex];
    const realIndex = platformGuideModule.steps.findIndex(s => s.id === step.id);
    // Force remount by clearing first, then setting on next tick
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

  const guideProgress = Math.round((completedSections.length / filteredGuideSteps.length) * 100);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[95vh] p-0 gap-0 flex flex-col [&>button.absolute]:hidden">
        {selectedModule ? (
          /* Full-width Module Deep Dive */
          <div className="h-full flex flex-col">
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <div className="bg-gradient-to-br from-help-primary to-help-secondary p-2 rounded-lg text-white shadow-md">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="font-heading">{lang('enhancedHelp.learningCenter')}</span>
                </DialogTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <ModuleDeepDive
                  key={`${selectedModule.id}-${initialStep}`}
                  module={selectedModule}
                  onClose={() => setSelectedModule(null)}
                  onCloseDialog={onClose}
                  initialStep={initialStep}
                />
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* Normal Two-Column Layout */
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-[36rem] border-r bg-background flex flex-col shrink-0">
              <DialogHeader className="px-6 py-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <div className="bg-gradient-to-br from-help-primary to-help-secondary p-2 rounded-lg text-white shadow-md">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <span className="font-heading">XyReg Guide & Help</span>
                  </DialogTitle>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-6 pb-4">
                    <Tabs defaultValue="guide" className="w-full">
                      <TabsList className="flex w-full mb-4">
                        <TabsTrigger value="guide" className="flex items-center gap-2 flex-1">
                          <GraduationCap className="h-4 w-4" />
                          Guide
                        </TabsTrigger>
                        <TabsTrigger value="reference" className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-4 w-4" />
                          Reference
                        </TabsTrigger>
                      </TabsList>

                      {/* GUIDE TAB — Platform Guide sections */}
                      <TabsContent value="guide" className="mt-0 flex-1 min-h-0">
                        {/* Progress header */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50 border">
                          <CircularProgress percentage={guideProgress} size={44} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">XyReg Platform Guide</p>
                            <p className="text-xs text-muted-foreground">
                              {completedSections.length} of {filteredGuideSteps.length} sections · ~{platformGuideModule.estimatedTime} min total
                            </p>
                          </div>
                        </div>

                        {/* Section cards */}
                        <div className="space-y-2">
                          {filteredGuideSteps.map((step, index) => {
                            const isComplete = completedSections.includes(step.id);
                            return (
                              <Card
                                key={step.id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  isComplete ? 'bg-green-50/50 border-green-200/60 dark:bg-green-950/20 dark:border-green-800/30' : 'hover:bg-accent/50'
                                }`}
                                onClick={() => handleOpenSection(index)}
                              >
                                <CardHeader className="p-3">
                                  <div className="flex items-center gap-3">
                                    {/* Section number / check */}
                                    <button
                                      onClick={(e) => toggleSectionComplete(step.id, e)}
                                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                        isComplete
                                          ? 'bg-green-600 text-white'
                                          : 'bg-muted text-muted-foreground hover:bg-primary/10'
                                      }`}
                                    >
                                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step.id === 'client-compass' ? '0' : (isMultiCompany ? index : index + 1)}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm font-medium line-clamp-1">
                                        {step.title.replace(/^Section \d+:\s*/, '')}
                                      </CardTitle>
                                      <CardDescription className="text-xs mt-0.5 line-clamp-1">
                                        {sectionDescriptions[step.id] || ''}
                                      </CardDescription>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {sectionEstimates[step.id] || '5 min'}
                                      </span>
                                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  </div>
                                </CardHeader>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* REFERENCE TAB — Specialised topics */}
                      <TabsContent value="reference" className="mt-0 flex-1 min-h-0">
                        {/* Category Filter */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {categories.map((category) => (
                              <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className="text-xs h-7"
                              >
                                {category === 'all' ? lang('enhancedHelp.filter.allTopics') : getTranslatedCategory(category)}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <ScrollArea className="h-[calc(90vh-320px)]">
                          <div className="space-y-2 pr-4">
                            {filteredTopics.map((topic) => (
                              <Card
                                key={topic.id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  selectedTopic?.id === topic.id 
                                    ? 'bg-help-primary/10 border-help-primary/30 shadow-sm' 
                                    : 'hover:bg-accent/50'
                                }`}
                                onClick={() => setSelectedTopic(topic)}
                              >
                                <CardHeader className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      selectedTopic?.id === topic.id 
                                        ? 'bg-help-primary text-white' 
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {getCategoryIcon(topic.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm font-medium line-clamp-1">
                                        {getTopicTitle(topic)}
                                      </CardTitle>
                                      <CardDescription className="text-xs mt-1 line-clamp-2">
                                        {getTopicDescription(topic)}
                                      </CardDescription>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {topic.tags.slice(0, 2).map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-8 pb-16">
                  {selectedTopic ? (
                    <div>
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-gradient-to-br from-help-primary to-help-secondary p-3 rounded-xl text-white shadow-lg">
                          {getCategoryIcon(selectedTopic.category)}
                        </div>
                        <div className="flex-1">
                          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                            {getTopicTitle(selectedTopic)}
                          </h1>
                          <p className="text-muted-foreground text-lg">{getTopicDescription(selectedTopic)}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className="text-sm">
                              {getTranslatedCategory(selectedTopic.category)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <MarkdownRenderer
                          content={getTopicContent(selectedTopic)}
                          className="max-w-none"
                        />
                      </div>

                      <div className="mt-8 flex flex-wrap gap-2">
                        {selectedTopic.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-help-primary to-help-secondary p-4 rounded-2xl text-white shadow-lg inline-block mb-6">
                        <Lightbulb className="h-8 w-8" />
                      </div>
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                        {lang('enhancedHelp.welcome.title')}
                      </h2>
                      <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                        {lang('enhancedHelp.welcome.description')}
                      </p>
                      <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>10-section Platform Guide</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{helpTopics.length} reference topics</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
