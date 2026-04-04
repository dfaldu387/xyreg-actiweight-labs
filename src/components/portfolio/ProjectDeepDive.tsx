import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendIndicator } from "@/components/kpi/TrendIndicator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, FileCheck, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Mock project data
const mockProjects = [
  {
    id: 1,
    name: "Alpha Surgical Suite V3.2",
    completion: 78,
    phase: "V&V Phase",
    trend: "up" as const,
    testVelocity: 23,
    reqVolatility: 2.1,
    riskBurndown: 85,
    approvalCycle: 4.2,
    status: "success" as const
  },
  {
    id: 2,
    name: "Beta Monitoring Platform",
    completion: 45,
    phase: "Design Transfer",
    trend: "down" as const,
    testVelocity: 12,
    reqVolatility: 8.4,
    riskBurndown: 32,
    approvalCycle: 12.1,
    status: "danger" as const
  },
  {
    id: 3,
    name: "Gamma AI Enhancement",
    completion: 92,
    phase: "Market Authorization",
    trend: "up" as const,
    testVelocity: 31,
    reqVolatility: 0.8,
    riskBurndown: 95,
    approvalCycle: 2.1,
    status: "success" as const
  },
  {
    id: 4,
    name: "Delta Diagnostic Module",
    completion: 62,
    phase: "Design Controls",
    trend: "neutral" as const,
    testVelocity: 18,
    reqVolatility: 4.2,
    riskBurndown: 67,
    approvalCycle: 7.8,
    status: "warning" as const
  }
];

const mockRiskData = [
  { week: "W1", identified: 12, mitigated: 8 },
  { week: "W2", identified: 15, mitigated: 11 },
  { week: "W3", identified: 8, mitigated: 14 },
  { week: "W4", identified: 18, mitigated: 9 },
];

export function ProjectDeepDive() {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('portfolioHealth.deepDive.title')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('portfolioHealth.deepDive.executiveScan')}
        </div>
      </div>

      {/* Project Status Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('portfolioHealth.deepDive.statusTracker')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.deepDive.statusTrackerDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge variant="outline">{project.phase}</Badge>
                    <TrendIndicator direction={project.trend} size="sm" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{project.completion}%</div>
                    <div className="text-xs text-muted-foreground">{lang('portfolioHealth.deepDive.complete')}</div>
                  </div>
                </div>
                <Progress
                  value={project.completion}
                  className={`h-2 ${
                    project.status === 'success' ? '[&>div]:bg-success' :
                    project.status === 'warning' ? '[&>div]:bg-warning' :
                    '[&>div]:bg-destructive'
                  }`}
                />

                {/* Key Predictive Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{project.testVelocity}/{lang('portfolioHealth.deepDive.week')}</div>
                      <div className="text-xs text-muted-foreground">{lang('portfolioHealth.deepDive.testVelocity')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{project.reqVolatility}%</div>
                      <div className="text-xs text-muted-foreground">{lang('portfolioHealth.deepDive.reqVolatility')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{project.riskBurndown}%</div>
                      <div className="text-xs text-muted-foreground">{lang('portfolioHealth.deepDive.riskBurndown')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{project.approvalCycle}d</div>
                      <div className="text-xs text-muted-foreground">{lang('portfolioHealth.deepDive.approvalCycle')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Burndown Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('portfolioHealth.deepDive.riskBurndownRate')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.deepDive.riskBurndownDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRiskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="identified"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name={lang('portfolioHealth.deepDive.risksIdentified')}
                />
                <Line
                  type="monotone"
                  dataKey="mitigated"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name={lang('portfolioHealth.deepDive.risksMitigated')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}