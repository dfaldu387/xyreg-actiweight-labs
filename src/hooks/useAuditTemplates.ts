
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAuditTemplates(companyId: string) {
  const [configuredTemplates, setConfiguredTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfiguredTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_audit_templates')
        .select(`
          *,
          audit_templates (*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching configured templates:', error);
        toast.error('Failed to load configured templates');
        return;
      }

      setConfiguredTemplates(data || []);
    } catch (error) {
      console.error('Error fetching configured templates:', error);
      toast.error('Failed to load configured templates');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]); // Memoize with proper dependencies

  useEffect(() => {
    if (companyId) {
      fetchConfiguredTemplates();
    }
  }, [fetchConfiguredTemplates, companyId]); // Properly depend on the memoized function

  return {
    configuredTemplates,
    isLoading,
    refetch: fetchConfiguredTemplates
  };
}

export function useStandardAuditTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStandardTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_templates')
          .select('*')
          .eq('source', 'standard')
          .eq('is_active', true)
          .order('template_name');

        if (error) {
          console.error('Error fetching standard templates:', error);
          toast.error('Failed to load standard templates');
          return;
        }

        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching standard templates:', error);
        toast.error('Failed to load standard templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandardTemplates();
  }, []);

  return {
    templates,
    isLoading
  };
}
