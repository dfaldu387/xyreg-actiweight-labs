import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextHighlightRenderer } from './TextHighlightRenderer';
import { CommentSidebar } from './CommentSidebar';
import { CommentBubble } from './CommentBubble';
import { useDocumentAnnotations } from '@/hooks/useDocumentAnnotations';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface TextHighlight {
  id: string;
  text: string;
  color: string;
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  pageNumber: number;
  commentNumber: number;
  hasComments: boolean;
}

interface PdfViewerEnhancedProps {
  fileUrl: string;
  documentId: string;
  fileName: string;
  isHighlighting?: boolean;
  onTextSelection?: (selectedText: string, bounds: DOMRect, pageNumber: number) => void;
}

export function PdfViewerEnhanced({
  fileUrl,
  documentId,
  fileName,
  isHighlighting = false,
  onTextSelection
}: PdfViewerEnhancedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const {
    annotations,
    threads,
    addAnnotation,
    addComment,
    updateComment,
    deleteComment,
    loadAnnotations,
    loadCommentThreads
  } = useDocumentAnnotations(documentId);

  useEffect(() => {
    if (documentId) {
      loadAnnotations();
      loadCommentThreads();
    }
  }, [documentId, loadAnnotations, loadCommentThreads]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    setIsLoading(false);
    toast.error('Failed to load PDF document');
  };

  const handleTextSelection = useCallback(() => {
    if (!isHighlighting) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const relativeRect = new DOMRect(
        rect.left - containerRect.left,
        rect.top - containerRect.top,
        rect.width,
        rect.height
      );

      setSelectedText(selectedText);
      setSelectionBounds(relativeRect);
      setShowCommentInput(true);

      // Clear the selection
      selection.removeAllRanges();
    }
  }, [isHighlighting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleTextSelection);
    return () => container.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  const handleAddHighlight = async (color: string, comment?: string) => {
    if (!selectedText || !selectionBounds) return;

    try {
      await addAnnotation({
        type: 'highlight',
        content: selectedText,
        position: {
          page_number: pageNumber,
          page_x: selectionBounds.left,
          page_y: selectionBounds.top,
          width: selectionBounds.width,
          height: selectionBounds.height
        },
        color,
        comment
      });

      setShowCommentInput(false);
      setSelectedText('');
      setSelectionBounds(null);
      toast.success('Highlight added successfully');
    } catch (error) {
      toast.error('Failed to add highlight');
    }
  };

  const handleAddComment = async (content: string, highlightId?: string) => {
    try {
      await addComment(content, highlightId);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  // Convert annotations to highlights for rendering
  const highlights: TextHighlight[] = annotations.map((annotation, index) => {
    const position = annotation.position;
    const commentCount = threads.filter(t => t.annotation_id === annotation.id).length;
    
    return {
      id: annotation.id,
      text: annotation.content,
      color: annotation.color || '#FFD700',
      bounds: {
        left: position.page_x,
        top: position.page_y,
        width: position.width,
        height: position.height
      },
      pageNumber: position.page_number,
      commentNumber: index + 1,
      hasComments: commentCount > 0
    };
  });

  const currentPageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={rotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant={sidebarOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              Comments ({threads.length})
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading PDF...</span>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex justify-center"
          >
            <div className="relative">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />

              {/* Text Highlights */}
              <TextHighlightRenderer
                highlights={currentPageHighlights}
                scale={scale}
                rotation={rotation}
              />

              {/* Comment Bubbles */}
              {currentPageHighlights.map((highlight) => (
                <CommentBubble
                  key={highlight.id}
                  number={highlight.commentNumber}
                  x={highlight.bounds.left * scale}
                  y={highlight.bounds.top * scale}
                  hasComments={highlight.hasComments}
                  onClick={() => setSidebarOpen(true)}
                />
              ))}

              {/* Comment Input Overlay */}
              {showCommentInput && selectionBounds && (
                <div
                  className="absolute z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64"
                  style={{
                    left: selectionBounds.left * scale,
                    top: (selectionBounds.top + selectionBounds.height) * scale + 10
                  }}
                >
                  <div className="text-sm text-gray-600 mb-2">
                    Add highlight and comment
                  </div>
                  <div className="flex gap-2 mb-2">
                    {['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'].map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                        style={{ backgroundColor: color }}
                        onClick={() => handleAddHighlight(color)}
                      />
                    ))}
                  </div>
                  <textarea
                    className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
                    rows={2}
                    placeholder="Add a comment (optional)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const comment = (e.target as HTMLTextAreaElement).value;
                        handleAddHighlight('#FFD700', comment);
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddHighlight('#FFD700')}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCommentInput(false);
                        setSelectedText('');
                        setSelectionBounds(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Document>

          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Sidebar */}
      {sidebarOpen && (
        <CommentSidebar
          documentId={documentId}
          annotations={annotations}
          threads={threads}
          onAddComment={handleAddComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
