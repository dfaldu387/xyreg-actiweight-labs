import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { FDAIVDClassificationAssistant } from './FDAIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface FDAIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function FDAIVDClassificationTrigger({ 
  onClassificationSelected, 
  className,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}: FDAIVDClassificationTriggerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isAssistantOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const setIsAssistantOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const handleClassificationComplete = (classification: string, result: ClassificationResult) => {
    if (onClassificationSelected) {
      // Map FDA IVD classification to simple class format (I, II, III) matching USA market values
      let riskClassValue = '';
      
      if (classification.includes('III')) {
        riskClassValue = 'III';
      } else if (classification.includes('II')) {
        riskClassValue = 'II';
      } else if (classification.includes('I')) {
        riskClassValue = 'I';
      } else {
        riskClassValue = classification.replace('Class ', '');
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
          <Beaker className="h-4 w-4 mr-2" />
          FDA IVD Assistant
        </Button>
      )}

      <FDAIVDClassificationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
