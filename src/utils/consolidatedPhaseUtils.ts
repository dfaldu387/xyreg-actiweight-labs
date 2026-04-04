
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseIntegrityResult {
  company_name: string;
  product_name: string;
  action_taken: string;
  success: boolean;
  details: string;
}

export interface ProductCleanupResult {
  step: string;
  action_taken: string;
  count: number;
  details: string;
}

/**
 * Consolidated utility for ensuring phase integrity across companies
 * Replaces multiple old phase repair functions
 */
export async function ensureCompanyPhaseIntegrity(companyId?: string): Promise<{
  success: boolean;
  results: PhaseIntegrityResult[];
  totalRepaired: number;
}> {
  try {
    console.log(`[ConsolidatedPhaseUtils] Ensuring phase integrity for company: ${companyId || 'all'}`);

    const { data: results, error } = await supabase.rpc(
      'ensure_phase_integrity',
      { target_company_id: companyId || null }
    );

    if (error) {
      console.error('[ConsolidatedPhaseUtils] Phase integrity check failed:', error);
      toast.error('Failed to ensure phase integrity');
      return {
        success: false,
        results: [],
        totalRepaired: 0
      };
    }

    const totalRepaired = results?.filter((r: PhaseIntegrityResult) => r.success).length || 0;
    
    console.log(`[ConsolidatedPhaseUtils] Phase integrity completed. ${totalRepaired} products repaired`);
    
    if (totalRepaired > 0) {
      toast.success(`Successfully repaired ${totalRepaired} product phase assignments`);
    }

    return {
      success: true,
      results: results || [],
      totalRepaired
    };

  } catch (error) {
    console.error('[ConsolidatedPhaseUtils] Unexpected error:', error);
    toast.error('An unexpected error occurred during phase integrity check');
    return {
      success: false,
      results: [],
      totalRepaired: 0
    };
  }
}

/**
 * Consolidated utility for cleaning up product data
 * Replaces multiple old cleanup functions
 */
export async function cleanupProductData(productId: string): Promise<{
  success: boolean;
  results: ProductCleanupResult[];
  totalCleaned: number;
}> {
  try {
    console.log(`[ConsolidatedPhaseUtils] Cleaning up product data: ${productId}`);

    const { data: results, error } = await supabase.rpc(
      'cleanup_product_data',
      { target_product_id: productId }
    );

    if (error) {
      console.error('[ConsolidatedPhaseUtils] Product cleanup failed:', error);
      // toast.error('Failed to cleanup product data');
      return {
        success: false,
        results: [],
        totalCleaned: 0
      };
    }

    const totalCleaned = results?.reduce((sum: number, r: ProductCleanupResult) => sum + r.count, 0) || 0;
    
    console.log(`[ConsolidatedPhaseUtils] Product cleanup completed. ${totalCleaned} items processed`);

    return {
      success: true,
      results: results || [],
      totalCleaned
    };

  } catch (error) {
    console.error('[ConsolidatedPhaseUtils] Unexpected error:', error);
    toast.error('An unexpected error occurred during product cleanup');
    return {
      success: false,
      results: [],
      totalCleaned: 0
    };
  }
}

/**
 * Health check utility to validate system integrity
 */
export async function performSystemHealthCheck(companyId?: string): Promise<{
  success: boolean;
  issues: number;
  recommendations: string[];
}> {
  try {
    console.log(`[ConsolidatedPhaseUtils] Performing system health check`);

    // Check phase integrity
    const phaseResults = await ensureCompanyPhaseIntegrity(companyId);
    
    const issues = phaseResults.results.filter(r => !r.success).length;
    const recommendations: string[] = [];

    if (issues > 0) {
      recommendations.push(`${issues} products have phase assignment issues that need attention`);
    }

    if (phaseResults.totalRepaired > 0) {
      recommendations.push(`Automatically repaired ${phaseResults.totalRepaired} products`);
    }

    return {
      success: phaseResults.success,
      issues,
      recommendations
    };

  } catch (error) {
    console.error('[ConsolidatedPhaseUtils] Health check failed:', error);
    return {
      success: false,
      issues: -1,
      recommendations: ['System health check failed - please check logs']
    };
  }
}
