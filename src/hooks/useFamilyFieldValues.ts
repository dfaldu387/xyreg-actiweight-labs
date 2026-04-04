import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface FamilyFieldValue {
  id: string;
  basic_udi_di: string;
  company_id: string;
  field_key: string;
  field_value: Json;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Hook to fetch and manage shared product family field values.
 * Values are stored in the `family_field_values` table keyed by basic_udi_di + field_key.
 */
export function useFamilyFieldValues(basicUdiDi: string | null | undefined, companyId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['family-field-values', basicUdiDi];

  const { data: familyValues, isLoading } = useQuery<FamilyFieldValue[]>({
    queryKey,
    queryFn: async () => {
      if (!basicUdiDi || !companyId) return [];
      const { data, error } = await supabase
        .from('family_field_values')
        .select('*')
        .eq('basic_udi_di', basicUdiDi)
        .eq('company_id', companyId);

      if (error) {
        console.error('[useFamilyFieldValues] Error fetching:', error);
        throw error;
      }
      return (data as FamilyFieldValue[]) || [];
    },
    enabled: !!basicUdiDi && !!companyId,
  });

  /**
   * Get the family-level value for a given field key.
   */
  const getFamilyValue = (fieldKey: string): Json | undefined => {
    if (!familyValues) return undefined;
    const entry = familyValues.find(v => v.field_key === fieldKey);
    return entry?.field_value;
  };

  /**
   * Check if a family value exists for a given field key.
   */
  const hasFamilyValue = (fieldKey: string): boolean => {
    return getFamilyValue(fieldKey) !== undefined;
  };

  /**
   * Mutation to upsert a family field value.
   */
  const saveMutation = useMutation({
    mutationFn: async ({ fieldKey, fieldValue }: { fieldKey: string; fieldValue: Json }) => {
      if (!basicUdiDi || !companyId) throw new Error('Missing basicUdiDi or companyId');

      const { data: { user } } = await supabase.auth.getUser();

      // Try update first, then insert if no rows matched
      const { data: existing } = await supabase
        .from('family_field_values')
        .select('id')
        .eq('basic_udi_di', basicUdiDi)
        .eq('field_key', fieldKey)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('family_field_values')
          .update({
            field_value: fieldValue,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('family_field_values')
          .insert({
            basic_udi_di: basicUdiDi,
            company_id: companyId,
            field_key: fieldKey,
            field_value: fieldValue,
            updated_by: user?.id || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('[useFamilyFieldValues] Save error:', error);
      toast.error('Failed to save family value');
    },
  });

  const saveFamilyValue = (fieldKey: string, fieldValue: Json) => {
    saveMutation.mutate({ fieldKey, fieldValue });
  };

  return {
    familyValues,
    getFamilyValue,
    hasFamilyValue,
    saveFamilyValue,
    isSaving: saveMutation.isPending,
    isLoading,
  };
}
