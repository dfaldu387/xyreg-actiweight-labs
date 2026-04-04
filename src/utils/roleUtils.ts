
import { UserRole } from "@/types/documentTypes";

/**
 * Maps legacy role strings to standardized UserRole type
 * This helps with the transition from the old role system to the new one
 * Note: user_roles table has been removed in Phase 2 migration
 */
export const mapLegacyRoleToStandard = (legacyRole: string): UserRole => {
  // Normalize the input to handle case inconsistencies
  const normalizedRole = legacyRole?.toLowerCase() || "";
  
  // Super admin role (highest level)
  if (normalizedRole === "super_admin") {
    return "super_admin" as UserRole;
  }
  
  // Admin-level roles
  if (
    normalizedRole === "company_admin" ||
    normalizedRole === "admin"
  ) {
    return "admin";
  }
  
  // Consultant role (full company access)
  if (normalizedRole === "consultant") {
    return "consultant";
  }
  
  // Business role (full company access as admin)
  if (normalizedRole === "business") {
    return "admin";
  }
  
  // Editor-level roles
  if (
    normalizedRole === "company_editor" ||
    normalizedRole === "editor"
  ) {
    return "editor";
  }
  
  // Viewer-level roles  
  if (
    normalizedRole === "expert" ||
    normalizedRole === "company_user" ||
    normalizedRole === "viewer"
  ) {
    return "viewer";
  }
  
  // Reviewer role (separate from viewer for UI purposes)
  if (normalizedRole === "reviewer") {
    return "reviewer";
  }
  
  // Default to viewer for any unknown roles
  console.log(`Unknown role "${legacyRole}" mapped to viewer`);
  return "viewer";
};

/**
 * Check if a user's role has admin privileges
 */
export const hasAdminPrivileges = (role: UserRole | string): boolean => {
  // Super admin has the highest privileges
  if (role === 'super_admin') {
    return true;
  }
  
  // Handle string roles by mapping them first
  const standardRole = typeof role === 'string' && (role !== 'admin' && role !== 'editor' && role !== 'viewer' && role !== 'reviewer' && role !== 'consultant') 
    ? mapLegacyRoleToStandard(role)
    : role as UserRole;
    
  // Business users are mapped to admin and should have full access
  return standardRole === "admin" || standardRole === "consultant" || role === "business";
};

/**
 * Check if a user's role has editor privileges
 */
export const hasEditorPrivileges = (role: UserRole | string): boolean => {
  // Super admin has the highest privileges
  if (role === 'super_admin') {
    return true;
  }
  
  // Handle string roles by mapping them first
  const standardRole = typeof role === 'string' && (role !== 'admin' && role !== 'editor' && role !== 'viewer' && role !== 'reviewer' && role !== 'consultant') 
    ? mapLegacyRoleToStandard(role)
    : role as UserRole;
    
  // Business users are mapped to admin and should have full access
  return standardRole === "admin" || standardRole === "editor" || standardRole === "consultant" || role === "business";
};

/**
 * Check if a user's role has viewer privileges
 */
export const hasViewerPrivileges = (role: UserRole | string): boolean => {
  return true; // All roles have at least viewer privileges
};

/**
 * Returns an array of valid standard roles
 */
export const getStandardRoles = (): UserRole[] => {
  return ["super_admin" as UserRole, "admin", "editor", "viewer", "reviewer", "consultant"];
};

/**
 * Validates that a role is one of the standard roles
 * Returns the input role if valid, or 'viewer' if invalid
 */
export const validateRole = (role: string | undefined): UserRole => {
  if (!role) return "viewer";
  
  // Check if it's already a valid standard role
  if (role === "super_admin" || role === "admin" || role === "editor" || role === "viewer" || role === "reviewer" || role === "consultant") {
    return role as UserRole;
  }
  
  // Map from legacy role system
  return mapLegacyRoleToStandard(role);
};

/**
 * Get a display name for a role
 */
export const getRoleDisplayName = (role: UserRole | string): string => {
  // Normalize the role first
  const standardRole = typeof role === 'string' && (role !== 'super_admin' && role !== 'admin' && role !== 'editor' && role !== 'viewer' && role !== 'reviewer' && role !== 'consultant') 
    ? mapLegacyRoleToStandard(role)
    : role;
    
  switch (standardRole) {
    case "super_admin":
      return "Super Administrator";
    case "admin":
      return "Administrator";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    case "reviewer":
      return "Reviewer";
    case "consultant":
      return "Consultant";
    default:
      return "User";
  }
};

/**
 * Get user role from company access (replaces user_roles table functionality)
 * This function now relies entirely on the user_company_access table
 */
export const getUserRoleFromCompanyAccess = (accessLevel: string): UserRole => {
  switch (accessLevel) {
    case "admin":
      return "admin";
    case "editor":
      return "editor";
    case "viewer":
      return "viewer";
    case "consultant":
      return "consultant";
    case "business":
      return "admin"; // Business users get admin privileges
    default:
      return "viewer";
  }
};

/**
 * Legacy function compatibility - now uses company access instead of user_roles table
 * @deprecated Use getUserRoleFromCompanyAccess instead
 */
export const getLegacyUserRole = (userId: string, companyId?: string): UserRole => {
  console.warn('getLegacyUserRole is deprecated. Use user_company_access table instead.');
  return "viewer"; // Safe default since user_roles table no longer exists
};
