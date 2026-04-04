import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, FileText, CheckCircle2, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompleteTraining, useUpdateTrainingRecord } from "@/hooks/useTrainingRecords";
import { toast } from "sonner";

interface TrainingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingRecordId: string | null;
}

export function TrainingDetailModal({ open, onOpenChange, trainingRecordId }: TrainingDetailModalProps) {
  const completeTraining = useCompleteTraining();
  const updateRecord = useUpdateTrainingRecord();

  const { data: record, isLoading } = useQuery({
    queryKey: ['training-record-detail', trainingRecordId],
    queryFn: async () => {
      if (!trainingRecordId) return null;
      const { data, error } = await supabase
        .from('training_records')
        .select(`*, training_module:training_modules(*)`)
        .eq('id', trainingRecordId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!trainingRecordId && open,
  });

  const module = record?.training_module as any;

  const handleStartTraining = () => {
    if (!trainingRecordId) return;
    updateRecord.mutate(
      { id: trainingRecordId, status: 'in_progress' },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const handleCompleteTraining = () => {
    if (!trainingRecordId) return;
    completeTraining.mutate(
      { recordId: trainingRecordId, signature: module?.requires_signature },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      case 'in_progress': return <Badge className="bg-primary text-primary-foreground">In Progress</Badge>;
      case 'completed': return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      case 'not_started': return <Badge variant="secondary">Not Started</Badge>;
      case 'scheduled': return <Badge className="bg-warning text-warning-foreground">Scheduled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateStr = d.toLocaleDateString();
    if (diffDays < 0) return `${dateStr} (${Math.abs(diffDays)} days overdue)`;
    if (diffDays === 0) return `${dateStr} (Due today)`;
    return `${dateStr} (${diffDays} days remaining)`;
  };

  const canStart = record?.status === 'not_started' || record?.status === 'scheduled';
  const canComplete = record?.status === 'in_progress' || record?.status === 'not_started';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Training Details
          </DialogTitle>
          <DialogDescription>
            {module?.name || 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : record && module ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {getStatusBadge(record.status)}
            </div>

            {module.description && (
              <div>
                <span className="text-sm font-medium">Description</span>
                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Type</span>
                <p className="text-muted-foreground capitalize">{module.type}</p>
              </div>
              <div>
                <span className="font-medium">Delivery</span>
                <p className="text-muted-foreground capitalize">{module.delivery_method?.replace('_', ' ')}</p>
              </div>
              {module.estimated_minutes && (
                <div>
                  <span className="font-medium">Duration</span>
                  <p className="text-muted-foreground">{module.estimated_minutes} min</p>
                </div>
              )}
              {module.version && (
                <div>
                  <span className="font-medium">Version</span>
                  <p className="text-muted-foreground">v{module.version}</p>
                </div>
              )}
            </div>

            {record.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Due:</span>
                <span className={record.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}>
                  {formatDueDate(record.due_date)}
                </span>
              </div>
            )}

            {module.requires_signature && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Requires signature upon completion</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Training record not found</div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canStart && (
            <Button onClick={handleStartTraining} disabled={updateRecord.isPending}>
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Start Training
            </Button>
          )}
          {canComplete && (
            <Button onClick={handleCompleteTraining} disabled={completeTraining.isPending} variant="default">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Mark Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
