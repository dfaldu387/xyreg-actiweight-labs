import React, { useState, useEffect, useMemo } from "react";
import { getPhaseDocuments } from "@/utils/phaseDocumentUtils";
import { supabase } from "@/integrations/supabase/client";
import { useUserDocumentAccess } from "@/hooks/useUserDocumentAccess";

const PHASE_DOC_SELECT = `
  id, name, status, document_type, tech_applicability,
  created_at, updated_at, file_path, file_name, due_date,
  approval_date, phase_id, description, reviewer_group_ids,
  reviewers, sub_section, section_ids, document_reference,
  version, date, is_current_effective_version, brief_summary,
  authors_ids, need_template_update, is_record,
  reference_document_ids, tags
`;

// Fetch master docs and merge into variant's phaseDocsData
async function mergeInheritedMasterDocs(
  productId: string,
  companyId: string,
  phaseDocsData: any[],
  phaseNameMap: Map<string, string>
): Promise<any[]> {
  const { data: variantCheck } = await supabase
    .from('products')
    .select('parent_product_id, parent_relationship_type')
    .eq('id', productId)
    .maybeSingle();

  if (!variantCheck?.parent_product_id || variantCheck.parent_relationship_type !== 'variant') {
    return phaseDocsData;
  }

  const masterId = variantCheck.parent_product_id;
  const { data: masterData } = await supabase.from('products').select('name').eq('id', masterId).maybeSingle();
  const masterName = masterData?.name || 'Master';

  // Fetch master's phase_assigned_document_template docs
  const { data: masterPhaseDocs } = await (supabase as any)
    .from('phase_assigned_document_template')
    .select(PHASE_DOC_SELECT)
    .eq('company_id', companyId)
    .eq('product_id', masterId);

  // Fetch master's documents table docs (with phase) — documents table has no 'tags' column
  const DOCS_TABLE_SELECT = PHASE_DOC_SELECT.replace(', tags', '');
  const { data: masterDocsDocs } = await (supabase as any)
    .from('documents')
    .select(`${DOCS_TABLE_SELECT}, template_source_id, document_scope`)
    .eq('product_id', masterId)
    .eq('company_id', companyId);

  // Dedup by unique doc id; also skip if variant already has that exact doc
  const variantDocIds = new Set(phaseDocsData.map(d => d.id));

  const allMasterDocs = [...(masterPhaseDocs || []), ...(masterDocsDocs || [])];
  const seenIds = new Set<string>();
  const inheritedDocs = allMasterDocs
    .filter(d => {
      if (!d.name || !d.id || seenIds.has(d.id) || variantDocIds.has(d.id)) return false;
      seenIds.add(d.id);
      return true;
    })
    .map(d => ({
      ...d,
      _isInheritedFromMaster: true,
      _masterProductName: masterName,
      _masterProductId: masterId,
      company_phases: {
        id: d.phase_id,
        name: phaseNameMap.get(d.phase_id) || 'Unknown Phase',
        company_id: companyId,
      },
    }));

  console.log(`[usePhaseDocuments] Inherited ${inheritedDocs.length} docs from master "${masterName}" (variant had ${phaseDocsData.length} own docs)`);
  return [...phaseDocsData, ...inheritedDocs];
}

// Helper function to get active (chosen) phase IDs and names for a company
async function getActivePhases(companyId: string): Promise<{ ids: string[]; names: string[] }> {
  const { data, error } = await supabase
    .from("company_chosen_phases")
    .select("company_phases!inner(id, name, position)")
    .eq("company_id", companyId);

  if (error) {
    console.error("[getActivePhases] Error fetching active phases:", error);
    return { ids: [], names: [] };
  }

  // Sort by position
  const sorted = (data || []).sort(
    (a: any, b: any) => (a.company_phases?.position || 0) - (b.company_phases?.position || 0),
  );

  const result = {
    ids: sorted.map((item: any) => item.company_phases.id),
    names: sorted.map((item: any) => item.company_phases.name),
  };

  return result;
}

// Helper function to get product lifecycle phases
async function getProductLifecyclePhases(productId: string): Promise<{ ids: string[]; names: string[] }> {
  const { data, error } = await supabase
    .from("lifecycle_phases")
    .select("id, name, phase_id, position")
    .eq("product_id", productId)
    .order("position");

  if (error) {
    console.error("Error fetching product lifecycle phases:", error);
    return { ids: [], names: [] };
  }

  // Filter out "No Phase" entries for accurate phase count
  const actualPhases = (data || []).filter((phase) => phase.name !== "No Phase");

  return {
    ids: actualPhases.map((phase) => phase.phase_id || phase.id),
    names: actualPhases.map((phase) => phase.name),
  };
}

export function usePhaseDocuments(companyId: string, productId?: string) {
  const { filterDocumentsByAccess } = useUserDocumentAccess();
  const [phaseDocuments, setPhaseDocuments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhaseCount, setActivePhaseCount] = useState(0);
  const [activePhaseNames, setActivePhaseNames] = useState<string[]>([]);
  const [productPhaseNames, setProductPhaseNames] = useState<string[]>([]);
  const [productPhaseCount, setProductPhaseCount] = useState(0);

  useEffect(() => {
    if (!companyId) return;

    const loadPhaseDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get active (chosen) phase IDs and names for this company
        const activePhases = await getActivePhases(companyId);
        const activePhaseIds = activePhases.ids;

        setActivePhaseCount(activePhaseIds.length);
        setActivePhaseNames(activePhases.names);

        // Also get product lifecycle phases if productId is provided
        if (productId) {
          const productPhases = await getProductLifecyclePhases(productId);
          // console.log('[usePhaseDocuments] Product lifecycle phase names:', productPhases.names);
          setProductPhaseNames(productPhases.names);
          setProductPhaseCount(productPhases.names.length);
        }

        // Note: even with 0 active phases, we still fetch all product docs below

        let phaseDocsData: any[] = [];
        let phaseError: any = null;

        // First try to get data with productId if provided
        if (productId) {
          // Get phase names map first
          const { data: phasesData } = await supabase
            .from("company_phases")
            .select("id, name")
            .eq("company_id", companyId);

          const phaseNameMap = new Map<string, string>();
          (phasesData || []).forEach((p) => phaseNameMap.set(p.id, p.name));

          // Get the product's active lifecycle phase IDs (company_phases IDs)
          const { data: lifecyclePhasesData } = await supabase
            .from("lifecycle_phases")
            .select("phase_id")
            .eq("product_id", productId);

          const lifecyclePhaseIds = (lifecyclePhasesData || [])
            .map((lp: any) => lp.phase_id)
            .filter(Boolean);

          // Fetch documents without INNER JOIN to avoid foreign key issues
          const { data: productData, error: productError } = await (supabase as any)
            .from("phase_assigned_document_template")
            .select(
              `
              id,
              name,
              status,
              document_type,
              tech_applicability,
              created_at,
              updated_at,
              file_path,
              file_name,
              due_date,
              approval_date,
              phase_id,
              description,
              reviewer_group_ids,
              reviewers,
              sub_section,
              section_ids,
              document_reference,
              version,
              date,
              is_current_effective_version,
              brief_summary,
              authors_ids,
              need_template_update,
              is_record,
              reference_document_ids,
              tags
            `,
            )
            .eq("company_id", companyId)
            .eq("product_id", productId)
            .eq("document_scope", "product_document");

          // Filter to only include docs belonging to the product's active lifecycle phases (+ no phase)
          let filteredProductData = productData || [];
          if (lifecyclePhaseIds.length > 0) {
            const lifecyclePhaseIdSet = new Set(lifecyclePhaseIds);
            filteredProductData = filteredProductData.filter((doc: any) =>
              !doc.phase_id || lifecyclePhaseIdSet.has(doc.phase_id)
            );
          }

          // Add phase name to each document
          phaseDocsData = filteredProductData.map((doc: any) => ({
            ...doc,
            company_phases: {
              id: doc.phase_id,
              name: phaseNameMap.get(doc.phase_id) || "Unknown Phase",
              company_id: companyId,
            },
          }));
          phaseError = productError;

          // Merge inherited master docs for variants
          phaseDocsData = await mergeInheritedMasterDocs(productId, companyId, phaseDocsData, phaseNameMap);
        }

        // No fallback to company_template - only show product_document scope

        // If no productId provided, get data by companyId only
        if (!productId) {
          const { data: companyData, error: companyError } = await (supabase as any)
            .from("phase_assigned_document_template")
            .select(
              `
              id,
              name,
              status,
              document_type,
              tech_applicability,
              created_at,
              updated_at,
              file_path,
              file_name,
              due_date,
              approval_date,
              phase_id,
              description,
              reviewer_group_ids,
              reviewers,
              sub_section,
              section_ids,
              document_reference,
              version,
              date,
              is_current_effective_version,
              brief_summary,
              authors_ids,
              need_template_update,
              is_record,
              reference_document_ids,
              tags
            `,
            )
            .eq("company_id", companyId)
            .in("document_scope", ["company_template", "product_document"]);

          // Include all documents with phases
          phaseDocsData = companyData || [];
          phaseError = companyError;
        }

        if (phaseError) throw phaseError;

        // Also fetch documents from 'documents' table for product documents without phases
        let documentsWithoutPhase: any[] = [];
        if (productId) {
          const { data: noPhaseDocs, error: noPhaseError } = await (supabase as any)
            .from("documents")
            .select(
              `
              id,
              name,
              status,
              document_type,
              tech_applicability,
              created_at,
              updated_at,
              file_path,
              file_name,
              due_date,
              approval_date,
              phase_id,
              description,
              reviewer_group_ids,
              reviewers,
              sub_section,
              section_ids,
              document_reference,
              version,
              date,
              is_current_effective_version,
              brief_summary,
              authors_ids,
              need_template_update,
              is_record,
              reference_document_ids,
              template_source_id,
              document_scope
            `,
            )
            .eq("product_id", productId)
            .eq("company_id", companyId)
            .eq("document_scope", "product_document")
            .is("phase_id", null);

          if (noPhaseError) {
            console.error("Error fetching documents without phase:", noPhaseError);
          } else {
            documentsWithoutPhase = noPhaseDocs || [];
          }
        }

        // Get lifecycle phase end dates for the product if productId is provided
        let phaseEndDateMap = new Map();
        if (productId) {
          const { data: lifecyclePhases, error: lifecyclePhasesError } = await supabase
            .from("lifecycle_phases")
            .select("phase_id, end_date")
            .eq("product_id", productId);

          if (lifecyclePhasesError) {
            console.error("Error loading lifecycle phases end dates:", lifecyclePhasesError);
          } else {
            (lifecyclePhases || []).forEach((phase) => {
              phaseEndDateMap.set(phase.phase_id, phase.end_date);
            });
          }
        }

        // Organize documents by phase name
        const phaseDocuments: Record<string, any[]> = {};

        (phaseDocsData || []).forEach((doc) => {
          const phaseName = (doc as any).company_phases?.name || "Unknown Phase";
          const phaseId = (doc as any).company_phases?.id || (doc as any).phase_id;
          const phaseEndDate = phaseEndDateMap.get(phaseId);

          // Bucket documents with null phase or "No Phase" into "No Phase"
          const normalizedPhaseName = (!phaseName || phaseName === "Unknown Phase" || phaseName === "No Phase") ? "No Phase" : phaseName;
          const documentData = {
            ...doc,
            phase_name: normalizedPhaseName,
            // Use lifecycle phase end date if no specific due date is set
            due_date: doc.due_date || phaseEndDate,
            dueDate: doc.due_date || phaseEndDate, // For compatibility
          };

          if (!phaseDocuments[normalizedPhaseName]) {
            phaseDocuments[normalizedPhaseName] = [];
          }
          phaseDocuments[normalizedPhaseName].push(documentData);
        });

        // Add documents without phase to a "No Phase" section
        if (documentsWithoutPhase.length > 0) {
          const noPhaseDocuments = documentsWithoutPhase.map((doc) => ({
            ...doc,
            phase_name: "No Phase",
            phase_id: null,
            due_date: doc.due_date,
            dueDate: doc.due_date,
          }));

          if (!phaseDocuments["No Phase"]) {
            phaseDocuments["No Phase"] = [];
          }
          phaseDocuments["No Phase"].push(...noPhaseDocuments);
        }

        setPhaseDocuments(phaseDocuments);
      } catch (err) {
        console.error("Error loading phase documents:", err);
        setError("Failed to load phase documents");
      } finally {
        setLoading(false);
      }
    };

    loadPhaseDocuments();
  }, [companyId, productId]);

  const updateDocumentStatus = async (documentId: string, status: string): Promise<boolean> => {
    try {
      // Normalize ID in case it has a non-UUID prefix like "template-"
      const normalizedId = typeof documentId === "string" ? documentId.replace(/^template-/, "") : documentId;

      // Get current document to check if it has reviewer groups assigned
      const { data: currentDoc } = await supabase
        .from("phase_assigned_document_template")
        .select("reviewer_group_ids")
        .eq("id", normalizedId)
        .single();

      // Only allow status change to "In Review" if reviewer groups are assigned
      if (status === "In Review" && (!currentDoc?.reviewer_group_ids || currentDoc.reviewer_group_ids.length === 0)) {
        // console.log('[usePhaseDocuments] Cannot set status to "In Review" without reviewer groups assigned');
        return false;
      }

      // Build updates object
      const updates: any = { status };

      // Set approval_date when status changes to Approved
      if (status.toLowerCase() === "approved") {
        updates.approval_date = new Date().toISOString();
      }

      const { error } = await supabase.from("phase_assigned_document_template").update(updates).eq("id", normalizedId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating document status:", error);
      return false;
    }
  };

  const refetch = React.useCallback(() => {
    // Trigger a re-fetch by updating a dependency
    // The useEffect will automatically run when companyId or productId changes
    // For manual refetch, we can force a re-render by updating state
    if (companyId) {
      setLoading(true);
      // The useEffect will handle the actual refetch
      // We just need to trigger it by updating a dependency or forcing a re-render
      // Since useEffect depends on companyId and productId, we can't easily force it
      // Instead, we'll reload the data directly
      const loadPhaseDocuments = async () => {
        try {
          setError(null);
          const activePhases = await getActivePhases(companyId);
          const activePhaseIds = activePhases.ids;

          if (activePhaseIds.length === 0 && !productId) {
            setPhaseDocuments({});
            return;
          }

          let phaseDocsData: any[] = [];
          let phaseError: any = null;

          if (productId) {
            // Get phase names map first
            const { data: phasesData } = await supabase
              .from("company_phases")
              .select("id, name")
              .eq("company_id", companyId);

            const phaseNameMap = new Map<string, string>();
            (phasesData || []).forEach((p) => phaseNameMap.set(p.id, p.name));

            // Get the product's active lifecycle phase IDs
            const { data: lifecyclePhasesData } = await supabase
              .from("lifecycle_phases")
              .select("phase_id")
              .eq("product_id", productId);

            const lifecyclePhaseIds = (lifecyclePhasesData || [])
              .map((lp: any) => lp.phase_id)
              .filter(Boolean);
            const lifecyclePhaseIdSet = new Set(lifecyclePhaseIds);

            const { data: productData, error: productError } = await (supabase as any)
              .from("phase_assigned_document_template")
              .select(PHASE_DOC_SELECT)
              .eq("company_id", companyId)
              .eq("product_id", productId)
              .eq("document_scope", "product_document");

            // Filter to only include docs from the product's lifecycle phases (+ no phase)
            let filteredData = productData || [];
            if (lifecyclePhaseIdSet.size > 0) {
              filteredData = filteredData.filter((doc: any) =>
                !doc.phase_id || lifecyclePhaseIdSet.has(doc.phase_id)
              );
            }

            // Add phase name to each document
            phaseDocsData = filteredData.map((doc: any) => ({
              ...doc,
              company_phases: {
                id: doc.phase_id,
                name: phaseNameMap.get(doc.phase_id) || "Unknown Phase",
                company_id: companyId,
              },
            }));
            phaseError = productError;

            // Merge inherited master docs for variants
            phaseDocsData = await mergeInheritedMasterDocs(productId, companyId, phaseDocsData, phaseNameMap);
          }

          // Also fetch documents from 'documents' table for product documents without phases
          let documentsWithoutPhase: any[] = [];
          if (productId) {
            const { data: noPhaseDocs, error: noPhaseError } = await (supabase as any)
              .from("documents")
              .select(
                `
                id,
                name,
                status,
                document_type,
                tech_applicability,
                created_at,
                updated_at,
                file_path,
                file_name,
                due_date,
                approval_date,
                phase_id,
                description,
                reviewer_group_ids,
                reviewers,
                sub_section,
                section_ids,
                document_reference,
                version,
                date,
                
                is_current_effective_version,
                brief_summary,
                authors_ids,
                need_template_update,
                is_record,
                template_source_id,
                document_scope
              `,
              )
              .eq("product_id", productId)
              .eq("company_id", companyId)
              .eq("document_scope", "product_document")
              .is("phase_id", null);

            if (!noPhaseError) {
              documentsWithoutPhase = noPhaseDocs || [];
            }
          }

          if (phaseError) throw phaseError;

          // Get lifecycle phase end dates
          let phaseEndDateMap = new Map();
          if (productId) {
            const { data: lifecyclePhases } = await supabase
              .from("lifecycle_phases")
              .select("phase_id, end_date")
              .eq("product_id", productId);

            (lifecyclePhases || []).forEach((phase) => {
              phaseEndDateMap.set(phase.phase_id, phase.end_date);
            });
          }

          // Organize documents by phase name
          const phaseDocumentsMap: Record<string, any[]> = {};
          (phaseDocsData || []).forEach((doc) => {
            const rawPhaseName = (doc as any).company_phases?.name || "Unknown Phase";
            const phaseName = (!rawPhaseName || rawPhaseName === "Unknown Phase" || rawPhaseName === "No Phase") ? "No Phase" : rawPhaseName;
            const phaseId = (doc as any).company_phases?.id || (doc as any).phase_id;
            const phaseEndDate = phaseEndDateMap.get(phaseId);

            const documentData = {
              ...doc,
              phase_name: phaseName,
              due_date: doc.due_date || phaseEndDate,
              dueDate: doc.due_date || phaseEndDate,
            };

            if (!phaseDocumentsMap[phaseName]) {
              phaseDocumentsMap[phaseName] = [];
            }
            phaseDocumentsMap[phaseName].push(documentData);
          });

          // Add documents without phase
          if (documentsWithoutPhase.length > 0) {
            const noPhaseDocuments = documentsWithoutPhase.map((doc) => ({
              ...doc,
              phase_name: "No Phase",
              phase_id: null,
              due_date: doc.due_date,
              dueDate: doc.due_date,
            }));

            if (!phaseDocumentsMap["No Phase"]) {
              phaseDocumentsMap["No Phase"] = [];
            }
            phaseDocumentsMap["No Phase"].push(...noPhaseDocuments);
          }

          setPhaseDocuments(phaseDocumentsMap);
        } catch (err) {
          console.error("Error refetching phase documents:", err);
          setError("Failed to refetch phase documents");
        } finally {
          setLoading(false);
        }
      };

      loadPhaseDocuments();
    }
  }, [companyId, productId]);

  // Reactively filter phaseDocuments by user access permissions
  const filteredPhaseDocuments = useMemo(() => {
    const filtered: Record<string, any[]> = {};
    for (const [phaseName, docs] of Object.entries(phaseDocuments)) {
      const accessibleDocs = filterDocumentsByAccess(docs);
      if (accessibleDocs.length > 0) {
        filtered[phaseName] = accessibleDocs;
      }
    }
    return filtered;
  }, [phaseDocuments, filterDocumentsByAccess]);

  return {
    phaseDocuments: filteredPhaseDocuments,
    loading,
    error,
    activePhaseCount,
    activePhaseNames,
    productPhaseNames,
    productPhaseCount,
    updateDocumentStatus,
    updateLoading: loading,
    refetch,
  };
}
