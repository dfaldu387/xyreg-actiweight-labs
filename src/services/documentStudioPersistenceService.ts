import { supabase } from "@/integrations/supabase/client";
import { DocumentTemplate } from "@/types/documentComposer";
import { toast } from "sonner";

export interface DocumentStudioData {
  id?: string;
  company_id: string;
  product_id?: string;
  template_id: string;
  name: string;
  type: string;
  sections: any[];
  product_context?: any;
  document_control?: any;
  document_number?: string;
  revision_history?: any[];
  associated_documents?: any[];
  metadata: any;
  smart_data?: any;
  role_mappings?: any[];
  notes?: any[];
  created_by?: string;
  last_edited_by?: string;
  created_at?: string;
  updated_at?: string;
  /** Technical File section IDs this document is linked to (e.g. ['TF-0-a', 'TF-1']) */
  tfLinks?: string[];
  /** If set, this document is backed by a Doc CI record and cannot be deleted from Studio alone */
  linkedCiId?: string;
}

interface DraftContentSignals {
  aiGeneratedCount: number;
  associatedDocumentCount: number;
  documentControlFields: number;
  filledParagraphCount: number;
  manualSignalCount: number;
  notesCount: number;
  placeholderCount: number;
  revisionHistoryCount: number;
  totalCharacters: number;
}

const PLACEHOLDER_TEXT_PATTERN = /\*\[To be completed\]\*/i;

/**
 * Service for persisting Document Studio data to Supabase
 */
export class DocumentStudioPersistenceService {
  private static normalizeTemplateRecord(data: any): DocumentStudioData {
    return {
      ...data,
      sections: Array.isArray(data?.sections) ? data.sections : [],
      product_context: data?.product_context || undefined,
      document_control: data?.document_control || undefined,
      revision_history: Array.isArray(data?.revision_history) ? data.revision_history : [],
      associated_documents: Array.isArray(data?.associated_documents) ? data.associated_documents : [],
      metadata: data?.metadata || {},
      smart_data: data?.smart_data || undefined,
      role_mappings: Array.isArray(data?.role_mappings) ? data.role_mappings : [],
      notes: Array.isArray(data?.notes) ? data.notes : []
    } as DocumentStudioData;
  }

  private static collectDraftContentSignals(row?: Partial<DocumentStudioData> | null): DraftContentSignals {
    const sections = Array.isArray(row?.sections) ? row.sections : [];
    const notes = Array.isArray(row?.notes) ? row.notes : [];
    const revisionHistory = Array.isArray(row?.revision_history) ? row.revision_history : [];
    const associatedDocuments = Array.isArray(row?.associated_documents) ? row.associated_documents : [];

    let aiGeneratedCount = 0;
    let filledParagraphCount = 0;
    let manualSignalCount = 0;
    let placeholderCount = 0;
    let totalCharacters = 0;

    for (const section of sections as any[]) {
      const contentItems = Array.isArray(section?.content) ? section.content : [];

      for (const item of contentItems) {
        const text = typeof item?.content === 'string' ? item.content.trim() : '';
        if (!text) continue;

        filledParagraphCount += 1;
        totalCharacters += text.length;

        if (PLACEHOLDER_TEXT_PATTERN.test(text)) {
          placeholderCount += 1;
        }

        if (item?.isAIGenerated) {
          aiGeneratedCount += 1;
        }

        if (
          item?.metadata?.author === 'user' ||
          item?.metadata?.author === 'ai' ||
          item?.metadata?.dataSource === 'manual' ||
          item?.metadata?.dataSource === 'auto-populated' ||
          item?.metadata?.aiUsed ||
          item?.metadata?.companyDataUsed
        ) {
          manualSignalCount += 1;
        }
      }
    }

    const documentControl = row?.document_control && typeof row.document_control === 'object'
      ? row.document_control as Record<string, any>
      : {};

    const documentControlFields = [
      documentControl.sopNumber,
      documentControl.documentOwner,
      documentControl.version,
      documentControl.preparedBy?.name,
      documentControl.reviewedBy?.name,
      documentControl.approvedBy?.name,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).length;

    return {
      aiGeneratedCount,
      associatedDocumentCount: associatedDocuments.length,
      documentControlFields,
      filledParagraphCount,
      manualSignalCount,
      notesCount: notes.length,
      placeholderCount,
      revisionHistoryCount: revisionHistory.length,
      totalCharacters,
    };
  }

  static hasMeaningfulSavedContent(row?: Partial<DocumentStudioData> | null): boolean {
    const signals = this.collectDraftContentSignals(row);

    return (
      signals.notesCount > 0 ||
      signals.aiGeneratedCount > 0 ||
      signals.manualSignalCount > 0 ||
      signals.documentControlFields > 0 ||
      signals.revisionHistoryCount > 0 ||
      signals.associatedDocumentCount > 0
    );
  }

  private static rankTemplateCandidate(row: any, preferredTemplateIds: string[] = []): number {
    const signals = this.collectDraftContentSignals(row);
    const preferredIndex = preferredTemplateIds.indexOf(row?.template_id || '');
    const preferredScore = preferredIndex === -1 ? 0 : Math.max(20, 60 - preferredIndex * 10);
    const recencyScore = row?.updated_at ? new Date(row.updated_at).getTime() / 1e11 : 0;

    return (
      preferredScore +
      signals.notesCount * 500 +
      signals.aiGeneratedCount * 120 +
      signals.manualSignalCount * 80 +
      signals.documentControlFields * 35 +
      signals.revisionHistoryCount * 40 +
      signals.associatedDocumentCount * 25 +
      signals.filledParagraphCount * 4 +
      signals.totalCharacters / 200 -
      signals.placeholderCount * 10 +
      recencyScore
    );
  }

  static pickBestTemplateRecord<T extends Partial<DocumentStudioData>>(rows: T[] | null | undefined, preferredTemplateIds: string[] = []): T | null {
    if (!rows?.length) return null;

    return [...rows].sort((left, right) => {
      const scoreDelta = this.rankTemplateCandidate(right, preferredTemplateIds) - this.rankTemplateCandidate(left, preferredTemplateIds);
      if (scoreDelta !== 0) return scoreDelta;

      const rightUpdatedAt = right.updated_at ? new Date(right.updated_at).getTime() : 0;
      const leftUpdatedAt = left.updated_at ? new Date(left.updated_at).getTime() : 0;
      return rightUpdatedAt - leftUpdatedAt;
    })[0] || null;
  }

  static async getDocumentCIsByReference(
    companyId: string,
    documentReference: string,
    productId?: string
  ): Promise<{ success: boolean; data?: Array<{ id: string; updated_at?: string | null }>; error?: string }> {
    try {
      let query = supabase
        .from('phase_assigned_document_template')
        .select('id, updated_at')
        .eq('company_id', companyId)
        .eq('document_reference', documentReference);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading CI records by document reference:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };
    } catch (error) {
      console.error('Error in getDocumentCIsByReference:', error);
      return { success: false, error: String(error) };
    }
  }

  static async loadBestTemplateForTemplateIds(
    companyId: string,
    templateIds: string[],
    productId?: string
  ): Promise<{ success: boolean; data?: DocumentStudioData; error?: string }> {
    try {
      const uniqueTemplateIds = [...new Set(templateIds.filter(Boolean))];

      if (uniqueTemplateIds.length === 0) {
        return { success: true, data: undefined };
      }

      let query = supabase
        .from('document_studio_templates')
        .select('*')
        .eq('company_id', companyId)
        .in('template_id', uniqueTemplateIds);

      if (productId) {
        query = query.eq('product_id', productId);
      } else {
        query = query.is('product_id', null);
      }

      const { data: rows, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading template candidates:', error);
        return { success: false, error: error.message };
      }

      const selectedRecord = this.pickBestTemplateRecord(rows as DocumentStudioData[] | null | undefined, uniqueTemplateIds);

      return {
        success: true,
        data: selectedRecord ? this.normalizeTemplateRecord(selectedRecord) : undefined,
      };
    } catch (error) {
      console.error('Error in loadBestTemplateForTemplateIds:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save or update document studio template data
   */
  static async saveTemplate(data: DocumentStudioData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const templateData = {
        ...data,
        last_edited_by: user.id,
        created_by: data.created_by || user.id,
        updated_at: new Date().toISOString()
      };

      if (data.id) {
        // Update existing template
        const { data: updatedData, error } = await supabase
          .from('document_studio_templates')
          .update(templateData)
          .eq('id', data.id)
          .eq('company_id', data.company_id)
          .select()
          .single();

        if (error) {
          console.error('Error updating template:', error);
          return { success: false, error: error.message };
        }

        await this.updateCIStatusToDraft(data.template_id, data.company_id, updatedData.id);
        return { success: true, id: updatedData.id };
      } else {
        // Create new template
        const { data: newData, error } = await supabase
          .from('document_studio_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) {
          console.error('Error creating template:', error);
          return { success: false, error: error.message };
        }

        await this.updateCIStatusToDraft(data.template_id, data.company_id, newData.id);
        return { success: true, id: newData.id };
      }
    } catch (error) {
      console.error('Error in saveTemplate:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update the CI record status to "Draft" if it's currently "Not Started".
   * Called after saving a draft so the document list reflects that work has begun.
   */
  private static async updateCIStatusToDraft(templateId: string, companyId: string, studioId?: string): Promise<void> {
    try {
      const { data: ciRecord } = await supabase
        .from('phase_assigned_document_template')
        .select('id, status, document_reference')
        .eq('id', templateId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (ciRecord) {
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Set status to Draft if not started
        if (!ciRecord.status || ciRecord.status.toLowerCase() === 'not started') {
          updates.status = 'Draft';
        }

        // Link the document_reference to the studio template if not already set
        if (studioId && (!ciRecord.document_reference || !ciRecord.document_reference.startsWith('DS-'))) {
          updates.document_reference = `DS-${studioId}`;
        }

        if (Object.keys(updates).length > 1) { // more than just updated_at
          await supabase
            .from('phase_assigned_document_template')
            .update(updates)
            .eq('id', ciRecord.id);
        }
      }
    } catch {
      // Non-critical — don't fail the save if status update fails
    }
  }

  /**
   * Load document studio template data
   */
  static async loadTemplate(
    companyId: string, 
    templateId: string, 
    productId?: string
  ): Promise<{ success: boolean; data?: DocumentStudioData; error?: string }> {
    return this.loadBestTemplateForTemplateIds(companyId, [templateId], productId);
  }

  /**
   * Save content changes with debouncing
   */
  static async saveContentChange(
    templateId: string,
    contentId: string,
    newContent: string,
    companyId: string,
    fullTemplate: DocumentTemplate,
    productId?: string
  ): Promise<boolean> {
    try {
      // Convert DocumentTemplate to DocumentStudioData format
      const templateData: DocumentStudioData = {
        company_id: companyId,
        product_id: productId,
        template_id: templateId,
        name: fullTemplate.name,
        type: fullTemplate.type,
        sections: fullTemplate.sections,
        product_context: fullTemplate.productContext,
        document_control: fullTemplate.documentControl,
        revision_history: fullTemplate.revisionHistory || [],
        associated_documents: fullTemplate.associatedDocuments || [],
        metadata: fullTemplate.metadata
      };

      // Check if template exists (respect product scope)
      const existingResult = await this.loadTemplate(companyId, templateId, productId);
      
      if (existingResult.success && existingResult.data) {
        // Update existing
        templateData.id = existingResult.data.id;
        const result = await this.saveTemplate(templateData);
        return result.success;
      } else {
        // Create new
        const result = await this.saveTemplate(templateData);
        return result.success;
      }
    } catch (error) {
      console.error('Error saving content change:', error);
      return false;
    }
  }

  /**
   * Auto-save with debouncing
   */
  private static saveTimeouts = new Map<string, NodeJS.Timeout>();
  
  static debouncedSave(
    templateId: string,
    template: DocumentTemplate,
    companyId: string,
    delay: number = 2000
  ): void {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(templateId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      const templateData: DocumentStudioData = {
        company_id: companyId,
        template_id: templateId,
        name: template.name,
        type: template.type,
        sections: template.sections,
        product_context: template.productContext,
        document_control: template.documentControl,
        revision_history: template.revisionHistory || [],
        associated_documents: template.associatedDocuments || [],
        metadata: template.metadata
      };

      const result = await this.saveTemplate(templateData);
      
      if (result.success) {
        console.log('Auto-saved template:', templateId);
      } else {
        console.error('Auto-save failed:', result.error);
      }
      
      this.saveTimeouts.delete(templateId);
    }, delay);

    this.saveTimeouts.set(templateId, timeout);
  }

  /**
   * Get all templates for a company
   */
  static async getCompanyTemplates(companyId: string): Promise<{ success: boolean; data?: DocumentStudioData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_studio_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading company templates:', error);
        return { success: false, error: error.message };
      }

      const mapped = (data || []).map(item => ({
        ...item,
        sections: Array.isArray(item.sections) ? item.sections : [],
        product_context: item.product_context || undefined,
        document_control: item.document_control || undefined,
        document_number: undefined,
        revision_history: Array.isArray(item.revision_history) ? item.revision_history : [],
        associated_documents: Array.isArray(item.associated_documents) ? item.associated_documents : [],
        metadata: item.metadata || {},
        smart_data: item.smart_data || undefined,
        role_mappings: Array.isArray(item.role_mappings) ? item.role_mappings : [],
        notes: Array.isArray(item.notes) ? item.notes : []
      } as DocumentStudioData));

      const templateIds = [...new Set(mapped.map(doc => doc.template_id).filter(Boolean))];
      const studioIds = [...new Set(mapped.map(doc => doc.id).filter(Boolean))] as string[];
      const dsReferences = studioIds.map(id => `DS-${id}`);

      // Map: CI id -> metadata, and DS-{studioId} -> metadata
      const ciMetadataById = new Map<string, { name: string | null; document_number: string | null }>();
      const ciMetadataByDsRef = new Map<string, { name: string | null; document_number: string | null }>();

      // Fetch CI metadata by template_id
      if (templateIds.length > 0) {
        const { data: ciMetadata, error: ciError } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, document_number')
          .in('id', templateIds);

        if (ciError) {
          console.error('Error loading CI metadata for studio templates:', ciError);
        } else {
          (ciMetadata || []).forEach((row) => {
            ciMetadataById.set(row.id, {
              name: row.name,
              document_number: row.document_number,
            });
          });
        }
      }

      // Fetch CI metadata by document_reference = DS-{studioId}
      if (dsReferences.length > 0) {
        const { data: ciByRef, error: refError } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, document_number, document_reference')
          .in('document_reference', dsReferences);

        if (refError) {
          console.error('Error loading CI metadata by DS reference:', refError);
        } else {
          (ciByRef || []).forEach((row) => {
            if (row.document_reference) {
              ciMetadataByDsRef.set(row.document_reference, {
                name: row.name,
                document_number: row.document_number,
              });
            }
          });
        }
      }

      // Fetch TF links for all CI IDs (both direct and DS-ref)
      const allCiIds = [...new Set([
        ...ciMetadataById.keys(),
        ...(Array.from(ciMetadataByDsRef.entries()).map(([dsRef]) => {
          // We need CI id, not DS ref — fetch below
          return null;
        }).filter(Boolean) as string[]),
      ])];

      // Build a map: CI id -> section_id[]
      const tfLinksByCiId = new Map<string, string[]>();

      // Also build DS-ref -> CI id map for reverse lookup
      const ciIdByDsRef = new Map<string, string>();

      if (dsReferences.length > 0) {
        const { data: ciByRefFull } = await supabase
          .from('phase_assigned_document_template')
          .select('id, document_reference')
          .in('document_reference', dsReferences);
        (ciByRefFull || []).forEach(row => {
          if (row.document_reference) ciIdByDsRef.set(row.document_reference, row.id);
        });
      }

      const allResolvedCiIds = [...new Set([
        ...templateIds,
        ...Array.from(ciIdByDsRef.values()),
      ])].filter(Boolean);

      if (allResolvedCiIds.length > 0) {
        const { data: tfLinksData } = await supabase
          .from('technical_file_document_links')
          .select('document_id, section_id')
          .in('document_id', allResolvedCiIds);
        (tfLinksData || []).forEach(row => {
          const existing = tfLinksByCiId.get(row.document_id) || [];
          existing.push(row.section_id);
          tfLinksByCiId.set(row.document_id, existing);
        });
      }

      const merged = mapped.map((doc) => {
        // Try direct template_id match first, then fallback to DS-{studioId} reference
        const ciMetadata = ciMetadataById.get(doc.template_id)
          || (doc.id ? ciMetadataByDsRef.get(`DS-${doc.id}`) : undefined);
        const existingDocumentControl = doc.document_control && typeof doc.document_control === 'object'
          ? doc.document_control
          : {};
        const currentDocumentNumber = ciMetadata?.document_number || existingDocumentControl.sopNumber || undefined;
        const currentName = ciMetadata?.name || doc.name;

        // Resolve TF links and CI linkage
        const resolvedCiId = ciMetadataById.has(doc.template_id)
          ? doc.template_id
          : (doc.id ? ciIdByDsRef.get(`DS-${doc.id}`) : undefined);
        const docTfLinks = resolvedCiId ? tfLinksByCiId.get(resolvedCiId) : undefined;

        return {
          ...doc,
          name: currentName,
          document_number: currentDocumentNumber,
          document_control: {
            ...existingDocumentControl,
            ...(currentDocumentNumber ? { sopNumber: currentDocumentNumber } : {}),
            documentTitle: (currentName || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '') || existingDocumentControl.documentTitle,
          },
          tfLinks: docTfLinks?.length ? docTfLinks : undefined,
          linkedCiId: resolvedCiId || (ciMetadata ? doc.template_id : undefined),
        } as DocumentStudioData;
      });

      // Deduplicate by document reference/template so renamed documents don't leave stale siblings in the list.
      const deduped = new Map<string, DocumentStudioData>();
      for (const doc of merged) {
        const key = doc.template_id || doc.id || doc.name;
        if (!deduped.has(key)) {
          deduped.set(key, doc);
        }
      }

      return { success: true, data: Array.from(deduped.values()) };
    } catch (error) {
      console.error('Error in getCompanyTemplates:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sync a saved studio template to a Document CI record in phase_assigned_document_template.
   * Creates or updates a matching record so the document appears in the CI document list.
   */
  static async syncToDocumentCI(params: {
    companyId: string;
    productId?: string;
    phaseId?: string;
    name: string;
    documentReference: string;
    documentScope: 'company_document' | 'product_document';
    htmlContent?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      // Resolve phaseId: if not provided, use the "No Phase" placeholder
      let resolvedPhaseId = params.phaseId;
      if (!resolvedPhaseId) {
        const { NoPhaseService } = await import('@/services/noPhaseService');
        resolvedPhaseId = await NoPhaseService.getNoPhaseId(params.companyId) || undefined;
        if (!resolvedPhaseId) {
          return { success: false, error: 'Could not resolve a phase for this document' };
        }
      }

      const existingResult = await this.getDocumentCIsByReference(
        params.companyId,
        params.documentReference,
        params.productId
      );

      if (!existingResult.success) {
        return { success: false, error: existingResult.error || 'Failed to check existing document CI records' };
      }

      const existing = existingResult.data?.[0];

      const record: Record<string, any> = {
        company_id: params.companyId,
        name: params.name,
        document_reference: params.documentReference,
        document_scope: params.documentScope,
        document_type: 'Report',
        status: 'Draft',
        updated_at: new Date().toISOString(),
        phase_id: resolvedPhaseId,
      };

      if (params.productId) record.product_id = params.productId;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('phase_assigned_document_template')
          .update(record)
          .eq('id', existing.id)
          .select('id')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, id: data.id };
      } else {
        record.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('phase_assigned_document_template')
          .insert(record as any)
          .select('id')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, id: data.id };
      }
    } catch (error) {
      console.error('Error in syncToDocumentCI:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Rebind a studio draft from a deterministic key (e.g. TF-0-a) to the CI UUID.
   * This ensures both TF drawer and Document Studio resolve the same draft.
   */
  static async rebindStudioDraftToCI(
    companyId: string,
    oldTemplateId: string,
    newCiId: string,
    productId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let query = supabase
        .from('document_studio_templates')
        .select('id, template_id')
        .eq('company_id', companyId)
        .eq('template_id', oldTemplateId);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: rows, error: fetchError } = await query;
      if (fetchError) return { success: false, error: fetchError.message };

      if (rows && rows.length > 0) {
        const { error: updateError } = await supabase
          .from('document_studio_templates')
          .update({ template_id: newCiId, updated_at: new Date().toISOString() })
          .eq('id', rows[0].id);

        if (updateError) return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in rebindStudioDraftToCI:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string, companyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_studio_templates')
        .delete()
        .eq('id', templateId)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
        return false;
      }

      toast.success('Template deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      toast.error('Failed to delete template');
      return false;
    }
  }
}