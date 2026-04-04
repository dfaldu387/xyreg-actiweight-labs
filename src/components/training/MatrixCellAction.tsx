import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  Minus,
  Plus,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrainingStatus } from '@/types/training';
import { useTranslation } from '@/hooks/useTranslation';

type CellStatus = 'completed' | 'overdue' | 'in_progress' | 'scheduled' | 'upcoming' | 'not_required';

interface Props {
  userId: string;
  userName: string;
  moduleId: string;
  moduleName: string;
  companyId: string;
  status: CellStatus;
  recordId?: string;
  dueDate?: string;
  children: React.ReactNode;
}

export function MatrixCellAction({
  userId,
  userName,
  moduleId,
  moduleName,
  companyId,
  status,
  recordId,
  dueDate,
  children,
}: Props) {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dueDate ? new Date(dueDate) : undefined
  );
  const [newStatus, setNewStatus] = useState<TrainingStatus>(
    status === 'not_required' ? 'not_started' : (status as TrainingStatus)
  );
  const queryClient = useQueryClient();

  const createRecord = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('training_records')
        .insert({
          user_id: userId,
          training_module_id: moduleId,
          company_id: companyId,
          status: newStatus,
          due_date: selectedDate?.toISOString(),
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
      toast.success(lang('training.cellAction.toast.assigned').replace('{{userName}}', userName));
      setOpen(false);
    },
    onError: () => {
      toast.error(lang('training.cellAction.toast.assignFailed'));
    },
  });

  const updateRecord = useMutation({
    mutationFn: async () => {
      if (!recordId) throw new Error('No record to update');

      const updates: Record<string, unknown> = {
        status: newStatus,
        due_date: selectedDate?.toISOString(),
      };

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('training_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
      toast.success(lang('training.cellAction.toast.updated'));
      setOpen(false);
    },
    onError: () => {
      toast.error(lang('training.cellAction.toast.updateFailed'));
    },
  });

  const handleSave = () => {
    if (status === 'not_required') {
      createRecord.mutate();
    } else {
      updateRecord.mutate();
    }
  };

  const getStatusLabel = (s: CellStatus) => {
    switch (s) {
      case 'completed': return lang('training.status.completed');
      case 'overdue': return lang('training.status.overdue');
      case 'in_progress': return lang('training.status.inProgress');
      case 'scheduled': return lang('training.status.scheduled');
      case 'upcoming': return lang('training.status.notStarted');
      default: return lang('training.status.notAssigned');
    }
  };

  const getStatusBadge = (s: CellStatus) => {
    switch (s) {
      case 'completed':
        return <Badge className="bg-emerald-500">{getStatusLabel(s)}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{getStatusLabel(s)}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">{getStatusLabel(s)}</Badge>;
      case 'scheduled':
        return <Badge className="bg-orange-500">{getStatusLabel(s)}</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">{getStatusLabel(s)}</Badge>;
      default:
        return <Badge variant="outline">{getStatusLabel(s)}</Badge>;
    }
  };

  const isLoading = createRecord.isPending || updateRecord.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center w-full hover:bg-muted/50 rounded p-1.5 transition-colors cursor-pointer">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{moduleName}</h4>
            <p className="text-xs text-muted-foreground">{lang('training.cellAction.for')} {userName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">{lang('training.cellAction.current')}</span>
              {getStatusBadge(status)}
            </div>
          </div>

          {/* Assignment Form */}
          {status === 'not_required' ? (
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {lang('training.cellAction.assignTraining')}
              </p>

              <div className="space-y-2">
                <Label className="text-xs">{lang('training.cellAction.dueDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : lang('training.cellAction.selectDueDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? lang('training.cellAction.assigning') : lang('training.cellAction.assign')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium">{lang('training.cellAction.updateAssignment')}</p>

              <div className="space-y-2">
                <Label className="text-xs">{lang('training.cellAction.status')}</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TrainingStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">{lang('training.status.notStarted')}</SelectItem>
                    <SelectItem value="in_progress">{lang('training.status.inProgress')}</SelectItem>
                    <SelectItem value="scheduled">{lang('training.status.scheduled')}</SelectItem>
                    <SelectItem value="completed">{lang('training.status.completed')}</SelectItem>
                    <SelectItem value="overdue">{lang('training.status.overdue')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{lang('training.cellAction.dueDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : lang('training.cellAction.selectDueDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                size="sm"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? lang('training.cellAction.saving') : lang('training.cellAction.saveChanges')}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
