import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentAnalysis {
  totalDocuments: number;
  scopeBreakdown: {
    companyTemplates: number;
    companyDocuments: number;
    productDocuments: number;
  };
  duplicateGroups: Array<{
    name: string;
    count: number;
    documents: any[];
    scopes: string[];
    phases: string[];
  }>;
  orphanedDocuments: any[];
  incorrectScopes: any[];
  phaseAssignmentIssues: {
    testPhases: any[];
    duplicateAssignments: any[];
    missingAssignments: any[];
    overDistributed: any[];
    templateConsolidationCandidates: any[];
  };
}

export interface CleanupPlan {
  scopeCorrections: Array<{
    documentId: string;
    currentScope: string;
    recommendedScope: string;
    reason: string;
  }>;
  duplicateRemovals: Array<{
    groupName: string;
    keepDocumentId: string;
    removeDocumentIds: string[];
  }>;
  phaseReassignments: Array<{
    documentId: string;
    currentPhases: string[];
    recommendedPhases: string[];
  }>;
  orphanCleanup: Array<{
    documentId: string;
    action: 'fix_company_id' | 'fix_product_id' | 'delete';
  }>;
}

// Type-safe scope validation
type DocumentScope = 'company_template' | 'company_document' | 'product_document';

const isValidDocumentScope = (scope: string): scope is DocumentScope => {
  return ['company_template', 'company_document', 'product_document'].includes(scope);
};

const determineCorrectScope = (doc: any): DocumentScope => {
  // If document has template_source_id, it should be product_document
  if (doc.template_source_id) {
    return 'product_document';
  }
  
  // If document has product_id but no template_source_id, it should be product_document
  if (doc.product_id) {
    return 'product_document';
  }
  
  // If document has no product_id and no template_source_id, it should be company_template
  return 'company_template';
};

export class DocumentOrganizationService {
  
  /**
   * Phase 1: Comprehensive analysis of document organization
   */
  static async analyzeDocumentOrganization(companyId: string): Promise<DocumentAnalysis> {
    console.log('[DocumentOrganization] Starting comprehensive analysis for company:', companyId);
    
    try {
      // Get all documents for the company
      const { data: allDocs, error } = await supabase
        .from('documents')
        .select(`
          *,
          products(name, id)
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      const documents = allDocs || [];
      console.log('[DocumentOrganization] Analyzing', documents.length, 'documents');

      // Scope breakdown
      const scopeBreakdown = {
        companyTemplates: documents.filter(d => d.document_scope === 'company_template').length,
        companyDocuments: documents.filter(d => d.document_scope === 'company_document').length,
        productDocuments: documents.filter(d => d.document_scope === 'product_document').length,
      };

      // Find duplicates by name across all scopes
      const documentGroups = new Map<string, any[]>();
      documents.forEach(doc => {
        const key = doc.name.toLowerCase().trim();
        if (!documentGroups.has(key)) {
          documentGroups.set(key, []);
        }
        documentGroups.get(key)!.push(doc);
      });

      const duplicateGroups = Array.from(documentGroups.entries())
        .filter(([_, docs]) => docs.length > 1)
        .map(([name, docs]) => ({
          name,
          count: docs.length,
          documents: docs,
          scopes: [...new Set(docs.map(d => d.document_scope))],
          phases: [...new Set(docs.map(d => d.phase_id).filter(Boolean))]
        }));

      // Find orphaned documents
      const orphanedDocuments = documents.filter(doc => 
        !doc.company_id || 
        (doc.document_scope === 'product_document' && !doc.product_id)
      );

      // Enhanced scope analysis - find documents with incorrect scopes
      const incorrectScopes = documents.filter(doc => {
        const currentScope = doc.document_scope;
        const correctScope = determineCorrectScope(doc);
        
        return currentScope !== correctScope;
      });

      // Get phase assignment issues - separate query to avoid relationship issues
      let testPhases: any[] = [];
      let duplicateAssignments: any[] = [];

      try {
        const { data: phaseAssignedDocs, error: phaseError } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .in('phase_id', [
            // Get phase IDs for this company first
            ...(await supabase
              .from('phases')
              .select('id')
              .eq('company_id', companyId)
              .then(result => result.data?.map(p => p.id) || []))
          ]);

        if (!phaseError && phaseAssignedDocs) {
          // Get phase names for filtering
          const { data: phases } = await supabase
            .from('phases')
            .select('id, name')
            .eq('company_id', companyId);

          const phaseMap = new Map(phases?.map(p => [p.id, p.name]) || []);

          // Find test phases (likely temporary/incorrect)
          testPhases = phaseAssignedDocs.filter(doc => {
            const phaseName = phaseMap.get(doc.phase_id);
            return phaseName && (
              phaseName.includes('test') ||
              phaseName.includes('Test') ||
              phaseName.includes('Nikola') ||
              phaseName.length < 3
            );
          });

          // Find duplicate assignments (same document in multiple phases unnecessarily)
          const assignmentGroups = new Map<string, any[]>();
          phaseAssignedDocs.forEach(doc => {
            const key = doc.name.toLowerCase().trim();
            if (!assignmentGroups.has(key)) {
              assignmentGroups.set(key, []);
            }
            assignmentGroups.get(key)!.push(doc);
          });

          duplicateAssignments = Array.from(assignmentGroups.entries())
            .filter(([_, docs]) => docs.length > 3) // More than 3 phases might be excessive
            .map(([name, docs]) => ({ name, count: docs.length, docs }));
        }
      } catch (phaseError) {
        console.warn('[DocumentOrganization] Phase query failed:', phaseError);
      }

      // Enhanced Phase 3 analysis: Template consolidation candidates
      const templateConsolidationCandidates = await this.analyzeTemplateConsolidation(companyId);
      
      // Enhanced Phase 3 analysis: Over-distributed documents
      const overDistributedDocs = await this.analyzeOverDistribution(companyId);

      return {
        totalDocuments: documents.length,
        scopeBreakdown,
        duplicateGroups,
        orphanedDocuments,
        incorrectScopes,
        phaseAssignmentIssues: {
          testPhases,
          duplicateAssignments,
          missingAssignments: [], // We'll calculate this later if needed
          overDistributed: overDistributedDocs,
          templateConsolidationCandidates
        }
      };

    } catch (error) {
      console.error('[DocumentOrganization] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Analyze template consolidation opportunities
   */
  static async analyzeTemplateConsolidation(companyId: string): Promise<any[]> {
    try {
      const { data: templates, error } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('document_scope', 'company_template')
        .in('phase_id', [
          ...(await supabase
            .from('phases')
            .select('id')
            .eq('company_id', companyId)
            .then(result => result.data?.map(p => p.id) || []))
        ]);

      if (error) throw error;

      // Group by normalized name for consolidation analysis
      const consolidationGroups = new Map<string, any[]>();
      
      (templates || []).forEach(template => {
        const normalizedName = this.normalizeTemplateName(template.name);
        if (!consolidationGroups.has(normalizedName)) {
          consolidationGroups.set(normalizedName, []);
        }
        consolidationGroups.get(normalizedName)!.push(template);
      });

      // Find consolidation candidates (multiple templates with similar names)
      return Array.from(consolidationGroups.entries())
        .filter(([_, templates]) => templates.length > 1)
        .map(([normalizedName, templates]) => ({
          normalizedName,
          count: templates.length,
          templates,
          consolidationRecommendation: this.generateConsolidationRecommendation(templates)
        }));

    } catch (error) {
      console.error('[DocumentOrganization] Template consolidation analysis failed:', error);
      return [];
    }
  }

  /**
   * Phase 3: Analyze over-distributed documents
   */
  static async analyzeOverDistribution(companyId: string): Promise<any[]> {
    try {
      const { data: phaseAssignments, error } = await supabase
        .from('phase_assigned_documents')
        .select(`
          *,
          phases!phase_assigned_documents_phase_id_fkey(name, company_id)
        `)
        .eq('phases.company_id', companyId);

      if (error) throw error;

      // Group by document name to find over-distribution
      const documentGroups = new Map<string, any[]>();
      
      (phaseAssignments || []).forEach(doc => {
        const key = doc.name.toLowerCase().trim();
        if (!documentGroups.has(key)) {
          documentGroups.set(key, []);
        }
        documentGroups.get(key)!.push(doc);
      });

      // Find documents assigned to too many phases (threshold: >5 phases)
      return Array.from(documentGroups.entries())
        .filter(([_, docs]) => docs.length > 5)
        .map(([name, docs]) => ({
          name,
          assignmentCount: docs.length,
          assignments: docs,
          recommendation: this.generateDistributionRecommendation(docs)
        }));

    } catch (error) {
      console.error('[DocumentOrganization] Over-distribution analysis failed:', error);
      return [];
    }
  }

  /**
   * Phase 2: Generate cleanup plan with enhanced scope corrections
   */
  static async generateCleanupPlan(companyId: string, analysis: DocumentAnalysis): Promise<CleanupPlan> {
    console.log('[DocumentOrganization] Generating cleanup plan');

    const plan: CleanupPlan = {
      scopeCorrections: [],
      duplicateRemovals: [],
      phaseReassignments: [],
      orphanCleanup: []
    };

    // Enhanced scope corrections - Phase 2 focus
    analysis.incorrectScopes.forEach(doc => {
      const currentScope = doc.document_scope;
      const recommendedScope = determineCorrectScope(doc);
      let reason = '';

      if (doc.template_source_id && currentScope !== 'product_document') {
        reason = 'Document has template source - should be product document';
      } else if (doc.product_id && !doc.template_source_id && currentScope !== 'product_document') {
        reason = 'Document belongs to product - should be product document';
      } else if (!doc.product_id && !doc.template_source_id && currentScope !== 'company_template') {
        reason = 'Document has no product association - should be company template';
      } else if (currentScope === 'company_template' && doc.product_id) {
        reason = 'Template incorrectly has product ID - should be product document';
      }

      if (recommendedScope !== currentScope) {
        plan.scopeCorrections.push({
          documentId: doc.id,
          currentScope,
          recommendedScope,
          reason
        });
      }
    });

    // Duplicate removals (keep most recent, remove others)
    analysis.duplicateGroups.forEach(group => {
      if (group.documents.length > 1) {
        const sortedDocs = group.documents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        plan.duplicateRemovals.push({
          groupName: group.name,
          keepDocumentId: sortedDocs[0].id,
          removeDocumentIds: sortedDocs.slice(1).map(d => d.id)
        });
      }
    });

    // Orphan cleanup
    analysis.orphanedDocuments.forEach(doc => {
      let action: 'fix_company_id' | 'fix_product_id' | 'delete' = 'delete';
      
      if (!doc.company_id) {
        action = 'fix_company_id';
      } else if (doc.document_scope === 'product_document' && !doc.product_id) {
        action = 'fix_product_id';
      }

      plan.orphanCleanup.push({
        documentId: doc.id,
        action
      });
    });

    console.log('[DocumentOrganization] Generated plan:', {
      scopeCorrections: plan.scopeCorrections.length,
      duplicateRemovals: plan.duplicateRemovals.length,
      orphanCleanup: plan.orphanCleanup.length
    });

    return plan;
  }

  /**
   * Phase 3: Generate cleanup plan with template consolidation
   */
  static async generatePhase3CleanupPlan(companyId: string, analysis: DocumentAnalysis): Promise<any> {
    console.log('[DocumentOrganization] Generating Phase 3 cleanup plan');

    const plan = {
      scopeCorrections: [] as any[],
      duplicateRemovals: [] as any[],
      phaseReassignments: [] as any[],
      orphanCleanup: [] as any[],
      templateConsolidations: [] as any[],
      overDistributionFixes: [] as any[]
    };

    // Template consolidation recommendations
    analysis.phaseAssignmentIssues.templateConsolidationCandidates.forEach(candidate => {
      if (candidate.templates.length > 1) {
        const masterTemplate = candidate.templates.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        plan.templateConsolidations.push({
          masterTemplateId: masterTemplate.id,
          duplicateTemplateIds: candidate.templates
            .filter(t => t.id !== masterTemplate.id)
            .map(t => t.id),
          consolidatedName: candidate.normalizedName,
          reason: candidate.consolidationRecommendation
        });
      }
    });

    // Over-distribution fixes
    analysis.phaseAssignmentIssues.overDistributed.forEach(item => {
      const relevantPhases = this.determineRelevantPhases(item.assignments);
      const excessPhases = item.assignments
        .filter(assignment => !relevantPhases.includes(assignment.phase_id))
        .map(assignment => assignment.id);

      if (excessPhases.length > 0) {
        plan.overDistributionFixes.push({
          documentName: item.name,
          removeFromPhases: excessPhases,
          keepInPhases: relevantPhases,
          reason: item.recommendation
        });
      }
    });

    console.log('[DocumentOrganization] Generated Phase 3 plan:', {
      templateConsolidations: plan.templateConsolidations.length,
      overDistributionFixes: plan.overDistributionFixes.length
    });

    return plan;
  }

  /**
   * Phase 3: Execute template consolidation and phase cleanup
   */
  static async executePhase3Cleanup(companyId: string, plan: any): Promise<{
    success: boolean;
    results: {
      templatesConsolidated: number;
      phaseAssignmentsFixed: number;
      overDistributionFixed: number;
    };
    errors: string[];
  }> {
    console.log('[DocumentOrganization] Executing Phase 3 cleanup');
    
    const results = {
      templatesConsolidated: 0,
      phaseAssignmentsFixed: 0,
      overDistributionFixed: 0
    };
    const errors: string[] = [];

    try {
      // Execute template consolidations
      for (const consolidation of plan.templateConsolidations) {
        try {
          // Remove duplicate templates
          for (const duplicateId of consolidation.duplicateTemplateIds) {
            const { error } = await supabase
              .from('phase_assigned_documents')
              .delete()
              .eq('id', duplicateId);

            if (error) {
              errors.push(`Failed to consolidate template ${duplicateId}: ${error.message}`);
            } else {
              results.templatesConsolidated++;
            }
          }

          // Update master template name to normalized version
          const { error: updateError } = await supabase
            .from('phase_assigned_documents')
            .update({ name: consolidation.consolidatedName })
            .eq('id', consolidation.masterTemplateId);

          if (updateError) {
            errors.push(`Failed to update master template name: ${updateError.message}`);
          }

        } catch (error) {
          errors.push(`Template consolidation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute over-distribution fixes
      for (const fix of plan.overDistributionFixes) {
        try {
          for (const phaseAssignmentId of fix.removeFromPhases) {
            const { error } = await supabase
              .from('phase_assigned_documents')
              .delete()
              .eq('id', phaseAssignmentId);

            if (error) {
              errors.push(`Failed to remove over-distributed assignment ${phaseAssignmentId}: ${error.message}`);
            } else {
              results.overDistributionFixed++;
            }
          }
        } catch (error) {
          errors.push(`Over-distribution fix error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const success = errors.length === 0;
      
      if (success) {
        toast.success(`Phase 3 cleanup completed: ${results.templatesConsolidated} templates consolidated, ${results.overDistributionFixed} over-distributions fixed`);
      } else {
        toast.error(`Phase 3 cleanup completed with ${errors.length} errors`);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('[DocumentOrganization] Phase 3 cleanup execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      return { success: false, results, errors };
    }
  }

  /**
   * Phase 3: Execute cleanup plan with enhanced scope corrections
   */
  static async executeCleanupPlan(companyId: string, plan: CleanupPlan): Promise<{
    success: boolean;
    results: {
      scopesCorrected: number;
      duplicatesRemoved: number;
      orphansFixed: number;
      phaseReassignments: number;
    };
    errors: string[];
  }> {
    console.log('[DocumentOrganization] Executing cleanup plan');
    
    const results = {
      scopesCorrected: 0,
      duplicatesRemoved: 0,
      orphansFixed: 0,
      phaseReassignments: 0
    };
    const errors: string[] = [];

    try {
      // Execute scope corrections - Phase 2 focus
      for (const correction of plan.scopeCorrections) {
        try {
          // Validate the scope before update
          if (!isValidDocumentScope(correction.recommendedScope)) {
            errors.push(`Invalid scope "${correction.recommendedScope}" for document ${correction.documentId}`);
            continue;
          }

          const { error } = await supabase
            .from('documents')
            .update({ document_scope: correction.recommendedScope })
            .eq('id', correction.documentId);

          if (error) {
            errors.push(`Failed to correct scope for document ${correction.documentId}: ${error.message}`);
          } else {
            results.scopesCorrected++;
            console.log(`[DocumentOrganization] Corrected scope: ${correction.currentScope} → ${correction.recommendedScope}`);
          }
        } catch (error) {
          errors.push(`Scope correction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute duplicate removals
      for (const removal of plan.duplicateRemovals) {
        for (const docId of removal.removeDocumentIds) {
          try {
            const { error } = await supabase
              .from('documents')
              .delete()
              .eq('id', docId);

            if (error) {
              errors.push(`Failed to remove duplicate document ${docId}: ${error.message}`);
            } else {
              results.duplicatesRemoved++;
            }
          } catch (error) {
            errors.push(`Duplicate removal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Execute orphan cleanup
      for (const cleanup of plan.orphanCleanup) {
        try {
          if (cleanup.action === 'fix_company_id') {
            const { error } = await supabase
              .from('documents')
              .update({ company_id: companyId })
              .eq('id', cleanup.documentId);

            if (error) {
              errors.push(`Failed to fix company_id for document ${cleanup.documentId}: ${error.message}`);
            } else {
              results.orphansFixed++;
            }
          } else if (cleanup.action === 'delete') {
            const { error } = await supabase
              .from('documents')
              .delete()
              .eq('id', cleanup.documentId);

            if (error) {
              errors.push(`Failed to delete orphaned document ${cleanup.documentId}: ${error.message}`);
            } else {
              results.orphansFixed++;
            }
          }
        } catch (error) {
          errors.push(`Orphan cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clean up test phases - get phase IDs with test names
      try {
        const { data: testPhases, error: testPhaseError } = await supabase
          .from('phases')
          .select('id')
          .eq('company_id', companyId)
          .or('name.ilike.%test%,name.ilike.%nikola%,name.ilike.%temp%');

        if (!testPhaseError && testPhases?.length > 0) {
          const testPhaseIds = testPhases.map(p => p.id);
          
          const { error: deleteError } = await supabase
            .from('phase_assigned_documents')
            .delete()
            .in('phase_id', testPhaseIds);

          if (deleteError) {
            console.warn('Phase cleanup warning:', deleteError);
          } else {
            results.phaseReassignments += testPhases.length;
          }
        }
      } catch (error) {
        console.warn('Phase cleanup failed:', error);
      }

      const success = errors.length === 0;
      
      if (success) {
        toast.success(`Phase 2 cleanup completed: ${results.scopesCorrected} scopes corrected, ${results.duplicatesRemoved} duplicates removed, ${results.orphansFixed} orphans fixed`);
      } else {
        toast.error(`Phase 2 cleanup completed with ${errors.length} errors`);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('[DocumentOrganization] Cleanup execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      return { success: false, results, errors };
    }
  }

  /**
   * One-click comprehensive cleanup
   */
  static async performComprehensiveCleanup(companyId: string): Promise<{
    success: boolean;
    analysis: DocumentAnalysis;
    results: any;
    errors: string[];
  }> {
    try {
      console.log('[DocumentOrganization] Starting comprehensive cleanup for company:', companyId);
      
      // Phase 1: Analyze
      const analysis = await this.analyzeDocumentOrganization(companyId);
      
      // Phase 2: Generate plan
      const plan = await this.generateCleanupPlan(companyId, analysis);
      
      // Phase 3: Generate plan
      const phase3Plan = await this.generatePhase3CleanupPlan(companyId, analysis);
      
      // Phase 2: Execute
      const results = await this.executeCleanupPlan(companyId, plan);
      
      // Phase 3: Execute
      const phase3Results = await this.executePhase3Cleanup(companyId, phase3Plan);
      
      // Combine results
      const combinedResults = {
        ...results.results,
        ...phase3Results.results
      };
      
      const combinedErrors = [
        ...results.errors,
        ...phase3Results.errors
      ];
      
      return {
        success: results.success && phase3Results.success,
        analysis,
        results: combinedResults,
        errors: combinedErrors
      };
      
    } catch (error) {
      console.error('[DocumentOrganization] Comprehensive cleanup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        analysis: {} as DocumentAnalysis,
        results: {},
        errors: [errorMessage]
      };
    }
  }

  /**
   * Utility: Normalize template names for consolidation
   */
  private static normalizeTemplateName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b(template|document|doc|form)\b/g, '')
      .trim();
  }

  /**
   * Utility: Generate consolidation recommendation
   */
  private static generateConsolidationRecommendation(templates: any[]): string {
    const phaseNames = [...new Set(templates.map(t => t.phases?.name).filter(Boolean))];
    const docTypes = [...new Set(templates.map(t => t.document_type))];
    
    return `Consolidate ${templates.length} similar templates across ${phaseNames.length} phases (${docTypes.join(', ')})`;
  }

  /**
   * Utility: Generate distribution recommendation
   */
  private static generateDistributionRecommendation(assignments: any[]): string {
    const phaseCount = assignments.length;
    const suggestedPhases = Math.min(3, Math.ceil(phaseCount / 3));
    
    return `Document is over-distributed across ${phaseCount} phases. Recommend limiting to ${suggestedPhases} most relevant phases.`;
  }

  /**
   * Utility: Determine relevant phases for a document
   */
  private static determineRelevantPhases(assignments: any[]): string[] {
    // Simple heuristic: keep assignments in phases with specific keywords
    const relevantKeywords = ['design', 'development', 'testing', 'validation', 'production', 'launch'];
    
    return assignments
      .filter(assignment => {
        const phaseName = assignment.phases?.name?.toLowerCase() || '';
        return relevantKeywords.some(keyword => phaseName.includes(keyword));
      })
      .map(assignment => assignment.phase_id)
      .slice(0, 3); // Limit to max 3 phases
  }
}
