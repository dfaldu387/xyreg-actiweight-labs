import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface BasicUDIAlias {
  id: string;
  company_id: string;
  basic_udi_di: string;
  alias: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to manage Basic UDI-DI aliases for a company
 * Allows users to set friendly names for Basic UDI-DI values
 */
export function useBasicUDIAliases(companyId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all aliases for the company
  const { data: aliases, isLoading, error } = useQuery({
    queryKey: ['basic-udi-aliases', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('basic_udi_aliases')
        .select('*')
        .eq('company_id', companyId)
        .order('basic_udi_di', { ascending: true });

      if (error) {
        console.error('[useBasicUDIAliases] Error fetching aliases:', error);
        throw error;
      }

      return data as BasicUDIAlias[];
    },
    enabled: !!companyId,
  });

  // Create a map for quick lookup
  const aliasMap = new Map<string, string>();
  const descriptionMap = new Map<string, string>();
  aliases?.forEach(alias => {
    aliasMap.set(alias.basic_udi_di, alias.alias);
    if (alias.description) {
      descriptionMap.set(alias.basic_udi_di, alias.description);
    }
  });

  // Get alias for a specific Basic UDI-DI
  const getAlias = (basicUdiDi: string): string | null => {
    return aliasMap.get(basicUdiDi) || null;
  };

  // Get description for a specific Basic UDI-DI
  const getDescription = (basicUdiDi: string): string | null => {
    return descriptionMap.get(basicUdiDi) || null;
  };

  // Save or update an alias
  const saveAliasMutation = useMutation({
    mutationFn: async ({ basicUdiDi, alias }: { basicUdiDi: string; alias: string }) => {
      if (!companyId) throw new Error('Company ID is required');

      // Check if alias already exists
      const existingAlias = aliases?.find(a => a.basic_udi_di === basicUdiDi);

      if (existingAlias) {
        // Update existing alias
        const { data, error } = await supabase
          .from('basic_udi_aliases')
          .update({ alias, updated_at: new Date().toISOString() })
          .eq('id', existingAlias.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new alias
        const { data, error } = await supabase
          .from('basic_udi_aliases')
          .insert({
            company_id: companyId,
            basic_udi_di: basicUdiDi,
            alias,
            created_by: user?.id || null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-udi-aliases', companyId] });
    },
    onError: (error) => {
      console.error('[useBasicUDIAliases] Error saving alias:', error);
    },
  });

  // Save or update a description
  const saveDescriptionMutation = useMutation({
    mutationFn: async ({ basicUdiDi, description }: { basicUdiDi: string; description: string }) => {
      if (!companyId) throw new Error('Company ID is required');

      const existingAlias = aliases?.find(a => a.basic_udi_di === basicUdiDi);

      if (existingAlias) {
        const { data, error } = await supabase
          .from('basic_udi_aliases')
          .update({ description, updated_at: new Date().toISOString() } as any)
          .eq('id', existingAlias.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('basic_udi_aliases')
          .insert({
            company_id: companyId,
            basic_udi_di: basicUdiDi,
            alias: basicUdiDi,
            description,
            created_by: user?.id || null,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-udi-aliases', companyId] });
    },
    onError: (error) => {
      console.error('[useBasicUDIAliases] Error saving description:', error);
    },
  });

  // Delete an alias
  const deleteAliasMutation = useMutation({
    mutationFn: async (basicUdiDi: string) => {
      if (!companyId) throw new Error('Company ID is required');

      const { error } = await supabase
        .from('basic_udi_aliases')
        .delete()
        .eq('company_id', companyId)
        .eq('basic_udi_di', basicUdiDi);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-udi-aliases', companyId] });
    },
    onError: (error) => {
      console.error('[useBasicUDIAliases] Error deleting alias:', error);
    },
  });

  return {
    aliases: aliases || [],
    aliasMap,
    descriptionMap,
    isLoading,
    error,
    getAlias,
    getDescription,
    saveAlias: saveAliasMutation.mutate,
    saveAliasAsync: saveAliasMutation.mutateAsync,
    saveDescription: saveDescriptionMutation.mutate,
    saveDescriptionAsync: saveDescriptionMutation.mutateAsync,
    deleteAlias: deleteAliasMutation.mutate,
    isSaving: saveAliasMutation.isPending,
    isSavingDescription: saveDescriptionMutation.isPending,
    isDeleting: deleteAliasMutation.isPending,
  };
}
