
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { ReviewerGroupSelector } from '@/components/common/ReviewerGroupSelector';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface GapAnalysisDocumentUploadProps {
  gapItemId: string;
  companyId?: string;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

export function GapAnalysisDocumentUpload({ 
  gapItemId, 
  companyId, 
  onUploadComplete,
  trigger 
}: GapAnalysisDocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentStatus, setDocumentStatus] = useState('Draft');
  const [selectedReviewerGroup, setSelectedReviewerGroup] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const { reviewerGroups, isLoading: groupsLoading } = useReviewerGroups(companyId);
  const { user } = useAuth(); // Use cached user from context instead of calling getUser()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName) {
      toast.error('Please select a file and enter a document name');
      return;
    }

    setIsUploading(true);

    try {
      // Use cached user from context (no API call needed)
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `gap-analysis-documents/${gapItemId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Create document record - using 'product_document' scope since it's valid
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          name: documentName,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: fileExt,
          file_size: selectedFile.size,
          status: documentStatus,
          document_scope: 'product_document',
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          reviewer_group_id: selectedReviewerGroup || null,
          company_id: companyId
        } as any)
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      // Link document to gap analysis item (user_id is already set from auth.getUser() above)
      const { error: linkError } = await supabase
        .from('gap_document_links')
        .insert({
          gap_item_id: gapItemId,
          document_id: document.id,
          user_id: user.id // Track who linked the document
        });

      if (linkError) {
        throw linkError;
      }

      toast.success('Document uploaded successfully');
      setIsOpen(false);
      setSelectedFile(null);
      setDocumentName('');
      setDocumentStatus('Draft');
      setSelectedReviewerGroup(undefined);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document for Gap Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <div className="mt-1">
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-auto p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>

          <div>
            <Label htmlFor="document-status">Status</Label>
            <Select value={documentStatus} onValueChange={setDocumentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ReviewerGroupSelector
            value={selectedReviewerGroup}
            onValueChange={setSelectedReviewerGroup}
            reviewerGroups={reviewerGroups}
            isLoading={groupsLoading}
            label="Reviewer Group (Optional)"
            allowClear
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !documentName || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
