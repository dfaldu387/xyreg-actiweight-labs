import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";

// Step components
import { TypeSelection } from "./registration-steps/TypeSelection";
import { PricingStep } from "./registration-steps/PricingStep";
import { PersonalDetails } from "./registration-steps/PersonalDetails";
import { ClientDetailsSelection } from "./registration-steps/ClientDetailsSelection";
import { EudamedSearch } from "./registration-steps/EudamedSearch";
import { ClientDetailsForm } from "./registration-steps/ClientDetailsForm";
import { Complete } from "./registration-steps/Complete";

interface EnhancedRegisterFormProps {
  userType: string;
  onClose: () => void;
}

export function EnhancedRegisterForm({ userType, onClose }: EnhancedRegisterFormProps) {
  const {
    state,
    getCurrentStepConfig,
    handleUserTypeSelection,
    handlePlanSelection,
    navigateToStep,
    navigateBack,
    updatePersonalDetails,
    updateClientDetails,
    handleOrganizationSelect,
    submitStep,
    setError,
    createCompany
  } = useRegistrationFlow();

  const currentConfig = getCurrentStepConfig();

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'type-selection':
        return <TypeSelection onUserTypeSelection={handleUserTypeSelection} />;

      case 'pricing':
        return (
          <PricingStep
            onPlanSelect={handlePlanSelection}
            selectedPlan={state.selectedPlan}
          />
        );

      case 'personal-details':
        return (
          <PersonalDetails
            personalDetails={state.personalDetails}
            selectedUserType={state.selectedUserType}
            isLoading={state.isLoading}
            error={state.error}
            onDetailsChange={updatePersonalDetails}
            onSubmit={(submitStep as any)}
          />
        );

      case 'client-details':
        return (
          <ClientDetailsSelection
            onEudamedSearch={() => navigateToStep('eudamed-search')}
            onAddNewClient={() => navigateToStep('client-form')}
          />
        );

      case 'eudamed-search':
        return <EudamedSearch onOrganizationSelect={handleOrganizationSelect} preventNavigation={true} createCompany={createCompany} />;

      case 'client-form':
        return (
          <ClientDetailsForm
            clientDetails={state.clientDetails}
            isLoading={state.isLoading}
            selectedUserType={state.selectedUserType}
            onDetailsChange={updateClientDetails}
            onSubmit={(submitStep as any)}
            createCompany={(createCompany as any)}
          />
        );

      case 'complete':
        return <Complete />;

      default:
        return null;
    }
  };


  // Use wider container for pricing step
  const containerClass = state.currentStep === 'pricing'
    ? "max-w-4xl mx-auto"
    : "max-w-md mx-auto";

  return (
    <div className={containerClass}>
      {/* Back button and step header */}
      {currentConfig.canGoBack && (
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{currentConfig.title}</h3>
            <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
          </div>
        </div>
      )}

      {/* Dynamic step content */}
      {renderStepContent()}
    </div>
  );
}