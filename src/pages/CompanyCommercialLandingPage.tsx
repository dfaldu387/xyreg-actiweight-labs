import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, BarChart3, Brain, Calculator, DollarSign, Banknote } from 'lucide-react';

export default function CompanyCommercialLandingPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
    }
  };

  if (!companyName) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Company Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Please navigate to a valid company to view commercial strategy.
          </p>
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
      label: decodedCompanyName,
      onClick: handleNavigateToCompany
    },
    {
      label: "Commercial Intelligence"
    }
  ];

  const commercialTabs = [
    {
      id: "strategic-blueprint",
      label: "Strategic Blueprint",
      icon: Brain,
      description: "High-level strategic roadmap aligning product development with business objectives",
      color: "from-rose-500 to-red-600"
    },
    {
      id: "business-canvas",
      label: "Business Canvas",
      icon: Globe,
      description: "Business Model Canvas for structured value proposition and go-to-market analysis",
      color: "from-violet-500 to-purple-600"
    },
    {
      id: "feasibility-studies",
      label: "Viability Studies",
      icon: Calculator,
      description: "Define budgets and revenue projections for product bundles",
      color: "from-cyan-500 to-teal-600"
    },
    {
      id: "market-analysis",
      label: "Market Analysis",
      icon: BarChart3,
      description: "Comprehensive market research, competitive analysis, and intelligence tracking",
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "commercial-performance",
      label: "Commercial Performance",
      icon: Calculator,
      description: "Revenue tracking, financial analytics, and performance management",
      color: "from-green-500 to-blue-600"
    },
    {
      id: "pricing-strategy",
      label: "Pricing Strategy",
      icon: DollarSign,
      description: "Strategic pricing frameworks and market positioning",
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "reimbursement-strategy",
      label: "Global Reimbursement Strategy",
      icon: Globe,
      description: "Market-specific reimbursement pathways, coding strategies, and payer engagement plans",
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "market-access",
      label: "Global Market Access",
      icon: Globe,
      description: "Country-specific market entry strategies, registration pathways, and regulatory requirements by geography",
      color: "from-indigo-500 to-blue-600"
    },
    {
      id: "funding-grants",
      label: "Funding & Grants Navigator",
      icon: Banknote,
      description: "Assess eligibility, track applications, and manage documentation for EU, US, and national funding programmes",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const handleTabClick = (tabId: string) => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/commercial?tab=${tabId}`);
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} Commercial Intelligence`}
        subtitle="Comprehensive strategic growth management and financial analysis"
      />
      
      <div className="px-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="flex items-center justify-between">
                <span>Commercial Intelligence Overview</span>
                <HelpTooltip 
                  content="Manage global strategy for categories, platforms, and models. Set target markets, pricing templates, and strategic positioning at the company level. This comprehensive framework enables data-driven decision making across your entire product portfolio."
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commercialTabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleTabClick(tab.id)}
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