import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductFieldSuggestion {
  id: string;
  product_id: string;
  company_id: string;
  field_key: string;
  field_label: string;
  suggested_value: string;
  current_value: string | null;
  source: string;
  status: string;
  created_at: string;
}

export function useProductFieldSuggestions(productId?: string, companyId?: string) {
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['product-field-suggestions', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_field_suggestions')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProductFieldSuggestion[];
    },
    enabled: !!productId,
  });

  const acceptSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('product_field_suggestions')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-field-suggestions', productId] });
    },
  });

  const rejectSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('product_field_suggestions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-field-suggestions', productId] });
    },
  });

  const createSuggestions = useMutation({
    mutationFn: async (items: Array<{ field_key: string; field_label: string; suggested_value: string; current_value?: string }>) => {
      if (!productId || !companyId) throw new Error('Missing product or company ID');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete existing pending suggestions for these field keys
      const fieldKeys = items.map(i => i.field_key);
      await supabase
        .from('product_field_suggestions')
        .delete()
        .eq('product_id', productId)
        .eq('status', 'pending')
        .in('field_key', fieldKeys);

      const rows = items.map(item => ({
        product_id: productId,
        company_id: companyId,
        field_key: item.field_key,
        field_label: item.field_label,
        suggested_value: item.suggested_value,
        current_value: item.current_value || null,
        source: 'document_studio',
        status: 'pending',
        created_by: user?.id || null,
      }));

      const { error } = await supabase.from('product_field_suggestions').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-field-suggestions', productId] });
      toast.success('Field suggestions pushed to Device Information');
    },
    onError: (err: any) => {
      toast.error('Failed to push suggestions: ' + err.message);
    },
  });

  const getSuggestionForField = (fieldKey: string): ProductFieldSuggestion | undefined => {
    return suggestions.find(s => s.field_key === fieldKey);
  };

  const pendingCount = suggestions.length;

  return {
    suggestions,
    isLoading,
    pendingCount,
    acceptSuggestion,
    rejectSuggestion,
    createSuggestions,
    getSuggestionForField,
  };
}
