import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { JapanIVDClassificationAssistant } from './JapanIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface JapanIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  onOpenChange?: (isOpen: boolean) => void;
  showButton?: boolean;
}

export function JapanIVDClassificationTrigger({
  onClassificationSelected,
  onOpenChange,
  showButton = true
}: JapanIVDClassificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleClassificationComplete = (classification: string, result: ClassificationResult) => {
    if (onClassificationSelected) {
      // Normalize to Japan's expected format: "I", "II", "III", "IV"
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
          Japan IVD Assistant
        </Button>
      )}

      <JapanIVDClassificationAssistant
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
