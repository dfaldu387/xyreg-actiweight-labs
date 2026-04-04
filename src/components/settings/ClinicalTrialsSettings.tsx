import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { StudyTypeConfigTable } from './clinical/StudyTypeConfigTable';
import { StandardEndpointsManager } from './clinical/StandardEndpointsManager';
import { StudyTypeConfigModal } from './clinical/StudyTypeConfigModal';
import { CroPartnerManager } from './clinical/CroPartnerManager';
import { ProtocolTemplatesManager } from './clinical/ProtocolTemplatesManager';
import { DocumentationTemplatesManager } from './clinical/DocumentationTemplatesManager';
import { SiteRegistryManager } from './clinical/SiteRegistryManager';
import { NotificationRulesManager } from './clinical/NotificationRulesManager';
import { useStudyTypeConfigs } from '@/hooks/useStudyTypeConfigs';
import { useStandardEndpoints } from '@/hooks/useStandardEndpoints';
import { useCroPartners } from '@/hooks/useCroPartners';
import { useProtocolTemplates } from '@/hooks/useProtocolTemplates';
import { useDocumentationTemplates } from '@/hooks/useDocumentationTemplates';
import { useSiteRegistry } from '@/hooks/useSiteRegistry';
import { useNotificationRules } from '@/hooks/useNotificationRules';
import { StudyTypeConfig } from '@/hooks/useStudyTypeConfigs';

interface ClinicalTrialsSettingsProps {
  companyId: string;
}

export function ClinicalTrialsSettings({ companyId }: ClinicalTrialsSettingsProps) {
  const { lang } = useTranslation();
  const { enabledCount } = useStudyTypeConfigs(companyId);
  const { activeEndpointsCount } = useStandardEndpoints(companyId);
  const { partners } = useCroPartners(companyId);
  const { activeTemplates: activeProtocolTemplates } = useProtocolTemplates(companyId);
  const { activeTemplates: activeDocTemplates } = useDocumentationTemplates(companyId);
  const { activeSites } = useSiteRegistry(companyId);
  const { activeRules } = useNotificationRules(companyId);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<StudyTypeConfig | null>(null);

  const handleConfigureStudyType = (config: StudyTypeConfig) => {
    setSelectedConfig(config);
    setConfigModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lang('companyClinical.title')}</h2>
          <p className="text-muted-foreground">
            {lang('companyClinical.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{enabledCount} {lang('companyClinical.badges.studyTypes')}</Badge>
          <Badge variant="secondary">{activeEndpointsCount} {lang('companyClinical.badges.endpoints')}</Badge>
          <Badge variant="secondary">{partners.length} {lang('companyClinical.badges.croPartners')}</Badge>
          <Badge variant="secondary">{activeSites.length} {lang('companyClinical.badges.activeSites')}</Badge>
          <Badge variant="secondary">{activeRules.length} {lang('companyClinical.badges.notificationRules')}</Badge>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {lang('companyClinical.alert')}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.studyType.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.studyType.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudyTypeConfigTable
            companyId={companyId}
            onConfigure={handleConfigureStudyType}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.endpoints.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.endpoints.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandardEndpointsManager companyId={companyId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.croPartner.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.croPartner.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CroPartnerManager companyId={companyId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.protocolTemplates.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.protocolTemplates.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProtocolTemplatesManager companyId={companyId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.docTemplates.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.docTemplates.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentationTemplatesManager companyId={companyId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.siteRegistry.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.siteRegistry.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteRegistryManager companyId={companyId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang('companyClinical.cards.notifications.title')}</CardTitle>
          <CardDescription>
            {lang('companyClinical.cards.notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationRulesManager companyId={companyId} />
        </CardContent>
      </Card>

      <StudyTypeConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        config={selectedConfig}
      />
    </div>
  );
}
