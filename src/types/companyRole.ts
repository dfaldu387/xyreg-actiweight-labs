
import { UserRole } from "./documentTypes";

/**
 * Represents a user's role for a specific company
 */
export interface CompanyRole {
  companyId: string;
  companyName: string;
  role: UserRole;
  isActive: boolean;
  isPrimary: boolean;
  isInternal: boolean;
}

/**
 * Response from role switching operations
 */
export interface RoleSwitchResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * Context options when changing company roles
 */
export interface CompanyRoleContextOptions {
  updateUserMetadata?: boolean;
  navigateToCompany?: boolean;
}
