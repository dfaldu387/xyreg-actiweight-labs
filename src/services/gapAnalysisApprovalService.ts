import { supabase } from "@/integrations/supabase/client";

export interface ApproveGapAnalysisParams {
  productId: string;
  comments?: string;
}

export interface ApproveGapAnalysisResult {
  success: boolean;
  error?: string;
}

/**
 * Approve gap analysis for a product by updating the first gap analysis item
 * with admin approval information
 */
export async function approveGapAnalysis({
  productId,
  comments
}: ApproveGapAnalysisParams): Promise<ApproveGapAnalysisResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Get the first gap analysis item for this product to update with approval
    const { data: gapItems, error: fetchError } = await supabase
      .from('gap_analysis_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching gap analysis items:', fetchError);
      return {
        success: false,
        error: "Failed to fetch gap analysis items"
      };
    }

    if (!gapItems || gapItems.length === 0) {
      return {
        success: false,
        error: "No gap analysis items found for this product"
      };
    }

    // Update the first item with approval information
    const { error: updateError } = await supabase
      .from('gap_analysis_items')
      .update({
        admin_approved: true,
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
        admin_comments: comments || null
      })
      .eq('id', gapItems[0].id);

    if (updateError) {
      console.error('Error updating gap analysis approval:', updateError);
      return {
        success: false,
        error: "Failed to update approval status"
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in approveGapAnalysis:', error);
    return {
      success: false,
      error: "An unexpected error occurred"
    };
  }
}

/**
 * Check if gap analysis is completed (all items are "Closed" or "N/A")
 */
export function isGapAnalysisCompleted(items: any[]): boolean {
  if (!items || items.length === 0) {
    return false;
  }

  return items.every(item => 
    item.status === "Closed" || 
    item.status === "not_applicable"
  );
}

/**
 * Check if gap analysis is approved (any item has admin_approved = true)
 */
export function isGapAnalysisApproved(items: any[]): boolean {
  if (!items || items.length === 0) {
    return false;
  }

  return items.some(item => item.admin_approved === true);
}