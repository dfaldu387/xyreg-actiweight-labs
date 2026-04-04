import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EndpointType = 'primary' | 'secondary';

export interface StandardEndpoint {
  id: string;
  company_id: string;
  endpoint_type: EndpointType;
  name: string;
  description?: string;
  measurement_criteria?: string;
  category?: string;
  regulatory_references: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useStandardEndpoints(companyId: string) {
  const [endpoints, setEndpoints] = useState<StandardEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_standard_endpoints')
        .select('*')
        .eq('company_id', companyId)
        .order('endpoint_type', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setEndpoints((data as StandardEndpoint[]) || []);
    } catch (err) {
      console.error('Error fetching standard endpoints:', err);
      setError('Failed to load standard endpoints');
      toast.error('Failed to load standard endpoints');
    } finally {
      setIsLoading(false);
    }
  };

  const createEndpoint = async (endpoint: Omit<StandardEndpoint, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_standard_endpoints')
        .insert({
          ...endpoint,
          company_id: companyId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEndpoints(prev => [...prev, data as StandardEndpoint]);
      toast.success('Endpoint created');
      return data;
    } catch (err) {
      console.error('Error creating endpoint:', err);
      toast.error('Failed to create endpoint');
      throw err;
    }
  };

  const updateEndpoint = async (id: string, updates: Partial<StandardEndpoint>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_standard_endpoints')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setEndpoints(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      toast.success('Endpoint updated');
    } catch (err) {
      console.error('Error updating endpoint:', err);
      toast.error('Failed to update endpoint');
      throw err;
    }
  };

  const deleteEndpoint = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_standard_endpoints')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEndpoints(prev => prev.filter(e => e.id !== id));
      toast.success('Endpoint deleted');
    } catch (err) {
      console.error('Error deleting endpoint:', err);
      toast.error('Failed to delete endpoint');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateEndpoint(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchEndpoints();
  }, [companyId]);

  const primaryEndpoints = endpoints.filter(e => e.endpoint_type === 'primary');
  const secondaryEndpoints = endpoints.filter(e => e.endpoint_type === 'secondary');
  const activeEndpointsCount = endpoints.filter(e => e.is_active).length;

  const getEndpointsByCategory = (category: string) => {
    return endpoints.filter(e => e.category === category);
  };

  return {
    endpoints,
    primaryEndpoints,
    secondaryEndpoints,
    isLoading,
    error,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleActive,
    getEndpointsByCategory,
    activeEndpointsCount,
    refetch: fetchEndpoints
  };
}
