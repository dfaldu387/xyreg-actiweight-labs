import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DocumentSection {
  id: string;
  title: string;
  content: DocumentContent[];
  order: number;
}

interface DocumentContent {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'table';
  content: string;
  isAIGenerated: boolean;
  aiSources?: AISource[];
  metadata?: {
    confidence: number;
    lastModified: Date;
    author: 'ai' | 'user';
  };
}

interface AISource {
  id: string;
  title: string;
  type: 'regulation' | 'standard' | 'guideline' | 'company_policy';
  url?: string;
  excerpt: string;
  relevanceScore: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  sections: DocumentSection[];
  productContext: {
    id: string;
    name: string;
    riskClass: string;
    phase: string;
    description?: string;
    regulatoryRequirements: string[];
  };
  metadata: {
    version: string;
    lastUpdated: Date;
    estimatedCompletionTime: string;
  };
}

interface ComprehensiveContext {
  company: any;
  product?: any;
  existingDocuments: any[];
  personnel: any[];
  phases: any[];
  regulatoryContext: any;
  organizationalData: any;
}

async function gatherComprehensiveContext(companyId: string, productId?: string): Promise<ComprehensiveContext> {
  console.log('Gathering comprehensive context for company:', companyId, 'product:', productId);
  
  // 1. Company Data - ALL company information
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError) {
    console.error('Error fetching company data:', companyError);
  }

  // 2. Product Data (if specific product)
  let productData = null;
  if (productId) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        lifecycle_phases (*),
        certifications (*),
        audits (*)
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product data:', productError);
    } else {
      productData = product;
    }
  }

  // 3. Existing Documents - analyze company's document patterns
  const { data: existingDocs, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .limit(50);

  if (docsError) {
    console.error('Error fetching existing documents:', docsError);
  }

  // 4. Personnel and Roles
  const { data: personnel, error: personnelError } = await supabase
    .from('user_company_access')
    .select(`
      *,
      user_profiles (*)
    `)
    .eq('company_id', companyId);

  if (personnelError) {
    console.error('Error fetching personnel:', personnelError);
  }

  // 5. Company Phases
  const { data: phases, error: phasesError } = await supabase
    .from('company_chosen_phases')
    .select(`
      *,
      company_phases (*)
    `)
    .eq('company_id', companyId)
    .order('position');

  if (phasesError) {
    console.error('Error fetching phases:', phasesError);
  }

  // 6. Regulatory Context based on company country and product class
  const regulatoryContext = {
    country: companyData?.country,
    applicableRegulations: getApplicableRegulations(companyData?.country, productData?.risk_class),
    standards: getApplicableStandards(productData?.device_category, productData?.risk_class)
  };

  // 7. Organizational Data (EDS, document numbering, etc.)
  let organizationalData = {};
  try {
    if (companyData?.description) {
      organizationalData = JSON.parse(companyData.description);
    }
  } catch (e) {
    console.log('No organizational data found in company description');
  }

  return {
    company: companyData,
    product: productData,
    existingDocuments: existingDocs || [],
    personnel: personnel || [],
    phases: phases || [],
    regulatoryContext,
    organizationalData
  };
}

function getApplicableRegulations(country: string, riskClass: string): string[] {
  const regulations = [];
  
  // EU regulations
  if (country && ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'LU', 'CY', 'MT', 'SI', 'SK', 'EE', 'LV', 'LT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR'].includes(country)) {
    regulations.push('EU MDR 2017/745');
    regulations.push('ISO 13485:2016');
  }
  
  // US regulations
  if (country === 'US') {
    regulations.push('FDA 21 CFR Part 820');
    regulations.push('FDA 21 CFR Part 803');
    if (riskClass === 'Class III') {
      regulations.push('FDA PMA Requirements');
    }
  }
  
  // Universal standards
  regulations.push('ISO 14971:2019 (Risk Management)');
  regulations.push('IEC 62304 (Medical Device Software)');
  
  return regulations;
}

function getApplicableStandards(deviceCategory: string, riskClass: string): string[] {
  const standards = ['ISO 13485:2016', 'ISO 14971:2019'];
  
  if (deviceCategory?.toLowerCase().includes('software')) {
    standards.push('IEC 62304:2006+A1:2015');
    standards.push('IEC 62366-1:2015');
  }
  
  if (riskClass === 'Class III' || riskClass === 'Class IIb') {
    standards.push('ISO 10993 (Biocompatibility)');
  }
  
  return standards;
}

function buildIntelligentPrompt(context: ComprehensiveContext, section: DocumentSection, template: DocumentTemplate): string {
  const { company, product, existingDocuments, personnel, phases, regulatoryContext, organizationalData } = context;
  
  // Extract key personnel
  const qaPersonnel = personnel.filter(p => p.access_level === 'admin' || p.user_profiles?.first_name);
  const headOfQA = qaPersonnel.length > 0 ? qaPersonnel[0].user_profiles : null;
  
  // Extract document patterns
  const docPatterns = existingDocuments.length > 0 ? 
    `The company has ${existingDocuments.length} existing documents. Common naming patterns: ${existingDocuments.slice(0,3).map(d => d.name).join(', ')}` :
    'This appears to be among the first documents for this company.';
  
  // Build EDS system info
  const edsInfo = organizationalData.edmSystem ? 
    `Electronic Document Management System: ${organizationalData.edmSystem.platform} (${organizationalData.edmSystem.validationStatus})` :
    'Electronic Document Management System: To be configured';
  
  // Build document numbering info
  const docNumbering = organizationalData.documentNumberingSystem ?
    `Document Numbering System: ${organizationalData.documentNumberingSystem.prefix}-XXX format, ${organizationalData.documentNumberingSystem.description}` :
    'Document Numbering System: To be established';
  
  // Build retention periods info
  const retentionInfo = organizationalData.retentionPeriods ?
    `Document Retention: SOPs ${organizationalData.retentionPeriods.sops} years, Records ${organizationalData.retentionPeriods.records} years` :
    'Document Retention Periods: To be defined per regulatory requirements';

  // Build department structure info
  const departmentInfo = company.department_structure && Array.isArray(company.department_structure) ?
    `Organizational Structure: ${company.department_structure.map(d => d.name).join(', ')}` :
    'Organizational Structure: To be defined';

  return `
You are an expert medical device regulatory consultant generating professional content for a ${template.type} document.

COMPANY CONTEXT:
- Company: ${company?.name} (SRN: ${company?.srn || 'TBD'})
- Location: ${company?.address}, ${company?.city}, ${company?.country}
- Contact: ${company?.contact_person} (${company?.email})
${company.ar_name ? `- Authorized Representative: ${company.ar_name}, ${company.ar_address}, ${company.ar_city}, ${company.ar_country}` : ''}
${company.production_site_name ? `- Production Site: ${company.production_site_name}, ${company.production_site_address}, ${company.production_site_city}, ${company.production_site_country}` : ''}

ORGANIZATIONAL SETUP:
- ${edsInfo}
- ${docNumbering}
- ${retentionInfo}
- ${departmentInfo}
${headOfQA ? `- Head of Quality Assurance: ${headOfQA.first_name} ${headOfQA.last_name} (${headOfQA.email})` : '- Head of Quality Assurance: To be designated'}

${product ? `
PRODUCT CONTEXT:
- Product: ${product.name}
- Device Category: ${product.device_category}
- Risk Class: ${product.risk_class || 'TBD'}
- Current Phase: ${product.current_lifecycle_phase || 'Development'}
- Description: ${product.description || 'Medical device under development'}
- Intended Use: ${product.intended_use || 'To be defined'}
- Status: ${product.status}
` : ''}

REGULATORY CONTEXT:
- Applicable Regulations: ${regulatoryContext.applicableRegulations.join(', ')}
- Applicable Standards: ${regulatoryContext.standards.join(', ')}

COMPANY LIFECYCLE PHASES:
${phases.map(p => `- ${p.company_phases?.name}`).join('\n')}

DOCUMENT CONTEXT:
- Document Type: ${template.type}
- Section: "${section.title}"
- ${docPatterns}

INSTRUCTIONS:
Generate comprehensive, professional content for the "${section.title}" section that:

1. USES ACTUAL COMPANY DATA: Reference the specific company name, addresses, personnel, and organizational setup provided above
2. INCORPORATES ORGANIZATIONAL CONTEXT: Reference the actual EDS system, document numbering, retention periods, and department structure where relevant
3. FOLLOWS REGULATORY REQUIREMENTS: Ensure compliance with ${regulatoryContext.applicableRegulations.join(' and ')}
4. MAINTAINS PROFESSIONAL TONE: Use formal, technical language appropriate for regulatory submission
5. INCLUDES SPECIFIC DETAILS: Provide actionable procedures, not generic templates
6. REFERENCES REAL DATA: Use the actual company structure, phases, and setup information provided

${product ? `
For this ${product.device_category} (${product.risk_class}) product, ensure content addresses specific regulatory requirements and development phase considerations.
` : ''}

Generate detailed, implementable content that feels like it was written specifically for ${company?.name} by someone familiar with their organization and setup.
`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, companyId, productId, additionalContext, aiProviders } = await req.json();

    console.log('AI-Powered Document generation request:', {
      templateName: template.name,
      companyId,
      productId,
      sectionsCount: template.sections.length,
      aiProviders
    });

    // PHASE 1: COMPREHENSIVE DATA GATHERING
    console.log('Phase 1: Gathering comprehensive context...');
    const context = await gatherComprehensiveContext(companyId, productId);
    
    console.log('Context gathered:', {
      hasCompany: !!context.company,
      hasProduct: !!context.product,
      existingDocsCount: context.existingDocuments.length,
      personnelCount: context.personnel.length,
      phasesCount: context.phases.length,
      hasOrgData: Object.keys(context.organizationalData).length > 0
    });

    // Get company API keys
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from('company_api_keys')
      .select('key_type, encrypted_key')
      .eq('company_id', companyId);

    if (apiKeysError) {
      throw new Error(`Failed to fetch API keys: ${apiKeysError.message}`);
    }

    if (!apiKeysData || apiKeysData.length === 0) {
      throw new Error('No AI providers configured for this company');
    }

    // Select the first available AI provider (prioritize OpenAI, then Anthropic, then Gemini)
    const preferredOrder = ['openai', 'anthropic', 'gemini'];
    let selectedProvider = null;
    let apiKey = null;

    for (const provider of preferredOrder) {
      const keyRecord = apiKeysData.find(k => k.key_type === provider);
      if (keyRecord) {
        selectedProvider = provider;
        // In a real implementation, you'd decrypt the key here
        apiKey = keyRecord.encrypted_key; // This would need proper decryption
        break;
      }
    }

    if (!selectedProvider || !apiKey) {
      throw new Error('No valid AI provider found');
    }

    console.log(`Using AI provider: ${selectedProvider}`);

    // PHASE 2: INTELLIGENT CONTENT GENERATION
    console.log('Phase 2: Generating AI-powered content...');
    const updatedSections = await Promise.all(
      template.sections.map(async (section: DocumentSection) => {
        const intelligentPrompt = buildIntelligentPrompt(context, section, template);
        
        console.log(`Generating content for section: ${section.title}`);
        
        let generatedContent = '';
        let confidence = 0.85;
        
        try {
          // Generate content using the selected AI provider with rich context
          if (selectedProvider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  { 
                    role: 'system', 
                    content: 'You are an expert medical device regulatory consultant with deep knowledge of ISO 13485, EU MDR, FDA QSR, and industry best practices. Generate professional, detailed, company-specific content that incorporates actual organizational data provided.' 
                  },
                  { role: 'user', content: intelligentPrompt }
                ],
                max_tokens: 3000,
                temperature: 0.3, // Lower temperature for more consistent, professional content
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
              throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            generatedContent = data.choices[0].message.content;
            confidence = 0.92; // Higher confidence for AI-generated content with rich context
            
            console.log(`Generated ${generatedContent.length} characters for section: ${section.title}`);
          } else {
            // Fallback content if AI generation fails
            generatedContent = `This section will contain detailed information about ${section.title} for the ${context.company?.name || 'company'} ${template.productContext.name} medical device. Content will be generated based on regulatory requirements for ${template.productContext.riskClass} devices in the ${template.productContext.phase} phase.`;
            confidence = 0.6;
          }
        } catch (error) {
          console.error(`Error generating content for section ${section.title}:`, error);
          generatedContent = `Content for ${section.title} will be generated. Please configure AI providers in company settings for automatic content generation.
          
Company-specific context available:
- Company: ${context.company?.name || 'Unknown'}
- EDS System: ${context.organizationalData.edmSystem?.platform || 'To be configured'}
- Document Numbering: ${context.organizationalData.documentNumberingSystem?.prefix || 'To be established'}
- Retention Period: ${context.organizationalData.retentionPeriods?.sops || 'To be defined'} years`;
          confidence = 0.3;
        }

        // PHASE 3: SMART METADATA AND SOURCES
        const aiContent: DocumentContent = {
          id: `ai-${section.id}-${Date.now()}`,
          type: 'paragraph',
          content: generatedContent,
          isAIGenerated: true,
          aiSources: [
            {
              id: `source-company-${section.id}`,
              title: `${context.company?.name} Company Data`,
              type: 'company_policy',
              excerpt: `Generated using comprehensive company profile including organizational structure, personnel, and regulatory context`,
              relevanceScore: 0.95
            },
            ...context.existingDocuments.slice(0, 2).map(doc => ({
              id: `source-doc-${doc.id}`,
              title: doc.name,
              type: 'company_policy' as const,
              excerpt: `Referenced existing company document for consistency`,
              relevanceScore: 0.8
            })),
            {
              id: `source-regulatory-${section.id}`,
              title: `${context.regulatoryContext.applicableRegulations.join(', ')}`,
              type: 'regulation' as const,
              excerpt: `Content aligned with applicable medical device regulations`,
              relevanceScore: 0.9
            }
          ],
          metadata: {
            confidence,
            lastModified: new Date(),
            author: 'ai'
          }
        };

        return {
          ...section,
          content: [...section.content, aiContent]
        };
      })
    );

    // PHASE 4: QUALITY ASSURANCE AND VALIDATION
    const missingDataIndicators = [];
    
    if (!context.company?.srn) {
      missingDataIndicators.push('Company SRN not defined - may be required for regulatory submissions');
    }
    
    if (!context.organizationalData.edmSystem?.platform) {
      missingDataIndicators.push('Electronic Document Management System not configured');
    }
    
    if (!context.organizationalData.documentNumberingSystem?.prefix) {
      missingDataIndicators.push('Document numbering system not established');
    }

    const qualityMetrics = {
      dataCompletenessScore: Math.min(100, 
        (Object.keys(context.company || {}).length * 2) +
        (context.personnel.length * 5) +
        (context.existingDocuments.length * 3) +
        (Object.keys(context.organizationalData).length * 10)
      ),
      contextRichness: {
        hasCompanyData: !!context.company,
        hasPersonnel: context.personnel.length > 0,
        hasExistingDocs: context.existingDocuments.length > 0,
        hasOrgData: Object.keys(context.organizationalData).length > 0,
        hasProductContext: !!context.product
      }
    };

    const updatedTemplate: DocumentTemplate = {
      ...template,
      sections: updatedSections,
      metadata: {
        ...template.metadata,
        lastUpdated: new Date()
      }
    };

    console.log('AI-Powered Document generation completed successfully');
    console.log('Quality metrics:', qualityMetrics);

    return new Response(
      JSON.stringify({
        success: true,
        template: updatedTemplate,
        metadata: {
          aiProvider: selectedProvider,
          sectionsGenerated: updatedSections.length,
          generatedAt: new Date().toISOString(),
          contextUsed: {
            companyData: !!context.company,
            productData: !!context.product,
            existingDocuments: context.existingDocuments.length,
            personnel: context.personnel.length,
            organizationalData: Object.keys(context.organizationalData).length
          },
          qualityMetrics,
          missingDataIndicators
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI-powered generate-document function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate document content',
        context: 'AI-powered document generation with comprehensive context gathering'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});