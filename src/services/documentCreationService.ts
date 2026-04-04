import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProductAuditLogService } from './productAuditLogService';
import { AuditLogService } from './auditLogService';
import { AuditTrailService } from './auditTrailService';
// import { NoPhaseService } from './noPhaseService';

export interface DocumentCreationParams {
  name: string;
  description?: string;
  documentType: string;
  scope: 'company_template' | 'product_document' | 'company_document';
  companyId?: string;
  productId?: string;
  phaseId?: string;
  techApplicability?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  hardcodedTemplateId?: string;
  reviewerGroupIds?: string[];
  status?: string;
  subSection?: string;
  sectionIds?: string[];
  documentReference?: string;
  version?: string;
  date?: string;
  dueDate?: string;
  isCurrentEffectiveVersion?: boolean;
  briefSummary?: string;
  authors_ids?: string[];
  needTemplateUpdate?: boolean;
  isRecord?: boolean;
  approval_date?: string;
  silent?: boolean;
  reference_document_ids?: string[];
  tags?: string[];
}

export interface StandaloneTemplateParams {
  name: string;
  description?: string;
  documentType: string;
  companyId: string;
  techApplicability?: string;
  markets?: string[];
  classesByMarket?: Record<string, string[]>;
}

/**
 * Centralized service for document creation with proper scope handling
 */
export class DocumentCreationService {

  /**
   * Create a document with the appropriate scope and table routing
   */
  static async createDocument(params: DocumentCreationParams): Promise<string | null> {
    const {
      name, description, documentType, scope, companyId, productId, phaseId, techApplicability,
      filePath, fileName, fileSize, fileType, hardcodedTemplateId, reviewerGroupIds, status,
      subSection, sectionIds, documentReference, version, date, dueDate, isCurrentEffectiveVersion,
      briefSummary, authors_ids, needTemplateUpdate, isRecord
    } = params;

    try {
      // Check user authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ DocumentCreationService: User not authenticated:', authError);
        toast.error('You must be logged in to create documents');
        return null;
      }

      // Validate required parameters based on scope
      if (!this.validateParams(params)) {
        return null;
      }

      let documentId: string;

      switch (scope) {
        case 'company_template':
          documentId = await this.createCompanyTemplate(params);
          break;
        case 'product_document':
          documentId = await this.createProductDocument(params);
          break;
        case 'company_document':
          documentId = await this.createCompanyDocument(params);
          break;
        default:
          toast.error('Invalid document scope');
          return null;
      }

      if (documentId && !params.silent) {
        const scopeLabel = this.getScopeLabel(scope);

        // Enhanced success message with file info
        if (filePath && fileName) {
          toast.success(`${scopeLabel} "${name}" created successfully with attached file "${fileName}"`);
        } else {
          toast.success(`${scopeLabel} "${name}" created successfully`);
        }
      }

      return documentId;

    } catch (error) {
      console.error('❌ DocumentCreationService: Error in document creation:', error);
      toast.error('Failed to create document');
      return null;
    }
  }

  /**
   * Create a standalone company template in company_document_templates table
   */
  static async createStandaloneTemplate(params: StandaloneTemplateParams): Promise<string | null> {
    const { name, description, documentType, companyId, techApplicability, markets, classesByMarket } = params;

    try {
      const { data, error } = await supabase
        .from('company_document_templates')
        .insert({
          name: name.trim(),
          description: description,
          document_type: documentType,
          company_id: companyId,
          tech_applicability: techApplicability || 'All device types',
          markets: markets || [],
          classes_by_market: classesByMarket || {}
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating standalone template:", error);
        if (error.code === '23505') {
          toast.error('A template with this name already exists');
        } else {
          toast.error('Failed to create template');
        }
        throw error;
      }

      // Create audit trail entry for standalone template creation
      const userId = (await supabase.auth.getUser()).data.user?.id || '';
      await AuditTrailService.logDocumentRecordEvent({
        userId,
        companyId,
        action: 'document_created',
        entityType: 'document',
        entityId: data.id,
        entityName: name,
        actionDetails: {
          document_type: documentType,
          scope: 'standalone_template',
          tech_applicability: techApplicability,
        },
      });

      toast.success(`Template "${name}" created successfully`);
      return data.id;

    } catch (error) {
      console.error('Error creating standalone template:', error);
      toast.error('Failed to create template');
      return null;
    }
  }

  /**
   * Create a company template in phase_assigned_document_template table
   */
  private static async createCompanyTemplate(params: DocumentCreationParams): Promise<string> {
    const {
      name, description, documentType, phaseId, techApplicability, companyId,
      filePath, fileName, fileSize, fileType, reviewerGroupIds, status,
      subSection, sectionIds, documentReference, version, date, dueDate, isCurrentEffectiveVersion,
      briefSummary, authors_ids, needTemplateUpdate, isRecord
    } = params;

    // Ensure we have the company_id for company templates
    if (!companyId) {
      throw new Error('Company ID is required for company templates');
    }

    const { data, error } = await supabase
      .from('phase_assigned_document_template')
      .insert({
        name: name.trim(),
        description: description,
        phase_id: phaseId,
        document_type: documentType,
        document_scope: 'company_template',
        status: status || 'Not Started',
        tech_applicability: techApplicability || 'All device types',
        company_id: companyId,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        reviewer_group_ids: reviewerGroupIds || null,
        uploaded_at: filePath ? new Date().toISOString() : null,
        sub_section: subSection || null,
        section_ids: sectionIds && sectionIds.length > 0 ? sectionIds : null,
        document_reference: documentReference || null,
        version: version || null,
        date: date || null,
        due_date: dueDate || null,
        is_current_effective_version: isCurrentEffectiveVersion || false,
        brief_summary: briefSummary || null,
        authors_ids: authors_ids && authors_ids.length > 0 ? authors_ids : null,
        need_template_update: needTemplateUpdate || false,
        is_record: isRecord || false,
        tags: params.tags && params.tags.length > 0 ? params.tags : []
      })
      .select()
      .single();

    if (error) {
      console.error("❌ DocumentCreationService: Error creating company template:", error);
      if (error.code === '23505') {
        toast.error('A template with this name already exists for this phase');
      } else {
        toast.error('Failed to create template');
      }
      throw error;
    }

    // Create audit trail entry for company template creation
    const userId = (await supabase.auth.getUser()).data.user?.id || '';
    await AuditTrailService.logDocumentRecordEvent({
      userId,
      companyId: companyId || '',
      action: 'document_created',
      entityType: 'document',
      entityId: data.id,
      entityName: name,
      actionDetails: {
        document_type: documentType,
        scope: 'company_template',
        tech_applicability: techApplicability,
        has_file: !!filePath,
        phase_id: phaseId,
      },
    });

    return data.id;
  }

  /**
   * Create a product document
   * - If phaseId is provided → insert into phase_assigned_document_template
   * - If no phaseId (No Phase) → insert into documents table
   */
  private static async createProductDocument(params: DocumentCreationParams): Promise<string> {
    const {
      name, description, documentType, companyId, productId, techApplicability,
      filePath, fileName, fileSize, fileType, phaseId, reviewerGroupIds, status,
      subSection, sectionIds, documentReference, version, date, dueDate, isCurrentEffectiveVersion,
      briefSummary, authors_ids, needTemplateUpdate, isRecord, approval_date
    } = params;

    let data: any;
    let error: any;

    if (phaseId) {
      // Has phase → insert into phase_assigned_document_template
      const result = await supabase
        .from('phase_assigned_document_template')
        .insert({
          name: name.trim(),
          description: description,
          document_type: documentType,
          status: status || 'Not Started',
          company_id: companyId,
          product_id: productId,
          phase_id: phaseId,
          document_scope: 'product_document',
          tech_applicability: techApplicability || 'All device types',
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          reviewer_group_ids: reviewerGroupIds || null,
          uploaded_at: filePath ? new Date().toISOString() : null,
          sub_section: subSection || null,
          section_ids: sectionIds && sectionIds.length > 0 ? sectionIds : null,
          document_reference: documentReference || null,
          version: version || null,
          date: date || null,
          due_date: dueDate || null,
          is_current_effective_version: isCurrentEffectiveVersion || false,
          brief_summary: briefSummary || null,
          authors_ids: authors_ids && authors_ids.length > 0 ? authors_ids : null,
          need_template_update: needTemplateUpdate || false,
          is_record: isRecord || false,
          approval_date: approval_date || null,
          reference_document_ids: params.reference_document_ids && params.reference_document_ids.length > 0 ? params.reference_document_ids : null,
          tags: params.tags && params.tags.length > 0 ? params.tags : []
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // No phase → insert into documents table
      const result = await supabase
        .from('documents')
        .insert({
          name: name.trim(),
          description: description,
          document_type: documentType,
          status: status || 'Not Started',
          company_id: companyId,
          product_id: productId,
          phase_id: null,
          document_scope: 'product_document',
          tech_applicability: techApplicability || 'All device types',
          file_path: filePath,
          file_name: fileName,
          uploaded_at: filePath ? new Date().toISOString() : null,
          reviewer_group_ids: reviewerGroupIds || null,
          sub_section: subSection || null,
          section_ids: sectionIds && sectionIds.length > 0 ? sectionIds : null,
          document_reference: documentReference || null,
          version: version || null,
          date: date || null,
          due_date: dueDate || null,
          is_current_effective_version: isCurrentEffectiveVersion || false,
          brief_summary: briefSummary || null,
          authors_ids: authors_ids && authors_ids.length > 0 ? authors_ids : null,
          need_template_update: needTemplateUpdate || false,
          is_record: isRecord || false,
          approval_date: approval_date || null,
          reference_document_ids: params.reference_document_ids && params.reference_document_ids.length > 0 ? params.reference_document_ids : null
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ DocumentCreationService: Error creating product document:", error);
      if (error.code === '23505') {
        toast.error('A document with this name already exists for this device');
      } else {
        toast.error('Failed to create device document');
      }
      throw error;
    }

    // Create audit logs in both systems for comprehensive tracking
    const userId = (await supabase.auth.getUser()).data.user?.id || '';
    await Promise.all([
      // Product audit log for product-specific tracking
      ProductAuditLogService.createProductAuditLog({
        action: 'CREATE',
        entityType: 'DOCUMENT',
        entityName: name,
        description: description,
        productId: productId,
        companyId: companyId,
      }),
      // Audit trail entry for document creation
      AuditTrailService.logDocumentRecordEvent({
        userId,
        companyId: companyId || '',
        action: 'document_created',
        entityType: 'document',
        entityId: data.id,
        entityName: name,
        actionDetails: {
          document_type: documentType,
          scope: 'product_document',
          tech_applicability: techApplicability,
          has_file: !!filePath,
          product_id: productId,
        },
      }),
    ]);

    return data.id;
  }

  /**
   * Create a company document in phase_assigned_document_template table only
   */
  private static async createCompanyDocument(params: DocumentCreationParams): Promise<string> {
    const {
      name, description, documentType, companyId, techApplicability, filePath, fileName,
      reviewerGroupIds, status, subSection, sectionIds, documentReference, version, date, dueDate,
      phaseId, isCurrentEffectiveVersion, briefSummary, authors_ids, needTemplateUpdate, isRecord, approval_date
    } = params;

    // Resolve phase_id: use provided phaseId, or look up "No Phase" for this company
    let resolvedPhaseId = phaseId;
    if (!resolvedPhaseId) {
      const { data: noPhase } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', 'No Phase')
        .limit(1)
        .maybeSingle();
      resolvedPhaseId = noPhase?.id || null;
    }

    if (!resolvedPhaseId) {
      throw new Error('Could not find a valid phase for company document. Please ensure a "No Phase" entry exists.');
    }

    // Insert into phase_assigned_document_template table
    const { data, error } = await supabase
      .from('phase_assigned_document_template')
      .insert({
        name: name.trim(),
        description: description,
        document_type: documentType,
        status: status || 'Not Started',
        company_id: companyId,
        phase_id: resolvedPhaseId,
        document_scope: 'company_document',
        tech_applicability: techApplicability || 'All device types',
        file_path: filePath,
        file_name: fileName,
        uploaded_at: filePath ? new Date().toISOString() : null,
        reviewer_group_ids: reviewerGroupIds || null,
        sub_section: subSection || null,
        section_ids: sectionIds && sectionIds.length > 0 ? sectionIds : null,
        document_reference: documentReference || null,
        version: version || null,
        date: date || null,
        due_date: dueDate || null,
        is_current_effective_version: isCurrentEffectiveVersion || false,
        brief_summary: briefSummary || null,
        authors_ids: authors_ids && authors_ids.length > 0 ? authors_ids : null,
        need_template_update: needTemplateUpdate || false,
        is_record: isRecord || false,
        approval_date: approval_date || null,
        reference_document_ids: params.reference_document_ids && params.reference_document_ids.length > 0 ? params.reference_document_ids : null,
        tags: params.tags && params.tags.length > 0 ? params.tags : []
      })
      .select()
      .single();

    if (error) {
      console.error("❌ DocumentCreationService: Error creating company document:", error);

      if (error.code === '23505') {
        toast.error('A document with this name already exists for this company');
      } else {
        toast.error(`Failed to create company document: ${error.message}`);
      }
      throw error;
    }

    // Create audit trail entry for company document creation
    const userId = (await supabase.auth.getUser()).data.user?.id || '';
    await AuditTrailService.logDocumentRecordEvent({
      userId,
      companyId: companyId || '',
      action: 'document_created',
      entityType: 'document',
      entityId: data.id,
      entityName: name,
      actionDetails: {
        document_type: documentType,
        scope: 'company_document',
        tech_applicability: techApplicability,
        has_file: !!filePath,
        phase_id: phaseId || null,
      },
    });

    return data.id;
  }

  /**
   * Validate required parameters based on scope
   */
  private static validateParams(params: DocumentCreationParams): boolean {
    const { name, scope, companyId, productId, phaseId } = params;

    if (!name?.trim()) {
      toast.error('Document name is required');
      return false;
    }

    switch (scope) {
      case 'company_template':
        if (!phaseId) {
          toast.error('Phase ID is required for company templates');
          return false;
        }
        if (!companyId) {
          toast.error('Company ID is required for company templates');
          return false;
        }
        break;
      case 'product_document':
        if (!productId) {
          toast.error('Product ID is required for product documents');
          return false;
        }
        if (!companyId) {
          toast.error('Company ID is required for product documents');
          return false;
        }
        break;
      case 'company_document':
        if (!companyId) {
          toast.error('Company ID is required for company documents');
          return false;
        }
        break;
    }

    return true;
  }

  private static getScopeLabel(scope: string): string {
    switch (scope) {
      case 'company_template': return 'Template';
      case 'product_document': return 'Device document';
      case 'company_document': return 'Company document';
      default: return 'Document';
    }
  }

  /**
   * Migrate a "No Phase" document from documents table to phase_assigned_document_template
   * when a user selects a phase in the edit form
   * @param documentId - The ID of the document to migrate
   * @param phaseId - The new phase ID to assign
   * @param updates - Optional updated values from the edit form to apply during migration
   */
  static async migrateDocumentToPhase(
    documentId: string,
    phaseId: string,
    updates?: {
      name?: string;
      description?: string;
      status?: string;
      due_date?: string | null;
      sub_section?: string | null;
      section_ids?: string[] | null;
      document_reference?: string | null;
      version?: string | null;
      date?: string | null;
      is_current_effective_version?: boolean;
      authors_ids?: string[] | null;
      reviewer_group_ids?: string[] | null;
      need_template_update?: boolean;
      is_record?: boolean;
      reference_document_ids?: string[] | null;
    }
  ): Promise<{ success: boolean; newDocumentId?: string; error?: string }> {
    try {
      // 1. Get the document from documents table
      const { data: existingDoc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single() as { data: any; error: any };

      if (fetchError || !existingDoc) {
        console.error('❌ DocumentCreationService: Document not found in documents table:', fetchError);
        return { success: false, error: 'Document not found' };
      }

      // 2. Insert into phase_assigned_document_template with updates applied
      const { data: newDoc, error: insertError } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          name: updates?.name ?? existingDoc.name,
          description: updates?.description ?? existingDoc.description,
          document_type: existingDoc.document_type,
          status: updates?.status ?? existingDoc.status,
          company_id: existingDoc.company_id,
          product_id: existingDoc.product_id,
          phase_id: phaseId,
          document_scope: 'product_document',
          tech_applicability: existingDoc.tech_applicability,
          file_path: existingDoc.file_path,
          file_name: existingDoc.file_name,
          file_size: existingDoc.file_size,
          file_type: existingDoc.file_type,
          uploaded_at: existingDoc.uploaded_at,
          reviewer_group_ids: updates?.reviewer_group_ids !== undefined ? updates.reviewer_group_ids : existingDoc.reviewer_group_ids,
          sub_section: updates?.sub_section !== undefined ? updates.sub_section : existingDoc.sub_section,
          section_ids: updates?.section_ids !== undefined ? updates.section_ids : existingDoc.section_ids,
          document_reference: updates?.document_reference !== undefined ? updates.document_reference : existingDoc.document_reference,
          version: updates?.version !== undefined ? updates.version : existingDoc.version,
          date: updates?.date !== undefined ? updates.date : existingDoc.date,
          due_date: updates?.due_date !== undefined ? updates.due_date : existingDoc.due_date,
          is_current_effective_version: updates?.is_current_effective_version !== undefined ? updates.is_current_effective_version : existingDoc.is_current_effective_version,
          brief_summary: existingDoc.brief_summary,
          authors_ids: updates?.authors_ids !== undefined ? updates.authors_ids : existingDoc.authors_ids,
          need_template_update: updates?.need_template_update !== undefined ? updates.need_template_update : existingDoc.need_template_update
        })
        .select()
        .single();

      if (insertError || !newDoc) {
        console.error('❌ DocumentCreationService: Failed to insert into phase_assigned_document_template:', insertError);
        return { success: false, error: 'Failed to migrate document' };
      }

      // Delete from documents table to avoid duplicates
      await supabase.from('documents').delete().eq('id', documentId);

      toast.success('Document moved to phase successfully');
      return { success: true, newDocumentId: newDoc.id };

    } catch (error) {
      console.error('❌ DocumentCreationService: Migration error:', error);
      toast.error('Failed to migrate document to phase');
      return { success: false, error: 'Migration failed' };
    }
  }
}
