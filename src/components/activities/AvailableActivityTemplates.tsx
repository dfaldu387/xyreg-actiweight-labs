
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Settings, Plus } from "lucide-react";
import { useActivityTemplates } from "@/hooks/useActivityTemplates";
import { ActivityTemplate, ACTIVITY_TYPES } from "@/types/activities";
import { ActivityInstanceDialog } from "./ActivityInstanceDialog";

interface AvailableActivityTemplatesProps {
  companyId: string;
  onCreateActivity?: (activityData: any) => void;
}

export function AvailableActivityTemplates({ 
  companyId, 
  onCreateActivity
}: AvailableActivityTemplatesProps) {
  const [createInstanceDialogOpen, setCreateInstanceDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const { templates, isLoading } = useActivityTemplates(companyId);

  const handleScheduleActivity = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setCreateInstanceDialogOpen(true);
  };

  const handleCreateInstance = (activityData: any) => {
    if (onCreateActivity) {
      onCreateActivity(activityData);
    }
    setCreateInstanceDialogOpen(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Available Activity Templates
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ready-to-schedule activity templates for your company
              </p>
            </div>
            <Badge variant="secondary">{templates.length} available</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activity templates are available for scheduling.</p>
              <p className="text-xs">Create templates in Company Settings to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline">
                          {ACTIVITY_TYPES[template.type]}
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                    </div>
                    <Button onClick={() => handleScheduleActivity(template)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Activity
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <ActivityInstanceDialog
          open={createInstanceDialogOpen}
          onOpenChange={setCreateInstanceDialogOpen}
          onSubmit={handleCreateInstance}
          selectedTemplate={selectedTemplate}
          companyId={companyId}
        />
      )}
    </>
  );
}
