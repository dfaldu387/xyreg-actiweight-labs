import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, ArrowRightLeft, Users, Shield, FileCheck } from 'lucide-react';
import { DatasetLibraryTab } from '@/components/company/ehds/DatasetLibraryTab';
import { TranslationLayerTab } from '@/components/company/ehds/TranslationLayerTab';
import { SecondaryUseTab } from '@/components/company/ehds/SecondaryUseTab';
import { AnonymizationLabTab } from '@/components/company/ehds/AnonymizationLabTab';
import { SelfDeclarationTab } from '@/components/company/ehds/SelfDeclarationTab';
import { useCompanyId } from '@/hooks/useCompanyId';

const TABS = [
  { id: 'datasets', label: 'Dataset Library', icon: Database },
  { id: 'translation', label: 'Translation Layer', icon: ArrowRightLeft },
  { id: 'secondary-use', label: 'Secondary Use', icon: Users },
  { id: 'anonymization', label: 'Anonymization Lab', icon: Shield },
  { id: 'self-declaration', label: 'Self-Declaration', icon: FileCheck },
] as const;

export default function EHDSDataVaultPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'datasets';
  const companyId = useCompanyId() || null;

  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const breadcrumbs = buildCompanyBreadcrumbs(decodedCompanyName, 'EHDS Data Vault');

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 p-6">
      <ConsistentPageHeader
        title="EHDS Data Vault"
        subtitle="EU Regulation 2025/327 — European Health Data Space compliance management"
        breadcrumbs={breadcrumbs}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="datasets">
          <DatasetLibraryTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="translation">
          <TranslationLayerTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="secondary-use">
          <SecondaryUseTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="anonymization">
          <AnonymizationLabTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="self-declaration">
          <SelfDeclarationTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
