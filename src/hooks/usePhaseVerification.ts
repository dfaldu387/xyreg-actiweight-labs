
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseVerificationResult {
  productId: string;
  productName: string;
  companyName: string;
  isConsistent: boolean;
  issues: string[];
  currentPhase?: string;
  expectedPhase?: string;
  currentPhaseName?: string;
}

export function usePhaseVerification(companyId?: string, autoVerify: boolean = false) {
  const [results, setResults] = useState<PhaseVerificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting phase verification for company:', companyId);
      
      // Get all products for the company with their current phases
      const { data: products, error: productError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          current_lifecycle_phase, 
          company_id,
          companies!inner(name)
        `)
        .eq('company_id', companyId || '')
        .eq('is_archived', false);
        
      if (productError) {
        throw new Error(`Failed to fetch products: ${productError.message}`);
      }
      
      const verificationResults: PhaseVerificationResult[] = [];
      
      for (const product of products || []) {
        const issues: string[] = [];
        let isConsistent = true;
        
        // Check if product has a valid current phase
        if (!product.current_lifecycle_phase) {
          issues.push('No current phase assigned');
          isConsistent = false;
        } else {
          // Check if the current phase exists in company's chosen phases
          const { data: validPhase, error: phaseError } = await supabase
            .from('company_chosen_phases')
            .select(`
              phases!inner(name)
            `)
            .eq('company_id', product.company_id)
            .eq('phases.name', product.current_lifecycle_phase)
            .single();
            
          if (phaseError || !validPhase) {
            issues.push(`Current phase "${product.current_lifecycle_phase}" is not valid for this company`);
            isConsistent = false;
          }
        }
        
        verificationResults.push({
          productId: product.id,
          productName: product.name,
          companyName: (product as any).companies?.name || 'Unknown',
          isConsistent,
          issues,
          currentPhase: product.current_lifecycle_phase,
          expectedPhase: product.current_lifecycle_phase,
          currentPhaseName: product.current_lifecycle_phase
        });
      }
      
      setResults(verificationResults);
      
      const inconsistentCount = verificationResults.filter(r => !r.isConsistent).length;
      
      if (inconsistentCount === 0) {
        toast.success(`All ${verificationResults.length} products have consistent phase data`);
      } else {
        toast.warning(`${inconsistentCount} products have phase inconsistencies`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify phase consistency';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySpecific = async (productNames: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const verificationResults = await verifySpecificProducts(productNames);
      setResults(verificationResults);
      
      const inconsistentCount = verificationResults.filter(r => !r.isConsistent).length;
      
      if (inconsistentCount === 0) {
        toast.success(`All ${verificationResults.length} specified products have consistent phase data`);
      } else {
        toast.warning(`${inconsistentCount} of the specified products have phase inconsistencies`);
      }
      
      return verificationResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify specific products';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const verifySpecificProducts = async (productNames: string[]): Promise<PhaseVerificationResult[]> => {
    // Get products by name
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        current_lifecycle_phase, 
        company_id,
        companies!inner(name)
      `)
      .in('name', productNames)
      .eq('is_archived', false);
      
    if (productError) {
      throw new Error(`Failed to fetch products: ${productError.message}`);
    }
    
    const results: PhaseVerificationResult[] = [];
    
    for (const product of products || []) {
      const issues: string[] = [];
      let isConsistent = true;
      
      if (!product.current_lifecycle_phase) {
        issues.push('No current phase assigned');
        isConsistent = false;
      }
      
      results.push({
        productId: product.id,
        productName: product.name,
        companyName: (product as any).companies?.name || 'Unknown',
        isConsistent,
        issues,
        currentPhase: product.current_lifecycle_phase,
        expectedPhase: product.current_lifecycle_phase,
        currentPhaseName: product.current_lifecycle_phase
      });
    }
    
    return results;
  };

  useEffect(() => {
    if (autoVerify && companyId) {
      runVerification();
    }
  }, [companyId, autoVerify]);

  return {
    results,
    isLoading,
    error,
    runVerification,
    verifySpecific,
    inconsistentProducts: results.filter(r => !r.isConsistent),
    consistentProducts: results.filter(r => r.isConsistent)
  };
}
