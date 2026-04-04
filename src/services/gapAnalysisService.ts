import { supabase } from "@/integrations/supabase/client";
import { GapAnalysisItem } from "@/types/client";

// In-memory cache for gap_template_items - these rarely change
let cachedTemplateItems: any[] | null = null;
let templateItemsCacheTime: number = 0;
const TEMPLATE_ITEMS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getCachedTemplateItems = async () => {
  const now = Date.now();
  if (cachedTemplateItems && (now - templateItemsCacheTime) < TEMPLATE_ITEMS_CACHE_DURATION) {
    return cachedTemplateItems;
  }

  const { data, error } = await supabase
    .from('gap_template_items')
    .select('item_number, sort_order, template_id, gap_analysis_templates!inner(framework)');

  if (error) {
    console.error('[gapAnalysisService] Error fetching template items:', error);
    throw error;
  }

  cachedTemplateItems = data || [];
  templateItemsCacheTime = now;
  return cachedTemplateItems;
};

export const fetchProductGapItems = async (productId: string): Promise<GapAnalysisItem[]> => {
  try {
    const startTime = performance.now();

    // First get the company_id and family info for this product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('company_id, parent_product_id, parent_relationship_type, is_master_device, name, field_scope_overrides')
      .eq('id', productId)
      .single();

    if (productError) {
      throw productError;
    }

    if (!productData?.company_id) {
      return [];
    }

    // OPTIMIZATION: Run product items and templates queries in parallel
    // Template items are cached separately (30 min cache)
    const [productItemsResult, templatesResult, templateItems] = await Promise.all([
      // Get product-specific items
      supabase
        .from('gap_analysis_items')
        .select('*')
        .eq('product_id', productId),
      // Get enabled product-scoped templates for this company
      supabase
        .from('company_gap_templates')
        .select('template_id, gap_analysis_templates!inner(framework, scope)')
        .eq('company_id', productData.company_id)
        .eq('is_enabled', true)
        .eq('gap_analysis_templates.scope', 'product'),
      // Get template items from cache (shared across all products)
      getCachedTemplateItems()
    ]);

    const { data: productItems, error: productItemsError } = productItemsResult;
    const { data: enabledTemplates, error: templatesError } = templatesResult;

    if (productItemsError) {
      throw productItemsError;
    }

    if (templatesError) {
      throw templatesError;
    }

    // Extract enabled frameworks
    const enabledFrameworks = new Set(
      enabledTemplates?.map((t: any) => t.gap_analysis_templates?.framework).filter(Boolean) || []
    );

    // Create a map of clause_id + framework -> sort_order for efficient lookup
    const sortOrderMap = new Map<string, number>();
    (templateItems || []).forEach((item: any) => {
      const framework = item.gap_analysis_templates?.framework;
      const clauseId = item.item_number;
      if (framework && clauseId) {
        const key = `${framework}:${clauseId}`;
        sortOrderMap.set(key, item.sort_order || 999999);
      }
    });

    // Lazy sync: If product has no items but templates are enabled, create them now
    // This handles the case where a product is created after templates were already enabled
    if ((!productItems || productItems.length === 0) && enabledFrameworks.size > 0 && enabledTemplates && enabledTemplates.length > 0) {
     

      try {
        // Get template details with items for each enabled template
        const templateIds = enabledTemplates.map((t: any) => t.template_id).filter(Boolean);

        if (templateIds.length > 0) {
          const { data: fullTemplates } = await supabase
            .from('gap_analysis_templates')
            .select('*, gap_template_items(*)')
            .in('id', templateIds)
            .eq('scope', 'product');

          if (fullTemplates && fullTemplates.length > 0) {
            const itemsToInsert: any[] = [];

            for (const template of fullTemplates) {
              if (!template.gap_template_items || template.gap_template_items.length === 0) continue;

              for (const item of template.gap_template_items) {
                itemsToInsert.push({
                  product_id: productId,
                  requirement: item.requirement_text,
                  framework: template.framework,
                  section: item.clause_reference,
                  clause_id: item.item_number,
                  clause_summary: item.requirement_text,
                  category: item.category,
                  status: 'non_compliant',
                  priority: item.priority,
                  action_needed: '',
                  associated_standards: (item as any).associated_standards || item.applicable_standards || null,
                  recommended_teams: (item as any).recommended_teams || null
                });
              }
            }

            if (itemsToInsert.length > 0) {
              const { data: insertedItems, error: insertError } = await supabase
                .from('gap_analysis_items')
                .insert(itemsToInsert)
                .select('*');

              if (insertError) {
                console.error('[fetchProductGapItems] Lazy sync insert error:', insertError);
              } else {
                
                // Use the freshly inserted items
                const combinedData = insertedItems || [];
                const processedItems = combinedData.map(item => {
                  const evidenceLinks = Array.isArray(item.evidence_links) ? item.evidence_links : [];
                  const sortKey = `${item.framework}:${item.clause_id}`;
                  const sortOrder = sortOrderMap.get(sortKey) || 999999;
                  return {
                    ...item,
                    sort_order: sortOrder,
                    status: item.status as "Open" | "Closed" | "In Progress" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable",
                    evidence_links: evidenceLinks,
                    evidenceLinks: evidenceLinks,
                    applicable_phases: Array.isArray(item.applicable_phases) ?
                      item.applicable_phases.map(p => (typeof p === 'string' ? p : String(p))) : [],
                    phase_time: Array.isArray(item.phase_time) ?
                      item.phase_time.map(p => (typeof p === 'string' ? p : String(p))) : []
                  };
                });
                return processedItems.sort((a, b) => ((a as any).sort_order || 999999) - ((b as any).sort_order || 999999));
              }
            }
          }
        }
      } catch (syncError) {
        console.error('[fetchProductGapItems] Lazy sync error:', syncError);
      }
    }

    // Framework alias map: template names (underscored) -> legacy names (human-readable)
    const frameworkAliases: Record<string, string[]> = {
      'IEC_60601_1': ['IEC 60601-1'],
      'IEC_60601_1_2': ['IEC 60601-1-2'],
      'IEC_60601_1_6': ['IEC 60601-1-6'],
      'IEC_62304': ['IEC 62304'],
      'IEC_62366_1': ['IEC 62366-1'],
      'IEC_20957': ['IEC 20957'],
      'ISO_14971': ['ISO 14971'],
      'ISO_14971_DEVICE': ['ISO 14971'],
      'ISO_13485': ['ISO 13485'],
      'ISO_15223_1': ['ISO 15223-1'],
      'ISO_20417': ['ISO 20417'],
      'ISO_10993': ['ISO 10993'],
      'MDR_ANNEX_I': ['MDR Annex I', 'GSPR'],
      'MDR_ANNEX_II': ['MDR Annex II', 'MDR'],
      'MDR_ANNEX_III': ['MDR Annex III', 'PMS'],
      'CMDR_SOR': ['CMDR'],
      'TGA_ACT': ['TGA'],
      'PMDA_PAL': ['PMDA'],
      'NMPA_REGULATIONS': ['NMPA'],
      'ANVISA_RDC': ['ANVISA'],
      'CDSCO_MDR': ['CDSCO'],
      'UKCA_MDR2002': ['UKCA'],
      'MEPSW': ['MepV'],
      'KFDA_MDIA': ['KFDA'],
    };

    // Build expanded set that includes both template and legacy framework names
    const expandedFrameworks = new Set(enabledFrameworks);
    enabledFrameworks.forEach(fw => {
      const aliases = frameworkAliases[fw];
      if (aliases) aliases.forEach(a => expandedFrameworks.add(a));
    });

    const hasFormResponses = (responses: any) =>
      !!responses &&
      typeof responses === 'object' &&
      !Array.isArray(responses) &&
      Object.keys(responses).length > 0;

    const statusRank = (status: string | null | undefined) => {
      if (status === 'compliant') return 3;
      if (status === 'partially_compliant') return 2;
      if (status === 'non_compliant') return 1;
      return 0;
    };

    const pickPreferredItem = (a: any, b: any) => {
      const aHasData = hasFormResponses(a.form_responses);
      const bHasData = hasFormResponses(b.form_responses);
      if (aHasData !== bHasData) return bHasData ? b : a;

      const aRank = statusRank(a.status);
      const bRank = statusRank(b.status);
      if (aRank !== bRank) return bRank > aRank ? b : a;

      const aUpdated = new Date(a.updated_at || 0).getTime();
      const bUpdated = new Date(b.updated_at || 0).getTime();
      return bUpdated > aUpdated ? b : a;
    };

    const dedupeByFrameworkSection = (items: any[]) => {
      const bySection = new Map<string, any>();
      items.forEach(item => {
        const key = `${item.framework}::${item.section}`;
        const existing = bySection.get(key);
        bySection.set(key, existing ? pickPreferredItem(existing, item) : item);
      });
      return Array.from(bySection.values());
    };

    // Use only product-specific items that belong to enabled product-scoped frameworks
    const combinedDataRaw = (productItems || []).filter(item =>
      expandedFrameworks.has(item.framework)
    );
    const combinedData = dedupeByFrameworkSection(combinedDataRaw);

    const processedItems = combinedData.map(item => {
      const evidenceLinks = Array.isArray(item.evidence_links) ? item.evidence_links : [];

      // Look up sort_order from template
      const sortKey = `${item.framework}:${item.clause_id}`;
      const sortOrder = sortOrderMap.get(sortKey) || 999999;

      return {
        ...item,
        sort_order: sortOrder, // Add sort_order for sorting
        status: item.status as "Open" | "Closed" | "In Progress" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable",
        evidence_links: evidenceLinks,
        evidenceLinks: evidenceLinks, // Ensure both snake_case and camelCase are available
        applicable_phases: Array.isArray(item.applicable_phases) ?
          item.applicable_phases.map(p => (typeof p === 'string' ? p : String(p))) : [],
        phase_time: Array.isArray(item.phase_time) ?
          item.phase_time.map(p => (typeof p === 'string' ? p : String(p))) : []
      };
    });

    // Sort by sort_order (same as company settings)
    const sortedItems = processedItems.sort((a, b) => {
      const aOrder = (a as any).sort_order || 999999;
      const bOrder = (b as any).sort_order || 999999;
      return aOrder - bOrder;
    });

    // FAMILY INHERITANCE: Resolve all family peers (federated model — all devices are equal)
    let rootId: string | null = null;
    if (productData.is_master_device) {
      rootId = productId;
    } else if (productData.parent_product_id) {
      rootId = productData.parent_product_id;
    }

    // Read shared frameworks from field_scope_overrides (default: nothing shared)
    const overrides = (productData.field_scope_overrides as Record<string, any>) || {};
    const gapFrameworksShared: string[] = Array.isArray(overrides.gap_frameworks_shared) ? overrides.gap_frameworks_shared : [];
    const gapClauseExclusions: Record<string, string[]> = (overrides.gap_clause_exclusions && typeof overrides.gap_clause_exclusions === 'object') ? overrides.gap_clause_exclusions : {};

    // Build expanded set of shared framework names (including aliases)
    const sharedExpandedFrameworks = new Set<string>();
    gapFrameworksShared.forEach(fw => {
      sharedExpandedFrameworks.add(fw);
      const aliases = frameworkAliases[fw];
      if (aliases) aliases.forEach(a => sharedExpandedFrameworks.add(a));
    });

    if (rootId && sharedExpandedFrameworks.size > 0) {
      // Fetch all family peers (root + all children), excluding current product
      const { data: peers } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', productData.company_id)
        .eq('is_archived', false)
        .or(`id.eq.${rootId},parent_product_id.eq.${rootId}`)
        .neq('id', productId);

      if (peers && peers.length > 0) {
        const peerIds = peers.map(p => p.id);
        const peerNames: Record<string, string> = {};
        peers.forEach(p => { peerNames[p.id] = p.name; });

        // Fetch gap items from all peers
        const { data: peerItems } = await supabase
          .from('gap_analysis_items')
          .select('*')
          .in('product_id', peerIds);

        if (peerItems && peerItems.length > 0) {
          const localSections = new Set(
            sortedItems.map(item => `${(item as any).framework}::${(item as any).section}`)
          );

          // Deduplicate peer items by framework::section — only for SHARED frameworks
          const dedupedPeerItems = dedupeByFrameworkSection(
            peerItems.filter(pi => sharedExpandedFrameworks.has(pi.framework))
          );

          const inheritedItems = dedupedPeerItems
            .filter(pi => {
              const key = `${pi.framework}::${pi.section}`;
              if (localSections.has(key)) return false;
              // Check clause-level exclusion: if this product is excluded for this clause, skip
              const clauseKey = `${pi.framework}.${pi.section}`;
              const excluded = gapClauseExclusions[clauseKey] || [];
              if (excluded.includes(productId)) return false;
              return true;
            })
            .map(pi => {
              const evidenceLinks = Array.isArray(pi.evidence_links) ? pi.evidence_links : [];
              const sortKey = `${pi.framework}:${pi.clause_id}`;
              const sortOrder = sortOrderMap.get(sortKey) || 999999;
              return {
                ...pi,
                sort_order: sortOrder,
                status: pi.status as any,
                evidence_links: evidenceLinks,
                evidenceLinks: evidenceLinks,
                applicable_phases: Array.isArray(pi.applicable_phases)
                  ? pi.applicable_phases.map(p => (typeof p === 'string' ? p : String(p))) : [],
                phase_time: Array.isArray(pi.phase_time)
                  ? pi.phase_time.map(p => (typeof p === 'string' ? p : String(p))) : [],
                _inherited: true,
                _inheritedFromProductId: pi.product_id,
                _inheritedFromProductName: peerNames[pi.product_id] || 'Family Member',
              };
            });

          const merged = [...sortedItems, ...inheritedItems];
          merged.sort((a, b) => ((a as any).sort_order || 999999) - ((b as any).sort_order || 999999));
          return merged;
        }
      }
    }

    return sortedItems;
  } catch (error) {
    throw error;
  }
};

export const updateGapItemStatus = async (itemId: string, status: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('gap_analysis_items')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select('id');

    if (error) {
      throw error;
    }

    // CRITICAL FIX: Check if any rows were actually updated
    const rowsUpdated = data?.length || 0;
    if (rowsUpdated === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const bulkUpdateGapItemDueDates = async (
  itemIds: string[], 
  dueDate: string | null
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gap_analysis_items')
      .update({ 
        milestone_due_date: dueDate,
        updated_at: new Date().toISOString()
      })
      .in('id', itemIds);

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
};

export const updateGapItemDueDate = async (itemId: string, dueDate: string | null): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gap_analysis_items')
      .update({ 
        milestone_due_date: dueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
};

export const updateGapItemEvidence = async (itemId: string, evidenceLinks: any[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gap_analysis_items')
      .update({ 
        evidence_links: evidenceLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
};

export const createGapAnalysisItem = async (item: {
  product_id: string | null;
  requirement: string;
  framework?: string;
  section?: string;
  clause_id?: string;
  clause_summary?: string;
  category?: string;
  status?: string;
  action_needed?: string;
  priority?: string;
}): Promise<GapAnalysisItem | null> => {
  try {
    const { data, error } = await supabase
      .from('gap_analysis_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      // Check if this is a unique constraint violation
      if (error.code === '23505' && error.message.includes('unique_gap_analysis_item')) {
        // Return null to indicate duplicate was skipped
        return null;
      }
      
      throw error;
    }

    const evidenceLinks = Array.isArray(data.evidence_links) ? data.evidence_links : [];
    return {
      ...data,
      status: data.status as "Open" | "Closed" | "In Progress" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable",
      evidence_links: evidenceLinks,
      evidenceLinks: evidenceLinks, // Ensure both snake_case and camelCase are available
      applicable_phases: Array.isArray(data.applicable_phases) ? 
        data.applicable_phases.map(p => (typeof p === 'string' ? p : String(p))) : [],
      phase_time: Array.isArray(data.phase_time) ? 
        data.phase_time.map(p => (typeof p === 'string' ? p : String(p))) : []
      };
    } catch (error) {
      throw error;
    }
};

export const deleteGapAnalysisItemsByProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gap_analysis_items')
      .delete()
      .eq('product_id', productId);

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
};

export const checkExistingGapItems = async (productId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('gap_analysis_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch {
    return 0;
  }
};

export const fetchCompanyGapItems = async (companyId: string): Promise<GapAnalysisItem[]> => {
  try {
    // This is a backup approach using RPC - we should instead use a similar approach to fetchProductGapItems
    // to ensure consistent handling of applicable_phases
    
    // First get company-scoped templates, respecting phase filtering
    const { data: templates, error: templatesError } = await supabase
      .from('company_gap_templates')
      .select('template_id, gap_analysis_templates!inner(framework, applicable_phases, scope)')
      .eq('company_id', companyId)
      .eq('is_enabled', true)
      .eq('gap_analysis_templates.scope', 'company');

    if (templatesError) {
      throw templatesError;
    }
    
    // For company view, we don't filter by phase - show all items
    // We'll keep the phase filtering logic in the product-specific view only
    
    // Extract frameworks
    const enabledFrameworks = new Set(
      templates?.map((t: any) => t.gap_analysis_templates?.framework).filter(Boolean) || []
    );
    
    // Get company-scoped items that match the enabled frameworks
    const { data: companyItems, error: itemsError } = await supabase
      .from('gap_analysis_items')
      .select('*')
      .is('product_id', null)
      .in('framework', Array.from(enabledFrameworks));

    if (itemsError) {
      throw itemsError;
    }
    
    const processedItems = (companyItems || []).map(item => {
      const evidenceLinks = Array.isArray(item.evidence_links) ? item.evidence_links : [];
      return {
        ...item,
        status: item.status as "Open" | "Closed" | "In Progress" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable",
        evidence_links: evidenceLinks,
        evidenceLinks: evidenceLinks,
        applicable_phases: Array.isArray(item.applicable_phases) ? 
          item.applicable_phases.map(p => (typeof p === 'string' ? p : String(p))) : [],
        phase_time: Array.isArray(item.phase_time) ? 
          item.phase_time.map(p => (typeof p === 'string' ? p : String(p))) : []
      };
    });
    
    return processedItems;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate phase_time array from phase IDs and product ID
 * Format: ["phase_id||start_date||end_date", ...]
 * @param productId - Product ID to query lifecycle_phases
 * @param phaseIds - Array of phase IDs (company_phases.id)
 * @returns Array of formatted strings or empty array if no product_id
 */
export async function calculatePhaseTime(productId: string | null | undefined, phaseIds: string[]): Promise<string[]> {
  // If no product_id or empty phases, return empty array
  if (!productId || !phaseIds || phaseIds.length === 0) {
    return [];
  }

  try {
    // Query lifecycle_phases for this product and phases
    const { data: lifecyclePhases, error } = await supabase
      .from('lifecycle_phases')
      .select('phase_id, start_date, end_date')
      .eq('product_id', productId)
      .in('phase_id', phaseIds);

      if (error) {
        // Return empty array on error to avoid breaking the update
        return [];
      }

    // Create a map of phase_id to dates for quick lookup
    const phaseDateMap = new Map<string, { start_date: string | null; end_date: string | null }>();
    (lifecyclePhases || []).forEach(phase => {
      phaseDateMap.set(phase.phase_id, {
        start_date: phase.start_date,
        end_date: phase.end_date
      });
    });

    // Build phase_time array in the specified format
    const phaseTimeArray = phaseIds.map(phaseId => {
      const phaseDates = phaseDateMap.get(phaseId);
      const startDate = phaseDates?.start_date || '';
      const endDate = phaseDates?.end_date || '';
      return `${phaseId}||${startDate}||${endDate}`;
    });

    return phaseTimeArray;
  } catch {
    return [];
  }
}

export async function updateGapItemPhases(itemId: string, phases: string[]): Promise<boolean> {
  try {
    // Validate user has permission to update this item
    const { data: item, error: fetchError } = await supabase
      .from('gap_analysis_items')
      .select('id, product_id')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      return false;
    }

    if (!item) {
      return false;
    }
    
    // Calculate phase_time based on product_id and phases
    const phaseTime = await calculatePhaseTime(item.product_id, phases);
    
    const { error } = await supabase
      .from('gap_analysis_items')
      .update({ 
        applicable_phases: phases,
        phase_time: phaseTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Assign a reviewer group to a gap analysis item
 * Creates a review workflow and assignment if they don't exist
 */
export async function assignReviewerGroupToGapItem(
  itemId: string,
  reviewerGroupId: string,
  companyId: string
): Promise<{ success: boolean; message: string; workflowId?: string }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    // Check if a workflow already exists for this gap item
    let existingWorkflow = null;
    let workflowCheckError = null;
    
    try {
      const result = await supabase
        .from('review_workflows')
        .select('id')
        .eq('record_type', 'gap_analysis_item')
        .eq('record_id', itemId)
        .maybeSingle();
      
      existingWorkflow = result.data;
      workflowCheckError = result.error;
      
      if (workflowCheckError) {
        // If the error is a permissions issue or table doesn't exist, continue
        // We'll try to create a new workflow anyway
      }
    } catch (error) {
      workflowCheckError = error as any;
    }

    let workflowId: string;

    if (existingWorkflow && !workflowCheckError) {
      // Use existing workflow
      workflowId = existingWorkflow.id;
    } else {
      // Create a new workflow
      const { data: gapItem, error: itemError } = await supabase
        .from('gap_analysis_items')
        .select('clause_id, clause_summary, requirement')
        .eq('id', itemId)
        .single();

      if (itemError || !gapItem) {
        return {
          success: false,
          message: 'Gap analysis item not found'
        };
      }

      const workflowName = `${gapItem.clause_id || 'Gap Item'} Review`;
      const workflowDescription = `Review workflow for ${gapItem.clause_id || 'gap analysis item'}: ${gapItem.clause_summary || gapItem.requirement || 'N/A'}`;

      // Try to create a new workflow
      // First, check if one was created by another process (race condition)
      const { data: checkAgain, error: checkAgainError } = await supabase
        .from('review_workflows')
        .select('id')
        .eq('record_type', 'gap_analysis_item')
        .eq('record_id', itemId)
        .maybeSingle();

      if (!checkAgainError && checkAgain) {
        // Workflow was created by another process, use it
        workflowId = checkAgain.id;
      } else {
        // Create a new workflow
        const { data: newWorkflow, error: workflowError } = await supabase
          .from('review_workflows')
          .insert({
            record_type: 'gap_analysis_item',
            record_id: itemId,
            workflow_name: workflowName,
            workflow_description: workflowDescription,
            total_stages: 1,
            current_stage: 1,
            overall_status: 'pending',
            priority: 'medium',
            created_by: user.id
          })
          .select('id')
          .single();

        if (workflowError) {
          // Check if it's a duplicate key error (workflow already exists)
          if (workflowError.code === '23505' || workflowError.message?.includes('duplicate')) {
            // Try to fetch the existing workflow
            const { data: existing, error: fetchError } = await supabase
              .from('review_workflows')
              .select('id')
              .eq('record_type', 'gap_analysis_item')
              .eq('record_id', itemId)
              .maybeSingle();
            
            if (!fetchError && existing) {
              workflowId = existing.id;
            } else {
              return {
                success: false,
                message: `Failed to create review workflow: ${workflowError.message}`
              };
            }
          } else {
            return {
              success: false,
              message: `Failed to create review workflow: ${workflowError.message || 'Unknown error'}`
            };
          }
        } else if (!newWorkflow) {
          return {
            success: false,
            message: 'Failed to create review workflow - no workflow returned'
          };
        } else {
          workflowId = newWorkflow.id;
        }
      }
      
      // Create a default stage for the workflow (only if it's a new workflow)
      // Check if stage already exists
      const { data: existingStage } = await supabase
        .from('review_workflow_stages')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('stage_number', 1)
        .maybeSingle();

      if (!existingStage) {
        const { error: stageError } = await supabase
          .from('review_workflow_stages')
          .insert({
            workflow_id: workflowId,
            stage_number: 1,
            stage_name: 'Initial Review',
            stage_description: 'Initial review of gap analysis item',
            required_approvals: 1,
            approval_threshold: 1.0
          });

        if (stageError) {
          // Don't fail the whole operation if stage creation fails
        }
      }
    }

    // Check if assignment already exists
    const { data: existingAssignment, error: assignmentCheckError } = await supabase
      .from('review_assignments')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('reviewer_group_id', reviewerGroupId)
      .maybeSingle();

    if (assignmentCheckError) {
      return {
        success: false,
        message: 'Failed to check existing assignment'
      };
    }

    if (existingAssignment) {
      return {
        success: true,
        message: 'Reviewer group already assigned',
        workflowId
      };
    }

    // Create the review assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('review_assignments')
      .insert({
        workflow_id: workflowId,
        stage_number: 1,
        reviewer_group_id: reviewerGroupId,
        assignment_type: 'required',
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        status: 'pending'
      })
      .select();

    if (assignmentError) {
      return {
        success: false,
        message: `Failed to assign reviewer group: ${assignmentError.message}`
      };
    }

    if (!assignmentData || assignmentData.length === 0) {
      return {
        success: false,
        message: 'Failed to assign reviewer group - no assignment created'
      };
    }

    return {
      success: true,
      message: 'Reviewer group assigned successfully',
      workflowId
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get assigned reviewer groups for a gap analysis item
 */
export async function getGapItemReviewerGroups(itemId: string): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  group_type?: string;
}>> {
  try {
    // Find workflows for this gap item
    const { data: workflows, error: workflowsError } = await supabase
      .from('review_workflows')
      .select('id')
      .eq('record_type', 'gap_analysis_item')
      .eq('record_id', itemId);

    if (workflowsError) {
      return [];
    }

    if (!workflows || workflows.length === 0) {
      return [];
    }

    const workflowIds = workflows.map(w => w.id);

    // Get assignments for these workflows
    const { data: assignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select('reviewer_group_id')
      .in('workflow_id', workflowIds);

    if (assignmentsError) {
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const reviewerGroupIds = [...new Set(assignments.map(a => a.reviewer_group_id))];

    // Get reviewer group details
    const { data: reviewerGroups, error: groupsError } = await supabase
      .from('reviewer_groups')
      .select('id, name, description, group_type')
      .in('id', reviewerGroupIds);

    if (groupsError) {
      return [];
    }

    return (reviewerGroups || []).map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || undefined,
      group_type: group.group_type || undefined
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get individual reviewer names from assigned reviewer groups for a gap analysis item
 */
export async function getGapItemReviewerNames(itemId: string): Promise<Array<{
  id: string;
  name: string;
  email?: string;
}>> {
  try {
    // Find workflows for this gap item
    const { data: workflows, error: workflowsError } = await supabase
      .from('review_workflows')
      .select('id')
      .eq('record_type', 'gap_analysis_item')
      .eq('record_id', itemId);

    if (workflowsError) {
      return [];
    }

    if (!workflows || workflows.length === 0) {
      return [];
    }

    const workflowIds = workflows.map(w => w.id);

    // Get assignments for these workflows
    const { data: assignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select('reviewer_group_id')
      .in('workflow_id', workflowIds);

    if (assignmentsError) {
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const reviewerGroupIds = [...new Set(assignments.map(a => a.reviewer_group_id))];

    // Get reviewer groups with their members
    const { data: reviewerGroups, error: groupsError } = await supabase
      .from('reviewer_groups')
      .select(`
        id,
        reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
          user_id,
          user_profiles(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .in('id', reviewerGroupIds);

    if (groupsError) {
      return [];
    }

    // Extract unique users from all groups
    const userMap = new Map<string, { id: string; name: string; email?: string }>();

    reviewerGroups?.forEach((group: any) => {
      group.reviewer_group_members_new?.forEach((member: any) => {
        if (member.user_profiles && !userMap.has(member.user_id)) {
          const profile = member.user_profiles;
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim() || profile.email?.split('@')[0] || 'Unknown User';
          
          userMap.set(member.user_id, {
            id: member.user_id,
            name: fullName,
            email: profile.email
          });
        }
      });
    });

    return Array.from(userMap.values());
  } catch (error) {
    return [];
  }
}

/**
 * Remove a reviewer group assignment from a gap analysis item
 */
export async function removeReviewerGroupFromGapItem(
  itemId: string,
  reviewerGroupId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find workflows for this gap item
    const { data: workflows, error: workflowsError } = await supabase
      .from('review_workflows')
      .select('id')
      .eq('record_type', 'gap_analysis_item')
      .eq('record_id', itemId);

    if (workflowsError) {
      return {
        success: false,
        message: 'Failed to find review workflows'
      };
    }

    if (!workflows || workflows.length === 0) {
      return {
        success: false,
        message: 'No review workflows found for this item'
      };
    }

    const workflowIds = workflows.map(w => w.id);

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from('review_assignments')
      .delete()
      .in('workflow_id', workflowIds)
      .eq('reviewer_group_id', reviewerGroupId);

    if (deleteError) {
      return {
        success: false,
        message: 'Failed to remove reviewer group assignment'
      };
    }

    return {
      success: true,
      message: 'Reviewer group removed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Assign responsible persons to a gap analysis item
 * Stores responsible person user IDs in responsible_user_ids field as uuid array
 */
export async function assignResponsiblePersons(
  itemId: string,
  personIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Update the gap analysis item with the responsible person IDs
    const { error } = await supabase
      .from('gap_analysis_items')
      .update({
        responsible_user_ids: personIds.length > 0 ? personIds : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      return {
        success: false,
        message: `Failed to assign responsible persons: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Successfully assigned ${personIds.length} responsible person(s)`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get the list of responsible person user IDs assigned to a gap analysis item
 */
export async function getResponsiblePersons(itemId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('gap_analysis_items')
      .select('responsible_user_ids')
      .eq('id', itemId)
      .single();

    if (error) {
      return [];
    }

    if (!data?.responsible_user_ids) {
      return [];
    }

    // The field is already a uuid array in the database
    return Array.isArray(data.responsible_user_ids) ? data.responsible_user_ids as string[] : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get full responsible person details (names, avatars) for a gap analysis item
 */
export async function getResponsiblePersonDetails(itemId: string): Promise<Array<{
  id: string;
  name: string;
  email: string;
  avatar?: string;
}>> {
  try {
    const personIds = await getResponsiblePersons(itemId);

    if (personIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', personIds);

    if (error) {
      return [];
    }

    return (data || []).map(user => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
      email: user.email || '',
      avatar: user.avatar_url || undefined
    }));
  } catch (error) {
    return [];
  }
}