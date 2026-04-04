import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { useProductDetails } from '@/hooks/useProductDetails';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircularProgress } from '@/components/common/CircularProgress';
import { FileText, BarChart3, Activity, ClipboardCheck, Microscope, AlertTriangle } from 'lucide-react';

export default function ProductComplianceInstancesPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProductDetails(productId || undefined);

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
            Please navigate to a valid product to view compliance instances.
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
            { label: "Compliance Instances" }
          ]}
          title="Loading..."
          subtitle="Loading compliance instances..."
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
      label: "Compliance Instances"
    }
  ];

  const complianceInstanceTabs = [
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      description: "Technical files, quality system documentation, and regulatory submissions",
      status: "172 / 172",
      percentage: 100,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "gap-analysis",
      label: "Gap Analysis",
      icon: BarChart3,
      description: "Standards compliance assessment and regulatory gap identification",
      status: "8 / 12",
      percentage: 67,
      color: "from-green-500 to-blue-600"
    },
    {
      id: "activities",
      label: "Activities",
      icon: Activity,
      description: "Quality activities, testing protocols, and compliance tasks",
      status: "24 / 35",
      percentage: 69,
      color: "from-orange-500 to-red-600"
    },
    {
      id: "audits",
      label: "Audits",
      icon: ClipboardCheck,
      description: "Internal audits, management reviews, and compliance assessments",
      status: "4 / 8",
      percentage: 50,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "clinical-trials",
      label: "Clinical Trials",
      icon: Microscope,
      description: "Clinical studies, protocols, enrollment tracking, and trial documentation",
      status: "2 / 5",
      percentage: 40,
      color: "from-indigo-500 to-blue-600"
    },
    {
      id: "capa",
      label: "CAPA Management",
      icon: AlertTriangle,
      description: "Corrective and preventive actions linked to design controls and post-market data",
      status: "2 / 4",
      percentage: 50,
      color: "from-amber-500 to-orange-600"
    }
  ];

  const handleTabClick = (tabId: string) => {
    navigate(`/app/product/${productId}/${tabId}`);
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${product?.name || 'Product'} Compliance Instances`}
        subtitle="Comprehensive regulatory compliance management"
      />
      
      <div className="px-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="flex items-center justify-between">
                <span>Compliance Instances Overview</span>
                <HelpTooltip 
                  content="XYREG provides a systematic approach to managing medical device regulatory compliance across multiple jurisdictions. Organize compliance requirements into Documents, Gap Analysis, Activities, and Audits for comprehensive regulatory coverage."
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complianceInstanceTabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center text-white`}>
                          <tab.icon className="h-5 w-5" />  
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <h3 className="text-lg font-semibold">{tab.label}</h3>
                          <CircularProgress percentage={tab.percentage} size={50}/>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                      <p className="text-xs text-muted-foreground">{tab.status}</p>
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
