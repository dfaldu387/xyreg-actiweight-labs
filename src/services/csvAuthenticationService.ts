
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AuthState {
  isValid: boolean;
  userId: string | null;
  accessLevel: string | null;
  error?: string;
}

/**
 * Enhanced authentication service specifically for CSV import operations
 * Handles session management, token refresh, and maintains auth context
 */
export class CsvAuthenticationService {
  private static authCheckInterval: NodeJS.Timeout | null = null;
  private static lastAuthCheck: number = 0;
  private static AUTH_CHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize authentication monitoring for import operations
   */
  static async initializeAuthMonitoring(): Promise<void> {
    console.log('[CsvAuth] Initializing authentication monitoring');
    
    // Clear any existing interval
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    // Set up periodic auth checks during import
    this.authCheckInterval = setInterval(async () => {
      await this.validateCurrentSession();
    }, this.AUTH_CHECK_INTERVAL);
  }

  /**
   * Stop authentication monitoring
   */
  static stopAuthMonitoring(): void {
    console.log('[CsvAuth] Stopping authentication monitoring');
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  /**
   * Comprehensive authentication validation before starting import
   */
  static async validateForImport(companyId: string): Promise<AuthState> {
    console.log('[CsvAuth] Starting comprehensive authentication validation for import');
    
    try {
      // Step 1: Refresh session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[CsvAuth] Session refresh failed:', sessionError);
        return {
          isValid: false,
          userId: null,
          accessLevel: null,
          error: 'Authentication session invalid. Please log out and log back in.'
        };
      }

      const userId = sessionData.session.user.id;
      console.log('[CsvAuth] Session refreshed successfully for user:', userId);

      // Step 2: Verify company access with fresh token
      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select('access_level, is_internal')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (accessError || !accessData) {
        console.error('[CsvAuth] Company access check failed:', accessError);
        return {
          isValid: false,
          userId,
          accessLevel: null,
          error: 'No access to this company. Please use the "Setup Access" button in the settings page to grant access, then try again.'
        };
      }

      // Step 3: Verify sufficient permissions
      if (!['admin', 'editor'].includes(accessData.access_level)) {
        return {
          isValid: false,
          userId,
          accessLevel: accessData.access_level,
          error: 'Insufficient permissions. Admin or editor access required for CSV import.'
        };
      }

      console.log('[CsvAuth] Authentication validation successful');
      this.lastAuthCheck = Date.now();
      
      return {
        isValid: true,
        userId,
        accessLevel: accessData.access_level
      };

    } catch (error) {
      console.error('[CsvAuth] Authentication validation failed:', error);
      return {
        isValid: false,
        userId: null,
        accessLevel: null,
        error: `Authentication validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Quick session validation during import operations
   */
  static async validateCurrentSession(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn('[CsvAuth] Session validation failed:', error);
        return false;
      }

      this.lastAuthCheck = Date.now();
      return true;
    } catch (error) {
      console.error('[CsvAuth] Session check error:', error);
      return false;
    }
  }

  /**
   * Ensure session is fresh before critical operations
   */
  static async ensureFreshSession(): Promise<boolean> {
    const timeSinceLastCheck = Date.now() - this.lastAuthCheck;
    
    // If we checked recently, skip
    if (timeSinceLastCheck < 10000) { // 10 seconds
      return true;
    }

    console.log('[CsvAuth] Refreshing session for critical operation');
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('[CsvAuth] Session refresh failed:', error);
        return false;
      }

      this.lastAuthCheck = Date.now();
      return true;
    } catch (error) {
      console.error('[CsvAuth] Session refresh error:', error);
      return false;
    }
  }

  /**
   * Batch operation with authentication checks
   */
  static async withAuthCheck<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Ensure fresh session before operation
    const sessionValid = await this.ensureFreshSession();
    
    if (!sessionValid) {
      throw new Error(`Authentication lost before ${operationName}. Please restart the import.`);
    }

    try {
      return await operation();
    } catch (error) {
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('auth')) {
        console.error(`[CsvAuth] Authentication error during ${operationName}:`, error);
        throw new Error(`Authentication failed during ${operationName}. Please restart the import.`);
      }
      
      throw error;
    }
  }
}
