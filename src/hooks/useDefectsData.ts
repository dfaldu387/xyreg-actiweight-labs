import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DefectRecord, CreateDefectInput, UpdateDefectInput, DefectAnalytics, DefectStatus, DefectSeverity } from '@/types/defect';
import { toast } from 'sonner';

// Fetch defects for a product
export function useDefectsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['defects', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('defects')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DefectRecord[];
    },
    enabled: !!productId,
  });
}

// Create defect mutation
export function useCreateDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDefectInput) => {
      const { data, error } = await supabase
        .from('defects')
        .insert({
          ...input,
          status: 'open' as string,
          priority: input.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DefectRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['defects', data.product_id] });
      toast.success(`Defect ${data.defect_id} created`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create defect: ${error.message}`);
    },
  });
}

// Update defect mutation
export function useUpdateDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDefectInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('defects')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DefectRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['defects', data.product_id] });
      toast.success('Defect updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update defect: ${error.message}`);
    },
  });
}

// Compute analytics from defect list
export function computeDefectAnalytics(defects: DefectRecord[]): DefectAnalytics {
  const byStatus: Record<DefectStatus, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  const bySeverity: Record<DefectSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  let withCapa = 0, withCcr = 0, withHazard = 0;

  for (const d of defects) {
    if (byStatus[d.status as DefectStatus] !== undefined) byStatus[d.status as DefectStatus]++;
    if (bySeverity[d.severity as DefectSeverity] !== undefined) bySeverity[d.severity as DefectSeverity]++;
    if (d.linked_capa_id) withCapa++;
    if (d.linked_ccr_id) withCcr++;
    if (d.linked_hazard_id) withHazard++;
  }

  return { total: defects.length, byStatus, bySeverity, withCapa, withCcr, withHazard };
}

// Generate next defect ID
export async function generateDefectId(companyId: string): Promise<string> {
  const { count, error } = await supabase
    .from('defects')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (error) throw error;
  const nextNum = (count || 0) + 1;
  return `DEF-${String(nextNum).padStart(3, '0')}`;
}
