
import { PermissionLevel, UserRole } from "@/types/documentTypes";

/**
 * Convert a user role to a permission level
 */
export const roleToPermissionLevel = (role: UserRole): PermissionLevel => {
  switch (role) {
    case "admin": return "A";
    case "editor": return "E";
    case "viewer": return "V";
    case "consultant": return "A"; // Consultant has admin-level permissions
    case "author": return "V"; // Author has viewer-level permissions
    default: return "V";
  }
};

/**
 * Check if a user has the required permission level
 */
export const hasRequiredPermissionLevel = (
  userLevel: PermissionLevel, 
  requiredLevel: PermissionLevel
): boolean => {
  if (userLevel === 'A') return true;
  if (userLevel === 'E' && requiredLevel !== 'A') return true;
  return userLevel === 'V' && requiredLevel === 'V';
};

/**
 * Get effective role for a company in DevMode (if applicable)
 * @param normalRole The normal role a user would have
 * @param companyId The company ID to check for overrides
 * @returns The effective role to use (DevMode override or normal role)
 */
export const getEffectiveRole = (normalRole: UserRole, companyId?: string): UserRole => {
  if (typeof window === 'undefined') return normalRole;
  
  // Check if DevMode is active and we're in a browser
  const devModeActive = localStorage.getItem("xyreg_dev_mode") === "true";
  
  if (!devModeActive || process.env.NODE_ENV === 'production') {
    return normalRole;
  }
  
  // If no company ID provided, use the global selected role
  if (!companyId) {
    try {
      const storedRole = localStorage.getItem("xyreg_dev_role");
      return storedRole ? JSON.parse(storedRole) as UserRole : normalRole;
    } catch {
      return normalRole;
    }
  }
  
  // Check for company-specific role
  try {
    const storedCompanyRoles = localStorage.getItem("xyreg_dev_company_roles");
    if (storedCompanyRoles) {
      const companyRoles = JSON.parse(storedCompanyRoles) as Record<string, UserRole>;
      if (companyRoles[companyId]) {
        return companyRoles[companyId];
      }
    }
    
    // Fallback to global role if no company-specific role
    const storedRole = localStorage.getItem("xyreg_dev_role");
    return storedRole ? JSON.parse(storedRole) as UserRole : normalRole;
  } catch {
    return normalRole;
  }
};

/**
 * Check if the current DevMode primary company matches a given company ID
 */
export const isDevModePrimaryCompany = (companyId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if DevMode is active 
  const devModeActive = localStorage.getItem("xyreg_dev_mode") === "true";
  
  if (!devModeActive || process.env.NODE_ENV === 'production') {
    return false;
  }
  
  try {
    const primaryCompany = localStorage.getItem("xyreg_dev_primary_company");
    if (primaryCompany) {
      const company = JSON.parse(primaryCompany);
      return company?.id === companyId;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Check if DevMode is currently active
 */
export const isDevModeActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem("xyreg_dev_mode") === "true" && process.env.NODE_ENV !== 'production';
};
