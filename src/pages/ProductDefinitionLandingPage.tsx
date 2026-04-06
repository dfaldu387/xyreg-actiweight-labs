import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductDefinitionProgress } from '@/hooks/useProductDefinitionProgress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircularProgress } from '@/components/common/CircularProgress';
import { Info, Target, Settings, QrCode, Shield, Eye } from 'lucide-react';
import { ProductTypeEditor } from '@/components/product/definition/ProductTypeEditor';
import { detectProductType } from '@/utils/productTypeDetection';
import { toast } from 'sonner';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { buildFullDeviceInfoSections } from '@/utils/deviceInfoDocumentBuilder';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProductDefinitionLandingPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, refetch } = useProductDetails(productId || undefined);
  const progressData = useProductDefinitionProgress(productId);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const currentProductType = product ? detectProductType(product) : 'new_product';
  const currentProjectTypes = product?.project_types || [];

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

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (product?.company) {
      navigate(`/app/company/${encodeURIComponent(product.company)}`);
    }
  };

  const handleNavigateToProduct = () => {
    if (productId) {
      navigate(`/app/product/${productId}`);
    }
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
        metadata: { source: 'device-definition-full' },
      };
      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);
      if (!saveResult.success || !saveResult.id) {
        throw new Error(saveResult.error || 'Failed to save studio template');
      }
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

      setDraftDrawerDoc({ id: syncResult.id!, name: docName, type: 'Technical' });
    } catch (err: any) {
      console.error('Create document failed:', err);
      toast.error(`Failed to create document: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  if (!productId) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Please navigate to a valid product to view product definition.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: handleNavigateToClients },
            { label: "Loading...", onClick: () => {} },
            { label: "Loading...", onClick: () => {} },
            { label: "Product Definition" }
          ]}
          title="Loading..."
          subtitle="Loading product definition..."
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    {
      label: "Client Compass",
      onClick: handleNavigateToClients
    },
    {
      label: product?.company || "Company",
      onClick: handleNavigateToCompany
    },
    {
      label: product?.name || "Product",
      onClick: handleNavigateToProduct
    },
    {
      label: "Product Definition"
    }
  ];

  const definitionTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Info,
      description: "Basic product information and key specifications",
      percentage: progressData.overview,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "purpose",
      label: "Intended Purpose",
      icon: Target,
      description: "Clinical indication, target population, and intended use",
      percentage: progressData.purpose,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "basics",
      label: "General",
      icon: Settings,
      description: "Device classification, technology, and general characteristics",
      percentage: progressData.basics,
      color: "from-green-500 to-blue-600"
    },
    {
      id: "identification",
      label: "Identification",
      icon: QrCode,
      description: "Device identifiers, nomenclature, and labeling requirements",
      percentage: progressData.identification,
      color: "from-orange-500 to-red-600"
    },
    {
      id: "regulatory",
      label: "Regulatory",
      icon: Shield,
      description: "Regulatory pathways, predicate devices, and submission strategy",
      percentage: progressData.regulatory,
      color: "from-yellow-500 to-orange-600"
    },
    {
      id: "risk",
      label: "Risk Management",
      icon: Eye,
      description: "Risk analysis, hazard identification, and control measures",
      percentage: progressData.risk,
      color: "from-gray-400 to-slate-600"
    }
  ];

  const handleTabClick = (tab: typeof definitionTabs[0]) => {
    navigate(`/app/product/${productId}/device-information?tab=${tab.id}`);
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${product?.name || 'Product'} Product Definition`}
        subtitle="Comprehensive device specification and characterization"
        onCreateDocument={handleCreateDocument}
        documentStatus={docStatus || 'none'}
      />
      
      <div className="px-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="flex items-center justify-between">
                <span>Product Definition Overview</span>
                <HelpTooltip 
                  content="Product Definition encompasses the comprehensive characterization of your medical device across six critical dimensions. This systematic approach ensures thorough documentation of device specifications, intended use, regulatory requirements, and risk considerations throughout the product lifecycle."
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Product Type & Classification Editor */}
              {product && (
                <ProductTypeEditor
                  productId={productId!}
                  currentProductType={currentProductType}
                  currentProjectTypes={currentProjectTypes}
                  product={product}
                  companyId={product.company_id}
                  companyName={product.company}
                  onUpdate={() => refetch()}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {definitionTabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleTabClick(tab)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center text-white`}>
                          <tab.icon className="h-6 w-6" />
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <h3 className="text-lg font-semibold">{tab.label}</h3>
                          <CircularProgress percentage={tab.percentage} size={50} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
      </div>

      <DocumentDraftDrawer
        open={!!draftDrawerDoc}
        onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
        documentId={draftDrawerDoc?.id || ''}
        documentName={draftDrawerDoc?.name || ''}
        documentType={draftDrawerDoc?.type || ''}
        productId={productId}
        companyId={product?.company_id || ''}
      />
    </div>
  );
}