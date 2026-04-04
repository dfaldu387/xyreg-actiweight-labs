import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductCompanyGuard } from '@/hooks/useProductCompanyGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, BarChart3, Calculator, DollarSign, Map, Layers } from 'lucide-react';

export default function ProductBusinessCaseLandingPage() {
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
            Please navigate to a valid product to view business case & strategy.
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
            { label: "Business Case & Strategy" }
          ]}
          title="Loading..."
          subtitle="Loading business case & strategy..."
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
      label: "Business Case"
    }
  ];

  const businessCaseTabs = [
    {
      id: "markets",
      label: "Target Markets",
      icon: Globe,
      description: "Define target markets and regulatory pathways for this product",
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "venture-blueprint",
      label: "Venture Blueprint",
      icon: Map,
      description: "Strategic roadmap and go-to-market planning",
      color: "from-teal-500 to-cyan-600"
    },
    {
      id: "business-canvas",
      label: "Business Canvas",
      icon: Layers,
      description: "AI-generated Business Model Canvas from Venture Blueprint insights",
      color: "from-indigo-500 to-purple-600"
    },
    {
      id: "market-analysis",
      label: "Market Analysis",
      icon: BarChart3,
      description: "Product-specific market research and competitive positioning",
      color: "from-green-500 to-blue-600"
    },
    {
      id: "rnpv",
      label: "rNPV Analysis",
      icon: Calculator,
      description: "Risk-adjusted financial projections and investment analysis",
      directPath: `/app/product/${productId}/business-case?tab=rnpv`,
      color: "from-orange-500 to-red-600"
    },
    {
      id: "pricing-strategy",
      label: "Pricing Strategy",
      icon: DollarSign,
      description: "Product pricing strategy and market positioning",
      color: "from-purple-500 to-pink-600"
    },
    // Pitch Builder moved to Genesis Home
  ];

  const handleTabClick = (tab: typeof businessCaseTabs[0]) => {
    if (tab.directPath) {
      navigate(tab.directPath);
    } else {
      navigate(`/app/product/${productId}/business-case?tab=${tab.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${product?.name || 'Product'} Business Case`}
        subtitle="Comprehensive strategic planning and financial analysis"
      />
      
      <div className="px-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="flex items-center justify-between">
                <span>Business Case Overview</span>
                <HelpTooltip 
                  content="Develop comprehensive strategic growth plan including market analysis, financial projections, and strategic positioning for this specific product. Evaluate market opportunities, assess risks, and create data-driven recommendations for product development and commercialization."
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businessCaseTabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleTabClick(tab)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`min-w-12 h-12 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center text-white`}>
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