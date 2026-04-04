import { supabase } from '@/integrations/supabase/client';

interface ApproveActivityParams {
  activityId: string;
  comments?: string;
}

interface ApproveActivityResult {
  success: boolean;
  error?: string;
}

/**
 * Approve an activity by updating it with admin approval information
 */
export async function approveActivity({
  activityId,
  comments
}: ApproveActivityParams): Promise<ApproveActivityResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Update the activity with approval information
    const { error: updateError } = await supabase
      .from('activities')
      .update({
        admin_approved: true,
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
        admin_comments: comments || null
      })
      .eq('id', activityId);

    if (updateError) {
      console.error('Error updating activity approval:', updateError);
      return {
        success: false,
        error: "Failed to update approval status"
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in approveActivity:', error);
    return {
      success: false,
      error: "An unexpected error occurred"
    };
  }
} 