import { CompanyDataUpdateService } from './companyDataUpdateService';

export interface DocumentNumberingSystem {
  prefix: string;
  numberFormat: string;
  startingNumber: string;
  versionFormat: string;
}

export interface DocumentReference {
  type: 'SOP' | 'FORM' | 'LIST' | 'TEMP';
  number: string;
  suffix?: string;
  title: string;
}

export class DocumentNumberingService {
  private static documentCounters: Map<string, Map<string, number>> = new Map();

  /**
   * Get company's document numbering system
   */
  static async getCompanyNumberingSystem(companyId: string): Promise<DocumentNumberingSystem> {
    try {
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      return orgData.documentNumberingSystem || {
        prefix: 'SOP',
        numberFormat: 'XXX',
        startingNumber: '001',
        versionFormat: 'V1.0'
      };
    } catch (error) {
      console.error('Error fetching document numbering system:', error);
      return {
        prefix: 'SOP',
        numberFormat: 'XXX',
        startingNumber: '001',
        versionFormat: 'V1.0'
      };
    }
  }

  /**
   * Generate a document number based on company settings.
   * Format: TYPE-SUBPREFIX-NUMBER (e.g., SOP-QA-001) or TYPE-NUMBER if no sub-prefix.
   */
  static async generateDocumentNumber(
    companyId: string,
    type: 'SOP' | 'FORM' | 'LIST' | 'TEMP' = 'SOP',
    sequence?: number,
    subPrefix?: string
  ): Promise<string> {
    const system = await this.getCompanyNumberingSystem(companyId);

    // Get or initialize counter for this company and type
    if (!this.documentCounters.has(companyId)) {
      this.documentCounters.set(companyId, new Map());
    }

    const companyCounters = this.documentCounters.get(companyId)!;

    if (!companyCounters.has(type)) {
      const startingNum = parseInt(system.startingNumber) || 1;
      companyCounters.set(type, startingNum);
    }

    // Use provided sequence or get next number
    const number = sequence || companyCounters.get(type)!;

    // Increment counter for next use
    if (!sequence) {
      companyCounters.set(type, number + 1);
    }

    // Format the number according to system settings
    const formattedNumber = this.formatNumber(number, system.numberFormat);

    // Build: TYPE-SUBPREFIX-NUMBER (e.g., SOP-QA-001) or TYPE-NUMBER
    if (subPrefix) {
      return `${type}-${subPrefix}-${formattedNumber}`;
    }
    return `${type}-${formattedNumber}`;
  }

  /**
   * Format number according to company format
   */
  private static formatNumber(number: number, format: string): string {
    switch (format) {
      case 'XXXX':
        return number.toString().padStart(4, '0');
      case 'XX-XX':
        const numStr = number.toString().padStart(4, '0');
        return `${numStr.slice(0, 2)}-${numStr.slice(2)}`;
      case 'XXX':
      default:
        return number.toString().padStart(3, '0');
    }
  }

  /**
   * Update internal references in template content
   */
  static async updateInternalReferences(
    content: string,
    companyId: string,
    templateType: 'SOP' | 'FORM' | 'LIST' | 'TEMP' = 'SOP',
    templateNumber?: number,
    subPrefix?: string
  ): Promise<string> {
    let updatedContent = content;
    
    // Common document references that need updating
    const documentReferences: DocumentReference[] = [
      // SOPs
      { type: 'SOP', number: '001', title: 'Document Control' },
      { type: 'SOP', number: '002', title: 'Record Control' },
      { type: 'SOP', number: '003', title: 'Management Review' },
      { type: 'SOP', number: '004', title: 'Internal Audit' },
      { type: 'SOP', number: '005', title: 'Training' },
      { type: 'SOP', number: '006', title: 'Corrective and Preventive Action' },
      { type: 'SOP', number: '007', title: 'Product Realization' },
      { type: 'SOP', number: '008', title: 'Measurement and Monitoring' },
      { type: 'SOP', number: '009', title: 'Risk Management' },
      { type: 'SOP', number: '010', title: 'Design Controls' },
      { type: 'SOP', number: '011', title: 'Supplier Control' },
      { type: 'SOP', number: '012', title: 'Purchasing Controls' },
      { type: 'SOP', number: '013', title: 'Production and Service Controls' },
      { type: 'SOP', number: '014', title: 'Control of Measuring and Monitoring Equipment' },
      { type: 'SOP', number: '015', title: 'Control of Nonconforming Product' },
      { type: 'SOP', number: '016', title: 'Medical Device Reporting' },
      { type: 'SOP', number: '017', title: 'Change Control' },
      { type: 'SOP', number: '018', title: 'Software Lifecycle Processes' },
      { type: 'SOP', number: '019', title: 'Clinical Evaluation' },
      { type: 'SOP', number: '020', title: 'Post-Market Surveillance' },
      { type: 'SOP', number: '021', title: 'Unique Device Identification' },
      { type: 'SOP', number: '022', title: 'Sterilization and Packaging' },
      { type: 'SOP', number: '023', title: 'Labeling Controls' },
      { type: 'SOP', number: '024', title: 'Biocompatibility Evaluation' },
      
      // Forms
      { type: 'FORM', number: '001', suffix: 'A', title: 'Document Change Order' },
      { type: 'FORM', number: '002', suffix: 'A', title: 'Training Record' },
      { type: 'FORM', number: '003', suffix: 'A', title: 'Internal Audit Checklist' },
      { type: 'FORM', number: '004', suffix: 'A', title: 'Corrective Action Request' },
      { type: 'FORM', number: '005', suffix: 'A', title: 'Design Review Checklist' },
      { type: 'FORM', number: '005', suffix: 'B', title: 'Training Roster' },
      { type: 'FORM', number: '006', suffix: 'A', title: 'Supplier Evaluation' },
      { type: 'FORM', number: '007', suffix: 'A', title: 'Nonconformance Report' },
      { type: 'FORM', number: '008', suffix: 'A', title: 'Risk Assessment' },
      { type: 'FORM', number: '009', suffix: 'A', title: 'Design Input Specification' },
      { type: 'FORM', number: '010', suffix: 'A', title: 'Verification Protocol' },
      { type: 'FORM', number: '011', suffix: 'A', title: 'Validation Protocol' },
      { type: 'FORM', number: '012', suffix: 'A', title: 'Clinical Evaluation Report' },
      { type: 'FORM', number: '013', suffix: 'A', title: 'Post-Market Surveillance Report' },
      { type: 'FORM', number: '014', suffix: 'A', title: 'Medical Device Report' },
      { type: 'FORM', number: '015', suffix: 'A', title: 'Change Control Request' },
      { type: 'FORM', number: '016', suffix: 'A', title: 'Software Requirements Specification' },
      { type: 'FORM', number: '017', suffix: 'A', title: 'Change Control Request' },
      { type: 'FORM', number: '018', suffix: 'A', title: 'Device History Record' },
      { type: 'FORM', number: '019', suffix: 'A', title: 'Production Record' },
      { type: 'FORM', number: '020', suffix: 'A', title: 'Quality Control Record' },
      { type: 'FORM', number: '021', suffix: 'A', title: 'Equipment Maintenance Log' },
      { type: 'FORM', number: '022', suffix: 'A', title: 'Calibration Record' },
      { type: 'FORM', number: '023', suffix: 'A', title: 'Customer Complaint Form' },
      { type: 'FORM', number: '024', suffix: 'A', title: 'Supplier Audit Checklist' },
      { type: 'FORM', number: '025', suffix: 'A', title: 'Management Review Record' },
      
      // Lists
      { type: 'LIST', number: '001', suffix: 'A', title: 'Master Document List' },
      { type: 'LIST', number: '001', suffix: 'B', title: 'Master Document List' },
      { type: 'LIST', number: '002', suffix: 'A', title: 'Approved Supplier List' },
      { type: 'LIST', number: '003', suffix: 'A', title: 'Equipment Inventory' },
      { type: 'LIST', number: '004', suffix: 'A', title: 'Training Matrix' },
      { type: 'LIST', number: '005', suffix: 'A', title: 'Training Matrix' },
      { type: 'LIST', number: '006', suffix: 'A', title: 'Regulatory Standards Matrix' },
      { type: 'LIST', number: '007', suffix: 'A', title: 'Product Portfolio' },
      { type: 'LIST', number: '008', suffix: 'A', title: 'Risk Register' },
      
      // Templates
      { type: 'TEMP', number: '001', suffix: 'A', title: 'Design History File Template' },
      { type: 'TEMP', number: '002', suffix: 'A', title: 'Technical File Template' },
      { type: 'TEMP', number: '003', suffix: 'A', title: 'Clinical Evaluation Plan Template' }
    ];

    // Update each reference in the content
    for (const ref of documentReferences) {
      const oldReference = `${ref.type}-${ref.number}${ref.suffix ? `-${ref.suffix}` : ''}`;
      const newNumber = await this.generateDocumentNumber(companyId, ref.type, parseInt(ref.number), subPrefix);
      const newReference = `${newNumber}${ref.suffix ? `-${ref.suffix}` : ''}`;

      // Replace all occurrences
      updatedContent = updatedContent.replace(new RegExp(oldReference, 'g'), newReference);
    }

    // Update the main document number if this is the current template
    if (templateNumber) {
      const currentDocNumber = await this.generateDocumentNumber(companyId, templateType, templateNumber, subPrefix);
      updatedContent = updatedContent.replace(
        new RegExp(`${templateType}-\\d+`, 'g'),
        currentDocNumber
      );
    }

    return updatedContent;
  }

  /**
   * Get formatted version string
   */
  static async getVersionFormat(companyId: string): Promise<string> {
    const system = await this.getCompanyNumberingSystem(companyId);
    return system.versionFormat;
  }

  /**
   * Reset document counter for a specific type (useful for testing or manual reset)
   */
  static resetCounter(companyId: string, type: 'SOP' | 'FORM' | 'LIST' | 'TEMP'): void {
    const companyCounters = this.documentCounters.get(companyId);
    if (companyCounters) {
      companyCounters.delete(type);
    }
  }
}