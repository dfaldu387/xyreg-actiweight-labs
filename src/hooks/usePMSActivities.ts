import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PMSActivityTemplate {
  id: string;
  company_id: string | null;
  market_code: string;
  device_class: string | null;
  activity_name: string;
  activity_type: 'event-based' | 'periodic' | 'continuous';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'annually' | 'on-demand' | null;
  days_before_report: number | null;
  description: string | null;
  regulatory_reference: string | null;
  is_mandatory: boolean;
  checklist_items: any[];
  document_templates: any[];
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface PMSActivityTracking {
  id: string;
  company_id: string;
  product_id: string;
  market_code: string;
  activity_template_id: string | null;
  activity_name: string;
  description: string | null;
  regulatory_reference: string | null;
  due_date: string | null;
  completion_date: string | null;
  status: 'pending' | 'in_progress' | 'complete' | 'overdue' | 'not_applicable';
  completed_by: string | null;
  notes: string | null;
  related_documents: any[];
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

// Fetch activity templates for a market and device class
export function usePMSActivityTemplates(marketCode: string, deviceClass: string | null) {
  return useQuery({
    queryKey: ['pms-activity-templates', marketCode, deviceClass],
    queryFn: async () => {
      let query = supabase
        .from('pms_activity_templates')
        .select('*')
        .eq('market_code', marketCode)
        .order('activity_name');

      if (deviceClass) {
        query = query.or(`device_class.eq.${deviceClass},device_class.is.null`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PMSActivityTemplate[];
    },
  });
}

// Fetch activity tracking for a product
export function usePMSActivityTracking(productId: string | undefined, marketCode?: string) {
  return useQuery({
    queryKey: ['pms-activity-tracking', productId, marketCode],
    queryFn: async () => {
      if (!productId) return [];
      
      let query = supabase
        .from('pms_activity_tracking')
        .select('*')
        .eq('product_id', productId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (marketCode) {
        query = query.eq('market_code', marketCode);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PMSActivityTracking[];
    },
    enabled: Boolean(productId)
  });
}

// Create activity tracking
export function useCreatePMSActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: Omit<PMSActivityTracking, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pms_activity_tracking')
        .insert(activity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pms-activity-tracking', variables.product_id] });
      toast.success('PMS activity created successfully');
    },
    onError: (error) => {
      console.error('Failed to create PMS activity:', error);
      toast.error('Failed to create PMS activity');
    }
  });
}

// Update activity tracking
export function useUpdatePMSActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PMSActivityTracking> & { id: string }) => {
      const { data, error } = await supabase
        .from('pms_activity_tracking')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pms-activity-tracking', data.product_id] });
      toast.success('PMS activity updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update PMS activity:', error);
      toast.error('Failed to update PMS activity');
    }
  });
}

// Delete activity tracking
export function useDeletePMSActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('pms_activity_tracking')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pms-activity-tracking', data.productId] });
      toast.success('PMS activity deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete PMS activity:', error);
      toast.error('Failed to delete PMS activity');
    }
  });
}
