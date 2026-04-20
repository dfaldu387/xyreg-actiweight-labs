import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useMissionControl } from '@/context/MissionControlContext';
import { PLATFORM_TOUR_CONFIGS, PlatformTourStepConfig } from '@/data/platformGuideTourConfigs';
import { toast } from 'sonner';
import { useCompanyRole } from '@/context/CompanyRoleContext';

// Helper to extract company name from URL path
const extractCompanyFromPath = (pathname: string): string | null => {
  // Match /app/company/{companyName}/... pattern
  const match = pathname.match(/\/app\/company\/([^/]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
};

// Route configuration for each onboarding step
const getStepRoute = (stepId: string, companyName: string): string | null => {
  const encodedCompany = encodeURIComponent(companyName);

  const routeConfigs: Record<string, string> = {
    'profile-setup': `/app/company/${encodedCompany}/settings?tab=profile`,
    'navigation-basics': `/app/company/${encodedCompany}`,
    'help-system': `/app/company/${encodedCompany}`,
    'company-profile': `/app/company/${encodedCompany}/settings?tab=company`,
    'phases-setup': `/app/company/${encodedCompany}/settings?tab=lifecycle-phases`,
    'templates-setup': `/app/company/${encodedCompany}/settings?tab=templates`,
    'compliance-frameworks': `/app/company/${encodedCompany}/settings?tab=compliance`,
    'first-product': `/app/company/${encodedCompany}/portfolio`,
    'product-classification': `/app/company/${encodedCompany}/portfolio`,
    'milestones-intro': `/app/company/${encodedCompany}/portfolio`,
    'first-document': `/app/company/${encodedCompany}/documents`,
    'template-usage': `/app/company/${encodedCompany}/documents`,
    'version-control': `/app/company/${encodedCompany}/documents`,
    'gap-analysis': `/app/company/${encodedCompany}/gap-analysis`,
    'audit-management': `/app/company/${encodedCompany}/audits`,
    'business-analysis': `/app/company/${encodedCompany}/business-analysis`,
  };

  return routeConfigs[stepId] || null;
};

// Tour step configurations (simple format - will be converted to StepType)
interface TourStepConfig {
  selector: string;
  title: string;
  description: string;
}

const tourStepConfigs: Record<string, TourStepConfig[]> = {
  'profile-setup': [
    { selector: '[data-tour="user-profile"]', title: 'Your Profile', description: 'Click here to access and update your profile information, preferences, and settings.' },
    { selector: '[data-tour="profile-avatar"]', title: 'Profile Avatar', description: 'Your profile picture appears here. You can customize it in settings.' },
  ],
  'navigation-basics': [
    { selector: '[data-tour="sidebar"]', title: 'Navigation Sidebar', description: 'Use the sidebar to navigate between different sections of the platform.' },
    { selector: '[data-tour="main-menu"]', title: 'Main Menu', description: 'Access all major features from this menu including Products, Documents, and Compliance.' },
    { selector: '[data-tour="search"]', title: 'Quick Search', description: 'Use the search bar to quickly find products, documents, and more.' },
  ],
  'help-system': [
    { selector: '[data-tour="help-button"]', title: 'Help & Support', description: 'Click here anytime to access help resources, tutorials, and support.' },
    { selector: '[data-tour="contextual-help"]', title: 'Contextual Help', description: 'Look for help icons throughout the platform for context-specific guidance.' },
  ],
  'company-profile': [
    { selector: '[data-tour="company-settings"]', title: 'Company Settings', description: 'Configure your company information and regulatory details here.' },
  ],
  'phases-setup': [
    { selector: '[data-tour="lifecycle-phases"]', title: 'Lifecycle Phases', description: 'Set up and manage product development phases for your organization.' },
    { selector: '[data-tour="add-phase"]', title: 'Add New Phase', description: 'Click here to add a new lifecycle phase for your products.' },
    { selector: '[data-tour="phase-list"]', title: 'Phase List', description: 'View and manage all your configured lifecycle phases here.' },
  ],
  'templates-setup': [
    { selector: '[data-tour="document-templates"]', title: 'Document Templates', description: 'Create and manage document templates for efficient document generation.' },
  ],
  'compliance-frameworks': [
    { selector: '[data-tour="compliance"]', title: 'Compliance Frameworks', description: 'Configure regulatory frameworks like EU MDR, FDA 510(k), and more.' },
  ],
  'first-product': [
    { selector: '[data-tour="products"]', title: 'Products', description: 'Create and manage your medical device products here.' },
    { selector: '[data-tour="add-product"]', title: 'Add Product', description: 'Click here to create your first product.' },
  ],
  'product-classification': [
    { selector: '[data-tour="classification"]', title: 'Device Classification', description: 'Use the classification wizard to determine your regulatory pathway.' },
  ],
  'milestones-intro': [
    { selector: '[data-tour="milestones"]', title: 'Milestones', description: 'Track your product development progress with milestones.' },
  ],
  'first-document': [
    { selector: '[data-tour="documents"]', title: 'Documents', description: 'Upload and manage your regulatory documents here.' },
    { selector: '[data-tour="upload-document"]', title: 'Upload Document', description: 'Click here to upload your first document.' },
  ],
  'template-usage': [
    { selector: '[data-tour="use-template"]', title: 'Use Templates', description: 'Generate documents quickly using pre-built templates.' },
  ],
  'version-control': [
    { selector: '[data-tour="version-history"]', title: 'Version Control', description: 'View document history and manage versions and approvals.' },
  ],
  'gap-analysis': [
    { selector: '[data-tour="gap-analysis"]', title: 'Gap Analysis', description: 'Run compliance assessments to identify gaps in your documentation.' },
  ],
  'audit-management': [
    { selector: '[data-tour="audits"]', title: 'Audit Management', description: 'Prepare for and manage regulatory audits effectively.' },
  ],
  'business-analysis': [
    { selector: '[data-tour="business-analysis"]', title: 'Business Analysis', description: 'Use NPV calculators and business analysis tools.' },
  ],
};

// Context for managing onboarding tour state
interface OnboardingTourContextType {
  startTour: (stepId: string, stageId: string) => void;
  startPlatformTour: (sectionId: string) => void;
  activeTourStepId: string | null;
  activeTourStageId: string | null;
  /** Register a callback fired when a platform tour ends. `completed` indicates Done vs Skip. */
  setOnPlatformTourComplete: (cb: ((sectionId: string, completed: boolean) => void) | null) => void;
  /** Register a callback fired when a platform tour starts. Use to dismiss overlays. */
  setOnPlatformTourStart: (cb: ((sectionId: string) => void) | null) => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType>({
  startTour: () => {},
  startPlatformTour: () => {},
  activeTourStepId: null,
  activeTourStageId: null,
  setOnPlatformTourComplete: () => {},
  setOnPlatformTourStart: () => {},
});

export const useOnboardingTour = () => useContext(OnboardingTourContext);


// Step Content Component - uses useTour to get current step
interface StepContentProps {
  configs: TourStepConfig[];
  onComplete: () => void;
  onSkip: () => void;
}

function StepContent({ configs, onComplete, onSkip }: StepContentProps) {
  const { currentStep, setCurrentStep } = useTour();

  const totalSteps = configs.length;
  const config = configs[currentStep] || configs[0];
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('[Reactour] ➡️ Next button clicked');
    // console.log('[Reactour] Current step:', currentStep, 'Total steps:', totalSteps);
    // console.log('[Reactour] Is last step:', isLast);
    
    if (isLast) {
      // console.log('[Reactour] ✅ Last step - completing tour');
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      // console.log('[Reactour] Moving to next step:', nextStep);
      setCurrentStep(nextStep);
      // console.log('[Reactour] ✅ Step changed to:', nextStep);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('[Reactour] ⬅️ Previous button clicked');
    // console.log('[Reactour] Current step:', currentStep);
    // console.log('[Reactour] Is first step:', isFirst);
    
    if (!isFirst) {
      const prevStep = currentStep - 1;
      // console.log('[Reactour] Moving to previous step:', prevStep);
      setCurrentStep(prevStep);
      // console.log('[Reactour] ✅ Step changed to:', prevStep);
    } else {
      // console.log('[Reactour] ⚠️ Already on first step, cannot go back');
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('[Reactour] ⏭️ Skip button clicked');
    // console.log('[Reactour] Skipping tour...');
    onSkip();
  };

  return (
    <div className="p-0 min-w-[320px]">
      {/* Header */}
      <div className="px-6 pt-5 pb-2">
        <h3 className="text-xl font-bold text-teal-700 tracking-tight">{config.title}</h3>
      </div>

      {/* Description */}
      <div className="px-6 pb-4">
        <p className="text-sm text-slate-600 leading-relaxed">{config.description}</p>
      </div>

      {/* Progress */}
      <div className="px-6 pb-3">
        <span className="text-xs text-slate-500 font-medium">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
        >
          Skip Tour
        </button>

        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              boxShadow: '0 4px 14px 0 rgba(15, 118, 110, 0.3)',
            }}
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inner component that has access to useTour
function OnboardingTourController({ children }: { children: ReactNode }) {
  const { setIsOpen, setSteps, setCurrentStep } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyName: paramCompanyName } = useParams<{ companyName: string }>();
  const { selectedCompanyName } = useMissionControl();
  const { completeStep } = useOnboarding();
  const { companyRoles } = useCompanyRole();

  const [activeTourStepId, setActiveTourStepId] = useState<string | null>(null);
  const [activeTourStageId, setActiveTourStageId] = useState<string | null>(null);
  const [currentConfigs, setCurrentConfigs] = useState<TourStepConfig[]>([]);

  // Platform tour return-to-help callback
  const onPlatformTourCompleteRef = useRef<((sectionId: string, completed: boolean) => void) | null>(null);
  const onPlatformTourStartRef = useRef<((sectionId: string) => void) | null>(null);
  const pendingPlatformSectionRef = useRef<string | null>(null);

  // Use refs to store pending completion data to avoid stale closures
  const pendingCompleteRef = useRef<{ stageId: string; stepId: string } | null>(null);

  // Get company name from multiple sources (priority: URL params > URL path > MissionControl context)
  const getCompanyName = useCallback((): string => {
    // 1. Try URL params first
    if (paramCompanyName) {
      return decodeURIComponent(paramCompanyName);
    }
    // 2. Try extracting from current URL path
    const pathCompany = extractCompanyFromPath(location.pathname);
    if (pathCompany) {
      return pathCompany;
    }
    // 3. Try MissionControl context
    if (selectedCompanyName) {
      return selectedCompanyName;
    }
    // 4. Fallback: use first company from user's roles
    if (companyRoles && companyRoles.length > 0) {
      return companyRoles[0].companyName;
    }
    return '';
  }, [paramCompanyName, location.pathname, selectedCompanyName, companyRoles]);

  const currentCompanyName = getCompanyName();

  // Stable reference to completeStep
  const completeStepRef = useRef(completeStep);
  useEffect(() => {
    completeStepRef.current = completeStep;
  }, [completeStep]);

  const handleTourComplete = useCallback(() => {
    const pending = pendingCompleteRef.current;
    if (pending) {
      completeStepRef.current(pending.stageId, pending.stepId);
      pendingCompleteRef.current = null;
    }

    // Fire platform tour return-to-help callback
    const platformSection = pendingPlatformSectionRef.current;
    if (platformSection && onPlatformTourCompleteRef.current) {
      const cb = onPlatformTourCompleteRef.current;
      pendingPlatformSectionRef.current = null;
      // Small delay so tour UI fully closes before help reopens
      setTimeout(() => cb(platformSection, true), 400);
    }

    setActiveTourStepId(null);
    setActiveTourStageId(null);
    setCurrentConfigs([]);
    setIsOpen(false);
  }, [setIsOpen]);

  const handleSkipTour = useCallback(() => {
    pendingCompleteRef.current = null;

    // Also return to help on skip (stay on same section)
    const platformSection = pendingPlatformSectionRef.current;
    if (platformSection && onPlatformTourCompleteRef.current) {
      const cb = onPlatformTourCompleteRef.current;
      // For skip, pass the same section so help reopens at the current step (not next)
      pendingPlatformSectionRef.current = null;
      setTimeout(() => cb(platformSection, false), 400);
    } else {
      pendingPlatformSectionRef.current = null;
    }

    setActiveTourStepId(null);
    setActiveTourStageId(null);
    setCurrentConfigs([]);
    setIsOpen(false);
  }, [setIsOpen]);

  const startTour = useCallback((stepId: string, stageId: string) => {
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('[Reactour] 🚀 STARTING TOUR');
    // console.log('[Reactour] Step ID:', stepId);
    // console.log('[Reactour] Stage ID:', stageId);
    // console.log('[Reactour] Current URL:', window.location.href);

    // Store pending completion in ref
    pendingCompleteRef.current = { stageId, stepId };
    // console.log('[Reactour] Stored pending completion:', pendingCompleteRef.current);

    setActiveTourStepId(stepId);
    setActiveTourStageId(stageId);
    // console.log('[Reactour] Set active tour step/stage IDs');

    // Get company name at the time of starting the tour
    const companyName = getCompanyName();
    // console.log('[Reactour] Company name for navigation:', companyName);

    // Get the route for this step
    const route = companyName ? getStepRoute(stepId, companyName) : null;
    // console.log('[Reactour] Route for step:', route);

    // Navigate to the route if available
    if (route) {
      // console.log('[Reactour] 🧭 Navigating to:', route);
      navigate(route);
    } else {
      // console.log('[Reactour] ⚠️ No route found, staying on current page');
    }

    // Wait for navigation and page to load
    // Increased delay to ensure page is fully rendered, especially for React components
    const tourDelay = route ? 1000 : 400;
    // console.log('[Reactour] Tour delay (ms):', tourDelay);
    // console.log('[Reactour] Will start tour in', tourDelay, 'ms...');

    // Helper function to wait for elements with retry
    const waitForElements = (selectors: string[], maxRetries = 10, delay = 200): Promise<Map<string, Element | null>> => {
      return new Promise((resolve) => {
        let retries = 0;
        const foundElements = new Map<string, Element | null>();

        const checkElements = () => {
          // console.log(`[Reactour] Checking elements (attempt ${retries + 1}/${maxRetries})...`);
          selectors.forEach(selector => {
            if (!foundElements.has(selector)) {
              const element = document.querySelector(selector);
              if (element) {
                // console.log(`[Reactour] ✅ Element found: ${selector}`);
                foundElements.set(selector, element);
              } else {
                // console.log(`[Reactour] ⏳ Element not found yet: ${selector}`);
                foundElements.set(selector, null);
              }
            }
          });

          const allFound = selectors.every(selector => foundElements.get(selector) !== null);
          
          if (allFound || retries >= maxRetries - 1) {
            // console.log(`[Reactour] Element check complete. Found: ${Array.from(foundElements.values()).filter(el => el !== null).length}/${selectors.length}`);
            resolve(foundElements);
          } else {
            retries++;
            setTimeout(checkElements, delay);
          }
        };

        checkElements();
      });
    };

    setTimeout(async () => {
      // console.log('[Reactour] ⏰ Timeout fired, initializing tour steps...');
      const stepConfigs = tourStepConfigs[stepId] || [
        { selector: 'body', title: 'Welcome', description: 'Let us guide you through this feature.' }
      ];

      // console.log('[Reactour] Step configs for', stepId, ':', stepConfigs);

      // Get all selectors (excluding 'body')
      const selectors = stepConfigs
        .map(config => config.selector)
        .filter(selector => selector !== 'body');
      
      // console.log('[Reactour] Looking for selectors:', selectors);

      // Wait for elements to appear with retries
      if (selectors.length > 0) {
        // console.log('[Reactour] Waiting for elements to appear...');
        const foundElements = await waitForElements(selectors, 15, 300); // 15 retries, 300ms delay = 4.5 seconds max
      }

      // Filter to only include existing elements
      const validConfigs = stepConfigs.filter(config => {
        if (config.selector === 'body') {
          // console.log('[Reactour] ✅ Including body selector (always valid)');
          return true;
        }
        const element = document.querySelector(config.selector);
        if (!element) {
          console.warn(`[Reactour] ❌ Element not found: ${config.selector}`);
          console.warn(`[Reactour] Current page HTML snippet:`, document.body.innerHTML.substring(0, 500));
          return false;
        }
        // console.log(`[Reactour] ✅ Element found: ${config.selector}`, element);
        return true;
      });

      if (validConfigs.length === 0) {
        console.warn('[Reactour] ⚠️ No valid steps found, showing fallback');
        console.warn('[Reactour] Available data-tour attributes on page:', 
          Array.from(document.querySelectorAll('[data-tour]')).map(el => el.getAttribute('data-tour'))
        );
        validConfigs.push({ selector: 'body', title: 'Feature Tour', description: 'This feature is ready to explore. Click around to learn more!' });
      }

      // console.log('[Reactour] Valid configs:', validConfigs.length);

      // Store configs in state so StepContent can access them
      setCurrentConfigs(validConfigs);

      // Build steps - each step just renders StepContent which reads current step from useTour
      const steps: StepType[] = validConfigs.map((config) => ({
        selector: config.selector,
        content: () => (
          <StepContent
            configs={validConfigs}
            onComplete={handleTourComplete}
            onSkip={handleSkipTour}
          />
        ),
      }));

      // console.log('[Reactour] 📋 Setting steps:', steps.length);
      // console.log('[Reactour] Steps array:', steps);
      
      setSteps(steps);
      // console.log('[Reactour] ✅ Steps set in tour provider');
      
      setCurrentStep(0);
      // console.log('[Reactour] ✅ Current step set to 0');
      
      // console.log('[Reactour] 🎬 Opening tour...');
      setIsOpen(true);
      // console.log('[Reactour] ✅ Tour should now be visible!');
      // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, tourDelay);
  }, [navigate, getCompanyName, setSteps, setCurrentStep, setIsOpen, handleTourComplete, handleSkipTour]);

  // Platform Guide tour launcher — navigates to the right page and starts a tour
  const startPlatformTour = useCallback((sectionId: string) => {
    pendingPlatformSectionRef.current = sectionId;
    const config = PLATFORM_TOUR_CONFIGS[sectionId];
    if (!config) return;

    // Notify listeners (e.g. Help panel) so they can dismiss overlays
    if (onPlatformTourStartRef.current) {
      onPlatformTourStartRef.current(sectionId);
    }
    // Also broadcast a window event so any open Help UI can dismiss itself
    // (more reliable than ref registration which can be cleared on remount)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xyreg:tour-start', { detail: { sectionId } }));
    }

    const companyName = getCompanyName();
    if (!companyName) {
      toast.info("Please navigate to a company first to start this tour.");
      return;
    }

    const encodedCompany = encodeURIComponent(companyName);
    // Support absolute routes (e.g. '/app/clients') and company-relative routes
    const route = config.route.startsWith('/app/')
      ? config.route
      : `/app/company/${encodedCompany}${config.route}`;
    navigate(route);

    // Reuse the same element-wait + tour-launch logic
    setTimeout(async () => {
      const stepConfigs = config.steps;
      const selectors = stepConfigs.map(s => s.selector).filter(s => s !== 'body');

      // Wait for elements — reduced timeout for snappy UX
      if (selectors.length > 0) {
        let retries = 0;
        const maxRetries = 5;
        const waitForAny = () => new Promise<void>((resolve) => {
          const check = () => {
            // Resolve as soon as at least one non-body selector exists, or timeout
            const anyFound = selectors.some(sel => document.querySelector(sel));
            if (anyFound || retries >= maxRetries) { resolve(); return; }
            retries++;
            setTimeout(check, 200);
          };
          check();
        });
        await waitForAny();
      }

      // Filter to existing elements
      const validConfigs = stepConfigs.filter(c => {
        if (c.selector === 'body') return true;
        return !!document.querySelector(c.selector);
      });

      if (validConfigs.length === 0) {
        validConfigs.push({ selector: 'body', title: 'Feature Tour', description: 'This feature is ready to explore. Click around to learn more!' });
      }

      setCurrentConfigs(validConfigs);

      const steps: StepType[] = validConfigs.map((c) => ({
        selector: c.selector,
        content: () => (
          <StepContent
            configs={validConfigs}
            onComplete={handleTourComplete}
            onSkip={handleSkipTour}
          />
        ),
      }));

      setSteps(steps);
      setCurrentStep(0);
      setIsOpen(true);
    }, 800);
  }, [navigate, getCompanyName, setSteps, setCurrentStep, setIsOpen, handleTourComplete, handleSkipTour]);

  const setOnPlatformTourComplete = useCallback((cb: ((sectionId: string, completed: boolean) => void) | null) => {
    onPlatformTourCompleteRef.current = cb;
  }, []);

  const setOnPlatformTourStart = useCallback((cb: ((sectionId: string) => void) | null) => {
    onPlatformTourStartRef.current = cb;
  }, []);

  return (
    <OnboardingTourContext.Provider value={{
      startTour,
      startPlatformTour,
      activeTourStepId,
      activeTourStageId,
      setOnPlatformTourComplete,
      setOnPlatformTourStart,
    }}>
      {children}
    </OnboardingTourContext.Provider>
  );
}

// Custom styles for Reactour
const reactourStyles = {
  popover: (base: any) => ({
    ...base,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(15, 118, 110, 0.3)',
    border: 'none',
    padding: 0,
    maxWidth: '420px',
    overflow: 'hidden',
    zIndex: 99999,
  }),
  maskArea: (base: any) => ({
    ...base,
    rx: 8,
  }),
  maskWrapper: (base: any) => ({
    ...base,
    color: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99998,
  }),
  highlightedArea: (base: any) => ({
    ...base,
    rx: 8,
    stroke: '#0f766e',
    strokeWidth: 3,
  }),
  badge: (base: any) => ({
    ...base,
    display: 'none',
  }),
  controls: (base: any) => ({
    ...base,
    display: 'none',
  }),
  close: (base: any) => ({
    ...base,
    display: 'none',
  }),
};

// Main provider component
interface OnboardingTourProviderProps {
  children: ReactNode;
}

export function OnboardingTourProvider({ children }: OnboardingTourProviderProps) {
  // Default empty steps - will be set dynamically
  const defaultSteps: StepType[] = [];

  return (
    <TourProvider
      steps={defaultSteps}
      styles={reactourStyles}
      showBadge={false}
      showCloseButton={false}
      showNavigation={false}
      showPrevNextButtons={false}
      showDots={false}
      disableInteraction={false}
      disableFocusLock={true}
      disableKeyboardNavigation={true}
      scrollSmooth
      padding={{ mask: 10, popover: [20, 16] }}
      inViewThreshold={64}
      // Prefer right/bottom positions to avoid clipping when target is on left sidebar
      position={(positionProps, prev) => {
        const { width: w, height: h, windowWidth, windowHeight, top, left, right, bottom } = positionProps as any;
        const popoverW = 420;
        const popoverH = 260;
        const gap = 16;
        // Try right of target
        if (right + gap + popoverW <= windowWidth) return [right + gap, Math.min(Math.max(top, 16), windowHeight - popoverH - 16)];
        // Try below
        if (bottom + gap + popoverH <= windowHeight) return [Math.min(Math.max(left, 16), windowWidth - popoverW - 16), bottom + gap];
        // Try above
        if (top - gap - popoverH >= 0) return [Math.min(Math.max(left, 16), windowWidth - popoverW - 16), top - gap - popoverH];
        // Fallback: center
        return [Math.max(16, (windowWidth - popoverW) / 2), Math.max(16, (windowHeight - popoverH) / 2)];
      }}
      onClickMask={() => {
        // Don't close on mask click - let user use buttons
      }}
      beforeClose={() => {
        // console.log('[Reactour] Tour closing');
      }}
      afterOpen={(target) => {
        // console.log('[Reactour] Tour opened, target:', target);
      }}
    >
      <OnboardingTourController>
        {children}
      </OnboardingTourController>
    </TourProvider>
  );
}

export { getStepRoute, tourStepConfigs };
