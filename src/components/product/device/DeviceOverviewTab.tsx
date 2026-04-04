
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Progress } from "@/components/ui/progress";
import { Calendar, Tag, Activity, Clipboard, Building, Link2, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeImageArray, parseImagesFromStorage } from "@/utils/imageDataUtils";
import { MultiMarketStatusDisplay } from "@/components/product/MultiMarketStatusDisplay";
import { EnhancedProductMarket } from "@/types/client";
import { detectProductType } from "@/utils/productTypeDetection";
import { CircularProgress } from '@/components/common/CircularProgress';
import { useQuery } from '@tanstack/react-query';
import { HierarchicalMarketService } from "@/services/hierarchicalMarketService";
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PhaseProgression } from './PhaseProgression';
import { useCompanyActivePhases } from '@/hooks/useCompanyActivePhases';
import { sortPhasesByLogicalOrder } from '@/utils/phaseOrderingUtils';
import { CurrentLifecycleCard } from './CurrentLifecycleCard';
import { useProductPhases } from '@/hooks/useProductPhases';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductUDI } from '@/hooks/useProductUDI';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { FileText } from 'lucide-react';
import { SaveDeviceDefinitionAsDocCIDialog, DeviceDefinitionExportData } from './SaveDeviceDefinitionAsDocCIDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type OverviewFieldKey =
  | 'referenceNumber'
  | 'variantName'
  | 'tradeName'
  | 'emdnCode'
  | 'modelReference'
  | 'udiDi'
  | 'basicUdiDi'
  | 'intendedPurpose'
  | 'medicalDeviceType'
  | 'notifiedBody'
  | 'designFreezeDate'
  | 'regulatoryStatusByMarket';

interface DeviceOverviewTabProps {
  referenceNumber?: string;
  registrationNumber?: string;
  productName?: string;
  tradeName?: string;
  modelReference?: string;
  // NOTE: basicUdiDi and udiDi props are kept for backward compatibility
  // but the component now uses useProductUDI hook as the source of truth
  basicUdiDi?: string;
  udiDi?: string;
  intendedUse?: string;
  deviceCategory?: string;
  conformityAssessmentRoute?: string;
  notifiedBody?: string;
  designFreezeDate?: string | null;
  currentLifecyclePhase?: string;
  projectedLaunchDate?: string | null;
  actualLaunchDate?: string | null;
  images?: string[];
  videos?: string[];
  markets?: EnhancedProductMarket[];
  progress?: number;
  baseProductName?: string;
  productPlatform?: string;
  emdnCode?: string;
  companyId?: string;
  // Product type detection props
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  hasLineExtensions?: boolean;
  // Loading state
  isLoading?: boolean;
  overviewFieldVisibility?: Partial<Record<OverviewFieldKey, boolean>>;
  // Device definition export data
  deviceDefinitionData?: DeviceDefinitionExportData;
  companyName?: string;
}

export function DeviceOverviewTab({
  referenceNumber,
  registrationNumber,
  productName = "Product Name",
  tradeName,
  modelReference,
  // Legacy props - kept for backward compatibility but not used
  basicUdiDi: _legacyBasicUdiDi,
  udiDi: _legacyUdiDi,
  intendedUse,
  deviceCategory,
  notifiedBody: legacyNotifiedBody,
  designFreezeDate,
  currentLifecyclePhase,
  projectedLaunchDate,
  actualLaunchDate,
  images = [],
  videos = [],
  markets = [],
  progress = 0,
  baseProductName,
  productPlatform,
  emdnCode,
  companyId,
  // Product type detection props
  project_types,
  is_line_extension,
  parent_product_id,
  base_product_name,
  hasLineExtensions,
  // Loading state
  isLoading = false,
  overviewFieldVisibility,
  // Device definition export
  deviceDefinitionData,
  companyName,
}: DeviceOverviewTabProps) {
  // Dialog state for Save as Doc CI
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  
  // Get product ID from URL params to fetch effective markets
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  
  // Use the Single Source of Truth for UDI data from UDI Management
  const { displayUdiDi, displayBasicUdiDi, variantCount } = useProductUDI(productId);
  
  // Use the company's notified body from useCompanyInfo (single source of truth)
  const { data: companyInfo } = useCompanyInfo(companyId);
  const nb = companyInfo?.notifiedBody;
  // Format NB number as 4 digits with leading zeros and "NB " prefix
  const formattedNbNumber = nb?.nb_number ? `NB ${String(nb.nb_number).padStart(4, '0')}` : null;
  const companyNotifiedBodyDisplay = nb 
    ? `${nb.name}${formattedNbNumber ? ` (${formattedNbNumber})` : ''}`
    : null;

  // State for Supabase images
  const [supabaseImages, setSupabaseImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);

  // Get company phases for phase progression
  const { activePhases } = useCompanyActivePhases(companyId || null);

  // Get product phases with deadlines for calculating days until next phase
  const { phases: productPhases } = useProductPhases(productId || '', companyId || '');
  // console.log('🏗️ [DeviceOverviewTab] Product phases:', productPhases);
  // Calculate previous and next phases
  const sortedPhases = sortPhasesByLogicalOrder(activePhases);
  const currentPhaseIndex = sortedPhases.findIndex(phase => phase.name === currentLifecyclePhase);
  const previousPhase = currentPhaseIndex > 0 ? sortedPhases[currentPhaseIndex - 1]?.name : undefined;
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < sortedPhases.length - 1
    ? sortedPhases[currentPhaseIndex + 1]?.name
    : undefined;

  // Calculate days until next phase
  const calculateDaysUntilNextPhase = (): number | undefined => {
    if (!nextPhase || !productPhases) return undefined;

    const nextPhaseData = productPhases.find(p => p.name === nextPhase);
    if (!nextPhaseData?.start_date) return undefined;

    const nextPhaseDate = new Date(nextPhaseData.start_date);
    const today = new Date();
    const diffTime = nextPhaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : undefined;
  };

  const daysUntilNextPhase = calculateDaysUntilNextPhase();

  // Calculate current phase start date
  const getCurrentPhaseStartDate = (): string | undefined => {
    if (!currentLifecyclePhase || !productPhases) return undefined;

    const currentPhaseData = productPhases.find(p => p.name === currentLifecyclePhase);
    return currentPhaseData?.start_date;
  };

  const currentPhaseStartDate = getCurrentPhaseStartDate();

  // Use hierarchical market inheritance to get effective markets
  const { data: marketChain } = useQuery({
    queryKey: ['effective-markets', productId],
    queryFn: () => productId ? HierarchicalMarketService.resolveEffectiveMarkets(productId) : Promise.resolve(null),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use effective markets from hierarchical inheritance instead of props
  const effectiveMarkets: EnhancedProductMarket[] = marketChain?.effectiveMarkets || [];

  // Function to fetch Supabase images
  const fetchSupabaseImages = async (productId: string) => {
    try {
      setImageLoading(true);
      // console.log('🏗️ [DeviceOverviewTab] Fetching Supabase images for product:', productId);

      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', {
          search: `${productId}-`,
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error fetching Supabase images:', error.message);
        setImageLoading(false);
        return;
      }

      const imageUrls = data?.map(file => {
        return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
      }) || [];

      // console.log('✅ [DeviceOverviewTab] Supabase images:', imageUrls);
      setSupabaseImages(imageUrls);
      setImageLoading(false);
    } catch (fetchError) {
      console.error('Error fetching Supabase images:', fetchError);
      setImageLoading(false);
    }
  };

  // Fetch Supabase images when productId or images change
  // Single useEffect to prevent duplicate API calls
  useEffect(() => {
    if (productId) {
      fetchSupabaseImages(productId);
    }
  }, [productId, images]);

  // Debug logging
  // console.log('[DeviceOverviewTab] Effective markets:', effectiveMarkets.map(m => `${m.code}:${m.selected}`));

  // console.log('🏗️ [DeviceOverviewTab] Raw images received:', images);

  // Process images with enhanced error handling and repair functionality
  const processedImages = React.useMemo(() => {
    try {
      // console.log('🏗️ [DeviceOverviewTab] Processing images type:', typeof images, Array.isArray(images));
      // console.log('🏗️ [DeviceOverviewTab] Images value:', JSON.stringify(images));
      // console.log('🏗️ [DeviceOverviewTab] Supabase images:', supabaseImages);
      // console.log('🏗️ [DeviceOverviewTab] Image loading state:', imageLoading);
      // console.log('🏗️ [DeviceOverviewTab] Component loading state:', isLoading);

      // If component is actively saving (isLoading), return empty array to show loading state
      if (isLoading) {
        // console.log('🏗️ [DeviceOverviewTab] Component is saving, returning empty array');
        return [];
      }

      // If images prop is empty/undefined, return empty array (data not loaded yet)
      if (!images || images.length === 0) {
        // console.log('🏗️ [DeviceOverviewTab] No images prop data yet, returning empty array');
        return [];
      }

      // If still loading Supabase images, return external images only for now
      if (imageLoading && supabaseImages.length === 0) {
        const externalUrls = sanitizeImageArray(images).filter(url => !url.includes('supabase.co'));
        // console.log('🏗️ [DeviceOverviewTab] Still loading, returning external images only:', externalUrls);
        return externalUrls;
      }

      // Combine Supabase images with external images (same logic as DeviceMediaUpload)
      const supabaseUrls = supabaseImages.filter(url => url.includes('supabase.co'));
      const externalUrls = sanitizeImageArray(images).filter(url => !url.includes('supabase.co'));

      // Remove any external URLs that match deleted Supabase images
      const filteredExternalUrls = externalUrls.filter(externalUrl => {
        if (externalUrl.includes('supabase.co') && externalUrl.includes(`${productId}-`)) {
          return supabaseUrls.includes(externalUrl);
        }
        return true;
      });

      const combinedImages = [...supabaseUrls, ...filteredExternalUrls];
      const allImages = [...new Set(combinedImages)]; // Remove duplicates
      // console.log('🏗️ [DeviceOverviewTab] All images:', allImages);
      return allImages;
    } catch (error) {
      console.error('❌ [DeviceOverviewTab] Error processing images:', error);
      // Fallback to basic sanitization
      const fallback = sanitizeImageArray(images);
      // console.log('🏗️ [DeviceOverviewTab] Fallback images:', fallback);
      return fallback;
    }
  }, [images, supabaseImages, productId, imageLoading, isLoading]);

  // console.log('🏗️ [DeviceOverviewTab] Final processed images for display:', processedImages.length);

  const showField = (key: OverviewFieldKey) =>
    overviewFieldVisibility ? overviewFieldVisibility[key] !== false : true;

  // Detect product type
  const productType = detectProductType({
    project_types,
    is_line_extension,
    parent_product_id
  });

  // Use either baseProductName prop or base_product_name from parent
  const displayBaseProductName = baseProductName || base_product_name;

  // Get platform display text using same logic as DeviceOverviewSection
  const getProductPlatformDisplay = (): string => {
    switch (productType) {
      case 'new_product':
        // NPD: Show platform if assigned, or indicate requirement if used as platform
        if (hasLineExtensions) {
          return productPlatform ? `${productPlatform} ${lang('deviceOverview.platformOriginal')}` : lang('deviceOverview.platformRequired');
        }
        return productPlatform || lang('deviceOverview.na');
      case 'line_extension':
        return productPlatform || lang('deviceOverview.notSpecified');
      case 'existing_product':
        return lang('deviceOverview.na');
      default:
        return lang('deviceOverview.na');
    }
  };

  const platformDisplayText = getProductPlatformDisplay();

  // Determine what to show based on product type
  const shouldShowBaseProduct = productType === 'existing_product' && displayBaseProductName;
  const shouldShowPlatform = (productType === 'line_extension' || (productType === 'new_product' && hasLineExtensions)) && platformDisplayText !== lang('deviceOverview.na');

  return (
    <div className="space-y-6">
      {/* Main Overview Section - Media + Device Information */}
      <div className="flex items-center gap-2 ml-1 mt-3">
        <span className="text-lg font-semibold">
          {lang('deviceOverview.title')}
        </span>
        {deviceDefinitionData && companyId && companyName && productId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowDocCIDialog(true)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save as Document CI</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <CircularProgress percentage={progress || 0} size={40} />
        <div className="flex-1">
          <CurrentLifecycleCard
            currentPhase={currentLifecyclePhase}
            previousPhase={previousPhase}
            nextPhase={nextPhase}
            daysUntilNextPhase={daysUntilNextPhase}
            currentPhaseStartDate={currentPhaseStartDate}
          />
        </div>
        {/* Launch Date Display */}
        {(actualLaunchDate || projectedLaunchDate) && (
          <Card className="ml-auto flex items-center">
            <CardContent className="px-4 py-0 flex items-center justify-center min-h-[80px]">
              <div className="flex items-center gap-2 mt-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />

                <div className="flex flex-col items-center justify-center leading-tight">
                  <p className="text-xs text-muted-foreground m-0">
                    {actualLaunchDate ? lang('deviceOverview.launchDate') : lang('deviceOverview.estimatedLaunch')}
                  </p>

                  <p className="text-sm font-semibold m-0">
                    {actualLaunchDate
                      ? new Date(actualLaunchDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : new Date(projectedLaunchDate!).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Lifecycle Phase - Top Section */}


      {/* Product Media and Device Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {lang('deviceOverview.deviceMedia')}
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductGallery
              images={processedImages}
              videos={sanitizeImageArray(videos)}
              productName={productName}
            />
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang('deviceOverview.deviceInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {showField('referenceNumber') && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=eudamed&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    Registration Number
                  </button>
                  <span className="text-sm">{registrationNumber || referenceNumber || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {showField('variantName') && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=basics&subtab=definition&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.deviceName')}
                  </button>
                  <span className="text-sm">{productName}</span>
                </div>
              )}

              {showField('tradeName') && tradeName && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=general&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.tradeName')}
                  </button>
                  <span className="text-sm">{tradeName}</span>
                </div>
              )}

              {showField('emdnCode') && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=markets-regulatory&subtab=emdn-classification&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.emdnCode')}
                  </button>
                  <span className="text-sm">{emdnCode || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {/* Display base product information for product upgrades */}
              {shouldShowBaseProduct && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium min-w-[120px] text-blue-800">{lang('deviceOverview.baseProduct')}</span>
                  <span className="text-sm text-blue-700">{displayBaseProductName}</span>
                </div>
              )}

              {/* Display product platform for line extensions */}
              {shouldShowPlatform && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium min-w-[120px] text-purple-800">{lang('deviceOverview.productPlatform')}</span>
                  <span className="text-sm text-purple-700">{platformDisplayText}</span>
                </div>
              )}

              {showField('modelReference') && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=basics&subtab=definition&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.modelReference')}
                  </button>
                  <span className="text-sm">{modelReference || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {/* UDI-DI - Always show header, navigate to UDI Management tab */}
              {showField('udiDi') && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=udi&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.udiDi')}
                  </button>
                  {displayUdiDi ? (
                    <span className="text-sm font-mono">{displayUdiDi}</span>
                  ) : variantCount > 1 ? (
                    <button
                      onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=udi&returnTo=overview`)}
                      className="text-sm italic text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {variantCount} variants - see UDI Management
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=udi&returnTo=overview`)}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {lang('deviceOverview.notSpecified')}
                    </button>
                  )}
                </div>
              )}

              {/* Basic UDI-DI - Always show header, navigate to UDI Management tab */}
              {showField('basicUdiDi') && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=udi&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.basicUdiDi')}
                  </button>
                  {displayBasicUdiDi ? (
                    <>
                      <span className="text-sm font-mono flex-1">{displayBasicUdiDi}</span>
                      {/* {companyId && activeCompanyRole && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigate(`/app/company/${companyId}/family/${encodeURIComponent(displayBasicUdiDi)}/dashboard`);
                          }}
                          className="ml-2"
                        >
                          <Layers className="h-4 w-4 mr-2" />
                          {lang('deviceOverview.viewFamily')}
                        </Button>
                      )} */}
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/app/product/${productId}/device-information?tab=identification&identificationSection=udi&returnTo=overview`)}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {lang('deviceOverview.notSpecified')}
                    </button>
                  )}
                </div>
              )}

              {showField('intendedPurpose') && (
                <div className="flex items-start gap-2">
                  <Clipboard className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=purpose&subtab=statement-of-use&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.intendedPurpose')}
                  </button>
                  <span className="text-sm break-words">{intendedUse || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {showField('medicalDeviceType') && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=basics&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.deviceCategory')}
                  </button>
                  <span className="text-sm">{deviceCategory || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {showField('notifiedBody') && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => {
                      const companyName = activeCompanyRole?.companyName;
                      if (companyName) {
                        navigate(`/app/company/${encodeURIComponent(companyName)}/settings?tab=stakeholders&subtab=notified-bodies&returnTo=device-overview&productId=${productId}`);
                      }
                    }}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.notifiedBody')}
                  </button>
                  <span className="text-sm">{companyNotifiedBodyDisplay || legacyNotifiedBody || lang('deviceOverview.notSpecified')}</span>
                </div>
              )}

              {showField('designFreezeDate') && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => navigate(`/app/product/${productId}/device-information?tab=general&returnTo=overview`)}
                    className="text-sm font-medium min-w-[120px] text-left hover:text-primary hover:underline cursor-pointer"
                  >
                    {lang('deviceOverview.designFreezeDate')}
                  </button>
                  <span className="text-sm">
                    {designFreezeDate ? new Date(designFreezeDate).toLocaleDateString() : lang('deviceOverview.notSpecified')}
                  </span>
                </div>
              )}
            </div>

            {/* Multi-Market Regulatory Status */}
            {showField('regulatoryStatusByMarket') && (
              <div className="pt-4 border-t">
                <button
                  onClick={() => navigate(`/app/product/${productId}/device-information?tab=markets-regulatory&returnTo=overview`)}
                  className="text-sm font-medium mb-3 hover:text-primary hover:underline cursor-pointer"
                >
                  {lang('deviceOverview.regulatoryInformation')}
                </button>
                <MultiMarketStatusDisplay 
                  markets={effectiveMarkets} 
                  productId={productId}
                  onMarketClick={(marketCode) => navigate(`/app/product/${productId}/device-information?tab=markets-regulatory&returnTo=overview`)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Information Completion - Only remaining completion section */}
      <div className="grid grid-cols-1 gap-6">
        {/* <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Device Information Completion
              </CardTitle>
              <span className="text-lg font-semibold">{progress}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card> */}
      </div>

      {deviceDefinitionData && companyId && companyName && productId && (
        <SaveDeviceDefinitionAsDocCIDialog
          open={showDocCIDialog}
          onOpenChange={setShowDocCIDialog}
          productId={productId}
          productName={productName}
          companyId={companyId}
          companyName={companyName}
          deviceData={deviceDefinitionData}
        />
      )}
    </div >
  );
}
