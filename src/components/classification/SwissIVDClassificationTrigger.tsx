import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { SwissIVDClassificationAssistant } from './SwissIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface SwissIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function SwissIVDClassificationTrigger({ 
  onClassificationSelected, 
  className,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}: SwissIVDClassificationTriggerProps) {
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
      // Map Swiss IVD classification to simple class format (A, B, C, D)
      let riskClassValue = '';
      
      if (classification.includes('D')) {
        riskClassValue = 'D';
      } else if (classification.includes('C')) {
        riskClassValue = 'C';
      } else if (classification.includes('B')) {
        riskClassValue = 'B';
      } else if (classification.includes('A')) {
        riskClassValue = 'A';
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
          Swiss IVD Assistant
        </Button>
      )}

      <SwissIVDClassificationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
