import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { NotifiedBody } from '@/types/notifiedBody';
import { isValidUUID } from '@/utils/uuidValidation';

interface CompanyInfo {
  id: string;
  name: string;
  country?: string;
  address?: string;
  notified_body_id?: string;
  notifiedBody?: NotifiedBody;
}

export function useCompanyInfo(explicitCompanyId?: string) {
  const { companyId: contextCompanyId } = useCompany();
  const companyId = explicitCompanyId || contextCompanyId;

  return useQuery({
    queryKey: ['company-info', companyId],
    queryFn: async (): Promise<CompanyInfo | null> => {
      if (!isValidUUID(companyId)) return null;

      const { data, error } = await supabase
        .from('companies')
        .select(`
          id, 
          name, 
          country, 
          address, 
          notified_body_id,
          notified_bodies!companies_notified_body_id_fkey (
            id,
            name,
            nb_number,
            scope_mdr,
            scope_ivdr,
            scope_high_risk_active_implantables,
            scope_high_risk_implants_non_active,
            scope_medical_software,
            scope_sterilization_methods,
            scope_drug_device_combinations,
            address,
            contact_number,
            email,
            website,
            country,
            data_source
          )
        `)
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('[useCompanyInfo] Error fetching company info:', error);
        throw error;
      }

      // Transform the notified body data if it exists
      let notifiedBody: NotifiedBody | undefined;
      if (data.notified_bodies) {
        const nbData = data.notified_bodies;
        notifiedBody = {
          id: nbData.id,
          name: nbData.name,
          nb_number: nbData.nb_number,
          scope: {
            mdr: nbData.scope_mdr,
            ivdr: nbData.scope_ivdr,
            highRiskActiveImplantables: nbData.scope_high_risk_active_implantables,
            highRiskImplantsNonActive: nbData.scope_high_risk_implants_non_active,
            medicalSoftware: nbData.scope_medical_software,
            sterilizationMethods: nbData.scope_sterilization_methods,
            drugDeviceCombinations: nbData.scope_drug_device_combinations,
          },
          address: nbData.address,
          contactNumber: nbData.contact_number,
          email: nbData.email,
          website: nbData.website,
          country: nbData.country,
          source: nbData.data_source === 'manual_entry' ? 'manual' : 'database',
          data_source: (nbData.data_source as 'official_eu_nando' | 'manual_entry' | 'custom_import') || 'official_eu_nando'
        };
      }

      const result = {
        id: data.id,
        name: data.name,
        country: data.country,
        address: data.address,
        notified_body_id: data.notified_body_id,
        notifiedBody
      };

      return result;
    },
    enabled: isValidUUID(companyId),
    // Ensure changes in Company Settings (e.g., Notified Body selection) are reflected
    // immediately when users navigate back to places that display company info.
    refetchOnMount: 'always',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
