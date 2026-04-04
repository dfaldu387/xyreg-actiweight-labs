
import React, { useRef, useEffect, useState } from "react";
import { FileText, FileQuestion, Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { PageAwareCommentPin } from "./PageAwareCommentPin";
import { EnhancedInlineCommentInput } from "./EnhancedInlineCommentInput";
import { CommentThreadDialog } from "./CommentThreadDialog";
import { DocumentReviewStatus } from "./DocumentReviewStatus";
import { HighlightingToolbar } from "./HighlightingToolbar";
import { PdfViewer } from "./PdfViewer";
import { PdfErrorBoundary } from "../error/PdfErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSimpleScrollTracking } from "@/hooks/useSimpleScrollTracking";
import { useTextHighlighting } from "@/hooks/useTextHighlighting";
import { useEnhancedCommentPositioning } from "@/hooks/useEnhancedCommentPositioning";
import type { CommentThread, CommentPosition, EnhancedCommentPosition } from "@/types/comments";

interface DocumentPreviewProps {
  documentId: string | null;
  documentFile?: {
    path: string;
    name: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  } | null;
  existingComments?: CommentThread[];
  canReview?: boolean;
  onDocumentApproved?: () => void;
  onDocumentRejected?: () => void;
  onChangesRequested?: () => void;
}


// Type guard to safely check if position is enhanced
const isEnhancedPosition = (position: CommentPosition | EnhancedCommentPosition | undefined): position is EnhancedCommentPosition => {
  return position ? 'page_number' in position : false;
};

export function DocumentPreview({
  documentId,
  documentFile,
  existingComments = [],
  canReview = false,
  onDocumentApproved,
  onDocumentRejected,
  onChangesRequested
}: DocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null);
  const [selectedThread, setSelectedThread] = useState<CommentThread | null>(null);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(true);
  const [fileLoadRetryCount, setFileLoadRetryCount] = useState(0);

  // Document review state
  const [reviewStatus, setReviewStatus] = useState<'not_started' | 'in_review' | 'changes_requested' | 'approved' | 'rejected'>('not_started');


  const {
    highlights,
    isHighlighting,
    startHighlighting,
    stopHighlighting,
    createHighlight
  } = useTextHighlighting(documentId || '');

  const {
    iframeRef,
    containerRef: scrollContainerRef,
    calculateAdjustedPosition,
    storePosition
  } = useSimpleScrollTracking();

  // Enhanced comment positioning
  const {
    showCommentInput,
    commentPosition,
    selectedText,
    startPositioning,
    clearPosition,
    convertToStorageFormat
  } = useEnhancedCommentPositioning();

  // Load file from Supabase storage when documentFile changes
  useEffect(() => {
    const loadFile = async () => {
      if (!documentFile?.path) {
        setFileUrl(null);
        return;
      }

      setIsLoadingFile(true);
      setFileError(null);

      try {
        const { data, error } = await supabase.storage
          .from('document-files')
          .createSignedUrl(documentFile.path, 3600);

        if (error) {
          console.error('❌ Supabase storage error:', error);
          throw error;
        }

        setFileUrl(data.signedUrl);

        // Test if the URL is actually accessible
        try {
          const response = await fetch(data.signedUrl, { method: 'HEAD' });
          if (!response.ok) {
            throw new Error(`File not accessible: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('❌ File accessibility test failed:', fetchError);
          throw new Error('File exists but is not accessible');
        }

      } catch (error) {
        console.error('❌ Error loading file:', error);

        let errorMessage = 'Failed to load document file';
        if (error instanceof Error) {
          if (error.message.includes('not accessible')) {
            errorMessage = 'Document file is not accessible. Please check permissions.';
          } else if (error.message.includes('not found')) {
            errorMessage = 'Document file not found. It may have been moved or deleted.';
          } else {
            errorMessage = `Failed to load file: ${error.message}`;
          }
        }

        setFileError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingFile(false);
      }
    };

    loadFile();
  }, [documentFile, fileLoadRetryCount]);

  // Update container bounds when container changes
  useEffect(() => {
    if (containerRef.current) {
      setContainerBounds(containerRef.current.getBoundingClientRect());
    }
  }, [containerRef.current]);

  // Clear comment input when highlighting mode is activated
  useEffect(() => {
    if (isHighlighting && showCommentInput) {
      clearPosition();
    }
  }, [isHighlighting, showCommentInput, clearPosition]);

  // Enhanced click handler for adding comments (including double-click)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let clickTimeout: NodeJS.Timeout | null = null;
    let clickCount = 0;

    const handleDocumentClick = (event: MouseEvent) => {
      // Don't create comments if highlighting mode is active
      if (isHighlighting) {
        return;
      }

      clickCount++;

      // Clear existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      // Set new timeout
      clickTimeout = setTimeout(() => {
        const target = event.target as Element;

        // Don't create comments if clicking on existing UI elements
        if (target.closest('[data-comment-ui]') || target.closest('button') || target.closest('.comment-pin')) {
          clickCount = 0;
          return;
        }

        // Only create comments on PDF content
        if (!target.closest('.react-pdf__Page') && !target.closest('iframe') && !target.closest('[data-pdf-content]')) {
          clickCount = 0;
          return;
        }

        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Handle single click (existing behavior)
        if (clickCount === 1) {
          startPositioning(x, y, container);
        }
        // Handle double click (new feature)
        else if (clickCount === 2) {
          startPositioning(x, y, container);
        }

        clickCount = 0;
      }, 300); // Wait 300ms to detect double-click
    };

    container.addEventListener('click', handleDocumentClick);
    return () => {
      container.removeEventListener('click', handleDocumentClick);
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [startPositioning, isHighlighting]);

  const handleCommentClick = (comment: CommentThread) => {
    setSelectedThread(comment);
    setThreadDialogOpen(true);
  };

  const handleRetryFileLoad = () => {
    setFileLoadRetryCount(prev => prev + 1);
    setFileError(null);
  };

  const isPdfFile = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const convertCommentPosition = (comment: CommentThread) => {
    const position = comment.position;
    if (!position) return { x: 0, y: 0 };

    // If we have page-aware coordinates, use them
    if (isEnhancedPosition(position) && position.page_x !== undefined && position.page_y !== undefined) {
      // Convert page-relative coordinates back to viewport coordinates
      // This is a simplified version - in a real implementation, you'd need the actual page dimensions
      return calculateAdjustedPosition(position.x || 0, position.y || 0);
    }

    // Fallback to legacy positioning
    return calculateAdjustedPosition(position.x || 0, position.y || 0);
  };

  const renderFilePreview = () => {
    if (isLoadingFile) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
            <p className="text-xs text-muted-foreground mt-1">{documentFile?.name}</p>
            {documentFile?.size && (
              <p className="text-xs text-muted-foreground">
                Size: {Math.round(documentFile.size / 1024)} KB
              </p>
            )}
          </div>
        </div>
      );
    }

    if (fileError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">File Loading Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{fileError}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRetryFileLoad}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry {fileLoadRetryCount > 0 && `(${fileLoadRetryCount})`}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!fileUrl || !documentFile) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No File Attached</h3>
            <p className="text-sm text-muted-foreground">
              This document doesn't have an attached file to preview.
            </p>
          </div>
        </div>
      );
    }

    // Handle PDF files with error boundary
    if (isPdfFile(documentFile.name)) {
      return (
        <PdfErrorBoundary fileName={documentFile.name}>
          <PdfViewer
            fileUrl={fileUrl}
            documentId={documentId || ''}
            fileName={documentFile.name}
            isHighlighting={isHighlighting}
            onTextSelection={() => { }} // No longer needed since we handle this in the new highlighter
          />
        </PdfErrorBoundary>
      );
    }

    // Handle other file types with iframe
    return (
      <div className="h-full w-full relative min-h-[85vh]">
        <iframe
          ref={iframeRef}
          src={fileUrl}
          className="w-full h-full border-0 min-h-[85vh]"
          title={`Preview of ${documentFile.name}`}
          onLoad={() => console.log('📄 Document iframe loaded')}
          onError={() => {
            setFileError('Failed to load document in preview');
            toast.error('Failed to load document preview');
          }}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Document Header */}
      <div className="border-b bg-white p-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Document Preview</h2>
            {documentFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{documentFile.name}</span>
                {documentFile.size && (
                  <span>({Math.round(documentFile.size / 1024)} KB)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {canReview && (
          <DocumentReviewStatus
            documentId={documentId || ''}
            documentName={documentFile?.name || 'Document'}
            reviewStatus={reviewStatus}
            onApprove={onDocumentApproved}
            onRequestChanges={onChangesRequested}
            onReject={onDocumentRejected}
            canReview={canReview}
          />
        )}
      </div>

      {/* Highlighting Toolbar */}
      {documentId && fileUrl && (
        <HighlightingToolbar
          isHighlighting={isHighlighting}
          onToggleHighlighting={() => isHighlighting ? stopHighlighting() : startHighlighting()}
          onApprove={onDocumentApproved}
          onRequestChanges={onChangesRequested}
          onReject={onDocumentRejected}
          showHideResolved={showResolved}
          onToggleResolved={() => setShowResolved(!showResolved)}
          commentCount={existingComments.length}
          resolvedCount={existingComments.filter(c => c.comments?.[0]?.comment_status === 'resolved').length}
          canReview={canReview}
        />
      )}

      {/* Document Content */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-[90vh]">
        {renderFilePreview()}

        {/* Enhanced Comment Pins Overlay */}
        {containerBounds && existingComments.map((comment) => {
          const mainComment = comment.comments?.[0];
          if (!showResolved && mainComment?.comment_status === 'resolved') return null;

          const position = convertCommentPosition(comment);
          const enhancedPosition = isEnhancedPosition(comment.position) ? comment.position : null;

          return (
            <PageAwareCommentPin
              key={comment.id}
              x={position.x}
              y={position.y}
              pageNumber={enhancedPosition?.page_number || 1}
              commentCount={comment.comments?.length || 0}
              commentPreview={mainComment?.content}
              commentStatus={mainComment?.comment_status || 'open'}
              commentPriority={mainComment?.comment_priority || 'normal'}
              reviewerGroupName={comment.position?.reviewer_group_name}
              authorName={mainComment?.user_profiles?.first_name + ' ' + mainComment?.user_profiles?.last_name}
              createdAt={comment.created_at}
              isInternal={comment.is_internal}
              hasTextContext={enhancedPosition && !!enhancedPosition.text_context}
              selectedText={enhancedPosition?.text_context?.selectedText}
              onClick={() => handleCommentClick(comment)}
            />
          );
        })}

        {/* Enhanced Comment Input - only show when not highlighting */}
        {showCommentInput && commentPosition && containerBounds && !isHighlighting && (
          <div data-comment-ui>
            <EnhancedInlineCommentInput
              documentId={documentId || ''}
              companyId={undefined}
              position={commentPosition}
              selectedText={selectedText}
              onClose={clearPosition}
              containerBounds={containerBounds}
            />
          </div>
        )}
      </div>

      {/* Comment Thread Dialog */}
      {selectedThread && (
        <CommentThreadDialog
          thread={selectedThread}
          open={threadDialogOpen}
          onOpenChange={setThreadDialogOpen}
          documentId={documentId}
        />
      )}
    </div>
  );
}
