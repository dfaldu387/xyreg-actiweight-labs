
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DatabasePhaseDocument {
  id: string;
  name: string;
  document_type: string;
  tech_applicability: string;
  markets: string[];
  classes_by_market: Record<string, string[]>;
  status: string;
  phase_id: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseDocumentWithStatus {
  name: string;
  type: string;
  status: "Not Started" | "In Progress" | "Completed" | "Not Required";
  techApplicability: string;
  markets: string[];
  classesByMarket: Record<string, string[]>;
  deadline?: Date;
  id: string;
}

/**
 * Safely convert Json to string array
 */
function safeJsonToStringArray(json: any): string[] {
  if (Array.isArray(json)) {
    return json.filter(item => typeof item === 'string');
  }
  return [];
}

/**
 * Safely convert Json to record of string arrays
 */
function safeJsonToClassesByMarket(json: any): Record<string, string[]> {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const result: Record<string, string[]> = {};
    Object.entries(json).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        result[key] = value.filter(item => typeof item === 'string');
      }
    });
    return result;
  }
  return {};
}

/**
 * Fetch recommended documents from database with enhanced metadata filtering
 */
export async function getRecommendedDocsWithStatusFromDB(
  companyId: string,
  phaseName?: string,
  techApplicabilityFilter?: string,
  marketFilter?: string[],
  deviceClassFilter?: Record<string, string[]>
): Promise<PhaseDocumentWithStatus[]> {
  try {
    console.log('[getRecommendedDocsWithStatusFromDB] Fetching documents for:', {
      companyId,
      phaseName,
      techApplicabilityFilter,
      marketFilter,
      deviceClassFilter
    });

    // Build query to get documents from database
    let query = supabase
      .from('phase_assigned_documents')
      .select(`
        id,
        name,
        document_type,
        tech_applicability,
        markets,
        classes_by_market,
        status,
        phase_id,
        deadline,
        created_at,
        updated_at,
        phases!inner(name, company_id)
      `)
      .eq('phases.company_id', companyId)
      .eq('document_scope', 'company_template');

    // Add phase name filter if specified
    if (phaseName) {
      query = query.eq('phases.name', phaseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getRecommendedDocsWithStatusFromDB] Database error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[getRecommendedDocsWithStatusFromDB] No documents found');
      return [];
    }

    // Transform and filter the results
    let documents: PhaseDocumentWithStatus[] = data.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.document_type || 'Standard',
      status: (doc.status as "Not Started" | "In Progress" | "Completed" | "Not Required") || 'Not Started',
      techApplicability: doc.tech_applicability || 'All device types',
      markets: safeJsonToStringArray(doc.markets),
      classesByMarket: safeJsonToClassesByMarket(doc.classes_by_market),
      deadline: doc.deadline ? new Date(doc.deadline) : undefined
    }));

    // Apply client-side filters for enhanced functionality
    if (techApplicabilityFilter && techApplicabilityFilter !== 'All device types') {
      documents = documents.filter(doc => 
        doc.techApplicability === techApplicabilityFilter || 
        doc.techApplicability === 'All device types'
      );
    }

    if (marketFilter && marketFilter.length > 0) {
      documents = documents.filter(doc => 
        marketFilter.some(market => doc.markets.includes(market))
      );
    }

    if (deviceClassFilter && Object.keys(deviceClassFilter).length > 0) {
      documents = documents.filter(doc => {
        return Object.entries(deviceClassFilter).some(([market, classes]) => {
          const docClasses = doc.classesByMarket[market];
          return docClasses && classes.some(cls => docClasses.includes(cls));
        });
      });
    }

    console.log(`[getRecommendedDocsWithStatusFromDB] Found ${documents.length} documents after filtering`);
    return documents;

  } catch (error) {
    console.error('[getRecommendedDocsWithStatusFromDB] Error:', error);
    toast.error('Failed to fetch recommended documents');
    return [];
  }
}

/**
 * Get all available tech applicability options from database
 */
export async function getAvailableTechApplicabilities(companyId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('phase_assigned_documents')
      .select(`
        tech_applicability,
        phases!inner(company_id)
      `)
      .eq('phases.company_id', companyId)
      .eq('document_scope', 'company_template');

    if (error) throw error;

    const applicabilities = [...new Set(
      data?.map(doc => doc.tech_applicability).filter(Boolean) || []
    )];

    return applicabilities.sort();
  } catch (error) {
    console.error('Error fetching tech applicabilities:', error);
    return ['All device types'];
  }
}

/**
 * Get all available markets from database
 */
export async function getAvailableMarkets(companyId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('phase_assigned_documents')
      .select(`
        markets,
        phases!inner(company_id)
      `)
      .eq('phases.company_id', companyId)
      .eq('document_scope', 'company_template');

    if (error) throw error;

    const allMarkets = new Set<string>();
    data?.forEach(doc => {
      const markets = safeJsonToStringArray(doc.markets);
      markets.forEach(market => allMarkets.add(market));
    });

    return Array.from(allMarkets).sort();
  } catch (error) {
    console.error('Error fetching available markets:', error);
    return ['US', 'EU', 'CA', 'AU', 'JP'];
  }
}

/**
 * Get available device classes by market from database
 */
export async function getAvailableDeviceClasses(companyId: string): Promise<Record<string, string[]>> {
  try {
    const { data, error } = await supabase
      .from('phase_assigned_documents')
      .select(`
        classes_by_market,
        phases!inner(company_id)
      `)
      .eq('phases.company_id', companyId)
      .eq('document_scope', 'company_template');

    if (error) throw error;

    const allClasses: Record<string, Set<string>> = {};
    data?.forEach(doc => {
      const classesByMarket = safeJsonToClassesByMarket(doc.classes_by_market);
      Object.entries(classesByMarket).forEach(([market, classes]) => {
        if (!allClasses[market]) {
          allClasses[market] = new Set();
        }
        classes.forEach(cls => allClasses[market].add(cls));
      });
    });

    // Convert Sets to sorted arrays
    const result: Record<string, string[]> = {};
    Object.entries(allClasses).forEach(([market, classSet]) => {
      result[market] = Array.from(classSet).sort();
    });

    return result;
  } catch (error) {
    console.error('Error fetching available device classes:', error);
    return {
      US: ["I", "II", "III"],
      EU: ["I", "IIa", "IIb", "III"],
      CA: ["I", "II", "III", "IV"],
      AU: ["I", "II", "III"],
      JP: ["I", "II", "III", "IV"]
    };
  }
}

/**
 * Update document status in database
 */
export async function updateDocumentStatusInDB(
  documentId: string,
  status: "Not Started" | "In Progress" | "Completed" | "Not Required"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('phase_assigned_documents')
      .update({ status })
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    }

    toast.success('Document status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating document status:', error);
    toast.error('Failed to update document status');
    return false;
  }
}

/**
 * Update document deadline in database
 */
export async function updateDocumentDeadlineInDB(
  documentId: string,
  deadline: Date | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('phase_assigned_documents')
      .update({ 
        deadline: deadline ? deadline.toISOString() : null 
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document deadline:', error);
      toast.error('Failed to update document deadline');
      return false;
    }

    toast.success(deadline ? 'Document deadline updated' : 'Document deadline removed');
    return true;
  } catch (error) {
    console.error('Error updating document deadline:', error);
    toast.error('Failed to update document deadline');
    return false;
  }
}

/**
 * Get document statistics for a company
 */
export async function getDocumentStatistics(companyId: string): Promise<{
  totalDocuments: number;
  documentsWithMarkets: number;
  documentsWithClasses: number;
  techApplicabilities: string[];
  migrationStatus: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('validate_document_matrix_migration')
      .single();

    if (error) throw error;

    return {
      totalDocuments: (data as any)?.total_documents || 0,
      documentsWithMarkets: (data as any)?.documents_with_markets || 0,
      documentsWithClasses: (data as any)?.documents_with_classes || 0,
      techApplicabilities: (data as any)?.unique_tech_applicabilities || [],
      migrationStatus: (data as any)?.migration_status || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching document statistics:', error);
    return {
      totalDocuments: 0,
      documentsWithMarkets: 0,
      documentsWithClasses: 0,
      techApplicabilities: [],
      migrationStatus: 'Error'
    };
  }
}
