
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/documentTypes';
import { mapLegacyRoleToStandard } from '@/utils/roleUtils';
import { toast } from 'sonner';
import { AuditTrailService } from '@/services/auditTrailService';
import { activeTenant } from '@/config/tenants';

export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
  user_metadata?: {
    role?: string;
    first_name?: string;
    last_name?: string;
    lastSelectedCompany?: string;
    activeCompany?: string;
  };
  success: boolean;
}

export class AuthService {
  async signIn(email: string, password: string): Promise<{
    user: AuthUser | null;
    error: any;
    success: boolean;
    tenantAllowedCompanyIds?: string[];
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        console.error("Login error:", error);
        if (activeTenant.features.audit) {
          AuditTrailService.logUserAccessEvent({
            userId: 'unknown',
            action: 'failed_login',
            entityName: email,
            reason: error.message || 'Authentication failed',
            actionDetails: { email },
          }).catch(() => {});
        }
        return { user: null, error, success: false };
      }

      const isSuperAdmin = email.toLowerCase() === 'superadmin@gmail.com';
      let allowedCompanyIds: string[] = [];

      if (!isSuperAdmin) {
        // Run the tenant allow-list RPC and the user's company-access query in
        // parallel — they're independent. Sequential cost ~2x; parallel ~1x.
        const [allowedRes, accessRes] = await Promise.all([
          (supabase as any).rpc('get_tenant_allow_company_ids', { tenant_key: activeTenant.key }),
          supabase
            .from('user_company_access')
            .select('company_id, companies!inner(id,name)')
            .eq('user_id', data.session?.user.id),
        ]);

        if (allowedRes.error) {
          console.error('Error fetching tenant allow list:', allowedRes.error);
          await supabase.auth.signOut();
          toast.error(activeTenant.errorMessage);
          return { user: null, error: allowedRes.error, success: false };
        }

        if (accessRes.error) {
          console.error('Error fetching user company access:', accessRes.error);
        }

        allowedCompanyIds = Array.isArray(allowedRes.data) ? allowedRes.data : [];

        const userCompanyIds = (accessRes.data ?? [])
          .map((access: any) => access.companies?.id)
          .filter((id: any): id is string => typeof id === 'string' && id.length > 0);

        // Empty allow list = allow any user with at least one company access row.
        const allowed = allowedCompanyIds.length === 0
          ? userCompanyIds.length > 0
          : userCompanyIds.some(id => allowedCompanyIds.includes(id));

        if (!allowed) {
          const restrictedError = new Error(activeTenant.errorMessage);
          await supabase.auth.signOut();
          toast.error(activeTenant.errorMessage);
          return { user: null, error: restrictedError, success: false };
        }
      }

      const user: AuthUser = {
        id: data.session?.user.id || '',
        email: data.session?.user.email || '',
        created_at: data.session?.user.created_at,
        user_metadata: data.session?.user.user_metadata,
        success: true
      };

      if (activeTenant.features.audit) {
        AuditTrailService.logUserAccessEvent({
          userId: user.id,
          companyId: user.user_metadata?.activeCompany || null,
          action: 'login',
          entityName: email,
        }).catch(() => {});
      }

      toast.success(`Signed in as ${email}`);

      return { user, error: null, success: true, tenantAllowedCompanyIds: allowedCompanyIds };
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in');
      return { user: null, error, success: false };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      if (currentUser && activeTenant.features.audit) {
        AuditTrailService.logUserAccessEvent({
          userId: currentUser.id,
          action: 'logout',
          entityName: currentUser.email || '',
        }).catch(() => {});
      }

      toast.info('Signed out');
      return { error: null };
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      return { error };
    }
  }

  async signUp(email: string, password: string, role: string): Promise<{ user: AuthUser | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        return { user: null, error };
      }

      const user: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        created_at: data.user?.created_at,
        user_metadata: data.user?.user_metadata,
        success: true
      };

      toast.success(`Account created for ${email}`);

      return { user, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Failed to create account');
      return { user: null, error };
    }
  }

  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        return { user: null, session: null, error };
      }

      if (!data.session) {
        return { user: null, session: null, error: null };
      }

      const user: AuthUser = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        created_at: data.session.user.created_at,
        user_metadata: data.session.user.user_metadata,
        success: true
      };

      return { user, session: data.session, error: null };
    } catch (error: any) {
      console.error("Error getting current session:", error);
      return { user: null, session: null, error };
    }
  }

  async updateUserRole(role: UserRole): Promise<{ error: any }> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { role }
      });

      if (error) {
        console.error("Failed to update role in Supabase:", error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error updating user role:", error);
      return { error };
    }
  }

  extractUserRole(user: AuthUser | null): UserRole {
    if (!user?.user_metadata?.role) {
      return 'viewer';
    }

    return mapLegacyRoleToStandard(user.user_metadata.role);
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  isRealAuthentication(): boolean {
    const mockUser = localStorage.getItem('mock_user');
    return !mockUser;
  }
}

export const authService = new AuthService();
