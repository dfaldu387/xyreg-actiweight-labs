
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductAuditLogService } from "./productAuditLogService";
import { AuditTrailService } from "./auditTrailService";

/**
 * Service dedicated to Template Instance Documents
 * These documents have template_source_id pointing to a company template and document_scope = 'product_document'
 */
export class TemplateInstanceDocumentService {
  private productId: string;
  private companyId: string;

  constructor(productId: string, companyId: string) {
    this.productId = productId;
    this.companyId = companyId;
  }

  /**
   * Validate that a document is truly a template instance
   */
  private validateTemplateInstanceDocument(document: any): boolean {
    

    // Must have template_source_id (not null)
    if (!document.template_source_id) {
      // console.log("TemplateInstanceDocumentService: VALIDATION FAILED - Missing template_source_id");
      return false;
    }

    // Must be a product document
    if (document.document_scope !== 'product_document') {
      // console.log("TemplateInstanceDocumentService: VALIDATION FAILED - Invalid document_scope:", document.document_scope);
      return false;
    }

    // Must belong to this product
    if (document.product_id !== this.productId) {
      // console.log("TemplateInstanceDocumentService: VALIDATION FAILED - Product ID mismatch:", document.product_id, "vs", this.productId);
      return false;
    }

    // console.log("TemplateInstanceDocumentService: VALIDATION PASSED - Valid template instance document");
    return true;
  }

  /**
   * Update template instance document
   */
  async updateDocument(documentId: string, updates: any): Promise<boolean> {
    try {
      // Capture old document state for audit trail before any updates
      const cleanDocId = documentId.startsWith('template-') ? documentId.replace('template-', '') : documentId;
      const { data: oldDoc } = await supabase
        .from("phase_assigned_document_template")
        .select("name, description, status, document_type, due_date, version, date, sub_section, document_reference, is_current_effective_version, need_template_update, is_record, phase_id, tags, file_path, file_name, authors_ids, reviewer_group_ids, reference_document_ids")
        .eq("id", cleanDocId)
        .maybeSingle();

      // Check if this is a template document (ID starts with 'template-')
      if (documentId.startsWith('template-')) {
        // console.log("TemplateInstanceDocumentService: Document ID starts with 'template-', using phase_assigned_document_template table");
        const cleanId = documentId.replace("template-", "");

        // Filter updates to only include valid columns
        const validColumns = [
          'name', 'description', 'document_type', 'status', 'due_date', 'deadline', 'file_path', 'file_name',
          'file_size', 'file_type', 'uploaded_at', 'uploaded_by', 'reviewer_group_ids',
          'reviewer_group_id', 'reviewers', 'public_url', 'start_date', 'phase_id', 'sub_section',
          'section_ids', 'document_reference', 'version', 'date', 'is_current_effective_version', 'brief_summary',
          'authors_ids', 'need_template_update', 'approval_date', 'is_record', 'reference_document_ids', 'tags'
        ];

        const filteredUpdates: any = {};
        for (const key of validColumns) {
          if (key in updates) {
            filteredUpdates[key] = updates[key];
          }
        }

        // Try phase_assigned_document_template first
        const { data: document, error: fetchError } = await supabase
          .from("phase_assigned_document_template")
          .select("*")
          .eq("id", cleanId)
          .maybeSingle();

        if (fetchError) {
          console.error("TemplateInstanceDocumentService: Database error in phase_assigned_document_template:", fetchError);
          toast.error("Database error occurred");
          return false;
        }

        if (document) {
          // Update in phase_assigned_document_template
        

          const { error: updateError } = await supabase
            .from("phase_assigned_document_template")
            .update({
              ...filteredUpdates,
              updated_at: new Date().toISOString()
            })
            .eq("id", cleanId);

          if (updateError) {
            console.error("TemplateInstanceDocumentService: Error updating template document:", updateError);
            toast.error("Failed to update document");
            return false;
          }

          // console.log("TemplateInstanceDocumentService: Successfully updated template document");
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        } else {
          // Fallback: Try documents table
          // console.log("TemplateInstanceDocumentService: Document not found in phase_assigned_document_template, trying documents table with cleanId:", cleanId);

          const { data: docInDocuments, error: docFetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", cleanId)
            .maybeSingle();

          if (docFetchError) {
            console.error("TemplateInstanceDocumentService: Database error in documents table:", docFetchError);
            toast.error("Database error occurred");
            return false;
          }

          if (!docInDocuments) {
            console.error("TemplateInstanceDocumentService: Template document not found in any table:", documentId);
            toast.error("Document not found");
            return false;
          }

          // Migrate: Insert into phase_assigned_document_template with updates applied
          // console.log("TemplateInstanceDocumentService: Migrating document from documents to phase_assigned_document_template");

          const migratedDoc = {
            name: filteredUpdates.name || docInDocuments.name,
            description: filteredUpdates.description !== undefined ? filteredUpdates.description : docInDocuments.description,
            document_type: docInDocuments.document_type,
            status: filteredUpdates.status || docInDocuments.status,
            company_id: docInDocuments.company_id,
            product_id: docInDocuments.product_id,
            phase_id: filteredUpdates.phase_id || docInDocuments.phase_id,
            document_scope: 'product_document' as const,
            tech_applicability: docInDocuments.tech_applicability,
            file_path: filteredUpdates.file_path !== undefined ? filteredUpdates.file_path : docInDocuments.file_path,
            file_name: filteredUpdates.file_name !== undefined ? filteredUpdates.file_name : docInDocuments.file_name,
            file_size: filteredUpdates.file_size !== undefined ? filteredUpdates.file_size : docInDocuments.file_size,
            file_type: filteredUpdates.file_type !== undefined ? filteredUpdates.file_type : docInDocuments.file_type,
            uploaded_at: filteredUpdates.uploaded_at !== undefined ? filteredUpdates.uploaded_at : docInDocuments.uploaded_at,
            reviewer_group_ids: filteredUpdates.reviewer_group_ids !== undefined ? filteredUpdates.reviewer_group_ids : docInDocuments.reviewer_group_ids,
            reviewers: filteredUpdates.reviewers !== undefined ? filteredUpdates.reviewers : docInDocuments.reviewers,
            due_date: filteredUpdates.due_date !== undefined ? filteredUpdates.due_date : docInDocuments.due_date,
            sub_section: filteredUpdates.sub_section !== undefined ? filteredUpdates.sub_section : docInDocuments.sub_section,
            document_reference: filteredUpdates.document_reference !== undefined ? filteredUpdates.document_reference : docInDocuments.document_reference,
            version: filteredUpdates.version !== undefined ? filteredUpdates.version : docInDocuments.version,
            date: filteredUpdates.date !== undefined ? filteredUpdates.date : docInDocuments.date,
            is_current_effective_version: filteredUpdates.is_current_effective_version !== undefined ? filteredUpdates.is_current_effective_version : docInDocuments.is_current_effective_version,
            brief_summary: filteredUpdates.brief_summary !== undefined ? filteredUpdates.brief_summary : docInDocuments.brief_summary,
            authors_ids: filteredUpdates.authors_ids !== undefined ? filteredUpdates.authors_ids : docInDocuments.authors_ids,
            need_template_update: filteredUpdates.need_template_update !== undefined ? filteredUpdates.need_template_update : docInDocuments.need_template_update,
            reference_document_ids: filteredUpdates.reference_document_ids !== undefined ? filteredUpdates.reference_document_ids : docInDocuments.reference_document_ids
          };

          // Only insert if phase_id exists (required field)
          if (!migratedDoc.phase_id) {
            // console.log("TemplateInstanceDocumentService: No phase_id, updating in documents table instead");
            const { error: updateError } = await supabase
              .from("documents")
              .update({
                ...filteredUpdates,
                updated_at: new Date().toISOString()
              })
              .eq("id", cleanId);

            if (updateError) {
              console.error("TemplateInstanceDocumentService: Error updating document:", updateError);
              toast.error("Failed to update document");
              return false;
            }
            await this.logDocumentUpdate(documentId, updates, oldDoc);
            return true;
          }

          const { data: newDoc, error: insertError } = await supabase
            .from("phase_assigned_document_template")
            .insert([migratedDoc])
            .select()
            .single();

          if (insertError) {
            console.error("TemplateInstanceDocumentService: Error migrating document:", insertError);
            toast.error("Failed to migrate document");
            return false;
          }

          // Delete from documents table to avoid duplicates
          await supabase.from("documents").delete().eq("id", cleanId);

          // console.log("TemplateInstanceDocumentService: Successfully migrated document to phase_assigned_document_template:", newDoc.id);
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        }

      } else {
        // For regular documents, try phase_assigned_document_template first
        const { data: document, error: fetchError } = await supabase
          .from("phase_assigned_document_template")
          .select("*")
          .eq("id", documentId)
          .maybeSingle();

        if (fetchError) {
          console.error("TemplateInstanceDocumentService: Database error:", fetchError);
          toast.error("Database error occurred");
          return false;
        }

        // Filter updates to only include valid columns
        const validColumns = [
          'name', 'description', 'document_type', 'status', 'due_date', 'deadline', 'file_path', 'file_name',
          'file_size', 'file_type', 'uploaded_at', 'uploaded_by', 'reviewer_group_ids',
          'reviewer_group_id', 'reviewers', 'public_url', 'start_date', 'phase_id', 'sub_section',
          'section_ids', 'document_reference', 'version', 'date', 'is_current_effective_version', 'brief_summary',
          'authors_ids', 'need_template_update', 'approval_date', 'is_record', 'reference_document_ids', 'tags'
        ];

        const filteredUpdates: any = {};
        for (const key of validColumns) {
          if (key in updates) {
            filteredUpdates[key] = updates[key];
          }
        }

        if (document) {
          // Document found in phase_assigned_document_template - update there
          const { error: updateError } = await supabase
            .from("phase_assigned_document_template")
            .update({
              ...filteredUpdates,
              updated_at: new Date().toISOString()
            })
            .eq("id", documentId);

          if (updateError) {
            console.error("TemplateInstanceDocumentService: Error updating document:", updateError);
            toast.error("Failed to update document");
            return false;
          }

          // console.log("TemplateInstanceDocumentService: Successfully updated document in phase_assigned_document_template");
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        } else {
          // Fallback: Try documents table and migrate if found
          // console.log("TemplateInstanceDocumentService: Document not found in phase_assigned_document_template, trying documents table");

          const { data: docInDocuments, error: docFetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .maybeSingle();

          if (docFetchError) {
            console.error("TemplateInstanceDocumentService: Database error in documents table:", docFetchError);
            toast.error("Database error occurred");
            return false;
          }

          if (!docInDocuments) {
            console.error("TemplateInstanceDocumentService: Document not found in any table:", documentId);
            toast.error("Document not found");
            return false;
          }

          // Migrate: Insert into phase_assigned_document_template with updates applied
          // console.log("TemplateInstanceDocumentService: Migrating document from documents to phase_assigned_document_template");

          const migratedDoc = {
            name: filteredUpdates.name || docInDocuments.name,
            description: filteredUpdates.description !== undefined ? filteredUpdates.description : docInDocuments.description,
            document_type: docInDocuments.document_type,
            status: filteredUpdates.status || docInDocuments.status,
            company_id: docInDocuments.company_id,
            product_id: docInDocuments.product_id,
            phase_id: filteredUpdates.phase_id || docInDocuments.phase_id,
            document_scope: 'product_document' as const,
            tech_applicability: docInDocuments.tech_applicability,
            file_path: filteredUpdates.file_path !== undefined ? filteredUpdates.file_path : docInDocuments.file_path,
            file_name: filteredUpdates.file_name !== undefined ? filteredUpdates.file_name : docInDocuments.file_name,
            file_size: filteredUpdates.file_size !== undefined ? filteredUpdates.file_size : docInDocuments.file_size,
            file_type: filteredUpdates.file_type !== undefined ? filteredUpdates.file_type : docInDocuments.file_type,
            uploaded_at: filteredUpdates.uploaded_at !== undefined ? filteredUpdates.uploaded_at : docInDocuments.uploaded_at,
            reviewer_group_ids: filteredUpdates.reviewer_group_ids !== undefined ? filteredUpdates.reviewer_group_ids : docInDocuments.reviewer_group_ids,
            reviewers: filteredUpdates.reviewers !== undefined ? filteredUpdates.reviewers : docInDocuments.reviewers,
            due_date: filteredUpdates.due_date !== undefined ? filteredUpdates.due_date : docInDocuments.due_date,
            sub_section: filteredUpdates.sub_section !== undefined ? filteredUpdates.sub_section : docInDocuments.sub_section,
            document_reference: filteredUpdates.document_reference !== undefined ? filteredUpdates.document_reference : docInDocuments.document_reference,
            version: filteredUpdates.version !== undefined ? filteredUpdates.version : docInDocuments.version,
            date: filteredUpdates.date !== undefined ? filteredUpdates.date : docInDocuments.date,
            is_current_effective_version: filteredUpdates.is_current_effective_version !== undefined ? filteredUpdates.is_current_effective_version : docInDocuments.is_current_effective_version,
            brief_summary: filteredUpdates.brief_summary !== undefined ? filteredUpdates.brief_summary : docInDocuments.brief_summary,
            authors_ids: filteredUpdates.authors_ids !== undefined ? filteredUpdates.authors_ids : docInDocuments.authors_ids,
            need_template_update: filteredUpdates.need_template_update !== undefined ? filteredUpdates.need_template_update : docInDocuments.need_template_update,
            reference_document_ids: filteredUpdates.reference_document_ids !== undefined ? filteredUpdates.reference_document_ids : docInDocuments.reference_document_ids
          };

          // Only migrate if phase_id exists (required field)
          if (!migratedDoc.phase_id) {
            // console.log("TemplateInstanceDocumentService: No phase_id, updating in documents table instead");
            const { error: updateError } = await supabase
              .from("documents")
              .update({
                ...filteredUpdates,
                updated_at: new Date().toISOString()
              })
              .eq("id", documentId);

            if (updateError) {
              console.error("TemplateInstanceDocumentService: Error updating document:", updateError);
              toast.error("Failed to update document");
              return false;
            }
            await this.logDocumentUpdate(documentId, updates, oldDoc);
            return true;
          }

          const { data: newDoc, error: insertError } = await supabase
            .from("phase_assigned_document_template")
            .insert([migratedDoc])
            .select()
            .single();

          if (insertError) {
            console.error("TemplateInstanceDocumentService: Error migrating document:", insertError);
            toast.error("Failed to migrate document");
            return false;
          }

          // Delete from documents table to avoid duplicates
          await supabase.from("documents").delete().eq("id", documentId);

          // console.log("TemplateInstanceDocumentService: Successfully migrated document to phase_assigned_document_template:", newDoc.id);
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        }
      }
    } catch (error) {
      console.error("TemplateInstanceDocumentService: Error in updateDocument:", error);
      toast.error("Failed to update document");
      return false;
    }
  }

  /**
   * Log document update to audit trail (fire-and-forget)
   */
  private async logDocumentUpdate(documentId: string, updates: any, oldDoc: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const changes: { field: string; oldValue?: string; newValue?: string; oldIds?: string[]; newIds?: string[]; resolveFrom?: string }[] = [];
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
        if (updates.name !== undefined) compare('name', oldDoc.name, updates.name);
        if (updates.description !== undefined) compare('description', oldDoc.description, updates.description);
        if (updates.status !== undefined) compare('status', oldDoc.status, updates.status);
        if (updates.document_type !== undefined) compare('document_type', oldDoc.document_type, updates.document_type);
        if (updates.due_date !== undefined) compare('due_date', oldDoc.due_date, updates.due_date);
        if (updates.version !== undefined) compare('version', oldDoc.version, updates.version);
        if (updates.date !== undefined) compare('date', oldDoc.date, updates.date);
        if (updates.sub_section !== undefined) compare('sub_section', oldDoc.sub_section, updates.sub_section);
        if (updates.document_reference !== undefined) compare('document_reference', oldDoc.document_reference, updates.document_reference);
        // Helper to safely parse array fields (DB may return JSON string or actual array)
        const toArray = (val: any): string[] => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') { try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {} }
          return [];
        };
        const resolveAuthorNames = async (ids: string[]) => {
          if (ids.length === 0) return '';
          const resolved: Record<string, string> = {};
          // 1. Check via user_company_access → user_profiles (same as MultiAuthorSelector)
          const { data: companyUsers } = await supabase.from('user_company_access').select('user_id, user_profiles!inner(id, first_name, last_name, email)').in('user_id', ids);
          (companyUsers || []).forEach((u: any) => { const p = u.user_profiles; if (p) resolved[u.user_id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || ''; });
          // 2. Check user_invitations (pending invites)
          const remaining = ids.filter(id => !resolved[id]);
          if (remaining.length > 0) {
            const { data: invitations } = await supabase.from('user_invitations').select('id, first_name, last_name, email').in('id', remaining);
            (invitations || []).forEach(inv => { resolved[inv.id] = `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email || ''; });
          }
          // 3. Check document_authors (custom authors)
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

        if (updates.phase_id !== undefined) {
          const oldId = oldDoc.phase_id || null;
          const newId = updates.phase_id || null;
          if (oldId !== newId) {
            const [oldName, newName] = await Promise.all([resolvePhase(oldId), resolvePhase(newId)]);
            changes.push({ field: fieldLabels['phase_id'], oldValue: oldName, newValue: newName, oldIds: oldId ? [oldId] : [], newIds: newId ? [newId] : [], resolveFrom: 'company_phases' });
          }
        }
        if (updates.is_current_effective_version !== undefined) compare('is_current_effective_version', oldDoc.is_current_effective_version, updates.is_current_effective_version);
        if (updates.need_template_update !== undefined) compare('need_template_update', oldDoc.need_template_update, updates.need_template_update);
        if (updates.is_record !== undefined) compare('is_record', oldDoc.is_record, updates.is_record);
        if (updates.tags !== undefined) compare('tags', JSON.stringify(oldDoc.tags || []), JSON.stringify(updates.tags || []));
        if (updates.file_name !== undefined || updates.file_path !== undefined) compare('file_name', oldDoc.file_name, updates.file_name);

        if (updates.authors_ids !== undefined) {
          const oldIds = toArray(oldDoc.authors_ids);
          const newIds = toArray(updates.authors_ids);
          if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
            const [oldNames, newNames] = await Promise.all([resolveAuthorNames(oldIds), resolveAuthorNames(newIds)]);
            changes.push({ field: fieldLabels['authors_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'document_authors' });
          }
        }
        if (updates.reviewer_group_ids !== undefined) {
          const oldIds = toArray(oldDoc.reviewer_group_ids);
          const newIds = toArray(updates.reviewer_group_ids);
          if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
            const [oldNames, newNames] = await Promise.all([resolveGroupNames(oldIds), resolveGroupNames(newIds)]);
            changes.push({ field: fieldLabels['reviewer_group_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'reviewer_groups' });
          }
        }
        if (updates.reference_document_ids !== undefined) {
          const oldIds = toArray(oldDoc.reference_document_ids);
          const newIds = toArray(updates.reference_document_ids);
          if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
            const [oldNames, newNames] = await Promise.all([resolveRefDocNames(oldIds), resolveRefDocNames(newIds)]);
            changes.push({ field: fieldLabels['reference_document_ids'], oldValue: oldNames, newValue: newNames, oldIds, newIds, resolveFrom: 'reference_documents' });
          }
        }
      }

      const action = changes.some(c => c.field === 'Status') ? 'document_status_changed' as const : 'document_updated' as const;
      await AuditTrailService.logDocumentRecordEvent({
        userId: user.id,
        companyId: this.companyId,
        action,
        entityType: 'document',
        entityId: documentId.replace(/^template-/, ''),
        entityName: updates.name || oldDoc?.name || 'Unknown document',
        changes: changes.length > 0 ? changes : undefined,
        actionDetails: { product_id: this.productId },
      });
    } catch {
      // Audit logging should not block document updates
    }
  }

  /**
   * Update document reviewers
   */
  async updateReviewers(documentId: string, reviewers: any[]): Promise<boolean> {
    try {
      // console.log("TemplateInstanceDocumentService: Updating reviewers for document:", documentId, reviewers);
      // console.log("reviewers", reviewers);

      const cleanDocumentId = documentId.replace("template-", "");
      // Check if this is a template document (ID starts with 'template-')
      if (documentId.startsWith('template-')) {
        // console.log("TemplateInstanceDocumentService: Document ID starts with 'template-', using phase_assigned_document_template table for reviewers");
        const reviewerIds = reviewers.map(reviewer => reviewer.id);
        // For template documents, query phase_assigned_document_template table
        const { data: document, error: fetchError } = await supabase
          .from("phase_assigned_document_template")
          .select("*")
          .eq("id", cleanDocumentId)
          .maybeSingle();

        if (fetchError) {
          console.error("TemplateInstanceDocumentService: Database error in phase_assigned_document_template:", fetchError);
          toast.error("Database error occurred");
          return false;
        }

        if (!document) {
          console.error("TemplateInstanceDocumentService: Template document not found in phase_assigned_document_template:", documentId);
          toast.error("Document not found");
          return false;
        }

        // Update reviewers in template document
        const { error: updateError } = await supabase
          .from("phase_assigned_document_template")
          .update({
            reviewers: reviewers,
            reviewer_group_ids: reviewerIds,
            updated_at: new Date().toISOString()
          })
          .eq("id", cleanDocumentId);

        if (updateError) {
          console.error("TemplateInstanceDocumentService: Error updating template document reviewers:", updateError);
          toast.error("Failed to update reviewers");
          return false;
        }

        // console.log("TemplateInstanceDocumentService: Successfully updated template document reviewers");
        toast.success("Reviewers updated successfully");
        return true;

      } else {
        // For regular documents, also use phase_assigned_document_template table
        const { data: document, error: fetchError } = await supabase
          .from("phase_assigned_document_template")
          .select("*")
          .eq("id", cleanDocumentId)
          .maybeSingle();

        if (fetchError) {
          console.error("TemplateInstanceDocumentService: Database error:", fetchError);
          toast.error("Database error occurred");
          return false;
        }

        if (!document) {
          console.error("TemplateInstanceDocumentService: Document not found:", documentId);
          toast.error("Document not found");
          return false;
        }

        const reviewerIds = reviewers.map(reviewer => reviewer.id);

        // Update reviewers in phase_assigned_document_template
        const { error: updateError } = await supabase
          .from("phase_assigned_document_template")
          .update({
            reviewers: reviewers,
            reviewer_group_ids: reviewerIds,
            updated_at: new Date().toISOString()
          })
          .eq("id", cleanDocumentId);

        if (updateError) {
          console.error("TemplateInstanceDocumentService: Error updating reviewers:", updateError);
          toast.error("Failed to update reviewers");
          return false;
        }

        // console.log("TemplateInstanceDocumentService: Successfully updated reviewers in phase_assigned_document_template");
        toast.success("Reviewers updated successfully");
        return true;
      }
    } catch (error) {
      console.error("TemplateInstanceDocumentService: Error in updateReviewers:", error);
      toast.error("Failed to update reviewers");
      return false;
    }
  }

  /**
   * Update document status
   * If status is "Approved", also set approval_date to current timestamp
   */
  async updateStatus(documentId: string, status: string): Promise<boolean> {
    const updates: any = { status };

    // Set approval_date when status changes to Approved
    if (status.toLowerCase() === 'approved') {
      updates.approval_date = new Date().toISOString();
    }

    return this.updateDocument(documentId, updates);
  }

  /**
   * Update document deadline
   */
  async updateDeadline(documentId: string, deadline: Date | undefined): Promise<boolean> {
    return this.updateDocument(documentId, {
      due_date: deadline?.toISOString()
    });
  }
}
