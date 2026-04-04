import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type TriggerEvent = Database['public']['Enums']['clinical_notification_trigger'];

export interface NotificationRule {
  id: string;
  company_id: string;
  rule_name: string;
  trigger_event: TriggerEvent;
  trigger_conditions?: Record<string, any>;
  notification_recipients?: any[];
  notification_message?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationRules(companyId: string) {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_notification_rules')
        .select('*')
        .eq('company_id', companyId)
        .order('rule_name', { ascending: true });

      if (fetchError) throw fetchError;

      setRules((data as NotificationRule[]) || []);
    } catch (err) {
      console.error('Error fetching notification rules:', err);
      setError('Failed to load notification rules');
      toast.error('Failed to load notification rules');
    } finally {
      setIsLoading(false);
    }
  };

  const createRule = async (rule: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_notification_rules')
        .insert([{
          ...rule,
          company_id: companyId
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setRules(prev => [...prev, data as NotificationRule]);
      toast.success('Notification rule created');
      return data;
    } catch (err) {
      console.error('Error creating notification rule:', err);
      toast.error('Failed to create notification rule');
      throw err;
    }
  };

  const updateRule = async (id: string, updates: Partial<Omit<NotificationRule, 'id' | 'created_at' | 'updated_at' | 'company_id'>>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_notification_rules')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success('Notification rule updated');
    } catch (err) {
      console.error('Error updating notification rule:', err);
      toast.error('Failed to update notification rule');
      throw err;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_notification_rules')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Notification rule deleted');
    } catch (err) {
      console.error('Error deleting notification rule:', err);
      toast.error('Failed to delete notification rule');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateRule(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchRules();
  }, [companyId]);

  const activeRules = rules.filter(r => r.is_active);

  return {
    rules,
    activeRules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleActive,
    refetch: fetchRules
  };
}
