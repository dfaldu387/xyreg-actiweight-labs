
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ClassificationAssistant } from './ClassificationAssistant';
import { DeviceClass } from '@/types/classification';

interface ClassificationTriggerProps {
  onClassificationSelected?: (deviceClass: DeviceClass) => void;
  className?: string;
}

export function ClassificationTrigger({ 
  onClassificationSelected, 
  className 
}: ClassificationTriggerProps) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleClassificationComplete = (deviceClass: DeviceClass) => {
    if (onClassificationSelected) {
      onClassificationSelected(deviceClass);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAssistantOpen(true)}
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
