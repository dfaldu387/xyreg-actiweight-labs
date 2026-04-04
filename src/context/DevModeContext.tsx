import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole } from "@/types/documentTypes";
import { CompanyRoleMap } from "@/types";
import { toast } from "sonner";

// Define Company type
export interface Company {
  id: string;
  name: string;
}

// Helper function to validate UUID format
const isValidUuid = (id: string): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Define company internal status map type
export type CompanyInternalStatus = {
  [companyId: string]: boolean;
};

// Local storage keys
const DEV_MODE_KEY = "xyreg_dev_mode";
const DEV_ROLE_KEY = "xyreg_dev_role";
const DEV_COMPANIES_KEY = "xyreg_dev_companies";
const DEV_PRIMARY_COMPANY_KEY = "xyreg_dev_primary_company";
const DEV_INTERNAL_USER_KEY = "xyreg_dev_internal_user";
const DEV_COMPANY_INTERNAL_STATUSES_KEY = "xyreg_dev_company_internal_statuses";
const DEV_AVAILABLE_COMPANIES_KEY = "xyreg_dev_available_companies";
const DEV_COMPANY_ROLES_KEY = "xyreg_dev_company_roles";

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  
  // Company management
  selectedCompanies: Company[];
  primaryCompany: Company | null;
  setPrimaryCompany: (company: Company) => void;
  addCompany: (company: Company) => void;
  removeCompany: (companyId: string) => void;
  clearCompanies: () => void;
  hasMultipleCompanies: () => boolean;
  
  // Internal/External user status
  isInternalUser: boolean;
  setIsInternalUser: (isInternal: boolean) => void;
  
  // Available companies
  availableCompanies: Company[];
  setAvailableCompanies: (companies: Company[]) => void;
  
  // Company-specific internal/external status
  companyInternalStatuses: CompanyInternalStatus;
  getCompanyInternalStatus: (companyId: string) => boolean;
  setCompanyInternalStatus: (companyId: string, isInternal: boolean) => void;
  
  // Company-specific roles
  companyRoles: CompanyRoleMap;
  getCompanyRole: (companyId: string) => UserRole;
  setCompanyRole: (companyId: string, role: UserRole) => void;
  resetDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

// Helper functions for localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Error parsing localStorage item ${key}:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // console.log(`Saved to localStorage: ${key}`, value);
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }
};

export function DevModeProvider({ children }: { children: ReactNode }) {
  // Initialize state with values from localStorage
  const [isDevMode, setIsDevMode] = useState<boolean>(() => 
    getFromLocalStorage<boolean>(DEV_MODE_KEY, false)
  );
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => 
    getFromLocalStorage<UserRole>(DEV_ROLE_KEY, "admin")
  );
  
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>(() => {
    const companies = getFromLocalStorage<Company[]>(DEV_COMPANIES_KEY, []);
    // console.log("Initial load - Selected companies from localStorage:", companies);
    return companies;
  });
  
  const [primaryCompany, setPrimaryCompanyState] = useState<Company | null>(() => {
    const primary = getFromLocalStorage<Company | null>(DEV_PRIMARY_COMPANY_KEY, null);
    // console.log("Initial load - Primary company from localStorage:", primary);
    return primary;
  });
  
  const [isInternalUser, setIsInternalUserState] = useState<boolean>(() => 
    getFromLocalStorage<boolean>(DEV_INTERNAL_USER_KEY, true)
  );
  
  const [availableCompanies, setAvailableCompaniesState] = useState<Company[]>(() => 
    getFromLocalStorage<Company[]>(DEV_AVAILABLE_COMPANIES_KEY, [])
  );
  
  const [companyInternalStatuses, setCompanyInternalStatuses] = useState<CompanyInternalStatus>(() => 
    getFromLocalStorage<CompanyInternalStatus>(DEV_COMPANY_INTERNAL_STATUSES_KEY, {})
  );
  
  // New state for company-specific roles
  const [companyRoles, setCompanyRoles] = useState<CompanyRoleMap>(() =>
    getFromLocalStorage<CompanyRoleMap>(DEV_COMPANY_ROLES_KEY, {})
  );

  // Log DevMode state on init for debugging
  useEffect(() => {
    //  console.log("DevMode initialized with state:", {
    //   isActive: isDevMode,
    //   selectedRole,
    //   companies: selectedCompanies?.length || 0,
    //   primaryCompany: primaryCompany?.name || "None"
    //  });
    
    // Fix any invalid company IDs in the initial state
    if (selectedCompanies && selectedCompanies.length > 0) {
      const invalidCompanies = selectedCompanies.filter(company => !isValidUuid(company.id));
      
      if (invalidCompanies.length > 0) {
        // console.warn("Found invalid company IDs in DevMode storage:", 
          // invalidCompanies.map(c => `${c.name} (${c.id})`));
        
        // Filter out invalid companies
        const validCompanies = selectedCompanies.filter(company => isValidUuid(company.id));
        setSelectedCompanies(validCompanies);
        
        // Also update primary company if needed
        if (primaryCompany && !isValidUuid(primaryCompany.id)) {
          const newPrimary = validCompanies.length > 0 ? validCompanies[0] : null;
          // console.log("Correcting invalid primary company:", primaryCompany, "to:", newPrimary);
          setPrimaryCompany(newPrimary);
        }
        
        toast.warning("Some company selections were invalid and have been fixed", {
          description: "Please check your DevMode company selections"
        });
      }
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage(DEV_MODE_KEY, isDevMode);
  }, [isDevMode]);

  useEffect(() => {
    saveToLocalStorage(DEV_ROLE_KEY, selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    saveToLocalStorage(DEV_COMPANIES_KEY, selectedCompanies);
  }, [selectedCompanies]);

  useEffect(() => {
    saveToLocalStorage(DEV_PRIMARY_COMPANY_KEY, primaryCompany);
  }, [primaryCompany]);

  useEffect(() => {
    saveToLocalStorage(DEV_INTERNAL_USER_KEY, isInternalUser);
  }, [isInternalUser]);

  useEffect(() => {
    saveToLocalStorage(DEV_AVAILABLE_COMPANIES_KEY, availableCompanies);
  }, [availableCompanies]);

  useEffect(() => {
    saveToLocalStorage(DEV_COMPANY_INTERNAL_STATUSES_KEY, companyInternalStatuses);
  }, [companyInternalStatuses]);
  
  // Save company roles to localStorage
  useEffect(() => {
    saveToLocalStorage(DEV_COMPANY_ROLES_KEY, companyRoles);
  }, [companyRoles]);

  const toggleDevMode = () => {
    setIsDevMode(prev => {
      const newValue = !prev;
      if (newValue) {
        toast.success("Developer mode activated");
      } else {
        toast.success("Developer mode deactivated");
      }
      return newValue;
    });
  };

  // Wrapper functions to update state and localStorage
  const setPrimaryCompany = (company: Company) => {
    // console.log("Setting primary company:", company);
    setPrimaryCompanyState(company);
  };

  const setIsInternalUser = (isInternal: boolean) => {
    setIsInternalUserState(isInternal);
  };

  const setAvailableCompanies = (companies: Company[]) => {
    // console.log("Setting available companies:", companies.length);
    setAvailableCompaniesState(companies);
  };

  const addCompany = (company: Company) => {
    // Validate company object
    if (!company || !company.id || !company.name) {
      console.error("Invalid company object:", company);
      toast.error("Failed to add company: Invalid company data");
      return;
    }
    
    // Validate UUID format
    if (!isValidUuid(company.id)) {
      console.error("Invalid company ID format (not a UUID):", company.id);
      toast.error(`Failed to add company ${company.name}: Invalid ID format`);
      return;
    }
    
    // console.log("Adding company:", company);
    
    // Don't add duplicates
    if (selectedCompanies.some(c => c.id === company.id)) {
      // console.log("Company already exists:", company.id);
      return;
    }
    
    setSelectedCompanies(prev => {
      const updated = [...prev, company];
      // console.log("Updated companies list:", updated);
      return updated;
    });
    
    // If this is the first company, set it as primary
    if (selectedCompanies.length === 0 || primaryCompany === null) {
      setPrimaryCompany(company);
    }
    
    // Initialize internal status for this company (default to true/internal)
    setCompanyInternalStatuses(prev => ({
      ...prev,
      [company.id]: true
    }));
    
    // Initialize role for this company (default to global selected role)
    setCompanyRoles(prev => ({
      ...prev,
      [company.id]: selectedRole
    }));
  };

  const removeCompany = (companyId: string) => {
    // console.log("Removing company:", companyId);
    
    // Check if removing the primary company
    const isPrimaryBeingRemoved = primaryCompany && primaryCompany.id === companyId;
    const updatedCompanies = selectedCompanies.filter(c => c.id !== companyId);
    
    setSelectedCompanies(updatedCompanies);
    
    // If removing the primary company, set a new primary if any left
    if (isPrimaryBeingRemoved) {
      const newPrimary = updatedCompanies.length > 0 ? updatedCompanies[0] : null;
      // console.log("Primary company removed, setting new primary:", newPrimary);
      setPrimaryCompany(newPrimary);
    }
    
    // Clean up the internal status for this company
    setCompanyInternalStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[companyId];
      return newStatuses;
    });
    
    // Clean up the role for this company
    setCompanyRoles(prev => {
      const newRoles = { ...prev };
      delete newRoles[companyId];
      return newRoles;
    });
  };

  const clearCompanies = () => {
    // console.log("Clearing all companies");
    setSelectedCompanies([]);
    setPrimaryCompany(null);
    setCompanyInternalStatuses({});
    setCompanyRoles({});
  };

  const hasMultipleCompanies = () => {
    return selectedCompanies.length > 1;
  };
  
  // Company-specific internal status methods
  const getCompanyInternalStatus = (companyId: string): boolean => {
    return companyInternalStatuses[companyId] ?? isInternalUser; // Fall back to global setting if not set
  };
  
  const setCompanyInternalStatus = (companyId: string, isInternal: boolean) => {
    setCompanyInternalStatuses(prev => ({
      ...prev,
      [companyId]: isInternal
    }));
  };
  
  // Company-specific role methods
  const getCompanyRole = (companyId: string): UserRole => {
    return companyRoles[companyId] ?? selectedRole; // Fall back to global selected role if not set
  };
  
  const setCompanyRole = (companyId: string, role: UserRole) => {
    setCompanyRoles(prev => ({
      ...prev,
      [companyId]: role
    }));
  };
  
  // Reset all DevMode settings
  const resetDevMode = () => {
    setIsDevMode(false);
    setSelectedRole("admin");
    clearCompanies();
    setIsInternalUser(true);
    setCompanyInternalStatuses({});
    setCompanyRoles({});
    toast.success("DevMode settings reset");
  };

  // Debug log when companies change
  useEffect(() => {
    if (isDevMode) {
      // console.log("DevMode selected companies updated:", selectedCompanies);
    }
  }, [isDevMode, selectedCompanies]);

  return (
    <DevModeContext.Provider value={{ 
      isDevMode, 
      toggleDevMode, 
      selectedRole, 
      setSelectedRole,
      selectedCompanies,
      primaryCompany,
      setPrimaryCompany,
      addCompany,
      removeCompany,
      clearCompanies,
      hasMultipleCompanies,
      isInternalUser,
      setIsInternalUser,
      availableCompanies,
      setAvailableCompanies,
      companyInternalStatuses,
      getCompanyInternalStatus,
      setCompanyInternalStatus,
      companyRoles,
      getCompanyRole,
      setCompanyRole,
      resetDevMode
    }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error("useDevMode must be used within a DevModeProvider");
  }
  return context;
}
