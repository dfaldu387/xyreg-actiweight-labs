import React, { useState } from 'react';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PdfViewer } from '@/components/product/PdfViewer';

interface DocumentContentViewerProps {
  filePath: string;
  fileName: string;
  fileType?: string;
  className?: string;
}

interface ParsedContent {
  text: string;
  images: Array<{ path: string; page: number }>;
  pages: number;
}

export function DocumentContentViewer({ 
  filePath, 
  fileName, 
  fileType,
  className 
}: DocumentContentViewerProps) {
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isPdf = fileType?.toLowerCase() === 'pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isOfficeDoc = fileType?.toLowerCase().includes('word') || 
                      fileName.toLowerCase().match(/\.(doc|docx)$/);

  const canPreview = isPdf || isOfficeDoc;

  const parseDocument = async () => {
    if (!isOfficeDoc) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the document using the document parsing functionality
      // For now, we'll simulate document parsing until the backend API is ready
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a more realistic preview that shows document structure
      // This will be replaced with actual parsing once the API is implemented
      setParsedContent({
        text: `DOCUMENT PREVIEW: ${fileName}

This document contains structured content that would be extracted through document parsing.

Document Information:
- File Name: ${fileName}
- File Size: ${Math.round(blob.size / 1024)} KB
- File Type: ${blob.type || 'Microsoft Word Document'}

Content Preview:
The document parsing feature will extract:
- All text content with proper formatting
- Tables and structured data
- Images and embedded media
- Headers, footers, and page structure
- Metadata and document properties

To implement full document parsing, the backend API endpoint needs to be created using the document parsing tool. This will provide actual text extraction, image processing, and content structure analysis.

For immediate viewing, please download the document.`,
        images: [],
        pages: 1,
      });
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Unable to preview this document. Please download it to view the contents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewToggle = () => {
    if (!showPreview && isOfficeDoc && !parsedContent) {
      parseDocument();
    }
    setShowPreview(!showPreview);
  };

  if (!canPreview) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Preview not available for this file type. Only PDF and Word documents can be previewed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {/* Preview Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sm">Document Preview</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewToggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="h-3 w-3 mr-1" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview Content */}
      {showPreview && (
        <div className="border rounded-lg overflow-hidden">
          {isPdf ? (
            <div className="h-96">
              <PdfViewer 
                fileUrl={filePath}
                documentId="template-preview"
                fileName={fileName}
                isHighlighting={false}
              />
            </div>
          ) : isOfficeDoc && parsedContent ? (
            <div className="p-4 max-h-96 overflow-y-auto bg-muted/20">
              {/* Document Info */}
              <div className="mb-4 text-sm text-muted-foreground">
                {parsedContent.pages > 1 && (
                  <span>Pages: {parsedContent.pages}</span>
                )}
              </div>

              {/* Document Content */}
              <div className="prose prose-sm max-w-none">
                {parsedContent.text ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {parsedContent.text}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No text content found in document
                  </div>
                )}
              </div>

              {/* Images */}
              {parsedContent.images && parsedContent.images.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-medium text-sm mb-2">Images ({parsedContent.images.length})</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {parsedContent.images.map((image, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        Image {index + 1} (Page {image.page})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}