import { supabase } from '@/integrations/supabase/client';
import type { AuditCategory, UnifiedAuditTrailEntry, AuditTrailFilters, FieldChange } from '@/types/auditTrail';

interface CreateAuditTrailData {
  companyId?: string | null;
  userId: string;
  category: AuditCategory;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  reason?: string;
  changes?: FieldChange[];
  actionDetails?: Record<string, any>;
}

export class AuditTrailService {
  // ───── Write Methods ─────

  static async logUserAccessEvent(data: {
    userId: string;
    companyId?: string | null;
    action: 'login' | 'logout' | 'failed_login' | 'role_change' | 'permission_change' | 'account_lockout';
    entityName?: string;
    reason?: string;
    changes?: FieldChange[];
    actionDetails?: Record<string, any>;
  }): Promise<void> {
    await this.createEntry({
      companyId: data.companyId,
      userId: data.userId,
      category: 'user_access_security',
      action: data.action,
      entityType: 'user',
      entityName: data.entityName,
      reason: data.reason || this.defaultReason(data.action),
      changes: data.changes,
      actionDetails: data.actionDetails,
    });
  }

  static async logDocumentRecordEvent(data: {
    userId: string;
    companyId: string;
    action: 'document_created' | 'document_updated' | 'document_deleted' | 'document_status_changed';
    entityType?: string;
    entityId?: string;
    entityName?: string;
    reason?: string;
    changes?: FieldChange[];
    actionDetails?: Record<string, any>;
  }): Promise<void> {
    await this.createEntry({
      companyId: data.companyId,
      userId: data.userId,
      category: 'document_record',
      action: data.action,
      entityType: data.entityType || 'document',
      entityId: data.entityId,
      entityName: data.entityName,
      reason: data.reason || this.defaultReason(data.action),
      changes: data.changes,
      actionDetails: data.actionDetails,
    });
  }

  static async logQualityProcessEvent(data: {
    userId: string;
    companyId: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    reason?: string;
    changes?: FieldChange[];
  }): Promise<void> {
    await this.createEntry({
      companyId: data.companyId,
      userId: data.userId,
      category: 'quality_process',
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      reason: data.reason,
      changes: data.changes,
    });
  }

  static async logESignatureEvent(data: {
    userId: string;
    companyId: string;
    action: 'signature_applied' | 'signature_verified' | 'signature_failed';
    entityType: string;
    entityId?: string;
    entityName?: string;
    reason?: string;
    actionDetails?: Record<string, any>;
  }): Promise<void> {
    await this.createEntry({
      companyId: data.companyId,
      userId: data.userId,
      category: 'e_signature',
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      reason: data.reason,
      actionDetails: data.actionDetails,
    });
  }

  // ───── Read Methods ─────

  static async getUnifiedAuditTrail(
    companyId: string,
    filters: AuditTrailFilters,
    limit: number = 200,
    currentUserId?: string,
    userRole?: string
  ): Promise<UnifiedAuditTrailEntry[]> {
    // Viewer gets nothing
    if (userRole === 'viewer') return [];

    const [docLogs, prodLogs, trailLogs] = await Promise.all([
      this.fetchDocumentLogs(companyId, filters),
      this.fetchProductLogs(companyId, filters),
      this.fetchTrailLogs(companyId, filters),
    ]);

    let all = [...docLogs, ...prodLogs, ...trailLogs];

    // Editor sees own actions only
    if (userRole === 'editor' && currentUserId) {
      all = all.filter(e => e.userId === currentUserId);
    }

    // Category filter
    if (filters.category) {
      all = all.filter(e => e.category === filters.category);
    }

    // Action filter
    if (filters.actionType) {
      all = all.filter(e => e.action === filters.actionType);
    }

    // Entity type filter
    if (filters.entityType) {
      all = all.filter(e => e.entityType.toLowerCase() === filters.entityType!.toLowerCase());
    }

    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      all = all.filter(e =>
        e.entityName.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.userName.toLowerCase().includes(term) ||
        (e.reason && e.reason.toLowerCase().includes(term))
      );
    }

    // Sort by timestamp desc
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return all.slice(0, limit);
  }

  // ───── CSV Export ─────

  static exportCSV(entries: UnifiedAuditTrailEntry[]): string {
    const header = 'Who,Email,What (Action),Entity Type,Entity Name,When,Why,Category,IP Address';
    const rows = entries.map(e => {
      const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      return [
        escape(e.userName),
        escape(e.userEmail),
        escape(e.action),
        escape(e.entityType),
        escape(e.entityName),
        escape(new Date(e.timestamp).toISOString()),
        escape(e.reason),
        escape(e.category),
        escape(e.ipAddress || ''),
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  // ───── Category Mapping ─────

  static categorizeAction(action: string, sourceTable: string): AuditCategory {
    if (sourceTable === 'audit_trail_logs') {
      // Category is stored directly in the table — handled during normalization
      return 'document_record';
    }

    const signatureActions = ['signature_applied', 'signature_verified', 'signature_failed', 'review_decision_made'];
    if (signatureActions.includes(action)) return 'e_signature';

    const accessActions = ['login', 'logout', 'failed_login', 'role_change', 'permission_change', 'account_lockout'];
    if (accessActions.includes(action)) return 'user_access_security';

    const qualityActions = ['capa_created', 'capa_updated', 'capa_closed', 'non_conformance', 'training_completed', 'phase_transition'];
    if (qualityActions.includes(action)) return 'quality_process';

    return 'document_record';
  }

  // ───── Product-Scoped Document Audit Trail ─────

  /**
   * Get document audit trail entries scoped to a specific product/device.
   * Queries all 3 audit tables but filters to only documents belonging to this product.
   */
  static async getProductDocumentAuditTrail(
    productId: string,
    companyId: string,
    filters: AuditTrailFilters,
    limit: number = 200
  ): Promise<UnifiedAuditTrailEntry[]> {
    // Step 1: Get document IDs belonging to this product
    const [padtResult, dstResult] = await Promise.all([
      supabase
        .from('phase_assigned_document_template')
        .select('id')
        .eq('product_id', productId)
        .eq('company_id', companyId),
      supabase
        .from('document_studio_templates')
        .select('id')
        .eq('product_id', productId)
        .eq('company_id', companyId),
    ]);

    const documentIds = [
      ...(padtResult.data || []).map((d: any) => d.id),
      ...(dstResult.data || []).map((d: any) => d.id),
    ];

    // Step 2: Fetch from all sources in parallel
    const promises: Promise<UnifiedAuditTrailEntry[]>[] = [
      this.fetchProductLogsByProductId(productId, companyId, filters),
    ];
    if (documentIds.length > 0) {
      promises.push(this.fetchDocumentLogsByDocIds(companyId, documentIds, filters));
      promises.push(this.fetchTrailLogsByEntityIds(companyId, documentIds, filters));
    }

    const results = await Promise.all(promises);
    let all = results.flat();

    // Client-side search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      all = all.filter(e =>
        e.entityName.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.userName.toLowerCase().includes(term) ||
        (e.reason && e.reason.toLowerCase().includes(term))
      );
    }

    // Sort by timestamp desc
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return all.slice(0, limit);
  }

  // ───── Private Helpers ─────

  private static async createEntry(data: CreateAuditTrailData): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('audit_trail_logs')
        .insert({
          company_id: data.companyId || null,
          user_id: data.userId,
          category: data.category,
          action: data.action,
          entity_type: data.entityType || null,
          entity_id: data.entityId || null,
          entity_name: data.entityName || null,
          reason: data.reason || null,
          changes: data.changes || [],
          action_details: data.actionDetails || {},
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error('[AuditTrailService] Error inserting audit trail entry:', error);
      }
    } catch (err) {
      console.error('[AuditTrailService] Error creating audit trail entry:', err);
    }
  }

  private static async fetchDocumentLogs(companyId: string, filters: AuditTrailFilters): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('document_audit_logs')
        .select(`*, user_profiles(first_name, last_name, email)`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error || !data) return [];

      return (data as any[]).map(row => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        userName: row.user_profiles ? `${row.user_profiles.first_name || ''} ${row.user_profiles.last_name || ''}`.trim() : 'Unknown',
        userEmail: row.user_profiles?.email || '',
        category: this.categorizeAction(row.action, 'document_audit_logs') as AuditCategory,
        action: row.action,
        entityType: row.action_details?.entityType || 'Document',
        entityId: row.document_id,
        entityName: row.action_details?.entityName || row.action_details?.document_name || 'Document',
        timestamp: row.created_at,
        reason: row.reason || row.action_details?.reason || '',
        changes: row.action_details?.changes,
        actionDetails: row.action_details,
        ipAddress: row.ip_address,
        sourceTable: 'document_audit_logs' as const,
      }));
    } catch {
      return [];
    }
  }

  private static async fetchProductLogs(companyId: string, filters: AuditTrailFilters): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('product_audit_logs')
        .select(`*, user_profiles(first_name, last_name, email)`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error || !data) return [];

      return (data as any[]).map(row => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        userName: row.user_profiles ? `${row.user_profiles.first_name || ''} ${row.user_profiles.last_name || ''}`.trim() : 'Unknown',
        userEmail: row.user_profiles?.email || '',
        category: this.categorizeAction(row.action, 'product_audit_logs') as AuditCategory,
        action: row.action,
        entityType: row.entity_type || 'Product',
        entityId: row.product_id,
        entityName: row.entity_name || 'Product',
        timestamp: row.created_at,
        reason: row.reason || row.metadata?.reason || '',
        changes: row.changes,
        actionDetails: row.metadata,
        ipAddress: row.ip_address,
        sourceTable: 'product_audit_logs' as const,
      }));
    } catch {
      return [];
    }
  }

  private static async fetchTrailLogs(companyId: string, filters: AuditTrailFilters): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('audit_trail_logs')
        .select(`*`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());
      if (filters.category) query = query.eq('category', filters.category);

      const { data, error } = await query;
      if (error || !data) return [];

      // For trail logs, we need to fetch user profiles separately
      const userIds = [...new Set((data as any[]).map((r: any) => r.user_id))];
      let userMap: Record<string, { first_name: string; last_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        if (profiles) {
          for (const p of profiles) {
            userMap[p.id] = { first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '' };
          }
        }
      }

      return (data as any[]).map(row => {
        const profile = userMap[row.user_id];
        return {
          id: row.id,
          companyId: row.company_id,
          userId: row.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Unknown',
          userEmail: profile?.email || '',
          category: row.category as AuditCategory,
          action: row.action,
          entityType: row.entity_type || '',
          entityId: row.entity_id,
          entityName: row.entity_name || '',
          timestamp: row.created_at,
          reason: row.reason || '',
          changes: row.changes,
          actionDetails: row.action_details,
          ipAddress: row.ip_address,
          sourceTable: 'audit_trail_logs' as const,
        };
      });
    } catch {
      return [];
    }
  }

  private static async fetchDocumentLogsByDocIds(
    companyId: string,
    documentIds: string[],
    filters: AuditTrailFilters
  ): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('document_audit_logs')
        .select(`*, user_profiles(first_name, last_name, email)`)
        .eq('company_id', companyId)
        .in('document_id', documentIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error || !data) return [];

      return (data as any[]).map(row => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        userName: row.user_profiles ? `${row.user_profiles.first_name || ''} ${row.user_profiles.last_name || ''}`.trim() : 'Unknown',
        userEmail: row.user_profiles?.email || '',
        category: this.categorizeAction(row.action, 'document_audit_logs') as AuditCategory,
        action: row.action,
        entityType: row.action_details?.entityType || 'Document',
        entityId: row.document_id,
        entityName: row.action_details?.entityName || row.action_details?.document_name || 'Document',
        timestamp: row.created_at,
        reason: row.reason || row.action_details?.reason || '',
        changes: row.action_details?.changes,
        actionDetails: row.action_details,
        ipAddress: row.ip_address,
        sourceTable: 'document_audit_logs' as const,
      }));
    } catch {
      return [];
    }
  }

  private static async fetchTrailLogsByEntityIds(
    companyId: string,
    entityIds: string[],
    filters: AuditTrailFilters
  ): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('audit_trail_logs')
        .select(`*`)
        .eq('company_id', companyId)
        .eq('category', 'document_record')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error || !data) return [];

      // Fetch user profiles
      const userIds = [...new Set((data as any[]).map((r: any) => r.user_id))];
      let userMap: Record<string, { first_name: string; last_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        if (profiles) {
          for (const p of profiles) {
            userMap[p.id] = { first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '' };
          }
        }
      }

      return (data as any[]).map(row => {
        const profile = userMap[row.user_id];
        return {
          id: row.id,
          companyId: row.company_id,
          userId: row.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Unknown',
          userEmail: profile?.email || '',
          category: row.category as AuditCategory,
          action: row.action,
          entityType: row.entity_type || 'Document',
          entityId: row.entity_id,
          entityName: row.entity_name || '',
          timestamp: row.created_at,
          reason: row.reason || '',
          changes: row.changes,
          actionDetails: row.action_details,
          ipAddress: row.ip_address,
          sourceTable: 'audit_trail_logs' as const,
        };
      });
    } catch {
      return [];
    }
  }

  private static async fetchProductLogsByProductId(
    productId: string,
    companyId: string,
    filters: AuditTrailFilters
  ): Promise<UnifiedAuditTrailEntry[]> {
    try {
      let query = (supabase as any)
        .from('product_audit_logs')
        .select(`*, user_profiles(first_name, last_name, email)`)
        .eq('product_id', productId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error || !data) return [];

      return (data as any[]).map(row => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        userName: row.user_profiles ? `${row.user_profiles.first_name || ''} ${row.user_profiles.last_name || ''}`.trim() : 'Unknown',
        userEmail: row.user_profiles?.email || '',
        category: this.categorizeAction(row.action, 'product_audit_logs') as AuditCategory,
        action: row.action,
        entityType: row.entity_type || 'Product',
        entityId: row.product_id,
        entityName: row.entity_name || 'Product',
        timestamp: row.created_at,
        reason: row.reason || row.metadata?.reason || '',
        changes: row.changes,
        actionDetails: row.metadata,
        ipAddress: row.ip_address,
        sourceTable: 'product_audit_logs' as const,
      }));
    } catch {
      return [];
    }
  }

  private static defaultReason(action: string): string {
    const reasons: Record<string, string> = {
      login: 'User sign-in',
      logout: 'User sign-out',
      failed_login: 'Authentication failed',
      role_change: 'Role assignment updated',
      permission_change: 'Permissions updated',
      account_lockout: 'Account locked after failed attempts',
      document_created: 'Document created',
      document_updated: 'Document updated',
      document_deleted: 'Document deleted',
      document_status_changed: 'Document status changed',
    };
    return reasons[action] || 'System event';
  }

  private static async getClientIP(): Promise<string> {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip || '';
    } catch {
      return '';
    }
  }
}
