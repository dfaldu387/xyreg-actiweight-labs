import React from 'react';
import { DeviceCharacteristics } from '@/types/client.d';
import { DeviceCharacteristicsSection } from '../DeviceCharacteristicsSection';
import { IVDSpecimenTypeSection } from './IVDSpecimenTypeSection';
import { useConditionalForm } from '@/hooks/useConditionalForm';

interface ConditionalDeviceCharacteristicsProps {
  regulatoryType?: string;
  characteristics?: DeviceCharacteristics;
  onChange?: (characteristics: DeviceCharacteristics) => void;
  isLoading?: boolean;
  // IVD-specific props
  specimenType?: string;
  testingEnvironment?: string;
  analyticalPerformance?: string[];
  clinicalPerformance?: string[];
  onSpecimenTypeChange?: (value: string) => void;
  onTestingEnvironmentChange?: (value: string) => void;
  onAnalyticalPerformanceChange?: (value: string[]) => void;
  onClinicalPerformanceChange?: (value: string[]) => void;
  intendedUse?: string;
}

export function ConditionalDeviceCharacteristics({
  regulatoryType,
  characteristics = {},
  onChange,
  isLoading,
  specimenType,
  testingEnvironment,
  analyticalPerformance,
  clinicalPerformance,
  onSpecimenTypeChange,
  onTestingEnvironmentChange,
  onAnalyticalPerformanceChange,
  onClinicalPerformanceChange,
  intendedUse
}: ConditionalDeviceCharacteristicsProps) {
  const { showSection } = useConditionalForm({ regulatoryType });
  
  const isIVD = regulatoryType === 'In Vitro Diagnostic (IVD)';

  if (isIVD) {
    // For IVD devices, render only the specimen type section in General tab
    return (
      <IVDSpecimenTypeSection
        specimenType={specimenType}
        testingEnvironment={testingEnvironment}
        analyticalPerformance={analyticalPerformance}
        clinicalPerformance={clinicalPerformance}
        onSpecimenTypeChange={onSpecimenTypeChange}
        onTestingEnvironmentChange={onTestingEnvironmentChange}
        onAnalyticalPerformanceChange={onAnalyticalPerformanceChange}
        onClinicalPerformanceChange={onClinicalPerformanceChange}
        isLoading={isLoading}
      />
    );
  }

  // For Medical Devices and Systems, show the standard characteristics
  return (
    <DeviceCharacteristicsSection
      characteristics={characteristics}
      onChange={onChange}
      isLoading={isLoading}
    />
  );
}