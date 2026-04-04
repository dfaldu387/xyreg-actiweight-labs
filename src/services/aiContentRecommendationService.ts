import { supabase } from '@/integrations/supabase/client';

export interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  sectionTitle: string;
  priority: 'critical' | 'important' | 'optional';
  recommendationType: 'gap_analysis' | 'missing_content' | 'bracket_suggestion' | 'regulatory_compliance';
  bracketSuggestion?: string; // e.g., "[MISSING: Risk acceptance criteria]"
  insertionPoint?: {
    afterText: string;
    beforeText: string;
    sectionName: string;
  };
  contentSnippet?: string; // 1-3 sentence addition
  sources?: string[];
  metadata?: {
    confidence: number;
    relevanceScore: number;
    regulatoryBasis?: string;
    gapType: 'missing_requirement' | 'incomplete_section' | 'missing_reference' | 'unclear_instruction';
  };
}

export class AIContentRecommendationService {
  /**
   * Generate intelligent content recommendations for a document template
   */
  static async generateContentRecommendations(
    templateContent: string,
    companyId: string
  ): Promise<ContentRecommendation[]> {
    try {
      console.log('[AIContentRecommendation] Generating recommendations for company:', companyId);

      // Get company API keys
      const { openaiKey } = await this.getCompanyApiKeys(companyId);
      if (!openaiKey) {
        console.log('[AIContentRecommendation] No OpenAI API key found');
        return this.generateStaticRecommendations(templateContent);
      }

      // Get company context for better recommendations
      const companyContext = await this.getCompanyContext(companyId);
      
      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(
        templateContent,
        companyContext,
        openaiKey
      );

      // Combine with regulatory and standard recommendations
      const staticRecommendations = this.generateStaticRecommendations(templateContent);
      
      return [...aiRecommendations, ...staticRecommendations];
    } catch (error) {
      console.error('[AIContentRecommendation] Error generating recommendations:', error);
      return this.generateStaticRecommendations(templateContent);
    }
  }

  /**
   * Generate AI-powered content recommendations using OpenAI
   */
  private static async generateAIRecommendations(
    templateContent: string,
    companyContext: any,
    openaiKey: string
  ): Promise<ContentRecommendation[]> {
    try {
      // Detect document context for better AI recommendations
      const documentType = this.detectDocumentType(templateContent.toLowerCase());
      const documentPurpose = this.extractDocumentPurpose(templateContent);
      
      const prompt = `You are a medical device regulatory expert conducting a GAP ANALYSIS. Analyze this document template and identify specific missing elements using bracket-style recommendations.

Document Content:
${templateContent.substring(0, 2000)}...

Document Context:
- Document Type: ${documentType}
- Document Purpose: ${documentPurpose || 'Not specified'}

Company Context:
- Company: ${companyContext.name || 'Not specified'}
- Country: ${companyContext.country || 'Not specified'}

TASK: Perform a gap analysis to identify specific missing or incomplete content. Provide recommendations as bracket-style suggestions that show exactly what's missing and where.

Please provide 3-5 gap analysis recommendations in this JSON format:
{
  "recommendations": [
    {
      "title": "Gap: Missing Risk Acceptance Criteria",
      "description": "Document lacks specific risk acceptance criteria required for Class II devices",
      "sectionTitle": "Risk Management",
      "priority": "critical|important|optional",
      "recommendationType": "gap_analysis",
      "bracketSuggestion": "[MISSING: Risk acceptance criteria for Class II devices per ISO 14971]",
      "insertionPoint": {
        "afterText": "Risk assessment methodology",
        "beforeText": "Risk control measures",
        "sectionName": "Risk Management"
      },
      "contentSnippet": "Risk acceptance criteria shall be defined based on device classification and applicable harmonized standards. Criteria must specify maximum tolerable risk levels.",
      "sources": ["ISO 14971", "ISO 13485"],
      "metadata": {
        "confidence": 0.9,
        "relevanceScore": 0.8,
        "regulatoryBasis": "ISO 14971 Section 7.4",
        "gapType": "missing_requirement"
      }
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Only identify ACTUAL gaps - don't suggest content that already exists
2. Use bracket format: [MISSING: specific requirement] or [ADD: specific element]
3. Provide exact insertion points with before/after context
4. Keep content snippets to 1-3 sentences maximum
5. Focus only on document-type-specific gaps
6. Don't suggest generic content that doesn't match the document purpose

Gap Types to Look For:
- missing_requirement: Required regulatory elements not present
- incomplete_section: Sections that exist but lack key details
- missing_reference: Missing regulatory citations or standards
- unclear_instruction: Vague procedures that need specific steps`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a medical device regulatory expert who provides actionable content recommendations.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Parse the JSON response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return parsedResponse.recommendations.map((rec: any, index: number) => ({
          id: `ai-gap-${Date.now()}-${index}`,
          title: rec.title,
          description: rec.description,
          sectionTitle: rec.sectionTitle,
          priority: rec.priority,
          recommendationType: rec.recommendationType,
          bracketSuggestion: rec.bracketSuggestion,
          insertionPoint: rec.insertionPoint,
          contentSnippet: rec.contentSnippet,
          sources: rec.sources || [],
          metadata: rec.metadata || { 
            confidence: 0.8, 
            relevanceScore: 0.8,
            gapType: 'missing_requirement'
          }
        }));
      } catch (parseError) {
        console.error('[AIContentRecommendation] Error parsing AI response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('[AIContentRecommendation] Error generating AI recommendations:', error);
      return [];
    }
  }

  /**
   * Generate static recommendations based on content analysis
   */
  private static generateStaticRecommendations(templateContent: string): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    const content = templateContent.toLowerCase();
    
    // Detect document type and purpose
    const documentType = this.detectDocumentType(content);
    const documentPurpose = this.extractDocumentPurpose(templateContent);

    // Check for missing risk management content
    if (!content.includes('risk management') && !content.includes('risk assessment')) {
      recommendations.push({
        id: 'gap-risk-management',
        title: 'Gap: Missing Risk Management Section',
        description: 'Document lacks required risk management procedures per ISO 14971',
        sectionTitle: 'Risk Management',
        priority: 'critical',
        recommendationType: 'gap_analysis',
        bracketSuggestion: '[MISSING: Risk management procedures per ISO 14971]',
        insertionPoint: {
          afterText: 'Purpose and Scope',
          beforeText: 'Responsibilities',
          sectionName: 'Risk Management'
        },
        contentSnippet: 'Risk management activities shall be planned, documented, and implemented throughout the device lifecycle per ISO 14971.',
        sources: ['ISO 14971', 'ISO 13485'],
        metadata: {
          confidence: 0.9,
          relevanceScore: 0.8,
          regulatoryBasis: 'ISO 14971 - Application of risk management to medical devices',
          gapType: 'missing_requirement'
        }
      });
    }

    // Check for missing training requirements
    if (!content.includes('training') && !content.includes('competency') && content.includes('procedure')) {
      recommendations.push({
        id: 'gap-training',
        title: 'Gap: Missing Training Requirements',
        description: 'Procedure lacks required personnel competency requirements',
        sectionTitle: 'Training and Competency',
        priority: 'important',
        recommendationType: 'gap_analysis',
        bracketSuggestion: '[ADD: Personnel training and competency requirements]',
        insertionPoint: {
          afterText: 'Responsibilities',
          beforeText: 'Procedure Steps',
          sectionName: 'Training and Competency'
        },
        contentSnippet: 'Personnel performing this procedure shall be trained and demonstrate competency before performing unsupervised work.',
        sources: ['ISO 13485'],
        metadata: {
          confidence: 0.8,
          relevanceScore: 0.7,
          regulatoryBasis: 'ISO 13485 Section 6.2 - Human resources',
          gapType: 'missing_requirement'
        }
      });
    }

    // Check for missing document control information
    if (!content.includes('document control') && !content.includes('version control')) {
      recommendations.push({
        id: 'gap-document-control',
        title: 'Gap: Missing Document Control Information',
        description: 'Document lacks required version control and change management procedures',
        sectionTitle: 'Document Control',
        priority: 'critical',
        recommendationType: 'gap_analysis',
        bracketSuggestion: '[MISSING: Document control procedures per ISO 13485 Section 4.2.3]',
        insertionPoint: {
          afterText: 'Document Information',
          beforeText: 'Purpose',
          sectionName: 'Document Control'
        },
        contentSnippet: 'This document is controlled per the Document Control SOP. Changes require approval and distribution tracking.',
        sources: ['ISO 13485'],
        metadata: {
          confidence: 0.9,
          relevanceScore: 0.9,
          regulatoryBasis: 'ISO 13485 Section 4.2.3 - Control of documents',
          gapType: 'missing_requirement'
        }
      });
    }

    // Check for missing corrective and preventive actions (CAPA) - only for relevant document types
    if (this.shouldSuggestCapa(documentType, documentPurpose, content)) {
      recommendations.push({
        id: 'gap-capa',
        title: 'Gap: Missing CAPA Procedures',
        description: 'Procedure lacks corrective and preventive action requirements for quality management',
        sectionTitle: 'Corrective and Preventive Actions',
        priority: 'important',
        recommendationType: 'gap_analysis',
        bracketSuggestion: '[ADD: CAPA procedures per ISO 13485 Section 8.5]',
        insertionPoint: {
          afterText: 'Quality Requirements',
          beforeText: 'Records Management',
          sectionName: 'Quality Management'
        },
        contentSnippet: 'Non-conformities shall be investigated and addressed through corrective and preventive actions as defined in the CAPA SOP.',
        sources: ['ISO 13485'],
        metadata: {
          confidence: 0.8,
          relevanceScore: 0.8,
          regulatoryBasis: 'ISO 13485 Section 8.5.2 & 8.5.3 - Corrective and preventive actions',
          gapType: 'missing_requirement'
        }
      });
    }

    // Check for missing monitoring and measurement
    if (!content.includes('monitoring') && !content.includes('measurement') && !content.includes('metrics')) {
      recommendations.push({
        id: 'gap-monitoring',
        title: 'Gap: Missing Process Monitoring',
        description: 'Procedure lacks monitoring and measurement requirements for process effectiveness',
        sectionTitle: 'Monitoring and Measurement',
        priority: 'optional',
        recommendationType: 'gap_analysis',
        bracketSuggestion: '[ADD: Process monitoring and measurement criteria]',
        insertionPoint: {
          afterText: 'Procedure Steps',
          beforeText: 'Records',
          sectionName: 'Process Controls'
        },
        contentSnippet: 'Process effectiveness shall be monitored through defined metrics and reviewed periodically.',
        sources: ['ISO 13485'],
        metadata: {
          confidence: 0.7,
          relevanceScore: 0.6,
          regulatoryBasis: 'ISO 13485 Section 8.2 - Monitoring and measurement',
          gapType: 'incomplete_section'
        }
      });
    }

    // Add document type-specific recommendations
    const typeSpecificRecommendations = this.generateDocumentTypeSpecificRecommendations(documentType, content);
    recommendations.push(...typeSpecificRecommendations);

    return recommendations;
  }

  /**
   * Detect the type of document based on title and content
   */
  private static detectDocumentType(content: string): string {
    const title = content.split('\n')[0] || '';
    
    // Document control related
    if (title.includes('document control') || content.includes('document control procedures')) {
      return 'document_control';
    }
    
    // Design control
    if (title.includes('design control') || content.includes('design control') || content.includes('design verification')) {
      return 'design_control';
    }
    
    // Purchasing control
    if (title.includes('purchasing') || title.includes('supplier') || content.includes('purchasing control')) {
      return 'purchasing_control';
    }
    
    // Training procedures
    if (title.includes('training') || content.includes('training procedure') || content.includes('competency')) {
      return 'training';
    }
    
    // Quality procedures (where CAPA is relevant)
    if (title.includes('quality') || title.includes('non-conformity') || title.includes('complaint') || 
        content.includes('quality procedure') || content.includes('non-conformity management')) {
      return 'quality_procedure';
    }
    
    // Manufacturing procedures
    if (title.includes('manufacturing') || title.includes('production') || content.includes('manufacturing procedure')) {
      return 'manufacturing';
    }
    
    // Risk management
    if (title.includes('risk') || content.includes('risk management') || content.includes('risk assessment')) {
      return 'risk_management';
    }
    
    return 'general';
  }

  /**
   * Extract document purpose from content
   */
  private static extractDocumentPurpose(content: string): string {
    const lines = content.split('\n');
    let purposeText = '';
    
    // Look for purpose/scope section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('purpose') || line.includes('scope') || line.includes('objective')) {
        // Extract the next few lines as purpose
        const purposeLines = lines.slice(i, i + 5).join(' ').toLowerCase();
        purposeText = purposeLines;
        break;
      }
    }
    
    return purposeText;
  }

  /**
   * Determine if CAPA suggestions should be made based on document type and purpose
   */
  private static shouldSuggestCapa(documentType: string, documentPurpose: string, content: string): boolean {
    // Never suggest CAPA for administrative/control documents
    const excludeTypes = ['document_control', 'purchasing_control', 'training', 'design_control'];
    if (excludeTypes.includes(documentType)) {
      return false;
    }
    
    // Only suggest CAPA if content doesn't already have it
    if (content.includes('corrective action') || content.includes('capa')) {
      return false;
    }
    
    // Suggest CAPA for quality-related procedures
    const capaRelevantTypes = ['quality_procedure', 'manufacturing'];
    if (capaRelevantTypes.includes(documentType)) {
      return true;
    }
    
    // Check purpose for CAPA relevance
    const capaRelevantPurpose = documentPurpose.includes('non-conformity') || 
                               documentPurpose.includes('complaint') || 
                               documentPurpose.includes('quality') ||
                               documentPurpose.includes('improvement');
    
    return capaRelevantPurpose;
  }

  /**
   * Generate document type-specific recommendations
   */
  private static generateDocumentTypeSpecificRecommendations(documentType: string, content: string): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    switch (documentType) {
      case 'document_control':
        if (!content.includes('version control')) {
          recommendations.push({
            id: 'gap-doc-control-versioning',
            title: 'Gap: Missing Version Control Procedures',
            description: 'Document control procedure lacks detailed version control and approval workflow',
            sectionTitle: 'Version Control',
            priority: 'critical',
            recommendationType: 'gap_analysis',
            bracketSuggestion: '[MISSING: Version control procedures and approval workflow]',
            insertionPoint: {
              afterText: 'Document Types',
              beforeText: 'Distribution',
              sectionName: 'Document Control'
            },
            contentSnippet: 'All controlled documents shall follow version numbering, approval workflow, and change authorization procedures.',
            sources: ['ISO 13485'],
            metadata: {
              confidence: 0.9,
              relevanceScore: 0.9,
              regulatoryBasis: 'ISO 13485 Section 4.2.3 - Control of documents',
              gapType: 'missing_requirement'
            }
          });
        }
        break;
        
      case 'purchasing_control':
        if (!content.includes('supplier evaluation')) {
          recommendations.push({
            id: 'gap-purchasing-supplier-eval',
            title: 'Gap: Missing Supplier Evaluation Criteria',
            description: 'Purchasing procedure lacks supplier qualification and evaluation requirements',
            sectionTitle: 'Supplier Evaluation',
            priority: 'important',
            recommendationType: 'gap_analysis',
            bracketSuggestion: '[MISSING: Supplier qualification and evaluation criteria]',
            insertionPoint: {
              afterText: 'Supplier Selection',
              beforeText: 'Purchase Orders',
              sectionName: 'Supplier Management'
            },
            contentSnippet: 'Suppliers shall be qualified based on their ability to provide products meeting requirements and evaluated periodically.',
            sources: ['ISO 13485'],
            metadata: {
              confidence: 0.8,
              relevanceScore: 0.8,
              regulatoryBasis: 'ISO 13485 Section 7.4 - Purchasing',
              gapType: 'missing_requirement'
            }
          });
        }
        break;
        
      case 'design_control':
        if (!content.includes('design verification')) {
          recommendations.push({
            id: 'gap-design-verification',
            title: 'Gap: Missing Design Verification Procedures',
            description: 'Design control procedure lacks verification and validation requirements',
            sectionTitle: 'Design Verification and Validation',
            priority: 'critical',
            recommendationType: 'gap_analysis',
            bracketSuggestion: '[MISSING: Design verification and validation procedures]',
            insertionPoint: {
              afterText: 'Design Outputs',
              beforeText: 'Design Transfer',
              sectionName: 'Design Controls'
            },
            contentSnippet: 'Design verification and validation shall be planned, documented, and performed to ensure design outputs meet requirements.',
            sources: ['ISO 13485', '21 CFR 820.30'],
            metadata: {
              confidence: 0.9,
              relevanceScore: 0.9,
              regulatoryBasis: 'ISO 13485 Section 7.3 - Design and development',
              gapType: 'missing_requirement'
            }
          });
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Get company context for better recommendations
   */
  private static async getCompanyContext(companyId: string): Promise<any> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('name, country, industry')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return company || {};
    } catch (error) {
      console.error('[AIContentRecommendation] Error fetching company context:', error);
      return {};
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
        console.log('[AIContentRecommendation] No OpenAI API key found');
        return {};
      }

      // Simple decrypt (matches the encryption in other services)
      const encryptedKey = data[0].encrypted_key;
      const openaiKey = this.decryptApiKey(encryptedKey);
      
      return { openaiKey };
    } catch (error) {
      console.error('[AIContentRecommendation] Error fetching API keys:', error);
      return {};
    }
  }

  /**
   * Simple decryption utility
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
      console.error('[AIContentRecommendation] Error decrypting API key:', error);
      return encryptedKey;
    }
  }

  /**
   * Generate content for a specific recommendation
   */
  static async generateContentForRecommendation(
    recommendation: ContentRecommendation,
    companyContext: any,
    companyId: string
  ): Promise<string> {
    try {
      const { openaiKey } = await this.getCompanyApiKeys(companyId);
      if (!openaiKey) {
        return this.generateStaticContent(recommendation);
      }

      // Create a detailed, specific prompt based on the recommendation type
      const prompt = this.createDetailedPrompt(recommendation, companyContext);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a senior medical device regulatory expert with 20+ years of experience in ISO 13485, MDR, FDA QSR, and medical device documentation. Write professional, specific, actionable content that companies can immediately implement.' 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.3 // Lower temperature for more consistent, professional content
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;
      
      if (!generatedContent || generatedContent.trim().length < 50) {
        return this.generateStaticContent(recommendation);
      }
      
      return generatedContent;
    } catch (error) {
      console.error('[AIContentRecommendation] Error generating content:', error);
      return this.generateStaticContent(recommendation);
    }
  }

  /**
   * Create detailed, specific prompts based on recommendation type and content
   */
  private static createDetailedPrompt(recommendation: ContentRecommendation, companyContext: any): string {
    const baseContext = `
Company: ${companyContext.name || 'Medical Device Company'}
Country: ${companyContext.country || 'Not specified'}
Section: ${recommendation.sectionTitle}
Regulatory Basis: ${recommendation.metadata?.regulatoryBasis || 'ISO 13485'}`;

    switch (recommendation.sectionTitle.toLowerCase()) {
      case 'risk management':
        return `${baseContext}

Generate comprehensive Risk Management content for a medical device company. Include:

1. **Risk Management Policy**: Clear statement of commitment to risk management throughout product lifecycle
2. **Risk Management Process**: Step-by-step process including:
   - Risk analysis methodology (FMEA, FTA, etc.)
   - Risk evaluation criteria and acceptability levels
   - Risk control measures (inherent safety, protective measures, information for safety)
   - Residual risk evaluation
   - Risk/benefit analysis
3. **Roles and Responsibilities**: Define who is responsible for risk management activities
4. **Documentation Requirements**: What risk management documents must be maintained
5. **Review and Update Process**: How and when risk management files are reviewed

Requirements:
- Must comply with ISO 14971:2019
- Include specific methodologies (not just generic statements)
- Provide actionable procedures that staff can follow
- Include examples of risk criteria and evaluation matrices
- 400-600 words of professional, implementation-ready content`;

      case 'training and competency':
        return `${baseContext}

Generate comprehensive Training and Competency content for a medical device company. Include:

1. **Training Policy**: Statement on importance of competent personnel
2. **Competency Requirements**: Define competency criteria for different roles
3. **Training Program Structure**: 
   - Initial training for new employees
   - Ongoing training requirements
   - Specialized training for specific processes/products
   - Regulatory training (ISO 13485, MDR, etc.)
4. **Training Delivery Methods**: Classroom, online, on-the-job training
5. **Competency Assessment**: How competency is evaluated and documented
6. **Training Records**: What records must be maintained and for how long
7. **Training Effectiveness**: How training effectiveness is measured

Requirements:
- Must comply with ISO 13485 Section 6.2
- Include specific assessment methods
- Provide practical implementation guidance
- Include training matrix examples
- 400-600 words of professional, actionable content`;

      case 'document control':
        return `${baseContext}

Generate comprehensive Document Control content for a medical device company. Include:

1. **Document Hierarchy**: Define levels of documents (policies, procedures, work instructions, forms)
2. **Document Identification**: Numbering system and unique identification
3. **Document Creation Process**: How documents are created, reviewed, and approved
4. **Version Control**: Version numbering, change tracking, and obsolete document control
5. **Distribution and Access**: How documents are distributed and access controlled
6. **Document Review Cycle**: Periodic review requirements and responsibilities
7. **Change Control Process**: How document changes are managed and approved
8. **External Documents**: Control of external standards, regulations, and supplier documents

Requirements:
- Must comply with ISO 13485 Section 4.2.3
- Include specific procedures and forms
- Provide clear workflow examples
- Include document templates and checklists
- 400-600 words of professional, implementation-ready content`;

      default:
        return `${baseContext}

You are writing content for: ${recommendation.title}
Description: ${recommendation.description}

Generate professional, specific content for this section that includes:

1. **Purpose and Scope**: Clear statement of what this section covers
2. **Responsibilities**: Who is responsible for implementing these procedures
3. **Detailed Procedures**: Step-by-step processes that staff can follow
4. **Documentation Requirements**: What records must be maintained
5. **Compliance Requirements**: Specific regulatory requirements that must be met
6. **Implementation Guidelines**: Practical guidance for implementation

Requirements:
- Must be specific to medical device industry
- Include actionable procedures (not generic statements)
- Comply with relevant ISO 13485 requirements
- Provide practical implementation guidance
- 300-500 words of professional content
- Use specific medical device terminology
- Include measurable criteria where applicable

Focus on providing content that a medical device company can immediately implement, not generic guidance.`;
    }
  }

  /**
   * Generate specific, useful static content for recommendations when AI is not available
   */
  private static generateStaticContent(recommendation: ContentRecommendation): string {
    const sectionTitle = recommendation.sectionTitle.toLowerCase();
    
    // Generate specific content based on section type
    if (sectionTitle.includes('risk management')) {
      return `## Risk Management Procedures

**1. Risk Management Policy**
This organization is committed to implementing systematic risk management throughout the medical device lifecycle in accordance with ISO 14971. All personnel involved in device development, manufacturing, and post-market activities must follow established risk management procedures.

**2. Risk Analysis Process**
- Conduct systematic risk analysis using appropriate methodologies (FMEA, FTA, Hazard Analysis)
- Identify potential hazards associated with the medical device under normal and fault conditions
- Estimate risks using defined risk criteria including severity and probability
- Evaluate risk acceptability against predetermined criteria

**3. Risk Control Measures**
- Implement risk control measures in order of priority: inherent safety by design, protective measures, information for safety
- Verify effectiveness of risk control measures
- Assess residual risks and ensure they remain acceptable
- Conduct risk/benefit analysis for residual risks

**4. Documentation and Review**
- Maintain comprehensive risk management file throughout device lifecycle
- Review and update risk analysis based on post-market surveillance data
- Ensure traceability between risk analysis and design controls`;
    }
    
    if (sectionTitle.includes('training') || sectionTitle.includes('competency')) {
      return `## Training and Competency Management

**1. Training Policy**
All personnel performing work affecting product quality must be competent based on appropriate education, training, skills, and experience. Training programs are established to ensure personnel understand their role in achieving product quality and regulatory compliance.

**2. Competency Requirements**
- Define competency criteria for each role affecting product quality
- Establish minimum education, experience, and skill requirements
- Document competency assessments for all relevant personnel
- Implement training programs to address competency gaps

**3. Training Program Elements**
- Initial orientation training for new employees
- Job-specific training for assigned responsibilities
- Regulatory training (ISO 13485, MDR, FDA requirements)
- Continuous education and professional development
- Training on updated procedures and regulatory changes

**4. Training Records and Effectiveness**
- Maintain training records including dates, content, instructors, and assessment results
- Evaluate training effectiveness through competency assessments and performance monitoring
- Review and update training programs based on effectiveness evaluations and regulatory changes`;
    }
    
    if (sectionTitle.includes('document control')) {
      return `## Document Control Procedures

**1. Document Hierarchy and Identification**
- Level 1: Quality Manual and Policies
- Level 2: Procedures and Standard Operating Procedures (SOPs)
- Level 3: Work Instructions and Forms
- Level 4: Records and External Documents
Each document type follows standardized numbering and identification systems.

**2. Document Creation and Approval**
- Documents created using approved templates
- Technical review by subject matter experts
- Management review and approval before release
- Distribution control through designated document controllers

**3. Version Control and Change Management**
- Unique version numbers for each document revision
- Change history maintained in document revision logs
- Obsolete documents removed from use and archived
- Master list maintained showing current document status

**4. Access and Distribution**
- Controlled distribution ensures current versions are available at points of use
- Electronic document management system provides controlled access
- External documents (standards, regulations) controlled and current versions maintained`;
    }
    
    // Default content for other sections
    return `## ${recommendation.sectionTitle}

**Purpose and Scope**
This section establishes procedures for ${recommendation.sectionTitle.toLowerCase()} in accordance with ${recommendation.sources?.join(', ') || 'ISO 13485 and applicable regulatory requirements'}. These procedures ensure consistent implementation and regulatory compliance.

**Responsibilities**
- Management: Provide resources and support for implementation
- Quality Assurance: Monitor compliance and effectiveness
- All Personnel: Follow established procedures and maintain required records

**Key Requirements**
- Implement systematic approaches to ${recommendation.sectionTitle.toLowerCase()}
- Maintain appropriate documentation and records
- Conduct regular reviews and improvements
- Ensure regulatory compliance and continuous improvement

**Documentation and Records**
- Procedures must be documented and controlled
- Training records maintained for all involved personnel
- Regular audits conducted to ensure effectiveness
- Corrective actions implemented when non-conformities identified

This framework provides the foundation for effective ${recommendation.sectionTitle.toLowerCase()} within the quality management system.`;
  }
}