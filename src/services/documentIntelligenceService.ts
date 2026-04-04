import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentIntelligence {
  contentAnalysis: {
    duplicateContentGroups: Array<{
      contentHash: string;
      documents: any[];
      similarityScore: number;
    }>;
    missingDocuments: Array<{
      documentName: string;
      suggestedPhases: string[];
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>;
    contentQualityIssues: Array<{
      documentId: string;
      documentName: string;
      issues: string[];
      severity: 'critical' | 'warning' | 'info';
    }>;
  };
  workflowOptimization: {
    phaseSequenceIssues: Array<{
      documentName: string;
      currentPhases: string[];
      recommendedSequence: string[];
      reason: string;
    }>;
    bottleneckAnalysis: Array<{
      phaseName: string;
      documentCount: number;
      completionRate: number;
      avgTimeInPhase: number;
      suggestions: string[];
    }>;
    dependencyMapping: Array<{
      document: string;
      dependencies: string[];
      dependents: string[];
      criticalPath: boolean;
    }>;
  };
  complianceIntelligence: {
    regulatoryGaps: Array<{
      regulation: string;
      missingDocuments: string[];
      priority: 'critical' | 'high' | 'medium';
      marketImpact: string[];
    }>;
    complianceScore: number;
    deviceClassRequirements: Array<{
      deviceClass: string;
      requiredDocuments: string[];
      currentDocuments: string[];
      gaps: string[];
    }>;
  };
  recommendations: Array<{
    type: 'content' | 'workflow' | 'compliance';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    actionItems: string[];
  }>;
}

export interface IntelligenceOptimizationPlan {
  contentOptimizations: Array<{
    action: 'merge_content' | 'split_document' | 'improve_quality';
    documentIds: string[];
    newDocumentName?: string;
    improvementSuggestions?: string[];
  }>;
  workflowOptimizations: Array<{
    action: 'resequence_phases' | 'parallel_processing' | 'remove_bottleneck';
    documentName: string;
    currentPhases: string[];
    optimizedPhases: string[];
    reasoning: string;
  }>;
  complianceOptimizations: Array<{
    action: 'add_required_document' | 'update_scope' | 'regulatory_alignment';
    documentName: string;
    regulation: string;
    priority: 'critical' | 'high' | 'medium';
  }>;
}

export class DocumentIntelligenceService {
  
  /**
   * Phase 4: Comprehensive document intelligence analysis
   */
  static async analyzeDocumentIntelligence(companyId: string): Promise<DocumentIntelligence> {
    console.log('[DocumentIntelligence] Starting Phase 4 analysis for company:', companyId);
    
    try {
      // Get all company documents and phases
      const { data: documents, error: docsError } = await supabase
        .from('phase_assigned_documents')
        .select(`
          *,
          phases!phase_assigned_documents_phase_id_fkey(id, name, company_id, phase_order)
        `)
        .eq('phases.company_id', companyId);

      if (docsError) throw docsError;

      const { data: phases, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) throw phasesError;

      // Content Analysis
      const contentAnalysis = await this.analyzeDocumentContent(documents || []);
      
      // Workflow Optimization
      const workflowOptimization = await this.analyzeWorkflowOptimization(documents || [], phases || []);
      
      // Compliance Intelligence
      const complianceIntelligence = await this.analyzeComplianceIntelligence(documents || [], companyId);
      
      // Generate recommendations
      const recommendations = this.generateIntelligentRecommendations(
        contentAnalysis,
        workflowOptimization,
        complianceIntelligence
      );

      return {
        contentAnalysis,
        workflowOptimization,
        complianceIntelligence,
        recommendations
      };

    } catch (error) {
      console.error('[DocumentIntelligence] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Content Analysis: Detect duplicate content, missing docs, quality issues
   */
  private static async analyzeDocumentContent(documents: any[]): Promise<DocumentIntelligence['contentAnalysis']> {
    // Group documents by content similarity (simplified heuristic)
    const contentGroups = new Map<string, any[]>();
    
    documents.forEach(doc => {
      // Create a simple content hash based on name similarity
      const normalizedName = doc.name.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const contentHash = normalizedName.slice(0, 20); // Simple similarity grouping
      
      if (!contentGroups.has(contentHash)) {
        contentGroups.set(contentHash, []);
      }
      contentGroups.get(contentHash)!.push(doc);
    });

    const duplicateContentGroups = Array.from(contentGroups.entries())
      .filter(([_, docs]) => docs.length > 1)
      .map(([contentHash, docs]) => ({
        contentHash,
        documents: docs,
        similarityScore: this.calculateSimilarityScore(docs)
      }));

    // Identify missing critical documents
    const missingDocuments = this.identifyMissingCriticalDocuments(documents);
    
    // Analyze content quality
    const contentQualityIssues = this.analyzeContentQuality(documents);

    return {
      duplicateContentGroups,
      missingDocuments,
      contentQualityIssues
    };
  }

  /**
   * Workflow Optimization: Phase sequencing, bottlenecks, dependencies
   */
  private static async analyzeWorkflowOptimization(
    documents: any[], 
    phases: any[]
  ): Promise<DocumentIntelligence['workflowOptimization']> {
    
    // Analyze phase sequence issues
    const phaseSequenceIssues = this.analyzePhaseSequencing(documents, phases);
    
    // Bottleneck analysis
    const bottleneckAnalysis = this.analyzeBottlenecks(documents, phases);
    
    // Dependency mapping
    const dependencyMapping = this.mapDocumentDependencies(documents);

    return {
      phaseSequenceIssues,
      bottleneckAnalysis,
      dependencyMapping
    };
  }

  /**
   * Compliance Intelligence: Regulatory gaps, compliance scoring
   */
  private static async analyzeComplianceIntelligence(
    documents: any[], 
    companyId: string
  ): Promise<DocumentIntelligence['complianceIntelligence']> {
    
    // Get company products for device classification
    const { data: products } = await supabase
      .from('products')
      .select('device_class, target_markets')
      .eq('company_id', companyId);

    const regulatoryGaps = this.identifyRegulatoryGaps(documents, products || []);
    const complianceScore = this.calculateComplianceScore(documents, products || []);
    const deviceClassRequirements = this.analyzeDeviceClassRequirements(documents, products || []);

    return {
      regulatoryGaps,
      complianceScore,
      deviceClassRequirements
    };
  }

  /**
   * Generate intelligent recommendations based on all analyses
   */
  private static generateIntelligentRecommendations(
    contentAnalysis: DocumentIntelligence['contentAnalysis'],
    workflowOptimization: DocumentIntelligence['workflowOptimization'],
    complianceIntelligence: DocumentIntelligence['complianceIntelligence']
  ): DocumentIntelligence['recommendations'] {
    const recommendations: DocumentIntelligence['recommendations'] = [];

    // Content recommendations
    if (contentAnalysis.duplicateContentGroups.length > 0) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Merge Duplicate Content',
        description: `${contentAnalysis.duplicateContentGroups.length} groups of documents with similar content detected`,
        impact: 'Reduces redundancy and improves document discoverability',
        actionItems: [
          'Review duplicate content groups',
          'Merge similar documents where appropriate',
          'Standardize document naming conventions'
        ]
      });
    }

    // Workflow recommendations
    if (workflowOptimization.bottleneckAnalysis.length > 0) {
      const bottlenecks = workflowOptimization.bottleneckAnalysis.filter(b => b.completionRate < 50);
      if (bottlenecks.length > 0) {
        recommendations.push({
          type: 'workflow',
          priority: 'critical',
          title: 'Resolve Workflow Bottlenecks',
          description: `${bottlenecks.length} phases showing poor completion rates`,
          impact: 'Improves project velocity and reduces delays',
          actionItems: [
            'Redistribute documents from bottleneck phases',
            'Implement parallel processing where possible',
            'Review phase dependencies and sequencing'
          ]
        });
      }
    }

    // Compliance recommendations
    if (complianceIntelligence.complianceScore < 80) {
      recommendations.push({
        type: 'compliance',
        priority: 'critical',
        title: 'Improve Regulatory Compliance',
        description: `Compliance score of ${complianceIntelligence.complianceScore}% indicates gaps`,
        impact: 'Ensures regulatory approval and market access',
        actionItems: [
          'Address critical regulatory gaps',
          'Add missing required documents',
          'Review device classification requirements'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate optimization plan for Phase 4 improvements
   */
  static async generateOptimizationPlan(
    companyId: string, 
    intelligence: DocumentIntelligence
  ): Promise<IntelligenceOptimizationPlan> {
    
    const plan: IntelligenceOptimizationPlan = {
      contentOptimizations: [],
      workflowOptimizations: [],
      complianceOptimizations: []
    };

    // Content optimizations
    intelligence.contentAnalysis.duplicateContentGroups.forEach(group => {
      if (group.similarityScore > 0.8) {
        plan.contentOptimizations.push({
          action: 'merge_content',
          documentIds: group.documents.map(d => d.id),
          newDocumentName: this.suggestMergedDocumentName(group.documents)
        });
      }
    });

    // Workflow optimizations
    intelligence.workflowOptimization.phaseSequenceIssues.forEach(issue => {
      plan.workflowOptimizations.push({
        action: 'resequence_phases',
        documentName: issue.documentName,
        currentPhases: issue.currentPhases,
        optimizedPhases: issue.recommendedSequence,
        reasoning: issue.reason
      });
    });

    // Compliance optimizations
    intelligence.complianceIntelligence.regulatoryGaps.forEach(gap => {
      gap.missingDocuments.forEach(docName => {
        plan.complianceOptimizations.push({
          action: 'add_required_document',
          documentName: docName,
          regulation: gap.regulation,
          priority: gap.priority
        });
      });
    });

    return plan;
  }

  /**
   * Execute Phase 4 optimizations
   */
  static async executeIntelligenceOptimizations(
    companyId: string, 
    plan: IntelligenceOptimizationPlan
  ): Promise<{
    success: boolean;
    results: {
      contentOptimized: number;
      workflowOptimized: number;
      complianceImproved: number;
    };
    errors: string[];
  }> {
    
    const results = {
      contentOptimized: 0,
      workflowOptimized: 0,
      complianceImproved: 0
    };
    const errors: string[] = [];

    try {
      // Execute content optimizations
      for (const optimization of plan.contentOptimizations) {
        try {
          if (optimization.action === 'merge_content') {
            await this.mergeDocumentContent(optimization.documentIds, optimization.newDocumentName!);
            results.contentOptimized++;
          }
        } catch (error) {
          errors.push(`Content optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute workflow optimizations
      for (const optimization of plan.workflowOptimizations) {
        try {
          await this.optimizeDocumentWorkflow(
            companyId,
            optimization.documentName,
            optimization.optimizedPhases
          );
          results.workflowOptimized++;
        } catch (error) {
          errors.push(`Workflow optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute compliance optimizations
      for (const optimization of plan.complianceOptimizations) {
        try {
          await this.addComplianceDocument(
            companyId,
            optimization.documentName,
            optimization.regulation
          );
          results.complianceImproved++;
        } catch (error) {
          errors.push(`Compliance optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const success = errors.length === 0;
      
      if (success) {
        toast.success(`Phase 4 optimization completed: ${results.contentOptimized} content, ${results.workflowOptimized} workflow, ${results.complianceImproved} compliance improvements`);
      } else {
        toast.error(`Phase 4 optimization completed with ${errors.length} errors`);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('[DocumentIntelligence] Optimization execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        results,
        errors: [errorMessage]
      };
    }
  }

  // Helper methods for analysis
  private static calculateSimilarityScore(documents: any[]): number {
    // Simple similarity calculation based on name overlap
    if (documents.length < 2) return 0;
    
    const names = documents.map(d => d.name.toLowerCase());
    const avgLength = names.reduce((sum, name) => sum + name.length, 0) / names.length;
    
    // Calculate similarity based on common characters
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const similarity = this.stringSimilarity(names[i], names[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static identifyMissingCriticalDocuments(documents: any[]): DocumentIntelligence['contentAnalysis']['missingDocuments'] {
    const criticalDocuments = [
      'Design History File',
      'Risk Management File',
      'Clinical Evaluation Report',
      'Post-Market Surveillance Plan',
      'Declaration of Conformity',
      'Technical Documentation',
      'Quality Management System'
    ];

    const existingDocNames = new Set(documents.map(d => d.name.toLowerCase()));
    const missing: DocumentIntelligence['contentAnalysis']['missingDocuments'] = [];

    criticalDocuments.forEach(docName => {
      if (!existingDocNames.has(docName.toLowerCase())) {
        missing.push({
          documentName: docName,
          suggestedPhases: this.suggestPhasesForDocument(docName),
          priority: this.getDocumentPriority(docName),
          reason: `Critical regulatory document required for compliance`
        });
      }
    });

    return missing;
  }

  private static analyzeContentQuality(documents: any[]): DocumentIntelligence['contentAnalysis']['contentQualityIssues'] {
    return documents
      .filter(doc => {
        const issues = [];
        
        // Check for naming issues
        if (doc.name.length < 5) issues.push('Document name too short');
        if (doc.name.includes('test') || doc.name.includes('temp')) issues.push('Appears to be temporary/test document');
        if (!doc.document_type) issues.push('Missing document type classification');
        if (!doc.status || doc.status === 'Not Started') issues.push('Document status not updated');
        
        return issues.length > 0;
      })
      .map(doc => ({
        documentId: doc.id,
        documentName: doc.name,
        issues: this.getDocumentQualityIssues(doc),
        severity: this.getIssueSeverity(doc) as 'critical' | 'warning' | 'info'
      }));
  }

  private static analyzePhaseSequencing(documents: any[], phases: any[]): DocumentIntelligence['workflowOptimization']['phaseSequenceIssues'] {
    // Group documents by name to analyze their phase assignments
    const documentGroups = new Map<string, any[]>();
    
    documents.forEach(doc => {
      const key = doc.name.toLowerCase().trim();
      if (!documentGroups.has(key)) {
        documentGroups.set(key, []);
      }
      documentGroups.get(key)!.push(doc);
    });

    const issues: DocumentIntelligence['workflowOptimization']['phaseSequenceIssues'] = [];

    documentGroups.forEach((docs, docName) => {
      if (docs.length > 1) {
        const currentPhases = docs.map(d => d.phases?.name).filter(Boolean);
        const recommendedSequence = this.getRecommendedPhaseSequence(docName, phases);
        
        if (this.hasSequenceIssues(currentPhases, recommendedSequence)) {
          issues.push({
            documentName: docName,
            currentPhases,
            recommendedSequence,
            reason: 'Phase sequence does not follow logical progression'
          });
        }
      }
    });

    return issues;
  }

  private static analyzeBottlenecks(documents: any[], phases: any[]): DocumentIntelligence['workflowOptimization']['bottleneckAnalysis'] {
    const phaseStats = new Map<string, { count: number; completed: number; total: number }>();

    // Initialize phase stats
    phases.forEach(phase => {
      phaseStats.set(phase.name, { count: 0, completed: 0, total: 0 });
    });

    // Count documents per phase
    documents.forEach(doc => {
      const phaseName = doc.phases?.name;
      if (phaseName && phaseStats.has(phaseName)) {
        const stats = phaseStats.get(phaseName)!;
        stats.count++;
        stats.total++;
        if (doc.status === 'Completed' || doc.status === 'Approved') {
          stats.completed++;
        }
      }
    });

    return Array.from(phaseStats.entries()).map(([phaseName, stats]) => ({
      phaseName,
      documentCount: stats.count,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      avgTimeInPhase: 0, // Would need timestamp data for actual calculation
      suggestions: this.generateBottleneckSuggestions(stats)
    }));
  }

  private static mapDocumentDependencies(documents: any[]): DocumentIntelligence['workflowOptimization']['dependencyMapping'] {
    // Simple dependency mapping based on document types and naming patterns
    return documents.slice(0, 10).map(doc => ({
      document: doc.name,
      dependencies: this.identifyDocumentDependencies(doc),
      dependents: this.identifyDocumentDependents(doc, documents),
      criticalPath: this.isOnCriticalPath(doc)
    }));
  }

  private static identifyRegulatoryGaps(documents: any[], products: any[]): DocumentIntelligence['complianceIntelligence']['regulatoryGaps'] {
    const gaps: DocumentIntelligence['complianceIntelligence']['regulatoryGaps'] = [];
    
    // Example regulatory requirements
    const regulations = [
      {
        name: 'ISO 13485',
        requiredDocs: ['Quality Manual', 'Document Control Procedure', 'Management Review'],
        priority: 'critical' as const
      },
      {
        name: 'ISO 14971',
        requiredDocs: ['Risk Management Plan', 'Risk Analysis', 'Risk Control Measures'],
        priority: 'high' as const
      },
      {
        name: 'IEC 62304',
        requiredDocs: ['Software Lifecycle Process', 'Software Requirements', 'Software Architecture'],
        priority: 'medium' as const
      }
    ];

    const existingDocNames = new Set(documents.map(d => d.name.toLowerCase()));

    regulations.forEach(regulation => {
      const missingDocs = regulation.requiredDocs.filter(doc => 
        !existingDocNames.has(doc.toLowerCase())
      );

      if (missingDocs.length > 0) {
        gaps.push({
          regulation: regulation.name,
          missingDocuments: missingDocs,
          priority: regulation.priority,
          marketImpact: products.map(p => p.target_markets || []).flat()
        });
      }
    });

    return gaps;
  }

  private static calculateComplianceScore(documents: any[], products: any[]): number {
    const totalRequiredDocs = 15; // Simplified calculation
    const existingCriticalDocs = documents.filter(doc => 
      this.isCriticalComplianceDocument(doc.name)
    ).length;
    
    return Math.min(100, (existingCriticalDocs / totalRequiredDocs) * 100);
  }

  private static analyzeDeviceClassRequirements(documents: any[], products: any[]): DocumentIntelligence['complianceIntelligence']['deviceClassRequirements'] {
    return products.map(product => {
      const deviceClass = product.device_class || 'Class II';
      const requiredDocs = this.getRequiredDocumentsForDeviceClass(deviceClass);
      const currentDocs = documents.map(d => d.name);
      const gaps = requiredDocs.filter(req => !currentDocs.includes(req));

      return {
        deviceClass,
        requiredDocuments: requiredDocs,
        currentDocuments: currentDocs.slice(0, 10), // Limit for display
        gaps
      };
    });
  }

  // Helper method implementations
  private static suggestPhasesForDocument(docName: string): string[] {
    const phaseMapping: Record<string, string[]> = {
      'Design History File': ['Design Controls', 'Development'],
      'Risk Management File': ['Design Controls', 'Verification'],
      'Clinical Evaluation Report': ['Clinical', 'Validation'],
      'Post-Market Surveillance Plan': ['Post-Market', 'Monitoring'],
      'Declaration of Conformity': ['Regulatory', 'Submission'],
      'Technical Documentation': ['Development', 'Design Controls'],
      'Quality Management System': ['Quality', 'Management']
    };
    
    return phaseMapping[docName] || ['Development'];
  }

  private static getDocumentPriority(docName: string): 'high' | 'medium' | 'low' {
    const highPriority = ['Declaration of Conformity', 'Risk Management File', 'Clinical Evaluation Report'];
    const mediumPriority = ['Design History File', 'Technical Documentation'];
    
    if (highPriority.includes(docName)) return 'high';
    if (mediumPriority.includes(docName)) return 'medium';
    return 'low';
  }

  private static getDocumentQualityIssues(doc: any): string[] {
    const issues = [];
    
    if (doc.name.length < 5) issues.push('Document name too short');
    if (doc.name.includes('test') || doc.name.includes('temp')) issues.push('Appears to be temporary/test document');
    if (!doc.document_type) issues.push('Missing document type classification');
    if (!doc.status || doc.status === 'Not Started') issues.push('Document status not updated');
    
    return issues;
  }

  private static getIssueSeverity(doc: any): string {
    const issues = this.getDocumentQualityIssues(doc);
    
    if (issues.some(issue => issue.includes('temporary') || issue.includes('test'))) return 'critical';
    if (issues.length > 2) return 'warning';
    return 'info';
  }

  private static getRecommendedPhaseSequence(docName: string, phases: any[]): string[] {
    // Simplified phase sequencing logic
    const earlyPhases = ['Design Controls', 'Development', 'Design'];
    const middlePhases = ['Verification', 'Validation', 'Testing'];
    const latePhases = ['Regulatory', 'Submission', 'Post-Market'];
    
    return [...earlyPhases, ...middlePhases, ...latePhases].filter(phase =>
      phases.some(p => p.name.includes(phase))
    );
  }

  private static hasSequenceIssues(currentPhases: string[], recommendedSequence: string[]): boolean {
    // Simple check for logical phase ordering
    return currentPhases.length > 1 && 
           currentPhases.some(phase => !recommendedSequence.includes(phase));
  }

  private static generateBottleneckSuggestions(stats: any): string[] {
    const suggestions = [];
    
    if (stats.count > 20) {
      suggestions.push('Consider redistributing documents to parallel phases');
    }
    if (stats.completed / stats.total < 0.3) {
      suggestions.push('Review phase requirements and provide additional resources');
    }
    if (stats.count < 3) {
      suggestions.push('Consider merging with adjacent phases');
    }
    
    return suggestions;
  }

  private static identifyDocumentDependencies(doc: any): string[] {
    // Simplified dependency identification
    const dependencies = [];
    
    if (doc.name.includes('Test')) {
      dependencies.push('Test Plan', 'Test Procedures');
    }
    if (doc.name.includes('Report')) {
      dependencies.push('Data Collection', 'Analysis');
    }
    
    return dependencies;
  }

  private static identifyDocumentDependents(doc: any, allDocs: any[]): string[] {
    // Find documents that might depend on this one
    return allDocs
      .filter(d => d.id !== doc.id && d.name.includes(doc.name.split(' ')[0]))
      .map(d => d.name)
      .slice(0, 3);
  }

  private static isOnCriticalPath(doc: any): boolean {
    // Simplified critical path detection
    const criticalDocTypes = ['Declaration', 'Submission', 'Approval'];
    return criticalDocTypes.some(type => doc.name.includes(type));
  }

  private static isCriticalComplianceDocument(docName: string): boolean {
    const criticalDocs = [
      'declaration', 'conformity', 'risk', 'clinical', 'quality',
      'design history', 'technical documentation', 'surveillance'
    ];
    
    return criticalDocs.some(critical => 
      docName.toLowerCase().includes(critical)
    );
  }

  private static getRequiredDocumentsForDeviceClass(deviceClass: string): string[] {
    const requirements: Record<string, string[]> = {
      'Class I': ['Quality Manual', 'Risk Analysis'],
      'Class IIa': ['Quality Manual', 'Risk Analysis', 'Clinical Evaluation', 'Post-Market Plan'],
      'Class IIb': ['Quality Manual', 'Risk Analysis', 'Clinical Evaluation', 'Post-Market Plan', 'Design Dossier'],
      'Class III': ['Quality Manual', 'Risk Analysis', 'Clinical Evaluation', 'Post-Market Plan', 'Design Dossier', 'Clinical Investigation']
    };
    
    return requirements[deviceClass] || requirements['Class II'] || [];
  }

  private static suggestMergedDocumentName(documents: any[]): string {
    // Extract common terms from document names
    const names = documents.map(d => d.name);
    const commonWords = this.findCommonWords(names);
    
    return commonWords.length > 0 
      ? commonWords.join(' ') 
      : `Merged ${documents[0].document_type || 'Document'}`;
  }

  private static findCommonWords(names: string[]): string[] {
    if (names.length === 0) return [];
    
    const wordSets = names.map(name => 
      new Set(name.toLowerCase().split(/\s+/).filter(word => word.length > 2))
    );
    
    const firstSet = wordSets[0];
    const common = Array.from(firstSet).filter(word =>
      wordSets.every(wordSet => wordSet.has(word))
    );
    
    return common.slice(0, 3); // Limit to 3 common words
  }

  private static async mergeDocumentContent(documentIds: string[], newName: string): Promise<void> {
    // Keep the first document, delete others
    const keepId = documentIds[0];
    const deleteIds = documentIds.slice(1);
    
    // Update the kept document's name
    await supabase
      .from('phase_assigned_documents')
      .update({ name: newName })
      .eq('id', keepId);
    
    // Delete the others
    await supabase
      .from('phase_assigned_documents')
      .delete()
      .in('id', deleteIds);
  }

  private static async optimizeDocumentWorkflow(
    companyId: string,
    documentName: string,
    optimizedPhases: string[]
  ): Promise<void> {
    // Get phase IDs for the optimized phases
    const { data: phases } = await supabase
      .from('phases')
      .select('id, name')
      .eq('company_id', companyId)
      .in('name', optimizedPhases);
    
    if (!phases) return;
    
    const phaseIds = phases.map(p => p.id);
    
    // Remove existing assignments
    await supabase
      .from('phase_assigned_documents')
      .delete()
      .eq('name', documentName);
    
    // Add optimized assignments
    const assignments = phaseIds.map(phaseId => ({
      phase_id: phaseId,
      name: documentName,
      document_type: 'Optimized',
      status: 'Not Started'
    }));
    
    await supabase
      .from('phase_assigned_documents')
      .insert(assignments);
  }

  private static async addComplianceDocument(
    companyId: string,
    documentName: string,
    regulation: string
  ): Promise<void> {
    // Get the first available phase for this company
    const { data: phases } = await supabase
      .from('phases')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);
    
    if (!phases || phases.length === 0) return;
    
    // Add the compliance document
    await supabase
      .from('phase_assigned_documents')
      .insert({
        phase_id: phases[0].id,
        name: documentName,
        document_type: 'Compliance',
        status: 'Not Started',
        description: `Required for ${regulation} compliance`
      });
  }
}
