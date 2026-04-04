import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AuditLogEntry } from '@/types/auditLog';

export interface ComprehensiveAuditLogEntry extends AuditLogEntry {
  source_table: 'document_audit_logs' | 'product_audit_logs';
}

interface UseComprehensiveAuditLogsOptions {
  companyId: string;
  entityType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useComprehensiveAuditLogs({
  companyId,
  entityType,
  userId,
  startDate,
  endDate,
  limit = 100
}: UseComprehensiveAuditLogsOptions) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<ComprehensiveAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !companyId) return;

    const fetchComprehensiveAuditLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch from audit log sources in parallel
        const [documentLogs, productLogs] = await Promise.all([
          fetchDocumentAuditLogs(),
          fetchProductAuditLogs()
        ]);

        // Combine and sort all logs by created_at
        const allLogs = [...documentLogs, ...productLogs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);

        // Apply additional filters
        let filteredLogs = allLogs;

        // Don't filter by entity type at the database level since we handle it in the UI
        // This allows us to have more flexible filtering logic

        if (userId && userId !== 'All') {
          filteredLogs = filteredLogs.filter(log => log.user_id === userId);
        }

        if (startDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.created_at) >= startDate
          );
        }

        if (endDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.created_at) <= endDate
          );
        }

        setAuditLogs(filteredLogs);
      } catch (err) {
        console.error('Error fetching comprehensive audit logs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch document audit logs
    const fetchDocumentAuditLogs = async (): Promise<ComprehensiveAuditLogEntry[]> => {
      const { data, error } = await supabase
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
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching document audit logs:', error);
        return [];
      }

      return (data || []).map((log: any) => ({
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
        source_table: 'document_audit_logs' as const,
        
        // Legacy compatibility fields
        actionType: getActionTypeDescription(log.action),
        entityType: log.documents?.document_type || 'Document',
        entityId: log.document_id,
        entityName: log.documents?.name || 'Unknown Document',
        description: getActionDescription(log.action, log.documents?.name),
        user: log.user_profiles ? 
          (() => {
            const firstName = log.user_profiles.first_name || '';
            const lastName = log.user_profiles.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || log.user_profiles.email || 'Unknown User';
          })() : 
          'Unknown User',
        date: log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '',
        time: log.created_at ? new Date(log.created_at).toTimeString().split(' ')[0] : '',
        ipAddress: log.ip_address || 'Unknown'
      }));
    };

    // Fetch product audit logs
    const fetchProductAuditLogs = async (): Promise<ComprehensiveAuditLogEntry[]> => {
      const { data, error } = await supabase
        .from('product_audit_logs')
        .select(`
          *,
          products (
            name
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching product audit logs:', error);
        return [];
      }

      // Fetch user profiles separately to avoid foreign key issues
      const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))];
      let userProfiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        
        if (profiles) {
          userProfiles = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return (data || []).map((log: any) => {
        const userProfile = userProfiles[log.user_id];
        
        return {
          id: log.id,
          document_id: log.product_id || log.entity_id || '',
          user_id: log.user_id,
          company_id: log.company_id,
          action: log.action,
          action_details: { entity_type: log.entity_type, description: log.description },
          session_id: null,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at,
          duration_seconds: log.duration_seconds,
          page_views: null,
          annotations_created: null,
          annotations_modified: null,
          annotations_deleted: null,
          comments_added: null,
          reviews_created: null,
          device_info: null,
          location_info: null,
          metadata: log.metadata || {},
          user_profiles: userProfile,
          source_table: 'product_audit_logs' as const,
          
          // Legacy compatibility fields
          actionType: getActionTypeDescription(log.action),
          entityType: log.entity_type || 'Product',
          entityId: log.product_id || log.entity_id,
          entityName: log.entity_name || log.products?.name || 'Unknown Product',
          description: log.description || getActionDescription(log.action, log.entity_name),
          user: userProfile ? 
            (() => {
              const firstName = userProfile.first_name || '';
              const lastName = userProfile.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              return fullName || userProfile.email || 'Unknown User';
            })() : 
            'Unknown User',
          date: log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '',
          time: log.created_at ? new Date(log.created_at).toTimeString().split(' ')[0] : '',
          ipAddress: log.ip_address || 'N/A'
        };
      });
    };


    fetchComprehensiveAuditLogs();

    // Set up real-time subscriptions for audit tables
    const channels = [
      supabase
        .channel('document-audit-logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'document_audit_logs',
            filter: `company_id=eq.${companyId}`
          },
          () => fetchComprehensiveAuditLogs()
        )
        .subscribe(),
      
      supabase
        .channel('product-audit-logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'product_audit_logs',
            filter: `company_id=eq.${companyId}`
          },
          () => fetchComprehensiveAuditLogs()
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id, companyId, entityType, userId, startDate, endDate, limit]);

  return {
    auditLogs,
    isLoading,
    error,
    refetch: () => {
      if (user?.id && companyId) {
        setIsLoading(true);
      }
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
    'export': 'Document Exported',
    'reviewer_assigned': 'Reviewer Assigned',
    'reviewer_status_changed': 'Review Status Changed',
    'review_decision_made': 'Review Decision Made',
    'CREATE': 'Created',
    'UPDATE': 'Updated',
    'DELETE': 'Deleted'
  };
  
  return actionMap[action] || action;
}

function getActionDescription(action: string, entityName?: string): string {
  const name = entityName || 'entity';
  
  const descriptions: Record<string, string> = {
    'view': `${name} was viewed`,
    'edit': `${name} was edited`,
    'comment': `Comment added to ${name}`,
    'review': `Review created for ${name}`,
    'download': `${name} was downloaded`,
    'annotate': `Annotation added to ${name}`,
    'status_change': `Status changed for ${name}`,
    'share': `${name} was shared`,
    'export': `${name} was exported`,
    'reviewer_assigned': `${name} was assigned to a reviewer group`,
    'reviewer_status_changed': `Review status changed for ${name}`,
    'review_decision_made': `Review decision made for ${name}`,
    'CREATE': `${name} was created`,
    'UPDATE': `${name} was updated`,
    'DELETE': `${name} was deleted`
  };
  
  return descriptions[action] || `${action} performed on ${name}`;
}