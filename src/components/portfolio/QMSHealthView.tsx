import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/kpi/KPICard";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Users, TrendingDown, AlertCircle, Package, FileX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Mock data for QMS health indicators
const mockQMSData = {
  healthIndex: 87.2,
  supplierRisk: 23.4,
  reviewerLoad: [
    { name: "Head of Quality", load: 32, capacity: 25 },
    { name: "VP R&D", load: 18, capacity: 20 },
    { name: "Regulatory Lead", load: 28, capacity: 30 },
    { name: "QA Manager", load: 15, capacity: 25 },
  ],
  complaintRate: 2.3
};

const mockSupplierData = [
  { supplier: "MedCorp Inc", score: 85, scars: 2, status: "Low Risk" },
  { supplier: "TechMed Ltd", score: 42, scars: 8, status: "High Risk" },
  { supplier: "BioSupply Co", score: 71, status: "Medium Risk", scars: 4 },
  { supplier: "PrecisionParts", score: 93, scars: 1, status: "Low Risk" },
];

export function QMSHealthView() {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('portfolioHealth.qms.title')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('portfolioHealth.qms.subtitle')}
        </div>
      </div>

      {/* Primary QMS KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={lang('portfolioHealth.qms.healthIndex')}
          value={`${mockQMSData.healthIndex}%`}
          subtitle={lang('portfolioHealth.qms.healthIndexSubtitle')}
          trend={{
            direction: "up",
            percentage: 3.2,
            label: lang('portfolioHealth.qms.improving')
          }}
          status="success"
          icon={<Shield className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.qms.healthIndexFormula'),
            description: lang('portfolioHealth.qms.healthIndexDescription')
          }}
        />

        <KPICard
          title={lang('portfolioHealth.qms.supplierRiskScore')}
          value={`${mockQMSData.supplierRisk}%`}
          subtitle={lang('portfolioHealth.qms.supplierRiskSubtitle')}
          trend={{
            direction: "up",
            percentage: 5.7,
            label: lang('portfolioHealth.qms.requiresAttention')
          }}
          status="warning"
          icon={<Package className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.qms.supplierRiskFormula'),
            description: lang('portfolioHealth.qms.supplierRiskDescription')
          }}
        />

        <KPICard
          title={lang('portfolioHealth.qms.criticalBottlenecks')}
          value="3"
          subtitle={lang('portfolioHealth.qms.overloadedReviewers')}
          trend={{
            direction: "neutral",
            label: lang('portfolioHealth.qms.monitoring')
          }}
          status="warning"
          icon={<Users className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.qms.bottlenecksFormula'),
            description: lang('portfolioHealth.qms.bottlenecksDescription')
          }}
        />

        <KPICard
          title={lang('portfolioHealth.qms.complaintTrendRate')}
          value={`${mockQMSData.complaintRate}/1K`}
          subtitle={lang('portfolioHealth.qms.complaintSubtitle')}
          trend={{
            direction: "down",
            percentage: -15.2,
            label: lang('portfolioHealth.qms.improving')
          }}
          status="success"
          icon={<TrendingDown className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.qms.complaintFormula'),
            description: lang('portfolioHealth.qms.complaintDescription')
          }}
        />
      </div>

      {/* Reviewer Load Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lang('portfolioHealth.qms.reviewerLoadIndex')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.qms.reviewerLoadDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockQMSData.reviewerLoad.map((reviewer, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{reviewer.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {reviewer.load}/{reviewer.capacity} {lang('portfolioHealth.qms.items')}
                    </span>
                    {reviewer.load > reviewer.capacity && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <Progress
                  value={(reviewer.load / reviewer.capacity) * 100}
                  className={`h-2 ${
                    reviewer.load > reviewer.capacity ? '[&>div]:bg-destructive' :
                    reviewer.load > reviewer.capacity * 0.8 ? '[&>div]:bg-warning' :
                    '[&>div]:bg-success'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supplier Risk Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {lang('portfolioHealth.qms.criticalSupplierAnalysis')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.qms.supplierAnalysisDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSupplierData.map((supplier, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{supplier.supplier}</div>
                    <div className="text-sm text-muted-foreground">
                      {supplier.scars} {lang('portfolioHealth.qms.openScars')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{lang('portfolioHealth.qms.riskScore')}: {supplier.score}</div>
                    <div className={`text-xs ${
                      supplier.status === "High Risk" ? "text-destructive" :
                      supplier.status === "Medium Risk" ? "text-warning" :
                      "text-success"
                    }`}>
                      {supplier.status === "High Risk" ? lang('portfolioHealth.qms.highRisk') :
                       supplier.status === "Medium Risk" ? lang('portfolioHealth.qms.mediumRisk') :
                       lang('portfolioHealth.qms.lowRisk')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}