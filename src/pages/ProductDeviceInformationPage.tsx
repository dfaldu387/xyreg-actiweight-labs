import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { toast } from "sonner";
import { DeviceInformationContainer } from "@/components/product/device/DeviceInformationContainer";
import { FieldSuggestion } from "@/services/productDefinitionAIService";
import { InvestorShareFlowWrapper } from "@/components/funnel/InvestorShareFlowWrapper";
import { DocumentDraftDrawer } from "@/components/product/documents/DocumentDraftDrawer";
import { DocumentStudioPersistenceService } from "@/services/documentStudioPersistenceService";

export default function ProductDeviceInformationPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const { data: product, isLoading: isLoadingProduct, error: productError, refetch } = useProductDetails(productId);

  // Calculate market status for badges (MUST be called before any conditional returns)
  const marketStatus = useProductMarketStatus(product?.markets);

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoadingProduct);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
      toast.success('Device information refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh device information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchive = () => {
    toast.info('Archive functionality not yet implemented');
  };

  const handleSuggestionsGenerated = (suggestions: FieldSuggestion[]) => {
    toast.success(`Generated ${suggestions.length} AI field suggestions`);
  };

  const handleCreateDocument = async () => {
    if (!product || !productId || isCreatingDoc) return;
    setIsCreatingDoc(true);
    try {
      const templateIdKey = `DEVICE-DEF-${productId}`;
      const docName = `Device Information — ${product.name || 'Device'}`;

      // Create or update studio template
      const existing = await DocumentStudioPersistenceService.loadTemplate(
        product.company_id!, templateIdKey, productId
      );

      const sections = [
        {
          id: 'device-definition-content',
          title: 'Device Information',
          content: [{ id: 'device-def-1', type: 'paragraph', content: '' }],
          order: 0,
        },
      ];

      const studioData = {
        ...(existing.data?.id ? { id: existing.data.id } : {}),
        company_id: product.company_id!,
        product_id: productId,
        template_id: templateIdKey,
        name: docName,
        type: 'Technical',
        sections,
        metadata: { source: 'device-information-export' },
      };

      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);
      if (!saveResult.success || !saveResult.id) {
        throw new Error(saveResult.error || 'Failed to save studio template');
      }

      // Sync to Document CI (device scope by default)
      const syncResult = await DocumentStudioPersistenceService.syncToDocumentCI({
        companyId: product.company_id!,
        productId: productId,
        name: docName,
        documentReference: templateIdKey,
        documentScope: 'product_document',
      });
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to create Document CI record');
      }

      // Open the drawer immediately
      setDraftDrawerDoc({
        id: syncResult.id!,
        name: docName,
        type: 'Technical',
      });
    } catch (err: any) {
      console.error('Create document failed:', err);
      toast.error(`Failed to create document: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Show loading state while product is loading
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading device information...</p>
        </div>
      </div>
    );
  }

  // Handle product errors
  if (productError) {
    const errorMessage = productError instanceof Error ? productError.message : 
                        typeof productError === 'string' ? productError : 
                        'Failed to load product information';
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Product</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={handleRefresh} 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
            <button 
              onClick={() => navigate('/app')} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing product
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
          <button 
            onClick={() => navigate('/app')} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <InvestorShareFlowWrapper productId={productId!}>
      <div>
         <ProductPageHeader
            product={product}
            subsection="Device Information"
            onSuggestionsGenerated={handleSuggestionsGenerated}
            marketStatus={marketStatus}
            onCreateDocument={handleCreateDocument}
          />

          <DocumentDraftDrawer
            open={!!draftDrawerDoc}
            onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
            documentId={draftDrawerDoc?.id || ''}
            documentName={draftDrawerDoc?.name || ''}
            documentType={draftDrawerDoc?.type || ''}
            productId={productId}
            companyId={product.company_id!}
          />
        <div>
          <div className="w-full py-4">
            <DeviceInformationContainer 
              productId={productId!} 
              companyId={product.company_id!}
              initialTab={searchParams.get('tab') || undefined}
            />
          </div>
        </div>
      </div>
    </InvestorShareFlowWrapper>
  );
}