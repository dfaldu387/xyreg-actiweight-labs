import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductPhases } from '@/hooks/useProductPhases';
import { useActivities } from '@/hooks/useActivities';
import { ActivityInstancesTable } from './ActivityInstancesTable';
import { EditActivityDialog } from './EditActivityDialog';
import { ScheduleActivityDialog } from './ScheduleActivityDialog';
import { DigitalTemplateDialog } from '../digital-templates/DigitalTemplateDialog';
import { useAuth } from '@/context/AuthContext';
import { Activity } from '@/types/activities';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductActivitiesTabProps {
  disabled?: boolean;
}

export function ProductActivitiesTab({ disabled = false }: ProductActivitiesTabProps) {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading: isProductLoading } = useProductDetails(productId);
  const companyId = product?.company_id;
  const { phases } = useProductPhases(productId, companyId, product);
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useActivities(companyId, productId, phases);
  const { lang } = useTranslation();
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const { user } = useAuth();

  const handleCreateActivity = useCallback(async (activityData: any) => {
    try {
      await createActivity(activityData);
    } catch (error) {
      throw error; // Re-throw to allow dialog to handle error
    }
  }, [createActivity]);

  const handleEditActivity = useCallback((activity: Activity) => {
    setEditActivity(activity);
    setIsEditDialogOpen(true);
  }, []);

  const handleExecuteTemplate = useCallback((activity: Activity) => {
    setEditActivity(activity);
    setIsTemplateDialogOpen(true);
  }, []);

  const handleUpdateActivity = useCallback(async (activityId: string, updates: Partial<Activity>) => {
    try {
      await updateActivity(activityId, updates);
    } catch (error) {
      throw error; // Re-throw to allow dialog to handle error
    }
  }, [updateActivity]);


  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditActivity(null);
    }
  }
  const handleScheduleDialogClose = (open: boolean) => {
    setIsScheduleDialogOpen(open);
  }

  if (isProductLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('activities.context.loadingProduct')}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('activities.context.productNotFound')}
      </div>
    );
  }

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
          onExecuteTemplate={handleExecuteTemplate}
          title={lang('activities.instances.productTitle')}
          disabled={disabled}
        />

      <ScheduleActivityDialog
        open={isScheduleDialogOpen}
        onOpenChange={handleScheduleDialogClose}
        companyId={companyId}
        productId={productId}
        onCreateActivity={handleCreateActivity}
      />

      <EditActivityDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        onSubmit={handleUpdateActivity}
        activity={editActivity}
        companyId={companyId || ''}
        productId={productId}
      />

      {(editActivity as any)?.template_metadata?.useDigitalTemplate && (
        <DigitalTemplateDialog
          open={isTemplateDialogOpen}
          onOpenChange={setIsTemplateDialogOpen}
          activityId={editActivity.id}
          companyId={companyId || ''}
          productId={productId || ''}
          templateType={(editActivity as any).template_metadata.templateData?.type || 'design_review'}
          phase={(editActivity as any).template_metadata.templateData?.phase || 'concept'}
          currentUserId={user?.id || ''}
          activityName={editActivity.name}
        />
      )}
    </div>
  );
}