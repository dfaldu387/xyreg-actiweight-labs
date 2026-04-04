
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingUser {
  id: string;
  company_id: string;
  email: string;
  name: string;
  access_level: 'viewer' | 'editor' | 'admin' | 'consultant';
  is_internal: boolean;
  functional_area?: 'research_development' | 'quality_assurance' | 'regulatory_affairs' | 'clinical_affairs' | 'manufacturing_operations' | 'marketing_labeling' | 'management_executive' | 'other_internal';
  external_role?: 'consultant' | 'auditor' | 'contract_manufacturer' | 'distributor' | 'key_opinion_leader' | 'other_external';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePendingUsers(companyId?: string) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    if (!companyId) {
      setPendingUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      

      const { data, error } = await supabase
        .from('pending_company_users')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[usePendingUsers] Database error:', error);
        throw new Error(`Failed to fetch pending users: ${error.message}`);
      }

      
      
      // Type cast the data to ensure proper typing
      const typedPendingUsers: PendingUser[] = (data || []).map(user => ({
        ...user,
        access_level: user.access_level as 'viewer' | 'editor' | 'admin' | 'consultant',
        functional_area: user.functional_area as any,
        external_role: user.external_role as any
      }));
      
      setPendingUsers(typedPendingUsers);
    } catch (err) {
      console.error('[usePendingUsers] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pending users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createPendingUser = async (userData: {
    email: string;
    name: string;
    access_level: 'viewer' | 'editor' | 'admin' | 'consultant';
    is_internal: boolean;
    functional_area?: 'research_development' | 'quality_assurance' | 'regulatory_affairs' | 'clinical_affairs' | 'manufacturing_operations' | 'marketing_labeling' | 'management_executive' | 'other_internal';
    external_role?: 'consultant' | 'auditor' | 'contract_manufacturer' | 'distributor' | 'key_opinion_leader' | 'other_external';
  }) => {
    if (!companyId) return false;

    try {
      const emailLower = userData.email.toLowerCase().trim();

      // Check if user already exists in this company
      const { data: existingUsers } = await supabase
        .from('user_company_access')
        .select('id, user_id, user_profiles!user_company_access_user_id_fkey(email)')
        .eq('company_id', companyId);

      if (existingUsers?.some((u: any) =>
        u.user_profiles?.email?.toLowerCase() === emailLower
      )) {
        toast.info('This user is already a member of this company.');
        return false;
      }

      // Check if there's already a pending invitation for this email in this company
      const { data: existingInvitations } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .ilike('email', emailLower);

      if (existingInvitations && existingInvitations.length > 0) {
        toast.info('An invitation has already been sent to this email address.');
        return false;
      }

      // Get current user for created_by
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('pending_company_users')
        .insert({
          company_id: companyId,
          email: userData.email,
          name: userData.name,
          access_level: userData.access_level,
          is_internal: userData.is_internal,
          functional_area: userData.functional_area,
          external_role: userData.external_role,
          created_by: currentUser.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('[usePendingUsers] Error creating pending user:', error);
        throw new Error(`Failed to create pending user: ${error.message}`);
      }

      toast.success(`Pending user ${userData.name} created successfully`);
      await fetchPendingUsers(); // Refresh the list
      return true;
    } catch (err) {
      console.error('[usePendingUsers] Error creating pending user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pending user';
      toast.error(errorMessage);
      return false;
    }
  };

  const updatePendingUser = async (pendingUserId: string, updates: Partial<PendingUser>) => {
    try {
      

      const { error } = await supabase
        .from('pending_company_users')
        .update(updates)
        .eq('id', pendingUserId);

      if (error) {
        console.error('[usePendingUsers] Error updating pending user:', error);
        throw new Error(`Failed to update pending user: ${error.message}`);
      }

      toast.success('Pending user updated successfully');
      await fetchPendingUsers(); // Refresh the list
      return true;
    } catch (err) {
      console.error('[usePendingUsers] Error updating pending user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pending user';
      toast.error(errorMessage);
      return false;
    }
  };

  const deletePendingUser = async (pendingUserId: string) => {
    try {
      

      const { error } = await supabase
        .from('pending_company_users')
        .delete()
        .eq('id', pendingUserId);

      if (error) {
        console.error('[usePendingUsers] Error deleting pending user:', error);
        throw new Error(`Failed to delete pending user: ${error.message}`);
      }

      toast.success('Pending user deleted successfully');
      await fetchPendingUsers(); // Refresh the list
      return true;
    } catch (err) {
      console.error('[usePendingUsers] Error deleting pending user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pending user';
      toast.error(errorMessage);
      return false;
    }
  };

  const activateAllPendingUsers = async () => {
    if (!companyId) return { success: false, count: 0 };

    try {
      
      
      const usersToActivate = pendingUsers.filter(user => !user.created_by);
      const activatedCount = { success: 0, failed: 0 };

      for (const pendingUser of usersToActivate) {
        try {
          const newUserId = crypto.randomUUID();

          // Create user_profiles entry
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: newUserId,
              email: pendingUser.email,
              first_name: pendingUser.name.split(' ')[0] || pendingUser.name,
              last_name: pendingUser.name.split(' ').slice(1).join(' ') || '',
            });

          if (profileError) {
            console.error('[usePendingUsers] Error creating profile for:', pendingUser.email, profileError);
            activatedCount.failed++;
            continue;
          }

          // Create user_company_access entry
          const { error: accessError } = await supabase
            .from('user_company_access')
            .insert([{
              user_id: newUserId,
              company_id: companyId,
              access_level: pendingUser.access_level,
              affiliation_type: pendingUser.is_internal ? 'internal' : 'external',
              functional_area: pendingUser.functional_area,
              external_role: pendingUser.external_role,
            }]);

          if (accessError) {
            console.error('[usePendingUsers] Error creating access for:', pendingUser.email, accessError);
            // Clean up profile
            await supabase.from('user_profiles').delete().eq('id', newUserId);
            activatedCount.failed++;
            continue;
          }

          // Update pending_company_users to mark as created
          const { error: updateError } = await supabase
            .from('pending_company_users')
            .update({ created_by: newUserId })
            .eq('id', pendingUser.id);

          if (updateError) {
            console.error('[usePendingUsers] Error updating pending user:', pendingUser.email, updateError);
          }

          activatedCount.success++;
          
        } catch (err) {
          console.error('[usePendingUsers] Error activating user:', pendingUser.email, err);
          activatedCount.failed++;
        }
      }

      await fetchPendingUsers(); // Refresh the list
      
      if (activatedCount.success > 0) {
        toast.success(`Successfully activated ${activatedCount.success} user(s)`);
      }
      if (activatedCount.failed > 0) {
        toast.error(`Failed to activate ${activatedCount.failed} user(s)`);
      }

      return { success: true, count: activatedCount.success };
    } catch (err) {
      console.error('[usePendingUsers] Error in bulk activation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate users';
      toast.error(errorMessage);
      return { success: false, count: 0 };
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [companyId]);

  return {
    pendingUsers,
    isLoading,
    error,
    fetchPendingUsers,
    createPendingUser,
    updatePendingUser,
    deletePendingUser,
    activateAllPendingUsers
  };
}
