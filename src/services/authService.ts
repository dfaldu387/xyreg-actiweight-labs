
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/documentTypes';
import { mapLegacyRoleToStandard } from '@/utils/roleUtils';
import { toast } from 'sonner';

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
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: any; success: boolean }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password

      });
      if (error) {
        console.error("Login error:", error);
        return { user: null, error, success: false };
      }
      // Check if the access for David Health Solutions Oy is active
      const { data: accessData, error: accessError } = await supabase.from('user_company_access').select('*,companies!inner(id,name)').eq('user_id', data.session?.user.id)
      if (accessError) {
        console.error('Error fetching user company access:', accessError);
      }
      if (accessData) {
        console.log('Access data:', accessData);
      }
      if (email.toLowerCase() !== 'superadmin@gmail.com' &&
        !(accessData?.some((access: any) => access.companies?.name === "XyReg"))) {
        toast.error("User not found. Only XyReg users can log in.");
        await supabase.auth.signOut();
        return { user: null, error: null, success: false };
      }

      const user: AuthUser = {
        id: data.session?.user.id || '',
        email: data.session?.user.email || '',
        created_at: data.session?.user.created_at,
        user_metadata: data.session?.user.user_metadata,
        success: true
      };

      toast.success(`Signed in as ${email}`);

      return { user, error: null, success: true };
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in');
      return { user: null, error, success: false };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
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

  // Helper method to check if user is authenticated and not in dev mode
  isRealAuthentication(): boolean {
    // Check if we're in development mode with mock user
    const mockUser = localStorage.getItem('mock_user');
    return !mockUser;
  }
}

export const authService = new AuthService();
