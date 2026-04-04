import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FlaskConical,
  Users,
  Calendar,
  MapPin,
  FileText,
  Plus,
  TrendingUp,
  Edit,
  ClipboardList,
  Eye
} from 'lucide-react';
import { useClinicalTrials } from '@/hooks/useClinicalTrials';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ClinicalTrialForm } from './ClinicalTrialForm';
import { ClinicalEvidenceForm } from '@/components/product/business-case/ClinicalEvidenceForm';
import { useTranslation } from "@/hooks/useTranslation";

interface ClinicalTrialsManagerProps {
  productId: string;
  companyId: string;
  companyName: string;
  disabled?: boolean;
}

export function ClinicalTrialsManager({ productId, companyId, companyName, disabled = false }: ClinicalTrialsManagerProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const isInvestorFlow = searchParams.get('returnTo') === 'investor-share';
  const isGenesisFlow = searchParams.get('returnTo') === 'genesis';
  const tabParam = searchParams.get('tab');

  const { trials, isLoading, error, refetch } = useClinicalTrials(productId, companyId);
  
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'protocols' | 'evidence'>('evidence');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<any>(null);
  const hasInitializedTab = useRef(false);

  // Sync tab with URL param BEFORE loading check - this runs on every render
  useEffect(() => {
    if (tabParam === 'evidence-plan' && !hasInitializedTab.current) {
      setActiveTab('evidence');
      hasInitializedTab.current = true;
    }
  }, [tabParam]);

  const handleTrialCreated = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleTrialUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedTrial(null);
    refetch();
  };

  const handleEditClick = (trial: any) => {
    setSelectedTrial(trial);
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStudyTypeLabel = (type: string) => {
    switch (type) {
      case 'feasibility':
        return lang('clinicalTrials.studyTypes.feasibility');
      case 'pivotal':
        return lang('clinicalTrials.studyTypes.pivotal');
      case 'pmcf':
        return lang('clinicalTrials.studyTypes.pmcf');
      case 'registry':
        return lang('clinicalTrials.studyTypes.registry');
      default:
        return lang('clinicalTrials.studyTypes.other');
    }
  };

  const getStudyPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'protocol':
        return lang('clinicalTrials.studyPhases.protocol');
      case 'ethics_review':
        return lang('clinicalTrials.studyPhases.ethicsReview');
      case 'enrollment':
        return lang('clinicalTrials.studyPhases.enrollment');
      case 'data_collection':
        return lang('clinicalTrials.studyPhases.dataCollection');
      case 'analysis':
        return lang('clinicalTrials.studyPhases.dataAnalysis');
      case 'reporting':
        return lang('clinicalTrials.studyPhases.reporting');
      case 'completed':
        return lang('clinicalTrials.studyPhases.completed');
      default:
        return phase;
    }
  };

  const activeTrials = trials.filter(t => t.status === 'in_progress' || t.status === 'pending');
  const completedTrials = trials.filter(t => t.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lang('clinicalTrials.title')}</h2>
          <p className="text-muted-foreground">
            {lang('clinicalTrials.description')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('clinicalTrials.newTrial')}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('clinicalTrials.stats.totalTrials')}</p>
                <p className="text-2xl font-bold">{trials.length}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('clinicalTrials.stats.activeStudies')}</p>
                <p className="text-2xl font-bold">{activeTrials.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('clinicalTrials.stats.totalEnrollment')}</p>
                <p className="text-2xl font-bold">
                  {trials.reduce((sum, t) => sum + t.actual_enrollment, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{lang('clinicalTrials.stats.completed')}</p>
                <p className="text-2xl font-bold">{completedTrials.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trials List */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger
            value="evidence"
            className={`gap-1.5 ${isInvestorFlow ? "!text-indigo-600 data-[state=active]:!text-indigo-600 font-medium" : ""}`}
          >
            {isInvestorFlow && <Eye className="h-4 w-4 text-indigo-600" />}
            <ClipboardList className="h-4 w-4" />
            {lang('clinicalTrials.tabs.evidence')}
          </TabsTrigger>
          <TabsTrigger value="active">{lang('clinicalTrials.tabs.active', { count: activeTrials.length })}</TabsTrigger>
          <TabsTrigger value="completed">{lang('clinicalTrials.tabs.completed', { count: completedTrials.length })}</TabsTrigger>
          <TabsTrigger value="protocols">{lang('clinicalTrials.tabs.protocols', { count: trials.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTrials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {lang('clinicalTrials.noActiveTrials')}
              </CardContent>
            </Card>
          ) : (
            activeTrials.map((trial) => (
              <Card key={trial.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{trial.study_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{lang('clinicalTrials.labels.protocol')} {trial.protocol_id}</span>
                        <span>•</span>
                        <Badge variant="outline">{getStudyTypeLabel(trial.study_type)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(trial.status)}>
                        {trial.status.replace('_', ' ')}
                      </Badge>
                      {!disabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(trial)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{lang('clinicalTrials.labels.studyPhase')}</span>
                      <span className="font-medium">{getStudyPhaseLabel(trial.study_phase)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{lang('clinicalTrials.labels.progress')}</span>
                      <span className="font-medium">{trial.completion_percentage}%</span>
                    </div>
                    <Progress value={trial.completion_percentage} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {lang('clinicalTrials.labels.enrollment')} {trial.actual_enrollment} / {trial.target_enrollment}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{trial.study_sites.length} {lang('clinicalTrials.labels.studySites')}</span>
                    </div>
                    {trial.start_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{lang('clinicalTrials.labels.started')} {new Date(trial.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {trial.estimated_completion_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{lang('clinicalTrials.labels.estCompletion')} {new Date(trial.estimated_completion_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {trial.primary_endpoint && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">{lang('clinicalTrials.labels.primaryEndpoint')} </span>
                      <span>{trial.primary_endpoint}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTrials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {lang('clinicalTrials.noCompletedTrials')}
              </CardContent>
            </Card>
          ) : (
            completedTrials.map((trial) => (
              <Card key={trial.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{trial.study_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{lang('clinicalTrials.labels.protocol')} {trial.protocol_id}</span>
                        <span>•</span>
                        <Badge variant="outline">{getStudyTypeLabel(trial.study_type)}</Badge>
                      </div>
                    </div>
                    <Badge className={getStatusColor(trial.status)}>{lang('clinicalTrials.stats.completed')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{lang('clinicalTrials.labels.finalEnrollment')} {trial.actual_enrollment}</span>
                    </div>
                    {trial.actual_completion_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{lang('clinicalTrials.stats.completed')}: {new Date(trial.actual_completion_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          {trials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {lang('clinicalTrials.noProtocols')}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trials.map((trial) => (
                <Card key={trial.id}>
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{trial.study_name}</CardTitle>
                        <Badge className={getStatusColor(trial.status)} variant="outline">
                          {trial.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lang('clinicalTrials.labels.protocol')} {trial.protocol_id}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge>{getStudyTypeLabel(trial.study_type)}</Badge>
                    <div className="text-sm text-muted-foreground">
                      {getStudyPhaseLabel(trial.study_phase)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <ClinicalEvidenceForm productId={productId} companyId={companyId} isInGenesisFlow={isGenesisFlow} />
        </TabsContent>
      </Tabs>

      {/* Create Clinical Trial Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang('clinicalTrials.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <ClinicalTrialForm 
            productId={productId}
            companyId={companyId}
            companyName={companyName}
            onSuccess={handleTrialCreated}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Clinical Trial Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang('clinicalTrials.dialog.editTitle')}</DialogTitle>
          </DialogHeader>
          <ClinicalTrialForm 
            productId={productId}
            companyId={companyId}
            companyName={companyName}
            existingTrial={selectedTrial}
            onSuccess={handleTrialUpdated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
