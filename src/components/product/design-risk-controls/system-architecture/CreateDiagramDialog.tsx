import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { SystemArchitectureService } from '@/services/systemArchitectureService';
import { medicalDeviceTemplates } from './medicalDeviceTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  onDiagramCreated: (diagram: any) => void;
}

export function CreateDiagramDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  onDiagramCreated
}: CreateDiagramDialogProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0',
    template: 'blank'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get template data from the new template system
      const selectedTemplate = medicalDeviceTemplates.find(t => t.id === formData.template);
      const initialDiagramData = selectedTemplate 
        ? { nodes: selectedTemplate.nodes, edges: selectedTemplate.edges }
        : { nodes: [], edges: [] };

      const diagram = await SystemArchitectureService.createDiagram({
        company_id: companyId,
        product_id: productId,
        name: formData.name,
        description: formData.description,
        version: formData.version,
        diagram_data: initialDiagramData,
        metadata: {
          template: formData.template,
          createdFrom: 'create-dialog'
        }
      });

      toast({
        title: lang('systemArchitecture.toast.createSuccess'),
        description: lang('systemArchitecture.toast.createSuccessDesc'),
      });

      onDiagramCreated(diagram);
      onOpenChange(false);

      // Reset form
      setFormData({
        name: '',
        description: '',
        version: '1.0',
        template: 'blank'
      });
    } catch (error) {
      console.error('Error creating diagram:', error);
      toast({
        title: lang('common.error'),
        description: lang('systemArchitecture.toast.createError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lang('systemArchitecture.dialog.create.title')}</DialogTitle>
          <DialogDescription>
            {lang('systemArchitecture.dialog.create.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{lang('systemArchitecture.form.name')} *</Label>
            <Input
              id="name"
              placeholder={lang('systemArchitecture.form.namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{lang('systemArchitecture.form.description')}</Label>
            <Textarea
              id="description"
              placeholder={lang('systemArchitecture.form.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">{lang('systemArchitecture.form.version')}</Label>
            <Input
              id="version"
              placeholder="1.0"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{lang('systemArchitecture.form.startingTemplate')}</Label>
            <Tabs defaultValue="General" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="General">General</TabsTrigger>
                <TabsTrigger value="SaMD">SaMD</TabsTrigger>
                <TabsTrigger value="SiMD">SiMD</TabsTrigger>
                <TabsTrigger value="EMDN">EMDN</TabsTrigger>
                <TabsTrigger value="RiskClass">Risk Class</TabsTrigger>
              </TabsList>
              
              {['General', 'SaMD', 'SiMD', 'EMDN', 'RiskClass'].map(category => (
                <TabsContent key={category} value={category} className="mt-2">
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {medicalDeviceTemplates
                        .filter(t => t.category === category)
                        .map(template => (
                          <div
                            key={template.id}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              formData.template === template.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, template: template.id }))}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="font-medium text-sm">{template.name}</div>
                                {template.subcategory && (
                                  <Badge variant="secondary" className="text-xs">
                                    {template.subcategory}
                                  </Badge>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {template.description}
                                </p>
                                {template.regulatoryNotes && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ {template.regulatoryNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? lang('systemArchitecture.dialog.create.creating') : lang('systemArchitecture.dialog.create.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}