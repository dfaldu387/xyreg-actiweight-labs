import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CompanyDocumentTemplateService, type CompanyTemplate } from "@/services/companyDocumentTemplateService";
import { TemplateStructureEditor } from "./TemplateStructureEditor";
import { type TemplateStructure } from "@/services/aiTemplateImporterService";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompanyTemplate;
  onTemplateUpdated: () => void;
}

const DOCUMENT_TYPES = [
  'Standard',
  'DHF',
  'DMR', 
  'Technical File',
  'Risk Management',
  'Clinical Evidence',
  'Post-Market Surveillance',
  'Other'
];

const TECH_APPLICABILITY_OPTIONS = [
  'All device types',
  'Active implantable devices',
  'Non-active implantable devices', 
  'Active non-implantable devices',
  'Non-active non-implantable devices',
  'In vitro diagnostic devices',
  'Software as Medical Device (SaMD)',
  'Other'
];

const SCOPE_OPTIONS = [
  { value: 'company', label: 'Company-wide' },
  { value: 'product', label: 'Product-specific' }
] as const;

export function EditTemplateDialog({ 
  open, 
  onOpenChange, 
  template, 
  onTemplateUpdated 
}: EditTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    document_type: '',
    tech_applicability: '',
    description: '',
    scope: 'company' as 'company' | 'product'
  });
  const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        document_type: template.document_type || 'Standard',
        tech_applicability: template.tech_applicability || 'All device types',
        description: template.description || '',
        scope: (template as any).scope || 'company'
      });
      
      // Load the actual template structure from the database or create a basic one
      if (template.structure) {
        console.log('Loading template structure from database:', template.structure);
        setTemplateStructure(template.structure);
      } else {
        console.log('Creating basic template structure for template without saved structure');
        // Create a basic structure for templates that don't have one saved
        setTemplateStructure({
          name: template.name || '',
          document_type: template.document_type,
          tech_applicability: template.tech_applicability || '',
          description: template.description || '',
          metadata: {
            ai_provider: 'manual',
            confidence_score: 1.0,
            ai_generated: false,
            original_filename: template.name,
            analysis_timestamp: new Date().toISOString()
          },
          sections: [
            {
              id: 'general_info',
              name: 'General Information',
              description: 'Basic document information',
              order: 1,
              fields: [
                {
                  id: 'title',
                  name: 'title',
                  type: 'text',
                  label: 'Document Title',
                  description: 'The title of the document',
                  required: true,
                  placeholder: 'Enter document title'
                },
                {
                  id: 'version',
                  name: 'version',
                  type: 'text',
                  label: 'Version',
                  description: 'Document version',
                  required: true,
                  placeholder: 'e.g., 1.0'
                },
                {
                  id: 'author',
                  name: 'author',
                  type: 'text',
                  label: 'Author',
                  description: 'Document author',
                  required: true,
                  placeholder: 'Enter author name'
                }
              ]
            }
          ]
        });
      }
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    await saveTemplate();
  };

  const handleStructureSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    await saveTemplate();
  };

  const saveTemplate = async () => {
    setIsLoading(true);
    try {
      const success = await CompanyDocumentTemplateService.updateTemplate(template.id, {
        name: formData.name.trim(),
        document_type: formData.document_type,
        tech_applicability: formData.tech_applicability,
        description: formData.description.trim() || undefined,
        scope: formData.scope,
        
        structure: templateStructure // Save the updated structure
      });

      if (success) {
        toast.success('Template updated successfully');
        onTemplateUpdated();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="structure">Template Structure</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (templateStructure) {
                      setTemplateStructure({ ...templateStructure, name: e.target.value });
                    }
                  }}
                  placeholder="Enter template name"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, document_type: value });
                    if (templateStructure) {
                      setTemplateStructure({ ...templateStructure, document_type: value });
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_applicability">Tech Applicability</Label>
                <Select
                  value={formData.tech_applicability}
                  onValueChange={(value) => {
                    setFormData({ ...formData, tech_applicability: value });
                    if (templateStructure) {
                      setTemplateStructure({ ...templateStructure, tech_applicability: value });
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tech applicability" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_APPLICABILITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Template Scope</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value: 'company' | 'product') => {
                    setFormData({ ...formData, scope: value });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (templateStructure) {
                      setTemplateStructure({ ...templateStructure, description: e.target.value });
                    }
                  }}
                  placeholder="Enter template description (optional)"
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Template'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="structure" className="mt-4">
            {templateStructure && (
              <div className="space-y-4">
                <TemplateStructureEditor
                  structure={templateStructure}
                  onStructureChange={setTemplateStructure}
                  analysisMetadata={templateStructure.metadata}
                />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStructureSave}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Template'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}