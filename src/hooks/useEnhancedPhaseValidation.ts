
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  phaseId: string;
  phaseName: string;
}

export function useEnhancedPhaseValidation(companyId: string) {
  const [validationResults, setValidationResults] = useState<PhaseValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateCompanyPhases = async () => {
    if (!companyId) return;

    setIsValidating(true);
    try {
      // Get company phases - FIXED: Use company_phases
      const { data: phases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        throw phasesError;
      }

      const results: PhaseValidationResult[] = [];

      for (const phaseData of phases || []) {
        const phase = phaseData.company_phases;
        const issues: string[] = [];
        const warnings: string[] = [];

        // Validate phase documents
        const { data: documents } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .eq('phase_id', phase.id);

        if (!documents || documents.length === 0) {
          warnings.push('No documents assigned to this phase');
        } else if (documents.length > 50) {
          issues.push(`Too many documents (${documents.length}). Consider consolidation.`);
        }

        // Check for duplicate document names
        const docNames = documents?.map(d => d.name.toLowerCase()) || [];
        const duplicates = docNames.filter((name, index) => docNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
          issues.push(`Duplicate documents found: ${duplicates.length}`);
        }

        results.push({
          isValid: issues.length === 0,
          issues,
          warnings,
          phaseId: phase.id,
          phaseName: phase.name
        });
      }

      setValidationResults(results);

    } catch (error) {
      console.error('Error validating phases:', error);
      toast.error('Failed to validate phases');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      validateCompanyPhases();
    }
  }, [companyId]);

  return {
    validationResults,
    isValidating,
    revalidate: validateCompanyPhases
  };
}
