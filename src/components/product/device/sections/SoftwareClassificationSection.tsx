import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpTooltip } from './HelpTooltip';
import { ConditionalClassificationTrigger } from '../../../classification/ConditionalClassificationTrigger';
import { DeviceCharacteristics } from '@/types/client.d';

interface SoftwareClassificationSectionProps {
  localKeyTechnologyCharacteristics: DeviceCharacteristics;
  handleCharacteristicChange: (key: keyof DeviceCharacteristics, checked: boolean) => void;
  handleBatchCharacteristicChange?: (updates: Partial<DeviceCharacteristics>) => void;
  isLoading: boolean;
  primaryRegulatoryType?: string;
  tooltipDefinitions: Record<string, string>;
}

export function SoftwareClassificationSection({
  localKeyTechnologyCharacteristics,
  handleCharacteristicChange,
  handleBatchCharacteristicChange,
  isLoading,
  primaryRegulatoryType,
  tooltipDefinitions
}: SoftwareClassificationSectionProps) {
  // Determine current software type
  const getCurrentSoftwareType = () => {
    if (localKeyTechnologyCharacteristics.isSoftwareAsaMedicalDevice) return 'samd';
    if (localKeyTechnologyCharacteristics.isSoftwareMobileApp) return 'simd';
    if (localKeyTechnologyCharacteristics.noSoftware) return 'none';
    return '';
  };

  const handleSoftwareTypeChange = (value: string) => {
    const updates: Partial<DeviceCharacteristics> = {
      isSoftwareAsaMedicalDevice: value === 'samd',
      isSoftwareMobileApp: value === 'simd',
      noSoftware: value === 'none'
    };

    // Use batch update if available, otherwise merge and send single update
    if (handleBatchCharacteristicChange) {
      handleBatchCharacteristicChange(updates);
    } else {
      const mergedUpdate = { ...localKeyTechnologyCharacteristics, ...updates };
      handleCharacteristicChange('isSoftwareAsaMedicalDevice', mergedUpdate.isSoftwareAsaMedicalDevice || false);
    }
  };

  // Get current software type for rendering
  const currentSoftwareType = getCurrentSoftwareType();
  const isComplete = currentSoftwareType !== '';

  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const section = searchParams.get('section');
  // NOTE: gap-analysis is NOT a guided flow — only true onboarding/share flows
  // should paint completion borders. Deep-links handle their own amber pulse.
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || section === 'architecture';

  return (
    <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${isComplete ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
      <Label className="text-sm font-medium mb-3 block">System Architecture</Label>
      <div className="space-y-4">
        <RadioGroup 
          value={currentSoftwareType}
          onValueChange={handleSoftwareTypeChange}
          disabled={isLoading}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="samd" id="software-samd" />
            <Label 
              htmlFor="software-samd" 
              className="flex items-center gap-2 cursor-pointer"
            >
              Software as a Medical Device (SaMD)
              <HelpTooltip content='Software that is itself a medical device (SaMD) - where the software is intended for medical purposes and functions independently as a medical device.' />
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="simd" id="software-simd" />
            <Label 
              htmlFor="software-simd" 
              className="flex items-center gap-2 cursor-pointer"
            >
              SiMD (Software in a Medical Device)
              <HelpTooltip content='Device contains embedded software as a component, but the software itself is not the medical device. This includes firmware, control software, or software embedded in hardware.' />
            </Label>
          </div> 

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="software-none" />
            <Label 
              htmlFor="software-none" 
              className="flex items-center gap-2 cursor-pointer"
            >
              No Software Used
              <HelpTooltip content="The device does not contain or use any software components." />
            </Label>
          </div>
        </RadioGroup>

      </div>
    </div>
  );
}