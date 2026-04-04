
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  BarChart3,
  Workflow,
  FileText,
  ClipboardList,
  Search
} from "lucide-react";
import { usePhaseCIData } from "@/hooks/usePhaseCIData";
import { useProductDetails } from "@/hooks/useProductDetails";
import { CircularProgress } from "@/components/common/CircularProgress";
import { useTranslation } from "@/hooks/useTranslation";

interface CIOperationsPanelProps {
  productId: string;
  companyId: string;
}

export function CIOperationsPanel({ productId, companyId }: CIOperationsPanelProps) {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get current phase from product details
  const { data: product } = useProductDetails(productId);
  const currentPhaseName = product?.current_lifecycle_phase || '';
  
  // Fetch current phase CI data - we need to get the phase ID from the name
  const [currentPhaseId, setCurrentPhaseId] = React.useState<string>('');
  
  React.useEffect(() => {
    const fetchPhaseId = async () => {
      if (!currentPhaseName || !companyId) return;
      
      const { data } = await import('@/integrations/supabase/client').then(m => 
        m.supabase
          .from('phases')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', currentPhaseName)
          .maybeSingle()
      );
      
      if (data) {
        setCurrentPhaseId(data.id);
      }
    };
    
    fetchPhaseId();
  }, [currentPhaseName, companyId]);
  
  const { data: phaseData, isLoading } = usePhaseCIData(
    currentPhaseId, 
    productId, 
    companyId
  );

  // Calculate completion percentages
  const documentCompletion = phaseData.documents.total > 0
    ? Math.round((phaseData.documents.completed / phaseData.documents.total) * 100)
    : 0;
  
  const gapAnalysisCompletion = phaseData.gapAnalysis.total > 0
    ? Math.round((phaseData.gapAnalysis.completed / phaseData.gapAnalysis.total) * 100)
    : 0;

  const activitiesTotal = phaseData.activities.length;
  const activitiesCompleted = phaseData.activities.filter(a => 
    ['completed', 'Completed'].includes(a.status)
  ).length;
  const activitiesCompletion = activitiesTotal > 0
    ? Math.round((activitiesCompleted / activitiesTotal) * 100)
    : 0;

  const auditsTotal = phaseData.audits.length;
  const auditsCompleted = phaseData.audits.filter(a => 
    ['completed', 'Completed'].includes(a.status)
  ).length;
  const auditsCompletion = auditsTotal > 0
    ? Math.round((auditsCompleted / auditsTotal) * 100)
    : 0;
  
  // Overall completion
  const totalItems = phaseData.documents.total + phaseData.gapAnalysis.total + activitiesTotal + auditsTotal;
  const completedItems = phaseData.documents.completed + phaseData.gapAnalysis.completed + activitiesCompleted + auditsCompleted;
  const overallCompletion = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {lang('ciOperations.title')}
            </CardTitle>
            <CardDescription>{lang('ciOperations.description')}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {lang('ciOperations.score')} {overallCompletion}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{lang('ciOperations.overview')}</TabsTrigger>
            <TabsTrigger value="workflows">{lang('ciOperations.workflows')}</TabsTrigger>
            <TabsTrigger value="insights">{lang('ciOperations.insights')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Current Phase CI Data Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Documents Card */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-2xl font-bold">
                      {phaseData.documents.completed}/{phaseData.documents.total}
                    </div>
                    <div className="text-xs text-muted-foreground">{lang('ciOperations.documents')}</div>
                    <CircularProgress percentage={documentCompletion} size={40} />
                    <div className="text-xs text-muted-foreground">
                      {lang('ciOperations.pendingOverdue')
                        .replace('{{pending}}', String(phaseData.documents.pending))
                        .replace('{{overdue}}', String(phaseData.documents.overdue))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gap Analysis Card */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div className="text-2xl font-bold">
                      {phaseData.gapAnalysis.completed}/{phaseData.gapAnalysis.total}
                    </div>
                    <div className="text-xs text-muted-foreground">{lang('ciOperations.gapAnalysis')}</div>
                    <CircularProgress percentage={gapAnalysisCompletion} size={40} />
                    <div className="text-xs text-muted-foreground">
                      {lang('ciOperations.pendingOverdue')
                        .replace('{{pending}}', String(phaseData.gapAnalysis.pending))
                        .replace('{{overdue}}', String(phaseData.gapAnalysis.overdue))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activities Card */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Activity className="h-5 w-5 text-info" />
                    <div className="text-2xl font-bold">
                      {activitiesCompleted}/{activitiesTotal}
                    </div>
                    <div className="text-xs text-muted-foreground">{lang('ciOperations.activities')}</div>
                    <CircularProgress percentage={activitiesCompletion} size={40} />
                  </div>
                </CardContent>
              </Card>

              {/* Audits Card */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Search className="h-5 w-5 text-success" />
                    <div className="text-2xl font-bold">
                      {auditsCompleted}/{auditsTotal}
                    </div>
                    <div className="text-xs text-muted-foreground">{lang('ciOperations.audits')}</div>
                    <CircularProgress percentage={auditsCompletion} size={40} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{lang('ciOperations.currentPhaseProgress')}</span>
                <span className="text-sm text-muted-foreground">{overallCompletion}%</span>
              </div>
              <Progress value={overallCompletion} className="h-2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{lang('ciOperations.phaseSummary')}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang('ciOperations.totalItems')}</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang('ciOperations.completed')}</span>
                  <span className="font-medium text-success">{completedItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang('ciOperations.pending')}</span>
                  <span className="font-medium text-info">
                    {phaseData.documents.pending + phaseData.gapAnalysis.pending}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang('ciOperations.overdue')}</span>
                  <span className="font-medium text-destructive">
                    {phaseData.documents.overdue + phaseData.gapAnalysis.overdue}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <div className="space-y-3">
              {[
                { name: "Phase Gate Review", status: "active", progress: 65 },
                { name: "Document Validation", status: "active", progress: 90 },
                { name: "Risk Assessment", status: "paused", progress: 40 }
              ].map((workflow, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{workflow.name}</span>
                      <Badge variant={workflow.status === "active" ? "default" : "secondary"} className="text-xs">
                        {workflow.status}
                      </Badge>
                    </div>
                    <Progress value={workflow.progress} className="h-1" />
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      {workflow.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="text-center py-6">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{lang('ciOperations.advancedAnalytics')}</p>
              <p className="text-xs text-muted-foreground">{lang('ciOperations.performanceMetrics')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
