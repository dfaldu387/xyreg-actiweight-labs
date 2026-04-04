import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/uuidValidation';

export interface CompanyRoleItem {
  id: string;
  role_name: string;
  description: string | null;
  company_id: string;
  created_at: string;
}

export function useCompanyRolesList(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-roles-list', companyId],
    queryFn: async () => {
      if (!isValidUUID(companyId)) return [];
      
      const { data, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .order('role_name');
      
      if (error) throw error;
      return data as CompanyRoleItem[];
    },
    enabled: isValidUUID(companyId),
  });
}
