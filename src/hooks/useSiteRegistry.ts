import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClinicalSite {
  id: string;
  company_id: string;
  site_name: string;
  location: string;
  pi_name?: string;
  pi_email?: string;
  pi_phone?: string;
  specialty?: string;
  capabilities?: string[];
  qualification_status?: string;
  previous_trials_count?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSiteRegistry(companyId: string) {
  const [sites, setSites] = useState<ClinicalSite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_site_registry')
        .select('*')
        .eq('company_id', companyId)
        .order('site_name', { ascending: true });

      if (fetchError) throw fetchError;

      setSites((data as ClinicalSite[]) || []);
    } catch (err) {
      console.error('Error fetching clinical sites:', err);
      setError('Failed to load clinical sites');
      toast.error('Failed to load clinical sites');
    } finally {
      setIsLoading(false);
    }
  };

  const createSite = async (site: Omit<ClinicalSite, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_site_registry')
        .insert({
          ...site,
          company_id: companyId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSites(prev => [...prev, data as ClinicalSite]);
      toast.success('Clinical site added');
      return data;
    } catch (err) {
      console.error('Error creating site:', err);
      toast.error('Failed to create clinical site');
      throw err;
    }
  };

  const updateSite = async (id: string, updates: Partial<ClinicalSite>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_site_registry')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Clinical site updated');
    } catch (err) {
      console.error('Error updating site:', err);
      toast.error('Failed to update clinical site');
      throw err;
    }
  };

  const deleteSite = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_site_registry')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSites(prev => prev.filter(s => s.id !== id));
      toast.success('Clinical site deleted');
    } catch (err) {
      console.error('Error deleting site:', err);
      toast.error('Failed to delete clinical site');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateSite(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchSites();
  }, [companyId]);

  const activeSites = sites.filter(s => s.is_active);
  const qualifiedSites = sites.filter(s => s.qualification_status === 'qualified');

  return {
    sites,
    activeSites,
    qualifiedSites,
    isLoading,
    error,
    createSite,
    updateSite,
    deleteSite,
    toggleActive,
    refetch: fetchSites
  };
}
