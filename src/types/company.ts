/**
 * Represents the result of resolving a company identifier (name or ID)
 */
export interface CompanyResolutionResult {
  /** The resolved company ID, or null if not found */
  companyId: string | null;
  
  /** The resolved company name, or null if not found */
  companyName: string | null;
  
  /** Where the identifier came from - id, name, or encoded-name */
  source: 'id' | 'name' | 'encoded-name' | 'unknown';
  
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Represents cached client data used by the efficient clients hook
 */
export interface CachedClientData {
  id: string;
  name: string;
  data: any;
  timestamp: number;
}

/**
 * Company permission settings for a user
 */
export interface CompanyPermissionSettings {
  userId: string;
  companyId: string;
  role: string;
  permissions: string[];
  isPrimary: boolean;
}

/**
 * User profile with role information
 */
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string; // Make avatar optional
  isExternal?: boolean;
  companyAccess?: 'single' | 'multi';
  functionalArea?: string; // For internal users
  externalRole?: string; // For external users
  permissions: {
    companies: string[];
    products: string[];
    documents: string[];
    accessLevels: string[];
  };
}

export interface UserCompanyAccess {
  id: string;
  userId: string;
  companyId: string;
  accessLevel: 'admin' | 'editor' | 'viewer' | 'consultant';
  isInternal: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
