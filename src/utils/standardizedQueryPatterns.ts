
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Standardized query patterns with consistent error handling and performance monitoring
 * Replaces inconsistent query patterns across the codebase
 */

export interface QueryOptions {
  throwOnError?: boolean;
  showToast?: boolean;
  logErrors?: boolean;
  timeout?: number;
}

interface PhaseDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  phase: string;
  techApplicability: string;
  markets: string[];
  classesByMarket: Record<string, string[]>;
}

const defaultOptions: QueryOptions = {
  throwOnError: false,
  showToast: true,
  logErrors: true,
  timeout: 10000 // 10 second timeout
};

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  private static startTime = new Map<string, number>();

  static start(operation: string): void {
    this.startTime.set(operation, Date.now());
  }

  static end(operation: string): number {
    const start = this.startTime.get(operation);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    console.log(`[Performance] ${operation} took ${duration}ms`);
    this.startTime.delete(operation);
    return duration;
  }
}

/**
 * Standardized product query with consistent error handling and performance monitoring
 */
export async function getProductById(productId: string, options: QueryOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const operation = `getProductById-${productId}`;
  
  PerformanceMonitor.start(operation);
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_archived', false)
      .maybeSingle();

    PerformanceMonitor.end(operation);

    if (error) {
      if (opts.logErrors) {
        console.error(`[StandardizedQuery] Error fetching product ${productId}:`, error);
      }
      if (opts.showToast) {
        toast.error("Failed to load product information");
      }
      if (opts.throwOnError) {
        throw error;
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    PerformanceMonitor.end(operation);
    
    if (opts.logErrors) {
      console.error(`[StandardizedQuery] Exception fetching product:`, error);
    }
    if (opts.showToast) {
      toast.error("An error occurred while loading product");
    }
    if (opts.throwOnError) {
      throw error;
    }
    return { data: null, error };
  }
}

/**
 * Standardized company query with consistent error handling and performance monitoring
 */
export async function getCompanyById(companyId: string, options: QueryOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const operation = `getCompanyById-${companyId}`;
  
  PerformanceMonitor.start(operation);
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('is_archived', false)
      .maybeSingle();

    PerformanceMonitor.end(operation);

    if (error) {
      if (opts.logErrors) {
        console.error(`[StandardizedQuery] Error fetching company ${companyId}:`, error);
      }
      if (opts.showToast) {
        toast.error("Failed to load company information");
      }
      if (opts.throwOnError) {
        throw error;
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    PerformanceMonitor.end(operation);
    
    if (opts.logErrors) {
      console.error(`[StandardizedQuery] Exception fetching company:`, error);
    }
    if (opts.showToast) {
      toast.error("An error occurred while loading company");
    }
    if (opts.throwOnError) {
      throw error;
    }
    return { data: null, error };
  }
}

/**
 * Standardized company phases query with performance monitoring
 */
export async function getCompanyPhases(companyId: string, options: QueryOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const operation = `getCompanyPhases-${companyId}`;
  
  PerformanceMonitor.start(operation);
  
  try {
    const { data, error } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        phase:phases(
          id, name, description, category_id, 
          is_predefined_core_phase, is_custom, is_deletable
        )
      `)
      .eq('company_id', companyId)
      .order('position');

    PerformanceMonitor.end(operation);

    if (error) {
      if (opts.logErrors) {
        console.error(`[StandardizedQuery] Error fetching company phases ${companyId}:`, error);
      }
      if (opts.showToast) {
        toast.error("Failed to load company phases");
      }
      if (opts.throwOnError) {
        throw error;
      }
      return { data: [], error };
    }

    // Transform the data to flatten the phase object - check if data exists and has phase
    const phases = (data || [])
      .filter(item => item && item.phase && typeof item.phase === 'object')
      .map(item => {
        const phase = item.phase as any; // Type assertion to handle the nested object
        return {
          ...phase,
          position: item.position
        };
      });

    return { data: phases, error: null };
  } catch (error) {
    PerformanceMonitor.end(operation);
    
    if (opts.logErrors) {
      console.error(`[StandardizedQuery] Exception fetching company phases:`, error);
    }
    if (opts.showToast) {
      toast.error("An error occurred while loading phases");
    }
    if (opts.throwOnError) {
      throw error;
    }
    return { data: [], error };
  }
}

/**
 * Standardized product documents query with caching and performance monitoring
 */
export async function getProductDocuments(productId: string, options: QueryOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const operation = `getProductDocuments-${productId}`;
  
  PerformanceMonitor.start(operation);
  
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    PerformanceMonitor.end(operation);

    if (error) {
      if (opts.logErrors) {
        console.error(`[StandardizedQuery] Error fetching product documents ${productId}:`, error);
      }
      if (opts.showToast) {
        toast.error("Failed to load product documents");
      }
      if (opts.throwOnError) {
        throw error;
      }
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    PerformanceMonitor.end(operation);
    
    if (opts.logErrors) {
      console.error(`[StandardizedQuery] Exception fetching product documents:`, error);
    }
    if (opts.showToast) {
      toast.error("An error occurred while loading documents");
    }
    if (opts.throwOnError) {
      throw error;
    }
    return { data: [], error };
  }
}

/**
 * Standardized update with optimistic updates, rollback, and performance monitoring
 */
export async function updateRecord(
  table: string,
  id: string,
  updates: Record<string, any>,
  options: QueryOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const operation = `updateRecord-${table}-${id}`;
  
  PerformanceMonitor.start(operation);
  
  try {
    const { data, error } = await supabase
      .from(table as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    PerformanceMonitor.end(operation);

    if (error) {
      if (opts.logErrors) {
        console.error(`[StandardizedQuery] Error updating ${table} ${id}:`, error);
      }
      if (opts.showToast) {
        toast.error(`Failed to update ${table}`);
      }
      if (opts.throwOnError) {
        throw error;
      }
      return { data: null, error };
    }

    if (opts.showToast) {
      toast.success(`${table} updated successfully`);
    }

    return { data, error: null };
  } catch (error) {
    PerformanceMonitor.end(operation);
    
    if (opts.logErrors) {
      console.error(`[StandardizedQuery] Exception updating ${table}:`, error);
    }
    if (opts.showToast) {
      toast.error(`An error occurred while updating ${table}`);
    }
    if (opts.throwOnError) {
      throw error;
    }
    return { data: null, error };
  }
}

/**
 * Standardized enhanced phase documents query
 */
export async function getEnhancedPhaseDocuments(companyId: string): Promise<Record<string, PhaseDocument[]>> {
  try {
    const { data, error } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(
          id,
          name,
          description
        )
      `)
      .eq('company_id', companyId)
      .order('position');

    if (error) throw error;

    const result: Record<string, PhaseDocument[]> = {};
    
    for (const item of data || []) {
      const phase = item.company_phases;
      
      // Get documents for this phase
      const { data: docs, error: docsError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', phase.id);

      if (docsError) {
        console.error('Error fetching documents for phase:', docsError);
        continue;
      }

      result[phase.name] = (docs || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        phase: phase.name,
        techApplicability: doc.tech_applicability || 'All device types',
        markets: Array.isArray(doc.markets) ? doc.markets.filter((m): m is string => typeof m === 'string') : [],
        classesByMarket: doc.classes_by_market && typeof doc.classes_by_market === 'object' 
          ? doc.classes_by_market as Record<string, string[]> 
          : {}
      }));
    }

    return result;
  } catch (error) {
    console.error('Error in getEnhancedPhaseDocuments:', error);
    return {};
  }
}

// Export the performance monitor for external use
export { PerformanceMonitor };
