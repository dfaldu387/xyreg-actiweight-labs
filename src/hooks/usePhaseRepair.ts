
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseRepairResult {
  success: boolean;
  repairedCount: number;
  errors: string[];
  details?: string[];
}

export interface PhaseIntegrityIssue {
  type: string;
  count: number;
  description: string;
  details?: any[];
}

export function usePhaseRepair(companyId: string) {
  const [isRepairing, setIsRepairing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastRepairResult, setLastRepairResult] = useState<PhaseRepairResult | null>(null);
  const [integrityIssues, setIntegrityIssues] = useState<PhaseIntegrityIssue[]>([]);
  const [hasIssues, setHasIssues] = useState(false);
  const [totalIssueCount, setTotalIssueCount] = useState(0);

  const validateIntegrity = useCallback(async () => {
    if (!companyId) return;
    
    setIsValidating(true);
    try {
      console.log(`[PhaseRepair] Validating integrity for company: ${companyId}`);
      
      const issues: PhaseIntegrityIssue[] = [];
      
      // Check for products without current phase
      const { data: productsWithoutPhase, error: error1 } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .is('current_lifecycle_phase', null);
        
      if (error1) {
        console.error('Error checking products without phase:', error1);
      } else if (productsWithoutPhase && productsWithoutPhase.length > 0) {
        issues.push({
          type: 'missing_current_phase',
          count: productsWithoutPhase.length,
          description: 'Products without current lifecycle phase',
          details: productsWithoutPhase
        });
      }
      
      // Check for products with invalid phases
      const { data: companyPhases, error: error2 } = await supabase
        .from('company_chosen_phases')
        .select(`
          phases!inner(name)
        `)
        .eq('company_id', companyId);
        
      if (error2) {
        console.error('Error checking company phases:', error2);
      } else if (companyPhases) {
        const validPhaseNames = companyPhases.map(cp => (cp as any).phases.name);
        
        const { data: productsWithInvalidPhase, error: error3 } = await supabase
          .from('products')
          .select('id, name, current_lifecycle_phase')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .not('current_lifecycle_phase', 'is', null);
          
        if (error3) {
          console.error('Error checking products with invalid phases:', error3);
        } else if (productsWithInvalidPhase) {
          const invalidProducts = productsWithInvalidPhase.filter(p => 
            p.current_lifecycle_phase && !validPhaseNames.includes(p.current_lifecycle_phase)
          );
          
          if (invalidProducts.length > 0) {
            issues.push({
              type: 'invalid_phase',
              count: invalidProducts.length,
              description: 'Products with invalid phases',
              details: invalidProducts
            });
          }
        }
      }
      
      setIntegrityIssues(issues);
      setHasIssues(issues.length > 0);
      setTotalIssueCount(issues.reduce((total, issue) => total + issue.count, 0));
      
      console.log(`[PhaseRepair] Validation complete. Issues found: ${issues.length > 0}, Total count: ${issues.reduce((total, issue) => total + issue.count, 0)}`);
      
      if (issues.length > 0) {
        console.log('[PhaseRepair] Issues by type:', issues.map(issue => ({ type: issue.type, count: issue.count })));
      }
    } catch (error) {
      console.error('[PhaseRepair] Error during validation:', error);
      toast.error('Failed to validate phase integrity');
    } finally {
      setIsValidating(false);
    }
  }, [companyId]);

  const runRepair = useCallback(async (): Promise<PhaseRepairResult> => {
    if (!companyId) {
      const result = { success: false, repairedCount: 0, errors: ['Company ID not available'] };
      setLastRepairResult(result);
      return result;
    }
    
    setIsRepairing(true);
    try {
      console.log(`[PhaseRepair] Starting repair for company: ${companyId}`);
      
      let repairedCount = 0;
      const errors: string[] = [];
      const details: string[] = [];
      
      // Get the first available phase for this company
      const { data: firstPhase, error: phaseError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position')
        .limit(1)
        .single();
        
      if (phaseError || !firstPhase) {
        const error = 'No phases configured for this company';
        errors.push(error);
        const result = { success: false, repairedCount: 0, errors };
        setLastRepairResult(result);
        return result;
      }
      
      // Repair products without current phase
      const { data: productsToRepair, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .or('current_lifecycle_phase.is.null,current_lifecycle_phase.eq.');
        
      if (productsError) {
        errors.push(`Error fetching products to repair: ${productsError.message}`);
      } else if (productsToRepair) {
        for (const product of productsToRepair) {
          try {
            // Update product's current_lifecycle_phase
            const { error: updateError } = await supabase
              .from('products')
              .update({ current_lifecycle_phase: (firstPhase as any).phases.name })
              .eq('id', product.id);
              
            if (updateError) {
              errors.push(`Error updating product phase for ${product.name}: ${updateError.message}`);
              continue;
            }
            
            repairedCount++;
            details.push(`Assigned phase "${(firstPhase as any).phases.name}" to product "${product.name}"`);
            console.log(`[PhaseRepair] Repaired product: ${product.name}`);
          } catch (error) {
            const errorMsg = `Unexpected error repairing ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }
      
      const result: PhaseRepairResult = {
        success: errors.length === 0,
        repairedCount,
        errors,
        details
      };
      
      setLastRepairResult(result);
      
      if (result.success) {
        console.log(`[PhaseRepair] Repair completed successfully. Repaired: ${result.repairedCount} items`);
        toast.success(`Successfully repaired ${result.repairedCount} items`);
        
        // Re-validate after repair
        setTimeout(() => {
          validateIntegrity();
        }, 1000);
      } else {
        console.error('[PhaseRepair] Repair failed:', result.errors);
        toast.error('Some repairs failed. Check the details below.');
      }
      
      return result;
    } catch (error) {
      console.error('[PhaseRepair] Error during repair:', error);
      const result = { 
        success: false, 
        repairedCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error during repair'] 
      };
      setLastRepairResult(result);
      toast.error('Repair operation failed');
      return result;
    } finally {
      setIsRepairing(false);
    }
  }, [companyId, validateIntegrity]);

  const clearRepairResult = useCallback(() => {
    setLastRepairResult(null);
  }, []);

  return {
    isRepairing,
    isValidating,
    lastRepairResult,
    integrityIssues,
    hasIssues,
    totalIssueCount,
    runRepair,
    validateIntegrity,
    clearRepairResult
  };
}
