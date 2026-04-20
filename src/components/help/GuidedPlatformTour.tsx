import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, X, CheckCircle, MapPin, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TourStep {
  id: string;
  title: string;
  description: string;
  tip: string;
  routeSuffix: string; // appended to /app/company/{name}
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to XyReg',
    description: 'XyReg is a Regulatory Operating System (RegOS) built around three altitudes: the Client Compass (multi-company overview), the Company level (QMS, suppliers, foundation documents, operations), and the Device level (definition, design controls, risk, compliance). This tour walks you through each one.',
    tip: 'Everything is connected through a Digital Thread — requirements, risks, V&V, and evidence all link automatically.',
    routeSuffix: '',
    icon: '🏠',
  },
  {
    id: 'sidebar',
    title: 'Sidebar — L1 & L2 Navigation',
    description: 'The left icon bar (L1) shows your top-level modules. Single-click navigates; double-click toggles the contextual L2 panel that lists every sub-module. The L2 panel is amber-pulsing on the relevant item during this tour.',
    tip: 'Use the chevron at the top/bottom of the collapsed L2 bar to expand it without double-clicking.',
    routeSuffix: '/mission-control',
    icon: '🧭',
  },
  {
    id: 'mission-control',
    title: 'Mission Control — Your Daily Briefing',
    description: 'Mission Control is your personalised command centre. It follows a "negative filter" philosophy — only what needs your attention right now is shown: approvals, deadlines, and personal action items.',
    tip: 'Open Mission Control first thing every morning — it surfaces blockers before you start individual modules.',
    routeSuffix: '/mission-control',
    icon: '🎯',
  },
  {
    id: 'mission-control-widgets',
    title: 'Mission Control Widgets',
    description: 'The right rail hosts modular widgets you can show/hide: My Action Items (approvals, reviews), Activity Stream (recent changes), Competency Radar (training compliance), Communication Hub (internal messages), My Documents (your drafts), Portfolio Health, Regulatory News (live regulator feeds), Knowledge Bot (Slack RAG), and Task List.',
    tip: 'Click the "Customize widgets" button to enable/disable any widget. Drag to reorder.',
    routeSuffix: '/mission-control',
    icon: '🧩',
  },
  {
    id: 'portfolio',
    title: 'Company Dashboard & Portfolio',
    description: 'Your list of all medical devices for this company. Group devices into families (Family-Federated model) to share hazards, requirements, and documents across related products. Each device shows its lifecycle phase, classification, and compliance score.',
    tip: 'Family members inherit hazards from the technical root — define common controls once.',
    routeSuffix: '/portfolio-landing?tab=portfolio',
    icon: '📦',
  },
  {
    id: 'suppliers',
    title: 'Suppliers — Approved Supplier List (ASL)',
    description: 'Your company-wide ASL per ISO 13485 §7.4. Qualify suppliers, track certifications with expiry alerts, and link suppliers to specific BOM components for full supply-chain traceability.',
    tip: 'Mark suppliers as "critical" to enforce stricter qualification and re-evaluation requirements.',
    routeSuffix: '/suppliers',
    icon: '🏭',
  },
  {
    id: 'foundation-docs',
    title: 'Foundation Documents',
    description: 'Your enterprise-level QMS backbone — Quality Manual (pointer-style, ISO 13485 §4.2.2), SOPs, policies, work instructions, forms, and lists. These define HOW you work, separate from device-specific evidence.',
    tip: 'All 51 native SOPs are seeded as modules with auto-generated training records.',
    routeSuffix: '/documents',
    icon: '📋',
  },
  {
    id: 'gap-analysis',
    title: 'Compliance & Gap Analysis',
    description: 'Assess compliance against 20+ regulatory frameworks (ISO 13485, EU MDR, FDA 21 CFR 820, ISO 14971, IEC 62304, IEC 62366-1, ISO 10993-1:2025, EHDS, and more). Each gap links to a clause and can be assigned for remediation.',
    tip: 'Core frameworks auto-enable based on your target markets — check the framework selector for optional standards.',
    routeSuffix: '/gap-analysis',
    icon: '🔍',
  },
  {
    id: 'operations',
    title: 'Operations — CAPA, CCR, PMS, Training, Audit Log',
    description: 'Company-wide operational processes: CAPA (with rationale gating per QMSR), Change Control (CCR), Post-Market Surveillance, Management Review, Training, Calibration, Production execution, and the immutable Audit Log (21 CFR Part 11).',
    tip: 'Every CAPA must include a documented determination rationale before promotion — the system enforces this gate.',
    routeSuffix: '/operations',
    icon: '⚙️',
  },
  {
    id: 'device-definition',
    title: 'Device Level — Definition & Classification',
    description: 'When you open a device, you descend to L3. Define intended purpose, run the EU MDR Annex VIII / FDA classification wizards, set up multi-market regulatory pathways, and configure UDI. This is where the Digital Thread begins for each product.',
    tip: 'The classification wizard generates risk class automatically and feeds the Regulatory Dossier.',
    routeSuffix: '',
    icon: '🔬',
  },
  {
    id: 'design-risk',
    title: 'Device Level — Design & Risk Controls',
    description: 'The heart of the Technical File: User Needs → Design Inputs → Design Outputs, ISO 14971 Hazard Traceability, V&V protocols, Usability (IEC 62366-1), and the automated Traceability Matrix that connects everything end-to-end.',
    tip: 'The Traceability Matrix only shows hazards linked to requirements — orphans are excluded by design.',
    routeSuffix: '',
    icon: '⚙️',
  },
  {
    id: 'device-compliance',
    title: 'Device Compliance & Evidence',
    description: 'Device-scoped documents, audits, and gap analysis. This is where device-specific evidence lives — separate from company-level Foundation Documents. Bulk ingestion supports PDF/DOCX with auto-classification.',
    tip: 'Use the bulk-action toolbar (selection-first model) to validate or move multiple documents at once.',
    routeSuffix: '',
    icon: '🛡️',
  },
  {
    id: 'draft-studio',
    title: 'Draft Studio',
    description: 'The unified authoring environment. Document Studio (Doc CI) handles enterprise documents; the side-drawer DocumentDraftDrawer handles device-scoped authoring. AI generation is architecture-aware and grounded in company + product context.',
    tip: 'The "Create Document" action follows an Editor-First workflow — you author first, then save to CI.',
    routeSuffix: '/draft-studio',
    icon: '✍️',
  },
  {
    id: 'wrap-up',
    title: 'Tour Complete! 🎉',
    description: 'You have seen all 14 key areas. The Help sidebar (📖 in the top bar) has detailed guides per module — including the new Mission Control Widgets section. Each Help section now has its own mini-tour with the same amber pulse you saw here.',
    tip: 'Press F1 anytime to open Help, or Ctrl+J to search and jump anywhere in the platform.',
    routeSuffix: '/mission-control',
    icon: '🏁',
  },
];

const STORAGE_KEY = 'platform-basics-tour-state';

interface GuidedPlatformTourProps {
  isActive: boolean;
  onClose: () => void;
  onEnsureL2Open?: () => void;
  /** Company name resolved from app context (works regardless of current URL shape) */
  contextCompanyName?: string;
}

export function GuidedPlatformTour({ isActive, onClose, onEnsureL2Open, contextCompanyName }: GuidedPlatformTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [firstProductId, setFirstProductId] = useState<string | null>(null);

  // Resolve company name from URL first, then fall back to app context (e.g. when starting on /app/product/...)
  const companyName = React.useMemo(() => {
    const match = location.pathname.match(/\/app\/company\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
    return contextCompanyName || null;
  }, [location.pathname, contextCompanyName]);

  // Fetch first product for the company
  useEffect(() => {
    if (!isActive || !companyName) return;
    const fetchProduct = async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .limit(1);
      if (!companies?.length) return;
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companies[0].id)
        .limit(1);
      if (products?.length) {
        setFirstProductId(products[0].id);
      }
    };
    fetchProduct();
  }, [isActive, companyName]);

  // Show callout with delay after navigation
  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), 400);
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);

  const navigateToStep = useCallback((stepIndex: number) => {
    if (!companyName) return;
    
    // Small delay to ensure L2 opens before navigation
    onEnsureL2Open?.();
    
    const step = TOUR_STEPS[stepIndex];
    
    // Product-level steps navigate to product pages
    if (step.id === 'device-definition' && firstProductId) {
      setTimeout(() => navigate(`/app/product/${firstProductId}/device-information?tab=overview`), 50);
      return;
    }
    if (step.id === 'design-risk' && firstProductId) {
      setTimeout(() => navigate(`/app/product/${firstProductId}/design-risk-controls?tab=requirement-specifications`), 50);
      return;
    }
    if (step.id === 'device-compliance' && firstProductId) {
      setTimeout(() => navigate(`/app/product/${firstProductId}/compliance`), 50);
      return;
    }
    
    // For product-level steps without a product, stay on current page
    if ((step.id === 'device-definition' || step.id === 'design-risk' || step.id === 'device-compliance') && !firstProductId) {
      return;
    }
    
    const basePath = `/app/company/${encodeURIComponent(companyName)}`;
    const route = `${basePath}${step.routeSuffix}`;
    navigate(route);
  }, [companyName, navigate, onEnsureL2Open, firstProductId]);

  const handleNext = useCallback(() => {
    // Guard: don't advance the visible step if we can't navigate yet (no company context)
    if (!companyName) return;
    setIsVisible(false);
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigateToStep(nextStep);
    } else {
      // Tour complete
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true }));
      onClose();
    }
  }, [currentStep, navigateToStep, onClose, companyName]);

  const handlePrevious = useCallback(() => {
    if (!companyName) return;
    if (currentStep > 0) {
      setIsVisible(false);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigateToStep(prevStep);
    }
  }, [currentStep, navigateToStep, companyName]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true, skipped: true }));
    onClose();
  }, [onClose]);

  // When the tour activates: ALWAYS reset to step 0 and (once company is known) navigate to the start.
  // Resetting is decoupled from companyName so a restart from /app/product/... still rewinds the tour.
  useEffect(() => {
    if (!isActive) return;
    setCurrentStep(0);
    setIsVisible(false);
    onEnsureL2Open?.();
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once company context is resolved while active, navigate to the first step's company route.
  useEffect(() => {
    if (!isActive || !companyName) return;
    if (currentStep !== 0) return;
    navigateToStep(0);
  }, [isActive, companyName]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isActive || !isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div
      className="fixed top-20 z-[60] w-[420px] max-w-[calc(100vw-2rem)]"
      style={{ left: 'clamp(1rem, calc(var(--l1-width, 104px) + var(--l2-width, 248px) + 1rem), calc(100vw - 420px - 1rem))' }}
    >
      <Card className="shadow-2xl border-2 border-amber-500/60 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <CardTitle className="text-base leading-tight">{step.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Tip callout */}
          <div className="flex gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              {step.tip}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-1">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip tour
              </Button>
              <Button size="sm" onClick={handleNext} className="bg-amber-600 hover:bg-amber-700 text-white">
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
