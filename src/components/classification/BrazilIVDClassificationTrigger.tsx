import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { BrazilIVDClassificationAssistant } from './BrazilIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface BrazilIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  onOpenChange?: (isOpen: boolean) => void;
  showButton?: boolean;
}

export function BrazilIVDClassificationTrigger({
  onClassificationSelected,
  onOpenChange,
  showButton = true
}: BrazilIVDClassificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleClassificationComplete = (classification: string, result: ClassificationResult) => {
    if (onClassificationSelected) {
      // Normalize to Brazil's expected format: "I", "II", "III", "IV"
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
          Brazil IVD Assistant
        </Button>
      )}

      <BrazilIVDClassificationAssistant
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
