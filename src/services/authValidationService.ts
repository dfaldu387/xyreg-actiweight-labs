
import { supabase } from "@/integrations/supabase/client";

export interface AuthValidationResult {
  isAuthenticated: boolean;
  userId: string | null;
  hasCompanyAccess: boolean;
  accessLevel: string | null;
  error?: string;
}

/**
 * Authentication validation service for CSV import operations
 * Ensures proper authentication context throughout the import process
 */
export class AuthValidationService {
  /**
   * Comprehensive authentication check before starting import operations
   */
  static async validateAuthenticationForImport(companyId: string): Promise<AuthValidationResult> {
    console.log('[AuthValidation] Starting comprehensive authentication check');
    
    try {
      // Step 1: Refresh the session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[AuthValidation] No valid session found:', sessionError);
        return {
          isAuthenticated: false,
          userId: null,
          hasCompanyAccess: false,
          accessLevel: null,
          error: 'No valid authentication session. Please log in again.'
        };
      }

      const userId = sessionData.session.user.id;
      console.log('[AuthValidation] Session validated for user:', userId);

      // Step 2: Verify the token is not expired
      const expiresAt = sessionData.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      if (expiresAt && expiresAt <= now) {
        console.warn('[AuthValidation] Token is expired, attempting refresh');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('[AuthValidation] Session refresh failed:', refreshError);
          return {
            isAuthenticated: false,
            userId: null,
            hasCompanyAccess: false,
            accessLevel: null,
            error: 'Authentication session expired and could not be refreshed. Please log in again.'
          };
        }
        
        console.log('[AuthValidation] Session refreshed successfully');
      }

      // Step 3: Verify company access and permissions
      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select('access_level, is_internal')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (accessError || !accessData) {
        console.error('[AuthValidation] Company access check failed:', accessError);
        return {
          isAuthenticated: true,
          userId,
          hasCompanyAccess: false,
          accessLevel: null,
          error: `No access to company. Please contact an administrator.`
        };
      }

      // Step 4: Verify user has admin or editor permissions
      if (!['admin', 'editor'].includes(accessData.access_level)) {
        console.warn('[AuthValidation] Insufficient permissions:', accessData.access_level);
        return {
          isAuthenticated: true,
          userId,
          hasCompanyAccess: true,
          accessLevel: accessData.access_level,
          error: `Insufficient permissions. Admin or editor access required for CSV import.`
        };
      }

      console.log('[AuthValidation] Full authentication validation successful');
      return {
        isAuthenticated: true,
        userId,
        hasCompanyAccess: true,
        accessLevel: accessData.access_level
      };

    } catch (error) {
      console.error('[AuthValidation] Authentication validation failed:', error);
      return {
        isAuthenticated: false,
        userId: null,
        hasCompanyAccess: false,
        accessLevel: null,
        error: `Authentication validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate authentication before each critical database operation
   */
  static async validateOperationAuth(): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return {
          isValid: false,
          error: 'Authentication lost during operation. Please restart the import.'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Ensure session is refreshed and valid before proceeding
   */
  static async ensureValidSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('[AuthValidation] Session refresh failed:', error);
        return false;
      }

      console.log('[AuthValidation] Session ensured and valid');
      return true;
    } catch (error) {
      console.error('[AuthValidation] Session validation error:', error);
      return false;
    }
  }
}
