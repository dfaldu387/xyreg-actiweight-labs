import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Square, Pen, Palette, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface ImageEditorProps {
  screenshot: string;
  onComplete: (annotatedImage: string) => void;
  onCancel: () => void;
}

type DrawingTool = 'pen' | 'rectangle';

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function ImageEditor({ screenshot, onComplete, onCancel }: ImageEditorProps) {
  const { lang } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [canvasState, setCanvasState] = useState<ImageData | null>(null);

  useEffect(() => {
    if (screenshot && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Set canvas size
          const maxWidth = window.innerWidth * 0.9;
          const maxHeight = window.innerHeight * 0.8;
          
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
          
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.style.width = `${canvas.width}px`;
          canvas.style.height = `${canvas.height}px`;
          
          // Draw the screenshot
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          imageRef.current = img;
        };
        img.src = screenshot;
      }
    }
  }, [screenshot]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    setLastPoint(point);
    setIsDrawing(true);
    
    // Save current canvas state before drawing
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        setCanvasState(imageData);
      }
    }
  }, [getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const point = getCanvasPoint(e);
    setCurrentPoint(point);
    
    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      
      setLastPoint(point);
    } else if (tool === 'rectangle') {
      // Restore canvas state and draw rectangle preview
      if (canvasState) {
        ctx.putImageData(canvasState, 0, 0);
      }
      
      // Draw rectangle preview
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        lastPoint.x,
        lastPoint.y,
        point.x - lastPoint.x,
        point.y - lastPoint.y
      );
      ctx.setLineDash([]);
    }
  }, [isDrawing, tool, color, lastPoint, getCanvasPoint, imageRef]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && tool === 'rectangle' && canvasRef.current) {
      // Finalize the rectangle with solid line
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && canvasState) {
        // Restore the canvas state (with all previous drawings)
        ctx.putImageData(canvasState, 0, 0);
        
        // Draw final rectangle with solid line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]); // Solid line
        ctx.strokeRect(
          lastPoint.x,
          lastPoint.y,
          currentPoint.x - lastPoint.x,
          currentPoint.y - lastPoint.y
        );
      }
    }
    setIsDrawing(false);
    setCanvasState(null); // Clear saved state
  }, [isDrawing, tool, color, lastPoint, currentPoint, canvasState]);


  const clearDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Redraw the original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
  }, []);


  const handleComplete = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onComplete(dataURL);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Toolbar */}
      <div className="bg-background border-b p-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">{lang('feedback.annotateScreenshot')}</h3>

          {/* Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
            >
              <Pen className="h-4 w-4 mr-2" />
              {lang('feedback.pen')}
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
            >
              <Square className="h-4 w-4 mr-2" />
              {lang('feedback.rectangle')}
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
                title={lang('feedback.selectColor')}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearDrawing}>
              <Trash2 className="h-4 w-4 mr-2" />
              {lang('feedback.clear')}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {lang('feedback.cancel')}
          </Button>
          <Button onClick={handleComplete}>
            {lang('feedback.complete')}
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg shadow-lg bg-white cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Current Tool Indicator */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {tool === 'pen' ? lang('feedback.drawing') : lang('feedback.rectangle')} • {color}
          </div>
        </div>
      </div>
    </div>
  );
}
