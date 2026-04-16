
import { DocumentItem } from "@/types/client";
import { DocumentTypeDetector, DocumentTypeDetectionResult } from "@/utils/documentTypeDetector";
import { GapAnalysisUpdateService } from "@/services/gapAnalysisUpdateService";
import { CompanyTemplateService } from "@/services/companyTemplateService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuditTrailService } from "@/services/auditTrailService";

/**
 * Unified service that routes document updates to the correct handler
 */
export class UnifiedDocumentService {
  /**
   * Update any type of document/item using the appropriate service
   */
  static async updateDocument(item: DocumentItem): Promise<boolean> {
    try {
      console.log("UnifiedDocumentService: Starting update for item:", item.name);

      // Log document update to audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (item as any).company_id) {
        // Capture changes by fetching old values
        const changes: { field: string; oldValue?: string; newValue?: string; oldIds?: string[]; newIds?: string[]; resolveFrom?: string }[] = [];
        // Always fetch from phase_assigned_document_template for audit comparison
        // (document_studio_templates stores most fields in metadata JSON, not as columns)
        const { data: oldDoc } = await supabase
          .from('phase_assigned_document_template')
          .select('name, description, status, document_type, due_date, version, date, sub_section, document_reference, is_current_effective_version, need_template_update, is_record, phase_id, tags, file_path, file_name, authors_ids, reviewer_group_ids, reference_document_ids')
          .eq('id', item.id)
          .maybeSingle() as { data: any };

        if (oldDoc) {
          const fieldLabels: Record<string, string> = {
            name: 'Document Name', description: 'Description', status: 'Status',
            document_type: 'Document Type', due_date: 'Due Date', version: 'Version',
            date: 'Date', sub_section: 'Section', document_reference: 'Document Reference',
            phase_id: 'Core / Phase', is_current_effective_version: 'Current Effective Version',
            need_template_update: 'Need Template Update', is_record: 'Is Record',
            tags: 'Tags', file_path: 'Document File', file_name: 'Document File',
            authors_ids: 'Author', reviewer_group_ids: 'Reviewer Groups',
            reference_document_ids: 'Reference Documents',
          };
          const normalizeDate = (val: any) => String(val ?? '').slice(0, 10);
          const dateFields = new Set(['due_date', 'date']);
          const compare = (field: string, oldVal: any, newVal: any) => {
            const o = dateFields.has(field) ? normalizeDate(oldVal) : String(oldVal ?? '');
            const n = dateFields.has(field) ? normalizeDate(newVal) : String(newVal ?? '');
            if (o !== n) changes.push({ field: fieldLabels[field] || field, oldValue: o, newValue: n });
          };
          compare('name', oldDoc.name, item.name);
          compare('description', oldDoc.description, item.description);
          compare('status', oldDoc.status, item.status);
          compare('document_type', oldDoc.document_type, item.type);
          if ((item as any).due_date !== undefined) compare('due_date', oldDoc.due_date, (item as any).due_date);
          if ((item as any).version !== undefined) compare('version', oldDoc.version, (item as any).version);
          if ((item as any).date !== undefined) compare('date', oldDoc.date, (item as any).date);
          if ((item as any).sub_section !== undefined) compare('sub_section', oldDoc.sub_section, (item as any).sub_section);
          if ((item as any).document_reference !== undefined) compare('document_reference', oldDoc.document_reference, (item as any).document_reference);
          // Helper to safely parse array fields (DB may return JSON string or actual array)
          const toArray = (val: any): string[] => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') { try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {} }
            return [];
          };
          const resolveAuthorNames = async (ids: string[]) => {
            if (ids.length === 0) return '';
            const resolved: Record<string, string> = {};
            const { data: companyUsers } = await supabase.from('user_company_access').select('user_id, user_profiles!inner(id, first_name, last_name, email)').in('user_id', ids);
            (companyUsers || []).forEach((u: any) => { const p = u.user_profiles; if (p) resolved[u.user_id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || ''; });
            const remaining = ids.filter(id => !resolved[id]);
            if (remaining.length > 0) {
              const { data: invitations } = await supabase.from('user_invitations').select('id, first_name, last_name, email').in('id', remaining);
              (invitations || []).forEach(inv => { resolved[inv.id] = `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email || ''; });
            }
            const still = ids.filter(id => !resolved[id]);
            if (still.length > 0) {
              const { data: docAuthors } = await supabase.from('document_authors').select('id, name, last_name').in('id', still);
              (docAuthors || []).forEach(a => { resolved[a.id] = `${a.name || ''} ${a.last_name || ''}`.trim(); });
            }
            return ids.map(id => resolved[id]).filter(Boolean).join(', ');
          };
          const resolveGroupNames = async (ids: string[]) => {
            if (ids.length === 0) return '';
            const { data } = await supabase.from('reviewer_groups').select('id, name').in('id', ids);
            if (!data || data.length === 0) return '';
            return data.map((r) => r.name || '').join(', ');
          };
          const resolveRefDocNames = async (ids: string[]) => {
            if (ids.length === 0) return '';
            const { data } = await supabase.from('reference_documents').select('id, file_name').in('id', ids);
            if (!data || data.length === 0) return '';
            return data.map((r) => r.file_name || '').join(', ');
          };
          const resolvePhase = async (id: string | null) => {
            if (!id || id === '__CORE__') return id === '__CORE__' ? 'Core' : '';
            const { data } = await supabase.from('company_phases').select('name').eq('id', id).maybeSingle();
            return data?.name || '';
          };

          if ((item as any).phase_id !== undefined) {
            const oldId = oldDoc.phase_id || null;
            const newId = (item as any).phase_id || null;
            if (oldId !== newId) {
              const [oldName, newName] = await Promise.all([resolvePhase(oldId), resolvePhase(newId)]);
              changes.push({ field: fieldLabels['phase_id'], oldValue: oldName, newValue: newName, oldIds: oldId ? [oldId] : [], newIds: newId ? [newId] : [], resolveFrom: 'company_phases' });
            }
          }
          if ((item as any).is_current_effective_version !== undefined) compare('is_current_effective_version', oldDoc.is_current_effective_version, (item as any).is_current_effective_version);
          if ((item as any).need_template_update !== undefined) compare('need_template_update', oldDoc.need_template_update, (item as any).need_template_update);
          if ((item as any).is_record !== undefined) compare('is_record', oldDoc.is_record, (item as any).is_record);
          if ((item as any).tags !== undefined) compare('tags', JSON.stringify(oldDoc.tags || []), JSON.stringify((item as any).tags || []));
          if (item.file_name !== undefined || item.file_path !== undefined) compare('file_name', oldDoc.file_name, item.file_name);

          if ((item as any).authors_ids !== undefined) {
            const oldIds = toArray(oldDoc.authors_ids);
            const newIds = toArray((item as any).authors_ids);
            if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
              const [oldNames, newNames] = await Promise.all([resolveAuthorNames(oldIds), resolveAuthorNames(newIds)]);
              changes.push({ field: fieldLabels['authors_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'document_authors' });
            }
          }
          if ((item as any).reviewer_group_ids !== undefined) {
            const oldIds = toArray(oldDoc.reviewer_group_ids);
            const newIds = toArray((item as any).reviewer_group_ids);
            if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
              const [oldNames, newNames] = await Promise.all([resolveGroupNames(oldIds), resolveGroupNames(newIds)]);
              changes.push({ field: fieldLabels['reviewer_group_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'reviewer_groups' });
            }
          }
          if ((item as any).reference_document_ids !== undefined) {
            const oldIds = toArray(oldDoc.reference_document_ids);
            const newIds = toArray((item as any).reference_document_ids);
            if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
              const [oldNames, newNames] = await Promise.all([resolveRefDocNames(oldIds), resolveRefDocNames(newIds)]);
              changes.push({ field: fieldLabels['reference_document_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'reference_documents' });
            }
          }
        }

        const action = changes.some(c => c.field === 'Status') ? 'document_status_changed' as const : 'document_updated' as const;
        await AuditTrailService.logDocumentRecordEvent({
          userId: user.id,
          companyId: (item as any).company_id,
          action,
          entityType: 'document',
          entityId: item.id,
          entityName: item.name,
          changes: changes.length > 0 ? changes : undefined,
        });
      }

      // Detect the document type
      const detection = await DocumentTypeDetector.detectType(item);

      console.log("UnifiedDocumentService: Document type detected:", detection.type);

      // Route to the appropriate service
      switch (detection.type) {
        case 'ci-instance':
          return await this.updateCIInstance(item);
          
        case 'gap-analysis':
          return await this.updateGapAnalysisItem(item);
          
        case 'company-template':
          return await this.updateCompanyTemplate(item);
          
        case 'regular-document':
        default:
          return await this.updateRegularDocument(item);
      }
    } catch (error) {
      console.error("UnifiedDocumentService: Update failed:", error);
      toast.error("Failed to update document");
      return false;
    }
  }

  /**
   * Update gap analysis item
   */
  private static async updateGapAnalysisItem(item: DocumentItem): Promise<boolean> {
    console.log("UnifiedDocumentService: Updating gap analysis item");
    
    const gapService = new GapAnalysisUpdateService();
    return await gapService.updateGapItem(item.id, {
      name: item.name,
      description: item.description,
      status: item.status,
      assigned_to: item.assignedTo,
      priority: item.priority,
      action_needed: item.gapDescription || item.description
    });
  }

  /**
   * Update company template
   */
  private static async updateCompanyTemplate(item: DocumentItem): Promise<boolean> {
    console.log("UnifiedDocumentService: Updating company template");
    
    return await CompanyTemplateService.updateTemplate(item.id, {
      name: item.name,
      type: item.type,
      techApplicability: item.techApplicability,
      status: item.status,
      description: item.description
    });
  }

  /**
   * Update CI instance
   */
  private static async updateCIInstance(item: DocumentItem): Promise<boolean> {
    console.log("UnifiedDocumentService: Updating CI instance");
    
    // Get reviewer group assignment
    const reviewerGroupId = (item as any).reviewer_group_id || null;
    
    console.log("UnifiedDocumentService: CI reviewer_group_id:", reviewerGroupId);
    
    const updateData = {
      title: item.name,
      description: item.description,
      status: item.status,
      priority: (item as any).priority || 'medium',
      updated_at: new Date().toISOString()
    };
    
    console.log("UnifiedDocumentService: CI update data being sent:", updateData);
    
    // Update the CI instance
    const { error } = await supabase
      .from('ci_instances')
      .update(updateData)
      .eq('id', item.id);

    if (error) {
      console.error("UnifiedDocumentService: CI instance update failed:", error);
      toast.error(`Failed to update CI: ${error.message}`);
      return false;
    }

    // If reviewer group is assigned, update the phase timeline
    if (reviewerGroupId) {
      console.log("UnifiedDocumentService: Updating phase timeline with reviewer group");
      
      // Find the phase for this CI instance
      const { data: ciInstance } = await supabase
        .from('ci_instances')
        .select('phase_id')
        .eq('id', item.id)
        .single();
        
      if (ciInstance?.phase_id) {
        // Update the phase with the reviewer group
        const { error: phaseError } = await supabase
          .from('company_phases')
          .update({ reviewer_group_id: reviewerGroupId })
          .eq('id', ciInstance.phase_id);
          
        if (phaseError) {
          console.error("UnifiedDocumentService: Phase reviewer group update failed:", phaseError);
        } else {
          console.log("UnifiedDocumentService: Phase reviewer group updated successfully");
        }
      }
    }

    console.log("UnifiedDocumentService: CI instance updated successfully");
    toast.success("CI updated successfully");
    return true;
  }

  /**
   * Update regular document (company documents only use phase_assigned_document_template table)
   */
  private static async updateRegularDocument(item: DocumentItem): Promise<boolean> {

    const sourceTable = (item as any).source_table;

    // If this is a document_studio_templates document, update both sides
    if (sourceTable === 'document_studio_templates') {
      return await this.updateStudioDocument(item);
    }

    // Prepare reviewer group IDs - support both array and single ID for backward compatibility
    let reviewerGroupIds: string[] | null = null;
    if ((item as any).reviewer_group_ids) {
      // If reviewer_group_ids is provided as array, use it directly
      reviewerGroupIds = Array.isArray((item as any).reviewer_group_ids)
        ? (item as any).reviewer_group_ids
        : null;
    } else if ((item as any).reviewer_group_id) {
      // If reviewer_group_id is provided as single ID, convert to array
      reviewerGroupIds = [(item as any).reviewer_group_id];
    }

    const phaseId = (item as any).phase_id || null;

    // Update data for phase_assigned_document_template table
    const updateData: Record<string, any> = {
      name: item.name,
      document_type: item.type,
      description: item.description,
      status: item.status,
      tech_applicability: item.techApplicability,
      reviewer_group_ids: reviewerGroupIds,
      file_path: item.file_path || null,
      file_name: item.file_name || null,
      uploaded_at: item.uploaded_at || null,
      updated_at: new Date().toISOString(),
      sub_section: (item as any).sub_section || null,
      section_ids: (item as any).section_ids || null,
      document_reference: (item as any).document_reference || null,
      version: (item as any).version || null,
      date: (item as any).date || null,
      due_date: (item as any).due_date || null,
      phase_id: phaseId,
      is_current_effective_version: (item as any).is_current_effective_version || false,
      brief_summary: (item as any).brief_summary || null,
      authors_ids: (item as any).authors_ids || null,
      need_template_update: (item as any).need_template_update || false,
      is_record: (item as any).is_record || false,
      tags: (item as any).tags || null
    };

    // Set approval_date, approved_by, and approval_note when status is changed to "Approved"
    if (item.status?.toLowerCase() === 'approved') {
      updateData.approval_date = new Date().toISOString();

      // Get current user for approved_by
      const { data: { user } } = await supabase.auth.getUser();
      updateData.approved_by = user?.id || null;

      // Set approval note if provided
      if ((item as any).approval_note) {
        updateData.approval_note = (item as any).approval_note;
      }
    }

    // Update in phase_assigned_document_template table only
    const { error } = await supabase
      .from('phase_assigned_document_template')
      .update(updateData as any)
      .eq('id', item.id);

    if (error) {
      console.error("UnifiedDocumentService: Regular document update failed:", error);
      toast.error(`Failed to update document: ${error.message}`);
      return false;
    }

    // Also update the corresponding document_studio_templates record if linked via document_reference
    const docRef = (item as any).document_reference;
    if (docRef && typeof docRef === 'string' && docRef.startsWith('DS-')) {
      const studioId = docRef.replace('DS-', '');
      await supabase
        .from('document_studio_templates')
        .update({
          name: item.name,
          type: item.type || 'Standard',
          metadata: this.buildStudioMetadata(item),
          document_control: { version: (item as any).version || '1.0' },
          updated_at: new Date().toISOString()
        })
        .eq('id', studioId);
    }

    return true;
  }

  /**
   * Build metadata object for document_studio_templates that stores all editable fields
   */
  private static buildStudioMetadata(item: DocumentItem): Record<string, any> {
    return {
      description: item.description || '',
      status: item.status || 'Draft',
      tech_applicability: item.techApplicability || 'All device types',
      file_path: item.file_path || null,
      file_name: item.file_name || null,
      uploaded_at: item.uploaded_at || null,
      sub_section: (item as any).sub_section || null,
      section_ids: (item as any).section_ids || null,
      date: (item as any).date || null,
      due_date: (item as any).due_date || null,
      phase_id: (item as any).phase_id || null,
      is_current_effective_version: (item as any).is_current_effective_version || false,
      brief_summary: (item as any).brief_summary || null,
      authors_ids: (item as any).authors_ids || null,
      need_template_update: (item as any).need_template_update || false,
      is_record: (item as any).is_record || false,
      reviewer_group_ids: Array.isArray((item as any).reviewer_group_ids) ? (item as any).reviewer_group_ids : null,
      approval_date: (item as any).approval_date || null,
      approved_by: (item as any).approved_by || null,
      approval_note: (item as any).approval_note || null,
      tags: (item as any).tags || null,
      reference_document_ids: (item as any).reference_document_ids || null
    };
  }

  /**
   * Update a document_studio_templates document and sync to any linked CI doc
   */
  private static async updateStudioDocument(item: DocumentItem): Promise<boolean> {

    // Update the studio document with all fields stored in metadata
    const { error: studioError } = await supabase
      .from('document_studio_templates')
      .update({
        name: item.name,
        type: item.type || 'Standard',
        metadata: this.buildStudioMetadata(item),
        document_control: { version: (item as any).version || '1.0' },
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (studioError) {
      console.error("UnifiedDocumentService: Studio document update failed:", studioError);
      toast.error(`Failed to update document: ${studioError.message}`);
      return false;
    }

    // Also update any linked CI doc in phase_assigned_document_template (document_reference = DS-{id})
    const docReference = `DS-${item.id}`;
    const { data: linkedDocs } = await supabase
      .from('phase_assigned_document_template')
      .select('id')
      .eq('document_reference', docReference)
      .limit(1);

    if (linkedDocs && linkedDocs.length > 0) {
      // Prepare reviewer group IDs
      let reviewerGroupIds: string[] | null = null;
      if ((item as any).reviewer_group_ids) {
        reviewerGroupIds = Array.isArray((item as any).reviewer_group_ids)
          ? (item as any).reviewer_group_ids
          : null;
      } else if ((item as any).reviewer_group_id) {
        reviewerGroupIds = [(item as any).reviewer_group_id];
      }

      const ciUpdateData: Record<string, any> = {
        name: item.name,
        document_type: item.type,
        description: item.description,
        status: item.status,
        tech_applicability: item.techApplicability,
        reviewer_group_ids: reviewerGroupIds,
        file_path: item.file_path || null,
        file_name: item.file_name || null,
        uploaded_at: item.uploaded_at || null,
        updated_at: new Date().toISOString(),
        sub_section: (item as any).sub_section || null,
        section_ids: (item as any).section_ids || null,
        version: (item as any).version || null,
        date: (item as any).date || null,
        due_date: (item as any).due_date || null,
        is_current_effective_version: (item as any).is_current_effective_version || false,
        authors_ids: (item as any).authors_ids || null,
        need_template_update: (item as any).need_template_update || false,
        is_record: (item as any).is_record || false,
        tags: (item as any).tags || null
      };

      await supabase
        .from('phase_assigned_document_template')
        .update(ciUpdateData as any)
        .eq('document_reference', docReference);
    }
    
    return true;
  }
}
