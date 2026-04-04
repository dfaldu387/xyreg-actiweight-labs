import { supabase } from '@/integrations/supabase/client';

export interface BaselineLockStatus {
  locked: boolean;
  baselineReviewId: string | null;
  baselineDate: string | null;
  reviewTitle: string | null;
}

/**
 * Check if a single object is baselined (locked) via a design review manifest.
 */
export async function isObjectBaselined(objectId: string, _objectType?: string): Promise<BaselineLockStatus> {
  const { data: items, error } = await supabase
    .from('design_review_manifest_items' as any)
    .select('design_review_id, status')
    .eq('object_id', objectId)
    .eq('status', 'baselined')
    .limit(1);

  if (error || !items || items.length === 0) {
    return { locked: false, baselineReviewId: null, baselineDate: null, reviewTitle: null };
  }

  const item = (items as any[])[0];
  const { data: review } = await supabase
    .from('design_reviews' as any)
    .select('title, completed_at')
    .eq('id', item.design_review_id)
    .single();

  const rev = review as any;
  return {
    locked: true,
    baselineReviewId: item.design_review_id,
    baselineDate: rev?.completed_at || null,
    reviewTitle: rev?.title || null,
  };
}

/**
 * Batch-fetch all baselined object IDs for a product.
 * Returns a Set<string> for O(1) lookups in list views.
 */
export async function getBaselinedObjectIds(productId: string): Promise<Set<string>> {
  // Get all design reviews for this product
  const { data: reviews } = await supabase
    .from('design_reviews' as any)
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'completed');

  if (!reviews || reviews.length === 0) return new Set();

  const reviewIds = (reviews as any[]).map(r => r.id);

  // Get all baselined manifest items for those reviews
  const { data: items } = await supabase
    .from('design_review_manifest_items' as any)
    .select('object_id')
    .in('design_review_id', reviewIds)
    .eq('status', 'baselined');

  return new Set((items as any[] || []).map(i => i.object_id));
}
