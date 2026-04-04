
import { 
  getRecommendedDocsWithStatusFromDB,
  getAvailableTechApplicabilities,
  getAvailableMarkets,
  getAvailableDeviceClasses,
  updateDocumentStatusInDB,
  updateDocumentDeadlineInDB,
  type PhaseDocumentWithStatus
} from './databasePhaseDocumentUtils';

// Legacy wrapper to maintain compatibility with existing components
export { type PhaseDocumentWithStatus };

/**
 * Enhanced version of getRecommendedDocsWithStatus that uses database instead of static files
 * Includes advanced filtering capabilities for markets, device classes, and tech applicability
 */
export async function getRecommendedDocsWithStatus(
  companyId: string,
  phaseName?: string,
  options?: {
    techApplicabilityFilter?: string;
    marketFilter?: string[];
    deviceClassFilter?: Record<string, string[]>;
    statusFilter?: string[];
  }
): Promise<PhaseDocumentWithStatus[]> {
  const documents = await getRecommendedDocsWithStatusFromDB(
    companyId,
    phaseName,
    options?.techApplicabilityFilter,
    options?.marketFilter,
    options?.deviceClassFilter
  );

  // Apply status filter if provided
  if (options?.statusFilter && options.statusFilter.length > 0) {
    return documents.filter(doc => options.statusFilter!.includes(doc.status));
  }

  return documents;
}

/**
 * Get filtering options for enhanced document management
 */
export async function getDocumentFilterOptions(companyId: string) {
  const [techApplicabilities, markets, deviceClasses] = await Promise.all([
    getAvailableTechApplicabilities(companyId),
    getAvailableMarkets(companyId),
    getAvailableDeviceClasses(companyId)
  ]);

  return {
    techApplicabilities,
    markets,
    deviceClasses,
    statuses: ['Not Started', 'In Progress', 'Completed', 'Not Required'] as const
  };
}

/**
 * Update document status (wrapper for database function)
 */
export const updateDocumentStatus = updateDocumentStatusInDB;

/**
 * Update document deadline (wrapper for database function)
 */
export const updateDocumentDeadline = updateDocumentDeadlineInDB;

/**
 * Get documents for a specific market and device class combination
 */
export async function getDocumentsForMarketAndClass(
  companyId: string,
  market: string,
  deviceClass: string,
  phaseName?: string
): Promise<PhaseDocumentWithStatus[]> {
  return getRecommendedDocsWithStatus(companyId, phaseName, {
    marketFilter: [market],
    deviceClassFilter: { [market]: [deviceClass] }
  });
}

/**
 * Get documents by tech applicability
 */
export async function getDocumentsByTechApplicability(
  companyId: string,
  techApplicability: string,
  phaseName?: string
): Promise<PhaseDocumentWithStatus[]> {
  return getRecommendedDocsWithStatus(companyId, phaseName, {
    techApplicabilityFilter: techApplicability
  });
}

/**
 * Get document completion statistics for a phase
 */
export async function getPhaseDocumentStatistics(
  companyId: string,
  phaseName: string
): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notRequired: number;
  completionPercentage: number;
}> {
  const documents = await getRecommendedDocsWithStatus(companyId, phaseName);
  
  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.status === 'Completed').length,
    inProgress: documents.filter(d => d.status === 'In Progress').length,
    notStarted: documents.filter(d => d.status === 'Not Started').length,
    notRequired: documents.filter(d => d.status === 'Not Required').length,
    completionPercentage: 0
  };

  // Calculate completion percentage (excluding not required)
  const applicableDocuments = stats.total - stats.notRequired;
  if (applicableDocuments > 0) {
    stats.completionPercentage = Math.round((stats.completed / applicableDocuments) * 100);
  }

  return stats;
}
