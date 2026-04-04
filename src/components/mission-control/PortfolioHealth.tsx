import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useMissionControlData } from "@/hooks/useMissionControlData";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface PortfolioSummary {
  totalProducts: number;
  onTrack: number;
  needsAttention: number;
  atRisk: number;
}

interface ProductAlert {
  id: string;
  name: string;
  company: string;
  status: "needs-attention" | "at-risk";
  issue: string;
  url?: string;
}

interface PortfolioHealthProps {
  dashboardType?: 'multi-company' | 'single-company' | 'single-product' | 'reviewer';
  companyId?: string;
  productId?: string;
}

export function PortfolioHealth({ dashboardType = 'single-company', companyId, productId }: PortfolioHealthProps = {}) {
  const { portfolioSummary, productAlerts, isLoading } = useMissionControlData({
    dashboardType,
    companyId,
    productId
  });
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track": return "hsl(var(--success))";
      case "needs-attention": return "hsl(var(--warning))";
      case "at-risk": return "hsl(var(--destructive))";
      default: return "hsl(var(--muted))";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "needs-attention": return <AlertTriangle className="h-4 w-4" />;
      case "at-risk": return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const handleProductClick = (product: ProductAlert) => {
    if (product.url) {
      navigate(product.url);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {lang('missionControl.portfolioHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {lang('missionControl.loadingPortfolioData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {lang('missionControl.portfolioHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {lang('missionControl.noPortfolioData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalProducts, onTrack, needsAttention, atRisk } = portfolioSummary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {lang('missionControl.portfolioHealth')}
        </CardTitle>
        <CardDescription>
          {lang('missionControl.overviewOfDevices').replace('{{count}}', String(totalProducts))}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Donut Chart Representation */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="2"
              />
              {/* On Track segment */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getStatusColor("on-track")}
                strokeWidth="2"
                strokeDasharray={`${(onTrack / totalProducts) * 100}, 100`}
              />
              {/* Needs Attention segment */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getStatusColor("needs-attention")}
                strokeWidth="2"
                strokeDasharray={`${(needsAttention / totalProducts) * 100}, 100`}
                strokeDashoffset={`-${(onTrack / totalProducts) * 100}`}
              />
              {/* At Risk segment */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getStatusColor("at-risk")}
                strokeWidth="2"
                strokeDasharray={`${(atRisk / totalProducts) * 100}, 100`}
                strokeDashoffset={`-${((onTrack + needsAttention) / totalProducts) * 100}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalProducts}</div>
                <div className="text-xs text-muted-foreground">{lang('missionControl.device')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor("on-track") }}
              />
              <span className="text-sm">{lang('missionControl.onTrack')}</span>
            </div>
            <span className="text-sm font-medium">{onTrack}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor("needs-attention") }}
              />
              <span className="text-sm">{lang('missionControl.needsAttention')}</span>
            </div>
            <span className="text-sm font-medium">{needsAttention}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor("at-risk") }}
              />
              <span className="text-sm">{lang('missionControl.atRisk')}</span>
            </div>
            <span className="text-sm font-medium">{atRisk}</span>
          </div>
        </div>

        {/* Products Requiring Attention */}
        {productAlerts && productAlerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{lang('missionControl.requiresAttention')}</h4>
            <div className="space-y-2">
              {productAlerts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{product.name}</h5>
                      <p className="text-xs text-muted-foreground">{product.company}</p>
                      <p className="text-xs text-muted-foreground mt-1">{product.issue}</p>
                    </div>
                    <Badge
                      variant={product.status === "at-risk" ? "destructive" : "secondary"}
                      className="ml-2 flex items-center gap-1"
                    >
                      {getStatusIcon(product.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {productAlerts.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  {lang('missionControl.moreDevices').replace('{{count}}', String(productAlerts.length - 3))}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => navigate(dashboardType === 'multi-company' ? '/app/clients' : '/app/products')}
        >
          {dashboardType === 'multi-company' ? lang('missionControl.viewAllCompanies') : lang('missionControl.viewAllDevices')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}