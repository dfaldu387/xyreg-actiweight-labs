import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the set of enabled gap analysis framework names for a given company and scope.
 * Returns a Set<string> of framework names like "MDR Annex II", "IEC 62304", etc.
 */
export function useEnabledGapFrameworks(companyId: string | undefined, scope: 'product' | 'company' = 'product') {
  return useQuery({
    queryKey: ['enabled-gap-frameworks', companyId, scope],
    queryFn: async () => {
      if (!companyId) return new Set<string>();

      // 1. Get explicitly enabled frameworks for this company
      const { data, error } = await supabase
        .from('company_gap_templates')
        .select('template_id, gap_analysis_templates!inner(framework, scope)')
        .eq('company_id', companyId)
        .eq('is_enabled', true)
        .eq('gap_analysis_templates.scope', scope);

      if (error) throw error;

      const frameworks = new Set<string>();
      (data || []).forEach((t: any) => {
        const fw = t.gap_analysis_templates?.framework;
        if (fw) frameworks.add(fw);
      });

      // 2. Always include templates with auto_enable_condition = 'always'
      const { data: alwaysTemplates, error: alwaysError } = await supabase
        .from('gap_analysis_templates')
        .select('framework')
        .eq('auto_enable_condition', 'always')
        .eq('scope', scope)
        .eq('is_active', true);

      if (!alwaysError && alwaysTemplates) {
        alwaysTemplates.forEach((t: any) => {
          if (t.framework) frameworks.add(t.framework);
        });
      }

      return frameworks;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
