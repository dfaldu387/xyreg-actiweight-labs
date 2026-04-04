
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductAuditLogService } from "./productAuditLogService";
import { AuditLogService } from "./auditLogService";
import { AuditTrailService } from "./auditTrailService";


/**
 * Service dedicated to Product-Specific Documents
 * These documents have template_source_id = NULL and document_scope = 'product_document'
 */
export class ProductSpecificDocumentService {
  private productId: string;
  private companyId: string;

  constructor(productId: string, companyId: string) {
    this.productId = productId;
    this.companyId = companyId;
  }

  /**
   * Validate that a document is truly product-specific
   */
  private validateProductSpecificDocument(document: any): boolean {
    

    // Must NOT have template_source_id (null or undefined)
    if (document.template_source_id) {
      return false;
    }

    // Must be a product document
    if (document.document_scope !== 'product_document') {
      return false;
    }

    // Must belong to this product
    if (document.product_id !== this.productId) {
      return false;
    }

    // console.log("ProductSpecificDocumentService: VALIDATION PASSED - Valid product-specific document");
    return true;
  }

  /**
   * Update product-specific document
   */
  async updateDocument(documentId: string, updates: any): Promise<boolean> {

    // console.log("TemplateInstanceDocumentService: Updating document:", documentId, updates);
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
        // console.log("ProductSpecificDocumentService: Document ID starts with 'template-'");
        const cleanId = documentId.replace("template-", "");

        // Filter updates to only include valid columns
        const validColumns = [
          'name', 'description', 'document_type', 'status', 'due_date', 'deadline', 'file_path', 'file_name',
          'file_size', 'file_type', 'uploaded_at', 'uploaded_by', 'reviewer_group_ids',
          'reviewer_group_id', 'reviewers', 'public_url', 'start_date', 'phase_id', 'sub_section',
          'section_ids', 'document_reference', 'version', 'date', 'is_current_effective_version', 'brief_summary',
          'authors_ids', 'need_template_update', 'is_record', 'reference_document_ids', 'tags'
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
          console.error("ProductSpecificDocumentService: Database error in phase_assigned_document_template:", fetchError);
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
            console.error("ProductSpecificDocumentService: Error updating template document:", updateError);
            toast.error("Failed to update document");
            return false;
          }

          // console.log("ProductSpecificDocumentService: Successfully updated template document");
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        } else {
          // Fallback: Try documents table and migrate if found
          // console.log("ProductSpecificDocumentService: Document not found in phase_assigned_document_template, trying documents table");

          const { data: docInDocuments, error: docFetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", cleanId)
            .maybeSingle();

          if (docFetchError) {
            console.error("ProductSpecificDocumentService: Database error in documents table:", docFetchError);
            toast.error("Database error occurred");
            return false;
          }

          if (!docInDocuments) {
            console.error("ProductSpecificDocumentService: Template document not found in any table:", documentId);
            toast.error("Document not found");
            return false;
          }

          // Migrate: Insert into phase_assigned_document_template with updates applied
          // console.log("ProductSpecificDocumentService: Migrating document from documents to phase_assigned_document_template");

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
            // console.log("ProductSpecificDocumentService: No phase_id, updating in documents table instead");
            const { error: updateError } = await supabase
              .from("documents")
              .update({
                ...filteredUpdates,
                updated_at: new Date().toISOString()
              })
              .eq("id", cleanId);

            if (updateError) {
              console.error("ProductSpecificDocumentService: Error updating document:", updateError);
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
            console.error("ProductSpecificDocumentService: Error migrating document:", insertError);
            toast.error("Failed to migrate document");
            return false;
          }

          // Delete from documents table to avoid duplicates
          await supabase.from("documents").delete().eq("id", cleanId);

          // console.log("ProductSpecificDocumentService: Successfully migrated document to phase_assigned_document_template:", newDoc.id);
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
          console.error("ProductSpecificDocumentService: Database error:", fetchError);
          toast.error("Database error occurred");
          return false;
        }

        // Filter updates to only include valid columns
        const validColumns = [
          'name', 'description', 'document_type', 'status', 'due_date', 'deadline', 'file_path', 'file_name',
          'file_size', 'file_type', 'uploaded_at', 'uploaded_by', 'reviewer_group_ids',
          'reviewer_group_id', 'reviewers', 'public_url', 'start_date', 'phase_id', 'sub_section',
          'section_ids', 'document_reference', 'version', 'date', 'is_current_effective_version', 'brief_summary',
          'authors_ids', 'need_template_update', 'is_record', 'reference_document_ids', 'tags'
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
            console.error("ProductSpecificDocumentService: Error updating document:", updateError);
            toast.error("Failed to update document");
            return false;
          }

          // console.log("ProductSpecificDocumentService: Successfully updated document in phase_assigned_document_template");
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        } else {
          // Fallback: Try documents table and migrate if found
          // console.log("ProductSpecificDocumentService: Document not found in phase_assigned_document_template, trying documents table");

          const { data: docInDocuments, error: docFetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .maybeSingle();

          if (docFetchError) {
            console.error("ProductSpecificDocumentService: Database error in documents table:", docFetchError);
            toast.error("Database error occurred");
            return false;
          }

          if (!docInDocuments) {
            console.error("ProductSpecificDocumentService: Document not found in any table:", documentId);
            toast.error("Document not found");
            return false;
          }

          // Migrate: Insert into phase_assigned_document_template with updates applied
          // console.log("ProductSpecificDocumentService: Migrating document from documents to phase_assigned_document_template");

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
            // console.log("ProductSpecificDocumentService: No phase_id, updating in documents table instead");
            const { error: updateError } = await supabase
              .from("documents")
              .update({
                ...filteredUpdates,
                updated_at: new Date().toISOString()
              })
              .eq("id", documentId);

            if (updateError) {
              console.error("ProductSpecificDocumentService: Error updating document:", updateError);
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
            console.error("ProductSpecificDocumentService: Error migrating document:", insertError);
            toast.error("Failed to migrate document");
            return false;
          }

          // Delete from documents table to avoid duplicates
          await supabase.from("documents").delete().eq("id", documentId);

          // console.log("ProductSpecificDocumentService: Successfully migrated document to phase_assigned_document_template:", newDoc.id);
          await this.logDocumentUpdate(documentId, updates, oldDoc);
          return true;
        }
      }
    } catch (error) {
      console.error("ProductSpecificDocumentService: Error in updateDocument:", error);
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
  async updateReviewers(documentId: string, reviewers: any[], user: any): Promise<boolean> {
    try {
      // console.log("ProductSpecificDocumentService: Updating reviewers for document:", documentId, reviewers);

      // Clean document ID if it starts with 'template-'
      const cleanDocumentId = documentId.startsWith('template-')
        ? documentId.replace('template-', '')
        : documentId;

      // Use phase_assigned_document_template table
      const { data: document, error: fetchError } = await supabase
        .from("phase_assigned_document_template")
        .select("*")
        .eq("id", cleanDocumentId)
        .single();

      if (fetchError || !document) {
        console.error("ProductSpecificDocumentService: Document not found:", fetchError);
        toast.error("Document not found");
        return false;
      }

      const reviewerIds = reviewers.map(reviewer => reviewer.id);

      // Update reviewers in phase_assigned_document_template
      const { error: updateError } = await supabase
        .from("phase_assigned_document_template")
        .update({
          reviewer_group_ids: reviewerIds,
          reviewers: reviewers,
          updated_at: new Date().toISOString()
        })
        .eq("id", cleanDocumentId);

      if (updateError) {
        console.error("ProductSpecificDocumentService: Error updating reviewers:", updateError);
        toast.error("Failed to update reviewers");
        return false;
      }

      // console.log("ProductSpecificDocumentService: Successfully updated reviewers in phase_assigned_document_template");
      await ProductAuditLogService.createProductAuditLog({
        action: 'ADD_REVIEWER',
        entityType: 'REVIEWER',
        entityName: document.name,
        description: document.description,
        productId: this.productId,
        companyId: this.companyId,
      });
      toast.success("Reviewers updated successfully");
      return true;
    } catch (error) {
      console.error("ProductSpecificDocumentService: Error in updateReviewers:", error);
      toast.error("Failed to update reviewers");
      return false;
    }
  }

  /**
   * Update document status
   */
  async updateStatus(documentId: string, status: string): Promise<boolean> {
    return this.updateDocument(documentId, { status });
  }

  /**
   * Update document deadline
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Capture document name before deletion for audit trail
      let documentName = 'Unknown document';
      const { data: nameData } = await supabase
        .from("phase_assigned_document_template")
        .select("name")
        .eq("id", documentId)
        .maybeSingle();
      if (nameData?.name) {
        documentName = nameData.name;
      } else {
        const { data: nameData2 } = await supabase
          .from("documents")
          .select("name")
          .eq("id", documentId)
          .maybeSingle();
        if (nameData2?.name) documentName = nameData2.name;
      }

      // Check if document exists in documents table
      const { data: docInDocuments, error: checkError } = await supabase
        .from("documents")
        .select("id, phase_id")
        .eq("id", documentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("ProductSpecificDocumentService: Error checking document:", checkError);
        return false;
      }

      // Check if document exists in phase_assigned_document_template table
      const { data: docInPhaseTable, error: checkPhaseError } = await supabase
        .from("phase_assigned_document_template")
        .select("id, phase_id")
        .eq("id", documentId)
        .single();

      if (checkPhaseError && checkPhaseError.code !== 'PGRST116') {
        console.error("ProductSpecificDocumentService: Error checking phase document:", checkPhaseError);
        return false;
      }

      // Delete from documents table if exists
      if (docInDocuments) {
        const { error: deleteError } = await supabase
          .from("documents")
          .delete()
          .eq("id", documentId);

        if (deleteError) {
          console.error("ProductSpecificDocumentService: Error deleting from documents:", deleteError);
          return false;
        }
      }

      // Delete from phase_assigned_document_template table if exists
      if (docInPhaseTable) {
        const { error: deletePhaseError } = await supabase
          .from("phase_assigned_document_template")
          .delete()
          .eq("id", documentId);

        if (deletePhaseError) {
          console.error("ProductSpecificDocumentService: Error deleting from phase_assigned_document_template:", deletePhaseError);
          return false;
        }
      }

      // Log document deletion to audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AuditTrailService.logDocumentRecordEvent({
          userId: user.id,
          companyId: this.companyId,
          action: 'document_deleted',
          entityType: 'document',
          entityId: documentId,
          entityName: documentName,
          actionDetails: { product_id: this.productId },
        });
      }

      return true;
    } catch (error) {
      console.error("ProductSpecificDocumentService: Error in deleteDocument:", error);
      return false;
    }
  }

  async updateDeadline(documentId: string, deadline: Date | undefined): Promise<boolean> {
    return this.updateDocument(documentId, {
      due_date: deadline?.toISOString()
    });
  }
}
