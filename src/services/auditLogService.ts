import { supabase } from '@/integrations/supabase/client';
import type { AuditLogEntry, AuditLogStats, CreateAuditLogData } from '@/types/auditLog';
import { isBrowser, browserName } from 'react-device-detect';
export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  static async createAuditLog(data: CreateAuditLogData): Promise<AuditLogEntry | null> {
    try {
      // Validate required fields to prevent UUID errors
      if (!data.document_id || !data.user_id || !data.company_id || !data.action) {
        console.log('Skipping audit log creation - missing required fields:', {
          document_id: data.document_id,
          user_id: data.user_id,
          company_id: data.company_id,
          action: data.action
        });
        return null;
      }

      // Additional validation for UUID format
      if (data.document_id === '' || data.user_id === '' || data.company_id === '') {
        console.log('Skipping audit log creation - empty UUID fields');
        return null;
      }

      console.log('Inserting audit log data:', data);

      const { data: auditLog, error } = await supabase
        .from('document_audit_logs')
        .insert({
          document_id: data.document_id,
          user_id: data.user_id,
          company_id: data.company_id,
          action: data.action,
          action_details: data.action_details || {},
          session_id: data.session_id,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          duration_seconds: data.duration_seconds,
          page_views: data.page_views,
          annotations_created: data.annotations_created,
          annotations_modified: data.annotations_modified,
          annotations_deleted: data.annotations_deleted,
          comments_added: data.comments_added,
          reviews_created: data.reviews_created,
          device_info: data.device_info || {},
          location_info: data.location_info || {},
          metadata: data.metadata || {}
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
        console.error('Error creating audit log:', error);
        return null;
      }

      console.log('Audit log created successfully:', auditLog);
      return auditLog as unknown as AuditLogEntry;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  /**
   * Get audit logs for a document with user profile information
   */
  static async getAuditLogs(documentId: string, limit = 50, offset = 0): Promise<AuditLogEntry[]> {
    try {
      const { data: auditLogs, error } = await supabase
        .from('document_audit_logs')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return auditLogs as unknown as AuditLogEntry[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics for a document
   */
  static async getAuditStats(documentId: string): Promise<AuditLogStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_document_audit_stats', { document_uuid: documentId });

      if (error) {
        console.error('Error fetching audit stats:', error);
        return null;
      }

      return data[0] as AuditLogStats;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return null;
    }
  }

  /**
   * Create a view audit log entry
   */
  static async logView(documentId: string, companyId: string, sessionId?: string): Promise<void> {

    // Validate input parameters
    if (!documentId || !companyId || documentId === '' || companyId === '') {
      console.log('Skipping view audit log - invalid documentId or companyId:', { documentId, companyId });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found, skipping audit log');
      return;
    }

    console.log('Creating view audit log:', { documentId, companyId, userId: user.id, sessionId });

    try {
      await this.createAuditLog({
        document_id: documentId,
        user_id: user.id,
        company_id: companyId,
        action: 'view',
        session_id: sessionId,
        page_views: 1,
        user_agent: browserName,
        ip_address: await this.getClientIP()
      });
      console.log('View audit log created successfully');
      console.log('View audit log created successfully navigator.userAgent', browserName, isBrowser);
    } catch (error) {
      console.error('Error creating view audit log:', error);
    }
  }

  /**
   * Update session duration for an existing audit log
   */
  static async updateSessionDuration(sessionId: string, durationSeconds: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_audit_logs')
        .update({ duration_seconds: durationSeconds })
        .eq('session_id', sessionId)
        .eq('action', 'view');

      if (error) {
        console.error('Error updating session duration:', error);
      }
    } catch (error) {
      console.error('Error updating session duration:', error);
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
        console.log('IP:', data.ip);
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