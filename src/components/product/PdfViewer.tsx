import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { Loader2, AlertTriangle, Download, Eye, EyeOff } from 'lucide-react';
import { useDrawingTool } from '@/hooks/useDrawingTool';
import { useDrawingAnnotations } from '@/hooks/useDrawingAnnotations';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingToolbar } from './DrawingToolbar';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { initializePdfJs, getPdfOptions } from '@/utils/pdfConfig';

// Import required CSS for react-pdf
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface PdfViewerProps {
  fileUrl: string;
  documentId: string;
  fileName: string;
  isHighlighting: boolean;
  onTextSelection?: () => void;
}

export function PdfViewer({
  fileUrl,
  documentId,
  fileName,
  isHighlighting,
  onTextSelection
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [workerInitialized, setWorkerInitialized] = useState<boolean>(false);
  const [workerStatus, setWorkerStatus] = useState<string>('initializing');
  const [lastLoadedFile, setLastLoadedFile] = useState<string>('');
  const [textLayerEnabled, setTextLayerEnabled] = useState<boolean>(false);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Drawing tools with improved state management
  const {
    isDrawing,
    currentPath,
    paths,
    selectedTool,
    selectedColor,
    brushSize,
    startDrawing,
    continueDrawing,
    endDrawing,
    clearAll,
    undo,
    setTool,
    setColor,
    setBrushSize,
    resetDrawingState
  } = useDrawingTool();

  // Annotation persistence
  const {
    annotations,
    saveAnnotation,
    loadAnnotations,
    deleteAllAnnotations,
    setAnnotations
  } = useDrawingAnnotations(documentId);

  // Memoize PDF options to prevent unnecessary Document reloads
  const pdfOptions = useMemo(() => getPdfOptions(), []);

  // Initialize PDF.js worker once on mount
  useEffect(() => {
    const initWorker = async () => {
      setWorkerStatus('initializing');
      
      try {
        const success = await initializePdfJs();
        setWorkerInitialized(true);
        setWorkerStatus(success ? 'ready' : 'fallback');
        
        if (!success) {
          toast.warning('PDF viewer using fallback mode');
        } else {
          // console.log('✅ PDF worker initialized successfully');
        }
      } catch (error) {
        console.error('❌ Worker initialization failed:', error);
        setWorkerInitialized(true);
        setWorkerStatus('error');
        toast.error('PDF worker initialization failed, using basic mode');
      }
    };
    
    initWorker();
  }, []);

  // Load annotations when document loads
  useEffect(() => {
    if (documentId && !isLoading && !error) {
      loadAnnotations();
    }
  }, [documentId, isLoading, error, loadAnnotations]);

  // Update canvas size when page loads or scale changes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!pageRef.current) return;

      const pageElement = pageRef.current.querySelector('.react-pdf__Page');
      if (!pageElement) return;

      const canvases = pageRef.current.querySelectorAll('canvas');
      const drawingCanvas = Array.from(canvases).find(canvas => 
        canvas.className.includes('absolute')
      );

      if (drawingCanvas) {
        const rect = pageElement.getBoundingClientRect();
        drawingCanvas.width = rect.width;
        drawingCanvas.height = rect.height;
      }
    };

    // Update canvas size after a short delay to ensure page is rendered
    const timeoutId = setTimeout(updateCanvasSize, 100);
    return () => clearTimeout(timeoutId);
  }, [pageNumber, scale]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    if (lastLoadedFile !== fileUrl) {
      toast.success(`PDF loaded: ${numPages} pages`);
      setLastLoadedFile(fileUrl);
    }
    setNumPages(numPages);
    setIsLoading(false);
    setError('');
  }, [workerStatus, fileUrl, lastLoadedFile]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error(`❌ PDF loading error:`, error);
    
    let errorMessage = 'Failed to load PDF document';
    if (error.message.includes('API version') && error.message.includes('Worker version')) {
      errorMessage = 'PDF version mismatch detected. Please refresh the page to reload the PDF viewer.';
    } else if (error.message.includes('Setting up fake worker failed')) {
      errorMessage = 'PDF worker initialization failed. Please refresh the page.';
    } else if (error.message.includes('InvalidPDFException')) {
      errorMessage = 'Invalid PDF file format';
    } else if (error.message.includes('MissingPDFException')) {
      errorMessage = 'PDF file not found';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error loading PDF worker. Please check your connection.';
    }
    
    setError(errorMessage);
    setIsLoading(false);
    toast.error(errorMessage);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  }, [fileUrl, fileName]);

  const handleDrawingComplete = useCallback(async () => {
    const completed = endDrawing();
    if (completed) {
      const success = await saveAnnotation(completed);
      if (success) {
        setAnnotations(prev => [...prev, completed]);
      }
    }
  }, [endDrawing, saveAnnotation, setAnnotations]);

  const confirmAction = useConfirm();

  const handleClearAll = useCallback(async () => {
    if (await confirmAction({ title: 'Delete all annotations', description: 'Are you sure you want to delete all annotations? This cannot be undone.', confirmLabel: 'Delete all', variant: 'destructive' })) {
      clearAll();
      await deleteAllAnnotations();
    }
  }, [clearAll, deleteAllAnnotations, confirmAction]);

  const toggleTextLayer = useCallback(() => {
    setTextLayerEnabled(!textLayerEnabled);
    if (!textLayerEnabled) {
      toast.info('Text layer enabled for text selection');
    } else {
      toast.info('Text layer disabled, drawing mode available');
    }
  }, [textLayerEnabled]);

  // Don't render until worker is initialized
  if (!workerInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Initializing PDF viewer...</p>
          <p className="text-xs text-muted-foreground mt-1">Status: {workerStatus}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">PDF Loading Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const cursorStyle = isHighlighting ? 'crosshair' : 'default';

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-auto bg-gray-100 relative min-h-[90vh]"
      style={{ cursor: cursorStyle }}
      data-pdf-content
    >
      {/* PDF Controls */}
      <div className="sticky top-0 z-20 bg-white border-b p-1 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs"
          >
            Previous
          </button>
          <span className="text-xs font-medium">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs"
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-2 py-1 border rounded hover:bg-gray-50 text-xs"
          >
            Zoom Out
          </button>
          <span className="text-xs font-medium min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2.0, scale + 0.1))}
            className="px-2 py-1 border rounded hover:bg-gray-50 text-xs"
          >
            Zoom In
          </button>
          
          <button
            onClick={toggleTextLayer}
            className={`px-2 py-1 border rounded text-xs flex items-center gap-1 ${
              textLayerEnabled ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-600'
            }`}
            title={textLayerEnabled ? 'Text selection enabled' : 'Text selection disabled'}
          >
            {textLayerEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Text
          </button>
          
          <button
            onClick={handleDownload}
            className="px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1 text-xs ml-2"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>

      {/* Drawing Toolbar - Only show when in highlighting mode */}
      {isHighlighting && (
        <DrawingToolbar
          isDrawingMode={isHighlighting}
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          brushSize={brushSize}
          showAnnotations={showAnnotations}
          onToggleDrawingMode={() => {}}
          onSelectTool={setTool}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onUndo={undo}
          onClearAll={handleClearAll}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          onResetDrawingState={resetDrawingState}
        />
      )}

      {/* PDF Document */}
      <div className="flex justify-center p-1 min-h-[85vh]">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            </div>
          }
          className="relative"
          options={pdfOptions}
        >
          <div ref={pageRef} className="relative shadow-lg">
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={textLayerEnabled}
              renderAnnotationLayer={false}
              loading={
                <div className="flex items-center justify-center h-96 w-full bg-gray-50">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Loading page {pageNumber}...</p>
                  </div>
                </div>
              }
              className="mx-auto"
              data-page-number={pageNumber}
            />
            
            {/* Improved Drawing Canvas Overlay */}
            {showAnnotations && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative w-full h-full">
                  <DrawingCanvas
                    paths={[...annotations, ...paths]}
                    currentPath={currentPath}
                    pageNumber={pageNumber}
                    scale={scale}
                    isDrawingMode={isHighlighting}
                    onStartDrawing={startDrawing}
                    onContinueDrawing={continueDrawing}
                    onEndDrawing={handleDrawingComplete}
                  />
                </div>
              </div>
            )}
          </div>
        </Document>
      </div>
    </div>
  );
}
