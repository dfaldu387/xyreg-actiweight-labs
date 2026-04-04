import { supabase } from '@/integrations/supabase/client';
import type { AuditLogEntry } from '@/types/auditLog';

export interface ProductAuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD' | 'SHARE' | 'EXPORT' | 'ADD_REVIEWER';
  entityType: 'DOCUMENT' | 'IMAGE' | 'PRODUCT' | 'CONFIGURATION' | 'REVIEW' | 'COMMENT' | 'REVIEWER';
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  changes?: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  description: string;
  ipAddress?: string;
  userAgent?: string;
  productId: string;
  companyId: string;
  sessionId?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface ProductAuditLogFilters {
  searchTerm?: string;
  actionFilter?: string;
  entityFilter?: string;
  dateFilter?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface ProductAuditLogStats {
  totalEntries: number;
  totalUsers: number;
  totalActions: {
    CREATE: number;
    UPDATE: number;
    DELETE: number;
    VIEW: number;
    DOWNLOAD: number;
    SHARE: number;
    EXPORT: number;
  };
  totalEntities: {
    DOCUMENT: number;
    IMAGE: number;
    PRODUCT: number;
    CONFIGURATION: number;
    REVIEW: number;
    COMMENT: number;
  };
  recentActivity: number;
  averageSessionDuration: number;
}

export class ProductAuditLogService {
  /**
   * Get audit logs for a product with filtering and pagination
   */
  static async getProductAuditLogs(
    productId: string,
    companyId: string,
    filters: ProductAuditLogFilters = {}
  ): Promise<ProductAuditLogEntry[]> {
    try {
      let query = supabase
        .from('product_audit_logs')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('product_id', productId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.actionFilter && filters.actionFilter !== 'all') {
        query = query.eq('action', filters.actionFilter);
      }

      if (filters.entityFilter && filters.entityFilter !== 'all') {
        query = query.eq('entity_type', filters.entityFilter);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Apply date filter
      if (filters.dateFilter && filters.dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (filters.dateFilter) {
          case 'today':
            query = query.gte('created_at', today.toISOString());
            break;
          case 'yesterday':
            query = query.gte('created_at', yesterday.toISOString())
              .lt('created_at', today.toISOString());
            break;
          case 'lastWeek':
            query = query.gte('created_at', lastWeek.toISOString());
            break;
          case 'lastMonth':
            query = query.gte('created_at', lastMonth.toISOString());
            break;
        }
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data: auditLogs, error } = await query;

      if (error) {
        console.error('Error fetching product audit logs:', error);
        return [];
      }

      // Transform the data to match the component interface
      return (auditLogs || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at),
        action: log.action as ProductAuditLogEntry['action'],
        entityType: log.entity_type as ProductAuditLogEntry['entityType'],
        entityName: log.entity_name,
        userId: log.user_id,
        userName: `${log.user_profiles?.first_name || ''} ${log.user_profiles?.last_name || ''}`.trim() || 'Unknown User',
        userEmail: log.user_profiles?.email || 'unknown@example.com',
        changes: (log.changes as ProductAuditLogEntry['changes']) || [],
        description: log.description,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        productId: log.product_id,
        companyId: log.company_id,
        sessionId: log.session_id,
        durationSeconds: log.duration_seconds,
        metadata: (log.metadata as Record<string, any>) || {}
      }));
    } catch (error) {
      console.error('Error fetching product audit logs:', error);
      return [];
    }
  }

  /**
   * Create a new product audit log entry
   */
  static async createProductAuditLog(data: {
    productId: string;
    companyId: string;
    action: ProductAuditLogEntry['action'];
    entityType: ProductAuditLogEntry['entityType'];
    entityName: string;
    description: string;
    changes?: ProductAuditLogEntry['changes'];
    sessionId?: string;
    durationSeconds?: number;
    metadata?: Record<string, any>;
    reason?: string;
  }): Promise<ProductAuditLogEntry | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      const { data: auditLog, error } = await supabase
        .from('product_audit_logs')
        .insert({
          product_id: data.productId,
          company_id: data.companyId,
          user_id: user.id,
          action: data.action,
          entity_type: data.entityType,
          entity_name: data.entityName,
          description: data.description,
          changes: data.changes || [],
          session_id: data.sessionId,
          duration_seconds: data.durationSeconds,
          metadata: data.metadata || {},
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('Error creating product audit log:', error);
        return null;
      }

      return {
        id: auditLog.id,
        timestamp: new Date(auditLog.created_at),
        action: auditLog.action as ProductAuditLogEntry['action'],
        entityType: auditLog.entity_type as ProductAuditLogEntry['entityType'],
        entityName: auditLog.entity_name,
        userId: auditLog.user_id,
        userName: `${auditLog.user_profiles?.first_name || ''} ${auditLog.user_profiles?.last_name || ''}`.trim() || 'Unknown User',
        userEmail: auditLog.user_profiles?.email || 'unknown@example.com',
        changes: (auditLog.changes as ProductAuditLogEntry['changes']) || [],
        description: auditLog.description,
        ipAddress: auditLog.ip_address,
        userAgent: auditLog.user_agent,
        productId: auditLog.product_id,
        companyId: auditLog.company_id,
        sessionId: auditLog.session_id,
        durationSeconds: auditLog.duration_seconds,
        metadata: (auditLog.metadata as Record<string, any>) || {}
      };
    } catch (error) {
      console.error('Error creating product audit log:', error);
      return null;
    }
  }

  /**
   * Get audit log statistics for a product
   */
  static async getProductAuditStats(
    productId: string,
    companyId: string
  ): Promise<ProductAuditLogStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_product_audit_stats', {
          product_uuid: productId,
          company_uuid: companyId
        });

      if (error) {
        console.error('Error fetching product audit stats:', error);
        return null;
      }

      return data[0] as unknown as ProductAuditLogStats;
    } catch (error) {
      console.error('Error fetching product audit stats:', error);
      return null;
    }
  }

  /**
   * Search audit logs with text search
   */
  static async searchProductAuditLogs(
    productId: string,
    companyId: string,
    searchTerm: string,
    filters: Omit<ProductAuditLogFilters, 'searchTerm'> = {}
  ): Promise<ProductAuditLogEntry[]> {
    try {
      let query = supabase
        .from('product_audit_logs')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('product_id', productId)
        .eq('company_id', companyId)
        .or(`entity_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      // Apply additional filters
      if (filters.actionFilter && filters.actionFilter !== 'all') {
        query = query.eq('action', filters.actionFilter);
      }

      if (filters.entityFilter && filters.entityFilter !== 'all') {
        query = query.eq('entity_type', filters.entityFilter);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data: auditLogs, error } = await query;

      if (error) {
        console.error('Error searching product audit logs:', error);
        return [];
      }

      return (auditLogs || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at),
        action: log.action as ProductAuditLogEntry['action'],
        entityType: log.entity_type as ProductAuditLogEntry['entityType'],
        entityName: log.entity_name,
        userId: log.user_id,
        userName: `${log.user_profiles?.first_name || ''} ${log.user_profiles?.last_name || ''}`.trim() || 'Unknown User',
        userEmail: log.user_profiles?.email || 'unknown@example.com',
        changes: (log.changes as ProductAuditLogEntry['changes']) || [],
        description: log.description,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        productId: log.product_id,
        companyId: log.company_id,
        sessionId: log.session_id,
        durationSeconds: log.duration_seconds,
        metadata: (log.metadata as Record<string, any>) || {}
      }));
    } catch (error) {
      console.error('Error searching product audit logs:', error);
      return [];
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportProductAuditLogs(
    productId: string,
    companyId: string,
    filters: ProductAuditLogFilters = {}
  ): Promise<string> {
    try {
      const auditLogs = await this.getProductAuditLogs(productId, companyId, {
        ...filters,
        limit: 10000 // Get all logs for export
      });

      const csvHeaders = [
        'Timestamp',
        'Action',
        'Entity Type',
        'Entity Name',
        'User Name',
        'User Email',
        'Description',
        'IP Address',
        'Session Duration (seconds)'
      ];

      const csvRows = auditLogs.map(log => [
        log.timestamp.toISOString(),
        log.action,
        log.entityType,
        log.entityName,
        log.userName,
        log.userEmail,
        log.description,
        log.ipAddress || '',
        log.durationSeconds || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting product audit logs:', error);
      throw error;
    }
  }

  /**
   * Get client IP address
   */
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();

      if (response.ok) {
        return data.ip;
      } else {
        throw new Error('Failed to fetch IP');
      }
    } catch (error) {
      console.error('Error fetching IP:', error);
      return 'unknown';
    }
  }

  /**
   * Generate a session ID
   */
  static generateSessionId(): string {
    return `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }
} 