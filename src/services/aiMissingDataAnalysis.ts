import { supabase } from '@/integrations/supabase/client';
import { decryptApiKey } from '@/utils/apiKeyUtils';

interface MissingDataItem {
  field: string;
  description: string;
  category: 'critical' | 'important' | 'optional';
  prompt: string;
}

interface AIAnalysisResponse {
  missingData: MissingDataItem[];
  confidence: number;
}

export class AIMissingDataAnalysis {
  static async analyzeTemplateForMissingData(
    templateContent: string,
    companyId: string
  ): Promise<AIAnalysisResponse> {
    try {
      // Use intelligent discovery to scan ALL available company data
      const { IntelligentCompanyDataDiscovery } = await import('./intelligentCompanyDataDiscovery');
      const discoveredData = await IntelligentCompanyDataDiscovery.discoverAllCompanyData(companyId);

      console.log('[AI Analysis] Discovered company data:', {
        completenessScore: discoveredData.completeness.score,
        availableFields: discoveredData.completeness.availableFields,
        missingFields: discoveredData.completeness.missingFields
      });

      const existingSettings = {
        // Document numbering - actually configured
        hasDocumentNumbering: !!discoveredData.organizationalData.documentNumbering?.prefix,
        
        // Retention periods - actually configured
        hasRetentionPeriods: !!discoveredData.organizationalData.retentionPeriods,
        
        // EDM system - actually configured  
        hasEdmSystem: !!discoveredData.organizationalData.edmSystem?.platform,
        
        // Department structure - actually configured
        hasDepartmentStructure: Array.isArray(discoveredData.personnel.departments) && discoveredData.personnel.departments.length > 0,
        
        // Approval workflow - actually configured
        hasApprovalWorkflow: !!discoveredData.organizationalData.approvalWorkflow,
        
        // API configuration - actually available
        hasAICapabilities: discoveredData.apiConfiguration.hasOpenAI || discoveredData.apiConfiguration.hasGemini || discoveredData.apiConfiguration.hasAnthropic,
        
        // Personnel - actually available
        hasPersonnel: discoveredData.personnel.users.length > 0,
        hasQAHead: !!discoveredData.personnel.qaHead,
        
        // Basic company info - actually configured
        hasCompanyInfo: !!discoveredData.basicInfo.name,
        hasContactInfo: !!(discoveredData.basicInfo.phone || discoveredData.basicInfo.email),
        hasAddress: !!(discoveredData.basicInfo.address),
        
        // Product structure - actually configured
        hasProductStructure: discoveredData.productPlatforms.length > 0 || discoveredData.productModels.length > 0,
        hasPhases: discoveredData.chosenPhases.length > 0,
        
        // Template settings - actually configured
        hasTemplateSettings: Object.keys(discoveredData.templateSettings).length > 0
      };
      // Get company's AI API key (try OpenAI first, then Gemini)
      let { data: apiKeys, error } = await supabase
        .from('company_api_keys')
        .select('encrypted_key, key_type')
        .eq('company_id', companyId)
        .eq('key_type', 'openai')
        .single();

      let apiKey = '';
      let provider = '';

      if (error || !apiKeys) {
        // Try Gemini if OpenAI not found
        const { data: geminiKeys, error: geminiError } = await supabase
          .from('company_api_keys')
          .select('encrypted_key, key_type')
          .eq('company_id', companyId)
          .eq('key_type', 'gemini')
          .single();

        if (geminiError || !geminiKeys) {
          console.warn('No AI API key (OpenAI or Gemini) found for company');
          return { missingData: [], confidence: 0 };
        }

        apiKey = decryptApiKey(geminiKeys.encrypted_key);
        provider = 'gemini';
      } else {
        apiKey = decryptApiKey(apiKeys.encrypted_key);
        provider = 'openai';
      }

      if (!apiKey || apiKey.length < 10) {
        console.warn('Invalid AI API key');
        return { missingData: [], confidence: 0 };
      }

      // Analyze template with AI based on provider
      let response: any;
      
      if (provider === 'gemini') {
        response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a medical device quality assurance expert. Analyze document templates and identify missing critical information that needs to be collected from the company.

Focus on these key areas:
- Organizational roles (Head of QA, department heads, etc.)
- Document control systems (numbering, approval workflows)
- Retention policies and procedures
- Electronic systems and software
- Signature authorities and approval processes
- Regulatory compliance requirements

Return a JSON response with this structure:
{
  "missingData": [
    {
      "field": "brief_field_name",
      "description": "What information is missing",
      "category": "critical|important|optional",
      "prompt": "Specific question to ask the user"
    }
  ],
  "confidence": 0.95
}

Only identify truly missing information that would be required for a complete, compliant document.

IMPORTANT: The company has EXTENSIVE data already configured. Do NOT mark these as missing:
${existingSettings.hasDocumentNumbering ? '- Document numbering system is CONFIGURED' : ''}
${existingSettings.hasRetentionPeriods ? '- Document retention periods are CONFIGURED' : ''}
${existingSettings.hasEdmSystem ? '- Electronic Document Management System is CONFIGURED' : ''}
${existingSettings.hasDepartmentStructure ? '- Department structure is CONFIGURED' : ''}
${existingSettings.hasApprovalWorkflow ? '- Approval workflow is CONFIGURED' : ''}
${existingSettings.hasPersonnel ? '- Personnel/user data is CONFIGURED' : ''}
${existingSettings.hasQAHead ? '- QA Head/management is CONFIGURED' : ''}
${existingSettings.hasCompanyInfo ? '- Company information is CONFIGURED' : ''}
${existingSettings.hasContactInfo ? '- Contact information is CONFIGURED' : ''}
${existingSettings.hasAddress ? '- Company address is CONFIGURED' : ''}
${existingSettings.hasProductStructure ? '- Product structure is CONFIGURED' : ''}
${existingSettings.hasPhases ? '- Lifecycle phases are CONFIGURED' : ''}
${existingSettings.hasTemplateSettings ? '- Template settings are CONFIGURED' : ''}
${existingSettings.hasAICapabilities ? '- AI capabilities are CONFIGURED' : ''}

ONLY identify information that is truly missing and not available anywhere in the system.
Do NOT include any of the above configured items in your missing data analysis.

Analyze this document template and identify what critical information is missing:

${templateContent.substring(0, 4000)}`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const textContent = data.candidates[0].content.parts[0].text;
        
        // Clean up the response to remove markdown code blocks
        const cleanedText = textContent.replace(/```json\s*|\s*```/g, '').trim();
        const aiResponse = JSON.parse(cleanedText);
        console.log('AI Analysis Results (Gemini):', aiResponse);
        return aiResponse;

      } else {
        // OpenAI
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a medical device quality assurance expert. Analyze document templates and identify missing critical information that needs to be collected from the company.

Focus on these key areas:
- Organizational roles (Head of QA, department heads, etc.)
- Document control systems (numbering, approval workflows)
- Retention policies and procedures
- Electronic systems and software
- Signature authorities and approval processes
- Regulatory compliance requirements

Return a JSON response with this structure:
{
  "missingData": [
    {
      "field": "brief_field_name",
      "description": "What information is missing",
      "category": "critical|important|optional",
      "prompt": "Specific question to ask the user"
    }
  ],
  "confidence": 0.95
}

Only identify truly missing information that would be required for a complete, compliant document.`
              },
              {
                role: 'user',
                content: `IMPORTANT: The company has EXTENSIVE data already configured. Do NOT mark these as missing:
${existingSettings.hasDocumentNumbering ? '- Document numbering system is CONFIGURED' : ''}
${existingSettings.hasRetentionPeriods ? '- Document retention periods are CONFIGURED' : ''}
${existingSettings.hasEdmSystem ? '- Electronic Document Management System is CONFIGURED' : ''}
${existingSettings.hasDepartmentStructure ? '- Department structure is CONFIGURED' : ''}
${existingSettings.hasApprovalWorkflow ? '- Approval workflow is CONFIGURED' : ''}
${existingSettings.hasPersonnel ? '- Personnel/user data is CONFIGURED' : ''}
${existingSettings.hasQAHead ? '- QA Head/management is CONFIGURED' : ''}
${existingSettings.hasCompanyInfo ? '- Company information is CONFIGURED' : ''}
${existingSettings.hasContactInfo ? '- Contact information is CONFIGURED' : ''}
${existingSettings.hasAddress ? '- Company address is CONFIGURED' : ''}
${existingSettings.hasProductStructure ? '- Product structure is CONFIGURED' : ''}
${existingSettings.hasPhases ? '- Lifecycle phases are CONFIGURED' : ''}
${existingSettings.hasTemplateSettings ? '- Template settings are CONFIGURED' : ''}
${existingSettings.hasAICapabilities ? '- AI capabilities are CONFIGURED' : ''}

ONLY identify information that is truly missing and not available anywhere in the system.
Do NOT include any of the above configured items in your missing data analysis.

Analyze this document template and identify what critical information is missing:

${templateContent.substring(0, 4000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Clean up the response to remove markdown code blocks
        const cleanedContent = data.choices[0].message.content.replace(/```json\s*|\s*```/g, '').trim();
        const aiResponse = JSON.parse(cleanedContent);
        console.log('AI Analysis Results (OpenAI):', aiResponse);
        return aiResponse;
      }

    } catch (error) {
      console.error('Error in AI missing data analysis:', error);
      return { missingData: [], confidence: 0 };
    }
  }

  static async analyzeCompanyData(companyId: string): Promise<MissingDataItem[]> {
    try {
      // Get company data to check what's already available
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error || !company) {
        return [];
      }

      const missingData: MissingDataItem[] = [];

      // Check for missing organizational data
      if (!company.contact_person) {
        missingData.push({
          field: 'head_of_qa',
          description: 'Head of Quality Assurance role and contact',
          category: 'critical',
          prompt: 'Who is your Head of Quality Assurance? Please provide their name, title, and contact information.'
        });
      }

      // Add more checks based on company data structure
      return missingData;

    } catch (error) {
      console.error('Error analyzing company data:', error);
      return [];
    }
  }
}