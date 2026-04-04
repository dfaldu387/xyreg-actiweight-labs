
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface OnboardingStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiredRoles: string[];
  steps: OnboardingStep[];
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingState {
  hasCompletedTour: boolean;
  hasSeenContextualHelp: boolean;
  lastLoginDate: string | null;
  currentStage: string | null;
  stages: OnboardingStage[];
  userRole: string | null;
  completionPercentage: number;
  showProgressTracker: boolean;
}

const ONBOARDING_STORAGE_KEY = 'xyreg-onboarding-state';

// Define onboarding stages based on user roles
const getOnboardingStages = (userRole: string): OnboardingStage[] => {
  const baseStages: OnboardingStage[] = [
    {
      id: 'welcome',
      name: 'Welcome & Setup',
      description: 'Get familiar with XYREG platform basics',
      completed: false,
      requiredRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
      steps: [
        {
          id: 'profile-setup',
          title: 'Complete Your Profile',
          description: 'Add your professional information and preferences',
          completed: false,
          skipped: false
        },
        {
          id: 'navigation-basics',
          title: 'Platform Navigation',
          description: 'Learn how to navigate the XYREG interface',
          completed: false,
          skipped: false
        },
        {
          id: 'help-system',
          title: 'Help & Support',
          description: 'Discover how to get help when you need it',
          completed: false,
          skipped: false
        }
      ]
    }
  ];

  // Add role-specific stages
  if (['admin', 'company_admin'].includes(userRole)) {
    baseStages.push({
      id: 'company-setup',
      name: 'Company Configuration',
      description: 'Set up your company for regulatory management',
      completed: false,
      requiredRoles: ['admin', 'company_admin'],
      steps: [
        {
          id: 'company-profile',
          title: 'Company Information',
          description: 'Enter your company details and regulatory information',
          completed: false,
          skipped: false
        },
        {
          id: 'phases-setup',
          title: 'Lifecycle Phases',
          description: 'Configure development phases for your products',
          completed: false,
          skipped: false
        },
        {
          id: 'templates-setup',
          title: 'Document Templates',
          description: 'Set up document templates for efficiency',
          completed: false,
          skipped: false
        },
        {
          id: 'compliance-frameworks',
          title: 'Compliance Frameworks',
          description: 'Configure regulatory frameworks (EU MDR, FDA, etc.)',
          completed: false,
          skipped: false
        }
      ]
    });
  }

  if (['admin', 'company_admin', 'consultant', 'editor'].includes(userRole)) {
    baseStages.push({
      id: 'product-management',
      name: 'Product Management',
      description: 'Learn to create and manage medical device products',
      completed: false,
      requiredRoles: ['admin', 'company_admin', 'consultant', 'editor'],
      steps: [
        {
          id: 'first-product',
          title: 'Create Your First Product',
          description: 'Set up a product for regulatory management',
          completed: false,
          skipped: false
        },
        {
          id: 'product-classification',
          title: 'Device Classification',
          description: 'Use classification wizards to determine regulatory path',
          completed: false,
          skipped: false
        },
        {
          id: 'milestones-intro',
          title: 'Milestone Management',
          description: 'Understand how milestones track your progress',
          completed: false,
          skipped: false
        }
      ]
    });

    baseStages.push({
      id: 'document-management',
      name: 'Document Control',
      description: 'Master document management and templates',
      completed: false,
      requiredRoles: ['admin', 'company_admin', 'consultant', 'editor'],
      steps: [
        {
          id: 'first-document',
          title: 'Upload First Document',
          description: 'Learn the document upload and management process',
          completed: false,
          skipped: false
        },
        {
          id: 'template-usage',
          title: 'Using Templates',
          description: 'Generate documents from templates efficiently',
          completed: false,
          skipped: false
        },
        {
          id: 'version-control',
          title: 'Version Control',
          description: 'Understand document versioning and approval workflows',
          completed: false,
          skipped: false
        }
      ]
    });
  }

  // Add advanced features stage for power users
  if (['admin', 'company_admin', 'consultant'].includes(userRole)) {
    baseStages.push({
      id: 'advanced-features',
      name: 'Advanced Features',
      description: 'Discover powerful features for regulatory experts',
      completed: false,
      requiredRoles: ['admin', 'company_admin', 'consultant'],
      steps: [
        {
          id: 'gap-analysis',
          title: 'Gap Analysis',
          description: 'Run compliance assessments and gap analysis',
          completed: false,
          skipped: false
        },
        {
          id: 'audit-management',
          title: 'Audit Management',
          description: 'Prepare for and manage regulatory audits',
          completed: false,
          skipped: false
        },
        {
          id: 'business-analysis',
          title: 'Business Analysis',
          description: 'Use NPV and business analysis tools',
          completed: false,
          skipped: false
        },
        {
          id: 'qmsr-transition',
          title: 'FDA QMSR Transition',
          description: 'Understand the QSR to QMSR transition (effective Feb 2, 2026)',
          completed: false,
          skipped: false
        }
      ]
    });
  }

  return baseStages.filter(stage => 
    stage.requiredRoles.includes(userRole)
  );
};

export function useOnboarding() {
  const { user, userRole } = useAuth();
  
  // Check if user is super admin and skip onboarding
  const isSuperAdmin = user?.user_metadata?.role === 'super_admin';
  
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      try {
        const parsedState = JSON.parse(stored);
        // Migrate old state format or update stages if role changed
        if (!parsedState.stages || parsedState.userRole !== userRole) {
          const newStages = getOnboardingStages(userRole || 'viewer');
          return {
            ...parsedState,
            stages: newStages,
            userRole: userRole,
            currentStage: newStages[0]?.id || null,
            completionPercentage: 0,
            showProgressTracker: parsedState.showProgressTracker || true
          };
        }
        return parsedState;
      } catch {
        const stages = getOnboardingStages(userRole || 'viewer');
        return {
          hasCompletedTour: false,
          hasSeenContextualHelp: false,
          lastLoginDate: null,
          currentStage: stages[0]?.id || null,
          stages,
          userRole: userRole,
          completionPercentage: 0,
          showProgressTracker: true
        };
      }
    }
    const stages = getOnboardingStages(userRole || 'viewer');
    return {
      hasCompletedTour: false,
      hasSeenContextualHelp: false,
      lastLoginDate: null,
      currentStage: stages[0]?.id || null,
      stages,
      userRole: userRole,
      completionPercentage: 0,
      showProgressTracker: true
    };
  });

  const [showTour, setShowTour] = useState(false);
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(onboardingState.showProgressTracker);

  // Calculate completion percentage
  const calculateCompletionPercentage = (stages: OnboardingStage[]): number => {
    const totalSteps = stages.reduce((total, stage) => total + stage.steps.length, 0);
    if (totalSteps === 0) return 100;
    
    const completedSteps = stages.reduce((total, stage) => 
      total + stage.steps.filter(step => step.completed).length, 0
    );
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  useEffect(() => {
    // Skip all onboarding for super admin users
    if (isSuperAdmin) {
      
      setShowTour(false);
      setShowContextualHelp(false);
      setShowOnboardingWizard(false);
      return;
    }
    
    // Check if user should see onboarding
    const today = new Date().toISOString().split('T')[0];
    
    if (!onboardingState.hasCompletedTour) {
      // Show wizard for first-time users or incomplete onboarding
      if (onboardingState.completionPercentage < 100) {
        setShowOnboardingWizard(true);
      } else {
        setShowTour(true);
      }
    } else if (onboardingState.lastLoginDate !== today) {
      // Show contextual help for returning users (once per day)
      setShowContextualHelp(true);
    }

    // Update last login date
    updateOnboardingState({ lastLoginDate: today });
  }, [isSuperAdmin]);

  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    const newState = { ...onboardingState, ...updates };
    if (updates.stages) {
      newState.completionPercentage = calculateCompletionPercentage(updates.stages);
    }
    setOnboardingState(newState);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
  };

  const completeStep = (stageId: string, stepId: string) => {
    const updatedStages = onboardingState.stages.map(stage => {
      if (stage.id === stageId) {
        const updatedSteps = stage.steps.map(step => 
          step.id === stepId ? { ...step, completed: true } : step
        );
        const allStepsCompleted = updatedSteps.every(step => step.completed || step.skipped);
        return {
          ...stage,
          steps: updatedSteps,
          completed: allStepsCompleted
        };
      }
      return stage;
    });
    
    updateOnboardingState({ stages: updatedStages });
    
    // Track analytics
    console.log(`[Onboarding] Completed step: ${stageId}.${stepId}`);
  };

  const skipStep = (stageId: string, stepId: string) => {
    const updatedStages = onboardingState.stages.map(stage => {
      if (stage.id === stageId) {
        const updatedSteps = stage.steps.map(step => 
          step.id === stepId ? { ...step, skipped: true } : step
        );
        return { ...stage, steps: updatedSteps };
      }
      return stage;
    });
    
    updateOnboardingState({ stages: updatedStages });
  };

  const completeStage = (stageId: string) => {
    const updatedStages = onboardingState.stages.map(stage => 
      stage.id === stageId ? { ...stage, completed: true } : stage
    );
    
    // Move to next stage
    const currentStageIndex = onboardingState.stages.findIndex(s => s.id === stageId);
    const nextStage = onboardingState.stages[currentStageIndex + 1];
    
    updateOnboardingState({ 
      stages: updatedStages,
      currentStage: nextStage?.id || null
    });
  };

  const completeTour = () => {
    setShowTour(false);
    updateOnboardingState({ hasCompletedTour: true });
  };

  const skipTour = () => {
    setShowTour(false);
    updateOnboardingState({ hasCompletedTour: true });
  };

  const dismissContextualHelp = () => {
    setShowContextualHelp(false);
    updateOnboardingState({ hasSeenContextualHelp: true });
  };

  const resetOnboarding = () => {
    const stages = getOnboardingStages(userRole || 'viewer');
    const resetState: OnboardingState = {
      hasCompletedTour: false,
      hasSeenContextualHelp: false,
      lastLoginDate: null,
      currentStage: stages[0]?.id || null,
      stages,
      userRole: userRole,
      completionPercentage: 0,
      showProgressTracker: true
    };
    setOnboardingState(resetState);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(resetState));
    setShowOnboardingWizard(true);
  };

  const completeOnboarding = () => {
    setShowOnboardingWizard(false);
    updateOnboardingState({ hasCompletedTour: true });
  };

  const hideProgressTracker = () => {
    updateOnboardingState({ showProgressTracker: false });
    setShowProgressTracker(false);
  };

  const getCurrentStage = () => {
    return onboardingState.stages.find(stage => stage.id === onboardingState.currentStage);
  };

  const getNextIncompleteStep = () => {
    const currentStage = getCurrentStage();
    if (!currentStage) return null;
    
    return currentStage.steps.find(step => !step.completed && !step.skipped);
  };

  // For super admin users, return disabled onboarding state
  if (isSuperAdmin) {
    return {
      // Legacy API
      showTour: false,
      showContextualHelp: false,
      completeTour: () => {},
      skipTour: () => {},
      dismissContextualHelp: () => {},
      resetOnboarding: () => {},
      onboardingState: {
        hasCompletedTour: true,
        hasSeenContextualHelp: true,
        lastLoginDate: new Date().toISOString().split('T')[0]
      },
      
      // Enhanced API
      showOnboardingWizard: false,
      showProgressTracker: false,
      currentStage: null,
      stages: [],
      completionPercentage: 100,
      completeStep: () => {},
      skipStep: () => {},
      completeStage: () => {},
      completeOnboarding: () => {},
      hideProgressTracker: () => {},
      getCurrentStage: () => null,
      getNextIncompleteStep: () => null
    };
  }

  return {
    // Legacy API
    showTour,
    showContextualHelp,
    completeTour,
    skipTour,
    dismissContextualHelp,
    resetOnboarding,
    onboardingState: {
      hasCompletedTour: onboardingState.hasCompletedTour,
      hasSeenContextualHelp: onboardingState.hasSeenContextualHelp,
      lastLoginDate: onboardingState.lastLoginDate
    },
    
    // Enhanced API
    showOnboardingWizard,
    showProgressTracker,
    currentStage: onboardingState.currentStage,
    stages: onboardingState.stages,
    completionPercentage: onboardingState.completionPercentage,
    completeStep,
    skipStep,
    completeStage,
    completeOnboarding,
    hideProgressTracker,
    getCurrentStage,
    getNextIncompleteStep
  };
}
