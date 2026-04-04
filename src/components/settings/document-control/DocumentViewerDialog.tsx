import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentItem } from '@/types/client';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { DocToPdfConverterService } from '@/services/docToPdfConverterService';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Eye, ExternalLink, X, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentViewerDialogProps {
  document: DocumentItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function DocumentViewerDialog({
  document,
  open,
  onOpenChange,
  companyId
}: DocumentViewerDialogProps) {
  const hasFile = DocumentTemplateFileService.hasAttachedFile(document);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDocFile, setIsDocFile] = useState(false);

  // Check if file is DOC/DOCX on mount and when document changes
  React.useEffect(() => {
    if (document.file_name && document.file_type) {
      const isDoc = DocToPdfConverterService.isDocFile(document.file_name, document.file_type);
      setIsDocFile(isDoc);
    } else if (document.file_name) {
      const isDoc = DocToPdfConverterService.isDocFile(document.file_name);
      setIsDocFile(isDoc);
    }
  }, [document.file_name, document.file_type]);

  // Cleanup blob URLs when component unmounts or fileUrl changes
  React.useEffect(() => {
    return () => {
      if (fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Cleanup when dialog closes
  React.useEffect(() => {
    if (!showFileViewer && fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
  }, [showFileViewer, fileUrl]);

  const handleViewFile = async () => {
    if (!document.file_path || !document.file_name) {
      toast.error('No file available to view');
      return;
    }

    setIsLoading(true);
    try {
      // If it's a DOC/DOCX file, convert to PDF first
      if (isDocFile) {
        console.log('📄 [VIEW] DOC/DOCX file detected, converting to PDF...');
        
        // Download the file first
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from('document-templates')
          .download(document.file_path);

        if (downloadError || !fileBlob) {
          throw new Error('Failed to download file for conversion');
        }

        // Convert to PDF
        const pdfBlobUrl = await DocToPdfConverterService.convertToPdfBlobUrl(
          fileBlob,
          { fileName: document.file_name }
        );

        if (pdfBlobUrl) {
          setFileUrl(pdfBlobUrl);
          setShowFileViewer(true);
          toast.success('Document converted to PDF for viewing');
        } else {
          throw new Error('Failed to convert document to PDF');
        }
      } else {
        // For non-DOC files, use the original Google Docs Viewer approach
        const publicUrl = DocumentTemplateFileService.getPublicUrl(document.file_path);
        if (publicUrl) {
          // Create Google Docs Viewer URL
          const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;
          console.log('🔗 [GOOGLE VIEWER] Opening with Google Docs Viewer:', googleViewerUrl);

          // Set the URL and show the file viewer dialog
          setFileUrl(googleViewerUrl);
          setShowFileViewer(true);
        } else {
          toast.error('Unable to generate public URL for viewing');
        }
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error(`Failed to open file for viewing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!document.file_path || !document.file_name) {
      toast.error('No file available to download');
      return;
    }

    try {
      await DocumentTemplateFileService.downloadFile(document.file_path, document.file_name);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleConvertToPdf = async () => {
    if (!document.file_path || !document.file_name) {
      toast.error('No file available to convert');
      return;
    }

    if (!isDocFile) {
      toast.error('This file is not a DOC or DOCX file');
      return;
    }

    setIsConverting(true);
    try {
      // Download the file first
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('document-templates')
        .download(document.file_path);

      if (downloadError || !fileBlob) {
        throw new Error('Failed to download file for conversion');
      }

      // Convert and download as PDF
      await DocToPdfConverterService.convertAndDownload(
        fileBlob,
        { fileName: document.file_name }
      );
    } catch (error) {
      console.error('Error converting file to PDF:', error);
      toast.error(`Failed to convert to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-left pr-4">
                  {document.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {document.type}
                  </span>
                  {document.phases && document.phases.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {document.phases.length} phase{document.phases.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {hasFile && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      <FileText className="h-3 w-3 mr-1" />
                      File Attached
                    </span>
                  )}
                </div>
              </div>
              {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Document Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Document Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-900">{document.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tech Applicability:</span>
                      <p className="text-gray-900">{document.techApplicability || 'All device types'}</p>
                    </div>
                  </div>

                  {document.phases && document.phases.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Assigned Phases:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {document.phases.map((phase, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {phase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {document.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{document.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* File Information */}
              {hasFile && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Attached File</h3>
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 truncate max-w-[300px]" title={document.file_name}>{document.file_name}</p>
                          {document.file_type && (
                            <div className="text-sm text-green-600 truncate max-w-[300px]" title={`${document.file_type} • ${formatFileSize(document.file_size)}`}>
                              {`${document.file_type} • ${formatFileSize(document.file_size)}`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewFile}
                          disabled={isLoading}
                          className="text-green-700 border-green-300 hover:bg-green-100 whitespace-nowrap"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              {isDocFile ? 'View as PDF' : document.file_type?.toLowerCase().includes('pdf') ? 'Open PDF' : 'View'}
                            </>
                          )}
                        </Button>
                        {isDocFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleConvertToPdf}
                            disabled={isConverting}
                            className="text-blue-700 border-blue-300 hover:bg-blue-100 whitespace-nowrap"
                          >
                            {isConverting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                                Converting...
                              </>
                            ) : (
                              <>
                                <FileDown className="h-4 w-4 mr-1" />
                                Convert to PDF
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadFile}
                          className="text-green-700 border-green-300 hover:bg-green-100 whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No File Available */}
              {!hasFile && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">File Status</h3>
                  <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No file attached to this document</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Use the edit function to upload a file
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {/* <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {hasFile && (
              <Button onClick={handleViewFile} className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                {document.file_type?.toLowerCase().includes('pdf') ? 'Open PDF' : 'Open File'}
              </Button>
            )}
          </div> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog open={showFileViewer} onOpenChange={setShowFileViewer}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{document.file_name}</DialogTitle>
              <div className="flex items-center gap-2">
                {fileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(fileUrl, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in New Tab
                  </Button>
                )}
                {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileViewer(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button> */}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {fileUrl && (
              <div className="w-full h-[80vh] relative">
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600">
                        {isDocFile ? 'Converting document to PDF...' : 'Loading document...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* For PDF files (including converted ones), use embed tag for better compatibility */}
                {isDocFile || document.file_type?.toLowerCase().includes('pdf') ? (
                  <embed
                    src={fileUrl}
                    type="application/pdf"
                    className="w-full h-full border-0 rounded-md"
                    title={document.file_name}
                  />
                ) : (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full border-0 rounded-md"
                    title={document.file_name}
                    allowFullScreen
                    onError={() => {
                      console.error('❌ [VIEWER] Error loading document');
                      toast.error('Unable to display document. Try opening in a new tab.');
                      setIsLoading(false);
                    }}
                    onLoad={() => {
                      console.log('✅ [VIEWER] Document loaded successfully');
                      setIsLoading(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}