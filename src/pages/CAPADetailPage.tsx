import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, Users, FileText, Clock, CheckCircle } from 'lucide-react';
import { useCAPAById, useCAPAActions, useCAPAEvidence, useCAPATransitions } from '@/hooks/useCAPAData';
import { CAPAStateProgress, CAPAStatusBadge } from '@/components/capa/CAPAStateProgress';
import { CAPAActionsPanel } from '@/components/capa/CAPAActionsPanel';
import { CAPAEvidencePanel } from '@/components/capa/CAPAEvidencePanel';
import { CAPATransitionPanel } from '@/components/capa/CAPATransitionPanel';
import { CAPADetailsTab } from '@/components/capa/CAPADetailsTab';
import { CAPAInvestigationTab } from '@/components/capa/CAPAInvestigationTab';
import { calculateRiskLevel, CAPA_SOURCE_LABELS, CAPA_STATUS_LABELS } from '@/types/capa';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

export default function CAPADetailPage() {
  const { capaId } = useParams<{ capaId: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const { data: capa, isLoading: capaLoading } = useCAPAById(capaId);
  const { data: actions = [], isLoading: actionsLoading } = useCAPAActions(capaId);
  const { data: evidence = [], isLoading: evidenceLoading } = useCAPAEvidence(capaId);
  const { data: transitions = [] } = useCAPATransitions(capaId);

  const handleBack = () => {
    navigate(-1);
  };

  if (!capaId) {
    return (
      <div className="px-2 py-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">{lang('capa.notFound')}</h1>
        <p className="text-muted-foreground mt-2">{lang('capa.invalidId')}</p>
      </div>
    );
  }

  if (capaLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[{ label: lang('capa.management') }, { label: lang('capa.loading') }]}
          title={lang('capa.loading')}
          subtitle={lang('capa.loadingManagement')}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!capa) {
    return (
      <div className="px-2 py-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">{lang('capa.notFound')}</h1>
        <p className="text-muted-foreground mt-2">{lang('capa.notFoundDescription')}</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {lang('capa.goBack')}
        </Button>
      </div>
    );
  }

  const riskLevel = calculateRiskLevel(capa.severity, capa.probability);
  const riskScore = capa.severity && capa.probability ? capa.severity * capa.probability : null;

  const breadcrumbs = [
    { label: lang('capa.management'), onClick: handleBack },
    { label: capa.capa_id }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={capa.capa_id}
        subtitle={capa.problem_description.substring(0, 100) + (capa.problem_description.length > 100 ? '...' : '')}
        actions={
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {lang('capa.back')}
          </Button>
        }
      />

      <div className="px-2 space-y-6">
        {/* State Progress & Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* State Machine Progress */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{lang('capa.workflowProgress')}</span>
                <CAPAStatusBadge status={capa.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CAPAStateProgress currentStatus={capa.status} className="justify-center" />

              {/* Transition Controls */}
              <div className="mt-6 pt-4 border-t">
                <CAPATransitionPanel capa={capa} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{lang('capa.quickInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{lang('capa.source')}</span>
                <Badge variant="outline">{CAPA_SOURCE_LABELS[capa.source_type]}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{lang('capa.riskLevel')}</span>
                {riskLevel ? (
                  <Badge
                    variant={riskLevel === 'critical' || riskLevel === 'high' ? 'destructive' : 'secondary'}
                  >
                    {riskLevel.toUpperCase()} ({riskScore})
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">{lang('capa.notAssessed')}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{lang('capa.created')}</span>
                <span className="text-sm">{format(new Date(capa.created_at), 'MMM d, yyyy')}</span>
              </div>

              {capa.target_closure_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{lang('capa.targetClose')}</span>
                  <span className="text-sm">{format(new Date(capa.target_closure_date), 'MMM d, yyyy')}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{lang('capa.actions')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{actions.filter(a => a.status === 'completed').length}/{actions.length}</span>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{lang('capa.evidence')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{evidence.length}</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {lang('capa.details')}
            </TabsTrigger>
            <TabsTrigger value="investigation">
              <Users className="h-4 w-4 mr-2" />
              {lang('capa.investigation')}
            </TabsTrigger>
            <TabsTrigger value="actions">
              <CheckCircle className="h-4 w-4 mr-2" />
              {lang('capa.actions')} ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <FileText className="h-4 w-4 mr-2" />
              {lang('capa.evidence')} ({evidence.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <CAPADetailsTab capa={capa} />
          </TabsContent>

          <TabsContent value="investigation" className="mt-6">
            <CAPAInvestigationTab capa={capa} />
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <CAPAActionsPanel
              capaId={capa.id}
              actions={actions}
              isLoading={actionsLoading}
              capaStatus={capa.status}
            />
          </TabsContent>

          <TabsContent value="evidence" className="mt-6">
            <CAPAEvidencePanel
              capaId={capa.id}
              evidence={evidence}
              isLoading={evidenceLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {lang('capa.stateTransitionHistory')}
            </CardTitle>
            <CardDescription>{lang('capa.auditTrailDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {lang('capa.noTransitionsRecorded')}
              </p>
            ) : (
              <div className="space-y-3">
                {transitions.map((transition) => (
                  <div key={transition.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {transition.from_status ? CAPA_STATUS_LABELS[transition.from_status] : lang('capa.createdTransition')}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-medium">{CAPA_STATUS_LABELS[transition.to_status]}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(transition.created_at), 'MMM d, yyyy HH:mm')}
                        {transition.transition_reason && (
                          <span className="ml-2">— {transition.transition_reason}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
