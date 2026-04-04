import { useState, useCallback } from 'react';
import { useDevMode } from '@/context/DevModeContext';
import { DevModeScenario, PREDEFINED_SCENARIOS } from '@/types/devMode';
import { toast } from 'sonner';

export function useDevModeScenarios() {
  const {
    isDevMode,
    toggleDevMode,
    setSelectedRole,
    addCompany,
    removeCompany,
    clearCompanies,
    setPrimaryCompany,
    setIsInternalUser,
    setCompanyInternalStatus,
    setCompanyRole,
    selectedCompanies,
    primaryCompany,
    selectedRole,
    isInternalUser,
    companyInternalStatuses,
    companyRoles
  } = useDevMode();

  const [currentScenario, setCurrentScenario] = useState<string | null>(null);

  // Apply a scenario configuration
  const applyScenario = useCallback((scenario: DevModeScenario) => {
    console.log('Applying DevMode scenario:', scenario.name);
    
    // Enable dev mode if not already enabled
    if (!isDevMode) {
      toggleDevMode();
    }

    // Clear existing companies
    clearCompanies();

    // Set global settings
    setSelectedRole(scenario.config.globalRole);
    setIsInternalUser(scenario.config.isInternalUser);

    // Add companies from scenario
    scenario.config.selectedCompanies.forEach(company => {
      addCompany(company);
    });

    // Set primary company
    if (scenario.config.primaryCompany) {
      setPrimaryCompany(scenario.config.primaryCompany);
    }

    // Set company-specific roles
    Object.entries(scenario.config.companyRoles).forEach(([companyId, role]) => {
      setCompanyRole(companyId, role);
    });

    // Set company-specific internal statuses
    Object.entries(scenario.config.companyInternalStatuses).forEach(([companyId, isInternal]) => {
      setCompanyInternalStatus(companyId, isInternal);
    });

    setCurrentScenario(scenario.id);
    
    toast.success(`Applied scenario: ${scenario.name}`, {
      description: scenario.description
    });
  }, [
    isDevMode, toggleDevMode, setSelectedRole, setIsInternalUser,
    clearCompanies, addCompany, setPrimaryCompany, setCompanyRole, setCompanyInternalStatus
  ]);

  // Get all available scenarios grouped by category
  const getScenarioCategories = useCallback(() => {
    return PREDEFINED_SCENARIOS;
  }, []);

  // Get current scenario info
  const getCurrentScenarioInfo = useCallback(() => {
    if (!currentScenario) return null;
    
    for (const category of PREDEFINED_SCENARIOS) {
      const scenario = category.scenarios.find(s => s.id === currentScenario);
      if (scenario) return scenario;
    }
    return null;
  }, [currentScenario]);

  // Check if current state matches a scenario
  const detectCurrentScenario = useCallback(() => {
    const currentState = {
      selectedCompanies: selectedCompanies.map(c => ({ id: c.id, name: c.name })),
      primaryCompany: primaryCompany ? { id: primaryCompany.id, name: primaryCompany.name } : null,
      globalRole: selectedRole,
      companyRoles,
      companyInternalStatuses,
      isInternalUser
    };

    for (const category of PREDEFINED_SCENARIOS) {
      for (const scenario of category.scenarios) {
        // Simple comparison - could be made more sophisticated
        if (
          JSON.stringify(currentState.selectedCompanies) === JSON.stringify(scenario.config.selectedCompanies) &&
          JSON.stringify(currentState.primaryCompany) === JSON.stringify(scenario.config.primaryCompany) &&
          currentState.globalRole === scenario.config.globalRole &&
          currentState.isInternalUser === scenario.config.isInternalUser
        ) {
          setCurrentScenario(scenario.id);
          return scenario;
        }
      }
    }

    // No match found - this is a custom configuration
    setCurrentScenario(null);
    return null;
  }, [selectedCompanies, primaryCompany, selectedRole, companyRoles, companyInternalStatuses, isInternalUser]);

  // Quick scenario application functions
  const applySingleCompanyAdmin = useCallback(() => {
    const scenario = PREDEFINED_SCENARIOS[0].scenarios[0]; // Single Company Admin
    applyScenario(scenario);
  }, [applyScenario]);

  const applyMultiCompanyAdmin = useCallback(() => {
    const scenario = PREDEFINED_SCENARIOS[1].scenarios[0]; // Multi-Company Admin
    applyScenario(scenario);
  }, [applyScenario]);

  const applyExternalConsultant = useCallback(() => {
    const scenario = PREDEFINED_SCENARIOS[0].scenarios[2]; // External Consultant
    applyScenario(scenario);
  }, [applyScenario]);

  const applyNoAccess = useCallback(() => {
    const scenario = PREDEFINED_SCENARIOS[3].scenarios[0]; // No Company Access
    applyScenario(scenario);
  }, [applyScenario]);

  return {
    // Scenario management
    applyScenario,
    getScenarioCategories,
    getCurrentScenarioInfo,
    detectCurrentScenario,
    currentScenario,
    
    // Quick scenario shortcuts
    applySingleCompanyAdmin,
    applyMultiCompanyAdmin,
    applyExternalConsultant,
    applyNoAccess,
    
    // State
    isDevMode
  };
}