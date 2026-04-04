import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductCompanyGuard } from '@/hooks/useProductCompanyGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Box, AlertTriangle, CheckCircle2, Network } from 'lucide-react';
import { RiskOverviewCard } from '@/components/product/design-risk-controls/RiskOverviewCard';

export default function ProductDesignRiskLandingPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProductDetails(productId || undefined);

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);

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

  if (!productId) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Please navigate to a valid product to view design & risk controls.
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
            { label: "Design & Risk Controls" }
          ]}
          title="Loading..."
          subtitle="Loading design & risk controls..."
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
      label: "Design & Risk Controls"
    }
  ];

  const designRiskTabs = [
    {
      id: "traceability",
      label: "Traceability",
      icon: Network,
      description: "Complete traceability from requirements through V&V",
      color: "from-teal-500 to-cyan-600"
    },
    {
      id: "requirement-specifications",
      label: "Requirements",
      icon: FileText,
      description: "System and software requirements specifications (SRS)",
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "usability-engineering",
      label: "Usability Engineering",
      icon: FileText,
      description: "Usability engineering file per IEC 62366-1",
      color: "from-indigo-500 to-violet-600"
    },
    {
      id: "risk-management",
      label: "Risk Management",
      icon: AlertTriangle,
      description: "Hazard identification, risk analysis and risk control measures",
      color: "from-orange-500 to-red-600"
    },
    {
      id: "verification-validation",
      label: "Verification & Validation",
      icon: CheckCircle2,
      description: "Design verification and validation activities",
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "system-architecture",
      label: "Architecture",
      icon: Box,
      description: "System and software architecture design documentation",
      color: "from-green-500 to-blue-600"
    }
  ];

  const handleTabClick = (tab: typeof designRiskTabs[0]) => {
    navigate(`/app/product/${productId}/design-risk-controls?tab=${tab.id}`);
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${product?.name || 'Product'} Design & Risk Controls`}
        subtitle="Comprehensive design controls and risk management throughout product development"
      />
      
      <div className="px-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="flex items-center justify-between">
                <span>Design & Risk Controls Overview</span>
                <HelpTooltip 
                  content="Manage design controls, risk management activities, and traceability throughout the product development lifecycle. Ensure compliance with ISO 13485, ISO 14971, and regulatory requirements for medical device development."
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Risk Overview Card - Executive Summary */}
              {productId && (
                <RiskOverviewCard productId={productId} />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designRiskTabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleTabClick(tab)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center text-white`}>
                        <tab.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{tab.label}</h3>
                        <p className="text-sm text-muted-foreground">{tab.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
