import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogEntry } from '@/types/auditLog';

interface UseSuperAdminAuditLogsOptions {
  searchTerm?: string;
  action?: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useSuperAdminAuditLogs({
  searchTerm = '',
  action = '',
  companyId = '',
  startDate,
  endDate,
  limit = 100
}: UseSuperAdminAuditLogsOptions) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build the query for all companies (super admin view)
        let query = supabase
          .from('document_audit_logs')
          .select(`
            *,
            user_profiles (
              first_name,
              last_name,
              email
            ),
            documents (
              name,
              document_type
            ),
            companies (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        // Apply filters
        if (action && action !== 'All') {
          query = query.eq('action', action);
        }

        if (companyId && companyId !== 'All') {
          query = query.eq('company_id', companyId);
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }

        if (searchTerm) {
          // Search in user name, document name, or company name
          query = query.or(`user_profiles.first_name.ilike.%${searchTerm}%,user_profiles.last_name.ilike.%${searchTerm}%,user_profiles.email.ilike.%${searchTerm}%,documents.name.ilike.%${searchTerm}%,companies.name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching super admin audit logs:', error);
          setError(error.message);
          return;
        }

        // Transform the data to match the AuditLogEntry interface
        const transformedLogs: AuditLogEntry[] = (data || []).map((log: any) => ({
          id: log.id,
          document_id: log.document_id,
          user_id: log.user_id,
          company_id: log.company_id,
          action: log.action,
          action_details: log.action_details || {},
          session_id: log.session_id,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at,
          duration_seconds: log.duration_seconds,
          page_views: log.page_views,
          annotations_created: log.annotations_created,
          annotations_modified: log.annotations_modified,
          annotations_deleted: log.annotations_deleted,
          comments_added: log.comments_added,
          reviews_created: log.reviews_created,
          device_info: log.device_info,
          location_info: log.location_info,
          metadata: log.metadata,
          user_profiles: log.user_profiles,
          
          // Legacy/computed properties for backward compatibility
          actionType: getActionTypeDescription(log.action),
          entityType: log.documents?.document_type || 'Document',
          entityId: log.document_id,
          entityName: log.documents?.name || 'Unknown Document',
          description: getActionDescription(log.action, log.documents?.name),
          user: log.user_profiles ? 
            `${log.user_profiles.first_name} ${log.user_profiles.last_name}`.trim() || 
            log.user_profiles.email : 
            'Unknown User',
          date: log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '',
          time: log.created_at ? new Date(log.created_at).toTimeString().split(' ')[0] : '',
          ipAddress: log.ip_address || 'Unknown',
          
          // Add company information for super admin view
          companyName: log.companies?.name || 'Unknown Company'
        }));

        setAuditLogs(transformedLogs);
      } catch (err) {
        console.error('Error in fetchAuditLogs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();
  }, [searchTerm, action, companyId, startDate, endDate, limit]);

  return {
    auditLogs,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true);
      // Trigger re-fetch by updating a dependency
    }
  };
}

function getActionTypeDescription(action: string): string {
  const actionMap: Record<string, string> = {
    'view': 'Document Viewed',
    'edit': 'Document Edited',
    'comment': 'Comment Added',
    'review': 'Review Created',
    'download': 'Document Downloaded',
    'annotate': 'Annotation Added',
    'status_change': 'Status Changed',
    'share': 'Document Shared',
    'export': 'Document Exported'
  };
  
  return actionMap[action] || 'Unknown Action';
}

function getActionDescription(action: string, documentName?: string): string {
  const docName = documentName || 'document';
  
  const descriptions: Record<string, string> = {
    'view': `${docName} was viewed`,
    'edit': `${docName} was edited`,
    'comment': `Comment added to ${docName}`,
    'review': `Review created for ${docName}`,
    'download': `${docName} was downloaded`,
    'annotate': `Annotation added to ${docName}`,
    'status_change': `Status changed for ${docName}`,
    'share': `${docName} was shared`,
    'export': `${docName} was exported`
  };
  
  return descriptions[action] || `Unknown action performed on ${docName}`;
}