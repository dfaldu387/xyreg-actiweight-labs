import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ReportUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

interface UploadStatus {
  stage: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: string;
}

const COMMON_SOURCES = [
  'LEK Consulting',
  'IQVIA',
  'McKinsey & Company',
  'Boston Consulting Group',
  'Deloitte',
  'PwC',
  'EY',
  'KPMG',
  'Frost & Sullivan',
  'Internal Research',
  'Other'
];

export function ReportUploadDialog({ open, onOpenChange, companyId }: ReportUploadDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    source: '',
    customSource: '',
    reportDate: '',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang } = useTranslation();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      
      const source = formData.source === 'Other' ? formData.customSource : formData.source;
      if (!formData.title || !source) {
        throw new Error('Title and source are required');
      }

      // Stage 1: File Upload
      setUploadStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Preparing file upload...',
        details: `Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });

      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/${Date.now()}-${file.name}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => {
          if (prev.progress < 80) {
            return {
              ...prev,
              progress: prev.progress + Math.random() * 15,
              message: 'Uploading file...',
            };
          }
          return prev;
        });
      }, 500);

      const { error: uploadError } = await supabase.storage
        .from('market-intelligence-reports')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Stage 2: Database Record Creation
      setUploadStatus({
        stage: 'uploading',
        progress: 85,
        message: lang('reportUpload.creatingRecord'),
        details: lang('reportUpload.savingMetadata')
      });

      const { data: reportData, error: dbError } = await supabase
        .from('market_reports')
        .insert({
          company_id: companyId,
          title: formData.title,
          source: source,
          report_date: formData.reportDate || null,
          description: formData.description || null,
          file_storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Stage 3: Processing Trigger
      setUploadStatus({
        stage: 'processing',
        progress: 90,
        message: lang('reportUpload.initiatingAi'),
        details: lang('reportUpload.startingAnalysis')
      });

      // Trigger processing via edge function
      try {
        const { error: processError } = await supabase.functions.invoke('process-market-report-vertex', {
          body: { 
            reportId: reportData.id,
            companyId: companyId,
            filePath: filePath 
          }
        });

        if (processError) {
          // Don't fail the upload, just show warning
          setUploadStatus({
            stage: 'completed',
            progress: 100,
            message: lang('reportUpload.uploadCompletedPending'),
            details: lang('reportUpload.processingWillStart')
          });
        } else {
          setUploadStatus({
            stage: 'completed',
            progress: 100,
            message: lang('reportUpload.uploadProcessingSuccess'),
            details: lang('reportUpload.aiProcessingBackground')
          });
        }
      } catch (error) {
        setUploadStatus({
          stage: 'completed',
          progress: 100,
          message: lang('reportUpload.uploadCompletedPending'),
          details: lang('reportUpload.processingWillStart')
        });
      }

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-reports', companyId] });
      toast({
        title: lang('reportUpload.uploadSuccess'),
        description: lang('reportUpload.uploadSuccessDescription'),
      });

      // Keep dialog open to show success status for a moment
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: lang('reportUpload.uploadFailed'),
        details: error.message || lang('reportUpload.unexpectedError')
      });

      toast({
        title: lang('reportUpload.uploadFailed'),
        description: error.message || lang('reportUpload.failedTryAgain'),
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({
      title: '',
      source: '',
      customSource: '',
      reportDate: '',
      description: '',
    });
    setFile(null);
    setUploadStatus({
      stage: 'idle',
      progress: 0,
      message: '',
    });
    onOpenChange(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: lang('reportUpload.invalidFileType'),
        description: lang('reportUpload.uploadPdfDocx'),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit, with warnings for large files)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: lang('reportUpload.fileTooLarge'),
        description: lang('reportUpload.fileTooLargeDescription'),
        variant: "destructive",
      });
      return;
    }

    // Warn for large files
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: lang('reportUpload.largeFileDetected'),
        description: lang('reportUpload.largeFileDescription'),
      });
    }

    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const getStatusIcon = () => {
    switch (uploadStatus.stage) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const isUploadInProgress = uploadStatus.stage === 'uploading' || uploadStatus.stage === 'processing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lang('reportUpload.title')}</DialogTitle>
          <DialogDescription>
            {lang('reportUpload.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Status Progress */}
          {uploadStatus.stage !== 'idle' && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium text-sm">{uploadStatus.message}</span>
              </div>
              
              {uploadStatus.progress > 0 && uploadStatus.stage !== 'error' && (
                <Progress value={uploadStatus.progress} className="w-full" />
              )}
              
              {uploadStatus.details && (
                <p className="text-sm text-muted-foreground">{uploadStatus.details}</p>
              )}
              
              {uploadStatus.stage === 'processing' && (
                <div className="text-xs text-muted-foreground mt-2">
                  <p>• {lang('reportUpload.extractingText')}</p>
                  <p>• {lang('reportUpload.generatingSummary')}</p>
                  <p>• {lang('reportUpload.identifyingFindings')}</p>
                  <p className="font-medium mt-1">{lang('reportUpload.processingTime')}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{lang('reportUpload.reportTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={lang('reportUpload.reportTitlePlaceholder')}
                required
                disabled={isUploadInProgress}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">{lang('reportUpload.source')} *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
                required
                disabled={isUploadInProgress}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('reportUpload.selectSource')} />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.source === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customSource">{lang('reportUpload.customSource')} *</Label>
              <Input
                id="customSource"
                value={formData.customSource}
                onChange={(e) => setFormData({ ...formData, customSource: e.target.value })}
                placeholder={lang('reportUpload.customSourcePlaceholder')}
                required
                disabled={isUploadInProgress}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reportDate">{lang('reportUpload.reportDate')}</Label>
            <Input
              id="reportDate"
              type="date"
              value={formData.reportDate}
              onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
              disabled={isUploadInProgress}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{lang('reportUpload.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={lang('reportUpload.descriptionPlaceholder')}
              rows={3}
              disabled={isUploadInProgress}
            />
          </div>

          <div className="space-y-2">
            <Label>{lang('reportUpload.fileUpload')} *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${isUploadInProgress ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-muted-foreground mr-3" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isUploadInProgress && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">
                    {lang('reportUpload.dragAndDrop')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {lang('reportUpload.supportedFormats')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.docx';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files[0]) {
                          handleFileSelect(files[0]);
                        }
                      };
                      input.click();
                    }}
                    disabled={isUploadInProgress}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {lang('reportUpload.browseFiles')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploadInProgress}
            >
              {uploadStatus.stage === 'completed' ? lang('common.close') : lang('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!file || !formData.title || (!formData.source || (formData.source === 'Other' && !formData.customSource)) || isUploadInProgress}
            >
              {isUploadInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  {uploadStatus.stage === 'uploading' ? lang('reportUpload.uploading') : lang('reportUpload.processing')}
                </>
              ) : (
                lang('reportUpload.uploadReport')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
