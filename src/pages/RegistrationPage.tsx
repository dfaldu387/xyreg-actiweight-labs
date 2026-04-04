import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRegistrationFlow, SelectedPlan } from "@/hooks/useRegistrationFlow";
import { Badge } from "@/components/ui/badge";

// Step components
import { PricingStep } from "@/components/auth/registration-steps/PricingStep";
import { PersonalDetails } from "@/components/auth/registration-steps/PersonalDetails";
import { ClientDetailsForm } from "@/components/auth/registration-steps/ClientDetailsForm";
import { Complete } from "@/components/auth/registration-steps/Complete";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for WHX event code in URL
  const whxCode = searchParams.get('code');

  const {
    state,
    getCurrentStepConfig,
    handlePlanSelection,
    navigateBack,
    updatePersonalDetails,
    updateClientDetails,
    submitStep,
    createCompany,
    isWhxCodeFlow,
  } = useRegistrationFlow({ whxCode });

  // Wrapper to handle special plan selections - redirect as needed
  const handlePlanSelect = useCallback((plan: SelectedPlan) => {
    if (plan.tier === 'investor') {
      navigate('/investor/register');
      return;
    }
    if (plan.tier === 'genesis') {
      // Redirect to xyreg.com/genesis with current search params + redirect source
      const params = new URLSearchParams(searchParams);
      params.set('redirectfrom', window.location.host || 'app.xyreg.com');
      window.location.href = `https://xyreg.com/genesis?${params.toString()}`;
      return;
    }
    handlePlanSelection(plan);
  }, [navigate, handlePlanSelection, searchParams]);

  const currentConfig = getCurrentStepConfig();

  // Full page layout for pricing step
  if (state.currentStep === 'pricing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header - overlaid on dark background */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="container mx-auto flex items-center justify-between py-3 px-6">
            <div className="flex items-center space-x-4">
              <img
                src="/asset/nav_bar-removebg-preview-logo.png"
                alt="XYREG Logo"
                className="w-[120px] object-contain cursor-pointer brightness-0 invert"
                onClick={() => navigate('/')}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Already have an account?
              </span>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>

        {/* Pricing Module - Full Width */}
        <div className="pt-16">
          <PricingStep
            onPlanSelect={handlePlanSelect}
            selectedPlan={state.selectedPlan}
          />
        </div>
      </div>
    );
  }

  // Card layout for other steps (personal details, company form, complete)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-4">
            <img
              src="/asset/nav_bar-removebg-preview-logo.png"
              alt="XYREG Logo"
              className="w-[145px] object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
            {isWhxCodeFlow && (
              <Badge className="bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30 gap-1">
                <Sparkles className="h-3 w-3" />
                Genesis 500
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?
            </span>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-slate-300 dark:border-slate-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Card */}
      <main className="container mx-auto px-6 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-lg">
          {/* Genesis Welcome Banner for WHX code users */}
          {isWhxCodeFlow && state.currentStep === 'personal-details' && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Welcome to Genesis 500
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Create Your Genesis Account
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Your access code <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-teal-600 dark:text-teal-400 font-mono">{whxCode}</code> has been verified
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 border rounded-2xl p-8 shadow-xl">
            {/* Back button and step header */}
            {currentConfig.canGoBack && (
              <div className="flex items-center space-x-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateBack}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {currentConfig.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentConfig.description}
                  </p>
                </div>
              </div>
            )}

            {/* Step content */}
            {state.currentStep === 'personal-details' && (
              <PersonalDetails
                personalDetails={state.personalDetails}
                selectedUserType={state.selectedUserType}
                isLoading={state.isLoading}
                error={state.error}
                onDetailsChange={updatePersonalDetails}
                onSubmit={(submitStep as any)}
              />
            )}

            {state.currentStep === 'client-form' && (
              <ClientDetailsForm
                clientDetails={state.clientDetails}
                isLoading={state.isLoading}
                selectedUserType={state.selectedUserType}
                onDetailsChange={updateClientDetails}
                onSubmit={(submitStep as any)}
                createCompany={(createCompany as any)}
              />
            )}

            {state.currentStep === 'complete' && (
              <Complete />
            )}

            {/* Back to Sign In */}
            {state.currentStep !== 'complete' && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
