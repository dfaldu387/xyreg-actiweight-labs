
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { GapAnalysisItem } from "@/types/client";
import { ComplianceInstanceDueDateService } from "@/services/complianceInstanceDueDateService";
import { formatDateToLocalISO } from "@/lib/date";
import { useTranslation } from "@/hooks/useTranslation";

interface BulkDueDateManagerProps {
  items: GapAnalysisItem[];
  onComplete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BulkDueDateManager({ items, onComplete, open, onOpenChange }: BulkDueDateManagerProps) {
  const { lang } = useTranslation();
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = open ?? localOpen;
  const setIsOpen = onOpenChange ?? setLocalOpen;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkUpdate = async () => {
    if (!selectedDate) {
      toast.error(lang('bulkDueDate.selectDateError'));
      return;
    }

    setIsSubmitting(true);

    try {
      const updates = items.map(item => ({
        id: item.id || item.clauseId,
        dueDate: formatDateToLocalISO(selectedDate)
      }));

      const success = await ComplianceInstanceDueDateService.bulkUpdateDueDates(updates);

      if (success) {
        setIsOpen(false);
        setSelectedDate(undefined);
        onComplete?.();
      }
    } catch (error) {
      console.error('Error in bulk due date update:', error);
      toast.error(lang('bulkDueDate.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for items with existing due dates - check both possible field names
  const itemsWithDueDates = items.filter(item => 
    item.dueDate || 
    item.milestoneDate || 
    (item as any).due_date || 
    (item as any).milestone_due_date
  );

return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {lang('bulkDueDate.bulkSetDueDate')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lang('bulkDueDate.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {lang('bulkDueDate.dialogDescription', { count: items.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {itemsWithDueDates.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {lang('bulkDueDate.warningExistingDates', { count: itemsWithDueDates.length })}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{lang('bulkDueDate.selectDueDate')}</label>
            <Input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
              placeholder={lang('bulkDueDate.selectDueDatePlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {lang('common.cancel')}
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={!selectedDate || isSubmitting}
          >
            {isSubmitting ? lang('bulkDueDate.updating') : lang('bulkDueDate.updateAllDueDates')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
