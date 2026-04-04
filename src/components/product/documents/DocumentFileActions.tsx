import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, Eye, Upload, MoreVertical } from 'lucide-react';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { DocumentFileUpload } from './DocumentFileUpload';
import { toast } from 'sonner';

interface DocumentFileActionsProps {
  document: any;
  companyId: string;
  onFileUpdated: () => void;
}

export function DocumentFileActions({ document, companyId, onFileUpdated }: DocumentFileActionsProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const hasFile = DocumentTemplateFileService.hasAttachedFile(document);
  const fileIcon = DocumentTemplateFileService.getFileIcon(document);

  const handleDownload = async () => {
    if (!hasFile) return;

    setIsDownloading(true);
    try {
      await DocumentTemplateFileService.downloadFile(
        document.file_path,
        document.file_name
      );
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    if (!hasFile) return;

    setIsViewing(true);
    try {
      const viewUrl = await DocumentTemplateFileService.getViewUrl(document.file_path);
      if (viewUrl) {
        window.open(viewUrl, '_blank');
      } else {
        toast.error('Unable to view file');
      }
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view file');
    } finally {
      setIsViewing(false);
    }
  };

  if (hasFile) {
    return (
      <div className="flex items-center gap-1">
        {/* File indicator icon */}
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
          <FileText className="h-3 w-3" />
          <span className="hidden sm:inline">File</span>
        </div>

        {/* Action dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false);
              handleView();
            }} disabled={isViewing}>
              <Eye className="h-4 w-4 mr-2" />
              {isViewing ? 'Loading...' : 'View'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false);
              handleDownload();
            }} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false);
              setShowUploadDialog(true);
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Replace File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DocumentFileUpload
          open={showUploadDialog}
          onOpenChange={(open) => {
            setShowUploadDialog(open);
            if (!open) {
              setDropdownOpen(false);
            }
          }}
          document={document}
          companyId={companyId}
          onFileUploaded={onFileUpdated}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowUploadDialog(true)}
        className="h-8 text-xs"
      >
        <Upload className="h-3 w-3 mr-1" />
        Upload
      </Button>

      <DocumentFileUpload
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) {
            setDropdownOpen(false);
          }
        }}
        document={document}
        companyId={companyId}
        onFileUploaded={onFileUpdated}
      />
    </div>
  );
}