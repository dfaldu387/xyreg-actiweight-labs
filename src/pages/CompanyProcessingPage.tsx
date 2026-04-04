import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Building2, FileText, Sparkles, Shield, Users, CreditCard, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';
import { StripeService, STRIPE_PRICES } from '@/services/stripeService';
import { newPricingService } from '@/services/newPricingService';
import type { SelectedPlan } from '@/hooks/useRegistrationFlow';

export default function CompanyProcessingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshCompanyRoles } = useCompanyRole();

  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<string[]>([]);
  const [currentDocument, setCurrentDocument] = useState('');
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [eudamedImportProgress, setEudamedImportProgress] = useState<{
    processed: number;
    total: number;
    currentDevice: string;
  } | null>(null);

  const companyName = searchParams.get('company') || 'Your Company';
  const userType = searchParams.get('userType') || 'business';

  // Get EUDAMED device names from session storage (set by registration flow)
  const eudamedDeviceNames = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('eudamed-device-names');
      if (raw) return JSON.parse(raw) as string[];
    } catch {}
    return [] as string[];
  }, []);

  // Get selected plan from session storage
  const getSelectedPlan = () => {
    try {
      const planStr = sessionStorage.getItem('selected-plan');
      if (planStr) {
        return JSON.parse(planStr);
      }
    } catch (e) {
      console.error('Error parsing selected plan:', e);
    }
    return null;
  };

  // Redirect to Stripe checkout for paid plans (with full add-on support)
  const redirectToStripeCheckout = async (plan: SelectedPlan) => {
    try {
      setIsRedirectingToCheckout(true);

      if (!plan.tier || plan.tier === 'genesis' || plan.tier === 'enterprise') {
        // Genesis is free, Enterprise uses custom pricing / contact sales
        return false;
      }

      // Get the user's company ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue.');
        return false;
      }

      // Company ID will be assigned after checkout via URL params
      const companyId: string | null = null;

      // Store company info for after checkout
      sessionStorage.setItem('checkout-company', companyName);
      sessionStorage.setItem('checkout-userType', userType);

      // Coupon override — PILOT1000 sends a single flat €1,000 line item
      if (plan.couponCode === 'PILOT1000') {
        await StripeService.handlePlanPurchase({
          planId: 'core',
          name: 'Helix OS (PILOT1000)',
          price: `€1000`,
        }, companyId);
      } else {
        // Use StripeService with full add-on support
        await StripeService.handlePlanPurchase({
          planId: plan.tier,
          name: plan.tier === 'core' ? 'Helix OS' : plan.tier,
          price: `€${plan.monthlyPrice}`,
          stripePriceId: STRIPE_PRICES.CORE_BASE,
          tier: plan.tier,
          // Add-on data
          extraDevices: plan.extraDevices || 0,
          aiBoosterPacks: plan.aiBoosterPacks || 0,
          selectedPacks: plan.powerPacks || [],
          isGrowthSuite: plan.isGrowthSuite || false,
          selectedModules: plan.selectedModules || [],
          specialistModules: plan.specialistModules || {},
        }, companyId);
      }

      return true;
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      toast.error('Failed to start checkout. Please try again from your dashboard.');
      return false;
    } finally {
      setIsRedirectingToCheckout(false);
    }
  };

  const hasEudamedDevices = eudamedDeviceNames.length > 0;

  const phases = useMemo(() => {
    const basePhases: Array<{ text: string; icon: any; color: string; action: string }> = [
      { text: 'Creating company profile', icon: Building2, color: 'text-blue-500', action: 'company' },
      { text: 'Initializing standard phases', icon: Sparkles, color: 'text-purple-500', action: 'phases' },
      { text: 'Setting up document templates', icon: FileText, color: 'text-amber-500', action: 'documents' },
      { text: 'Configuring security settings', icon: Shield, color: 'text-green-500', action: 'security' },
      { text: 'Preparing team environment', icon: Users, color: 'text-indigo-500', action: 'finalize' },
    ];

    if (hasEudamedDevices) {
      // Single EUDAMED import step before "finalize"
      basePhases.splice(basePhases.length - 1, 0, {
        text: `Importing ${eudamedDeviceNames.length} EUDAMED device${eudamedDeviceNames.length > 1 ? 's' : ''}`,
        icon: Package,
        color: 'text-cyan-500',
        action: 'eudamed-import',
      });
    }

    return basePhases;
  }, [hasEudamedDevices, eudamedDeviceNames]);

  useEffect(() => {
    // Listen for real company creation progress
    const checkCreationStatus = async () => {
      // Poll EUDAMED import progress from session storage
      if (hasEudamedDevices) {
        try {
          const progressRaw = sessionStorage.getItem('eudamed-import-progress');
          if (progressRaw) {
            const progress = JSON.parse(progressRaw);
            setEudamedImportProgress({
              processed: progress.processed,
              total: progress.total,
              currentDevice: progress.currentDevice,
            });
          }
        } catch {}
      }

      const status = sessionStorage.getItem('company-creation-complete');
      if (status === 'success') {
        sessionStorage.removeItem('company-creation-complete');
        sessionStorage.removeItem('eudamed-device-names');
        sessionStorage.removeItem('eudamed-import-progress');

        // Complete all phases and show success
        const allPhaseIndices = phases.map((_, i) => i);
        setCurrentPhase(phases.length - 1);
        setCompletedPhases(allPhaseIndices);
        setShowSuccess(true);

        // Check if user selected a paid plan
        const selectedPlan = getSelectedPlan();
        const isPaidPlan = selectedPlan &&
          selectedPlan.tier !== 'genesis' &&
          selectedPlan.monthlyPrice > 0;

        // Navigate after success animation
        setTimeout(async () => {
          try {
            await refreshCompanyRoles();
          } catch (error) {
            console.error('[Company-redirect-issue] refreshCompanyRoles failed:', error);
          }

          // Add delay to ensure refresh completes
          await new Promise(resolve => setTimeout(resolve, 500));

          // Assign Genesis plan if user selected free tier (or no plan selected)
          const isGenesisOrFreePlan = !selectedPlan || selectedPlan.tier === 'genesis' || selectedPlan.monthlyPrice === 0;
          if (isGenesisOrFreePlan) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Get company ID from user_company_access
                const { data: userCompanyAccess } = await supabase
                  .from('user_company_access')
                  .select('company_id')
                  .eq('user_id', user.id)
                  .eq('is_primary', true)
                  .single();

                if (userCompanyAccess?.company_id) {
                  await newPricingService.assignPlanToCompany(
                    userCompanyAccess.company_id,
                    'genesis',
                    user.id
                  );
                  console.log('[CompanyProcessingPage] Genesis plan assigned to company:', userCompanyAccess.company_id);
                }
              }
            } catch (planError) {
              console.error('[CompanyProcessingPage] Error assigning Genesis plan:', planError);
              // Don't block navigation on plan assignment failure
            }
          }

          // If paid plan, redirect to Stripe checkout
          if (isPaidPlan && selectedPlan) {
            const redirected = await redirectToStripeCheckout(selectedPlan);
            if (redirected) {
              return; // Don't navigate to dashboard if redirecting to Stripe
            }
          }

          // Clear selected plan from session
          sessionStorage.removeItem('selected-plan');

          // Check if this is a Genesis user (WHX event)
          const isGenesisPlan = selectedPlan?.tier === 'genesis';

          if (userType === 'business' && companyName) {
            const companyPath = isGenesisPlan
              ? `/app/company/${encodeURIComponent(companyName)}/genesis`
              : `/app/company/${encodeURIComponent(companyName)}`;
            navigate(companyPath, { replace: true });
            navigate(0);
          } else {
            navigate('/app/clients', { replace: true });
            navigate(0);
          }
        }, 2000); // Reduced from 3000 to 2000 for better UX
      } else if (status === 'error') {
        sessionStorage.removeItem('company-creation-complete');
        navigate('/register', { replace: true });
      }
    };

    // Monitor company creation through real-time subscription
    // Note: Removed company_phases and company_document_templates subscriptions
    // as they had no company filter and triggered for ALL companies globally,
    // causing continuous API calls. The phaseTimer below provides visual feedback.
    const subscription = supabase
      .channel('company-creation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'companies',
        filter: `name=eq.${companyName}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCurrentPhase(1);
          setCompletedPhases([0]);
        }
      })
      .subscribe();

    // Simulate processing phases with document tracking
    // Use faster interval for EUDAMED device steps (they're real progress, not simulated)
    const phaseTimer = setInterval(() => {
      setCurrentPhase(prev => {
        if (prev < phases.length - 1) {
          setCompletedPhases(current =>
            current.includes(prev) ? current : [...current, prev]
          );

          // Simulate document processing for document phase
          if (prev === 1) { // phases creation
            const samplePhases = [
              '(1) Concept & Feasibility',
              '(2) Design Planning',
              '(3) Design Input',
              '(4) Design Output',
              '(5) Verification'
            ];
            samplePhases.forEach((phase, index) => {
              setTimeout(() => {
                setCurrentDocument(`Creating phase: ${phase}`);
              }, index * 500);
            });
          }

          if (prev === 2) { // document templates
            const sampleDocs = [
              'Business Case / Project Charter',
              'Design & Development Plan',
              'User Needs Specification (UNS)',
              'Risk Management Plan',
              'Clinical Evaluation Plan'
            ];
            sampleDocs.forEach((doc, index) => {
              setTimeout(() => {
                setCurrentDocument(`Processing: ${doc}`);
                setProcessingDocuments(current => [...current, doc]);
              }, index * 400);
            });
          }

          return prev + 1;
        } else {
          checkCreationStatus();
          return prev;
        }
      });
    }, hasEudamedDevices ? 2000 : 3000);


    checkCreationStatus();
    const statusCheck = setInterval(checkCreationStatus, 1000);

    return () => {
      clearInterval(phaseTimer);
      clearInterval(statusCheck);
      subscription.unsubscribe();
    };
  }, [companyName, navigate]);

  const AnimatedDots = () => (
    <div className="flex space-x-1 ml-2 inline-flex">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );

  // Check if we need to redirect to checkout
  const selectedPlan = getSelectedPlan();
  const isPaidPlan = selectedPlan && selectedPlan.tier !== 'genesis' && selectedPlan.monthlyPrice > 0;

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  {isRedirectingToCheckout ? (
                    <CreditCard className="w-12 h-12 text-primary-foreground" />
                  ) : (
                    <CheckCircle className="w-12 h-12 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  {isRedirectingToCheckout ? 'Redirecting to Payment...' : 'Company Setup Complete!'}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {isRedirectingToCheckout ? (
                    <>Opening secure checkout for your <span className="font-semibold text-foreground">{selectedPlan?.tier?.toUpperCase()}</span> plan</>
                  ) : (
                    <>Welcome to your new workspace for <span className="font-semibold text-foreground">{companyName}</span></>
                  )}
                </p>
              </div>

              <div className="pt-4">
                <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                  {isRedirectingToCheckout ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium text-foreground">Please wait...</span>
                    </>
                  ) : isPaidPlan ? (
                    <>
                      {/* <CreditCard className="w-4 h-4 text-primary" /> */}
                      {/* <span className="text-sm font-medium text-foreground">Starting checkout with 30-day free trial...</span> */}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Ready to go!</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <Card className="w-full max-w-2xl mx-4 relative z-10">
        <CardContent className="p-10">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Main Company Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">
                Setting Up Your Company
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                We're processing your company information and preparing your personalized workspace
              </p>
            </div>

            {/* Company Name Display */}
            <div className="bg-muted rounded-xl p-6 border relative overflow-hidden">
              <p className="text-sm text-muted-foreground mb-2">Setting up workspace for</p>
              <p className="text-2xl font-bold text-foreground">
                {companyName}
              </p>
            </div>

            {/* Processing Phases */}
            <div className="w-full space-y-4">
              {phases.map((phase, index) => {
                const Icon = phase.icon;
                const isCompleted = completedPhases.includes(index);
                const isCurrent = currentPhase === index;

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 border ${isCompleted
                      ? 'bg-primary/5 border-primary/20'
                      : isCurrent
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/50 border-border opacity-60'
                      }`}
                  >
                    <div className="relative">
                      {isCompleted ? (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary-foreground" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <p className={`font-medium flex items-center ${isCompleted
                        ? 'text-primary'
                        : isCurrent
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                        }`}>
                        {phase.text}
                        {isCurrent && <AnimatedDots />}
                      </p>
                      {isCurrent && (
                        <div className="space-y-1">
                          <p className="text-xs text-primary">In progress...</p>
                          {/* Show per-device progress for EUDAMED import step */}
                          {phase.action === 'eudamed-import' && eudamedImportProgress && (
                            <>
                              <p className="text-xs text-muted-foreground italic truncate max-w-[300px]">
                                {eudamedImportProgress.currentDevice} ({eudamedImportProgress.processed}/{eudamedImportProgress.total})
                              </p>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                <div
                                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.round((eudamedImportProgress.processed / eudamedImportProgress.total) * 100)}%` }}
                                />
                              </div>
                            </>
                          )}
                          {phase.action === 'eudamed-import' && !eudamedImportProgress && eudamedDeviceNames.length > 0 && (
                            <p className="text-xs text-muted-foreground italic truncate max-w-[300px]">
                              Preparing {eudamedDeviceNames[0]}...
                            </p>
                          )}
                          {/* Show current document being processed */}
                          {currentDocument && (phase.action === 'phases' || phase.action === 'documents') && (
                            <p className="text-xs text-muted-foreground italic">
                              {currentDocument}
                            </p>
                          )}
                          {/* Show document count for document processing phase */}
                          {phase.action === 'documents' && processingDocuments.length > 0 && (
                            <p className="text-xs text-primary">
                              {processingDocuments.length} templates processed
                            </p>
                          )}
                        </div>
                      )}
                      {/* Show device count under completed EUDAMED step */}
                      {isCompleted && phase.action === 'eudamed-import' && (
                        <p className="text-xs text-muted-foreground">
                          {eudamedDeviceNames.length} device{eudamedDeviceNames.length > 1 ? 's' : ''} imported
                        </p>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="text-primary">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(((completedPhases.length) / phases.length) * 100, 100)}%` }}
              />
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare everything for you...
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.min(Math.round((completedPhases.length / phases.length) * 100), 100)}% Complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}