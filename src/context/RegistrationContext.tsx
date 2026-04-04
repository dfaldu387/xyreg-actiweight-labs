import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Pricing tier types
export type PricingTier = 'genesis' | 'core' | 'enterprise' | null;
export type PowerPackId = 'build' | 'ops' | 'monitor';

export interface SelectedPlan {
  tier: PricingTier;
  powerPacks: PowerPackId[];
  monthlyPrice: number;
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface ClientDetails {
  companyName: string;
  eudamedId: string;
  address: string;
  country: string;
  email: string;
  website: string;
  telephone: string;
  prrcFirstName: string;
  prrcLastName: string;
}

interface RegistrationContextType {
  // Selected plan
  selectedPlan: SelectedPlan;
  setSelectedPlan: (plan: SelectedPlan) => void;

  // Personal details
  personalDetails: PersonalDetails;
  setPersonalDetails: (details: Partial<PersonalDetails>) => void;

  // Client/company details
  clientDetails: ClientDetails;
  setClientDetails: (details: Partial<ClientDetails>) => void;

  // User type (consultant or business)
  userType: 'consultant' | 'business' | '';
  setUserType: (type: 'consultant' | 'business' | '') => void;

  // Reset all state
  resetRegistration: () => void;
}

const initialPersonalDetails: PersonalDetails = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
};

const initialClientDetails: ClientDetails = {
  companyName: '',
  eudamedId: '',
  address: '',
  country: '',
  email: '',
  website: '',
  telephone: '',
  prrcFirstName: '',
  prrcLastName: '',
};

const initialSelectedPlan: SelectedPlan = {
  tier: null,
  powerPacks: [],
  monthlyPrice: 0,
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [selectedPlan, setSelectedPlanState] = useState<SelectedPlan>(initialSelectedPlan);
  const [personalDetails, setPersonalDetailsState] = useState<PersonalDetails>(initialPersonalDetails);
  const [clientDetails, setClientDetailsState] = useState<ClientDetails>(initialClientDetails);
  const [userType, setUserType] = useState<'consultant' | 'business' | ''>('');

  const setSelectedPlan = useCallback((plan: SelectedPlan) => {
    setSelectedPlanState(plan);
  }, []);

  const setPersonalDetails = useCallback((details: Partial<PersonalDetails>) => {
    setPersonalDetailsState(prev => ({ ...prev, ...details }));
  }, []);

  const setClientDetails = useCallback((details: Partial<ClientDetails>) => {
    setClientDetailsState(prev => ({ ...prev, ...details }));
  }, []);

  const resetRegistration = useCallback(() => {
    setSelectedPlanState(initialSelectedPlan);
    setPersonalDetailsState(initialPersonalDetails);
    setClientDetailsState(initialClientDetails);
    setUserType('');
  }, []);

  return (
    <RegistrationContext.Provider
      value={{
        selectedPlan,
        setSelectedPlan,
        personalDetails,
        setPersonalDetails,
        clientDetails,
        setClientDetails,
        userType,
        setUserType,
        resetRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistrationContext() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistrationContext must be used within a RegistrationProvider');
  }
  return context;
}
