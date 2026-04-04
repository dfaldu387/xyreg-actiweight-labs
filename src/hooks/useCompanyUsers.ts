
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  access_level: string;
  is_internal: boolean;
  is_owner: boolean;
  functional_area?: 'research_development' | 'quality_assurance' | 'regulatory_affairs' | 'clinical_affairs' | 'manufacturing_operations' | 'marketing_labeling' | 'management_executive' | 'other_internal';
  external_role?: 'consultant' | 'auditor' | 'contract_manufacturer' | 'distributor' | 'key_opinion_leader' | 'other_external';
  department?: string | null;
  created_at: string;
  permissions: {
    companies: string[];
    products: string[];
    documents: string[];
    accessLevels: string[];
  };
}

export function useCompanyUsers(companyId?: string) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!companyId) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          is_internal,
          is_primary,
          is_invite_user,
          functional_area,
          external_role,
          department,
          created_at,
          user_profiles!inner(
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
      // For external users missing external_role, look up from user_invitations as fallback
      const externalUsersWithoutRole = (data || []).filter(
        (a: any) => !a.is_internal && !a.external_role && a.user_profiles?.email
      );
      let invitationRoleMap: Record<string, string> = {};
      if (externalUsersWithoutRole.length > 0) {
        const emails = externalUsersWithoutRole.map((a: any) => a.user_profiles.email);
        const { data: invitations } = await supabase
          .from('user_invitations')
          .select('email, external_role')
          .eq('company_id', companyId)
          .in('email', emails)
          .not('external_role', 'is', null);
        if (invitations) {
          for (const inv of invitations) {
            if (inv.email && inv.external_role) {
              invitationRoleMap[inv.email] = inv.external_role;
            }
          }
        }
      }

      const mappedUsers: CompanyUser[] = (data || []).map((access: any) => {
        const email = access.user_profiles?.email || 'No email';
        const externalRole = access.external_role || invitationRoleMap[email] || null;
        // Owner = created the company (is_primary=true and not an invited user)
        const isOwner = access.is_primary === true && !access.is_invite_user;

        return {
          id: access.user_id,
          name: access.user_profiles
            ? `${access.user_profiles.first_name || ''} ${access.user_profiles.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          email,
          avatar: access.user_profiles?.avatar_url,
          role: access.department || externalRole || (access.is_internal ? 'Internal' : 'External'),
          department: access.department || null,
          access_level: access.access_level,
          is_internal: access.is_internal,
          is_owner: isOwner,
          functional_area: access.functional_area,
          external_role: externalRole,
          created_at: access.created_at,
          permissions: {
            companies: [companyId],
            products: [],
            documents: [],
            accessLevels: [access.access_level]
          }
        };
      });

      setUsers(mappedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (!companyId) return false;

    try {

      const { error } = await supabase
        .from('user_company_access')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to remove user: ${error.message}`);
      }

      toast.success('User removed successfully');
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user';
      toast.error(errorMessage);
      return false;
    }
  };

  const updateUserPermissions = async (userId: string, updates: {
    name?: string;
    role?: string;
    access_level?: 'viewer' | 'editor' | 'admin' | 'consultant';
    is_internal?: boolean;
    functional_area?: 'research_development' | 'quality_assurance' | 'regulatory_affairs' | 'clinical_affairs' | 'manufacturing_operations' | 'marketing_labeling' | 'management_executive' | 'other_internal';
    external_role?: 'consultant' | 'auditor' | 'contract_manufacturer' | 'distributor' | 'key_opinion_leader' | 'other_external';
  }) => {
    if (!companyId) return false;

    try {
      // Update user profile name if provided
      if (updates.name) {
        const [firstName, ...lastNameParts] = updates.name.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', userId);

        if (profileError) {
          throw new Error(`Failed to update user profile: ${profileError.message}`);
        }
      }

      // Update company access permissions
      const accessUpdates = {
        access_level: updates.access_level,
        is_internal: updates.is_internal,
        functional_area: updates.functional_area,
        external_role: updates.external_role,
        department: updates.role
      };

      const { error } = await supabase
        .from('user_company_access')
        .update(accessUpdates)
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update permissions: ${error.message}`);
      }

      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user,
                name: updates.name || user.name,
                access_level: updates.access_level || user.access_level,
                is_internal: updates.is_internal !== undefined ? updates.is_internal : user.is_internal,
                functional_area: updates.functional_area !== undefined ? updates.functional_area : user.functional_area,
                external_role: updates.external_role !== undefined ? updates.external_role : user.external_role,
                role: updates.role || user.role
              }
            : user
        )
      );

      toast.success('User permissions updated');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permissions';
      toast.error(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    removeUser,
    updateUserPermissions
  };
}
