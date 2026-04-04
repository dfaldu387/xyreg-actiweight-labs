
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { updateGapItemDueDate } from '@/services/gapAnalysisService';

interface GapAnalysisDueDateManagerProps {
  itemId: string;
  initialDueDate?: Date;
  itemStatus: string;
}

export function GapAnalysisDueDateManager({ itemId, initialDueDate, itemStatus }: GapAnalysisDueDateManagerProps) {
  const [dueDate, setDueDate] = useState<Date | undefined>(initialDueDate);

  const handleDueDateChange = async (newDate: Date | undefined) => {
    setDueDate(newDate);
    
    // Convert Date to ISO string or null for the service
    const dateString = newDate ? newDate.toISOString().split('T')[0] : null;
    const success = await updateGapItemDueDate(itemId, dateString);
    
    if (!success) {
      setDueDate(initialDueDate);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = dueDate && 
    dueDate.toISOString().split('T')[0] < today && 
    itemStatus !== "compliant";

  return (
    <div className="space-y-2">
      <Label>Due Date</Label>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDueDateChange(e.target.value ? new Date(e.target.value) : undefined)}
          className="w-full"
        />
        {dueDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDueDateChange(undefined)}
            className="h-auto p-1 text-muted-foreground hover:text-destructive"
          >
            Clear
          </Button>
        )}
      </div>
      {isOverdue && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          This item is overdue
        </p>
      )}
    </div>
  );
}
