
/**
 * Optimized type definitions for document management system
 */

export interface DocumentOperationResult {
  success: boolean;
  instances?: number;
  error?: string;
  details?: any;
}

export interface DocumentStatusFilter {
  statuses: string[];
  applyFilter: (documents: any[]) => any[];
}

export interface PhaseDocumentSummary {
  phaseId: string;
  phaseName: string;
  documentCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  isCurrentPhase: boolean;
}

export interface DocumentSyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncError?: string;
  pendingOperations: number;
}

export interface OptimizedDocumentTabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentPhaseInstances: any[];
  allPhaseInstances: any[];
  productSpecificDocuments: any[];
  phases: any[];
  currentLifecyclePhase?: string | null;
  productId?: string;
  companyId?: string;
  onDocumentUpdated: (document: any) => void;
  onDocumentsRefresh: () => Promise<DocumentOperationResult>;
  onAddDocumentClick: () => void;
  statusFilter?: string[];
}

export interface DocumentPerformanceMetrics {
  loadTime: number;
  renderTime: number;
  operationCount: number;
  lastOptimization: Date;
}

export interface DocumentCacheEntry {
  data: any;
  timestamp: Date;
  expiresAt: Date;
  version: number;
}
