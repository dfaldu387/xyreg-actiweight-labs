import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CroPartner {
  id: string;
  company_id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  specialty_areas: string[];
  standard_agreement_path: string | null;
  performance_notes: string | null;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
}

export function useCroPartners(companyId: string) {
  const [partners, setPartners] = useState<CroPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_cro_partners')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (fetchError) throw fetchError;

      setPartners((data as CroPartner[]) || []);
    } catch (err) {
      console.error('Error fetching CRO partners:', err);
      setError('Failed to load CRO partners');
      toast.error('Failed to load CRO partners');
    } finally {
      setIsLoading(false);
    }
  };

  const createPartner = async (partner: Omit<CroPartner, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_cro_partners')
        .insert({
          ...partner,
          company_id: companyId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPartners(prev => [...prev, data as CroPartner]);
      toast.success('CRO partner created');
      return data;
    } catch (err) {
      console.error('Error creating CRO partner:', err);
      toast.error('Failed to create CRO partner');
      throw err;
    }
  };

  const updatePartner = async (id: string, updates: Partial<CroPartner>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_cro_partners')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setPartners(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('CRO partner updated');
    } catch (err) {
      console.error('Error updating CRO partner:', err);
      toast.error('Failed to update CRO partner');
      throw err;
    }
  };

  const deletePartner = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_cro_partners')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPartners(prev => prev.filter(p => p.id !== id));
      toast.success('CRO partner deleted');
    } catch (err) {
      console.error('Error deleting CRO partner:', err);
      toast.error('Failed to delete CRO partner');
      throw err;
    }
  };

  const togglePreferred = async (id: string, isPreferred: boolean) => {
    await updatePartner(id, { is_preferred: isPreferred });
  };

  useEffect(() => {
    fetchPartners();
  }, [companyId]);

  const preferredPartners = partners.filter(p => p.is_preferred);

  return {
    partners,
    preferredPartners,
    isLoading,
    error,
    createPartner,
    updatePartner,
    deletePartner,
    togglePreferred,
    refetch: fetchPartners
  };
}
