
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/documentTypes';
import { toast } from 'sonner';

interface RoleSwitcherResult {
  currentRole: UserRole;
  switchRole: (role: UserRole, companyId?: string) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

export function useRoleSwitcher(): RoleSwitcherResult {
  const [currentRole, setCurrentRole] = useState<UserRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load the current user's role on mount
  useEffect(() => {
    const fetchCurrentRole = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.user_metadata?.role) {
          setCurrentRole(user.user_metadata.role as UserRole);
        }
      } catch (err) {
        console.error("Failed to fetch current role:", err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentRole();
  }, []);

  // Switch the user's role
  const switchRole = useCallback(async (newRole: UserRole, companyId?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Switching to role: ${newRole}${companyId ? ` for company: ${companyId}` : ''}`);
      
      // In a real implementation, we would check if the user has permission to use this role
      // For now, we'll just update the user's metadata
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: newRole,
          ...(companyId && { activeCompany: companyId })
        }
      });
      
      if (updateError) throw updateError;
      
      // If successful, update the local state
      if (updateData.user) {
        setCurrentRole(newRole);
        console.log("Role updated successfully:", newRole);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Failed to switch role:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentRole,
    switchRole,
    isLoading,
    error
  };
}
