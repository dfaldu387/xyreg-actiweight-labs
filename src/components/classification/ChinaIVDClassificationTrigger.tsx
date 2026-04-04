import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { ChinaIVDClassificationAssistant } from './ChinaIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface ChinaIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  onOpenChange?: (isOpen: boolean) => void;
  showButton?: boolean;
}

export function ChinaIVDClassificationTrigger({
  onClassificationSelected,
  onOpenChange,
  showButton = true
}: ChinaIVDClassificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleClassificationComplete = (classification: string, result: ClassificationResult) => {
    if (onClassificationSelected) {
      // Normalize to China's expected format: "I", "II", "III"
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
          China IVD Assistant
        </Button>
      )}

      <ChinaIVDClassificationAssistant
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        onComplete={handleClassificationComplete}
      />
    </>
  );
}
