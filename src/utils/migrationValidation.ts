
import { supabase } from "@/integrations/supabase/client";

export interface MigrationValidationResult {
  companyName: string;
  totalDocuments: number;
  documentsWithMarkets: number;
  documentsWithClasses: number;
  uniqueTechApplicabilities: string[];
  migrationStatus: 'Complete' | 'Partial' | 'Incomplete';
}

/**
 * Validate the document matrix migration for all companies
 */
export async function validateDocumentMatrixMigration(): Promise<MigrationValidationResult[]> {
  try {
    const { data, error } = await supabase.rpc('validate_document_matrix_migration');
    
    if (error) {
      console.error('Error validating migration:', error);
      throw error;
    }

    // Map database results to interface format
    return (data || []).map((row: any) => ({
      companyName: row.company_name,
      totalDocuments: row.total_documents,
      documentsWithMarkets: row.documents_with_markets,
      documentsWithClasses: row.documents_with_classes,
      uniqueTechApplicabilities: row.unique_tech_applicabilities,
      migrationStatus: row.migration_status as 'Complete' | 'Partial' | 'Incomplete'
    }));
  } catch (error) {
    console.error('Migration validation failed:', error);
    return [];
  }
}

/**
 * Get detailed migration report for a specific company
 */
export async function getCompanyMigrationReport(companyId: string): Promise<{
  totalPhases: number;
  phasesWithDocuments: number;
  avgDocumentsPerPhase: number;
  documentsWithMetadata: number;
  migrationCompleteness: number;
}> {
  try {
    // Get phase count for company
    const { data: phases, error: phasesError } = await supabase
      .from('phases')
      .select('id')
      .eq('company_id', companyId);

    if (phasesError) throw phasesError;

    // Get document statistics
    const { data: docs, error: docsError } = await supabase
      .from('phase_assigned_documents')
      .select(`
        id,
        markets,
        classes_by_market,
        tech_applicability,
        phase_id,
        phases!inner(company_id)
      `)
      .eq('phases.company_id', companyId)
      .eq('document_scope', 'company_template');

    if (docsError) throw docsError;

    const totalPhases = phases?.length || 0;
    const totalDocuments = docs?.length || 0;
    
    // Count phases that have documents
    const phasesWithDocs = new Set(docs?.map(d => d.phase_id) || []).size;
    
    // Count documents with metadata
    const docsWithMetadata = docs?.filter(d => 
      Array.isArray(d.markets) && d.markets.length > 0 &&
      typeof d.classes_by_market === 'object' && 
      Object.keys(d.classes_by_market || {}).length > 0
    ).length || 0;

    return {
      totalPhases,
      phasesWithDocuments: phasesWithDocs,
      avgDocumentsPerPhase: totalPhases > 0 ? Math.round(totalDocuments / totalPhases) : 0,
      documentsWithMetadata: docsWithMetadata,
      migrationCompleteness: totalDocuments > 0 ? Math.round((docsWithMetadata / totalDocuments) * 100) : 0
    };

  } catch (error) {
    console.error('Error generating company migration report:', error);
    return {
      totalPhases: 0,
      phasesWithDocuments: 0,
      avgDocumentsPerPhase: 0,
      documentsWithMetadata: 0,
      migrationCompleteness: 0
    };
  }
}

/**
 * Check if migration meets quality standards
 */
export function assessMigrationQuality(result: MigrationValidationResult): {
  score: number;
  recommendations: string[];
  isReady: boolean;
} {
  const recommendations: string[] = [];
  let score = 0;

  // Document count check (30 points)
  if (result.totalDocuments >= 75) {
    score += 30;
  } else if (result.totalDocuments >= 50) {
    score += 20;
    recommendations.push('Consider adding more documents to reach 75+ for complete coverage');
  } else {
    score += 10;
    recommendations.push('Document count is low - critical documents may be missing');
  }

  // Metadata completeness (40 points)
  const metadataCompleteness = (result.documentsWithMarkets + result.documentsWithClasses) / (result.totalDocuments * 2);
  if (metadataCompleteness >= 0.9) {
    score += 40;
  } else if (metadataCompleteness >= 0.7) {
    score += 30;
    recommendations.push('Some documents missing market/class metadata');
  } else {
    score += 15;
    recommendations.push('Many documents missing critical metadata - filtering may be limited');
  }

  // Tech applicability diversity (20 points)
  if (result.uniqueTechApplicabilities.length >= 4) {
    score += 20;
  } else if (result.uniqueTechApplicabilities.length >= 2) {
    score += 15;
    recommendations.push('Consider adding more tech applicability categories');
  } else {
    score += 5;
    recommendations.push('Limited tech applicability options - may not cover all device types');
  }

  // Migration status (10 points)
  if (result.migrationStatus === 'Complete') {
    score += 10;
  } else if (result.migrationStatus === 'Partial') {
    score += 5;
    recommendations.push('Migration partially complete - some issues detected');
  } else {
    recommendations.push('Migration incomplete - significant issues detected');
  }

  const isReady = score >= 80 && result.migrationStatus !== 'Incomplete';

  if (isReady) {
    recommendations.unshift('Migration quality is excellent - ready for production use');
  }

  return { score, recommendations, isReady };
}
