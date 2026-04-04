import { supabase } from '@/integrations/supabase/client';
import { TraceabilityLinksService } from './traceabilityLinksService';
import { SystemRequirementsService } from './systemRequirementsService';
import { SoftwareRequirementsService } from './softwareRequirementsService';
import { HardwareRequirementsService } from './hardwareRequirementsService';

export interface TraceabilityLink {
  id: string;
  company_id: string;
  product_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  rationale?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TraceabilityMatrix {
  [sourceId: string]: {
    [targetType: string]: TraceabilityLink[];
  };
}

export interface TraceabilityItem {
  id: string;
  type: string;
  identifier: string;
  name: string;
  status?: string;
  description?: string;
  verificationStatus?: string;
}

export class TraceabilityService {
  static async getTraceabilityMatrix(
    companyId: string,
    productId: string,
    sourceTypes: string[],
    targetTypes: string[]
  ): Promise<{
    matrix: TraceabilityMatrix;
    sourceItems: TraceabilityItem[];
    targetItems: TraceabilityItem[];
  }> {
    const links = await TraceabilityLinksService.getByProduct(productId);
    
    const matrix: TraceabilityMatrix = {};
    const sourceItems: TraceabilityItem[] = [];
    const targetItems: TraceabilityItem[] = [];

    // Normalize plural table-name types to singular identifiers used by the matrix
    const normalizeType = (t: string) => t === 'test_cases' ? 'test_case' : t;

    // Build matrix from explicit traceability_links table - add BOTH directions
    links.forEach(link => {
      link.source_type = normalizeType(link.source_type);
      link.target_type = normalizeType(link.target_type);
      // Forward direction: source → target
      if (!matrix[link.source_id]) {
        matrix[link.source_id] = {};
      }
      if (!matrix[link.source_id][link.target_type]) {
        matrix[link.source_id][link.target_type] = [];
      }
      matrix[link.source_id][link.target_type].push(link);
      
      // Reverse direction: target → source (so links show from both sides)
      if (!matrix[link.target_id]) {
        matrix[link.target_id] = {};
      }
      if (!matrix[link.target_id][link.source_type]) {
        matrix[link.target_id][link.source_type] = [];
      }
      // Create reverse link entry pointing back to source
      const reverseLink: TraceabilityLink = {
        ...link,
        id: `reverse-${link.id}`,
        source_type: link.target_type,
        source_id: link.target_id,
        target_type: link.source_type,
        target_id: link.source_id
      };
      // Avoid duplicates
      const exists = matrix[link.target_id][link.source_type].some(
        l => l.target_id === link.source_id
      );
      if (!exists) {
        matrix[link.target_id][link.source_type].push(reverseLink);
      }
    });

    // Fetch source items
    await Promise.all(sourceTypes.map(async (type) => {
      const items = await this.getItemsByType(productId, type);
      sourceItems.push(...items);
    }));

    // Fetch target items
    await Promise.all(targetTypes.map(async (type) => {
      const items = await this.getItemsByType(productId, type);
      targetItems.push(...items);
    }));

    // Parse traces_to from requirement_specifications and add virtual links
    try {
      await this.addTracesToLinks(productId, matrix, sourceItems, targetItems);
    } catch (error) {
      console.warn('Failed to resolve traces_to links:', error);
    }

    // Add physical thread virtual links: BOM → Component, Component → Feature, Feature → User Need
    try {
      await this.addPhysicalThreadLinks(productId, matrix, sourceItems, targetItems);
    } catch (error) {
      console.warn('Failed to resolve physical thread links:', error);
    }

    // === VERIFICATION STATUS ROLLUP (Bottom-Up V-Model) ===
    // Compute verificationStatus for ALL items using bottom-up rollup.
    // Order: test_cases → risk_controls → hazards → requirements → sources
    // An item is Verified only if it (or all its children) have passing tests.
    const allItemMap = new Map<string, TraceabilityItem>();
    for (const item of [...sourceItems, ...targetItems]) {
      allItemMap.set(item.id, item);
    }

    // V-model processing order (bottom-up)
    const typeOrder = ['test_case', 'risk_control', 'hazard', 'software_requirement', 'hardware_requirement', 'system_requirement', 'user_need', 'feature', 'device_component', 'bom_item'];

    // Step 1: Set test_case verification directly from their status
    for (const item of [...sourceItems, ...targetItems]) {
      if (item.type === 'test_case') {
        if (item.status === 'Passed') item.verificationStatus = 'Verified';
        else if (item.status === 'Failed') item.verificationStatus = 'Verification Failed';
        else item.verificationStatus = 'Verification Pending';
      }
    }

    // Step 2: For each remaining type (bottom-up), compute verification from children
    // Children = items this item links to that are LOWER in the V-model (closer to test_cases)
    const getChildTypes = (type: string): string[] => {
      const idx = typeOrder.indexOf(type);
      if (idx <= 0) return [];
      return typeOrder.slice(0, idx); // all types below this one in the hierarchy
    };

    const computeRollupStatus = (itemId: string, itemType: string): string => {
      const childTypes = getChildTypes(itemType);
      
      // Collect all direct (non-transitive) child links
      const childStatuses: string[] = [];
      let hasAnyChild = false;

      for (const childType of childTypes) {
        const links = (matrix[itemId]?.[childType] || [])
          .filter(l => !l.id.startsWith('transitive-'));
        
        for (const link of links) {
          const child = allItemMap.get(link.target_id);
          if (!child) continue;
          hasAnyChild = true;
          
          if (child.verificationStatus) {
            childStatuses.push(child.verificationStatus);
          } else {
            // Child hasn't been computed yet — treat as Not Verified
            childStatuses.push('Not Verified');
          }
        }
      }

      if (!hasAnyChild) return 'Not Verified'; // No downstream items at all

      // Rollup logic:
      // Any failure → Failed
      // Any "Not Verified" → Not Verified (gap in the chain)
      // All Verified → Verified
      // Otherwise → Pending
      if (childStatuses.some(s => s === 'Verification Failed')) return 'Verification Failed';
      if (childStatuses.some(s => s === 'Not Verified')) return 'Not Verified';
      if (childStatuses.every(s => s === 'Verified')) return 'Verified';
      return 'Verification Pending';
    };

    // Step 3: Process non-test-case types bottom-up
    for (const type of typeOrder) {
      if (type === 'test_case') continue; // already handled
      for (const item of [...sourceItems, ...targetItems]) {
        if (item.type !== type) continue;
        if (item.verificationStatus) continue; // already set
        item.verificationStatus = computeRollupStatus(item.id, item.type);
      }
    }

    return { matrix, sourceItems, targetItems };
  }

  private static async addTracesToLinks(
    productId: string,
    matrix: TraceabilityMatrix,
    sourceItems: TraceabilityItem[],
    targetItems: TraceabilityItem[]
  ): Promise<void> {
    // Get requirement specs with traces_to data
    const { data: reqSpecs } = await supabase
      .from('requirement_specifications')
      .select('id, requirement_id, traces_to, description')
      .eq('product_id', productId);

    if (!reqSpecs || reqSpecs.length === 0) return;

    // Build a map of user_need_id (like "UN-001") to UUID
    const { data: userNeeds } = await supabase
      .from('user_needs')
      .select('id, user_need_id')
      .eq('product_id', productId);

    const userNeedIdMap = new Map<string, string>();
    (userNeeds || []).forEach(un => {
      if (un.user_need_id) {
        userNeedIdMap.set(un.user_need_id.toUpperCase().trim(), un.id);
      }
    });

    // Build a map of SYSR requirement_id to UUID (for SWR/HWR traces_to SYSR)
    const sysrIdMap = new Map<string, string>();
    reqSpecs.forEach(spec => {
      if (spec.requirement_id && spec.requirement_id.toUpperCase().startsWith('SYSR')) {
        sysrIdMap.set(spec.requirement_id.toUpperCase().trim(), spec.id);
      }
    });

    // Helper to determine item type from requirement_id prefix
    const getTypeFromPrefix = (reqId: string): string => {
      const upper = reqId.toUpperCase();
      if (upper.startsWith('SWR')) return 'software_requirement';
      if (upper.startsWith('HWR')) return 'hardware_requirement';
      if (upper.startsWith('SYSR')) return 'system_requirement';
      return 'system_requirement';
    };

    // Helper to add a virtual link in both directions
    const addVirtualLink = (
      sourceId: string, sourceType: string,
      targetId: string, targetType: string,
      traceId: string, reqId: string
    ) => {
      const virtualLink: TraceabilityLink = {
        id: `virtual-${sourceId}-${targetId}`,
        company_id: '',
        product_id: productId,
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        link_type: 'derives_from',
        rationale: `Traced via traces_to: ${traceId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!matrix[sourceId]) matrix[sourceId] = {};
      if (!matrix[sourceId][targetType]) matrix[sourceId][targetType] = [];
      if (!matrix[sourceId][targetType].some(l => l.target_id === targetId)) {
        matrix[sourceId][targetType].push(virtualLink);
      }

      // Reverse direction
      const reverseLink: TraceabilityLink = {
        id: `virtual-reverse-${targetId}-${sourceId}`,
        company_id: '',
        product_id: productId,
        source_type: targetType,
        source_id: targetId,
        target_type: sourceType,
        target_id: sourceId,
        link_type: 'implemented_by',
        rationale: `Implemented by ${reqId} (from traces_to)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!matrix[targetId]) matrix[targetId] = {};
      if (!matrix[targetId][sourceType]) matrix[targetId][sourceType] = [];
      if (!matrix[targetId][sourceType].some(l => l.target_id === sourceId)) {
        matrix[targetId][sourceType].push(reverseLink);
      }
    };

    // Parse traces_to and create virtual links
    reqSpecs.forEach(spec => {
      if (!spec.traces_to) return;

      const specType = getTypeFromPrefix(spec.requirement_id || '');

      const tracesTo = spec.traces_to
        .split(/[,;]/)
        .map((t: string) => t.trim().toUpperCase())
        .filter((t: string) => t.length > 0);

      tracesTo.forEach((traceId: string) => {
        // Check if traces_to references a User Need
        const unUuid = userNeedIdMap.get(traceId);
        if (unUuid) {
          addVirtualLink(spec.id, specType, unUuid, 'user_need', traceId, spec.requirement_id || '');
          return;
        }

        // Check if traces_to references a SYSR
        const sysrUuid = sysrIdMap.get(traceId);
        if (sysrUuid) {
          addVirtualLink(spec.id, specType, sysrUuid, 'system_requirement', traceId, spec.requirement_id || '');
          return;
        }
      });
    });

    // === HAZARD LINK RESOLUTION ===
    // Fetch all hazards for this product
    const { data: hazards } = await supabase
      .from('hazards')
      .select('id, hazard_id, linked_requirements, risk_control_measure')
      .eq('product_id', productId);

    if (hazards && hazards.length > 0) {
      // Build hazard_id (e.g. "HAZ-SYS-001") → UUID map
      const hazardIdToUuid = new Map<string, string>();
      hazards.forEach(h => {
        if (h.hazard_id) {
          hazardIdToUuid.set(h.hazard_id.toUpperCase().trim(), h.id);
        }
      });

      // Build requirement_id → UUID map (all prefixes)
      const reqIdToUuid = new Map<string, string>();
      reqSpecs.forEach(spec => {
        if (spec.requirement_id) {
          reqIdToUuid.set(spec.requirement_id.toUpperCase().trim(), spec.id);
        }
      });

      // Direction 1: requirement.linked_risks → hazard links
      const { data: reqsWithRisks } = await supabase
        .from('requirement_specifications')
        .select('id, requirement_id, linked_risks')
        .eq('product_id', productId)
        .not('linked_risks', 'is', null);

      (reqsWithRisks || []).forEach(req => {
        if (!req.linked_risks) return;
        const hazardIds = req.linked_risks
          .split(/[,;]/)
          .map((s: string) => s.trim().toUpperCase())
          .filter((s: string) => s.length > 0);

        const reqType = getTypeFromPrefix(req.requirement_id || '');

        hazardIds.forEach((hId: string) => {
          const hazardUuid = hazardIdToUuid.get(hId);
          if (hazardUuid) {
            addVirtualLink(req.id, reqType, hazardUuid, 'hazard', hId, req.requirement_id || '');
          }
        });
      });

      // Direction 2: hazard.linked_requirements → requirement links
      hazards.forEach(h => {
        if (!h.linked_requirements) return;
        const reqIds = h.linked_requirements
          .split(/[,;]/)
          .map((s: string) => s.trim().toUpperCase())
          .filter((s: string) => s.length > 0);

        reqIds.forEach((rId: string) => {
          const reqUuid = reqIdToUuid.get(rId);
          if (reqUuid) {
            const reqType = getTypeFromPrefix(rId);
            addVirtualLink(h.id, 'hazard', reqUuid, reqType, rId, h.hazard_id || '');
          }
        });
      });

      // Link each hazard to its own risk control
      hazards.forEach(h => {
        if (h.risk_control_measure && h.risk_control_measure.trim().length > 0) {
          const rcId = `rc-${h.id}`;
          addVirtualLink(h.id, 'hazard', rcId, 'risk_control',
            h.hazard_id?.replace('HAZ-', 'RC-') || 'RC-???',
            h.hazard_id || '');

          // Propagate hazard → test_case links to RC → test_case
          // This ensures test cases show under the Risk Controls column too
          const hazardTestLinks = matrix[h.id]?.['test_case'] || [];
          hazardTestLinks.forEach(tcLink => {
            addVirtualLink(rcId, 'risk_control', tcLink.target_id, 'test_case',
              tcLink.target_id,
              h.hazard_id?.replace('HAZ-', 'RC-') || 'RC-???');
          });
        }
      });
    }

    // === TRANSITIVE LINK RESOLUTION ===
    // Run multiple passes to resolve multi-hop chains
    // e.g., UN → SYSR → Hazard → Test Case requires 2 passes
    for (let pass = 0; pass < 3; pass++) {
      const allSourceIds = Object.keys(matrix);
      let addedAny = false;

      for (const sourceId of allSourceIds) {
        const sourceEntry = matrix[sourceId];
        if (!sourceEntry) continue;

        for (const intermediateType of Object.keys(sourceEntry)) {
          const intermediateLinks = sourceEntry[intermediateType];
          if (!intermediateLinks) continue;

          for (const intermediateLink of intermediateLinks) {
            const intermediateId = intermediateLink.target_id;
            const intermediateEntry = matrix[intermediateId];
            if (!intermediateEntry) continue;

            for (const finalType of Object.keys(intermediateEntry)) {
              const sourceItem = sourceItems.find(s => s.id === sourceId);
              if (sourceItem && finalType === sourceItem.type) continue;
              if (finalType === intermediateType) continue;

              const finalLinks = intermediateEntry[finalType];
              if (!finalLinks) continue;

              for (const finalLink of finalLinks) {
                const finalId = finalLink.target_id;
                if (finalId === sourceId) continue;

                if (!matrix[sourceId][finalType]) matrix[sourceId][finalType] = [];
                if (!matrix[sourceId][finalType].some(l => l.target_id === finalId)) {
                  const transitiveLink: TraceabilityLink = {
                    id: `transitive-${sourceId}-${finalId}`,
                    company_id: '',
                    product_id: productId,
                    source_type: sourceItem?.type || 'unknown',
                    source_id: sourceId,
                    target_type: finalType,
                    target_id: finalId,
                    link_type: 'transitive',
                    rationale: `Transitive: via ${intermediateLink.target_id}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  matrix[sourceId][finalType].push(transitiveLink);
                  addedAny = true;
                }
              }
            }
          }
        }
      }

      // Stop early if no new links were added
      if (!addedAny) break;
    }
  }

  /**
   * Add virtual links for the physical implementation thread:
   * BOM Item → Device Component (via bom_items.component_id)
   * Device Component → Feature (via device_component_features)
   * Feature → User Need (via feature_user_needs junction table)
   */
  private static async addPhysicalThreadLinks(
    productId: string,
    matrix: TraceabilityMatrix,
    sourceItems: TraceabilityItem[],
    targetItems: TraceabilityItem[]
  ): Promise<void> {
    const allItems = [...sourceItems, ...targetItems];
    const allItemsById = new Map(allItems.map(i => [i.id, i]));

    const addVLink = (
      sourceId: string, sourceType: string,
      targetId: string, targetType: string
    ) => {
      if (!allItemsById.has(sourceId) || !allItemsById.has(targetId)) return;
      const linkId = `physical-${sourceId}-${targetId}`;
      if (!matrix[sourceId]) matrix[sourceId] = {};
      if (!matrix[sourceId][targetType]) matrix[sourceId][targetType] = [];
      if (matrix[sourceId][targetType].some(l => l.target_id === targetId)) return;
      matrix[sourceId][targetType].push({
        id: linkId, company_id: '', product_id: productId,
        source_type: sourceType, source_id: sourceId,
        target_type: targetType, target_id: targetId,
        link_type: 'physical_thread',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
      // Reverse
      if (!matrix[targetId]) matrix[targetId] = {};
      if (!matrix[targetId][sourceType]) matrix[targetId][sourceType] = [];
      if (!matrix[targetId][sourceType].some(l => l.target_id === sourceId)) {
        matrix[targetId][sourceType].push({
          id: `physical-rev-${targetId}-${sourceId}`, company_id: '', product_id: productId,
          source_type: targetType, source_id: targetId,
          target_type: sourceType, target_id: sourceId,
          link_type: 'physical_thread',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        });
      }
    };

    // 1. BOM Item → Component (via bom_items.component_id)
    const bomItems = allItems.filter(i => i.type === 'bom_item');
    if (bomItems.length > 0) {
      const { data: bomRows } = await supabase
        .from('bom_items')
        .select('id, component_id')
        .in('id', bomItems.map(b => b.id))
        .not('component_id', 'is', null);
      (bomRows || []).forEach(row => {
        if (row.component_id) addVLink(row.id, 'bom_item', row.component_id, 'device_component');
      });
    }

    // 2. Component → Feature (via device_component_features)
    const components = allItems.filter(i => i.type === 'device_component');
    if (components.length > 0) {
      const { data: dcfRows } = await supabase
        .from('device_component_features')
        .select('component_id, feature_name')
        .in('component_id', components.map(c => c.id));
      // Build feature name → feature item id map
      const featureByName = new Map<string, string>();
      allItems.filter(i => i.type === 'feature').forEach(f => {
        featureByName.set(f.name.toLowerCase(), f.id);
      });
      (dcfRows || []).forEach((row: any) => {
        const featureId = featureByName.get(row.feature_name?.toLowerCase());
        if (featureId) addVLink(row.component_id, 'device_component', featureId, 'feature');
      });
    }

    // 3. Feature → User Need (via feature_user_needs junction)
    const features = allItems.filter(i => i.type === 'feature');
    if (features.length > 0) {
      const { data: funRows } = await supabase
        .from('feature_user_needs')
        .select('feature_name, user_need_id')
        .eq('product_id', productId);
      const featureByName = new Map<string, string>();
      features.forEach(f => featureByName.set(f.name.toLowerCase(), f.id));
      (funRows || []).forEach((row: any) => {
        const featureId = featureByName.get(row.feature_name?.toLowerCase());
        if (featureId && row.user_need_id) addVLink(featureId, 'feature', row.user_need_id, 'user_need');
      });
    }

    // 4. Component → Requirement (via requirement_specifications.component_id)
    if (components.length > 0) {
      const { data: reqRows } = await supabase
        .from('requirement_specifications')
        .select('id, requirement_id, component_id')
        .eq('product_id', productId)
        .not('component_id', 'is', null);
      (reqRows || []).forEach(row => {
        if (!row.component_id) return;
        const reqType = row.requirement_id?.toUpperCase().startsWith('SWR') ? 'software_requirement'
          : row.requirement_id?.toUpperCase().startsWith('HWR') ? 'hardware_requirement'
          : 'system_requirement';
        addVLink(row.component_id, 'device_component', row.id, reqType);
      });
    }
  }

  static async getTraceabilityGaps(
    companyId: string,
    productId: string
  ): Promise<{
    unlinkedUserNeeds: TraceabilityItem[];
    unlinkedSystemRequirements: TraceabilityItem[];
    unlinkedSoftwareRequirements: TraceabilityItem[];
    unlinkedHardwareRequirements: TraceabilityItem[];
    unlinkedTestCases: TraceabilityItem[];
    unverifiedRequirements: TraceabilityItem[];
  }> {
    const links = await TraceabilityLinksService.getByProduct(productId);
    
    // Get all requirements
    const [userNeeds, systemReqs, softwareReqs, hardwareReqs, testCases, hazards] = await Promise.all([
      this.getItemsByType(productId, 'user_need'),
      this.getItemsByType(productId, 'system_requirement'),
      this.getItemsByType(productId, 'software_requirement'),
      this.getItemsByType(productId, 'hardware_requirement'),
      this.getItemsByType(productId, 'test_case'),
      this.getItemsByType(productId, 'hazard')
    ]);

    // Build linked sets from explicit links
    const linkedSourceIds = new Set(links.map(l => l.source_id));
    const linkedTargetIds = new Set(links.map(l => l.target_id));
    const verifiedIds = new Set(
      links
        .filter(l => l.link_type === 'verifies_control')
        .map(l => l.target_id)
    );

    // Also consider virtual links from traces_to and linked_risks on requirement_specifications
    const { data: reqSpecsForVirtual } = await supabase
      .from('requirement_specifications')
      .select('id, requirement_id, traces_to, linked_risks')
      .eq('product_id', productId);

    if (reqSpecsForVirtual) {
      for (const spec of reqSpecsForVirtual) {
        // traces_to: this spec traces to parent IDs (e.g., SYSR traces to UN)
        if (spec.traces_to) {
          const parentIds = spec.traces_to.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (parentIds.length > 0) {
            // The spec is a target (linked downstream), its parents are sources (linked upstream)
            linkedTargetIds.add(spec.id);
            // Find the parent items by identifier and mark them as linked sources
            for (const parentId of parentIds) {
              const parentItem = [...userNeeds, ...systemReqs, ...softwareReqs, ...hardwareReqs]
                .find(item => item.identifier === parentId);
              if (parentItem) {
                linkedSourceIds.add(parentItem.id);
              }
            }
          }
        }
        // linked_risks: this spec links to hazards
        if (spec.linked_risks) {
          const riskIds = spec.linked_risks.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (riskIds.length > 0) {
            linkedSourceIds.add(spec.id);
          }
        }
      }
    }

    // Also consider linked_requirements on hazards (batch query)
    if (hazards.length > 0) {
      const hazardIds = hazards.map(h => h.id);
      const { data: hazardsData } = await supabase
        .from('hazards')
        .select('id, linked_requirements')
        .in('id', hazardIds);
      
      if (hazardsData) {
        for (const hazardData of hazardsData) {
          if (hazardData.linked_requirements) {
            const reqIds = String(hazardData.linked_requirements).split(',').map((s: string) => s.trim()).filter(Boolean);
            if (reqIds.length > 0) {
              linkedTargetIds.add(hazardData.id);
              for (const reqId of reqIds) {
                const reqItem = [...systemReqs, ...softwareReqs, ...hardwareReqs]
                  .find(item => item.identifier === reqId);
                if (reqItem) {
                  linkedSourceIds.add(reqItem.id);
                }
              }
            }
          }
        }
      }
    }

    return {
      unlinkedUserNeeds: userNeeds.filter(item => !linkedSourceIds.has(item.id)),
      unlinkedSystemRequirements: systemReqs.filter(item => 
        !linkedSourceIds.has(item.id) && !linkedTargetIds.has(item.id)
      ),
      unlinkedSoftwareRequirements: softwareReqs.filter(item => 
        !linkedSourceIds.has(item.id) && !linkedTargetIds.has(item.id)
      ),
      unlinkedHardwareRequirements: hardwareReqs.filter(item => 
        !linkedSourceIds.has(item.id) && !linkedTargetIds.has(item.id)
      ),
      unlinkedTestCases: testCases.filter(item =>
        !linkedSourceIds.has(item.id) && !linkedTargetIds.has(item.id)
      ),
      unverifiedRequirements: [...systemReqs, ...softwareReqs, ...hardwareReqs].filter(
        item => !verifiedIds.has(item.id)
      )
    };
  }

  private static async getItemsByType(productId: string, type: string): Promise<TraceabilityItem[]> {
    switch (type) {
      case 'bom_item': {
        const { data } = await supabase
          .from('bom_items')
          .select('id, item_number, description, component_id, bom_revision_id, bom_revisions!inner(product_id, status)')
          .eq('bom_revisions.product_id', productId);
        return (data || []).map((item: any) => ({
          id: item.id,
          type: 'bom_item',
          identifier: item.item_number || 'BOM-???',
          name: item.description || 'BOM Item',
          description: item.description || '',
        }));
      }
      case 'device_component': {
        const { data } = await supabase
          .from('device_components')
          .select('id, name, description, component_type, part_number')
          .eq('product_id', productId);
        return (data || []).map(item => ({
          id: item.id,
          type: 'device_component',
          identifier: item.part_number || item.name,
          name: item.name,
          description: item.description || '',
        }));
      }
      case 'feature': {
        // Features are stored as JSON in products.key_features
        const { data: product } = await supabase
          .from('products')
          .select('key_features')
          .eq('id', productId)
          .single();
        if (!product?.key_features || !Array.isArray(product.key_features)) return [];
        return (product.key_features as any[]).map((f: any, idx: number) => {
          const name = typeof f === 'string' ? f : f?.name || 'Feature';
          return {
            id: `feature-${productId}-${idx}`,
            type: 'feature',
            identifier: `FEAT-${String(idx + 1).padStart(3, '0')}`,
            name,
            description: typeof f === 'object' ? f?.description || name : name,
          };
        });
      }
      case 'user_need': {
        const { data } = await supabase
          .from('user_needs')
          .select('*')
          .eq('product_id', productId);
        return (data || []).map(item => ({
          id: item.id,
          type: 'user_need',
          identifier: item.user_need_id || 'UN-???',
          name: item.description,
          status: item.status,
          description: item.description
        }));
      }
      case 'system_requirement': {
        // First try SystemRequirementsService
        const sysReqData = await SystemRequirementsService.getByProductId(productId);
        if (sysReqData.length > 0) {
          return sysReqData.map(item => ({
            id: item.id,
            type: 'system_requirement',
            identifier: item.requirement_id,
            name: item.description,
            status: item.status,
            description: item.description
          }));
        }
        
        // Fallback to requirement_specifications table - only SYSR-prefixed items
        const { data: reqSpecs } = await supabase
          .from('requirement_specifications')
          .select('*')
          .eq('product_id', productId)
          .ilike('requirement_id', 'SYSR-%');
        return (reqSpecs || []).map(item => ({
          id: item.id,
          type: 'system_requirement',
          identifier: item.requirement_id || 'SYSR-???',
          name: item.description,
          status: item.verification_status || 'draft',
          description: item.description
        }));
      }
      case 'software_requirement': {
        const swrData = await SoftwareRequirementsService.getByProductId(productId);
        if (swrData.length > 0) {
          return swrData.map(item => ({
            id: item.id,
            type: 'software_requirement',
            identifier: item.requirement_id,
            name: item.description,
            status: item.status,
            description: item.description
          }));
        }
        // Fallback to requirement_specifications table for SWR- prefixed items
        const { data: swrSpecs } = await supabase
          .from('requirement_specifications')
          .select('*')
          .eq('product_id', productId)
          .ilike('requirement_id', 'SWR-%');
        return (swrSpecs || []).map(item => ({
          id: item.id,
          type: 'software_requirement',
          identifier: item.requirement_id || 'SWR-???',
          name: item.description,
          status: item.verification_status || 'draft',
          description: item.description
        }));
      }
      case 'hardware_requirement': {
        const hwrData = await HardwareRequirementsService.getByProductId(productId);
        if (hwrData.length > 0) {
          return hwrData.map(item => ({
            id: item.id,
            type: 'hardware_requirement',
            identifier: item.requirement_id,
            name: item.description,
            status: item.status,
            description: item.description
          }));
        }
        // Fallback to requirement_specifications table for HWR- prefixed items
        const { data: hwrSpecs } = await supabase
          .from('requirement_specifications')
          .select('*')
          .eq('product_id', productId)
          .ilike('requirement_id', 'HWR-%');
        return (hwrSpecs || []).map(item => ({
          id: item.id,
          type: 'hardware_requirement',
          identifier: item.requirement_id || 'HWR-???',
          name: item.description,
          status: item.verification_status || 'draft',
          description: item.description
        }));
      }
      case 'test_case': {
        const { data } = await supabase
          .from('test_cases')
          .select('*')
          .eq('product_id', productId);
        // Fetch latest execution status for each test case
        const testCaseIds = (data || []).map(tc => tc.id);
        const { data: executions } = testCaseIds.length > 0
          ? await supabase
              .from('test_executions')
              .select('test_case_id, status, created_at')
              .in('test_case_id', testCaseIds)
              .order('created_at', { ascending: false })
          : { data: [] };
        // Build a map of test_case_id → latest execution status
        const latestExecStatus: Record<string, string> = {};
        (executions || []).forEach(exec => {
          if (!latestExecStatus[exec.test_case_id]) {
            latestExecStatus[exec.test_case_id] = exec.status;
          }
        });
        return (data || []).map(item => ({
          id: item.id,
          type: 'test_case',
          identifier: item.test_case_id || 'TC-???',
          name: item.test_case_id || 'Test Case',
          status: latestExecStatus[item.id] === 'pass' ? 'Passed' :
                  latestExecStatus[item.id] === 'fail' ? 'Failed' :
                  latestExecStatus[item.id] === 'blocked' ? 'Blocked' :
                  item.status,
          description: item.description
        }));
      }
      case 'hazard': {
        const { data } = await supabase
          .from('hazards')
          .select('*')
          .eq('product_id', productId);
        return (data || []).map(item => ({
          id: item.id,
          type: 'hazard',
          identifier: item.hazard_id || 'HAZ-???',
          name: item.description,
          description: item.description
        }));
      }
      case 'risk_control': {
        const { data: rcHazards } = await supabase
          .from('hazards')
          .select('id, hazard_id, risk_control_measure, risk_control_type')
          .eq('product_id', productId)
          .not('risk_control_measure', 'is', null);
        return (rcHazards || [])
          .filter(h => h.risk_control_measure && h.risk_control_measure.trim().length > 0)
          .map(item => ({
            id: `rc-${item.id}`,
            type: 'risk_control',
            identifier: item.hazard_id ? item.hazard_id.replace('HAZ-', 'RC-') : 'RC-???',
            name: item.risk_control_measure || 'Risk Control',
            description: item.risk_control_measure || ''
          }));
      }
      default:
        return [];
    }
  }
}

export const traceabilityService = TraceabilityService;