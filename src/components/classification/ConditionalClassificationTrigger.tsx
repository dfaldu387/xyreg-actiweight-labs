import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Beaker, Zap } from 'lucide-react';
import { ClassificationAssistant } from './ClassificationAssistant';
import { IVDRClassificationAssistant } from './IVDRClassificationAssistant';
import { SaMDClassificationAssistant } from './SaMDClassificationAssistant';
import { EUSaMDClassificationAssistant } from './EUSaMDClassificationAssistant';
import { DeviceClass, ClassificationResult } from '@/types/classification';

interface ConditionalClassificationTriggerProps {
  onClassificationSelected?: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
  className?: string;
  primaryRegulatoryType?: string;
  deviceCharacteristics?: any;
  keyTechnologyCharacteristics?: any;
}

export function ConditionalClassificationTrigger({ 
  onClassificationSelected, 
  className,
  primaryRegulatoryType,
  deviceCharacteristics,
  keyTechnologyCharacteristics
}: ConditionalClassificationTriggerProps) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isIVDRAssistantOpen, setIsIVDRAssistantOpen] = useState(false);
  const [isSaMDAssistantOpen, setIsSaMDAssistantOpen] = useState(false);
  const [isEUSaMDAssistantOpen, setIsEUSaMDAssistantOpen] = useState(false);

  const isIVD = primaryRegulatoryType === 'In Vitro Diagnostic (IVD)';
  const isSaMD = keyTechnologyCharacteristics?.isSoftwareAsaMedicalDevice;
  const isSiMD = keyTechnologyCharacteristics?.isSoftwareMobileApp;

  const handleClassificationComplete = (deviceClass: DeviceClass, result?: ClassificationResult) => {
    if (onClassificationSelected) {
      onClassificationSelected(deviceClass, result);
    }
  };

  const handleMDRClick = () => {
    setIsAssistantOpen(true);
  };

  const handleIVDRClick = () => {
    setIsIVDRAssistantOpen(true);
  };

  const handleSaMDClick = () => {
    setIsSaMDAssistantOpen(true);
  };

  if (isIVD) {
    return (
      <>
        <Button
          variant="outline"
          onClick={handleIVDRClick}
          className={className}
        >
          <Beaker className="h-4 w-4 mr-2" />
          IVDR Assistant
        </Button>

        <IVDRClassificationAssistant
          isOpen={isIVDRAssistantOpen}
          onClose={() => setIsIVDRAssistantOpen(false)}
          onClassificationComplete={handleClassificationComplete}
        />
      </>
    );
  }

  if (isSaMD) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsEUSaMDAssistantOpen(true)}
          className={className}
        >
          <Zap className="h-4 w-4 mr-2" />
          SaMD Assistant (Rule 11)
        </Button>

        <EUSaMDClassificationAssistant
          isOpen={isEUSaMDAssistantOpen}
          onClose={() => setIsEUSaMDAssistantOpen(false)}
          onClassificationComplete={(result) => handleClassificationComplete(result.class, result)}
          onUseClassification={(result) => handleClassificationComplete(result.class, result)}
        />
      </>
    );
  }

  // SiMD uses the same MDR classification rules - fall through to default MDR assistant

  return (
    <>
      <Button
        variant="outline"
        onClick={handleMDRClick}
        className={className}
      >
        <Search className="h-4 w-4 mr-2" />
        MDR Assistant
      </Button>

      <ClassificationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onClassificationComplete={handleClassificationComplete}
      />
    </>
  );
}