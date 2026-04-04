import { supabase } from '@/integrations/supabase/client';

export interface SafeSyncResult {
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  sectionUpdated?: number;
  errors: string[];
}

/**
 * Safe Document Sync Service
 * ONLY syncs documents — never touches lifecycle_phases.
 * Only syncs documents for phases that already exist at the device (product) level.
 */
export async function safeDocumentSync(
  productId: string,
  companyId: string,
  selectedOnly?: Array<{ name: string; phaseName: string }>
): Promise<SafeSyncResult> {
  const errors: string[] = [];

  try {
    // 1. Get this product's active lifecycle_phases — these are the ONLY phases we sync docs for
    const { data: lifecyclePhases, error: lpError } = await supabase
      .from('lifecycle_phases')
      .select('id, name, phase_id')
      .eq('product_id', productId);

    if (lpError) {
      return { success: false, created: 0, skipped: 0, total: 0, errors: [lpError.message] };
    }

    if (!lifecyclePhases || lifecyclePhases.length === 0) {
      return { success: true, created: 0, skipped: 0, total: 0, errors: [] };
    }

    // Build lookup: phase_id → phase name, and phase name → phase_id (from lifecycle_phases)
    const devicePhaseIdToName = new Map<string, string>();
    const devicePhaseNameToId = new Map<string, string>();
    lifecyclePhases.forEach(lp => {
      devicePhaseIdToName.set(lp.phase_id, lp.name); // company_phases.id → name
      devicePhaseIdToName.set(lp.id, lp.name);        // lifecycle_phases.id → name
      devicePhaseNameToId.set(lp.name, lp.phase_id);
    });

    // 2. Build a broader phase ID → name map from company tables
    //    (company template docs may reference different phase_id values)
    const allPhaseIdToName = new Map<string, string>();

    // From company_chosen_phases → company_phases
    const { data: chosenPhases } = await supabase
      .from('company_chosen_phases')
      .select('phase_id, company_phases!inner(id, name)')
      .eq('company_id', companyId);

    (chosenPhases || []).forEach((cp: any) => {
      if (cp.company_phases?.id && cp.company_phases?.name) {
        allPhaseIdToName.set(cp.company_phases.id, cp.company_phases.name);
      }
    });

    // From phases table (some docs reference this table)
    const { data: phasesTable } = await supabase
      .from('phases')
      .select('id, name')
      .eq('company_id', companyId);

    (phasesTable || []).forEach(p => {
      allPhaseIdToName.set(p.id, p.name);
    });

    // Also add the lifecycle_phases' own IDs (both phase_id and id)
    lifecyclePhases.forEach(lp => {
      allPhaseIdToName.set(lp.phase_id, lp.name); // company_phases.id → name
      allPhaseIdToName.set(lp.id, lp.name);        // lifecycle_phases.id → name
    });

    // 3. Get ALL company template docs (product_id IS NULL)
    const allKnownPhaseIds = Array.from(allPhaseIdToName.keys());

    const { data: docsByCompany } = await supabase
      .from('phase_assigned_document_template')
      .select('*')
      .eq('company_id', companyId)
      .eq('document_scope', 'company_template')
      .is('product_id', null);

    const { data: docsByPhase } = await supabase
      .from('phase_assigned_document_template')
      .select('*')
      .in('phase_id', allKnownPhaseIds)
      .eq('document_scope', 'company_template')
      .is('product_id', null)
      .is('company_id', null);

    // Merge and deduplicate by row id
    const rawDocMap = new Map<string, any>();
    (docsByCompany || []).forEach(d => rawDocMap.set(d.id, d));
    (docsByPhase || []).forEach(d => rawDocMap.set(d.id, d));

    // Deduplicate by name + phase_name
    const seenByKey = new Map<string, any>();
    for (const doc of rawDocMap.values()) {
      const phaseName = allPhaseIdToName.get(doc.phase_id) || 'unknown';
      const key = `${doc.name}::${phaseName}`;
      if (!seenByKey.has(key)) {
        seenByKey.set(key, { ...doc, _phaseName: phaseName });
      }
    }
    const allTemplateDocs = Array.from(seenByKey.values());
    const total = allTemplateDocs.length;

    if (total === 0) {
      return { success: true, created: 0, skipped: 0, total: 0, errors: [] };
    }

    // 4. Get existing product docs to avoid duplicates
    const { data: existingDocs, error: existingError } = await supabase
      .from('phase_assigned_document_template')
      .select('name, phase_id')
      .eq('product_id', productId);

    if (existingError) {
      return { success: false, created: 0, skipped: 0, total, errors: [existingError.message] };
    }

    const existingKeys = new Set(
      (existingDocs || []).map(d => {
        const pName = allPhaseIdToName.get(d.phase_id) || devicePhaseIdToName.get(d.phase_id) || d.phase_id;
        return `${d.name}::${pName}`;
      })
    );

    // 5. Filter: only docs for active device phases, skip already-existing
    // If selectedOnly is provided, further filter to only those docs
    const selectedKeys = selectedOnly
      ? new Set(selectedOnly.map(s => `${s.name.toLowerCase()}::${s.phaseName}`))
      : null;

    const docsToInsert = allTemplateDocs
      .filter(doc => {
        // Only sync docs whose phase exists at device level
        if (!devicePhaseNameToId.has(doc._phaseName)) return false;
        // Skip if already exists
        if (existingKeys.has(`${doc.name}::${doc._phaseName}`)) return false;
        // If selective sync, only include selected docs
        if (selectedKeys && !selectedKeys.has(`${doc.name.toLowerCase()}::${doc._phaseName}`)) return false;
        return true;
      })
      .map(doc => {
        // Use the phase_id from the device's lifecycle_phases
        const targetPhaseId = devicePhaseNameToId.get(doc._phaseName) || doc.phase_id;
        return {
          name: doc.name,
          description: doc.description,
          document_type: doc.document_type,
          document_scope: 'product_document' as const,
          status: doc.status || 'Not Started',
          product_id: productId,
          company_id: companyId,
          phase_id: targetPhaseId,
          tech_applicability: doc.tech_applicability || 'All device types',
          markets: doc.markets || [],
          classes_by_market: doc.classes_by_market || {},
          file_name: doc.file_name || '',
          file_path: doc.file_path || '',
          file_size: doc.file_size || 0,
          file_type: doc.file_type || '',
          public_url: doc.public_url || null,
          is_predefined_core_template: doc.is_predefined_core_template || false,
          uploaded_at: doc.uploaded_at || null,
          uploaded_by: doc.uploaded_by || null,
          reviewers: doc.reviewers || [],
          due_date: doc.due_date || null,
          reviewer_group_id: doc.reviewer_group_id || null,
          sub_section: doc.sub_section || null,
          section_ids: doc.section_ids || null,
          document_reference: doc.document_reference || null,
          version: doc.version || null,
          date: doc.date || null,
          is_current_effective_version: doc.is_current_effective_version || null,
          brief_summary: doc.brief_summary || null,
          authors_ids: doc.authors_ids || null,
          need_template_update: doc.need_template_update || null
        };
      });

    const skipped = total - docsToInsert.length;

    // 6. Insert new docs in batches of 50
    let created = 0;
    if (docsToInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < docsToInsert.length; i += batchSize) {
        const batch = docsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('phase_assigned_document_template')
          .insert(batch);

        if (insertError) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
        } else {
          created += batch.length;
        }
      }
    }

    // 7. Sync section data: make product docs match company template sections
    //    - If company has section → copy to product doc
    //    - If company has NO section → clear section on product doc
    //    - If company has DIFFERENT section → update product doc
    let sectionUpdated = 0;

    // Get all template docs that belong to active device phases
    const templateDocsForActivePhases = allTemplateDocs.filter(
      doc => devicePhaseNameToId.has(doc._phaseName)
    );

    if (templateDocsForActivePhases.length > 0) {
      // Get existing device docs — include ALL scopes, not just product_document
      const { data: existingDeviceDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id, sub_section, section_ids, document_scope')
        .eq('product_id', productId);

      if (existingDeviceDocs && existingDeviceDocs.length > 0) {
        // Build lookup: "name::phaseName" → device doc
        const deviceDocsByKey = new Map<string, any>();
        existingDeviceDocs.forEach(d => {
          const pName = allPhaseIdToName.get(d.phase_id) || devicePhaseIdToName.get(d.phase_id) || d.phase_id;
          deviceDocsByKey.set(`${d.name}::${pName}`, d);
        });

        for (const templateDoc of templateDocsForActivePhases) {
          const key = `${templateDoc.name}::${templateDoc._phaseName}`;
          const deviceDoc = deviceDocsByKey.get(key);
          if (!deviceDoc) continue;

          const companySubSection = templateDoc.sub_section || null;
          const companySectionIds = (templateDoc.section_ids && templateDoc.section_ids.length > 0) ? templateDoc.section_ids : null;
          const deviceSubSection = deviceDoc.sub_section || null;
          const deviceSectionIds = (deviceDoc.section_ids && deviceDoc.section_ids.length > 0) ? deviceDoc.section_ids : null;

          // Check if sections differ
          const subSectionChanged = companySubSection !== deviceSubSection;
          const sectionIdsChanged = JSON.stringify(companySectionIds) !== JSON.stringify(deviceSectionIds);

          if (subSectionChanged || sectionIdsChanged) {
            const { error: updateError } = await supabase
              .from('phase_assigned_document_template')
              .update({ sub_section: companySubSection, section_ids: companySectionIds })
              .eq('id', deviceDoc.id);

            if (!updateError) {
              sectionUpdated++;
            } else {
              errors.push(`Section update failed for ${templateDoc.name}: ${updateError.message}`);
            }
          }
        }

        // Pass 2: stale-section cleanup (phase-aware)
        // Two scenarios to handle:
        // A) Section was deleted entirely → ID no longer in compliance_document_sections
        // B) Section exists but belongs to a DIFFERENT phase than the doc
        //    (e.g. "test sync 1122" in phase X assigned to a doc in phase Y)
        //    The settings UI hides cross-phase sections visually, but the data
        //    still holds the assignment → sync must clear it.
        const { data: allSectionsData } = await supabase
          .from('compliance_document_sections')
          .select('id, phase_id')
          .eq('company_id', companyId);

        // sectionId → phase_id (null means company-wide / valid for any phase)
        const sectionPhaseMap = new Map<string, string | null>();
        (allSectionsData || []).forEach((s: any) => {
          sectionPhaseMap.set(s.id, s.phase_id ?? null);
        });

        const isSectionStaleForDoc = (sectionIds: string[], docPhaseId: string | null): boolean => {
          return sectionIds.some((sid: string) => {
            if (!sectionPhaseMap.has(sid)) return true; // deleted section → stale
            const sectionPhase = sectionPhaseMap.get(sid);
            if (sectionPhase === null) return false;    // company-wide section → valid
            // Section is phase-specific: only valid when it matches the doc's phase
            return docPhaseId !== null && sectionPhase !== docPhaseId;
          });
        };

        // Helper: resolve a doc's canonical company_phases.id
        const resolveDocPhaseId = (phaseId: string): string | null => {
          const pName = allPhaseIdToName.get(phaseId) || devicePhaseIdToName.get(phaseId);
          return pName ? (devicePhaseNameToId.get(pName) ?? null) : null;
        };

        // Clear stale/cross-phase sections on device docs
        for (const deviceDoc of existingDeviceDocs) {
          if (!deviceDoc.section_ids?.length) continue;
          const docPhaseId = resolveDocPhaseId(deviceDoc.phase_id);
          if (isSectionStaleForDoc(deviceDoc.section_ids, docPhaseId)) {
            const { error: clearError } = await supabase
              .from('phase_assigned_document_template')
              .update({ sub_section: null, section_ids: null })
              .eq('id', deviceDoc.id);
            if (!clearError) sectionUpdated++;
          }
        }

        // Clear stale/cross-phase sections on company template docs so future
        // template→device comparisons propagate null correctly
        const staleTemplateDocs = templateDocsForActivePhases.filter(doc => {
          if (!doc.section_ids?.length) return false;
          const docPhaseId = resolveDocPhaseId(doc.phase_id);
          return isSectionStaleForDoc(doc.section_ids, docPhaseId);
        });
        if (staleTemplateDocs.length > 0) {
          await supabase
            .from('phase_assigned_document_template')
            .update({ sub_section: null, section_ids: null })
            .in('id', staleTemplateDocs.map((d: any) => d.id));
        }
      }
    }

    return { success: errors.length === 0, created, skipped, total, sectionUpdated, errors };
  } catch (error) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      total: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
