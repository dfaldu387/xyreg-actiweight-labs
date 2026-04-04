import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { pmsEscalationService, EscalationResult } from '@/services/pmsEscalationService';

export interface PMSReport {
  id: string;
  company_id: string;
  product_id: string;
  report_type: 'PSUR' | 'PMSR' | 'On-Demand' | 'Other';
  submission_date: string;
  reporting_period_start?: string;
  reporting_period_end?: string;
  regulatory_body?: string;
  market_code?: string;
  submission_status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'under_review';
  document_id?: string;
  notes?: string;
  next_due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // New fields for checklist tracking
  checklist_completion_percentage?: number;
  preparation_start_date?: string;
  review_date?: string;
  approval_date?: string;
  attachments?: any[];
}

export interface PMSEvent {
  id: string;
  company_id: string;
  product_id: string;
  event_type: 'complaint' | 'adverse_event' | 'device_malfunction' | 'near_miss' | 'literature_finding' | 'customer_feedback' | 'other';
  event_date: string;
  severity?: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  investigation_status: 'open' | 'investigating' | 'closed' | 'escalated';
  corrective_actions?: string;
  preventive_actions?: string;
  root_cause?: string;
  reporter_name?: string;
  reporter_contact?: string;
  market_code?: string;
  is_reportable: boolean;
  reported_to_authority: boolean;
  authority_reference?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Fetch PMS reports for a product
export function usePMSReports(productId: string | undefined) {
  return useQuery({
    queryKey: ['pms-reports', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('pms_reports')
        .select('*')
        .eq('product_id', productId)
        .order('submission_date', { ascending: false });
      
      if (error) throw error;
      return data as PMSReport[];
    },
    enabled: Boolean(productId)
  });
}

// Fetch PMS events for a product
export function usePMSEvents(productId: string | undefined) {
  return useQuery({
    queryKey: ['pms-events', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('pms_events')
        .select('*')
        .eq('product_id', productId)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as PMSEvent[];
    },
    enabled: Boolean(productId)
  });
}

// Fetch PMS reports for a company (all products)
export function useCompanyPMSReports(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-pms-reports', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('pms_reports')
        .select('*, products(name)')
        .eq('company_id', companyId)
        .order('submission_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(companyId)
  });
}

// Fetch PMS events for a company (all products)
export function useCompanyPMSEvents(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-pms-events', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('pms_events')
        .select('*, products(name)')
        .eq('company_id', companyId)
        .order('event_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(companyId)
  });
}

// Create PMS report mutation
export function useCreatePMSReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: Omit<PMSReport, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pms_reports')
        .insert(report)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pms-reports', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['company-pms-reports', variables.company_id] });
      toast.success('PMS report logged successfully');
    },
    onError: () => {
      toast.error('Failed to log PMS report');
    }
  });
}

// Create PMS event mutation with escalation
export function useCreatePMSEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<PMSEvent, 'id' | 'created_at' | 'updated_at'>): Promise<{ event: any; escalation: EscalationResult }> => {
      const { data, error } = await supabase
        .from('pms_events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;

      // Run escalation evaluation
      const escalation = await pmsEscalationService.evaluateEscalation({
        id: data.id,
        company_id: data.company_id,
        product_id: data.product_id,
        event_type: data.event_type,
        severity: data.severity,
        description: data.description,
      });

      return { event: data, escalation };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pms-events', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['company-pms-events', variables.company_id] });
      
      // Invalidate CAPA/CCR caches if records were created
      if (result.escalation.capaId) {
        queryClient.invalidateQueries({ queryKey: ['capas'] });
        queryClient.invalidateQueries({ queryKey: ['capa-records'] });
      }
      if (result.escalation.ccrId) {
        queryClient.invalidateQueries({ queryKey: ['ccrs'] });
      }
      
      toast.success('PMS event logged successfully');
    },
    onError: () => {
      toast.error('Failed to log PMS event');
    }
  });
}
