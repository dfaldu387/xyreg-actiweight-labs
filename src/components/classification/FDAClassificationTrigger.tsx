import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { FDAClassificationAssistant } from './FDAClassificationAssistant';

interface FDAClassificationResult {
  productCode: string;
  productCodeName: string;
  deviceClass: 'Class I' | 'Class II' | 'Class III';
  regulatoryPathway: '510(k) Exempt' | '510(k) Clearance' | 'PMA';
  panelName: string;
  rationale: string;
  riskFactors: string[];
  predicateDevices: string[];
  fdaGuidanceLinks: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FDAClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: FDAClassificationResult) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function FDAClassificationTrigger({ 
  onClassificationSelected, 
  className,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}: FDAClassificationTriggerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isAssistantOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const setIsAssistantOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const handleClassificationComplete = (deviceClass: 'Class I' | 'Class II' | 'Class III', result: FDAClassificationResult) => {
    if (onClassificationSelected) {
      // Map FDA classification to risk class format matching dropdown values (I, II, III)
      let riskClassValue = '';

      if (deviceClass === 'Class I') {
        riskClassValue = 'I';
      } else if (deviceClass === 'Class II') {
        riskClassValue = 'II';
      } else if (deviceClass === 'Class III') {
        riskClassValue = 'III';
      }

      onClassificationSelected(riskClassValue, result);
    }
    setIsAssistantOpen(false);
  };

  return (
    <>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAssistantOpen(true)}
          className={className}
        >
          <Search className="h-4 w-4 mr-2" />
          FDA Assistant
        </Button>
      )}

      <FDAClassificationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
