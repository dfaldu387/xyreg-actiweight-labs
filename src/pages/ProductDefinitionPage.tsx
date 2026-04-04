import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildProductBreadcrumbs } from "@/utils/breadcrumbUtils";
import { useProductDetails } from "@/hooks/useProductDetails";
import { DeviceProfiler } from "@/components/product/definition/DeviceProfiler";
import { ProductNavigationTracker } from '@/components/product/ProductNavigationTracker';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useProductCompanyGuard } from '@/hooks/useProductCompanyGuard';

import { GeneralInformationTab } from "@/components/product/definition/GeneralInformationTab";
import { IntendedUseClaimsTab } from "@/components/product/definition/IntendedUseClaimsTab";
import { IdentificationTraceabilityTab } from "@/components/product/definition/IdentificationTraceabilityTab";
import { Toaster } from "sonner";

export default function ProductDefinitionPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  
  const activeTab = searchParams.get('tab') || 'overview';
  const { data: product, isLoading, error } = useProductDetails(productId);
  
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [portfolioName, setPortfolioName] = useState<string>('');
  
  const companyName = activeCompanyRole?.companyName;

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);

  // Fetch portfolio for this product
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!productId) return;
      
      try {
        const { data } = await supabase
          .from('feasibility_portfolio_products')
          .select('portfolio_id, feasibility_portfolios(id, name)')
          .eq('product_id', productId)
          .limit(1);

        if (data && data.length > 0) {
          const portfolioData = data[0].feasibility_portfolios as any;
          setPortfolioId(portfolioData.id);
          setPortfolioName(portfolioData.name);
        }
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };

    loadPortfolio();
  }, [productId]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

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
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <p className="text-muted-foreground">The requested product could not be found.</p>
        </div>
      </div>
    );
  }

  const breadcrumbs = useMemo(() => {
    // Only build breadcrumbs when product data is loaded
    if (!product) {
      return [
        { label: "Client Compass", onClick: handleNavigateToClients },
        { label: "Loading...", onClick: () => {} },
        { label: "Loading...", onClick: () => {} },
        { label: "Product Definition" }
      ];
    }

    return [
      {
        label: "Client Compass",
        onClick: handleNavigateToClients
      },
      {
        label: product.company || "Company",
        onClick: handleNavigateToCompany
      },
      {
        label: product.name || "Product",
        onClick: handleNavigateToProduct
      },
      {
        label: "Product Definition"
      }
    ];
  }, [product, handleNavigateToClients, handleNavigateToCompany, handleNavigateToProduct]);

  return (
    <>
      <ProductNavigationTracker />
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={
            <>
              <span className="text-foreground">{product.name}</span>
              <span className="ml-2 text-company-brand font-bold">Product Definition</span>
            </>
          }
          subtitle="Define product specifications, characteristics, and classification"
        />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
            <div className="space-y-6">
              {/* Horizontal Navigation Tabs */}
              <div className="border-b border-border">
                <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                  <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'overview' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTabChange('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'general' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTabChange('general')}
                  >
                    1. General Information
                  </button>
                  <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'characteristics' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTabChange('characteristics')}
                  >
                    2. Device Characteristics
                  </button>
                  <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'intended-use' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTabChange('intended-use')}
                  >
                    3. Intended Use & Claims
                  </button>
                  <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'identification' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTabChange('identification')}
                  >
                    4. Identification & Traceability
                  </button>
                </nav>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Feasibility Portfolio Badge */}
                  {portfolioId && companyName && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FolderKanban className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-base">Feasibility Portfolio</CardTitle>
                              <CardDescription className="text-sm">{portfolioName}</CardDescription>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/feasibility-portfolios/${portfolioId}`)}
                          >
                            View Business Case
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Media */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-lg">📷</span>
                          Product Media
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-muted rounded-lg mb-4 relative overflow-hidden">
                          <img 
                            src="/lovable-uploads/aaa26c7d-50e6-494b-94d8-a91395512d71.png"
                            alt="Product visualization"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                            1 / 3
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-16 h-16 bg-muted rounded border-2 border-primary">
                            <img 
                              src="/lovable-uploads/aaa26c7d-50e6-494b-94d8-a91395512d71.png"
                              alt="Thumbnail 1"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground">
                            +
                          </div>
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground">
                            +
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Device Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Device Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🏷️ Product Name:</span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🔮 Product Platform:</span>
                          <span className="text-primary font-medium">{product.product_platform || 'Derma Platform A (Original)'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🏷️ Model / Reference:</span>
                          <span className="font-medium">{product.model_version || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">📋 Basic UDI-DI:</span>
                          <span className="font-medium">{product.basic_udi_di || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🎯 Intended Purpose:</span>
                          <span className="font-medium">{product.intended_use || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">⚕️ Medical Device Type:</span>
                          <span className="font-medium">{typeof product.device_type === 'string' ? product.device_type : 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🏛️ Notified Body:</span>
                          <span className="font-medium">Not specified</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">📅 Design Freeze Date:</span>
                          <span className="font-medium">Not specified</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">🔄 Current Lifecycle Phase:</span>
                          <span className="font-medium">{'(03) Requirements & Design Inputs'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Regulatory Status by Market */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Regulatory Status by Market</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-lg">🇪🇺</span>
                            <span className="font-medium">EU</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Class class_j</div>
                          <div className="text-sm text-muted-foreground">Not Set</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-lg">🇺🇸</span>
                            <span className="font-medium">United States</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Not Set</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-lg">🇨🇦</span>
                            <span className="font-medium">CA</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Class lla</div>
                          <div className="text-sm text-muted-foreground">Not Set</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Device Information Completion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          Device Information Completion
                        </span>
                        <span className="text-2xl font-bold">0%</span>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              )}

              {activeTab === 'general' && (
                <GeneralInformationTab
                  productName={product?.name}
                  modelReference={product?.model_version}
                  description={product?.description}
                  deviceCategory={product?.device_category}
                  deviceType={typeof product?.device_type === 'string' ? product.device_type : ''}
                  keyFeatures={(() => {
                    if (!product?.key_features) return [];
                    if (Array.isArray(product.key_features)) return product.key_features;
                    try { return JSON.parse(product.key_features); } catch { return []; }
                  })()}
                  deviceComponents={(() => {
                    if (!product?.device_components) return [];
                    if (Array.isArray(product.device_components)) {
                      return product.device_components.map(c => typeof c === 'string' ? c : c.name || '');
                    }
                    try { return JSON.parse(product.device_components); } catch { return []; }
                  })()}
                  images={product?.image ? [product.image as string] : []}
                  videos={typeof product?.videos === 'string' ? [product.videos] : []}
                  basicUdiDi={product?.basic_udi_di}
                  udiDi={product?.udi_di}
                  udiPi={product?.udi_pi}
                  gtin={product?.gtin}
                  baseProductName={product?.base_product_name}
                  productPlatform={product?.product_platform}
                  project_types={product?.project_types}
                  is_line_extension={product?.is_line_extension}
                  parent_product_id={product?.parent_product_id}
                  hasLineExtensions={false}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'characteristics' && (
                <DeviceProfiler />
              )}

              {activeTab === 'intended-use' && (
                <IntendedUseClaimsTab
                  intendedUse={product?.intended_use}
                  intendedPurposeData={product?.intended_purpose_data ? (typeof product.intended_purpose_data === 'string' ? JSON.parse(product.intended_purpose_data) : product.intended_purpose_data) : {}}
                  clinicalBenefits={product?.clinical_benefits ? (Array.isArray(product.clinical_benefits) ? product.clinical_benefits : JSON.parse(product.clinical_benefits)) : []}
                  intendedUsers={product?.intended_users ? (Array.isArray(product.intended_users) ? product.intended_users : JSON.parse(product.intended_users)) : []}
                  userInstructions={product?.user_instructions ? (typeof product.user_instructions === 'string' ? JSON.parse(product.user_instructions) : product.user_instructions) : {}}
                  isLoading={isLoading}
                />
              )}


              {activeTab === 'identification' && (
                <IdentificationTraceabilityTab 
                  productId={productId} 
                  companyId={product.company_id}
                  productData={product}
                />
              )}

            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}