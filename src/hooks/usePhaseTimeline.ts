import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Phase {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  is_pre_launch: boolean;
}

interface Product {
  id: string;
  projected_launch_date?: string;
  actual_launch_date?: string;
}

export function usePhaseTimeline(productId: string) {
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, projected_launch_date, actual_launch_date')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId
  });

  const { data: phases } = useQuery({
    queryKey: ['phases', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, is_pre_launch')
        .eq('product_id', productId)
        .order('start_date');

      if (error) throw error;
      return data as Phase[];
    },
    enabled: !!productId
  });

  const timeline = useMemo(() => {
    if (!product || !phases) return null;

    const launchDate = product.actual_launch_date 
      ? new Date(product.actual_launch_date)
      : product.projected_launch_date 
        ? new Date(product.projected_launch_date)
        : null;

    const projectStart = phases
      .filter(p => p.start_date)
      .reduce((earliest, phase) => {
        const phaseStart = new Date(phase.start_date!);
        return !earliest || phaseStart < earliest ? phaseStart : earliest;
      }, null as Date | null);

    return {
      projectStartDate: projectStart,
      launchDate,
      phases: phases.map(phase => ({
        ...phase,
        startDate: phase.start_date ? new Date(phase.start_date) : null,
        endDate: phase.end_date ? new Date(phase.end_date) : null,
        durationMonths: phase.start_date && phase.end_date 
          ? Math.ceil((new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
          : 1
      }))
    };
  }, [product, phases]);

  return timeline;
}