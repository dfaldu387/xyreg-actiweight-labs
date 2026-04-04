import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUniqueDepartments(companyId: string | undefined) {
  return async () => {
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('user_company_access')
      .select('department')
      .eq('company_id', companyId)
      .not('department', 'is', null);

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    // Get unique non-empty departments
    const departments = new Set<string>();
    data?.forEach((row) => {
      if (row.department && row.department.trim()) {
        departments.add(row.department.trim());
      }
    });

    return Array.from(departments);
  };
}

export function useCreateRolesFromDepartments(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departments: string[]) => {
      if (!companyId || departments.length === 0) {
        throw new Error('No departments to create roles from');
      }

      // First check existing roles to avoid duplicates
      const { data: existingRoles, error: fetchError } = await supabase
        .from('company_roles')
        .select('role_name')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      const existingRoleNames = new Set(
        existingRoles?.map((r) => r.role_name.toLowerCase()) || []
      );

      // Filter out departments that already exist as roles
      const newDepartments = departments.filter(
        (dept) => !existingRoleNames.has(dept.toLowerCase())
      );

      if (newDepartments.length === 0) {
        return { created: 0, skipped: departments.length };
      }

      // Create roles from remaining departments
      const rolesToCreate = newDepartments.map((dept) => ({
        company_id: companyId,
        role_name: dept,
        role_key: dept.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        description: `Role created from department: ${dept}`,
      }));

      const { data, error } = await supabase
        .from('company_roles')
        .insert(rolesToCreate)
        .select();

      if (error) throw error;

      return {
        created: data?.length || 0,
        skipped: departments.length - newDepartments.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['company-roles'] });
      if (result.created > 0) {
        toast.success(
          `Created ${result.created} role${result.created > 1 ? 's' : ''} from departments`
        );
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} already existed as roles`);
      }
    },
    onError: (error) => {
      console.error('Error creating roles:', error);
      toast.error('Failed to create roles from departments');
    },
  });
}
