import React, { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UDIInformationSection } from './UDIInformationSection';
import { EudamedConsolidatedSection } from '@/components/eudamed/EudamedConsolidatedSection';
import { TabHeader } from "./TabHeader";
import { useProductDetails } from '@/hooks/useProductDetails';
import { useTranslation } from '@/hooks/useTranslation';

interface IdentificationTraceabilitySectionProps {
  companyId: string;
  productId?: string;
  productData?: any; // Product data for auto-populating from EUDAMED
  // UDI props
  basicUdiDi?: string;
  udiDi?: string;
  udiPi?: string;
  gtin?: string;
  onBasicUdiDiChange?: (value: string) => void;
  onUdiDiChange?: (value: string) => void;
  onUdiPiChange?: (value: string) => void;
  onGtinChange?: (value: string) => void;
  // EUDAMED props
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: Date | string;
  marketAuthorizationHolder?: string;
  notifiedBody?: string;
  ceMarkStatus?: string;
  conformityAssessmentRoute?: string;
  onRegistrationNumberChange?: (value: string) => void;
  onRegistrationStatusChange?: (value: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onMarketAuthorizationHolderChange?: (value: string) => void;
  onNotifiedBodyChange?: (value: string) => void;
  onCeMarkStatusChange?: (value: string) => void;
  onConformityAssessmentRouteChange?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function IdentificationTraceabilitySection({
  companyId,
  productId,
  productData,
  // UDI props
  basicUdiDi,
  udiDi,
  udiPi,
  gtin,
  onBasicUdiDiChange,
  onUdiDiChange,
  onUdiPiChange,
  onGtinChange,
  // EUDAMED props
  registrationNumber,
  registrationStatus,
  registrationDate,
  marketAuthorizationHolder,
  notifiedBody,
  ceMarkStatus,
  conformityAssessmentRoute,
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onRegistrationDateChange,
  onMarketAuthorizationHolderChange,
  onNotifiedBodyChange,
  onCeMarkStatusChange,
  onConformityAssessmentRouteChange,
  isLoading = false,
  disabled = false,
}: IdentificationTraceabilitySectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('identificationSection') === 'eudamed' ? 'eudamed' : 'udi';
  const [activeTab, setActiveTab] = useState<'udi' | 'eudamed'>(initialSection);
  const { data: product } = useProductDetails(productId || '');

  // Keep local tab state in sync if URL changes (back/forward navigation)
  useEffect(() => {
    const next = searchParams.get('identificationSection') === 'eudamed' ? 'eudamed' : 'udi';
    setActiveTab(next);
  }, [searchParams]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const udiFields = [basicUdiDi, udiDi, udiPi, gtin];
    const eudamedFields = [registrationNumber, registrationStatus, registrationDate, marketAuthorizationHolder, notifiedBody, ceMarkStatus, conformityAssessmentRoute];

    const allFields = [...udiFields, ...eudamedFields];
    const completedFields = allFields.filter(field => field && field.toString().trim().length > 0).length;

    return allFields.length > 0 ? Math.round((completedFields / allFields.length) * 100) : 0;
  }, [basicUdiDi, udiDi, udiPi, gtin, registrationNumber, registrationStatus, registrationDate, marketAuthorizationHolder, notifiedBody, ceMarkStatus, conformityAssessmentRoute]);

  const handleTabChange = (value: string) => {
    const next = value === 'eudamed' ? 'eudamed' : 'udi';
    setActiveTab(next);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('identificationSection', next);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <TabHeader
          title={lang('deviceIdentification.title')}
          subtitle={lang('deviceIdentification.subtitle')}
          completionPercentage={completionPercentage}
          isLoading={isLoading}
          isEudamedTab={true}
          isProgress={false}
        />
      </CardHeader>
      <CardContent className={disabled ? 'opacity-60 pointer-events-none' : ''}>
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="udi">{lang('deviceIdentification.tabs.udiManagement')}</TabsTrigger>
            <TabsTrigger value="eudamed">{lang('deviceIdentification.tabs.eudamedCompliance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="udi" className="mt-4">
            <UDIInformationSection
              companyId={companyId}
              productId={productId}
              productData={productData}
              basicUdiDi={basicUdiDi}
              udiDi={udiDi}
              udiPi={udiPi}
              gtin={gtin}
              onBasicUdiDiChange={onBasicUdiDiChange}
              onUdiDiChange={onUdiDiChange}
              onUdiPiChange={onUdiPiChange}
              onGtinChange={onGtinChange}
              onMarketAuthorizationHolderChange={onMarketAuthorizationHolderChange}
              onRegistrationNumberChange={onRegistrationNumberChange}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="eudamed" className="mt-0">
            <EudamedConsolidatedSection
              productData={productData}
              companyId={companyId}
              onDataRefresh={() => window.location.reload()}
              registrationNumber={registrationNumber}
              registrationStatus={registrationStatus}
              registrationDate={registrationDate}
              ceMarkStatus={ceMarkStatus}
              conformityAssessmentRoute={conformityAssessmentRoute}
              marketAuthorizationHolder={marketAuthorizationHolder}
              notifiedBody={notifiedBody}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}