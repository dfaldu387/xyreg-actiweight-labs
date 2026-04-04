import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, Building, Plus, FileText } from 'lucide-react';
import { useActivityTemplates } from '@/hooks/useActivityTemplates';
import { ActivityTemplate, ACTIVITY_TYPES } from '@/types/activities';
import { ActivityInstanceDialog } from './ActivityInstanceDialog';
import { useTranslation } from '@/hooks/useTranslation';

interface ScheduleActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string | null;
  onCreateActivity: (activityData: any) => void;
}

export function ScheduleActivityDialog({ 
  open, 
  onOpenChange, 
  companyId,
  productId, 
  onCreateActivity 
}: ScheduleActivityDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'predefined' | 'manual' | 'design_review' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);
  const { templates, isLoading } = useActivityTemplates(companyId);
  const { lang } = useTranslation();

  const handleClose = () => {
    setSelectedOption(null);
    setSelectedTemplate(null);
    setShowInstanceDialog(false);
    onOpenChange(false);
  };

  const handleTemplateSelect = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setShowInstanceDialog(true);
  };

  const handleManualCreate = () => {
    setSelectedOption('manual');
    setSelectedTemplate(null);
    setShowInstanceDialog(true);
  };

  const handleDesignReviewCreate = () => {
    setSelectedOption('design_review');
    setSelectedTemplate(null);
    setShowInstanceDialog(true);
  };

  const handleCreateInstance = (activityData: any) => {
    onCreateActivity(activityData);
    handleClose();
  };

  const handleBack = () => {
    setSelectedOption(null);
    setSelectedTemplate(null);
  };

  // Handle the design review creation case
  if (showInstanceDialog && selectedOption === 'design_review') {
    return (
      <ActivityInstanceDialog
        open={showInstanceDialog}
        onOpenChange={setShowInstanceDialog}
        onSubmit={handleCreateInstance}
        selectedTemplate={null}
        companyId={companyId}
        productId={productId}
        isManualActivity={false}
        isDesignReview={true}
      />
    );
  }

  // Handle the manual activity creation case
  if (showInstanceDialog && selectedOption === 'manual') {
    return (
      <ActivityInstanceDialog
        open={showInstanceDialog}
        onOpenChange={setShowInstanceDialog}
        onSubmit={handleCreateInstance}
        selectedTemplate={null}
        companyId={companyId}
        productId={productId}
        isManualActivity={true}
      />
    );
  }

  if (showInstanceDialog && selectedTemplate) {
    return (
      <ActivityInstanceDialog
        open={showInstanceDialog}
        onOpenChange={setShowInstanceDialog}
        onSubmit={handleCreateInstance}
        selectedTemplate={selectedTemplate}
        companyId={companyId}
        productId={productId}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedOption ? (
              <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
                ←
              </Button>
            ) : null}
            <Calendar className="h-5 w-5" />
            {lang('activities.scheduleDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedOption ? (
            // Option selection screen
            <div className="grid gap-4">
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedOption('predefined')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {lang('activities.scheduleDialog.choosePredefinedTitle')}
                  </CardTitle>
                  <CardDescription>
                    {lang('activities.scheduleDialog.choosePredefinedDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {lang('activities.scheduleDialog.templatesAvailable').replace('{{count}}', String(templates.length))}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {lang('activities.scheduleDialog.browseTemplates')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleDesignReviewCreate}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang('activities.scheduleDialog.scheduleDesignReviewTitle')}
                  </CardTitle>
                  <CardDescription>
                    {lang('activities.scheduleDialog.scheduleDesignReviewDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{lang('activities.scheduleDialog.digitalTemplateBadge')}</Badge>
                    <Button variant="outline" size="sm">
                      {lang('activities.scheduleDialog.scheduleReview')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleManualCreate}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {lang('activities.scheduleDialog.scheduleManualTitle')}
                  </CardTitle>
                  <CardDescription>
                    {lang('activities.scheduleDialog.scheduleManualDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{lang('activities.scheduleDialog.customActivityBadge')}</Badge>
                    <Button variant="outline" size="sm">
                      {lang('activities.scheduleDialog.createActivity')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : selectedOption === 'predefined' ? (
            // Predefined activity (template) selection screen
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {lang('activities.scheduleDialog.loadingTemplates')}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{lang('activities.scheduleDialog.noTemplatesTitle')}</p>
                  <p className="text-xs">{lang('activities.scheduleDialog.noTemplatesHint')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{template.name}</h3>
                              <Badge variant="outline">
                                {ACTIVITY_TYPES[template.type]}
                              </Badge>
                            </div>
                            {template.description && (
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            )}
                          </div>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            {lang('activities.scheduleDialog.select')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}