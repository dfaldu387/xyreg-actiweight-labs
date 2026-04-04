import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, FileText } from 'lucide-react';
import { CCRCreateDialog } from '@/components/change-control/CCRCreateDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { useCCRsByCompany } from '@/hooks/useChangeControlData';
import { CCR_STATUS_LABELS, CCR_STATUS_COLORS, CHANGE_TYPE_LABELS, CCRWithRelations } from '@/types/changeControl';
import { format } from 'date-fns';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { useTranslation } from '@/hooks/useTranslation';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

export default function CompanyChangeControlPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const { data: companyInfo, isLoading: companyLoading } = useCompanyInfo();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const { lang } = useTranslation();
  const isRestricted = !isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.CHANGE_CONTROL);

  const companyId = companyInfo?.id;
  
  const { data: ccrs = [], isLoading: ccrsLoading } = useCCRsByCompany(companyId);

  const handleCCRClick = (ccr: CCRWithRelations) => {
    navigate(`/app/change-control/${ccr.id}`);
  };

  if (companyLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: () => navigate('/app/clients') },
            { label: lang('common.loading') },
            { label: lang('changeControl.title') }
          ]}
          title={lang('common.loading')}
          subtitle={lang('changeControl.loadingSubtitle')}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${companyName}`) },
    { label: lang('changeControl.title') }
  ];

  // Group CCRs by status for dashboard view
  const openCCRs = ccrs.filter(c => !['closed', 'rejected'].includes(c.status));
  const pendingApproval = ccrs.filter(c => c.status === 'under_review');

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName="Change Control">
      <div className="space-y-6">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('changeControl.title')}
          subtitle={lang('changeControl.subtitle')}
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('changeControl.newChangeRequest')}
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner className="mx-2 !mb-0" />}

        <div className="px-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{ccrs.length}</CardTitle>
                <CardDescription>{lang('changeControl.totalCCRs')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{openCCRs.length}</CardTitle>
                <CardDescription>{lang('changeControl.openCCRs')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-amber-600">{pendingApproval.length}</CardTitle>
                <CardDescription>{lang('changeControl.pendingApproval')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-green-600">
                  {ccrs.filter(c => c.status === 'closed').length}
                </CardTitle>
                <CardDescription>{lang('changeControl.completed')}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CCR List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {lang('changeControl.changeControlRequests')}
              </CardTitle>
              <CardDescription>
                {lang('changeControl.allChangeRequestsFor', { name: decodedCompanyName })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ccrsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : ccrs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{lang('changeControl.noChangeControlRequests')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {lang('changeControl.createFirstCCR')}
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('changeControl.newChangeRequest')}
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {ccrs.map((ccr) => (
                    <div
                      key={ccr.id}
                      onClick={isRestricted ? undefined : () => handleCCRClick(ccr)}
                      className={`flex items-center justify-between py-4 px-2 rounded-lg transition-colors ${isRestricted ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {ccr.ccr_id}
                          </span>
                          <Badge variant="outline" className={`text-${CCR_STATUS_COLORS[ccr.status]}-600`}>
                            {CCR_STATUS_LABELS[ccr.status]}
                          </Badge>
                          <Badge variant="secondary">
                            {CHANGE_TYPE_LABELS[ccr.change_type]}
                          </Badge>
                        </div>
                        <h4 className="font-medium truncate">{ccr.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {ccr.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {ccr.owner && (
                            <span>{lang('changeControl.ownerLabel')} {ccr.owner.full_name}</span>
                          )}
                          <span>{lang('changeControl.createdLabel')} {format(new Date(ccr.created_at), 'MMM d, yyyy')}</span>
                          {ccr.product && (
                            <span>{lang('changeControl.productLabel')} {ccr.product.name}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {companyId && (
          <CCRCreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            companyId={companyId}
          />
        )}
      </div>
    </RestrictedFeatureProvider>
  );
}
