import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Square, Pen, Palette, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ScreenshotCaptureProps {
  onComplete: (annotatedImage: string) => void;
  onCancel: () => void;
}

type DrawingTool = 'rectangle' | 'pen';

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function ScreenshotCapture({ onComplete, onCancel }: ScreenshotCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null); // For rectangle preview
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [screenshot, setScreenshot] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [savedPaths, setSavedPaths] = useState<ImageData[]>([]); // For undo functionality
  
  const { toast } = useToast();

  useEffect(() => {
    captureScreenshot();
    // Hide instructions after 3 seconds
    const timer = setTimeout(() => setShowInstructions(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const captureScreenshot = async () => {
    try {
      setIsLoading(true);
      
      // Hide the feedback system before capturing
      const feedbackElements = document.querySelectorAll('[data-feedback-system]');
      feedbackElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      // Restore feedback elements
      feedbackElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
      
      const dataUrl = canvas.toDataURL('image/png', 0.8);
      setScreenshot(dataUrl);
      
      // Set up canvases with proper sizing
      const screenshotCanvas = screenshotCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      const tempCanvas = tempCanvasRef.current;
      
      if (screenshotCanvas && drawingCanvas && tempCanvas) {
        const img = new Image();
        img.onload = () => {
          // Calculate display size that fits in container while maintaining aspect ratio
          const containerWidth = window.innerWidth - 64; // Account for padding
          const containerHeight = window.innerHeight - 200; // Account for toolbar and padding
          
          const scaleX = containerWidth / img.width;
          const scaleY = containerHeight / img.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
          
          const displayWidth = img.width * scale;
          const displayHeight = img.height * scale;
          
          // Set canvas dimensions
          [screenshotCanvas, drawingCanvas, tempCanvas].forEach(canvas => {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
          });
          
          // Draw screenshot
          const ctx = screenshotCanvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          
          setIsLoading(false);
        };
        img.src = dataUrl;
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast({
        title: "Screenshot Failed",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const saveCurrentState = useCallback(() => {
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      setSavedPaths(prev => [...prev, imageData]);
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    setStartPos(pos);
    setIsDrawing(true);
    
    if (tool === 'pen') {
      saveCurrentState(); // Save state for undo
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }
  }, [getCanvasCoordinates, tool, color, saveCurrentState]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getCanvasCoordinates(e);
    
    if (tool === 'pen') {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    } else if (tool === 'rectangle') {
      // Use temporary canvas for rectangle preview
      const tempCtx = tempCanvasRef.current?.getContext('2d');
      const drawingCtx = drawingCanvasRef.current?.getContext('2d');
      
      if (tempCtx && drawingCtx) {
        // Clear temp canvas
        tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
        
        // Copy current drawing state to temp canvas
        tempCtx.drawImage(drawingCanvasRef.current!, 0, 0);
        
        // Draw preview rectangle on temp canvas
        tempCtx.strokeStyle = color;
        tempCtx.lineWidth = 2;
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.strokeRect(
          startPos.x,
          startPos.y,
          pos.x - startPos.x,
          pos.y - startPos.y
        );
      }
    }
  }, [isDrawing, getCanvasCoordinates, tool, color, startPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    if (tool === 'rectangle') {
      saveCurrentState(); // Save state for undo
      const ctx = drawingCanvasRef.current?.getContext('2d');
      const pos = startPos;
      
      if (ctx) {
        // Get final position from temp canvas or last mouse position
        const tempCtx = tempCanvasRef.current?.getContext('2d');
        if (tempCtx) {
          // Copy the temp canvas (with rectangle) to main drawing canvas
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.drawImage(tempCanvasRef.current!, 0, 0);
          tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
        }
      }
    }
    
    setIsDrawing(false);
  }, [isDrawing, tool, startPos, saveCurrentState]);

  const handleComplete = useCallback(() => {
    const screenshotCanvas = screenshotCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    
    if (!screenshotCanvas || !drawingCanvas) {
      toast({
        title: "Error",
        description: "Cannot process annotation. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new canvas to merge both layers
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = screenshotCanvas.width;
    mergedCanvas.height = screenshotCanvas.height;
    
    const ctx = mergedCanvas.getContext('2d');
    if (ctx) {
      // Draw screenshot first
      ctx.drawImage(screenshotCanvas, 0, 0);
      // Draw annotations on top
      ctx.drawImage(drawingCanvas, 0, 0);
      
      const mergedDataUrl = mergedCanvas.toDataURL('image/png', 0.8);
      onComplete(mergedDataUrl);
    }
  }, [onComplete, toast]);

  const clearDrawing = useCallback(() => {
    const drawingCtx = drawingCanvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    
    if (drawingCtx) {
      drawingCtx.clearRect(0, 0, drawingCtx.canvas.width, drawingCtx.canvas.height);
    }
    if (tempCtx) {
      tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
    }
    
    setSavedPaths([]);
  }, []);

  const undoLastAction = useCallback(() => {
    if (savedPaths.length === 0) return;
    
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx) {
      const lastState = savedPaths[savedPaths.length - 1];
      ctx.putImageData(lastState, 0, 0);
      setSavedPaths(prev => prev.slice(0, -1));
    }
  }, [savedPaths]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" data-feedback-system>
        <div className="bg-background rounded-lg p-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Capturing screenshot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" data-feedback-system>
      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">How to annotate:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Select Pen or Rectangle tool</li>
                <li>• Choose a color</li>
                <li>• Click and drag to draw</li>
                <li>• Use Clear to remove all annotations</li>
              </ul>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="mt-3 w-full" 
            onClick={() => setShowInstructions(false)}
          >
            Got it
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-background border-b p-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Annotate Screenshot</h3>
          
          {/* Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
            >
              <Pen className="h-4 w-4 mr-2" />
              Pen
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
            >
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </Button>
          </div>
          
          {/* Colors */}
          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 mr-2" />
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-foreground scale-110' : 'border-border hover:border-foreground/50'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={`Select ${c} color`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={undoLastAction} disabled={savedPaths.length === 0}>
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={clearDrawing}>
              Clear
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            Next
          </Button>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div 
          ref={containerRef}
          className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
          style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        >
          {/* Screenshot Canvas */}
          <canvas
            ref={screenshotCanvasRef}
            className="block"
          />
          
          {/* Drawing Canvas */}
          <canvas
            ref={drawingCanvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          
          {/* Temporary Canvas for Rectangle Preview */}
          <canvas
            ref={tempCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ display: tool === 'rectangle' && isDrawing ? 'block' : 'none' }}
          />
          
          {/* Current Tool Indicator */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {tool === 'pen' ? 'Pen' : 'Rectangle'} • {color}
          </div>
        </div>
      </div>
    </div>
  );
}