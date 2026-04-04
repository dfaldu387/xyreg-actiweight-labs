import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { PMSActivityTracking } from "@/hooks/usePMSActivities";
import { useTranslation } from "@/hooks/useTranslation";

interface PMSStatusDropdownProps {
  activity: PMSActivityTracking;
  onStatusChange: (newStatus: PMSActivityTracking['status']) => void;
  disabled?: boolean;
}

const statusColors: Record<PMSActivityTracking['status'], string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  complete: 'bg-green-100 text-green-800 border-green-300',
  not_applicable: 'bg-purple-100 text-purple-800 border-purple-300',
  overdue: 'bg-red-100 text-red-800 border-red-300',
};

export function PMSStatusDropdown({ activity, onStatusChange, disabled = false }: PMSStatusDropdownProps) {
  const { lang } = useTranslation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PMSActivityTracking['status'] | null>(null);

  const statusOptions: Array<{
    value: PMSActivityTracking['status'];
    label: string;
    color: string;
  }> = [
    { value: 'pending', label: lang('devicePMS.statusDropdown.pending'), color: statusColors.pending },
    { value: 'in_progress', label: lang('devicePMS.statusDropdown.inProgress'), color: statusColors.in_progress },
    { value: 'complete', label: lang('devicePMS.statusDropdown.complete'), color: statusColors.complete },
    { value: 'not_applicable', label: lang('devicePMS.statusDropdown.notApplicable'), color: statusColors.not_applicable },
  ];

  const currentStatus = statusOptions.find(s => s.value === activity.status);
  const completedItems = (activity.related_documents || []).filter((item: any) => item.completed).length;
  const totalItems = activity.related_documents?.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleStatusSelect = (newStatus: PMSActivityTracking['status']) => {
    // Show confirmation if marking as complete with incomplete checklist
    if (newStatus === 'complete' && progress < 100 && totalItems > 0) {
      setPendingStatus(newStatus);
      setShowConfirmDialog(true);
      return;
    }

    onStatusChange(newStatus);
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
    }
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Badge
            variant="outline"
            className={`${currentStatus?.color} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'} transition-opacity flex items-center gap-1`}
          >
            {currentStatus?.label}
            {!disabled && <ChevronDown className="h-3 w-3" />}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background z-50">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className={activity.status === option.value ? 'bg-accent' : ''}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`} />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('devicePMS.statusDropdown.checklistIncomplete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('devicePMS.statusDropdown.checklistIncompleteDescription')
                .replace('{{progress}}', String(Math.round(progress)))
                .replace('{{completed}}', String(completedItems))
                .replace('{{total}}', String(totalItems))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('devicePMS.statusDropdown.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {lang('devicePMS.statusDropdown.markCompleteAnyway')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
