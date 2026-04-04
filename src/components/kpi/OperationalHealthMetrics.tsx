import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "./KPICard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Shield, Truck, Users, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Mock data for operational health
const mockQMSData = [
  { month: "Jan", closureRate: 85 },
  { month: "Feb", closureRate: 78 },
  { month: "Mar", closureRate: 82 },
  { month: "Apr", closureRate: 71 },
  { month: "May", closureRate: 68 },
  { month: "Jun", closureRate: 75 },
];

const mockSupplierRisk = [
  { supplier: "MedCorp Inc", risk: 85, scars: 3, status: "high" },
  { supplier: "BioTech Ltd", risk: 45, scars: 1, status: "medium" },
  { supplier: "SafeMed Co", risk: 25, scars: 0, status: "low" },
  { supplier: "TechMed", risk: 72, scars: 2, status: "high" },
  { supplier: "DeviceCo", risk: 38, scars: 1, status: "medium" },
];

const mockReviewerLoad = [
  { name: "Dr. Sarah Chen", reviews: 28, role: "Head of Quality" },
  { name: "Mike Johnson", reviews: 15, role: "VP R&D" },
  { name: "Lisa Wang", reviews: 8, role: "Regulatory Lead" },
  { name: "Tom Rodriguez", reviews: 12, role: "Clinical Lead" },
  { name: "Emma Davis", reviews: 6, role: "Safety Officer" },
];

const mockComplaintTrends = [
  { failure: "Adhesive Failure", rate: 2.3, trend: "up", severity: "high" },
  { failure: "Software Glitch", rate: 1.8, trend: "down", severity: "medium" },
  { failure: "Battery Life", rate: 0.9, trend: "stable", severity: "low" },
  { failure: "Calibration Drift", rate: 3.1, trend: "up", severity: "high" },
];

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export function OperationalHealthMetrics() {
  const { lang } = useTranslation();
  // Calculate current metrics
  const currentQMSClosure = 75;
  const qmsTrend = ((75 - 85) / 85) * 100;
  
  const highRiskSuppliers = mockSupplierRisk.filter(s => s.status === "high").length;
  const totalSuppliers = mockSupplierRisk.length;
  
  const maxReviews = Math.max(...mockReviewerLoad.map(r => r.reviews));
  const bottleneckReviewer = mockReviewerLoad.find(r => r.reviews === maxReviews);
  
  const criticalComplaints = mockComplaintTrends.filter(c => c.severity === "high" && c.trend === "up").length;

  const supplierRiskDistribution = [
    { name: "High Risk", value: mockSupplierRisk.filter(s => s.status === "high").length },
    { name: "Medium Risk", value: mockSupplierRisk.filter(s => s.status === "medium").length },
    { name: "Low Risk", value: mockSupplierRisk.filter(s => s.status === "low").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('executiveKPI.companyOperationalHealth')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('executiveKPI.qmsOperationalBackbone')}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={lang('executiveKPI.qmsHealthIndex')}
          value={`${currentQMSClosure}%`}
          subtitle={lang('executiveKPI.complianceClosureRate')}
          trend={{
            direction: qmsTrend < 0 ? "down" : "up",
            percentage: Math.abs(qmsTrend),
            label: lang('executiveKPI.vsBaseline')
          }}
          status={currentQMSClosure >= 80 ? "success" : currentQMSClosure >= 70 ? "warning" : "danger"}
          icon={<Shield className="h-4 w-4" />}
          tooltipContent={{
            formula: "(Closed CAPAs + NCRs) / Total × 100",
            description: "Rate of quality event closure - declining rates predict audit failures"
          }}
        />

        <KPICard
          title={lang('executiveKPI.supplierRisk')}
          value={`${highRiskSuppliers}/${totalSuppliers}`}
          subtitle={lang('executiveKPI.highRiskSuppliers')}
          trend={{
            direction: "neutral",
            label: lang('executiveKPI.monitoringClosely')
          }}
          status={highRiskSuppliers <= 2 ? "success" : "warning"}
          icon={<Truck className="h-4 w-4" />}
          tooltipContent={{
            formula: "Suppliers with Risk Score > 70",
            description: "Number of critical suppliers with elevated risk based on SCAR history and audit findings"
          }}
        />

        <KPICard
          title={lang('executiveKPI.reviewerBottleneck')}
          value={`${maxReviews} ${lang('executiveKPI.reviews')}`}
          subtitle={bottleneckReviewer?.name || "Unknown"}
          trend={{
            direction: "up",
            percentage: 18,
            label: lang('executiveKPI.workloadIncrease')
          }}
          status={maxReviews > 20 ? "danger" : maxReviews > 15 ? "warning" : "success"}
          icon={<Users className="h-4 w-4" />}
          tooltipContent={{
            formula: "Max(Pending Reviews per Person)",
            description: "Identifies human bottlenecks in approval workflows causing delays"
          }}
        />

        <KPICard
          title={lang('executiveKPI.criticalComplaints')}
          value={criticalComplaints}
          subtitle={lang('executiveKPI.highSeverityTrendingUp')}
          trend={{
            direction: criticalComplaints > 1 ? "up" : "down",
            label: lang('executiveKPI.fieldIssues')
          }}
          status={criticalComplaints === 0 ? "success" : criticalComplaints === 1 ? "warning" : "danger"}
          icon={<AlertCircle className="h-4 w-4" />}
          tooltipContent={{
            formula: "Count(Severity=High AND Trend=Up)",
            description: "Number of high-severity complaint types with increasing trend - spikes indicate potential recalls"
          }}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QMS Health Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {lang('executiveKPI.qmsHealthIndexTrend')}
              <Badge variant={currentQMSClosure >= 80 ? "default" : "destructive"}>
                {currentQMSClosure >= 80 ? lang('executiveKPI.healthy') : lang('executiveKPI.atRisk')}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.decliningClosureRates')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockQMSData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Closure Rate"]} />
                  <Line 
                    type="monotone" 
                    dataKey="closureRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Closure Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('executiveKPI.supplierRiskDistribution')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.riskScoreAggregation')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierRiskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {supplierRiskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reviewer Load Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('executiveKPI.reviewerLoadIndex')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.identifiesHumanBottlenecks')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReviewerLoad.map((reviewer, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{reviewer.name}</span>
                    <span className="text-muted-foreground">{reviewer.reviews} {lang('executiveKPI.reviews')}</span>
                  </div>
                  <Progress
                    value={(reviewer.reviews / maxReviews) * 100}
                    className={`h-2 ${reviewer.reviews > 20 ? 'bg-destructive/20' : reviewer.reviews > 15 ? 'bg-warning/20' : 'bg-success/20'}`}
                  />
                  <div className="text-xs text-muted-foreground">{reviewer.role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complaint Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('executiveKPI.complaintTrendRate')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.perThousandUnits')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockComplaintTrends.map((complaint, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <span className="font-medium">{complaint.failure}</span>
                    <div className="text-sm text-muted-foreground">
                      {lang('executiveKPI.rate')}: {complaint.rate}/1000 {lang('executiveKPI.units')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        complaint.severity === "high" ? "destructive" :
                        complaint.severity === "medium" ? "secondary" : "default"
                      }
                    >
                      {lang(`executiveKPI.${complaint.severity}`)}
                    </Badge>
                    <Badge
                      variant={
                        complaint.trend === "up" ? "destructive" :
                        complaint.trend === "stable" ? "secondary" : "default"
                      }
                    >
                      {complaint.trend === "stable" ? lang('executiveKPI.stable') : lang(`executiveKPI.${complaint.trend}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}