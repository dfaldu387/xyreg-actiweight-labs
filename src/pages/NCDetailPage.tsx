import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNCById } from '@/hooks/useNonconformityData';
import { NCStateProgress } from '@/components/nonconformity/NCStateProgress';
import { NCTransitionPanel } from '@/components/nonconformity/NCTransitionPanel';
import { NCDetailsTab } from '@/components/nonconformity/NCDetailsTab';
import { NCInvestigationTab } from '@/components/nonconformity/NCInvestigationTab';
import { NCDispositionTab } from '@/components/nonconformity/NCDispositionTab';
import { NCEvidencePanel } from '@/components/nonconformity/NCEvidencePanel';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export default function NCDetailPage() {
  const { ncId } = useParams<{ ncId: string }>();
  const navigate = useNavigate();
  const { data: nc, isLoading } = useNCById(ncId);
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="px-2 py-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">{lang('nonconformity.notFound')}</h1>
        <p className="text-muted-foreground mt-2">{lang('nonconformity.notFoundMessage')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={[
          { label: "Client Compass", onClick: () => navigate('/app/clients') },
          { label: lang('nonconformity.breadcrumb'), onClick: () => navigate(-1) },
          { label: nc.nc_id }
        ]}
        title={`${nc.nc_id}: ${nc.title}`}
        subtitle={`${lang('nonconformity.status')}: ${nc.status.charAt(0).toUpperCase() + nc.status.slice(1)}`}
      />

      <Card>
        <CardContent className="pt-6">
          <NCStateProgress status={nc.status} />
          <div className="mt-4">
            <NCTransitionPanel nc={nc} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">{lang('nonconformity.details')}</TabsTrigger>
          <TabsTrigger value="investigation">{lang('nonconformity.investigationRCA')}</TabsTrigger>
          <TabsTrigger value="disposition">{lang('nonconformity.disposition')}</TabsTrigger>
          <TabsTrigger value="evidence">{lang('nonconformity.evidence')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <NCDetailsTab nc={nc} />
        </TabsContent>

        <TabsContent value="investigation">
          <NCInvestigationTab nc={nc} />
        </TabsContent>

        <TabsContent value="disposition">
          <NCDispositionTab nc={nc} />
        </TabsContent>

        <TabsContent value="evidence">
          <NCEvidencePanel ncId={nc.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
