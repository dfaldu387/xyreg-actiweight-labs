import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Settings, GripVertical, Edit } from "lucide-react";
import { TemplateStructure, TemplateField, TemplateSection } from "@/services/aiTemplateImporterService";

interface TemplateStructureEditorProps {
  structure: TemplateStructure;
  onStructureChange: (structure: TemplateStructure) => void;
  analysisMetadata?: any;
}

export function TemplateStructureEditor({ 
  structure, 
  onStructureChange, 
  analysisMetadata 
}: TemplateStructureEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string>(structure.sections[0]?.id || '');
  const [selectedField, setSelectedField] = useState<string>('');

  const updateStructure = (updates: Partial<TemplateStructure>) => {
    onStructureChange({
      ...structure,
      ...updates
    });
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    const sections = structure.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateStructure({ sections });
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<TemplateField>) => {
    const sections = structure.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    );
    updateStructure({ sections });
  };

  const addSection = () => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      name: 'New Section',
      description: '',
      order: structure.sections.length + 1,
      fields: []
    };
    updateStructure({ sections: [...structure.sections, newSection] });
    setSelectedSection(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    const sections = structure.sections.filter(s => s.id !== sectionId);
    updateStructure({ sections });
    if (selectedSection === sectionId) {
      setSelectedSection(sections[0]?.id || '');
    }
  };

  const addField = (sectionId: string) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      name: 'new_field',
      type: 'text',
      label: 'New Field',
      description: '',
      required: false,
      placeholder: ''
    };
    
    updateSection(sectionId, {
      fields: [...(structure.sections.find(s => s.id === sectionId)?.fields || []), newField]
    });
    setSelectedField(newField.id);
  };

  const deleteField = (sectionId: string, fieldId: string) => {
    const section = structure.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    updateSection(sectionId, {
      fields: section.fields.filter(f => f.id !== fieldId)
    });
    
    if (selectedField === fieldId) {
      setSelectedField('');
    }
  };

  const currentSection = structure.sections.find(s => s.id === selectedSection);
  const currentField = currentSection?.fields.find(f => f.id === selectedField);

  return (
    <div className="space-y-6">
      {/* Template Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={structure.name}
                onChange={(e) => updateStructure({ name: e.target.value })}
                placeholder="Template name..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select 
                value={structure.document_type} 
                onValueChange={(value) => updateStructure({ document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Regulatory">Regulatory</SelectItem>
                  <SelectItem value="Clinical">Clinical</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="SOP">SOP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={structure.description || ''}
              onChange={(e) => updateStructure({ description: e.target.value })}
              placeholder="Template description..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech-applicability">Tech Applicability</Label>
            <Input
              id="tech-applicability"
              value={structure.tech_applicability}
              onChange={(e) => updateStructure({ tech_applicability: e.target.value })}
              placeholder="e.g., All device types, Software only, Hardware only..."
            />
          </div>

          {analysisMetadata && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                AI Confidence: {Math.round(analysisMetadata.confidence_score * 100)}%
              </Badge>
              <Badge variant="outline">
                Provider: {analysisMetadata.ai_provider}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Structure Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Template Structure</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the sections and fields for your template
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSection} onValueChange={setSelectedSection} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1 h-auto w-auto">
                {structure.sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="relative group"
                  >
                    <span className="truncate">{section.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <Button onClick={addSection} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>

            {structure.sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                {/* Section Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section: {section.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Section Name</Label>
                        <Input
                          value={section.name}
                          onChange={(e) => updateSection(section.id, { name: e.target.value })}
                          placeholder="Section name..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={section.order}
                          onChange={(e) => updateSection(section.id, { order: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Section Description</Label>
                      <Textarea
                        value={section.description || ''}
                        onChange={(e) => updateSection(section.id, { description: e.target.value })}
                        placeholder="Section description..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Fields */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Fields ({section.fields.length})</CardTitle>
                      <Button onClick={() => addField(section.id)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <div
                          key={field.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedField === field.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => setSelectedField(selectedField === field.id ? '' : field.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{field.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {field.type} • {field.required ? 'Required' : 'Optional'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{field.type}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteField(section.id, field.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Field Editor */}
                          {selectedField === field.id && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Field Name (internal)</Label>
                                  <Input
                                    value={field.name}
                                    onChange={(e) => updateField(section.id, field.id, { name: e.target.value })}
                                    placeholder="field_name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Field Type</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value: TemplateField['type']) => 
                                      updateField(section.id, field.id, { type: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="textarea">Textarea</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="select">Select</SelectItem>
                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Display Label</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                    placeholder="Field label"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Placeholder</Label>
                                  <Input
                                    value={field.placeholder || ''}
                                    onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                                    placeholder="Placeholder text..."
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description/Help Text</Label>
                                <Textarea
                                  value={field.description || ''}
                                  onChange={(e) => updateField(section.id, field.id, { description: e.target.value })}
                                  placeholder="Help text for this field..."
                                  rows={2}
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateField(section.id, field.id, { required: checked })}
                                />
                                <Label htmlFor={`required-${field.id}`}>Required field</Label>
                              </div>

                              {field.type === 'select' && (
                                <div className="space-y-2">
                                  <Label>Options (one per line)</Label>
                                  <Textarea
                                    value={(field.options || []).join('\n')}
                                    onChange={(e) => updateField(section.id, field.id, { 
                                      options: e.target.value.split('\n').filter(o => o.trim()) 
                                    })}
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {section.fields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No fields in this section. Click "Add Field" to get started.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}