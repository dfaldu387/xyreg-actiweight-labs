import { supabase } from '@/integrations/supabase/client';

interface ApproveAuditParams {
  auditId: string;
  auditType: 'company' | 'product';
  comments?: string;
}

interface ApproveAuditResult {
  success: boolean;
  error?: string;
}

/**
 * Approve an audit by updating it with admin approval information
 */
export async function approveAudit({
  auditId,
  auditType,
  comments
}: ApproveAuditParams): Promise<ApproveAuditResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Determine which table to update based on audit type
    const tableName = auditType === 'company' ? 'company_audits' : 'product_audits';

    // Update the audit with approval information
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        admin_approved: true,
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
        admin_comments: comments || null
      })
      .eq('id', auditId);

    if (updateError) {
      console.error('Error updating audit approval:', updateError);
      return {
        success: false,
        error: "Failed to update approval status"
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in approveAudit:', error);
    return {
      success: false,
      error: "An unexpected error occurred"
    };
  }
} 