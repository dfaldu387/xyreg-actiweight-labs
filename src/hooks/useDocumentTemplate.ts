import { useState, useEffect } from 'react';
import { DocumentTemplate, ProductContext, DocumentSection, DocumentContent, DocumentControl } from '@/types/documentComposer';
import { supabase } from '@/integrations/supabase/client';
import { DocumentParsingService } from '@/services/documentParsingService';
import { HardcodedTemplateService } from '@/services/hardcodedTemplateService';

export function useDocumentTemplate(templateId: string, productId: string, docName?: string) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First check for hardcoded templates
        const hardcodedTemplate = HardcodedTemplateService.getTemplate(templateId);
        if (hardcodedTemplate) {
          // Get company name for customization
          let companyName = 'Your Company';
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: companyRole } = await supabase
                .from('user_company_access')
                .select('companies(name)')
                .eq('user_id', user.id)
                .limit(1)
                .single();
              
              if (companyRole?.companies?.name) {
                companyName = companyRole.companies.name;
              }
            }
          } catch (error) {
            console.warn('Could not fetch company name for template customization:', error);
          }

          const customizedTemplate = HardcodedTemplateService.customizeTemplateForCompany(
            hardcodedTemplate.template,
            companyName
          );
          setTemplate(customizedTemplate);
          return;
        }

        // Fallback to database templates
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(templateId);
        let dbTemplate: any = null;
        let dbError: any = null;

        // Only query UUID-column tables if templateId is a valid UUID
        if (isUUID) {
          const result = await supabase
            .from('company_document_templates')
            .select('*')
            .eq('id', templateId)
            .maybeSingle();
          dbTemplate = result.data;
          dbError = result.error;

          // If not found in company templates, try default templates
          if (!dbTemplate) {
            const { data: defaultTemplate, error: defaultError } = await supabase
              .from('default_company_document_template')
              .select('*')
              .eq('id', templateId)
              .maybeSingle();
            
            if (!defaultError && defaultTemplate) {
              dbTemplate = {
                ...defaultTemplate,
                company_id: 'default',
                is_user_removed: false,
                markets: [],
                classes_by_market: {},
                uploaded_by: 'system',
                structure: null,
                tech_applicability: null
              };
              dbError = null;
            }
          }
        }

        // If still not found, try document_studio_templates (for saved Doc CI / family descriptions)
        if (!dbTemplate) {
          let studioMatch = null;

          // First try by template_id
          const { data: studioTemplate, error: studioError } = await supabase
            .from('document_studio_templates')
            .select('*')
            .eq('template_id', templateId)
            .maybeSingle();

          if (!studioError && studioTemplate) {
            studioMatch = studioTemplate;
          }

          // If not found by templateId, try by name (handles DS-{randomUUID} mismatch)
          // But skip name fallback for TF- prefixed keys to avoid cross-document collisions
          const isTFKey = templateId.startsWith('TF-');
          if (!studioMatch && docName && !isTFKey) {
            const { data: studioByName } = await supabase
              .from('document_studio_templates')
              .select('*')
              .eq('name', docName)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (studioByName) {
              studioMatch = studioByName;
            }
          }

          if (studioMatch) {
            const studioSections = Array.isArray(studioMatch.sections) ? studioMatch.sections : [];
            const studioMetadata = studioMatch.metadata && typeof studioMatch.metadata === 'object' ? studioMatch.metadata : {};
            
            const loadedTemplate: DocumentTemplate = {
              id: studioMatch.template_id,
              name: studioMatch.name,
              type: studioMatch.type,
              sections: studioSections as unknown as DocumentSection[],
              productContext: studioMatch.product_context as unknown as ProductContext || {
                id: productId || 'company-wide',
                name: '',
                riskClass: 'N/A',
                phase: 'N/A',
                description: '',
                regulatoryRequirements: []
              },
              documentControl: studioMatch.document_control as unknown as DocumentControl || {
                sopNumber: studioMatch.name?.match(/SOP-\d{3}/)?.[0] || '',
                documentTitle: studioMatch.name || '',
                version: 'v1.0',
                effectiveDate: new Date(),
                documentOwner: '',
                preparedBy: { name: '', title: '', date: new Date() },
                reviewedBy: { name: '', title: '', date: new Date() },
                approvedBy: { name: '', title: '', date: new Date() },
              },
              metadata: {
                version: (studioMetadata as any)?.version || '1.0',
                lastUpdated: studioMatch.updated_at ? new Date(studioMatch.updated_at) : new Date(),
                estimatedCompletionTime: (studioMetadata as any)?.estimatedCompletionTime || '1-2 hours'
              }
            };
            setTemplate(loadedTemplate);
            return;
          }
        }

        if (!dbTemplate && dbError) {
          throw dbError;
        }

        let loadedTemplate: DocumentTemplate;

        if (dbTemplate && (dbTemplate.file_path || dbTemplate.public_url)) {
          // Parse actual document file
          const productContext: ProductContext = {
            id: productId || 'company-wide',
            name: productId ? 'CardioStent Pro X1' : 'Company Wide Document',
            riskClass: 'Class III',
            phase: 'Design Development',
            description: 'High-risk cardiovascular device requiring comprehensive documentation',
            regulatoryRequirements: ['ISO 14971', 'ISO 13485', 'FDA 21 CFR 820']
          };

          try {
            const filePath = dbTemplate.file_path || dbTemplate.public_url || 'mock';
            loadedTemplate = await DocumentParsingService.parseTemplate(
              filePath,
              dbTemplate.file_name || dbTemplate.name,
              productContext
            );
          } catch (parseError) {
            console.warn('Failed to parse document, falling back to mock content:', parseError);
            // Fallback to mock if parsing fails
            loadedTemplate = generateMockTemplate(templateId, productId, dbTemplate.name);
          }
        } else {
          // Generate mock template if no file exists
          loadedTemplate = generateMockTemplate(templateId, productId, dbTemplate?.name || docName);
        }

        setTemplate(loadedTemplate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    } else {
      setTemplate(null);
      setIsLoading(false);
    }
  }, [templateId, productId]);

  return { template, isLoading, error };
}

// Map database template IDs/names to our standard template types
function mapDatabaseTemplateToStandardType(templateId: string, templateName?: string): string {
  // First try to match by name (more reliable)
  if (templateName) {
    const lowerName = templateName.toLowerCase();
    if (lowerName.includes('employee training') || lowerName.includes('training') || lowerName.includes('training program')) {
      return 'employee-training';
    }
    if (lowerName.includes('change control') || lowerName.includes('document change') || lowerName.includes('change management')) {
      return 'change-control';
    }
    if (lowerName.includes('control of measuring') || lowerName.includes('measuring equipment') || lowerName.includes('calibration')) {
      return 'control-of-measuring';
    }
    if (lowerName.includes('risk management') || lowerName.includes('risk analysis')) {
      return 'risk-management-plan';
    }
    if (lowerName.includes('design control') || lowerName.includes('design history')) {
      return 'design-control';
    }
    if (lowerName.includes('corrective action') || lowerName.includes('capa')) {
      return 'corrective-action';
    }
    if (lowerName.includes('control of records') || lowerName.includes('document control')) {
      return 'control-of-records';
    }
  }
  
  // Fallback to direct ID matching if it's a standard type
  if (['employee-training', 'change-control', 'control-of-measuring', 'risk-management-plan', 'design-control', 'corrective-action', 'control-of-records'].includes(templateId)) {
    return templateId;
  }
  
  // Default fallback
  return 'control-of-measuring';
}

export function generateMockTemplate(templateId: string, productId: string, templateName?: string): DocumentTemplate {
  // Map the database template ID to a standard template type
  const standardTemplateType = mapDatabaseTemplateToStandardType(templateId, templateName);
  
  const productContext: ProductContext = {
    id: productId || 'company-wide',
    name: productId ? 'CardioStent Pro X1' : 'Company Wide Document',
    riskClass: productId ? 'Class III' : 'N/A',
    phase: productId ? 'Design Development' : 'Company Level',
    description: productId ? 'Next-generation cardiac stent with bioabsorbable coating' : 'Company-wide document template',
    regulatoryRequirements: ['ISO 14971', 'ISO 13485', 'FDA 21 CFR 820']
  };

  const sections: DocumentSection[] = generateSectionsForTemplate(standardTemplateType, productContext);

  return {
    id: templateId,
    name: templateName || getTemplateNameFromStandardType(standardTemplateType),
    type: standardTemplateType,
    sections,
    productContext,
    metadata: {
      version: '1.0',
      lastUpdated: new Date(),
      estimatedCompletionTime: '3-4 hours'
    }
  };
}

function generateSectionsForTemplate(templateId: string, productContext: ProductContext): DocumentSection[] {
  switch (templateId) {
    case 'employee-training':
      return [
        {
          id: 'purpose',
          title: '1. PURPOSE',
          order: 1,
          content: [
            {
              id: 'purpose-1',
              type: 'paragraph',
              content: 'The purpose of this procedure is to establish a systematic approach for training employees on quality management system requirements, job-specific skills, and regulatory compliance within the organization.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-training',
                  title: 'ISO 13485:2016 Section 6.2',
                  type: 'standard',
                  excerpt: 'The organization shall ensure that personnel are competent on the basis of appropriate education, training, skills and experience...',
                  relevanceScore: 0.95
                }
              ],
              metadata: {
                confidence: 0.92,
                lastModified: new Date(),
                author: 'ai'
              }
            }
          ]
        },
        {
          id: 'scope',
          title: '2. SCOPE',
          order: 2,
          content: [
            {
              id: 'scope-1',
              type: 'paragraph',
              content: 'This procedure applies to all employees requiring training on quality management system processes, regulatory requirements, and job-specific competencies.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-competence',
                  title: 'ISO 13485:2016 Section 6.2.1',
                  type: 'standard',
                  excerpt: 'Personnel performing work affecting product quality shall be competent...',
                  relevanceScore: 0.88
                }
              ],
              metadata: {
                confidence: 0.89,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'scope-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: What specific training categories are required in your organization?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        },
        {
          id: 'training-process',
          title: '4. TRAINING PROCESS',
          order: 3,
          content: [
            {
              id: 'process-1',
              type: 'heading',
              content: '4.1 Training Needs Assessment',
              isAIGenerated: true,
              metadata: {
                confidence: 0.95,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'process-2',
              type: 'paragraph',
              content: 'Training needs shall be identified based on job requirements, regulatory changes, process updates, and individual competency gaps. A training matrix shall be maintained for each position.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'fda-qsr-training',
                  title: 'FDA QSR 21 CFR 820.25',
                  type: 'regulation',
                  excerpt: 'Each manufacturer shall establish procedures to ensure that all personnel are trained to adequately perform their assigned responsibilities...',
                  relevanceScore: 0.92
                }
              ],
              metadata: {
                confidence: 0.90,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'process-3',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: How does your organization identify training needs for different roles?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        }
      ];

    case 'change-control':
      return [
        {
          id: 'purpose',
          title: '1. PURPOSE',
          order: 1,
          content: [
            {
              id: 'purpose-1',
              type: 'paragraph',
              content: 'The purpose of this procedure is to establish a systematic approach for the identification, review, approval, and implementation of changes to documents, processes, products, and systems within the quality management system.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-change',
                  title: 'ISO 13485:2016 Section 4.2.3',
                  type: 'standard',
                  excerpt: 'Changes to documents shall be reviewed and approved by the same function that performed the original review...',
                  relevanceScore: 0.95
                }
              ],
              metadata: {
                confidence: 0.92,
                lastModified: new Date(),
                author: 'ai'
              }
            }
          ]
        },
        {
          id: 'scope',
          title: '2. SCOPE',
          order: 2,
          content: [
            {
              id: 'scope-1',
              type: 'paragraph',
              content: 'This procedure applies to all changes affecting the quality management system including but not limited to: document changes, process modifications, product design changes, and system updates.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-scope',
                  title: 'ISO 13485:2016',
                  type: 'standard',
                  excerpt: 'The organization shall establish, document, implement and maintain a quality management system...',
                  relevanceScore: 0.88
                }
              ],
              metadata: {
                confidence: 0.89,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'scope-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: What specific types of changes are most common in your organization?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        },
        {
          id: 'change-process',
          title: '4. CHANGE CONTROL PROCESS',
          order: 3,
          content: [
            {
              id: 'process-1',
              type: 'heading',
              content: '4.1 Change Request Initiation',
              isAIGenerated: true,
              metadata: {
                confidence: 0.95,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'process-2',
              type: 'paragraph',
              content: 'All changes shall be formally requested using the approved Change Request Form. The request must include justification, impact assessment, and implementation timeline.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'fda-qsr-changes',
                  title: 'FDA QSR 21 CFR 820.70',
                  type: 'regulation',
                  excerpt: 'Each manufacturer shall establish and maintain procedures for changes to a device...',
                  relevanceScore: 0.92
                }
              ],
              metadata: {
                confidence: 0.90,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'process-3',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: Who in your organization has authority to initiate change requests?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        }
      ];

    case 'control-of-records':
      return [
        {
          id: 'purpose',
          title: '1. PURPOSE',
          order: 1,
          content: [
            {
              id: 'purpose-1',
              type: 'paragraph',
              content: 'The purpose of this procedure is to establish and maintain a systematic approach to the control of quality records throughout the organization.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-records',
                  title: 'ISO 13485:2016 Section 4.2.4',
                  type: 'standard',
                  excerpt: 'Records required by this International Standard shall be controlled...',
                  relevanceScore: 0.95
                }
              ],
              metadata: {
                confidence: 0.92,
                lastModified: new Date(),
                author: 'ai'
              }
            }
          ]
        },
        {
          id: 'scope',
          title: '2. SCOPE',
          order: 2,
          content: [
            {
              id: 'scope-1',
              type: 'paragraph',
              content: 'This procedure applies to all quality records generated, maintained, and controlled within the company\'s quality management system.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-scope',
                  title: 'ISO 13485:2016',
                  type: 'standard',
                  excerpt: 'Quality records shall be established and maintained to provide evidence of conformity...',
                  relevanceScore: 0.88
                }
              ],
              metadata: {
                confidence: 0.89,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'scope-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: What specific types of quality records are generated in your organization?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        },
        {
          id: 'procedure',
          title: '4. PROCEDURE',
          order: 3,
          content: [
            {
              id: 'procedure-1',
              type: 'heading',
              content: '4.1 Record Identification',
              isAIGenerated: true,
              metadata: {
                confidence: 0.95,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'procedure-2',
              type: 'paragraph',
              content: 'All quality records shall be clearly identified and classified according to their type and importance to the quality management system.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-identification',
                  title: 'ISO 13485:2016 Section 4.2.4',
                  type: 'standard',
                  excerpt: 'Records shall remain legible, readily identifiable and retrievable...',
                  relevanceScore: 0.92
                }
              ],
              metadata: {
                confidence: 0.90,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'procedure-3',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: How does your organization identify and classify quality records?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        }
      ];

    case 'control-of-measuring':
      return [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          order: 1,
          content: [
            {
              id: 'summary-1',
              type: 'paragraph',
              content: 'This Control of Measuring and Monitoring Equipment procedure has been established to ensure the accuracy and reliability of measurement equipment used in the quality management system.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-measuring',
                  title: 'ISO 13485:2016 Section 7.6',
                  type: 'standard',
                  excerpt: 'The organization shall determine the monitoring and measurement activities required...',
                  relevanceScore: 0.95
                }
              ],
              metadata: {
                confidence: 0.92,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'summary-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: Please provide specific details about the measurement equipment categories used in your organization]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        },
        {
          id: 'scope-purpose',
          title: 'Scope and Purpose',
          order: 2,
          content: [
            {
              id: 'scope-1',
              type: 'paragraph',
              content: 'This procedure applies to all measuring and monitoring equipment used within the quality management system to demonstrate conformity of products and services.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-scope',
                  title: 'ISO 13485:2016',
                  type: 'standard',
                  excerpt: 'Measuring equipment shall be capable of providing measurement results...',
                  relevanceScore: 0.88
                }
              ],
              metadata: {
                confidence: 0.89,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'scope-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: What specific product categories does this procedure cover in your facility?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        },
        {
          id: 'calibration-requirements',
          title: 'Calibration Requirements',
          order: 3,
          content: [
            {
              id: 'calibration-1',
              type: 'paragraph',
              content: 'All measuring equipment shall be calibrated or verified at specified intervals before use against measurement standards traceable to international or national measurement standards.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-13485-calibration',
                  title: 'ISO 13485:2016 Section 7.6.1',
                  type: 'standard',
                  excerpt: 'Measuring equipment shall be calibrated or verified at specified intervals...',
                  relevanceScore: 0.94
                }
              ],
              metadata: {
                confidence: 0.91,
                lastModified: new Date(),
                author: 'ai'
              }
            },
            {
              id: 'calibration-2',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: What are your organization\'s specific calibration intervals and standards?]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        }
      ];
    
    case 'risk-management-plan':
      return [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          order: 1,
          content: [
            {
              id: 'summary-1',
              type: 'paragraph',
              content: 'This Risk Management Plan has been developed in accordance with ISO 14971:2019 Medical devices — Application of risk management to medical devices.',
              isAIGenerated: true,
              aiSources: [
                {
                  id: 'iso-14971',
                  title: 'ISO 14971:2019',
                  type: 'standard',
                  excerpt: 'This document specifies terminology, principles and a process for risk management of medical devices...',
                  relevanceScore: 0.95
                }
              ],
              metadata: {
                confidence: 0.92,
                lastModified: new Date(),
                author: 'ai'
              }
            }
          ]
        }
      ];
    
    default:
      return [
        {
          id: 'placeholder',
          title: 'Document Content',
          order: 1,
          content: [
            {
              id: 'placeholder-1',
              type: 'paragraph',
              content: '[AI_PROMPT_NEEDED: This template needs content definition. Please describe the purpose and scope of this document.]',
              isAIGenerated: false,
              metadata: {
                confidence: 0.0,
                lastModified: new Date(),
                author: 'user'
              }
            }
          ]
        }
      ];
  }
}

function getTemplateNameFromStandardType(standardType: string): string {
  switch (standardType) {
    case 'employee-training':
      return 'Employee Training';
    case 'change-control':
      return 'Change Control';
    case 'control-of-records':
      return 'Control of Records';
    case 'control-of-measuring':
      return 'Control of Measuring and Monitoring Equipment';
    case 'risk-management-plan':
      return 'Risk Management Plan';
    case 'design-control':
      return 'Design Control';
    case 'corrective-action':
      return 'Corrective Action';
    default:
      return standardType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}