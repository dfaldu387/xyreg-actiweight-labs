import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "./KPICard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, Zap, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

// Mock data for project health metrics
const mockTestVelocityData = [
  { week: "W1", velocity: 28, target: 25 },
  { week: "W2", velocity: 31, target: 25 },
  { week: "W3", velocity: 24, target: 25 },
  { week: "W4", velocity: 19, target: 25 },
  { week: "W5", velocity: 15, target: 25 },
  { week: "W6", velocity: 18, target: 25 },
  { week: "W7", velocity: 22, target: 25 },
  { week: "W8", velocity: 26, target: 25 },
];

const mockRequirementVolatility = [
  { month: "Jan", changes: 12, approvals: 45 },
  { month: "Feb", changes: 8, approvals: 52 },
  { month: "Mar", changes: 15, approvals: 38 },
  { month: "Apr", changes: 23, approvals: 29 },
  { month: "May", changes: 31, approvals: 18 },
  { month: "Jun", changes: 18, approvals: 34 },
];

const mockRiskBurndown = [
  { week: "W1", identified: 45, mitigated: 12 },
  { week: "W2", identified: 48, mitigated: 18 },
  { week: "W3", identified: 52, mitigated: 23 },
  { week: "W4", identified: 49, mitigated: 31 },
  { week: "W5", identified: 46, mitigated: 28 },
  { week: "W6", identified: 44, mitigated: 35 },
  { week: "W7", identified: 41, mitigated: 39 },
  { week: "W8", identified: 38, mitigated: 42 },
];

const mockApprovalCycles = [
  { type: "Design Reviews", avgDays: 12, trend: "up" },
  { type: "Risk Assessments", avgDays: 8, trend: "stable" },
  { type: "Test Protocols", avgDays: 15, trend: "down" },
  { type: "Clinical Documents", avgDays: 22, trend: "up" },
];

export function ProjectHealthMetrics() {
  const { lang } = useTranslation();
  // Calculate current metrics
  const currentTestVelocity = 26;
  const targetVelocity = 25;
  const velocityTrend = ((currentTestVelocity - 15) / 15) * 100; // vs worst week

  const currentVolatility = 18;
  const volatilityTrend = ((18 - 31) / 31) * 100; // vs peak

  const activeRisks = 38;
  const riskTrend = ((38 - 52) / 52) * 100; // vs peak

  const avgCycleTime = 14.25;
  const cycleTrend = 8.5; // increase

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('executiveKPI.projectHealthMetrics')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('executiveKPI.realTimeLeadingIndicators')}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={lang('executiveKPI.testVelocity')}
          value={`${currentTestVelocity}/week`}
          subtitle={lang('executiveKPI.testsPassedWeekly')}
          trend={{
            direction: velocityTrend > 0 ? "up" : "down",
            percentage: Math.abs(velocityTrend),
            label: lang('executiveKPI.vsLowPoint')
          }}
          status={currentTestVelocity >= targetVelocity ? "success" : "warning"}
          icon={<Zap className="h-4 w-4" />}
          tooltipContent={{
            formula: "Tests Passed / Time Period",
            description: "Rate of test completions - leading indicator of schedule health"
          }}
        />

        <KPICard
          title={lang('executiveKPI.requirementVolatility')}
          value={`${currentVolatility} ${lang('executiveKPI.changes')}`}
          subtitle={lang('executiveKPI.thisMonth')}
          trend={{
            direction: volatilityTrend < 0 ? "up" : "down",
            percentage: Math.abs(volatilityTrend),
            label: lang('executiveKPI.vsPeakMonth')
          }}
          status={currentVolatility < 20 ? "success" : currentVolatility < 30 ? "warning" : "danger"}
          icon={<Activity className="h-4 w-4" />}
          tooltipContent={{
            formula: "Requirement Changes / Month",
            description: "Frequency of design input changes - high volatility predicts rework and delays"
          }}
        />

        <KPICard
          title={lang('executiveKPI.activeRisks')}
          value={activeRisks}
          subtitle={lang('executiveKPI.openRiskItems')}
          trend={{
            direction: riskTrend < 0 ? "up" : "down",
            percentage: Math.abs(riskTrend),
            label: lang('executiveKPI.vsPeak')
          }}
          status={activeRisks < 40 ? "success" : activeRisks < 50 ? "warning" : "danger"}
          icon={<AlertTriangle className="h-4 w-4" />}
          tooltipContent={{
            formula: "Count of Open Risks (status ≠ Closed)",
            description: "Number of unmitigated risk items requiring attention"
          }}
        />

        <KPICard
          title={lang('executiveKPI.avgApprovalTime')}
          value={`${avgCycleTime} ${lang('executiveKPI.days')}`}
          subtitle={lang('executiveKPI.documentCycleTime')}
          trend={{
            direction: "up",
            percentage: cycleTrend,
            label: lang('executiveKPI.processBottleneck')
          }}
          status="warning"
          icon={<Clock className="h-4 w-4" />}
          tooltipContent={{
            formula: "Σ(Approval Date - Submit Date) / N",
            description: "Average time for document review and approval - climbing times indicate bottlenecks"
          }}
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Velocity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {lang('executiveKPI.testVelocityTrend')}
              <Badge variant={currentTestVelocity >= targetVelocity ? "default" : "destructive"}>
                {currentTestVelocity >= targetVelocity ? lang('executiveKPI.onTarget') : lang('executiveKPI.belowTarget')}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.earlyPredictorSchedule')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTestVelocityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    name="Target"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Actual Velocity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requirement Volatility Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {lang('executiveKPI.requirementVolatility')}
              <Badge variant={currentVolatility < 20 ? "default" : "destructive"}>
                {currentVolatility < 20 ? lang('executiveKPI.stable') : lang('executiveKPI.highVolatility')}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.spikesIndicateInstability')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRequirementVolatility}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="changes" fill="hsl(var(--destructive))" name="Requirement Changes" />
                  <Bar dataKey="approvals" fill="hsl(var(--success))" name="Approvals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Burndown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {lang('executiveKPI.riskBurndownRate')}
              <Badge variant={activeRisks < 40 ? "default" : "destructive"}>
                {activeRisks < 40 ? lang('executiveKPI.underControl') : lang('missionControl.needsAttention')}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.flatTrendPredictsRisks')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRiskBurndown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="identified" 
                    stroke="hsl(var(--destructive))" 
                    name="Risks Identified"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mitigated" 
                    stroke="hsl(var(--success))" 
                    name="Risks Mitigated"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Approval Cycle Times */}
        <Card>
          <CardHeader>
            <CardTitle>{lang('executiveKPI.approvalCycleTimes')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('executiveKPI.climbingCycleTimesIndicateBottlenecks')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockApprovalCycles.map((cycle, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <span className="font-medium">{cycle.type}</span>
                    <div className="text-sm text-muted-foreground">
                      {lang('executiveKPI.average')}: {cycle.avgDays} {lang('executiveKPI.days')}
                    </div>
                  </div>
                  <Badge
                    variant={
                      cycle.trend === "down" ? "default" :
                      cycle.trend === "stable" ? "secondary" : "destructive"
                    }
                  >
                    {cycle.trend === "down" ? lang('executiveKPI.improving') :
                     cycle.trend === "stable" ? lang('executiveKPI.stable') : lang('executiveKPI.bottleneck')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}