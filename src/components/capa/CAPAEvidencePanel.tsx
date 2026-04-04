import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { CAPAEvidence, CAPAEvidenceType } from '@/types/capa';
import { useUploadCAPAEvidence, useDeleteCAPAEvidence } from '@/hooks/useCAPAData';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, FileText, Image, File, Upload, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAEvidencePanelProps {
  capaId: string;
  evidence: CAPAEvidence[];
  isLoading: boolean;
}

const EVIDENCE_TYPE_LABELS: Record<CAPAEvidenceType, string> = {
  rca: 'Root Cause Analysis',
  action_completion: 'Action Completion',
  voe: 'Verification of Effectiveness',
  other: 'Other',
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return <Image className="h-5 w-5 text-blue-500" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
};

export function CAPAEvidencePanel({ capaId, evidence, isLoading }: CAPAEvidencePanelProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState<CAPAEvidenceType>('other');
  const [description, setDescription] = useState('');
  const { lang } = useTranslation();

  const uploadMutation = useUploadCAPAEvidence();
  const deleteMutation = useDeleteCAPAEvidence();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    await uploadMutation.mutateAsync({
      capaId,
      file: selectedFile,
      evidenceType,
      description: description || undefined,
      userId: user.id,
    });

    setSelectedFile(null);
    setDescription('');
    setEvidenceType('other');
    setDialogOpen(false);
  };

  const handleDelete = async (item: CAPAEvidence) => {
    await deleteMutation.mutateAsync({
      id: item.id,
      storagePath: item.storage_path,
      capaId,
    });
  };

  const handleDownload = async (item: CAPAEvidence) => {
    const { data, error } = await supabase.storage
      .from('capa-evidence')
      .createSignedUrl(item.storage_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{lang('capa.evidenceDocumentation')}</CardTitle>
          <CardDescription>
            {lang('capa.evidenceDescription')}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {lang('capa.uploadEvidence')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang('capa.uploadEvidence')}</DialogTitle>
              <DialogDescription>
                {lang('capa.uploadEvidenceDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{lang('capa.evidenceType')}</Label>
                <Select
                  value={evidenceType}
                  onValueChange={(v) => setEvidenceType(v as CAPAEvidenceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVIDENCE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{lang('capa.file')}</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(selectedFile.name)}
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isDragActive ? lang('capa.dropFileHere') : lang('capa.dragAndDrop')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{lang('capa.maxFileSize')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang('capa.descriptionOptional')}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang('capa.briefDescription')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {lang('capa.cancel')}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? lang('capa.uploading') : lang('capa.upload')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {evidence.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>{lang('capa.noEvidenceYet')}</p>
            <p className="text-sm mt-1">{lang('capa.clickUploadEvidence')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {getFileIcon(item.file_name)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.file_name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {EVIDENCE_TYPE_LABELS[item.evidence_type]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.description && <span>{item.description} • </span>}
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(item)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
