import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DefaultCompanyDocumentTemplate } from "@/types/defaultDocumentTemplateTypes";

interface AddDefaultDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentCreated: () => void;
  createTemplate: (templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }) => Promise<any>;
  editTemplate?: (id: string, templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }) => Promise<any>;
  editingTemplate?: DefaultCompanyDocumentTemplate | null;
}

export function AddDefaultDocumentDialog({
  open,
  onOpenChange,
  onDocumentCreated,
  createTemplate,
  editTemplate,
  editingTemplate
}: AddDefaultDocumentDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'SOP'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [existingFileInfo, setExistingFileInfo] = useState<{
    fileName: string | null;
    fileSize: number | null;
    fileType: string | null;
    publicUrl: string | null;
  } | null>(null);

  const documentTypes = ['SOP', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design'];

  // Populate form when editing
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        description: editingTemplate.description || '',
        documentType: editingTemplate.document_type || 'SOP'
      });
      setFilePath(editingTemplate.file_path || '');
      setIsFileUploading(false);
      
      // Set existing file information
      setExistingFileInfo({
        fileName: editingTemplate.file_name,
        fileSize: editingTemplate.file_size,
        fileType: editingTemplate.file_type,
        publicUrl: editingTemplate.public_url
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        documentType: 'SOP'
      });
      setUploadedFile(null);
      setFilePath('');
      setIsFileUploading(false);
      setExistingFileInfo(null);
    }
  }, [editingTemplate, open]);

  const handleFileChange = (file: File | null, path?: string) => {
    setUploadedFile(file);
    setFilePath(path || '');
    
    if (file && path) {
      setIsFileUploading(false);
    } else if (file && !path) {
      setIsFileUploading(true);
    } else {
      setIsFileUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || isFileUploading) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    if (uploadedFile && !filePath) {
      toast.error("Please wait for file upload to complete");
      return;
    }

    setIsCreating(true);
    try {
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        document_type: formData.documentType,
        file_path: filePath || null,
        file_name: uploadedFile?.name || existingFileInfo?.fileName || null,
        file_size: uploadedFile?.size || existingFileInfo?.fileSize || null,
        file_type: uploadedFile?.type || existingFileInfo?.fileType || null,
        public_url: filePath || existingFileInfo?.publicUrl || null,
        updated_by: user?.id || null
      };

      let result;
      if (editingTemplate && editTemplate) {
        result = await editTemplate(editingTemplate.id, templateData);
      } else {
        result = await createTemplate(templateData);
      }
      
      if (result) {
        toast.success(editingTemplate ? 'Document template updated successfully' : 'Document template created successfully');
        onDocumentCreated();
        onOpenChange(false);
      } else {
        toast.error(editingTemplate ? 'Failed to update document template' : 'Failed to create document template');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        documentType: 'SOP'
      });
      setUploadedFile(null);
      setFilePath('');
      setIsFileUploading(false);
      setExistingFileInfo(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (editingTemplate ? 'Failed to update document template' : 'Failed to create document template');
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Document Template' : 'Add Default Document Template'}</DialogTitle>
          <DialogDescription>
            {editingTemplate ? 'Update the document template details.' : 'Create a new default document template that will be available across the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-2 p-1">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={formData.documentType}
                onValueChange={value => setFormData(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter document description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
               <DocumentFileUpload
                 onFileChange={handleFileChange}
                 disabled={isCreating || isFileUploading}
                 currentFile={existingFileInfo ? {
                   name: existingFileInfo.fileName!,
                   path: existingFileInfo.publicUrl!,
                   uploadedAt: editingTemplate?.uploaded_at || undefined
                 } : undefined}
               />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isCreating || isFileUploading || !formData.name.trim()}>
              {isCreating ? (editingTemplate ? 'Updating...' : 'Creating...') : isFileUploading ? 'Uploading file...' : (editingTemplate ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
