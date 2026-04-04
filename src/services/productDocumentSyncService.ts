import { supabase } from '@/integrations/supabase/client';
import { NoPhaseService } from './noPhaseService';

export interface SyncResult {
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  phasesCreated: number;
  sectionUpdated?: number;
  errors: string[];
}

/**
 * Sync missing company template documents to a product.
 * 1. Gets ALL phase IDs from company_chosen_phases + phases table + No Phase
 * 2. Builds a canonical phase ID per phase name (prefers company_chosen_phases IDs)
 * 3. Ensures lifecycle_phases exist on the product for each canonical phase
 * 4. Queries ALL company template docs (product_id IS NULL) by company_id AND phase_id
 * 5. Deduplicates by name + phase_name to avoid duplicates from two phase tables
 * 6. Inserts missing docs with the product's ID
 */
export async function syncMissingDocsToProduct(
  productId: string,
  companyId: string
): Promise<SyncResult> {
  const errors: string[] = [];

  try {
    // 1. Build maps from BOTH phase tables
    const phaseIdToName = new Map<string, string>(); // any phase id → name
    const canonicalPhaseId = new Map<string, string>(); // phase name → preferred id (from company_chosen_phases)

    // From company_chosen_phases (company_phases table) — these are the preferred/canonical IDs
    const { data: chosenPhases } = await supabase
      .from('company_chosen_phases')
      .select('phase_id, company_phases!inner(id, name)')
      .eq('company_id', companyId);

    (chosenPhases || []).forEach((cp: any) => {
      if (cp.company_phases?.id) {
        const id = cp.company_phases.id;
        const name = cp.company_phases.name;
        phaseIdToName.set(id, name);
        canonicalPhaseId.set(name, id); // company_chosen_phases IDs take priority
      }
    });

    // From phases table (some docs reference this table's IDs)
    const { data: phasesTableData } = await supabase
      .from('phases')
      .select('id, name')
      .eq('company_id', companyId);

    (phasesTableData || []).forEach(p => {
      phaseIdToName.set(p.id, p.name);
      // Only set canonical if not already set by company_chosen_phases
      if (!canonicalPhaseId.has(p.name)) {
        canonicalPhaseId.set(p.name, p.id);
      }
    });

    // Add "No Phase" for SOP documents
    try {
      const noPhaseId = await NoPhaseService.getNoPhaseId(companyId);
      if (noPhaseId) {
        phaseIdToName.set(noPhaseId, 'No Phase');
        if (!canonicalPhaseId.has('No Phase')) {
          canonicalPhaseId.set('No Phase', noPhaseId);
        }
      }
    } catch (e) {
      // No Phase might not exist, that's OK
    }

    if (canonicalPhaseId.size === 0) {
      return { success: true, created: 0, skipped: 0, total: 0, phasesCreated: 0, errors: [] };
    }

    // 2. Get active lifecycle_phases for this product — only sync docs for these phases
    let phasesCreated = 0;
    const { data: activeLifecyclePhases } = await supabase
      .from('lifecycle_phases')
      .select('id, name, phase_id')
      .eq('product_id', productId);

    // Build a set of active phase names and a map from phase name → lifecycle phase_id
    const activePhaseNames = new Set<string>();
    const activePhaseIdByName = new Map<string, string>(); // phase name → phase_id in lifecycle_phases
    (activeLifecyclePhases || []).forEach(lp => {
      activePhaseNames.add(lp.name);
      activePhaseIdByName.set(lp.name, lp.phase_id);
      // Also add lifecycle_phases.id → name to phaseIdToName so device docs using this ID can be resolved
      phaseIdToName.set(lp.id, lp.name);
    });

    // 3. Get ALL company template docs (product_id IS NULL)
    const allPhaseIds = Array.from(phaseIdToName.keys());

    // Query 1: docs with company_id set (only company_template scope, not company_document)
    const { data: docsByCompany, error: templateError1 } = await supabase
      .from('phase_assigned_document_template')
      .select('*')
      .eq('company_id', companyId)
      .eq('document_scope', 'company_template')
      .is('product_id', null);

    // Query 2: docs without company_id but with matching phase_id
    const { data: docsByPhase, error: templateError2 } = await supabase
      .from('phase_assigned_document_template')
      .select('*')
      .in('phase_id', allPhaseIds)
      .eq('document_scope', 'company_template')
      .is('product_id', null)
      .is('company_id', null);

    const templateError = templateError1 || templateError2;

    if (templateError) {
      return { success: false, created: 0, skipped: 0, total: 0, phasesCreated, errors: [templateError.message] };
    }

    // Merge by row id first
    const rawDocMap = new Map<string, any>();
    (docsByCompany || []).forEach(d => rawDocMap.set(d.id, d));
    (docsByPhase || []).forEach(d => rawDocMap.set(d.id, d));

    // 4. Deduplicate by name + phase_name (NOT phase_id) to avoid duplicates
    //    from the same doc existing under different phase table IDs
    const seenByNameAndPhase = new Map<string, any>(); // "docName::phaseName" → doc
    for (const doc of rawDocMap.values()) {
      const phaseName = phaseIdToName.get(doc.phase_id) || 'unknown';
      const key = `${doc.name}::${phaseName}`;
      if (!seenByNameAndPhase.has(key)) {
        seenByNameAndPhase.set(key, doc);
      }
    }
    const companyTemplateDocs = Array.from(seenByNameAndPhase.values());

    if (companyTemplateDocs.length === 0) {
      return { success: true, created: 0, skipped: 0, total: 0, phasesCreated, errors: [] };
    }

    // 5. Get existing product docs to avoid duplicates
    const { data: existingProductDocs, error: existingError } = await supabase
      .from('phase_assigned_document_template')
      .select('name, phase_id')
      .eq('product_id', productId);

    if (existingError) {
      return { success: false, created: 0, skipped: 0, total: companyTemplateDocs.length, phasesCreated, errors: [existingError.message] };
    }

    // Build existing keys by name + phase_name for consistent dedup
    const existingKeys = new Set(
      (existingProductDocs || []).map(d => {
        const pName = phaseIdToName.get(d.phase_id) || d.phase_id;
        return `${d.name}::${pName}`;
      })
    );

    // 6. Filter to only missing docs for ACTIVE phases at device level
    // Also include "No Phase" docs (SOP-type company templates that aren't phase-specific)
    const docsToInsert = companyTemplateDocs
      .filter(doc => {
        const phaseName = phaseIdToName.get(doc.phase_id) || 'unknown';
        // Allow "No Phase" docs through - they are company-wide SOP templates
        const isNoPhase = phaseName === 'No Phase';
        // Only sync docs for phases that exist in this product's lifecycle_phases, OR "No Phase" docs
        if (!isNoPhase && !activePhaseNames.has(phaseName)) return false;
        return !existingKeys.has(`${doc.name}::${phaseName}`);
      })
      .map(doc => {
        const phaseName = phaseIdToName.get(doc.phase_id) || 'unknown';
        const isNoPhase = phaseName === 'No Phase';
        // Use the phase_id from the product's lifecycle_phases (not company-level ID)
        // For "No Phase" docs, keep the original No Phase ID
        const targetPhaseId = isNoPhase 
          ? (canonicalPhaseId.get('No Phase') || doc.phase_id)
          : (activePhaseIdByName.get(phaseName) || canonicalPhaseId.get(phaseName) || doc.phase_id);
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

    const skipped = companyTemplateDocs.length - docsToInsert.length;

    // 7. Insert new docs in batches of 50
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

    // 8. Sync section data: make product docs match company template sections
    //    - If company has section → copy to product doc
    //    - If company has NO section → clear section on product doc
    //    - If company has DIFFERENT section → update product doc
    let sectionUpdated = 0;
    const templateDocsForActivePhases = companyTemplateDocs.filter(
      doc => {
        const phaseName = phaseIdToName.get(doc.phase_id) || 'unknown';
        return activePhaseNames.has(phaseName);
      }
    );

    if (templateDocsForActivePhases.length > 0) {
      const { data: existingDeviceDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id, sub_section, section_ids')
        .eq('product_id', productId);

      if (existingDeviceDocs && existingDeviceDocs.length > 0) {
        const deviceDocsByKey = new Map<string, any>();
        existingDeviceDocs.forEach(d => {
          const pName = phaseIdToName.get(d.phase_id) || d.phase_id;
          deviceDocsByKey.set(`${d.name}::${pName}`, d);
        });

        for (const templateDoc of templateDocsForActivePhases) {
          const phaseName = phaseIdToName.get(templateDoc.phase_id) || 'unknown';
          const key = `${templateDoc.name}::${phaseName}`;
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

            if (!updateError) sectionUpdated++;
            else errors.push(`Section update failed for ${templateDoc.name}: ${updateError.message}`);
          }
        }

        // Pass 2: stale-section cleanup — sections deleted from compliance_document_sections
        // leave behind matching stale values on both template and device docs, so the diff
        // above won't catch them. Clear any doc whose section_ids reference deleted sections.
        // Phase-aware stale cleanup: clear sections that are deleted OR belong to a
        // different phase than the document (cross-phase assignment).
        const { data: allSectionsData } = await supabase
          .from('compliance_document_sections')
          .select('id, phase_id')
          .eq('company_id', companyId);

        const sectionPhaseMap = new Map<string, string | null>();
        (allSectionsData || []).forEach((s: any) => {
          sectionPhaseMap.set(s.id, s.phase_id ?? null);
        });

        const isSectionStaleForDoc = (sectionIds: string[], docPhaseId: string | null): boolean => {
          return sectionIds.some((sid: string) => {
            if (!sectionPhaseMap.has(sid)) return true; // deleted → stale
            const sectionPhase = sectionPhaseMap.get(sid);
            if (sectionPhase === null) return false;    // company-wide → valid
            return docPhaseId !== null && sectionPhase !== docPhaseId; // wrong phase
          });
        };

        for (const deviceDoc of existingDeviceDocs) {
          if (!deviceDoc.section_ids?.length) continue;
          const pName = phaseIdToName.get(deviceDoc.phase_id) || deviceDoc.phase_id;
          const docPhaseId = activePhaseIdByName.get(pName) ?? null;
          if (isSectionStaleForDoc(deviceDoc.section_ids, docPhaseId)) {
            const { error: clearError } = await supabase
              .from('phase_assigned_document_template')
              .update({ sub_section: null, section_ids: null })
              .eq('id', deviceDoc.id);
            if (!clearError) sectionUpdated++;
          }
        }

        // Clear stale/cross-phase sections on company template docs too
        const staleTemplateDocs = templateDocsForActivePhases.filter(doc => {
          if (!doc.section_ids?.length) return false;
          const pName = phaseIdToName.get(doc.phase_id) || 'unknown';
          const docPhaseId = activePhaseIdByName.get(pName) ?? null;
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

    return { success: errors.length === 0, created, skipped, total: companyTemplateDocs.length, phasesCreated, sectionUpdated, errors };
  } catch (error) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      total: 0,
      phasesCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
