import { DocumentTemplate, DocumentSection, DocumentContent } from '@/types/documentComposer';
import { HardcodedTemplateService, HardcodedTemplate } from './hardcodedTemplateService';
import { CompanyDataIntegrationService, CompanyData, PersonnelData, PhaseData, MissingDataIndicator } from './companyDataIntegrationService';

export interface SmartTemplateResult {
  template: DocumentTemplate;
  populatedFields: string[];
  missingDataIndicators: MissingDataIndicator[];
  suggestions: string[];
  completionPercentage: number;
}

export class SmartTemplateService {
  /**
   * Generate a smart template with company data integration
   */
  static async generateSmartTemplate(
    templateId: string,
    companyId: string,
    productId?: string
  ): Promise<SmartTemplateResult | null> {
    try {
      // First try to get hardcoded template by exact ID match
      let hardcodedTemplate = HardcodedTemplateService.getTemplate(templateId);
      
      // If not found by exact ID, try mapping common template names to hardcoded IDs
      if (!hardcodedTemplate) {
        const mappedId = this.mapToHardcodedTemplateId(templateId);
        if (mappedId) {
          hardcodedTemplate = HardcodedTemplateService.getTemplate(mappedId);
        }
      }
      
      if (!hardcodedTemplate) {
        console.log('No hardcoded template found, attempting to use database template...');
        
        try {
          // Import the useDocumentTemplate logic
          const { generateMockTemplate } = await import('../hooks/useDocumentTemplate');
          
          // Generate template using the existing logic
          const mockTemplate = generateMockTemplate(templateId, 'company-wide');
          
          if (mockTemplate) {
            console.log('Successfully generated template from database/mock logic');
            
            // Fetch company data for basic population
            const companyDataResult = await CompanyDataIntegrationService.getCompanyData(companyId);
            const { company, personnel, phases, missingData } = companyDataResult;
            
            if (company) {
              // Apply basic company data population
              const populatedTemplate = this.populateTemplateWithData(
                mockTemplate,
                company,
                personnel,
                phases,
                productId ? [{ id: productId }].find(() => true) : undefined
              );
              
              return {
                template: populatedTemplate,
                populatedFields: this.getPopulatedFields(company, personnel, phases),
                missingDataIndicators: missingData,
                suggestions: CompanyDataIntegrationService.generateDocumentSuggestions(company, templateId),
                completionPercentage: 60
              };
            } else {
              // Return template without company data
              return {
                template: mockTemplate,
                populatedFields: [],
                missingDataIndicators: [],
                suggestions: ['Template loaded from database'],
                completionPercentage: 30
              };
            }
          }
        } catch (error) {
          console.warn('Failed to generate template from database logic:', error);
        }
        
        console.log(`No template found for ID: ${templateId}`);
        return null;
      }

      // Fetch company data
      const companyDataResult = await CompanyDataIntegrationService.getCompanyData(companyId);
      const { company, personnel, phases, products, missingData } = companyDataResult;

      if (!company) {
        return null;
      }

      // Generate smart template
      const smartTemplate = this.populateTemplateWithData(
        hardcodedTemplate.template,
        company,
        personnel,
        phases,
        productId ? products.find(p => p.id === productId) : undefined
      );

      // Track populated fields
      const populatedFields = this.getPopulatedFields(company, personnel, phases);

      // Generate contextual suggestions
      const suggestions = CompanyDataIntegrationService.generateDocumentSuggestions(
        company,
        templateId
      );

      // Calculate completion percentage
      const totalFields = 15; // Based on typical template requirements
      const completionPercentage = Math.round((populatedFields.length / totalFields) * 100);

      return {
        template: smartTemplate,
        populatedFields,
        missingDataIndicators: missingData,
        suggestions,
        completionPercentage
      };
    } catch (error) {
      console.error('Error generating smart template:', error);
      return null;
    }
  }

  /**
   * Map database template IDs/names to hardcoded template IDs
   */
  private static mapToHardcodedTemplateId(templateId: string): string | null {
    // Handle UUID-style template IDs by looking for common keywords
    if (templateId.length > 10) {
      // This is likely a database UUID, return null to indicate no hardcoded template
      return null;
    }
    
    // Direct mapping for known template names/types
    const mappings: { [key: string]: string } = {
      'employee-training': 'employee-training',
      'change-control': 'change-control', 
      'document-control': 'document-control-sop',
      'document-control-sop': 'document-control-sop'
    };
    
    const directMatch = mappings[templateId];
    if (directMatch) {
      return directMatch;
    }
    
    // Check for partial matches in template name
    const lowerTemplateId = templateId.toLowerCase();
    if (lowerTemplateId.includes('employee') || lowerTemplateId.includes('training')) {
      return 'employee-training';
    }
    if (lowerTemplateId.includes('change') && lowerTemplateId.includes('control')) {
      return 'change-control';
    }
    if (lowerTemplateId.includes('document') && lowerTemplateId.includes('control')) {
      return 'document-control-sop';
    }
    
    return null;
  }

  /**
   * Populate template with actual company data and mark changes with yellow highlighting
   */
  private static populateTemplateWithData(
    template: DocumentTemplate,
    company: CompanyData,
    personnel: PersonnelData[],
    phases: PhaseData[],
    product?: any
  ): DocumentTemplate {
    // Deep clone the template to avoid mutations
    const populatedTemplate = JSON.parse(JSON.stringify(template));

    // Get current date for placeholders
    const currentDate = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Find potential Head of QA
    const potentialQAHead = personnel.find(p => p.access_level === 'admin') || personnel[0];
    const qaHeadName = potentialQAHead 
      ? `${potentialQAHead.first_name || ''} ${potentialQAHead.last_name || ''}`.trim()
      : '[MISSING: Head of Quality Assurance]';

    // Try to get retention periods from company data
    let retentionPeriodText = '[COMPANY INPUT NEEDED: Document retention period - Recommended: 7-10 years for medical devices]';
    
    // Parse company description to get retention periods
    try {
      if (company.description) {
        const parsedDesc = JSON.parse(company.description);
        if (parsedDesc.retentionPeriods?.sops) {
          retentionPeriodText = `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">SOPs: ${parsedDesc.retentionPeriods.sops}, Quality Records: ${parsedDesc.retentionPeriods.qualityRecords || '10 years'}, Design Files: ${parsedDesc.retentionPeriods.designFiles || 'Lifetime + 15 years'}, Clinical Data: ${parsedDesc.retentionPeriods.clinicalData || '25 years'}</span>`;
        }
      }
    } catch (error) {
      console.log('No retention periods found in company data');
    }

    // Try to get document numbering system from company data
    let documentNumberingText = '[COMPANY INPUT NEEDED: Define document numbering system (e.g., SOP-001, WI-001)]';
    
    // Parse company description to get document numbering system
    try {
      if (company.description) {
        const parsedDesc = JSON.parse(company.description);
        if (parsedDesc.documentNumberingSystem?.prefix) {
          const sys = parsedDesc.documentNumberingSystem;
          documentNumberingText = `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">Format: ${sys.prefix}-${sys.startingNumber} ${sys.versionFormat} (${sys.numberFormat})</span>`;
        }
      }
    } catch (error) {
      console.log('No document numbering system found in company data');
    }

    // Try to get EDS system from company data
    let edsSystemText = '[COMPANY INPUT NEEDED: Electronic Document Management System details and validation status]';
    
    try {
      if (company.description) {
        const parsedDesc = JSON.parse(company.description);
        if (parsedDesc.edmSystem?.platform) {
          const eds = parsedDesc.edmSystem;
          edsSystemText = `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">Platform: ${eds.platform}, Access Controls: ${eds.accessControls || 'Role-based'}, Backup: ${eds.backupSchedule || 'Daily'}, Audit Trail: ${eds.auditTrail || 'Enabled'}</span>`;
        }
      }
    } catch (error) {
      console.log('No EDS system found in company data');
    }

    // Try to get department structure from company data  
    let departmentStructureText = '[COMPANY INPUT NEEDED: Define organizational departments and approval authorities]';
    
    try {
      // First try the department_structure column
      if ((company as any).department_structure && Array.isArray((company as any).department_structure)) {
        const departments = (company as any).department_structure;
        if (departments.length > 0) {
          const deptNames = departments.map((dept: any) => dept.name).filter(Boolean);
          if (deptNames.length > 0) {
            departmentStructureText = `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">Departments: ${deptNames.join(', ')}</span>`;
          }
        }
      }
      // Fallback to description field
      else if (company.description) {
        const parsedDesc = JSON.parse(company.description);
        if (parsedDesc.departments && Array.isArray(parsedDesc.departments) && parsedDesc.departments.length > 0) {
          const deptNames = parsedDesc.departments.map((dept: any) => dept.name).filter(Boolean);
          if (deptNames.length > 0) {
            departmentStructureText = `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">Departments: ${deptNames.join(', ')}</span>`;
          }
        }
      }
    } catch (error) {
      console.log('No department structure found in company data');
    }

    // Create replacement map with yellow highlighting for populated content
    const replacements = new Map([
      ['[Company Name]', `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${company.name}</span>`],
      ['[Date]', `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${currentDate}</span>`],
      ['[Version]', `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">1.0</span>`],
      ['[Issued By Name]', `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${qaHeadName}</span>`],
      ['[Reviewed By Name]', `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${qaHeadName}</span>`],
      ['[Approved By Name]', `<span style="background-color: #fed7aa; color: #c2410c; padding: 4px 8px; border-radius: 4px; border: 1px solid #fdba74; font-weight: 500;">Missing: Specific information</span>`],
      
      // Company-specific data with yellow highlighting
      ['[Company Address]', this.formatAddress(company) === '[MISSING: Company Address]' ? 
        '[MISSING: Company Address]' : 
        `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${this.formatAddress(company)}</span>`],
      ['[Company Phone]', company.phone ? 
        `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${company.phone}</span>` : 
        '[MISSING: Company Phone Number]'],
      ['[Company Email]', company.email ? 
        `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${company.email}</span>` : 
        '[MISSING: Company Email]'],
      ['[SRN]', company.srn ? 
        `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${company.srn}</span>` : 
        '[MISSING: Single Registration Number]'],
      
      // Personnel-specific with highlighting - Only replace specific placeholders, not role names
      // Remove this problematic replacement that changes "Head of Quality Assurance" to person names
      // ['Head of Quality Assurance', ...] - REMOVED to keep role-based language
      
      // Missing data indicators (populated or needed)
      ['[Document Numbering System]', documentNumberingText],
      ['[Retention Period]', retentionPeriodText],
      ['[eDMS System]', edsSystemText],
      ['[Department Structure]', departmentStructureText]
    ]);

    console.log('Starting template population for company:', company.name);
    console.log('Company data available:', {
      name: company.name,
      hasDescription: !!company.description,
      hasDepartmentStructure: !!((company as any).department_structure),
      departmentStructureLength: Array.isArray((company as any).department_structure) ? (company as any).department_structure.length : 0
    });
    console.log('Extracted data for template:', {
      retentionPeriodText: retentionPeriodText.substring(0, 100) + '...',
      documentNumberingText: documentNumberingText.substring(0, 100) + '...',
      edsSystemText: edsSystemText.substring(0, 100) + '...',
      departmentStructureText: departmentStructureText.substring(0, 100) + '...'
    });
    
    // Apply replacements to all content
    populatedTemplate.sections = populatedTemplate.sections.map((section: DocumentSection) => ({
      ...section,
      content: section.content.map((content: DocumentContent) => {
        let updatedContent = content.content;
        let wasPopulated = false;
        
        console.log('Processing content:', updatedContent.substring(0, 100) + '...');
        
        // Apply all replacements with more precise matching
        replacements.forEach((replacement, placeholder) => {
          // Escape special regex characters in placeholder
          const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPlaceholder, 'g');
          
          if (updatedContent.includes(placeholder)) {
            const beforeContent = updatedContent;
            updatedContent = updatedContent.replace(regex, replacement);
            
            // Prevent infinite loops by checking if content changed appropriately
            if (beforeContent !== updatedContent && !updatedContent.includes(placeholder)) {
              // Mark as populated if it contains yellow highlighting
              if (replacement.includes('background-color: #fef08a')) {
                wasPopulated = true;
              }
            }
          }
        });
        
        console.log('Final content after replacements:', updatedContent.substring(0, 100) + '...');

        // Add missing data callouts for critical fields
        if (updatedContent.includes('[MISSING:') || updatedContent.includes('[COMPANY INPUT NEEDED:')) {
          return {
            ...content,
            content: updatedContent,
            metadata: {
              ...content.metadata,
              requiresAttention: true,
              dataSource: 'missing'
            }
          };
        }

        // Mark auto-populated content
        if (wasPopulated) {
          return {
            ...content,
            content: updatedContent,
            metadata: {
              ...content.metadata,
              dataSource: 'auto-populated',
              populatedFrom: 'company_data',
              isHighlighted: true
            }
          };
        }

        return content;
      })
    }));

    // Update product context if product provided
    if (product) {
      populatedTemplate.productContext = {
        ...populatedTemplate.productContext,
        id: product.id,
        name: product.name,
        description: `${template.name} for ${product.name}`
      };
    } else {
      populatedTemplate.productContext = {
        ...populatedTemplate.productContext,
        name: `${company.name} - ${template.name}`,
        description: `Company-wide ${template.name} procedure for ${company.name}`
      };
    }

    return populatedTemplate;
  }

  /**
   * Get list of fields that were successfully populated
   */
  private static getPopulatedFields(
    company: CompanyData,
    personnel: PersonnelData[],
    phases: PhaseData[]
  ): string[] {
    const populated: string[] = [];

    if (company.name) populated.push('company_name');
    if (company.address) populated.push('company_address');
    if (company.phone) populated.push('company_phone');
    if (company.email) populated.push('company_email');
    if (company.srn) populated.push('company_srn');
    if (company.contact_person) populated.push('contact_person');
    
    if (personnel.length > 0) populated.push('personnel_data');
    if (personnel.some(p => p.access_level === 'admin')) populated.push('qa_head_identified');
    
    if (phases.length > 0) populated.push('lifecycle_phases');
    
    // Add more fields as they get populated
    populated.push('current_date');
    populated.push('document_version');

    return populated;
  }

  /**
   * Format company address for document use
   */
  private static formatAddress(company: CompanyData): string {
    const parts = [
      company.address,
      company.city,
      company.postal_code,
      company.country
    ].filter(Boolean);

    return parts.length > 0 
      ? parts.join(', ')
      : '[MISSING: Company Address]';
  }

  /**
   * Generate .docx export data with smart formatting
   */
  static generateDocxExportData(smartTemplate: SmartTemplateResult): any {
    const { template, missingDataIndicators, suggestions, completionPercentage } = smartTemplate;
    
    // Prepare document metadata
    const documentInfo = {
      title: template.name,
      subject: `${template.productContext.name} - Generated Template`,
      creator: 'Medical Device Management System',
      description: `Auto-generated template with ${completionPercentage}% completion`,
      keywords: ['Medical Device', 'Quality Management', 'ISO 13485', template.type].join(', ')
    };

    // Prepare content sections
    const sections = template.sections.map(section => ({
      title: section.title,
      content: section.content,
      order: section.order
    }));

    // Prepare missing data summary
    const missingDataSummary = {
      title: 'Missing Information Summary',
      critical: missingDataIndicators.filter(m => m.priority === 'critical'),
      important: missingDataIndicators.filter(m => m.priority === 'important'),
      optional: missingDataIndicators.filter(m => m.priority === 'optional')
    };

    return {
      documentInfo,
      sections,
      missingDataSummary,
      suggestions,
      completionPercentage,
      generatedAt: new Date().toISOString()
    };
  }
}