import { supabase } from '@/integrations/supabase/client';
import type {
  ESignRequest,
  ESignSigner,
  ESignRecord,
  AuditLogEntry,
  SignatureMeaning,
  SigningOrder,
  AuthMethod,
  RequestStatus,
} from './esign.types';
import { AUDIT_ACTIONS } from './esign.constants';

// Helper to get client IP (best effort from browser)
async function getClientIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

export class ESignService {
  /**
   * Create a new signature request for a document
   */
  static async createSignRequest(
    documentId: string,
    documentHash: string,
    createdBy: string,
    signingOrder: SigningOrder,
    signers: Array<{ userId: string; displayName: string; meaning: SignatureMeaning; orderIndex: number }>
  ): Promise<ESignRequest | null> {
    const cleanId = documentId.replace(/^template-/, '');

    // Insert the request
    const { data: request, error: reqError } = await supabase
      .from('esign_requests')
      .insert({
        document_id: cleanId,
        document_hash: documentHash,
        created_by: createdBy,
        status: 'pending' as RequestStatus,
        signing_order: signingOrder,
      })
      .select()
      .single();

    if (reqError || !request) {
      console.error('[ESign] Failed to create request:', reqError);
      return null;
    }

    // Insert signers
    const signerRows = signers.map((s, i) => ({
      request_id: request.id,
      user_id: s.userId,
      display_name: s.displayName,
      order_index: s.orderIndex ?? i,
      meaning: s.meaning,
      status: signingOrder === 'sequential' && i === 0 ? 'awaiting' : 'pending',
    }));

    const { data: insertedSigners, error: signerError } = await supabase
      .from('esign_signers')
      .insert(signerRows)
      .select();

    if (signerError) {
      console.error('[ESign] Failed to insert signers:', signerError);
    }

    // Update request status to in_progress
    await supabase
      .from('esign_requests')
      .update({ status: 'in_progress' })
      .eq('id', request.id);

    // Log audit event
    await this.logAuditEvent(cleanId, request.id, createdBy, AUDIT_ACTIONS.REQUEST_CREATED, {
      signing_order: signingOrder,
      signers_count: signers.length,
    });

    return {
      ...request,
      status: 'in_progress',
      signers: (insertedSigners || []) as ESignSigner[],
    } as ESignRequest;
  }

  /**
   * Get a signature request by ID with its signers
   */
  static async getSignRequest(requestId: string): Promise<ESignRequest | null> {
    const { data: request, error } = await supabase
      .from('esign_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !request) return null;

    const { data: signers } = await supabase
      .from('esign_signers')
      .select('*')
      .eq('request_id', requestId)
      .order('order_index');

    return { ...request, signers: signers || [] } as ESignRequest;
  }

  /**
   * Get active signature request for a document
   */
  static async getSignRequestByDocumentId(documentId: string): Promise<ESignRequest | null> {
    const cleanId = documentId.replace(/^template-/, '');

    const { data: request, error } = await supabase
      .from('esign_requests')
      .select('*')
      .eq('document_id', cleanId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !request) return null;

    const { data: signers } = await supabase
      .from('esign_signers')
      .select('*')
      .eq('request_id', request.id)
      .order('order_index');

    return { ...request, signers: signers || [] } as ESignRequest;
  }

  /**
   * Apply a signature to a document (immutable record)
   */
  static async signDocument(
    requestId: string,
    signerId: string,
    userId: string,
    documentHash: string,
    meaning: SignatureMeaning,
    authMethod: AuthMethod
  ): Promise<ESignRecord | null> {
    const ip = await getClientIP();
    const userAgent = navigator.userAgent;

    // Insert immutable signature record
    const { data: record, error: recordError } = await supabase
      .from('esign_records')
      .insert({
        request_id: requestId,
        signer_id: signerId,
        user_id: userId,
        document_hash: documentHash,
        meaning,
        ip_address: ip,
        user_agent: userAgent,
        auth_method: authMethod,
      })
      .select()
      .single();

    if (recordError) {
      console.error('[ESign] Failed to create signature record:', recordError);
      return null;
    }

    // Update signer status
    await supabase
      .from('esign_signers')
      .update({ status: 'signed', signed_at: new Date().toISOString() })
      .eq('id', signerId);

    // Check if all signers have signed
    const { data: allSigners } = await supabase
      .from('esign_signers')
      .select('id, status, order_index')
      .eq('request_id', requestId)
      .order('order_index');

    if (allSigners) {
      const allSigned = allSigners.every(s => s.status === 'signed');

      if (allSigned) {
        // All signers complete - mark request as completed
        await supabase
          .from('esign_requests')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        // Get request to log completion
        const { data: req } = await supabase
          .from('esign_requests')
          .select('document_id')
          .eq('id', requestId)
          .single();

        if (req) {
          await this.logAuditEvent(req.document_id, requestId, userId, AUDIT_ACTIONS.REQUEST_COMPLETED, {
            total_signers: allSigners.length,
          });
        }
      } else {
        // For sequential signing, activate the next pending signer
        const { data: request } = await supabase
          .from('esign_requests')
          .select('signing_order')
          .eq('id', requestId)
          .single();

        if (request?.signing_order === 'sequential') {
          const nextPending = allSigners.find(s => s.status === 'pending');
          if (nextPending) {
            await supabase
              .from('esign_signers')
              .update({ status: 'awaiting' })
              .eq('id', nextPending.id);
          }
        }
      }
    }

    // Log audit event
    const { data: req } = await supabase
      .from('esign_requests')
      .select('document_id')
      .eq('id', requestId)
      .single();

    if (req) {
      await this.logAuditEvent(req.document_id, requestId, userId, AUDIT_ACTIONS.SIGNATURE_APPLIED, {
        meaning,
        signer_id: signerId,
        auth_method: authMethod,
      });
    }

    return record as ESignRecord;
  }

  /**
   * Reject a signature
   */
  static async rejectSignature(
    requestId: string,
    signerId: string,
    userId: string,
    reason: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('esign_signers')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', signerId);

    if (error) {
      console.error('[ESign] Failed to reject signature:', error);
      return false;
    }

    const { data: req } = await supabase
      .from('esign_requests')
      .select('document_id')
      .eq('id', requestId)
      .single();

    if (req) {
      await this.logAuditEvent(req.document_id, requestId, userId, AUDIT_ACTIONS.SIGNATURE_REJECTED, {
        signer_id: signerId,
        reason,
      });
    }

    return true;
  }

  /**
   * Log an audit event (append-only)
   */
  static async logAuditEvent(
    documentId: string,
    requestId: string | null,
    userId: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    let ip = 'unknown';
    try {
      ip = await getClientIP();
    } catch { /* ignore */ }

    await supabase.from('esign_audit_log').insert({
      document_id: documentId.replace(/^template-/, ''),
      request_id: requestId,
      user_id: userId,
      action,
      metadata,
      ip_address: ip,
      user_agent: navigator.userAgent,
    });
  }

  /**
   * Get audit log for a document
   */
  static async getAuditLog(documentId: string): Promise<AuditLogEntry[]> {
    const cleanId = documentId.replace(/^template-/, '');

    const { data, error } = await supabase
      .from('esign_audit_log')
      .select('*')
      .eq('document_id', cleanId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ESign] Failed to fetch audit log:', error);
      return [];
    }

    // Enrich with user names
    const userIds = [...new Set((data || []).map(d => d.user_id))];
    const userNames: Record<string, string> = {};

    for (const uid of userIds) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', uid)
        .maybeSingle();

      if (profile) {
        userNames[uid] = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
      }
    }

    return (data || []).map(entry => ({
      ...entry,
      user_name: userNames[entry.user_id] || 'Unknown User',
    })) as AuditLogEntry[];
  }

  /**
   * Compute SHA-256 hash of document content
   */
  static async computeDocumentHash(filePath: string): Promise<string> {
    const cleanPath = filePath.replace(/^template-/, '');
    try {
      const { data, error } = await supabase.storage
        .from('document-templates')
        .download(cleanPath);

      if (error || !data) {
        // Fallback: hash the file path + timestamp as identifier
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(filePath + Date.now()));
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const arrayBuffer = await data.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(filePath));
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  /**
   * Fetch company users for signer assignment
   */
  static async fetchCompanyUsers(companyId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>> {
    const { data, error } = await supabase
      .from('user_company_access')
      .select('user_id, access_level')
      .eq('company_id', companyId);

    if (error || !data) {
      console.error('[ESign] Failed to fetch company users:', error);
      return [];
    }

    const users: Array<{ id: string; name: string; email: string; role: string }> = [];

    for (const access of data) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', access.user_id)
        .maybeSingle();

      if (profile) {
        users.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
          email: profile.email || '',
          role: access.access_level || 'viewer',
        });
      }
    }

    return users;
  }

  /**
   * Send OTP code for email verification
   */
  static async sendOTP(email: string, userId: string): Promise<boolean> {
    const { error } = await supabase.functions.invoke('send-esign-otp', {
      body: { action: 'send', email, userId },
    });

    if (error) {
      console.error('[ESign] Failed to send OTP:', error);
      return false;
    }
    return true;
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(email: string, code: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('send-esign-otp', {
      body: { action: 'verify', email, code },
    });

    if (error) {
      console.error('[ESign] Failed to verify OTP:', error);
      return false;
    }
    return data?.verified === true;
  }
}
