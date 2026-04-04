
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building } from 'lucide-react';
import { useActivityTemplates } from '@/hooks/useActivityTemplates';
import { ActivityTemplate, ACTIVITY_TYPES } from '@/types/activities';

interface TemplateSelectionFormProps {
  companyId: string;
  onTemplateSelect: (template: ActivityTemplate) => void;
  onBack: () => void;
}

export function TemplateSelectionForm({ companyId, onTemplateSelect, onBack }: TemplateSelectionFormProps) {
  const { templates, isLoading } = useActivityTemplates(companyId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Select Template</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading templates...
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Select Template</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No activity templates available.</p>
          <p className="text-sm">Create templates in the Activity Library first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">Select Template</h2>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {ACTIVITY_TYPES[template.type]}
                </span>
              </div>
              {template.description && (
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
