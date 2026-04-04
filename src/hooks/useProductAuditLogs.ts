import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductAuditLogService, type ProductAuditLogEntry, type ProductAuditLogFilters, type ProductAuditLogStats } from '@/services/productAuditLogService';

interface UseProductAuditLogsOptions {
  productId: string;
  companyId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseProductAuditLogsReturn {
  auditLogs: ProductAuditLogEntry[];
  filteredLogs: ProductAuditLogEntry[];
  stats: ProductAuditLogStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  totalCount: number;
  filters: ProductAuditLogFilters;
  setFilters: (filters: ProductAuditLogFilters | ((prev: ProductAuditLogFilters) => ProductAuditLogFilters)) => void;
  refreshLogs: () => Promise<void>;
  loadMore: () => Promise<void>;
  exportLogs: () => Promise<string>;
  createAuditLog: (data: {
    action: ProductAuditLogEntry['action'];
    entityType: ProductAuditLogEntry['entityType'];
    entityName: string;
    description: string;
    changes?: ProductAuditLogEntry['changes'];
    sessionId?: string;
    durationSeconds?: number;
    metadata?: Record<string, any>;
  }) => Promise<ProductAuditLogEntry | null>;
}

export function useProductAuditLogs({
  productId,
  companyId,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: UseProductAuditLogsOptions): UseProductAuditLogsReturn {
  const [auditLogs, setAuditLogs] = useState<ProductAuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ProductAuditLogEntry[]>([]);
  const [stats, setStats] = useState<ProductAuditLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ProductAuditLogFilters>({
    limit: 50,
    offset: 0
  });

  // Use ref to access current filters without triggering re-renders
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Load audit logs
  const loadAuditLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const logs = await ProductAuditLogService.getProductAuditLogs(
        productId,
        companyId,
        filtersRef.current
      );

      if (isRefresh) {
        setAuditLogs(prev => {
          const existingIds = new Set(prev.map(log => log.id));
          const newLogs = logs.filter(log => !existingIds.has(log.id));
          return [...newLogs, ...prev];
        });
      } else {
        setAuditLogs(logs);
      }

      setTotalCount(logs.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Error loading audit logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [productId, companyId]); // Removed filters dependency

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const auditStats = await ProductAuditLogService.getProductAuditStats(
        productId,
        companyId
      );
      setStats(auditStats);
    } catch (err) {
      console.error('Error loading audit stats:', err);
    }
  }, [productId, companyId]);

  // Apply filters and search
  useEffect(() => {
    let filtered = auditLogs;

    // Apply search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(log =>
        log.entityName.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        log.userName.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        log.description.toLowerCase().includes(filters.searchTerm!.toLowerCase())
      );
    }

    // Apply action filter
    if (filters.actionFilter && filters.actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === filters.actionFilter);
    }

    // Apply entity type filter
    if (filters.entityFilter && filters.entityFilter !== 'all') {
      filtered = filtered.filter(log => log.entityType === filters.entityFilter);
    }

    // Apply date filter
    if (filters.dateFilter && filters.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        switch (filters.dateFilter) {
          case 'today':
            return log.timestamp >= today;
          case 'yesterday':
            return log.timestamp >= yesterday && log.timestamp < today;
          case 'lastWeek':
            return log.timestamp >= lastWeek;
          case 'lastMonth':
            return log.timestamp >= lastMonth;
          default:
            return true;
        }
      });
    }

    setFilteredLogs(filtered);
  }, [auditLogs, filters]); // Direct dependency on filters is fine here

  // Refresh logs
  const refreshLogs = useCallback(async () => {
    await loadAuditLogs(true);
    await loadStats();
  }, [loadAuditLogs, loadStats]);

  // Load more logs (pagination)
  const loadMore = useCallback(async () => {
    try {
      const currentFilters = filtersRef.current;
      const newOffset = (currentFilters.offset || 0) + (currentFilters.limit || 50);
      const newFilters = { ...currentFilters, offset: newOffset };
      
      const moreLogs = await ProductAuditLogService.getProductAuditLogs(
        productId,
        companyId,
        newFilters
      );

      if (moreLogs.length > 0) {
        setAuditLogs(prev => [...prev, ...moreLogs]);
        setFilters(newFilters);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more logs';
      setError(errorMessage);
      console.error('Error loading more audit logs:', err);
    }
  }, [productId, companyId]); // Removed filters dependency

  // Export logs
  const exportLogs = useCallback(async (): Promise<string> => {
    try {
      return await ProductAuditLogService.exportProductAuditLogs(
        productId,
        companyId,
        filtersRef.current
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export logs';
      setError(errorMessage);
      throw err;
    }
  }, [productId, companyId]); // Removed filters dependency

  // Create audit log
  const createAuditLog = useCallback(async (data: {
    action: ProductAuditLogEntry['action'];
    entityType: ProductAuditLogEntry['entityType'];
    entityName: string;
    description: string;
    changes?: ProductAuditLogEntry['changes'];
    sessionId?: string;
    durationSeconds?: number;
    metadata?: Record<string, any>;
  }): Promise<ProductAuditLogEntry | null> => {
    try {
      const newLog = await ProductAuditLogService.createProductAuditLog({
        productId,
        companyId,
        ...data
      });

      if (newLog) {
        setAuditLogs(prev => [newLog, ...prev]);
        await loadStats(); // Refresh stats
      }

      return newLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create audit log';
      setError(errorMessage);
      console.error('Error creating audit log:', err);
      return null;
    }
  }, [productId, companyId, loadStats]);

  // Initial load
  useEffect(() => {
    loadAuditLogs();
    loadStats();
  }, [loadAuditLogs, loadStats]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshLogs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshLogs]);

  return {
    auditLogs,
    filteredLogs,
    stats,
    isLoading,
    isRefreshing,
    error,
    totalCount,
    filters,
    setFilters,
    refreshLogs,
    loadMore,
    exportLogs,
    createAuditLog
  };
} 