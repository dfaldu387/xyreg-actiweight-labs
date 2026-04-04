import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { CAPAAction, CAPAActionType, CAPAActionStatus, CAPAStatus } from '@/types/capa';
import { useCreateCAPAAction, useUpdateCAPAAction, useDeleteCAPAAction } from '@/hooks/useCAPAData';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAActionsPanelProps {
  capaId: string;
  actions: CAPAAction[];
  isLoading: boolean;
  capaStatus: CAPAStatus;
}

const ACTION_TYPE_LABELS: Record<CAPAActionType, string> = {
  correction: 'Correction',
  corrective: 'Corrective Action',
  preventive: 'Preventive Action',
};

const STATUS_ICONS: Record<CAPAActionStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  overdue: <AlertCircle className="h-4 w-4 text-destructive" />,
  cancelled: <Trash2 className="h-4 w-4 text-muted-foreground" />,
};

export function CAPAActionsPanel({ capaId, actions, isLoading, capaStatus }: CAPAActionsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<CAPAAction | null>(null);
  const { lang } = useTranslation();

  const createMutation = useCreateCAPAAction();
  const updateMutation = useUpdateCAPAAction();
  const deleteMutation = useDeleteCAPAAction();

  const [formData, setFormData] = useState({
    action_type: 'corrective' as CAPAActionType,
    description: '',
    due_date: '',
  });

  const canModify = !['closed', 'rejected'].includes(capaStatus);

  const handleCreateAction = async () => {
    await createMutation.mutateAsync({
      capa_id: capaId,
      action_type: formData.action_type,
      description: formData.description,
      due_date: formData.due_date || null,
      assigned_to: null,
      status: 'pending',
      completed_date: null,
      completion_evidence: null,
    });
    setFormData({ action_type: 'corrective', description: '', due_date: '' });
    setDialogOpen(false);
  };

  const handleToggleComplete = async (action: CAPAAction) => {
    const newStatus = action.status === 'completed' ? 'pending' : 'completed';
    await updateMutation.mutateAsync({
      id: action.id,
      updates: {
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : null,
      },
    });
  };

  const handleDeleteAction = async (action: CAPAAction) => {
    await deleteMutation.mutateAsync({ id: action.id, capaId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const completedCount = actions.filter(a => a.status === 'completed').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{lang('capa.correctivePreventiveActions')}</CardTitle>
          <CardDescription>
            {lang('capa.actionsCompleted', { completed: completedCount, total: actions.length })}
          </CardDescription>
        </div>
        {canModify && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {lang('capa.addAction')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{lang('capa.addNewAction')}</DialogTitle>
                <DialogDescription>
                  {lang('capa.addActionDescription')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{lang('capa.actionType')}</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(v) => setFormData({ ...formData, action_type: v as CAPAActionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{lang('capa.description')}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder={lang('capa.describeAction')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{lang('capa.dueDate')}</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {lang('capa.cancel')}
                </Button>
                <Button
                  onClick={handleCreateAction}
                  disabled={!formData.description || createMutation.isPending}
                >
                  {createMutation.isPending ? lang('capa.adding') : lang('capa.addAction')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>{lang('capa.noActionsYet')}</p>
            {canModify && (
              <p className="text-sm mt-1">{lang('capa.clickAddAction')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {canModify && (
                  <Checkbox
                    checked={action.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(action)}
                    className="mt-1"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {ACTION_TYPE_LABELS[action.action_type]}
                    </Badge>
                    {STATUS_ICONS[action.status]}
                    <span className="text-xs text-muted-foreground capitalize">
                      {action.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className={`text-sm ${action.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {action.description}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {action.due_date && (
                      <span>{lang('capa.due')} {format(new Date(action.due_date), 'MMM d, yyyy')}</span>
                    )}
                    {action.completed_date && (
                      <span>{lang('capa.completed')} {format(new Date(action.completed_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>

                {canModify && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleDeleteAction(action)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
