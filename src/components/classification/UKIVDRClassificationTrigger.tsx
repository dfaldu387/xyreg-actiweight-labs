import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { UKIVDRClassificationAssistant } from './UKIVDRClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface UKIVDRClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function UKIVDRClassificationTrigger({ 
  onClassificationSelected, 
  className,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}: UKIVDRClassificationTriggerProps) {
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
      // Normalize to UK IVD format: "A", "B", "C", "D" (matches dropdown values)
      const normalizedClass = classification.replace('Class ', '');
      onClassificationSelected(normalizedClass, result);
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
          UK IVDR Assistant
        </Button>
      )}

      <UKIVDRClassificationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
