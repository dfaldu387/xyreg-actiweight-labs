import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Clock, CheckCircle, Users } from 'lucide-react';
import { CCRImpactAnalysis } from '@/components/change-control/CCRImpactAnalysis';
import { useCCRById, useCCRTransitions } from '@/hooks/useChangeControlData';
import { 
  CCR_STATUS_LABELS, 
  CCR_STATUS_COLORS, 
  CHANGE_TYPE_LABELS, 
  CCR_SOURCE_LABELS,
  RISK_IMPACT_LABELS 
} from '@/types/changeControl';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

export default function ChangeControlDetailPage() {
  const { ccrId } = useParams<{ ccrId: string }>();
  const navigate = useNavigate();

  const { lang } = useTranslation();
  const { data: ccr, isLoading: ccrLoading } = useCCRById(ccrId);
  const { data: transitions = [], isLoading: transitionsLoading } = useCCRTransitions(ccrId);

  if (ccrLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: lang('changeControl.title'), onClick: () => navigate(-1) },
            { label: lang('common.loading') }
          ]}
          title={lang('common.loading')}
          subtitle={lang('changeControl.loadingDetails')}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!ccr) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">{lang('changeControl.ccrNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{lang('changeControl.ccrNotFoundDescription')}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {lang('changeControl.goBack')}
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { 
      label: ccr.company?.name || "Company", 
      onClick: () => navigate(`/app/company/${encodeURIComponent(ccr.company?.name || '')}`) 
    },
    { 
      label: lang('changeControl.title'),
      onClick: () => navigate(`/app/company/${encodeURIComponent(ccr.company?.name || '')}/change-control`) 
    },
    { label: ccr.ccr_id }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={ccr.ccr_id}
        subtitle={ccr.title}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-${CCR_STATUS_COLORS[ccr.status]}-600`}>
              {CCR_STATUS_LABELS[ccr.status]}
            </Badge>
            <Badge variant="secondary">
              {CHANGE_TYPE_LABELS[ccr.change_type]}
            </Badge>
          </div>
        }
      />

      <div className="px-2 space-y-6">
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">{lang('changeControl.detailsTab')}</TabsTrigger>
            <TabsTrigger value="impact">{lang('changeControl.impactAssessmentTab')}</TabsTrigger>
            <TabsTrigger value="implementation">{lang('changeControl.implementationTab')}</TabsTrigger>
            <TabsTrigger value="history">{lang('changeControl.historyTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang('changeControl.basicInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.titleLabel')}</label>
                    <p className="mt-1">{ccr.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.descriptionLabel')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.description}</p>
                  </div>
                  {ccr.justification && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.justificationLabel')}</label>
                      <p className="mt-1 whitespace-pre-wrap">{ccr.justification}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.sourceLabel')}</label>
                    <p className="mt-1">{CCR_SOURCE_LABELS[ccr.source_type]}</p>
                  </div>
                  {ccr.source_capa && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.linkedCAPA')}</label>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-1"
                        onClick={() => navigate(`/app/capa/${ccr.source_capa_id}`)}
                      >
                        {ccr.source_capa.capa_id}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ownership & Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {lang('changeControl.ownershipAndDates')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.ownerField')}</label>
                    <p className="mt-1">{ccr.owner?.full_name || lang('changeControl.notAssigned')}</p>
                  </div>
                  {ccr.product && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.productField')}</label>
                      <p className="mt-1">{ccr.product.name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.createdField')}</label>
                    <p className="mt-1">{format(new Date(ccr.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  {ccr.target_implementation_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.targetImplementation')}</label>
                      <p className="mt-1">{format(new Date(ccr.target_implementation_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {ccr.implemented_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implemented')}</label>
                      <p className="mt-1">{format(new Date(ccr.implemented_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {ccr.verified_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verified')}</label>
                      <p className="mt-1">{format(new Date(ccr.verified_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {lang('changeControl.approvals')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ccr.technical_approved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{lang('changeControl.technical')}</p>
                      <p className="text-sm text-muted-foreground">
                        {ccr.technical_approved ? lang('changeControl.approved') : lang('changeControl.pending')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ccr.quality_approved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{lang('changeControl.quality')}</p>
                      <p className="text-sm text-muted-foreground">
                        {ccr.quality_approved ? lang('changeControl.approved') : lang('changeControl.pending')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ccr.regulatory_approved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{lang('changeControl.regulatory')}</p>
                      <p className="text-sm text-muted-foreground">
                        {ccr.regulatory_approved ? lang('changeControl.approved') : lang('changeControl.pending')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact" className="space-y-4">
            {ccr.target_object_id && ccr.product_id ? (
              <CCRImpactAnalysis
                targetObjectId={ccr.target_object_id}
                targetObjectType={ccr.target_object_type || ''}
                productId={ccr.product_id}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{lang('changeControl.impactAssessmentTab')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.riskImpact')}</label>
                      <p className="mt-1">
                        <Badge variant={ccr.risk_impact === 'high' ? 'destructive' : 'secondary'}>
                          {RISK_IMPACT_LABELS[ccr.risk_impact]}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.regulatoryImpact')}</label>
                      <p className="mt-1">{ccr.regulatory_impact ? lang('changeControl.yes') : lang('changeControl.no')}</p>
                    </div>
                    {ccr.cost_impact !== null && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.costImpact')}</label>
                        <p className="mt-1">${ccr.cost_impact.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {ccr.regulatory_impact_description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.regulatoryImpactDescription')}</label>
                      <p className="mt-1 whitespace-pre-wrap">{ccr.regulatory_impact_description}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground italic">
                    {lang('changeControl.automatedImpactNote')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="implementation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{lang('changeControl.implementationDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ccr.implementation_plan ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implementationPlan')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.implementation_plan}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{lang('changeControl.noImplementationPlan')}</p>
                )}
                {ccr.implementation_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implementationNotes')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.implementation_notes}</p>
                  </div>
                )}
                {ccr.verification_plan && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verificationPlan')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.verification_plan}</p>
                  </div>
                )}
                {ccr.verification_evidence && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verificationEvidence')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.verification_evidence}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {lang('changeControl.stateTransitionHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transitionsLoading ? (
                  <LoadingSpinner />
                ) : transitions.length === 0 ? (
                  <p className="text-muted-foreground">{lang('changeControl.noTransitions')}</p>
                ) : (
                  <div className="space-y-4">
                    {transitions.map((transition) => (
                      <div key={transition.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {transition.from_status && (
                              <>
                                <Badge variant="outline">{CCR_STATUS_LABELS[transition.from_status as keyof typeof CCR_STATUS_LABELS]}</Badge>
                                <span>→</span>
                              </>
                            )}
                            <Badge variant="outline">{CCR_STATUS_LABELS[transition.to_status as keyof typeof CCR_STATUS_LABELS]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {transition.transitioner?.full_name || lang('changeControl.unknown')} • {format(new Date(transition.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                          {transition.transition_reason && (
                            <p className="text-sm mt-2">{transition.transition_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
