import { supabase } from "@/integrations/supabase/client";

export interface ReviewerProduct {
  id: string;
  name: string;
  company_id: string;
  company_name?: string;
  device_category?: string;
  product_platform?: string;
  model_reference?: string;
  status?: string;
  document_count?: number;
}

/**
 * Fetch products that have documents assigned to the user's reviewer groups
 * Documents are linked to reviewer groups via reviewer_group_ids field
 */
export async function getReviewerAssignedProducts(
  userId: string,
  reviewerGroupIds: string[]
): Promise<ReviewerProduct[]> {
  try {
    console.log('[ReviewerProductService] Fetching products for reviewer groups:', reviewerGroupIds);

    if (!userId || reviewerGroupIds.length === 0) {
      console.log('[ReviewerProductService] No user ID or reviewer groups provided');
      return [];
    }

    // Get documents from 'documents' table that match reviewer groups and have products
    const { data: documents, error: documentsError } = await supabase
      .from('phase_assigned_document_template')
      .select('product_id, company_id')
      .or(`reviewer_group_ids.ov.{${reviewerGroupIds.join(',')}},reviewer_user_ids.cs.{${userId}}`)
      .not('product_id', 'is', null);
    console.log("documents", documents);
    if (documentsError) {
      console.error('[ReviewerProductService] Error fetching documents:', documentsError);
      throw documentsError;
    }

    console.log('[ReviewerProductService] Found documents with products:', documents?.length || 0);

    if (!documents || documents.length === 0) {
      console.log('[ReviewerProductService] No products linked to assigned documents');
      return [];
    }

    // Extract unique product IDs and company IDs from documents
    const productIds = [...new Set(documents.map((d: any) => d.product_id).filter(Boolean))];
    const companyIds = [...new Set(documents.map((d: any) => d.company_id).filter(Boolean))];

    console.log('[ReviewerProductService] Found unique product IDs:', productIds.length);

    if (productIds.length === 0) {
      return [];
    }

    // Step 2: Fetch product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        company_id,
        device_category,
        product_platform,
        model_reference,
        status
      `)
      .in('id', productIds)
      .eq('is_archived', false);

    if (productsError) {
      console.error('[ReviewerProductService] Error fetching products:', productsError);
      throw productsError;
    }

    // Step 3: Fetch company names
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds);

    const companyMap = new Map(companies?.map((c: any) => [c.id, c.name]) || []);

    // Step 4: Count documents per product
    const documentCountMap = new Map<string, number>();
    documents.forEach((doc: any) => {
      if (doc.product_id) {
        documentCountMap.set(doc.product_id, (documentCountMap.get(doc.product_id) || 0) + 1);
      }
    });

    // Step 5: Combine data
    const reviewerProducts: ReviewerProduct[] = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      company_id: product.company_id,
      company_name: companyMap.get(product.company_id),
      device_category: product.device_category,
      product_platform: product.product_platform,
      model_reference: product.model_reference,
      status: product.status,
      document_count: documentCountMap.get(product.id) || 0,
    }));

    console.log('[ReviewerProductService] Returning products:', reviewerProducts.length);

    return reviewerProducts;
  } catch (error) {
    console.error('[ReviewerProductService] Error:', error);
    throw error;
  }
}
