
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Activity, BarChart3, Workflow, Search, FileText, CheckSquare, GraduationCap, Database, Copy } from "lucide-react";
import { CIAnalyticsService } from "@/services/ciAnalyticsService";
import { CIAnalytics } from "@/types/ci";
import { CITemplateManager } from "@/components/ci-templates/CITemplateManager";
import { CIInstanceManager } from "@/components/ci-instances/CIInstanceManager";
import { CIOrganizedView } from "@/components/ci-management/CIOrganizedView";

interface CIManagementSettingsProps {
  companyId: string;
}

export function CIManagementSettings({ companyId }: CIManagementSettingsProps) {
  const [analytics, setAnalytics] = useState<CIAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!companyId) return;
      
      try {
        const data = await CIAnalyticsService.getCompanyAnalytics(companyId);
        setAnalytics(data);
      } catch (error) {
        console.error("Error loading CI analytics:", error);
        // Set mock data for now
        setAnalytics({
          total_cis: 45,
          by_type: { audit: 12, gap: 15, document: 10, activity: 8, clinical: 0, capa: 0 },
          by_status: { pending: 8, in_progress: 15, completed: 18, blocked: 3, cancelled: 1 },
          overdue_count: 5,
          completion_rate: 75.5,
          average_completion_time: 8.3,
          trending_data: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [companyId]);

  if (!companyId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">No company selected</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading CI analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Instances
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <CIOrganizedView companyId={companyId} />
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <CIOrganizedView companyId={companyId} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compliance Intelligence Overview</CardTitle>
                  <CardDescription>Monitor and manage all CI types across your organization</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create CI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Audit CIs</p>
                        <p className="text-2xl font-bold">{analytics?.by_type.audit || 0}</p>
                      </div>
                      <Search className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Gap CIs</p>
                        <p className="text-2xl font-bold">{analytics?.by_type.gap || 0}</p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Document CIs</p>
                        <p className="text-2xl font-bold">{analytics?.by_type.document || 0}</p>
                      </div>
                      <FileText className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Activity CIs</p>
                        <p className="text-2xl font-bold">{analytics?.by_type.activity || 0}</p>
                      </div>
                      <GraduationCap className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total CIs</p>
                        <p className="text-2xl font-bold">{analytics?.total_cis || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Completion Rate</p>
                        <p className="text-2xl font-bold">{analytics?.completion_rate || 0}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Overdue</p>
                        <p className="text-2xl font-bold text-red-500">{analytics?.overdue_count || 0}</p>
                      </div>
                      <Workflow className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recent CI Activity</h4>
                {[
                  { type: "Audit CI", name: "ISO 13485 Internal Audit", status: "In Progress", priority: "High" },
                  { type: "Gap CI", name: "MDR Gap Analysis Review", status: "Pending Review", priority: "Medium" },
                  { type: "Document CI", name: "Design Control SOP Approval", status: "Under Review", priority: "High" },
                  { type: "Activity CI", name: "Quality Training Session", status: "Completed", priority: "Low" }
                ].map((ci, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{ci.name}</p>
                        <p className="text-sm text-muted-foreground">{ci.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ci.priority === "High" ? "destructive" : ci.priority === "Medium" ? "default" : "secondary"}>
                        {ci.priority}
                      </Badge>
                      <Badge variant={ci.status === "Completed" ? "default" : "secondary"}>
                        {ci.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-cis">
          <Card>
            <CardHeader>
              <CardTitle>Audit CIs</CardTitle>
              <CardDescription>Automated audit scheduling, monitoring, and compliance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <p className="text-sm">Audit CI management will be available here</p>
                <p className="text-xs">Automated audit workflows, scheduling, and progress tracking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gap-cis">
          <Card>
            <CardHeader>
              <CardTitle>Gap Analysis CIs</CardTitle>
              <CardDescription>Automated gap analysis workflows and compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-sm">Gap CI management will be available here</p>
                <p className="text-xs">Automated gap analysis workflows and remediation tracking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document-cis">
          <Card>
            <CardHeader>
              <CardTitle>Document CIs</CardTitle>
              <CardDescription>Document approval workflows and review process automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <p className="text-sm">Document CI management will be available here</p>
                <p className="text-xs">Automated document workflows, approval processes, and review cycles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity-cis">
          <Card>
            <CardHeader>
              <CardTitle>Activity CIs</CardTitle>
              <CardDescription>Training, testing, validation, and other compliance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <p className="text-sm">Activity CI management will be available here</p>
                <p className="text-xs">Training sessions, testing procedures, validation activities, and certifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
