import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetencyHeatmap } from '@/components/competency-matrix/CompetencyHeatmap';
import { DepartmentReadinessChart } from '@/components/competency-matrix/DepartmentReadinessChart';
import { RoleCompetencyMapping } from '@/components/competency-matrix/RoleCompetencyMapping';
import { QPRegistryView } from '@/components/competency-matrix/QPRegistryView';
import { useCompetencyData, COMPETENCY_AREAS } from '@/hooks/useCompetencyData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { MOCK_ROLE_REQUIREMENTS } from '@/components/competency-matrix/competencyMockData';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompetencyMatrixPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const companyId = useCompanyId();

  const { staff, entries, readiness, isLoading } = useCompetencyData(companyId);
  const { lang } = useTranslation();

  const breadcrumbs = [
    { label: lang('clients.clientCompass'), onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`) },
    { label: lang('training.competencyMatrix.title') }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} ${lang('training.competencyMatrix.title')}`}
        subtitle={lang('training.competencyMatrix.subtitle')}
      />
      <div className="px-2 space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">{lang('training.competencyMatrix.loading')}</span>
            </CardContent>
          </Card>
        ) : staff.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{lang('training.competencyMatrix.noTeamMembersTitle')}</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {lang('training.competencyMatrix.noTeamMembersDesc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="heatmap" className="w-full">
            <TabsList>
              <TabsTrigger value="heatmap">{lang('training.competencySubTabs.heatmap')}</TabsTrigger>
              <TabsTrigger value="roles">{lang('training.competencySubTabs.roles')}</TabsTrigger>
              <TabsTrigger value="registry">{lang('training.competencySubTabs.registry')}</TabsTrigger>
            </TabsList>

            <TabsContent value="heatmap" className="space-y-4 mt-4">
              <DepartmentReadinessChart data={readiness} />
              <CompetencyHeatmap areas={COMPETENCY_AREAS} staff={staff} entries={entries} />
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <RoleCompetencyMapping requirements={MOCK_ROLE_REQUIREMENTS} areas={COMPETENCY_AREAS} />
            </TabsContent>

            <TabsContent value="registry" className="mt-4">
              <QPRegistryView staff={staff} entries={entries} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
