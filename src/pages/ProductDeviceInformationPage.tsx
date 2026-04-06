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
import { buildFullDeviceInfoSections } from "@/utils/deviceInfoDocumentBuilder";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch document status for the Create Document icon color
  const { data: docStatus } = useQuery({
    queryKey: ['device-doc-status', productId, product?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('phase_assigned_document_template')
        .select('status')
        .eq('document_reference', `DEVICE-DEF-FULL-${productId}`)
        .eq('company_id', product!.company_id!)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (!data || data.length === 0) return 'none' as const;
      const s = (data[0].status || '').toLowerCase();
      if (s === 'approved') return 'approved' as const;
      return 'draft' as const;
    },
    enabled: !!productId && !!product?.company_id,
  });

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
      const templateIdKey = `DEVICE-DEF-FULL-${productId}`;
      const docName = `Device Description & Specification — ${product.name || 'Device'}`;
      const ciLookup = await DocumentStudioPersistenceService.getDocumentCIsByReference(
        product.company_id!,
        templateIdKey,
        productId
      );

      if (!ciLookup.success) {
        throw new Error(ciLookup.error || 'Failed to check existing document records');
      }

      const ciIds = (ciLookup.data || []).map((ci) => ci.id);
      const draftLookup = await DocumentStudioPersistenceService.loadBestTemplateForTemplateIds(
        product.company_id!,
        [...ciIds, templateIdKey],
        productId
      );

      if (!draftLookup.success) {
        throw new Error(draftLookup.error || 'Failed to load existing draft');
      }

      const selectedDraft = draftLookup.data;
      const selectedDraftHasSavedContent = DocumentStudioPersistenceService.hasMeaningfulSavedContent(selectedDraft);
      const selectedCIId = ciIds.includes(selectedDraft?.template_id || '')
        ? selectedDraft?.template_id
        : ciIds[0];
      const reusableDraftId = selectedDraft?.id;

      if (selectedDraft && selectedDraftHasSavedContent) {
        if (selectedCIId && selectedDraft.template_id !== selectedCIId) {
          await DocumentStudioPersistenceService.saveTemplate({
            ...selectedDraft,
            id: selectedDraft.id,
            template_id: selectedCIId,
          });
        }

        setDraftDrawerDoc({ id: selectedCIId || selectedDraft.template_id, name: docName, type: 'Technical' });
        return;
      }

      if (selectedCIId) {
        const savedDraft = await DocumentStudioPersistenceService.loadTemplate(
          product.company_id!, selectedCIId, productId
        );
        if (DocumentStudioPersistenceService.hasMeaningfulSavedContent(savedDraft.data)) {
          setDraftDrawerDoc({ id: selectedCIId, name: docName, type: 'Technical' });
          return;
        }
      }

      // 3. No meaningful saved draft — build fresh sections from device data
      const sections = buildFullDeviceInfoSections(product);

      const studioData = {
        id: reusableDraftId,
        company_id: product.company_id!,
        product_id: productId,
        template_id: selectedCIId || selectedDraft?.template_id || templateIdKey,
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

      // Re-save template with CI record ID so the drawer lookup finds it
      await DocumentStudioPersistenceService.saveTemplate({
        ...studioData,
        id: saveResult.id,
        template_id: syncResult.id!,
      });

      // Open the drawer
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
            documentStatus={docStatus || 'none'}
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