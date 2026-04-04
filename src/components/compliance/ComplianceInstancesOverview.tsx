import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChartBar, Activity, Calendar, Microscope, ArrowRight } from "lucide-react";
import { useComplianceInstancesOverview } from "@/hooks/useComplianceInstancesOverview";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from 'react-router-dom';
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { useProductDetails } from "@/hooks/useProductDetails";
import { CircularProgress } from '../common/CircularProgress';

interface ComplianceInstancesOverviewProps {
  context: 'company' | 'product';
  companyName?: string;
  productId?: string;
}

export function ComplianceInstancesOverview({
  context,
  companyName,
  productId
}: ComplianceInstancesOverviewProps) {
  const { data, isLoading } = useComplianceInstancesOverview({
    context,
    companyName,
    productId
  });

  // Fetch product details when in product context
  const { data: product, isLoading: isProductLoading } = useProductDetails(productId || undefined);

  if (isLoading || (context === 'product' && isProductLoading)) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const baseUrl = context === 'product'
    ? `/app/product/${productId}`
    : `/app/company/${encodeURIComponent(companyName!)}`;

  const complianceItems = [
    {
      title: 'Documents',
      description: 'Technical files, quality system documentation, and regulatory submissions',
      path: '/documents',
      icon: FileText,
      count: data?.documents || 0,
      total: data?.documentsTotal || 0,
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'Gap Analysis',
      description: 'Standards compliance assessment and regulatory gap identification',
      path: '/gap-analysis',
      icon: ChartBar,
      count: data?.gapAnalysis || 0,
      total: data?.gapAnalysisTotal || 0,
      color: 'from-green-500 to-blue-600'
    },
    {
      title: 'Activities',
      description: 'Quality activities, testing protocols, and compliance tasks',
      path: '/activities',
      icon: Activity,
      count: data?.activities || 0,
      total: data?.activitiesTotal || 0,
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Audits',
      description: 'Internal audits, management reviews, and compliance assessments',
      path: '/audits',
      icon: Calendar,
      count: data?.audits || 0,
      total: data?.auditsTotal || 0,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Clinical Trials',
      description: 'Clinical studies, protocols, enrollment tracking, and trial documentation',
      path: '/clinical-trials',
      icon: Microscope,
      count: data?.clinicalTrials || 0,
      total: data?.clinicalTrialsTotal || 0,
      color: 'from-indigo-500 to-blue-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {complianceItems.map((item) => (
          <Card key={item.title} className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className='flex items-center justify-center gap-4'>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CircularProgress
                      percentage={Math.round(((item.count || 0) / Math.max(item.total || 1, 1)) * 100)}
                      size={50}
                    />
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {item.description}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-bold">
                  {item.count}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {item.total}
                </span>
              </div>
              <Link
                to={`${baseUrl}${item.path}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View Details
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <CircularProgress 
                percentage={Math.round(((data?.documents || 0) / Math.max(data?.documentsTotal || 1, 1)) * 100)}
                size={60}
              />
              <div className="text-sm text-muted-foreground mt-2">Documents Complete</div>
            </div>
            <div className="text-center">
              <CircularProgress
                percentage={Math.round(((data?.gapAnalysis || 0) / Math.max(data?.gapAnalysisTotal || 1, 1)) * 100)}
                size={60}
              />
              <div className="text-sm text-muted-foreground mt-2">Gaps Addressed</div>
            </div>
            <div className="text-center">
              <CircularProgress
                percentage={Math.round(((data?.activities || 0) / Math.max(data?.activitiesTotal || 1, 1)) * 100)}
                size={60}
              />
              <div className="text-sm text-muted-foreground mt-2">Activities Complete</div>
            </div>
            <div className="text-center">
              <CircularProgress
                percentage={Math.round(((data?.audits || 0) / Math.max(data?.auditsTotal || 1, 1)) * 100)}
                size={60}
              />
              <div className="text-sm text-muted-foreground mt-2">Audits Complete</div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}