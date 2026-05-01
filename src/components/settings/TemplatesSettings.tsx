import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Upload } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { TemplateManagementTab } from './document-control/templates/TemplateManagementTab';
import { AITemplateImporterDialog } from './document-control/AITemplateImporterDialog';
import { EnhancedTemplateUploadDialog } from './document-control/templates/EnhancedTemplateUploadDialog';
import { TemplateUploadData } from '@/types/templateManagement';
import { TemplateManagementService } from '@/services/templateManagementService';
import { useToast } from '@/hooks/use-toast';

interface TemplatesSettingsProps {
  companyId: string;
}

export function TemplatesSettings({ companyId }: TemplatesSettingsProps) {
  const { lang } = useTranslation();
  const { companyName: rawCompanyName } = useParams<{ companyName: string }>();
  const companyName = rawCompanyName ? decodeURIComponent(rawCompanyName) : '';
  const [aiTemplateDialogOpen, setAiTemplateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (data: TemplateUploadData) => {
    try {
      setIsUploading(true);
      
      // Create template
      const template = await TemplateManagementService.createTemplate(companyId, data);
      
      // Upload file if provided
      if (data.file) {
        await TemplateManagementService.uploadTemplateFile(template.id, data.file);
      }
      
      toast({
        title: lang('common.success'),
        description: lang('templates.toast.uploadSuccess'),
      });
      
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.toast.uploadFailed'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6" data-tour="document-templates">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{lang('templates.title')}</h2>
          <p className="text-muted-foreground">
            {lang('templates.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAiTemplateDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Brain className="h-4 w-4 mr-2" />
            {lang('templates.smartCreator')}
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {lang('templates.uploadTemplate')}
          </Button>
        </div>
      </div>


      {/* Template Management */}
      <TemplateManagementTab 
        companyId={companyId} 
        onOpenAiTemplateDialog={() => setAiTemplateDialogOpen(true)}
        onOpenUploadDialog={() => setUploadDialogOpen(true)}
      />

      {/* AI Template Importer Dialog */}
      <AITemplateImporterDialog
        open={aiTemplateDialogOpen}
        onOpenChange={setAiTemplateDialogOpen}
        companyId={companyId}
        onTemplateCreated={() => {}}
      />

      {/* Upload Dialog */}
      <EnhancedTemplateUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
        companyId={companyId}
      />
    </div>
  );
}