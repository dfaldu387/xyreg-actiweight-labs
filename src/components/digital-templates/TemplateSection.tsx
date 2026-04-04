import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { DesignReviewSection } from '@/services/designReviewTemplateService';

interface TemplateSectionProps {
  section: DesignReviewSection;
  sectionData?: any;
  onSave: (data: any) => Promise<boolean>;
  isReadOnly?: boolean;
  saving?: boolean;
}

export function TemplateSection({
  section,
  sectionData,
  onSave,
  isReadOnly = false,
  saving = false
}: TemplateSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localData, setLocalData] = useState(sectionData || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalData(sectionData || {});
    setHasChanges(false);
  }, [sectionData]);

  const handleSave = async () => {
    const success = await onSave(localData);
    if (success) {
      setHasChanges(false);
    }
  };

  const isCompleted = () => {
    if (section.section_type === 'checklist') {
      const items = section.phase_specific_data?.items || [];
      const checkedItems = localData.checkedItems || {};
      return items.every((_, index) => checkedItems[index]);
    }

    if (section.section_type === 'form') {
      const fields = section.phase_specific_data?.fields || [];
      const responses = localData.responses || {};
      return fields.every(field => responses[field.label]?.trim());
    }

    return false;
  };

  const handleChecklistChange = (index: number, checked: boolean) => {
    if (isReadOnly) return;
    
    const newCheckedItems = { ...localData.checkedItems, [index]: checked };
    setLocalData({ ...localData, checkedItems: newCheckedItems });
    setHasChanges(true);
  };

  const handleFormChange = (fieldLabel: string, value: string) => {
    if (isReadOnly) return;
    
    const newResponses = { ...localData.responses, [fieldLabel]: value };
    setLocalData({ ...localData, responses: newResponses });
    setHasChanges(true);
  };

  const completed = isCompleted();

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div>
                  <CardTitle className="text-left">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground text-left">
                    {section.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completed ? (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
                {section.required && (
                  <Badge variant="outline" className="shrink-0">Required</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            {section.section_type === 'checklist' && (
              <div className="space-y-3">
                {section.phase_specific_data?.items?.map((item: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Checkbox
                      checked={localData.checkedItems?.[index] || false}
                      onCheckedChange={(checked) => handleChecklistChange(index, !!checked)}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                    <label className="text-sm leading-5 cursor-pointer flex-1">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {section.section_type === 'form' && (
              <div className="space-y-4">
                {section.phase_specific_data?.fields?.map((field: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`field-${index}`}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`field-${index}`}
                        value={localData.responses?.[field.label] || ''}
                        onChange={(e) => handleFormChange(field.label, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        disabled={isReadOnly}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={`field-${index}`}
                        type={field.type || 'text'}
                        value={localData.responses?.[field.label] || ''}
                        onChange={(e) => handleFormChange(field.label, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasChanges && !isReadOnly && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}