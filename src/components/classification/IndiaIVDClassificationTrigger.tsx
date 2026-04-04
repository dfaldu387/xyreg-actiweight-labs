import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { IndiaIVDClassificationAssistant } from './IndiaIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface IndiaIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  onOpenChange?: (isOpen: boolean) => void;
  showButton?: boolean;
}

export function IndiaIVDClassificationTrigger({
  onClassificationSelected,
  onOpenChange,
  showButton = true
}: IndiaIVDClassificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleClassificationComplete = (classification: string, result: ClassificationResult) => {
    if (onClassificationSelected) {
      // Normalize to India's expected format: "A", "B", "C", "D"
      const normalizedClass = classification.replace('Class ', '');
      onClassificationSelected(normalizedClass, result);
    }
    handleOpenChange(false);
  };

  return (
    <>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
          className="gap-2"
        >
          <Beaker className="h-4 w-4" />
          India IVD Assistant
        </Button>
      )}

      <IndiaIVDClassificationAssistant
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
