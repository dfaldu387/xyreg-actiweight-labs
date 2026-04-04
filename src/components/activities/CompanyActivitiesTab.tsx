import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useActivities } from '@/hooks/useActivities';
import { ActivityInstancesTable } from './ActivityInstancesTable';
import { EditActivityDialog } from './EditActivityDialog';
import { ScheduleActivityDialog } from './ScheduleActivityDialog';
import { Activity } from '@/types/activities';
import { useTranslation } from '@/hooks/useTranslation';

interface CompanyActivitiesTabProps {
  disabled?: boolean;
}

export function CompanyActivitiesTab({ disabled = false }: CompanyActivitiesTabProps) {
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useActivities(companyId);
  const { lang } = useTranslation();
  
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const handleCreateActivity = async (activityData: any) => {
    try {
      await createActivity(activityData);
    } catch {
      // Error handled by hook
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditActivity(activity);
    setIsEditDialogOpen(true);
  };

  const handleUpdateActivity = async (activityId: string, updates: Partial<Activity>) => {
    try {
      await updateActivity(activityId, updates);
    } catch {
      // Error handled by hook
    }
  };

  if (!companyId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('activities.context.noCompanyContext')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActivityInstancesTable
        activities={activities}
        isLoading={isLoading}
        onEdit={handleEditActivity}
        onDelete={deleteActivity}
        onScheduleActivity={() => !disabled && setIsScheduleDialogOpen(true)}
        title={lang('activities.instances.companyTitle')}
        disabled={disabled}
      />

      <ScheduleActivityDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        companyId={companyId}
        productId={null}
        onCreateActivity={handleCreateActivity}
      />

      <EditActivityDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateActivity}
        activity={editActivity}
        companyId={companyId || ''}
        productId={null}
      />
    </div>
  );
}