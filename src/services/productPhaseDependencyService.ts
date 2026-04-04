import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProductDependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export interface ProductPhaseDependency {
  id: string;
  product_id: string;
  source_phase_id: string;  // lifecycle_phases.id
  target_phase_id: string;  // lifecycle_phases.id
  dependency_type: ProductDependencyType;
  lag_days: number;
  created_at: string;
  updated_at: string;
  source_phase_name?: string;
  target_phase_name?: string;
}

export interface CreateProductDependencyData {
  product_id: string;
  source_phase_id: string;
  target_phase_id: string;
  dependency_type: ProductDependencyType;
  lag_days?: number;
}

export interface ProductDependencyResult {
  success: boolean;
  data?: ProductPhaseDependency;
  error?: string;
}

export interface ProductDependenciesResult {
  success: boolean;
  dependencies?: ProductPhaseDependency[];
  error?: string;
}

export interface InitializationResult {
  success: boolean;
  initializedCount?: number;
  skippedCount?: number;
  error?: string;
}

/**
 * Service class for managing product-specific phase dependencies
 */
export class ProductPhaseDependencyService {
  
  /**
   * Get all dependencies for a specific product
   */
  static async getProductDependencies(productId: string): Promise<ProductDependenciesResult> {
    try {
      // First get the dependencies
      const { data: dependenciesData, error } = await supabase
        .from('product_phase_dependencies')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[ProductPhaseDependencyService] Error fetching dependencies:', error);
        return { success: false, error: error.message };
      }

      if (!dependenciesData || dependenciesData.length === 0) {
        return { success: true, dependencies: [] };
      }

      let dependencies = dependenciesData;

      // Get all unique phase IDs
      const phaseIds = new Set<string>();
      dependencies.forEach(dep => {
        phaseIds.add(dep.source_phase_id);
        phaseIds.add(dep.target_phase_id);
      });
      
      // Debug: Check what phases actually exist for this product
      const { data: allProductPhases, error: allPhasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id')
        .eq('product_id', productId);
      
      if (!allPhasesError) {
        // Check for orphaned dependencies (dependencies referencing non-existent phases)
        const existingPhaseIds = new Set(allProductPhases.map(p => p.id));
        const orphanedDependencies = dependencies.filter(dep => 
          !existingPhaseIds.has(dep.source_phase_id) || !existingPhaseIds.has(dep.target_phase_id)
        );
        
        if (orphanedDependencies.length > 0) {
          console.warn(`[ProductPhaseDependencyService] Found ${orphanedDependencies.length} orphaned dependencies referencing non-existent phases`);
          console.warn('[ProductPhaseDependencyService] Orphaned dependencies:', orphanedDependencies.map(dep => ({
            id: dep.id,
            source_phase_id: dep.source_phase_id,
            target_phase_id: dep.target_phase_id
          })));
          
          // Clean up orphaned dependencies
          const orphanedIds = orphanedDependencies.map(dep => dep.id);
          const { error: deleteError } = await supabase
            .from('product_phase_dependencies')
            .delete()
            .in('id', orphanedIds);
          
          if (deleteError) {
            console.error('[ProductPhaseDependencyService] Error cleaning up orphaned dependencies:', deleteError);
          } else {
            // Remove orphaned dependencies from the list
            dependencies = dependencies.filter(dep => !orphanedIds.includes(dep.id));
            // Rebuild phase IDs set
            phaseIds.clear();
            dependencies.forEach(dep => {
              phaseIds.add(dep.source_phase_id);
              phaseIds.add(dep.target_phase_id);
            });
          }
        }
      } else {
        console.error('[ProductPhaseDependencyService] Error fetching all phases:', allPhasesError);
      }

      // Fetch phase names separately (after cleanup)
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name')
        .in('id', Array.from(phaseIds));

      if (phasesError) {
        console.error('[ProductPhaseDependencyService] Error fetching phases:', phasesError);
        return { success: false, error: phasesError.message };
      }

      // Create phase name lookup map
      const phaseNameMap = new Map<string, string>();
      phases?.forEach(phase => {
        phaseNameMap.set(phase.id, phase.name);
      });

      // Enrich dependencies with phase names
      const enrichedDependencies: ProductPhaseDependency[] = dependencies.map(dep => {
        const sourceName = phaseNameMap.get(dep.source_phase_id) || 'Unknown Phase';
        const targetName = phaseNameMap.get(dep.target_phase_id) || 'Unknown Phase';
        
        return {
          id: dep.id,
          product_id: dep.product_id,
          source_phase_id: dep.source_phase_id,
          target_phase_id: dep.target_phase_id,
          dependency_type: dep.dependency_type as ProductDependencyType,
          lag_days: dep.lag_days,
          created_at: dep.created_at,
          updated_at: dep.updated_at,
          source_phase_name: sourceName,
          target_phase_name: targetName
        };
      });

      return { success: true, dependencies: enrichedDependencies };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error:', error);
      return { success: false, error: 'Failed to fetch product dependencies' };
    }
  }

  /**
   * Create a new product-specific dependency
   */
  static async createProductDependency(data: CreateProductDependencyData): Promise<ProductDependencyResult> {
    try {
      // Validate that source and target phases exist and belong to the product
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name')
        .eq('product_id', data.product_id)
        .in('id', [data.source_phase_id, data.target_phase_id]);

      if (phasesError) {
        console.error('[ProductPhaseDependencyService] Error validating phases:', phasesError);
        return { success: false, error: 'Failed to validate phases' };
      }

      if (!phases || phases.length !== 2) {
        return { success: false, error: 'Invalid phase IDs or phases do not belong to this product' };
      }

      // Check for existing dependency
      const { data: existing } = await supabase
        .from('product_phase_dependencies')
        .select('id')
        .eq('product_id', data.product_id)
        .eq('source_phase_id', data.source_phase_id)
        .eq('target_phase_id', data.target_phase_id)
        .eq('dependency_type', data.dependency_type)
        .single();

      if (existing) {
        return { success: false, error: 'This dependency already exists' };
      }

      // Create the dependency
      const { data: newDependency, error } = await supabase
        .from('product_phase_dependencies')
        .insert({
          product_id: data.product_id,
          source_phase_id: data.source_phase_id,
          target_phase_id: data.target_phase_id,
          dependency_type: data.dependency_type,
          lag_days: data.lag_days || 0
        })
        .select()
        .single();

      if (error) {
        console.error('[ProductPhaseDependencyService] Error creating dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: newDependency as ProductPhaseDependency };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error:', error);
      return { success: false, error: 'Failed to create dependency' };
    }
  }

  /**
   * Update a product dependency
   */
  static async updateProductDependency(
    dependencyId: string,
    updates: {
      dependency_type?: ProductDependencyType;
      lag_days?: number;
    }
  ): Promise<ProductDependencyResult> {
    try {
      const { data: updatedDependency, error } = await supabase
        .from('product_phase_dependencies')
        .update(updates)
        .eq('id', dependencyId)
        .select()
        .single();

      if (error) {
        console.error('[ProductPhaseDependencyService] Error updating dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: updatedDependency as ProductPhaseDependency };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error:', error);
      return { success: false, error: 'Failed to update dependency' };
    }
  }

  /**
   * Delete a product dependency
   */
  static async deleteProductDependency(dependencyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('product_phase_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) {
        console.error('[ProductPhaseDependencyService] Error deleting dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error:', error);
      return { success: false, error: 'Failed to delete dependency' };
    }
  }

  /**
   * Initialize product dependencies from company settings
   * This copies company-level dependencies to product-level for customization
   */
  static async initializeFromCompanySettings(
    productId: string, 
    companyId: string,
    overwriteExisting: boolean = false
  ): Promise<InitializationResult> {
    try {
      // 1. Get product phases to map company phases to product phases
      const { data: productPhases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id, name')
        .eq('product_id', productId);

      if (phasesError) {
        console.error('[ProductPhaseDependencyService] Error fetching product phases:', phasesError);
        return { success: false, error: 'Failed to fetch product phases' };
      }

      if (!productPhases || productPhases.length === 0) {
        return { success: false, error: 'No phases found for this product' };
      }

      // Create mapping from company phase ID to product phase ID
      const phaseMapping = new Map<string, string>();
      productPhases.forEach(phase => {
        if (phase.phase_id) {
          phaseMapping.set(phase.phase_id, phase.id);
        }
      });

      // 2. Get company-level dependencies
      const { data: companyDependencies, error: companyError } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', companyId);

      if (companyError) {
        console.error('[ProductPhaseDependencyService] Error fetching company dependencies:', companyError);
        return { success: false, error: 'Failed to fetch company dependencies' };
      }

      if (!companyDependencies || companyDependencies.length === 0) {
        return { success: true, initializedCount: 0, skippedCount: 0 };
      }

      // 3. Check existing product dependencies if not overwriting
      let existingDependencies: any[] = [];
      if (!overwriteExisting) {
        const { data: existing } = await supabase
        .from('product_phase_dependencies')
          .select('source_phase_id, target_phase_id, dependency_type')
          .eq('product_id', productId);
        
        existingDependencies = existing || [];
      }

      // 4. Map and create product dependencies
      const dependenciesToCreate: any[] = [];
      let skippedCount = 0;

      for (const companyDep of companyDependencies) {
        const sourcePhaseId = phaseMapping.get(companyDep.source_phase_id);
        const targetPhaseId = phaseMapping.get(companyDep.target_phase_id);

        if (!sourcePhaseId || !targetPhaseId) {
          skippedCount++;
          continue;
        }

        // Check if dependency already exists
        const exists = existingDependencies.some(existing => 
          existing.source_phase_id === sourcePhaseId &&
          existing.target_phase_id === targetPhaseId &&
          existing.dependency_type === companyDep.dependency_type
        );

        if (exists && !overwriteExisting) {
          skippedCount++;
          continue;
        }

        dependenciesToCreate.push({
          product_id: productId,
          source_phase_id: sourcePhaseId,
          target_phase_id: targetPhaseId,
          dependency_type: companyDep.dependency_type,
          lag_days: companyDep.lag_days || 0
        });
      }

      // 5. Clear existing if overwriting
      if (overwriteExisting && existingDependencies.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_phase_dependencies')
          .delete()
          .eq('product_id', productId);

        if (deleteError) {
          console.error('[ProductPhaseDependencyService] Error clearing existing dependencies:', deleteError);
          return { success: false, error: 'Failed to clear existing dependencies' };
        }
      }

      // 6. Batch insert new dependencies
      let initializedCount = 0;
      if (dependenciesToCreate.length > 0) {
        const { data: created, error: insertError } = await supabase
          .from('product_phase_dependencies')
          .insert(dependenciesToCreate)
          .select();

        if (insertError) {
          console.error('[ProductPhaseDependencyService] Error creating dependencies:', insertError);
          return { success: false, error: 'Failed to create dependencies' };
        }

        initializedCount = created?.length || 0;
      }

      return { success: true, initializedCount, skippedCount };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error during initialization:', error);
      return { success: false, error: 'Failed to initialize dependencies' };
    }
  }

  /**
   * Get dependency type label for display
   */
  static getDependencyTypeLabel(type: ProductDependencyType): string {
    switch (type) {
      case 'finish_to_start': return 'Finish to Start (FS)';
      case 'start_to_start': return 'Start to Start (SS)';
      case 'finish_to_finish': return 'Finish to Finish (FF)';
      case 'start_to_finish': return 'Start to Finish (SF)';
      default: return type;
    }
  }

  /**
   * Get dependency type description
   */
  static getDependencyTypeDescription(type: ProductDependencyType): string {
    switch (type) {
      case 'finish_to_start': 
        return 'Target phase starts after source phase finishes (most common)';
      case 'start_to_start': 
        return 'Both phases start at the same time';
      case 'finish_to_finish': 
        return 'Both phases finish at the same time';
      case 'start_to_finish': 
        return 'Target phase finishes when source phase starts (rare)';
      default: 
        return 'Custom dependency type';
    }
  }

  /**
   * Initialize product dependencies from active company phases only
   * This copies only dependencies between active phases from company settings
   */
  static async initializeFromActiveCompanyPhases(
    productId: string, 
    companyId: string,
    overwriteExisting: boolean = true
  ): Promise<InitializationResult> {
    try {
      // 1. Get active company phases from company_chosen_phases
      const { data: activeCompanyPhases, error: activePhasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          position,
          company_phases!inner(
            id,
            name,
            description
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (activePhasesError) {
        console.error('[ProductPhaseDependencyService] Error fetching active company phases:', activePhasesError);
        return { success: false, error: 'Failed to fetch active company phases' };
      }

      if (!activeCompanyPhases || activeCompanyPhases.length === 0) {
        return { success: false, error: 'No active phases found for this company' };
      }

      // 2. Get product phases to map company phases to product phases
      // Wait a bit to ensure phase sync has completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: productPhases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id, name')
        .eq('product_id', productId);

      if (phasesError) {
        console.error('[ProductPhaseDependencyService] Error fetching product phases:', phasesError);
        return { success: false, error: 'Failed to fetch product phases' };
      }

      if (!productPhases || productPhases.length === 0) {
        return { success: false, error: 'No phases found for this product. Please ensure phase synchronization completed successfully.' };
      }

      // Create mapping from company phase ID to product phase ID
      const phaseMapping = new Map<string, string>();
      productPhases.forEach(phase => {
        if (phase.phase_id) {
          phaseMapping.set(phase.phase_id, phase.id);
        }
      });

      // 3. Get active company phase IDs
      const activeCompanyPhaseIds = new Set(activeCompanyPhases.map(cp => cp.phase_id));

      // 4. Get company-level dependencies that involve only active phases
      const { data: companyDependencies, error: companyError } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', companyId)
        .in('source_phase_id', Array.from(activeCompanyPhaseIds))
        .in('target_phase_id', Array.from(activeCompanyPhaseIds));

      if (companyError) {
        console.error('[ProductPhaseDependencyService] Error fetching company dependencies:', companyError);
        return { success: false, error: 'Failed to fetch company dependencies' };
      }

      if (!companyDependencies || companyDependencies.length === 0) {
        return { success: true, initializedCount: 0, skippedCount: 0 };
      }

      // 5. Get existing dependencies if not overwriting (to avoid duplicates)
      let existingDependencies: any[] = [];
      if (!overwriteExisting) {
        const { data: existing } = await supabase
          .from('product_phase_dependencies')
          .select('source_phase_id, target_phase_id, dependency_type')
          .eq('product_id', productId);

        existingDependencies = existing || [];
      } else {
        // Clear existing product dependencies first
        const { error: deleteDepsError } = await supabase
          .from('product_phase_dependencies')
          .delete()
          .eq('product_id', productId);

        if (deleteDepsError) {
          console.error('[ProductPhaseDependencyService] Error clearing existing dependencies:', deleteDepsError);
          return { success: false, error: 'Failed to clear existing dependencies' };
        }
      }

      // 6. Map and create product dependencies for active phases only
      const dependenciesToCreate: any[] = [];
      let skippedCount = 0;

      for (const companyDep of companyDependencies) {
        const sourcePhaseId = phaseMapping.get(companyDep.source_phase_id);
        const targetPhaseId = phaseMapping.get(companyDep.target_phase_id);

        if (!sourcePhaseId || !targetPhaseId) {
          skippedCount++;
          continue;
        }

        // Check if dependency already exists (when not overwriting)
        if (!overwriteExisting) {
          const exists = existingDependencies.some(existing =>
            existing.source_phase_id === sourcePhaseId &&
            existing.target_phase_id === targetPhaseId &&
            existing.dependency_type === companyDep.dependency_type
          );

          if (exists) {
            skippedCount++;
            continue;
          }
        }

        dependenciesToCreate.push({
          product_id: productId,
          source_phase_id: sourcePhaseId,
          target_phase_id: targetPhaseId,
          dependency_type: companyDep.dependency_type,
          lag_days: companyDep.lag_days || 0
        });
      }

      // 7. Batch insert new dependencies
      let initializedCount = 0;
      if (dependenciesToCreate.length > 0) {
        const { data: created, error: insertError } = await supabase
          .from('product_phase_dependencies')
          .insert(dependenciesToCreate)
          .select();

        if (insertError) {
          console.error('[ProductPhaseDependencyService] Error creating dependencies:', insertError);
          return { success: false, error: 'Failed to create dependencies' };
        }

        initializedCount = created?.length || 0;
      }

      return { success: true, initializedCount, skippedCount };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Unexpected error during active phases initialization:', error);
      return { success: false, error: 'Failed to initialize dependencies from active phases' };
    }
  }

  /**
   * Validate dependency to prevent circular and transitive/redundant dependencies
   *
   * Examples:
   * 1. Circular dependency:
   *    - Existing: Concept → Project Initiation, Project Initiation → Requirements
   *    - Trying to add: Requirements → Concept
   *    - Result: BLOCKED (creates cycle: Requirements → Concept → Project Initiation → Requirements)
   *
   * 2. Transitive/Redundant dependency:
   *    - Existing: Project Initiation → Requirements, Requirements → Design
   *    - Trying to add: Project Initiation → Design
   *    - Result: BLOCKED (redundant, already connected through Requirements)
   */
  static async validateDependency(
    productId: string,
    sourcePhaseId: string,
    targetPhaseId: string
  ): Promise<{ valid: boolean; error?: string; path?: string[] }> {
    try {
      // Basic validation
      if (sourcePhaseId === targetPhaseId) {
        return { valid: false, error: 'A phase cannot depend on itself' };
      }

      // Get all existing dependencies for the product
      const result = await this.getProductDependencies(productId);
      if (!result.success) {
        return { valid: false, error: 'Failed to validate dependencies' };
      }

      const dependencies = result.dependencies || [];

      // Build phase name map for error messages
      const phaseNameMap = new Map<string, string>();
      dependencies.forEach(dep => {
        if (dep.source_phase_name) {
          phaseNameMap.set(dep.source_phase_id, dep.source_phase_name);
        }
        if (dep.target_phase_name) {
          phaseNameMap.set(dep.target_phase_id, dep.target_phase_name);
        }
      });

      // Build adjacency list graph (source → target means source comes before target)
      const graph = new Map<string, string[]>();

      // Add existing dependencies to graph (WITHOUT the proposed dependency first)
      dependencies.forEach(dep => {
        if (!graph.has(dep.source_phase_id)) {
          graph.set(dep.source_phase_id, []);
        }
        graph.get(dep.source_phase_id)!.push(dep.target_phase_id);
      });

      // CHECK 1: Transitive dependency (check BEFORE adding proposed link)
      // If source can already reach target through existing paths, it's redundant
      const findPath = (from: string, to: string, visited = new Set<string>()): string[] | null => {
        if (from === to) return [from];
        if (visited.has(from)) return null;

        visited.add(from);
        const neighbors = graph.get(from) || [];

        for (const neighbor of neighbors) {
          const path = findPath(neighbor, to, new Set(visited));
          if (path) {
            return [from, ...path];
          }
        }

        return null;
      };

      const existingPath = findPath(sourcePhaseId, targetPhaseId);
      if (existingPath) {
        const pathNames = existingPath.map(id => phaseNameMap.get(id) || id);
        return {
          valid: false,
          error: `This dependency is redundant. A path already exists: ${pathNames.join(' → ')}`,
          path: existingPath
        };
      }

      // CHECK 2: Circular dependency (check AFTER adding proposed link)
      // Add the proposed dependency to the graph
      if (!graph.has(sourcePhaseId)) {
        graph.set(sourcePhaseId, []);
      }
      graph.get(sourcePhaseId)!.push(targetPhaseId);

      // DFS to detect cycles with path tracking
      const detectCycle = (): { hasCycle: boolean; cyclePath?: string[] } => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const dfs = (node: string): boolean => {
          // If node is in recursion stack, we found a cycle
          if (recursionStack.has(node)) {
            // Find where the cycle starts
            const cycleStartIndex = path.indexOf(node);
            const cyclePath = [...path.slice(cycleStartIndex), node];
            return true;
          }

          // If already visited and not in recursion stack, no cycle from this node
          if (visited.has(node)) {
            return false;
          }

          // Mark node as visited and add to recursion stack
          visited.add(node);
          recursionStack.add(node);
          path.push(node);

          // Check all neighbors
          const neighbors = graph.get(node) || [];
          for (const neighbor of neighbors) {
            if (dfs(neighbor)) {
              return true; // Cycle found
            }
          }

          // Remove from recursion stack and path (backtrack)
          recursionStack.delete(node);
          path.pop();
          return false;
        };

        // Check all nodes for cycles (graph might be disconnected)
        for (const node of graph.keys()) {
          if (!visited.has(node)) {
            if (dfs(node)) {
              return { hasCycle: true, cyclePath: [...path] };
            }
          }
        }

        return { hasCycle: false };
      };

      const cycleResult = detectCycle();

      if (cycleResult.hasCycle) {
        const cyclePath = cycleResult.cyclePath || [];
        const cycleNames = cyclePath.map(id => phaseNameMap.get(id) || id);

        return {
          valid: false,
          error: `This dependency would create a circular reference: ${cycleNames.join(' → ')}`,
          path: cyclePath
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('[ProductPhaseDependencyService] Error validating dependency:', error);
      return { valid: false, error: 'Failed to validate dependency' };
    }
  }
}