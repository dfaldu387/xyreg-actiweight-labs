import { supabase } from '@/integrations/supabase/client';
import { getTechnicalFileSectionForClause } from '@/config/technicalFileGapMapping';

/**
 * Auto-links a document to the corresponding Technical File section
 * when it is linked as evidence in a gap analysis clause.
 * 
 * Runs silently (best-effort) — never throws or shows toast.
 */
export async function autoLinkToTechnicalFile(
  gapItemId: string,
  documentId: string,
  productId?: string
): Promise<void> {
  try {
    // If we already have a productId, use it; otherwise look it up from the gap item
    let resolvedProductId = productId;
    let framework: string | null = null;
    let section: string | null = null;

    const { data: gapItem, error: gapError } = await supabase
      .from('gap_analysis_items')
      .select('framework, section, product_id')
      .eq('id', gapItemId)
      .single();

    if (gapError || !gapItem) return;

    framework = gapItem.framework;
    section = gapItem.section;
    if (!resolvedProductId) resolvedProductId = gapItem.product_id ?? undefined;

    if (!framework || !resolvedProductId) return;

    // Resolve the Technical File section ID (e.g. "TF-1")
    const tfSectionId = getTechnicalFileSectionForClause(framework, section ?? undefined);
    if (!tfSectionId) return;

    // Upsert into technical_file_document_links (ignore duplicates)
    await (supabase as any)
      .from('technical_file_document_links')
      .upsert(
        {
          product_id: resolvedProductId,
          section_id: tfSectionId,
          document_id: documentId,
        },
        { onConflict: 'product_id,section_id,document_id', ignoreDuplicates: true }
      );
  } catch {
    // Silent — best-effort sync
  }
}

/**
 * Auto-links multiple documents to the Technical File for a single gap item.
 */
export async function autoLinkMultipleToTechnicalFile(
  gapItemId: string,
  documentIds: string[],
  productId?: string
): Promise<void> {
  if (documentIds.length === 0) return;
  // Run all in parallel, each is best-effort
  await Promise.allSettled(
    documentIds.map(docId => autoLinkToTechnicalFile(gapItemId, docId, productId))
  );
}
