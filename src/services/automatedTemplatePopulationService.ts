import { supabase } from '@/integrations/supabase/client';
import { DocumentTemplate, DocumentSection, DocumentContent } from '@/types/documentComposer';
import { CompanyDataIntegrationService, CompanyData, PersonnelData, PhaseData, MissingDataIndicator } from './companyDataIntegrationService';
import { AIChangeTrackingService } from './aiChangeTrackingService';

export interface AutoPopulationResult {
  template: DocumentTemplate;
  populatedFields: string[];
  missingDataIndicators: MissingDataIndicator[];
  suggestions: string[];
  completionPercentage: number;
}

/**
 * Automated Template Population Service
 * Automatically checks existing company data and populates templates
 * Only shows truly missing information in the "Missing Info" panel
 */
export class AutomatedTemplatePopulationService {
  
  /**
   * Main entry point - automatically populate any template with available company data
   */
  static async autoPopulateTemplate(
    template: DocumentTemplate,
    companyId: string,
    productId?: string
  ): Promise<AutoPopulationResult> {
    try {
      console.log('[AutoPopulation] Starting automated population for:', {
        templateName: template.name,
        companyId,
        productId
      });

      // Step 1: Get all available company data
      const companyDataResult = await CompanyDataIntegrationService.getCompanyData(companyId);
      const { company, personnel, phases, products, missingData } = companyDataResult;

      if (!company) {
        console.error('[AutoPopulation] No company data found');
        return {
          template,
          populatedFields: [],
          missingDataIndicators: [
            {
              field: 'company_data',
              description: 'Company information not available',
              priority: 'critical'
            }
          ],
          suggestions: [],
          completionPercentage: 0
        };
      }

      // Step 2: Automatically populate template with available data
      const populatedTemplate = await this.populateTemplateWithAvailableData(
        template,
        company,
        personnel,
        phases,
        productId ? products.find(p => p.id === productId) : undefined
      );

      // Step 3: Calculate what was actually populated
      const populatedFields = this.calculatePopulatedFields(company, personnel, phases);

      // Step 4: Filter missing data to only show truly missing items (not already in company settings)
      const trulyMissingData = await this.filterTrulyMissingData(missingData, companyId);

      // Step 5: Generate contextual suggestions
      const suggestions = this.generateAutomatedSuggestions(company, template.type || template.name);

      // Step 6: Calculate completion percentage
      const completionPercentage = this.calculateCompletionPercentage(populatedFields, trulyMissingData);

      console.log('[AutoPopulation] Completed:', {
        populatedFields: populatedFields.length,
        missingData: trulyMissingData.length,
        completionPercentage
      });

      return {
        template: populatedTemplate,
        populatedFields,
        missingDataIndicators: trulyMissingData,
        suggestions,
        completionPercentage
      };

    } catch (error) {
      console.error('[AutoPopulation] Error during automated population:', error);
      return {
        template,
        populatedFields: [],
        missingDataIndicators: [],
        suggestions: ['Error occurred during automated population'],
        completionPercentage: 0
      };
    }
  }

  /**
   * Get company API keys for AI generation
   */
  private static async getCompanyApiKeys(companyId: string): Promise<{ openaiKey?: string }> {
    try {
      const { data, error } = await supabase
        .from('company_api_keys')
        .select('key_type, encrypted_key')
        .eq('company_id', companyId)
        .eq('key_type', 'openai');

      if (error || !data || data.length === 0) {
        console.log('[AutoPopulation] No OpenAI API key found');
        return {};
      }

      // Simple decrypt (matches the encryption in useCompanyApiKeys)
      const encryptedKey = data[0].encrypted_key;
      const openaiKey = this.decryptApiKey(encryptedKey);
      
      return { openaiKey };
    } catch (error) {
      console.error('[AutoPopulation] Error fetching API keys:', error);
      return {};
    }
  }

  /**
   * Simple decryption utility (matches apiKeyUtils.ts)
   */
  private static decryptApiKey(encryptedKey: string): string {
    try {
      // If key looks like a plain text API key, return as-is
      if (encryptedKey.startsWith('sk-')) {
        return encryptedKey;
      }

      const ENCRYPTION_KEY = 'medtech-api-key-2024';
      const base64Decoded = atob(encryptedKey);
      const decrypted = Array.from(base64Decoded)
        .map((char, index) => 
          String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
        )
        .join('');
      
      return decrypted;
    } catch (error) {
      console.error('[AutoPopulation] Error decrypting API key:', error);
      return encryptedKey;
    }
  }

  /**
   * Generate AI content for template sections
   */
  private static async generateAIContent(
    sectionTitle: string,
    templateType: string,
    company: CompanyData,
    openaiKey: string
  ): Promise<string> {
    try {
      const prompt = `You are a medical device regulatory expert. Generate professional content for a ${templateType} document.
      
Section: "${sectionTitle}"
Company: ${company.name}
Country: ${company.country || 'Not specified'}
Industry: Medical devices/MedTech

Generate 2-3 paragraphs of relevant, professional content for this section. The content should be:
- Specific to medical device regulations
- Appropriate for the company context
- Professional and formal in tone
- Compliant with ISO 13485 and relevant medical device standards
- Between 150-300 words

Do not include placeholder text or brackets. Generate actual meaningful content.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a medical device regulatory expert who writes professional documentation.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[AutoPopulation] Error generating AI content:', error);
      return this.createMissingInfoMarker(`AI content generation failed: ${sectionTitle}`);
    }
  }

  /**
   * Create orange missing info marker
   */
  private static createMissingInfoMarker(description: string): string {
    return `<span style="background-color: #fed7aa; color: #c2410c; padding: 4px 8px; border-radius: 4px; border: 1px solid #fdba74; font-weight: 500;">Missing: ${description}</span>`;
  }

  /**
   * Populate template with AI-generated content and available company data
   */
  private static async populateTemplateWithAvailableData(
    template: DocumentTemplate,
    company: CompanyData,
    personnel: PersonnelData[],
    phases: PhaseData[],
    product?: any
  ): Promise<DocumentTemplate> {
    // Deep clone template
    const populatedTemplate = JSON.parse(JSON.stringify(template));

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Find QA head
    const qaHead = personnel.find(p => p.access_level === 'admin') || personnel[0];
    const qaHeadName = qaHead 
      ? `${qaHead.first_name || ''} ${qaHead.last_name || ''}`.trim()
      : null;

    // Get additional company data from settings including electronic signatures and EDM system
    const additionalData = await this.getCompanyAdditionalData(company.id);
    const edmSystemData = await this.getEdmSystemData(company.id);
    const emdnCodesData = await this.getEmdnCodesData(company.id, product?.id);

    // Get API keys for AI generation
    const { openaiKey } = await this.getCompanyApiKeys(company.id);

    // Create comprehensive replacement map with all company settings
    const replacements = await this.createComprehensiveReplacementMap(
      company,
      personnel,
      phases,
      currentDate,
      qaHeadName,
      additionalData,
      edmSystemData,
      emdnCodesData
    );

    // Apply replacements and AI generation to all template content
    const processedSections = await Promise.all(
      populatedTemplate.sections.map(async (section: DocumentSection) => {
        const processedContent = await Promise.all(
          section.content.map(async (content: DocumentContent) => {
            let updatedContent = content.content;
            let wasAutoPopulated = false;
            let hasAIContent = false;

            // Apply all replacements
            replacements.forEach(({ placeholder, replacement, isPopulated }) => {
              if (updatedContent.includes(placeholder)) {
                const originalContent = updatedContent;
                updatedContent = updatedContent.replace(
                  new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                  replacement
                );
                if (isPopulated) {
                  // Track company data change
                  const contentId = `${section.id}-${content.id}-${placeholder}`;
                  AIChangeTrackingService.trackChange(
                    contentId,
                    originalContent,
                    updatedContent,
                    'company-data',
                    'company_settings'
                  );
                  wasAutoPopulated = true;
                }
              }
            });

            // Generate AI content for sections that need it
            if (openaiKey && this.shouldGenerateAIContent(updatedContent, section.title)) {
              console.log('[AutoPopulation] Generating AI content for section:', section.title);
              const aiContent = await this.generateAIContent(
                section.title,
                template.type || template.name,
                company,
                openaiKey
              );
              
              if (aiContent && !aiContent.includes('Missing:')) {
                // Keep original content and mark as having AI suggestions
                const contentId = `${section.id}-${content.id}`;
                
                // Track AI change for highlighting (but don't replace content yet)
                AIChangeTrackingService.trackChange(
                  contentId,
                  content.content,
                  aiContent,
                  'ai-generated',
                  'openai'
                );
                
                // Mark content as having AI suggestions but keep original content
                updatedContent = content.content;
                
                hasAIContent = true;
                wasAutoPopulated = true;
              } else {
                // Add missing info marker if AI generation failed
                updatedContent = await this.addMissingInfoMarkers(updatedContent, section.title, company);
              }
            } else if (!openaiKey && this.needsContent(updatedContent)) {
              // No API key available - add missing info markers
              updatedContent = await this.addMissingInfoMarkers(updatedContent, section.title, company);
            }

            // Mark content with appropriate metadata
            if (wasAutoPopulated || hasAIContent) {
              return {
                ...content,
                content: updatedContent,
                metadata: {
                  ...content.metadata,
                  dataSource: hasAIContent ? 'ai-generated' : 'auto-populated',
                  populatedFrom: hasAIContent ? 'openai' : 'company_data',
                  isHighlighted: true,
                  aiUsed: hasAIContent,
                  companyDataUsed: wasAutoPopulated && !hasAIContent
                }
              };
            }

            return {
              ...content,
              content: updatedContent
            };
          })
        );

        return {
          ...section,
          content: processedContent
        };
      })
    );

    populatedTemplate.sections = processedSections;

    // Update product context
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
   * Get additional company data from settings/configuration
   */
  private static async getCompanyAdditionalData(companyId: string): Promise<any> {
    try {
      // Fetch company settings for document numbering, retention periods, etc.
      const { data: settings, error } = await supabase
        .from('template_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId);

      if (error) throw error;

      // Convert to object for easier access
      const settingsObj: any = {};
      settings?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      return settingsObj;
    } catch (error) {
      console.error('[AutoPopulation] Error fetching company settings:', error);
      return {};
    }
  }

  /**
   * Get EDM system data including electronic signatures configuration
   */
  private static async getEdmSystemData(companyId: string): Promise<any> {
    try {
      const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      return {
        electronicSignatures: orgData.edmSystem?.electronicSignatures || 'Not Available',
        systemName: orgData.edmSystem?.systemName || 'Document Management System',
        accessControl: orgData.edmSystem?.accessControl || 'Role-based access',
        auditTrail: orgData.edmSystem?.auditTrail || 'Complete audit trail maintained'
      };
    } catch (error) {
      console.error('[AutoPopulation] Error fetching EDM system data:', error);
      return {};
    }
  }

  /**
   * Get EMDN codes data for the product
   */
  private static async getEmdnCodesData(companyId: string, productId?: string): Promise<any> {
    try {
      if (!productId) return {};

      const { data: product, error } = await supabase
        .from('products')
        .select('name, description')
        .eq('id', productId)
        .single();

      if (error) throw error;

      return {
        emdnCode: 'Not Assigned',
        classification: 'Medical Device',
        riskClass: 'Not Classified'
      };
    } catch (error) {
      console.error('[AutoPopulation] Error fetching EMDN codes data:', error);
      return {};
    }
  }

  /**
   * Create comprehensive replacement map with all available data
   */
  private static async createComprehensiveReplacementMap(
    company: CompanyData,
    personnel: PersonnelData[],
    phases: PhaseData[],
    currentDate: string,
    qaHeadName: string | null,
    additionalData: any,
    edmSystemData: any = {},
    emdnCodesData: any = {}
  ): Promise<Array<{ placeholder: string; replacement: string; isPopulated: boolean }>> {
    const replacements = [];

    // Basic company data
    replacements.push(
      { 
        placeholder: '[Company Name]', 
        replacement: this.highlightPopulated(company.name), 
        isPopulated: true 
      },
      { 
        placeholder: '[Date]', 
        replacement: this.highlightPopulated(currentDate), 
        isPopulated: true 
      },
      { 
        placeholder: '[Version]', 
        replacement: this.highlightPopulated('1.0'), 
        isPopulated: true 
      }
    );

    // Company contact info
    if (company.address || company.city || company.country) {
      const address = this.formatAddress(company);
      replacements.push({
        placeholder: '[Company Address]',
        replacement: this.highlightPopulated(address),
        isPopulated: true
      });
    }

    if (company.phone) {
      replacements.push({
        placeholder: '[Company Phone]',
        replacement: this.highlightPopulated(company.phone),
        isPopulated: true
      });
    }

    if (company.email) {
      replacements.push({
        placeholder: '[Company Email]',
        replacement: this.highlightPopulated(company.email),
        isPopulated: true
      });
    }

    if (company.srn) {
      replacements.push({
        placeholder: '[SRN]',
        replacement: this.highlightPopulated(company.srn),
        isPopulated: true
      });
    }

    // Personnel data - preserve role titles, only replace person names
    if (qaHeadName) {
      replacements.push(
        {
          placeholder: '[QA Head Name]',
          replacement: this.highlightPopulated(qaHeadName),
          isPopulated: true
        },
        {
          placeholder: '[Quality Manager Name]',
          replacement: this.highlightPopulated(qaHeadName),
          isPopulated: true
        },
        {
          placeholder: '[Head of Quality Name]',
          replacement: this.highlightPopulated(qaHeadName),
          isPopulated: true
        }
      );
    }

    // Electronic signatures integration from company settings
    if (edmSystemData.electronicSignatures) {
      replacements.push({
        placeholder: '(ELECTRONIC SIGNATURE)',
        replacement: this.highlightPopulated(`(${edmSystemData.electronicSignatures})`),
        isPopulated: true
      });
      
      replacements.push({
        placeholder: '[Electronic Signature System]',
        replacement: this.highlightPopulated(edmSystemData.electronicSignatures),
        isPopulated: true
      });
    }

    // EMDN codes integration
    if (emdnCodesData.emdnCode && emdnCodesData.emdnCode !== 'Not Assigned') {
      replacements.push({
        placeholder: '[EMDN Code]',
        replacement: this.highlightPopulated(emdnCodesData.emdnCode),
        isPopulated: true
      });
      
      replacements.push({
        placeholder: '[Product Classification]',
        replacement: this.highlightPopulated(emdnCodesData.classification),
        isPopulated: true
      });
      
      replacements.push({
        placeholder: '[Risk Class]',
        replacement: this.highlightPopulated(emdnCodesData.riskClass),
        isPopulated: true
      });
    }

    // Document numbering system, retention periods, and EDM system from company organizational data
    const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
    const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(company.id);
    
    // Document numbering system
    if (orgData.documentNumberingSystem?.prefix) {
      const formatExample = `${orgData.documentNumberingSystem.prefix}-${orgData.documentNumberingSystem.startingNumber || '001'} ${orgData.documentNumberingSystem.versionFormat || 'V1.0'}`;
      replacements.push({
        placeholder: '[Document Numbering System]',
        replacement: this.highlightPopulated(`Format: ${formatExample}`),
        isPopulated: true
      });
    } else if (additionalData.document_numbering_prefix) {
      replacements.push({
        placeholder: '[Document Numbering System]',
        replacement: this.highlightPopulated(`Format: ${additionalData.document_numbering_prefix}-XXX`),
        isPopulated: true
      });
    }

    // Retention periods from Company Settings
    if (orgData.retentionPeriods) {
      const retentionDetails = [];
      if (orgData.retentionPeriods.sops) retentionDetails.push(`SOPs: ${orgData.retentionPeriods.sops}`);
      if (orgData.retentionPeriods.qualityRecords) retentionDetails.push(`Quality Records: ${orgData.retentionPeriods.qualityRecords}`);
      if (orgData.retentionPeriods.designFiles) retentionDetails.push(`Design Files: ${orgData.retentionPeriods.designFiles}`);
      if (orgData.retentionPeriods.clinicalData) retentionDetails.push(`Clinical Data: ${orgData.retentionPeriods.clinicalData}`);
      
      if (retentionDetails.length > 0) {
        replacements.push({
          placeholder: '[Retention Period]',
          replacement: this.highlightPopulated(retentionDetails.join(', ')),
          isPopulated: true
        });
        replacements.push({
          placeholder: '[Document Retention Periods]',
          replacement: this.highlightPopulated(retentionDetails.join('; ')),
          isPopulated: true
        });
      }
    } else if (additionalData.retention_period_sops) {
      replacements.push({
        placeholder: '[Retention Period]',
        replacement: this.highlightPopulated(`SOPs: ${additionalData.retention_period_sops} years`),
        isPopulated: true
      });
    }

    // Electronic Document Management System from Company Settings
    if (orgData.edmSystem) {
      const edmDetails = [];
      if (orgData.edmSystem.platform) edmDetails.push(`Platform: ${orgData.edmSystem.platform}`);
      if (orgData.edmSystem.validationStatus) edmDetails.push(`Validation: ${orgData.edmSystem.validationStatus}`);
      if (orgData.edmSystem.accessControls) edmDetails.push(`Access: ${orgData.edmSystem.accessControls}`);
      if (orgData.edmSystem.auditTrail) edmDetails.push(`Audit Trail: ${orgData.edmSystem.auditTrail}`);
      
      if (edmDetails.length > 0) {
        replacements.push({
          placeholder: '[eDMS System]',
          replacement: this.highlightPopulated(edmDetails.join(', ')),
          isPopulated: true
        });
        replacements.push({
          placeholder: '[Electronic Document Management System]',
          replacement: this.highlightPopulated(`${orgData.edmSystem.platform} (${orgData.edmSystem.validationStatus})`),
          isPopulated: true
        });
      }
    } else if (additionalData.edms_system) {
      replacements.push({
        placeholder: '[eDMS System]',
        replacement: this.highlightPopulated(additionalData.edms_system),
        isPopulated: true
      });
    }

    // Department structure
    if (company.department_structure && Array.isArray(company.department_structure) && company.department_structure.length > 0) {
      const deptNames = company.department_structure.map((dept: any) => dept.name).filter(Boolean);
      if (deptNames.length > 0) {
        replacements.push({
          placeholder: '[Department Structure]',
          replacement: this.highlightPopulated(`Departments: ${deptNames.join(', ')}`),
          isPopulated: true
        });
      }
    }

    return replacements;
  }

  /**
   * Check if section should get AI-generated content
   * Only generate AI content for specific sections: PURPOSE, SCOPE, RESPONSIBILITIES, PROCEDURE, REFERENCES, DEFINITIONS
   */
  private static shouldGenerateAIContent(content: string, sectionTitle: string): boolean {
    // Generate AI content for sections that are mostly empty or have minimal placeholder content
    const contentLength = content.replace(/<[^>]*>/g, '').trim().length;
    const hasPlaceholders = content.includes('[') && content.includes(']');
    const isEmptySection = contentLength < 100;
    
    // Only these specific sections should get AI generation
    const allowedAISections = [
      'purpose', 'scope', 'responsibilities', 'procedure', 'references', 'definitions'
    ];
    
    const sectionNeedsAI = allowedAISections.some(target => 
      sectionTitle.toLowerCase().includes(target)
    );
    
    console.log(`[AutoPopulation] Checking AI generation for section "${sectionTitle}":`, {
      hasPlaceholders,
      isEmptySection,
      sectionNeedsAI,
      willGenerate: (isEmptySection || hasPlaceholders) && sectionNeedsAI
    });
    
    return (isEmptySection || hasPlaceholders) && sectionNeedsAI;
  }

  /**
   * Check if content needs improvement
   */
  private static needsContent(content: string): boolean {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    return cleanContent.length < 50 || (content.includes('[') && content.includes(']'));
  }

  /**
   * Replace content with AI-generated content (no HTML wrapping - let AIChangeTrackingService handle highlighting)
   */
  private static replaceWithAIContent(originalContent: string, aiContent: string): string {
    // Don't add HTML wrapping here - let the AIChangeTrackingService handle it
    // If original content is mostly empty or placeholders, replace entirely
    const cleanOriginal = originalContent.replace(/<[^>]*>/g, '').trim();
    if (cleanOriginal.length < 50 || (originalContent.includes('[') && originalContent.includes(']'))) {
      return aiContent;
    }
    
    // Otherwise append AI content
    return originalContent + '\n\n' + aiContent;
  }

  /**
   * Add missing info markers to content or generate content from company data
   */
  private static async addMissingInfoMarkers(content: string, sectionTitle: string, company: CompanyData): Promise<string> {
    // If content has unfilled placeholders, replace them with missing info markers
    let updatedContent = content;
    
    // Replace common placeholders with specific missing info markers
    const placeholderReplacements = [
      { pattern: /\[Company Name\]/g, replacement: this.createMissingInfoMarker('Company name') },
      { pattern: /\[Date\]/g, replacement: this.createMissingInfoMarker('Current date') },
      { pattern: /\[Department\]/g, replacement: this.createMissingInfoMarker('Department information') },
      { pattern: /\[SRN\]/g, replacement: this.createMissingInfoMarker('Single Registration Number') },
      { pattern: /\[.*?\]/g, replacement: this.createMissingInfoMarker('Specific information') }
    ];
    
    placeholderReplacements.forEach(({ pattern, replacement }) => {
      updatedContent = updatedContent.replace(pattern, replacement);
    });
    
    // Check if section is mostly empty and try to populate from company data first
    const cleanContent = updatedContent.replace(/<[^>]*>/g, '').replace(/Missing:/g, '').trim();
    // Don't add missing markers to sections that already have substantial content (like numbered lists)
    if (cleanContent.length < 30 && !cleanContent.match(/^\d+\./m)) {
      // Try to generate content from company data
      const generatedContent = await this.generateContentFromCompanyData(sectionTitle, company);
      
      if (generatedContent) {
        // Don't add HTML wrapping here - let the AIChangeTrackingService handle it
        updatedContent = generatedContent;
      } else {
        // Only show missing marker if we can't generate from company data
        updatedContent += '\n\n' + this.createMissingInfoMarker(`Content needed for ${sectionTitle} section`);
      }
    }
    
    return updatedContent;
  }

  /**
   * Generate content from company data for specific sections
   */
  private static async generateContentFromCompanyData(sectionTitle: string, company: CompanyData): Promise<string | null> {
    const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
    
    try {
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(company.id);
      const title = sectionTitle.toLowerCase();
      
      // Generate content based on section type and available company data
      if (title.includes('document changes') || title.includes('change control')) {
        if (orgData.documentNumberingSystem?.prefix) {
          return `Any change to a controlled document must be initiated via a Document Change Order (DCO). The DCO must include a description of the change, the reason for the change, and an assessment of its impact. The DCO follows the same review and approval process as a new document. Upon approval, the document's revision level is updated using our ${orgData.documentNumberingSystem.prefix} numbering system.`;
        }
      }
      
      if (title.includes('retention') || title.includes('archiving')) {
        if (orgData.retentionPeriods) {
          const periods = [];
          if (orgData.retentionPeriods.sops) periods.push(`SOPs: ${orgData.retentionPeriods.sops}`);
          if (orgData.retentionPeriods.qualityRecords) periods.push(`Quality Records: ${orgData.retentionPeriods.qualityRecords}`);
          if (periods.length > 0) {
            return `Documents are retained according to ${company.name}'s established retention schedule: ${periods.join(', ')}. ${orgData.edmSystem?.name ? `All documents are managed through our ${orgData.edmSystem.name} system.` : ''}`;
          }
        }
      }
      
      if (title.includes('distribution') || title.includes('issuance')) {
        if (orgData.edmSystem?.name) {
          return `Document distribution is managed through ${company.name}'s ${orgData.edmSystem.name} system. Only current, approved versions are made available to users. Physical copies are marked "CONTROLLED COPY" and tracked for distribution.`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[AutoPopulation] Error generating content from company data:', error);
      return null;
    }
  }

  /**
   * Return populated content without HTML highlighting (AIChangeTrackingService handles highlighting)
   */
  private static highlightPopulated(text: string): string {
    return text;
  }

  /**
   * Format company address
   */
  private static formatAddress(company: CompanyData): string {
    const parts = [company.address, company.city, company.postal_code, company.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  /**
   * Calculate which fields were actually populated
   */
  private static calculatePopulatedFields(
    company: CompanyData,
    personnel: PersonnelData[],
    phases: PhaseData[]
  ): string[] {
    const populated: string[] = ['company_name', 'current_date', 'document_version'];

    if (company.address || company.city) populated.push('company_address');
    if (company.phone) populated.push('company_phone');
    if (company.email) populated.push('company_email');
    if (company.srn) populated.push('company_srn');
    if (company.contact_person) populated.push('contact_person');
    
    if (personnel.length > 0) {
      populated.push('personnel_data');
      if (personnel.some(p => p.access_level === 'admin')) {
        populated.push('qa_head_identified');
      }
    }
    
    if (phases.length > 0) populated.push('lifecycle_phases');
    
    if (company.department_structure && Array.isArray(company.department_structure) && company.department_structure.length > 0) {
      populated.push('department_structure');
    }

    return populated;
  }

  /**
   * Filter missing data to only show items not already configured in company settings
   */
  private static async filterTrulyMissingData(
    missingData: MissingDataIndicator[],
    companyId: string
  ): Promise<MissingDataIndicator[]> {
    try {
      console.log('[AutoPopulation] Filtering missing data...');

      // Get company settings data to check what's actually configured
      const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      // Define what data exists in company settings
      const configuredInCompanySettings = new Set();
      
      // Check if retention periods are configured
      if (orgData.retentionPeriods && Object.keys(orgData.retentionPeriods).length > 0) {
        configuredInCompanySettings.add('retention_periods');
        configuredInCompanySettings.add('document_retention');
        configuredInCompanySettings.add('retention_period');
      }
      
      // Check if EDM system is configured
      if (orgData.edmSystem && orgData.edmSystem.name) {
        configuredInCompanySettings.add('edm_system');
        configuredInCompanySettings.add('document_management');
        configuredInCompanySettings.add('edm');
      }
      
      // Check if document numbering system is configured
      if (orgData.documentNumberingSystem && orgData.documentNumberingSystem.prefix) {
        configuredInCompanySettings.add('document_numbering');
        configuredInCompanySettings.add('document_numbering_system');
        configuredInCompanySettings.add('numbering_system');
      }

      console.log('[AutoPopulation] Configured in company settings:', Array.from(configuredInCompanySettings));

      // Filter out items that are actually configured in company settings
      const trulyMissing = missingData.filter(item => {
        const fieldName = item.field?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        
        // Check if this data is configured in company settings
        const isConfigured = Array.from(configuredInCompanySettings).some((setting: string) => 
          fieldName.includes(setting) || 
          description.includes(setting) ||
          setting.includes(fieldName.split('_')[0]) // Check partial matches
        );
        
        if (isConfigured) {
          console.log('[AutoPopulation] Filtering out configured data:', item.field, item.description);
          return false; // Don't show as missing
        }
        
        return true; // Show as missing
      });

      console.log('[AutoPopulation] Filtered missing data result:', {
        originalCount: missingData.length,
        trulyMissingCount: trulyMissing.length,
        filtered: trulyMissing.map(m => ({ field: m.field, description: m.description }))
      });

      return trulyMissing;
    } catch (error) {
      console.error('[AutoPopulation] Error filtering missing data:', error);
      return missingData;
    }
  }

  /**
   * Generate contextual suggestions
   */
  private static generateAutomatedSuggestions(company: CompanyData, templateType: string): string[] {
    const suggestions: string[] = [];

    // Company-specific suggestions
    if (company.country) {
      suggestions.push(`Template automatically adapted for ${company.country} regulatory requirements`);
    }

    if (company.srn) {
      suggestions.push('SRN automatically referenced in regulatory sections');
    }

    // Template-specific suggestions
    suggestions.push('Company data automatically populated from settings');
    suggestions.push('Smart suggestions available for document enhancement');

    return suggestions;
  }

  /**
   * Calculate completion percentage based on populated vs missing data
   */
  private static calculateCompletionPercentage(
    populatedFields: string[],
    missingData: MissingDataIndicator[]
  ): number {
    const totalPossibleFields = 20; // Estimate of total possible fields
    const criticalMissing = missingData.filter(m => m.priority === 'critical').length;
    
    // Reduce percentage for critical missing items
    const base = Math.round((populatedFields.length / totalPossibleFields) * 100);
    const penalty = criticalMissing * 10; // 10% penalty per critical missing item
    
    return Math.max(base - penalty, 0);
  }
}