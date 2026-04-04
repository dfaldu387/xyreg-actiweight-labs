import type { VVPlan } from '@/services/vvService';
import { convertVVPlanToDocumentTemplate } from '@/utils/vvPlanToDocumentTemplate';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { DocumentTemplatePersistenceService } from '@/services/documentTemplatePersistenceService';

/**
 * Bridge service that converts V&V Plans into Document Studio templates
 * and persists them via the standard Doc CI flow (database-first, localStorage fallback).
 */
export class VVPlanStudioBridgeService {
  /**
   * Converts a V&V Plan to a Document Studio template and saves it.
   * Uses the standard DocumentStudioPersistenceService for database persistence.
   * Returns the deterministic template key.
   */
  static async upsertTemplate(plan: VVPlan, companyId: string, productId?: string): Promise<string> {
    const templateKey = `VV-PLAN-${plan.id}`;
    const template = convertVVPlanToDocumentTemplate(plan);

    // Try database-first via DocumentStudioPersistenceService
    try {
      const documentData = {
        company_id: companyId,
        product_id: productId || plan.product_id,
        template_id: templateKey,
        name: template.name,
        type: template.type,
        sections: template.sections,
        product_context: template.productContext,
        document_control: template.documentControl,
        revision_history: template.revisionHistory || [],
        associated_documents: template.associatedDocuments || [],
        metadata: template.metadata || {},
      };

      const result = await DocumentStudioPersistenceService.saveTemplate(documentData);
      if (result.success) {
        return templateKey;
      }
    } catch (err) {
      console.error('VVPlanStudioBridge: DB save failed, falling back to localStorage', err);
    }

    // Fallback: save to localStorage
    DocumentTemplatePersistenceService.saveTemplateToLocalStorage(templateKey, template);
    return templateKey;
  }

  static getTemplateKey(planId: string): string {
    return `VV-PLAN-${planId}`;
  }
}
