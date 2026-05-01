import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CompanyInitializationService } from '@/services/companyInitializationService';
import { seedTierASopsForCompany } from '@/services/sopAutoSeedService';
import { eagerSeedCompanyWorkInstructions } from '@/services/eagerSeedCompanyWIsClient';
import { newPricingService } from '@/services/newPricingService';
import { createLegacyProducts } from '@/services/legacyProductService';
import { EudamedDevice } from '@/hooks/useEudamedRegistry';

export type UserType = 'consultant' | 'business' | '';
export type RegistrationStep =
  | 'type-selection'
  | 'pricing'
  | 'personal-details'
  | 'client-details'
  | 'eudamed-search'
  | 'client-form'
  | 'complete';

// Selected pricing plan interface
export interface SelectedPlan {
  tier: 'genesis' | 'core' | 'enterprise' | 'investor' | null;
  powerPacks: ('build' | 'ops' | 'monitor')[];
  monthlyPrice: number;
  // Coupon override (PILOT1000 = flat €1,000/mo)
  couponCode?: string;
  // Add-on details
  isGrowthSuite?: boolean;
  extraDevices?: number;
  aiBoosterPacks?: number;
  selectedModules?: string[];
  specialistModules?: {
    predicateFinder?: boolean;
    ipPatent?: boolean;
  };
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

export interface RegistrationState {
  currentStep: RegistrationStep;
  selectedUserType: UserType;
  selectedPlan: SelectedPlan;
  personalDetails: PersonalDetails;
  clientDetails: ClientDetails;
  isLoading: boolean;
  error: string | null;
}

const initialSelectedPlan: SelectedPlan = {
  tier: null,
  powerPacks: [],
  monthlyPrice: 0,
};

export interface StepConfig {
  id: RegistrationStep;
  title: string;
  description: string;
  component: string;
  validation?: (state: RegistrationState) => string | null;
  nextStep?: (state: RegistrationState) => RegistrationStep;
  canGoBack: boolean;
  backStep?: RegistrationStep | ((state: RegistrationState) => RegistrationStep);
}

const initialPersonalDetails: PersonalDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false
};

const initialClientDetails: ClientDetails = {
  companyName: "",
  eudamedId: "",
  address: "",
  country: "",
  email: "",
  website: "",
  telephone: "",
  prrcFirstName: "",
  prrcLastName: "",
};

// Options for initializing the registration flow
export interface RegistrationFlowOptions {
  // WHX event code - if provided, skips pricing and goes directly to personal details
  whxCode?: string | null;
  // Initial step to start from (defaults to 'pricing')
  initialStep?: RegistrationStep;
  // Pre-selected plan (for WHX code flow)
  initialPlan?: SelectedPlan;
}

export function useRegistrationFlow(options?: RegistrationFlowOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this is a WHX code flow (skip pricing)
  const isWhxCodeFlow = !!options?.whxCode;

  // Fallback toast function in case useToast fails
  const fallbackToast = (options: any) => {
    try {
      if (toast) {
        toast(options);
      } else {
        alert(`${options.title}: ${options.description}`);
      }
    } catch (error) {
      console.error('Toast error:', error);
      alert(`${options.title}: ${options.description}`);
    }
  };

  // Determine initial state based on options
  const getInitialState = (): RegistrationState => {
    // If WHX code is provided, start at personal-details with Genesis plan
    if (options?.whxCode) {
      return {
        currentStep: 'personal-details',
        selectedUserType: 'business',
        selectedPlan: {
          tier: 'genesis',
          powerPacks: [],
          monthlyPrice: 0,
        },
        personalDetails: initialPersonalDetails,
        clientDetails: initialClientDetails,
        isLoading: false,
        error: null
      };
    }

    // Otherwise use provided options or defaults
    return {
      currentStep: options?.initialStep || 'pricing',
      selectedUserType: '',
      selectedPlan: options?.initialPlan || initialSelectedPlan,
      personalDetails: initialPersonalDetails,
      clientDetails: initialClientDetails,
      isLoading: false,
      error: null
    };
  };

  const [state, setState] = useState<RegistrationState>(getInitialState());
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  // Dynamic step configuration
  const stepConfigs: Record<RegistrationStep, StepConfig> = {
    'type-selection': {
      id: 'type-selection',
      title: 'Welcome to XYREG',
      description: 'Choose your registration type to get started',
      component: 'TypeSelection',
      canGoBack: false
    },
    'pricing': {
      id: 'pricing',
      title: 'Choose Your Plan',
      description: 'Select the plan that best fits your needs',
      component: 'PricingStep',
      canGoBack: false,
      nextStep: () => 'personal-details'
    },
    'client-details': {
      id: 'client-details',
      title: 'Add Your Client',
      description: 'Choose how to add your first client company',
      component: 'ClientDetailsSelection',
      canGoBack: true,
      backStep: 'personal-details', // Both go back to personal-details
      nextStep: (state) => {
        // Both consultant and business users complete registration after client details
        return 'complete';
      }
    },
    'eudamed-search': {
      id: 'eudamed-search',
      title: 'EUDAMED Organization Search',
      description: 'Search for your client company in the EUDAMED database',
      component: 'EudamedSearch',
      canGoBack: true,
      backStep: 'client-details'
    },
    'client-form': {
      id: 'client-form',
      title: 'Company Details',
      description: 'Enter your company information',
      component: 'ClientDetailsForm',
      canGoBack: true,
      backStep: 'personal-details',
      nextStep: () => 'complete'
    },
    'personal-details': {
      id: 'personal-details',
      title: 'Personal Details',
      description: 'Enter your information',
      component: 'PersonalDetails',
      validation: (state) => {
        const pw = state.personalDetails.password;
        if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
          return "Password must be at least 8 characters with uppercase, lowercase, number, and special character.";
        }
        if (state.personalDetails.password !== state.personalDetails.confirmPassword) {
          return "Passwords do not match";
        }
        if (!state.personalDetails.agreeTerms) {
          return "You must agree to the terms and conditions";
        }
        return null;
      },
      nextStep: (state) => {
        // Go to client-form (company create form) after personal-details
        return 'client-form';
      },
      // For WHX code flow, don't allow going back (they came from landing page)
      canGoBack: !isWhxCodeFlow,
      backStep: 'pricing' // Go back to pricing (only if not WHX code flow)
    },
    'complete': {
      id: 'complete',
      title: 'Registration Complete!',
      description: 'Your account has been created successfully',
      component: 'Complete',
      canGoBack: false
    }
  };

  const updateState = useCallback((updates: Partial<RegistrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const handleUserTypeSelection = useCallback((type: UserType) => {
    updateState({
      selectedUserType: type,
      currentStep: 'personal-details', // Both consultant and business go to personal-details first
      error: null
    });
  }, [updateState]);

  const handlePlanSelection = useCallback((plan: SelectedPlan) => {
    updateState({
      selectedPlan: plan,
      currentStep: 'personal-details',
      error: null
    });
  }, [updateState]);

  const updateSelectedPlan = useCallback((plan: SelectedPlan) => {
    updateState({ selectedPlan: plan });
  }, [updateState]);

  const navigateToStep = useCallback((step: RegistrationStep) => {
    updateState({ currentStep: step, error: null });
  }, [updateState]);

  const navigateBack = useCallback(() => {
    const currentConfig = stepConfigs[state.currentStep];
    if (currentConfig.canGoBack && currentConfig.backStep) {
      const backStep = typeof currentConfig.backStep === 'function'
        ? currentConfig.backStep(state)
        : currentConfig.backStep;
      updateState({ currentStep: backStep, error: null });
    }
  }, [state, updateState, stepConfigs]);

  const updatePersonalDetails = useCallback((updates: Partial<PersonalDetails>) => {
    updateState({
      personalDetails: { ...state.personalDetails, ...updates }
    });
  }, [state.personalDetails, updateState]);

  const updateClientDetails = useCallback((updates: Partial<ClientDetails>) => {
    updateState({
      clientDetails: { ...state.clientDetails, ...updates }
    });
  }, [state.clientDetails, updateState]);

  const handleOrganizationSelect = useCallback((organization: {
    name: string;
    country?: string;
    id_srn?: string;
    device_count: number;
  }) => {
    updateClientDetails({
      companyName: organization.name,
      eudamedId: organization.id_srn || '',
      country: organization.country || ''
    });

    // Navigate based on user type
    if (state.selectedUserType === 'consultant') {
      // Consultant: personal-details -> client-details (already have personal details)
      // After selecting organization, go directly to complete to trigger final submission
      updateState({ currentStep: 'complete' });
    } else {
      // Business: client-details -> personal-details
      updateState({ currentStep: 'personal-details' });
    }

    toast({
      title: "Organization Selected",
      description: `Selected ${organization.name} from EUDAMED registry`,
    });
  }, [updateClientDetails, updateState, toast, state.selectedUserType]);

  const validateCurrentStep = useCallback(() => {
    const config = stepConfigs[state.currentStep];
    if (config.validation) {
      return config.validation(state);
    }
    return null;
  }, [state, stepConfigs]);

  const submitStep = useCallback(async () => {
    const error = validateCurrentStep();
    if (error) {
      setError(error);
      return false;
    }

    const config = stepConfigs[state.currentStep];

    // Handle pricing step - move to personal details
    if (state.currentStep === 'pricing') {
      updateState({ currentStep: 'personal-details' });
      return true;
    }

    // Handle personal details step - move to client-form (company create)
    if (state.currentStep === 'personal-details') {
      if (config.nextStep) {
        const nextStep = config.nextStep(state);
        updateState({ currentStep: nextStep });
      }
      return true;
    }

    // Handle client-form step - this is the final step, submit registration
    if (state.currentStep === 'client-form') {
      const result = await handleFinalSubmit();
      return result;
    }

    if (state.currentStep === 'client-details') {
      // Legacy flow support
      const result = await handleFinalSubmit();
      return result;
    }

    if (config.nextStep) {
      const nextStep = config.nextStep(state);
      updateState({ currentStep: nextStep });
    }

    return true;
  }, [state, validateCurrentStep, setError, stepConfigs, updateState]);

  const handleFinalSubmit = useCallback(async () => {
    // Clear any previous errors
    setError(null);
    updateState({ isLoading: true, error: null });
    setIsLoadingCompany(true);
    try {
      const role = state.selectedUserType === 'consultant' ? 'consultant' : 'business';

      const { data, error } = await supabase.auth.signUp({
        email: state.personalDetails.email,
        password: state.personalDetails.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: state.personalDetails.firstName,
            last_name: state.personalDetails.lastName,
            phone: state.personalDetails.phone,
            role: role,
            // Store selected pricing plan
            selected_plan_tier: state.selectedPlan.tier,
            selected_plan_power_packs: state.selectedPlan.powerPacks,
            selected_plan_monthly_price: state.selectedPlan.monthlyPrice,
            // Company details
            client_company_name: state.clientDetails.companyName,
            client_eudamed_id: state.clientDetails.eudamedId,
            client_address: state.clientDetails.address,
            client_country: state.clientDetails.country
          }
        }
      });

      if (error) {
        console.error("Supabase auth error:", error);

        if (error.message?.includes("User already registered")) {
          const errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
          console.error("User already registered error:", errorMessage);
          setError(errorMessage);
          fallbackToast({
            title: "Registration failed",
            description: errorMessage,
            variant: "destructive",
          });
          return { status: false, message: error?.message };
        }

        throw error; // Re-throw other errors to be handled by catch block
      }

      const userId = data.user?.id;
      if (!userId) throw new Error('User ID not available after signup');

      // Store selected plan and redirect to company processing page
      if ((state.selectedUserType === 'consultant' || state.selectedUserType === 'business') && state.clientDetails.companyName) {
        sessionStorage.setItem('selected-plan', JSON.stringify(state.selectedPlan));
        navigate(`/company-processing?company=${encodeURIComponent(state.clientDetails.companyName)}&userType=${state.selectedUserType || 'business'}`);

        // Check if this is a paid plan
        const isPaidPlan = state.selectedPlan.tier && state.selectedPlan.tier !== 'genesis' && state.selectedPlan.monthlyPrice > 0;

        if (isPaidPlan) {
          // PAID PLAN: Store registration data for after payment, do NOT create company yet
          const pendingRegistration = {
            companyName: state.clientDetails.companyName,
            address: state.clientDetails.address,
            country: state.clientDetails.country,
            srn: state.clientDetails.eudamedId || null,
            email: state.clientDetails.email,
            website: state.clientDetails.website,
            telephone: state.clientDetails.telephone,
            prrcFirstName: state.clientDetails.prrcFirstName,
            prrcLastName: state.clientDetails.prrcLastName,
            userId,
            userType: state.selectedUserType || 'business',
            selectedPlan: state.selectedPlan,
          };
          sessionStorage.setItem('pending-registration', JSON.stringify(pendingRegistration));

          // Signal "success" so CompanyProcessingPage proceeds to Stripe checkout
          setTimeout(() => {
            sessionStorage.setItem('company-creation-complete', 'success');
          }, 2000);
        } else {
          // FREE PLAN: Create company immediately (existing behavior)
          setTimeout(async () => {
            try {
              const { data: existingCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('name', state.clientDetails.companyName)
                .single();

              if (existingCompany) {
                sessionStorage.setItem('company-creation-complete', 'error');
                return;
              }

              const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({
                  name: state.clientDetails.companyName,
                  address: state.clientDetails.address,
                  country: state.clientDetails.country,
                  srn: state.clientDetails.eudamedId || null
                })
                .select('id')
                .single();

              if (companyError) throw companyError;
              const companyId = newCompany.id;

              const accessLevel = state.selectedUserType === 'business' ? 'business' : 'consultant';
              const isInternal = state.selectedUserType === 'business';

              const { error: accessError } = await supabase
                .from('user_company_access')
                .insert({
                  user_id: userId,
                  company_id: companyId,
                  access_level: accessLevel,
                  affiliation_type: isInternal ? "internal" : "external",
                  is_primary: true
                });

              if (accessError) {
                console.error('Failed to create user company access:', accessError);
              }

              const initResult = await CompanyInitializationService.initializeCompany(companyId, state.clientDetails.companyName);
              if (!initResult.success) {
                console.warn('Company phase initialization failed:', initResult.message);
              }

              const planToAssign = state.selectedPlan.tier || 'genesis';
              try {
                await newPricingService.assignPlanToCompany(companyId, planToAssign, userId);
              } catch (planError) {
                console.error('[handleFinalSubmit] Error assigning plan:', planError);
              }

              sessionStorage.setItem('company-creation-complete', 'success');
            } catch (error) {
              console.error('Background company creation failed:', error);
              sessionStorage.setItem('company-creation-complete', 'error');
            }
          }, 2000);
        }
      }

      fallbackToast({
        title: "Account created successfully",
        description: "Welcome to XYREG! Setting up your company...",
      });

      // Send welcome email (non-blocking)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          email: state.personalDetails.email,
          firstName: state.personalDetails.firstName,
          lastName: state.personalDetails.lastName,
          companyName: state.clientDetails.companyName,
          planTier: state.selectedPlan.tier,
          emailType: 'welcome'
        }
      }).catch(err => console.warn('Welcome email failed:', err));

      // Send Helix OS Pilot email after welcome email (with delay)
      setTimeout(() => {
        supabase.functions.invoke('send-welcome-email', {
          body: {
            email: state.personalDetails.email,
            firstName: state.personalDetails.firstName,
            emailType: 'helix-pilot'
          }
        }).catch(err => console.warn('Helix pilot email failed:', err));
      }, 5000); // 5 second delay after welcome email

      setIsLoadingCompany(false);

      return true;

    } catch (error: any) {
      console.error("Registration error:", error);

      // Extract and format error message
      let errorMessage = "Registration failed. Please try again.";

      if (error?.message) {
        // Handle specific Supabase auth errors
        if (error.message.includes("User already registered") ||
          error.message.includes("already been registered") ||
          error.message.includes("AuthApiError: User already registered") ||
          error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("Unable to validate email address")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the confirmation link before signing in.";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many attempts. Please wait a moment before trying again.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.status === 400) {
        if (error?.message?.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
        }
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      } else if (error?.name === "NetworkError") {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.constructor?.name === "AuthApiError") {
        if (error?.message?.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
        }
      }

      // Set error in state
      setError(errorMessage);

      // Show toast notification using fallback function
      fallbackToast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      updateState({ isLoading: false });
    }
  }, [state, updateState, toast, navigate, setError]);

  const getCurrentStepConfig = useCallback(() => {
    return stepConfigs[state.currentStep];
  }, [state.currentStep, stepConfigs]);

  const createCompany = useCallback(async (companyData: {
    name: string;
    prrc_first_name?: string;
    prrc_last_name?: string;
    email?: string;
    website?: string;
    telephone?: string;
    address?: string;
    country?: string;
    srn?: string;
    devices?: EudamedDevice[];
  }) => {
    try {
      // Step 1: Create user account first (for first-time registration)
      const role = state.selectedUserType === 'consultant' ? 'consultant' : 'business';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.personalDetails.email,
        password: state.personalDetails.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: state.personalDetails.firstName,
            last_name: state.personalDetails.lastName,
            phone: state.personalDetails.phone,
            role: role,
            ...(state.selectedUserType === 'consultant' && {
              client_company_name: companyData.name,
              client_eudamed_id: companyData.srn,
              client_address: companyData.address,
              client_country: companyData.country
            })
          }
        }
      });

      if (authError) {
        console.error("[useRegistrationFlow] User signup error:", authError);

        if (authError.message?.includes("User already registered")) {
          const errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
          toast({
            title: "Registration failed",
            description: errorMessage,
            variant: "destructive"
          });
          return { success: false, error: errorMessage };
        }
        if (authError.message?.includes("Password should be at least")) {
          const errorMessage = "Password must be at least 6 characters long.";
          toast({
            title: "Registration failed",
            description: errorMessage,
            variant: "destructive"
          });
          return { success: false, error: errorMessage };
        }
      }
      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('User ID not available after signup');
      }

      // Store selected plan in sessionStorage for Stripe checkout
      sessionStorage.setItem('selected-plan', JSON.stringify(state.selectedPlan));

      // Check if this is a paid plan
      const isPaidPlan = state.selectedPlan.tier && state.selectedPlan.tier !== 'genesis' && state.selectedPlan.monthlyPrice > 0;

      if (isPaidPlan) {
        // PAID PLAN: Store registration data for after payment, do NOT create company yet
        const pendingRegistration = {
          companyName: companyData.name,
          address: companyData.address || null,
          country: companyData.country || null,
          srn: (companyData.srn || '').trim() || null,
          email: companyData.email || null,
          website: companyData.website || null,
          telephone: companyData.telephone || null,
          prrcFirstName: companyData.prrc_first_name || null,
          prrcLastName: companyData.prrc_last_name || null,
          userId,
          userType: state.selectedUserType || 'business',
          selectedPlan: state.selectedPlan,
          devices: companyData.devices || [],
        };
        sessionStorage.setItem('pending-registration', JSON.stringify(pendingRegistration));

        navigate(`/company-processing?company=${encodeURIComponent(companyData.name)}&userType=${state.selectedUserType || 'business'}`);

        // Signal "success" so CompanyProcessingPage proceeds to Stripe checkout
        setTimeout(() => {
          sessionStorage.setItem('company-creation-complete', 'success');
        }, 2000);

        toast({
          title: "Account Created",
          description: "Redirecting to payment...",
        });

        updateState({ currentStep: 'complete' });
        return { success: true, company: { name: companyData.name }, user: authData.user };
      }

      // FREE PLAN: Create company immediately (existing behavior)
      // Store EUDAMED device names for the processing page progress display
      if (companyData.devices && companyData.devices.length > 0) {
        const deviceNames = companyData.devices.map(d => d.device_name || d.udi_di || 'Unknown Device');
        sessionStorage.setItem('eudamed-device-names', JSON.stringify(deviceNames));
      } else {
        sessionStorage.removeItem('eudamed-device-names');
      }

      const srnTrim = (companyData.srn || '').trim();
      let company: any | null = null;

      // Try to reuse existing company by SRN if present
      if (srnTrim) {
        const { data: existingBySrn, error: srnLookupErr } = await supabase
          .from('companies')
          .select('id, name, contact_person, email, website, telephone, address, country')
          .eq('srn', srnTrim)
          .order('inserted_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (srnLookupErr && srnLookupErr.code && srnLookupErr.code !== 'PGRST116') {
          console.warn('[useRegistrationFlow] SRN lookup error:', srnLookupErr);
        }

        if (existingBySrn?.id) {
          const updates: Record<string, any> = {};
          const contact_person = `${(companyData.prrc_first_name || '').trim()} ${(companyData.prrc_last_name || '').trim()}`.trim();
          if (!existingBySrn.contact_person && contact_person) updates.contact_person = contact_person;
          if (!existingBySrn.email && companyData.email?.trim()) updates.email = companyData.email.trim();
          if (!existingBySrn.website && companyData.website?.trim()) updates.website = companyData.website.trim();
          if (!existingBySrn.telephone && companyData.telephone?.trim()) updates.telephone = companyData.telephone.trim();
          if (!existingBySrn.address && companyData.address?.trim()) updates.address = companyData.address.trim();
          if (!existingBySrn.country && companyData.country?.trim()) updates.country = companyData.country.trim();

          if (Object.keys(updates).length > 0) {
            const { data: updated, error: updateErr } = await supabase
              .from('companies')
              .update(updates as any)
              .eq('id', existingBySrn.id)
              .select()
              .single();
            if (!updateErr && updated) {
              company = updated;
            } else {
              company = existingBySrn;
            }
          } else {
            company = existingBySrn;
          }

          navigate(`/company-processing?company=${encodeURIComponent(company.name)}&userType=${state.selectedUserType || 'business'}`);
        }
      }

      // Create the company if not found by SRN
      if (!company) {
        navigate(`/company-processing?company=${encodeURIComponent(companyData.name)}&userType=${state.selectedUserType || 'business'}`);
        const companyInsertData = {
          name: companyData.name,
          contact_person: `${(companyData.prrc_first_name || '')} ${(companyData.prrc_last_name || '')}` || null,
          email: companyData.email || null,
          website: companyData.website || null,
          telephone: companyData.telephone || null,
          address: companyData.address || null,
          country: companyData.country || null,
          srn: srnTrim || null
        };

        const { data: created, error: companyError } = await supabase
          .from("companies")
          .insert(companyInsertData)
          .select('id')
          .single();

        if (companyError) {
          console.error('[useRegistrationFlow] Failed to create company:', companyError);
          throw companyError;
        }

        if (!created) {
          throw new Error('Company creation returned no data');
        }

        company = created;
      }

      // Create user-company access relationship
      const accessLevel = (state.selectedUserType === 'business' ? 'admin' : 'consultant') as 'admin' | 'editor' | 'viewer' | 'consultant' | 'business';
      const isInternal = state.selectedUserType === 'business';

      const { error: accessError } = await supabase
        .from('user_company_access')
        .insert({
          user_id: userId,
          company_id: company.id,
          access_level: accessLevel,
          affiliation_type: isInternal ? "internal" : "external" as "internal" | "external",
          is_primary: true
        });

      if (accessError) {
        console.error('[useRegistrationFlow] Failed to create user company access:', accessError);
      }

      // Initialize the company
      const initResult = await CompanyInitializationService.initializeCompany(
        company.id,
        company.name
      );

      if (!initResult.success) {
        console.error('[useRegistrationFlow] Phase initialization failed:', initResult.error);
      }

      // Auto-seed Tier A SOPs (universal QMS boilerplate, idempotent).
      // Runs after company initialization so company_phases exist.
      try {
        const sopResult = await seedTierASopsForCompany(company.id, company.name);
        console.log(
          `[useRegistrationFlow] Tier A SOPs — inserted: ${sopResult.inserted}, skipped: ${sopResult.skipped}, failed: ${sopResult.failed}`,
        );
        if (sopResult.errors.length > 0) {
          console.warn('[useRegistrationFlow] SOP seed errors:', sopResult.errors);
        }
      } catch (sopError) {
        console.error('[useRegistrationFlow] Tier A SOP auto-seed failed:', sopError);
      }

      // Eager-seed all global Work Instructions for this company so they
      // appear in the document list immediately (alongside their SOPs)
      // rather than being created lazily on first drawer click.
      try {
        const wiResult = await eagerSeedCompanyWorkInstructions({ companyId: company.id });
        console.log(
          `[useRegistrationFlow] Global WIs — created: ${wiResult.created}, skipped: ${wiResult.skipped}, failed: ${wiResult.failed}`,
        );
      } catch (wiError) {
        console.error('[useRegistrationFlow] Eager WI seed failed:', wiError);
      }

      // Belt-and-braces: also top-up Tier-B Pathway SOPs (and re-run any
      // missed pieces) via the unified self-heal. Customer never sees a
      // "Generate" or "Create" button — every template they need is
      // already there when they land on the Documents page.
      try {
        const { ensureCompanySeedingComplete } = await import('@/services/ensureCompanySeedingService');
        const ensureResult = await ensureCompanySeedingComplete(company.id, company.name);
        console.log(
          `[useRegistrationFlow] Self-heal — A:${ensureResult.tierAInserted} B:${ensureResult.tierBInserted} WI:${ensureResult.wiCreated}`,
        );
      } catch (ensureErr) {
        console.error('[useRegistrationFlow] Self-heal seeding failed:', ensureErr);
      }

      // Assign pricing plan (Genesis for free plan)
      const planToAssign = state.selectedPlan.tier || 'genesis';
      try {
        await newPricingService.assignPlanToCompany(company.id, planToAssign, userId);
      } catch (planError) {
        console.error('[useRegistrationFlow] Error assigning plan:', planError);
      }

      // Import selected EUDAMED devices into products table
      if (companyData.devices && companyData.devices.length > 0) {
        try {
          const importResult = await createLegacyProducts({
            companyId: company.id,
            devices: companyData.devices,
            onProgress: (progress) => {
              // Update sessionStorage so CompanyProcessingPage can read progress
              sessionStorage.setItem('eudamed-import-progress', JSON.stringify({
                processed: progress.processed,
                total: progress.total,
                currentDevice: progress.currentDevice,
                errors: progress.errors,
              }));
            },
          });
          if (importResult.errors.length > 0) {
            console.warn('[useRegistrationFlow] Device import errors:', importResult.errors);
          }
        } catch (importError) {
          console.error('[useRegistrationFlow] Error importing EUDAMED devices:', importError);
        }
      }

      sessionStorage.setItem('company-creation-complete', 'success');

      // Send welcome email (non-blocking)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          email: state.personalDetails.email,
          firstName: state.personalDetails.firstName,
          lastName: state.personalDetails.lastName,
          companyName: companyData.name,
          planTier: state.selectedPlan.tier,
          emailType: 'welcome'
        }
      }).catch(err => console.warn('Welcome email failed:', err));

      setTimeout(() => {
        supabase.functions.invoke('send-welcome-email', {
          body: {
            email: state.personalDetails.email,
            firstName: state.personalDetails.firstName,
            emailType: 'helix-pilot'
          }
        }).catch(err => console.warn('Helix pilot email failed:', err));
      }, 5000);

      toast({
        title: "Account & Company Created Successfully",
        description: `Welcome to XYREG! Company "${company.name}" is ready.`,
      });

      updateState({ currentStep: 'complete' });

      return { success: true, company, user: authData.user };

    } catch (error) {
      console.error("[useRegistrationFlow] Error creating company with user:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use the 'Sign In' button to access your existing account.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, state.selectedUserType, state.personalDetails, updateState]);

  return {
    state,
    stepConfigs,
    getCurrentStepConfig,
    handleUserTypeSelection,
    handlePlanSelection,
    updateSelectedPlan,
    navigateToStep,
    navigateBack,
    updatePersonalDetails,
    updateClientDetails,
    handleOrganizationSelect,
    submitStep,
    setError,
    isLoadingCompany,
    fallbackToast,
    createCompany,
    isWhxCodeFlow, // True if user came from WHX landing page with a code
  };
}