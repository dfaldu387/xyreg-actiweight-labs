
import { GapAnalysisUpdateService } from "@/services/gapAnalysisUpdateService";

export type DetectedDocumentType = 'gap-analysis' | 'regular-document' | 'company-template' | 'ci-instance';

export interface DocumentTypeDetectionResult {
  type: DetectedDocumentType;
  isGapAnalysisItem: boolean;
  isCompanyTemplate: boolean;
  isRegularDocument: boolean;
  isCIInstance: boolean;
}

/**
 * Detect the type of document/item being edited
 */
export class DocumentTypeDetector {
  /**
   * Detect document type based on various indicators
   */
  static async detectType(item: any): Promise<DocumentTypeDetectionResult> {
    console.log("DocumentTypeDetector: Analyzing item:", {
      id: item.id,
      name: item.name,
      clauseId: item.clauseId,
      framework: item.framework,
      document_scope: item.document_scope,
      template_source_id: item.template_source_id
    });

    // Check if it's a gap analysis item by looking for gap-specific properties
    const hasGapProperties = !!(
      item.clauseId || 
      item.framework || 
      item.section ||
      item.requirement ||
      item.gapDescription ||
      item.clauseSummary
    );

    // If it has gap properties, verify in the database
    let isGapAnalysisItem = false;
    if (hasGapProperties && item.id) {
      isGapAnalysisItem = await GapAnalysisUpdateService.isGapAnalysisItem(item.id);
    }

    // Check if it's a company template
    const isCompanyTemplate = item.document_scope === 'company_template';
    
    // Check if it's a CI instance by looking for CI-specific properties
    const isCIInstance = !!(
      item.template_id || 
      item.instance_config ||
      (item.type && ['audit', 'gap', 'document', 'activity'].includes(item.type))
    );

    // Determine the primary type
    let type: DetectedDocumentType;
    if (isCIInstance) {
      type = 'ci-instance';
    } else if (isGapAnalysisItem) {
      type = 'gap-analysis';
    } else if (isCompanyTemplate) {
      type = 'company-template';
    } else {
      type = 'regular-document';
    }

    const result = {
      type,
      isGapAnalysisItem,
      isCompanyTemplate,
      isRegularDocument: type === 'regular-document',
      isCIInstance
    };

    console.log("DocumentTypeDetector: Detection result:", result);
    return result;
  }
}
