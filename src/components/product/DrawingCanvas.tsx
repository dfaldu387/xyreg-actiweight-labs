import React, { useRef, useEffect, useCallback, useState } from 'react';
import { DrawingPath } from '@/hooks/useDrawingTool';

interface DrawingCanvasProps {
  paths: DrawingPath[];
  currentPath: DrawingPath | null;
  pageNumber: number;
  scale: number;
  isDrawingMode: boolean;
  onStartDrawing: (x: number, y: number, pageNumber: number) => void;
  onContinueDrawing: (x: number, y: number) => void;
  onEndDrawing: () => void;
}

export function DrawingCanvas({
  paths,
  currentPath,
  pageNumber,
  scale,
  isDrawingMode,
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser'>('highlighter');

  // Update canvas size to match parent container
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newWidth = rect.width;
    const newHeight = rect.height;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      
      setCanvasSize({ width: newWidth, height: newHeight });
      // console.log('🖼️ Canvas resized to:', { width: newWidth, height: newHeight, scale });
    }
  }, [scale]);

  // Track current tool from paths
  useEffect(() => {
    if (currentPath) {
      setCurrentTool(currentPath.tool);
    }
  }, [currentPath]);

  // Update canvas size when scale changes
  useEffect(() => {
    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    const canvas = canvasRef.current;
    
    if (canvas?.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCanvasSize]);

  // Enhanced draw path function with improved highlighter transparency
  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;

    ctx.save();
    
    // Set drawing properties based on tool with improved highlighter transparency
    switch (path.tool) {
      case 'highlighter':
        ctx.globalAlpha = 0.3; // Reduced from 0.5 to 0.3 for better transparency
        ctx.globalCompositeOperation = 'overlay'; // Changed from 'multiply' to 'overlay' for better text visibility
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Reduced shadow/glow effect
        ctx.shadowColor = path.color;
        ctx.shadowBlur = 1; // Reduced from 2 to 1
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        break;
        
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
        
      default: // pen
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    ctx.beginPath();
    
    // Use smooth curves for better line quality
    if (path.points.length === 2) {
      // For two points, draw a straight line
      ctx.moveTo(path.points[0].x, path.points[0].y);
      ctx.lineTo(path.points[1].x, path.points[1].y);
    } else {
      // For multiple points, use quadratic curves for smoother lines
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length - 1; i++) {
        const currentPoint = path.points[i];
        const nextPoint = path.points[i + 1];
        const midX = (currentPoint.x + nextPoint.x) / 2;
        const midY = (currentPoint.y + nextPoint.y) / 2;
        
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midX, midY);
      }
      
      // Draw to the last point
      const lastPoint = path.points[path.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
    
    // Removed the second pass for highlighter to prevent over-saturation
    
    ctx.restore();
  }, []);

  // Redraw canvas when paths change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed paths for this page
    paths
      .filter(path => path.pageNumber === pageNumber)
      .forEach(path => drawPath(ctx, path));

    // Draw current path if drawing
    if (currentPath && currentPath.pageNumber === pageNumber) {
      drawPath(ctx, currentPath);
    }
  }, [paths, currentPath, pageNumber, drawPath, canvasSize]);

  // Get coordinates relative to canvas
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isDrawingMode) return;
    
    event.preventDefault();
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    
    isDrawingRef.current = true;
    onStartDrawing(coords.x, coords.y, pageNumber);
  }, [isDrawingMode, pageNumber, onStartDrawing, getCanvasCoordinates]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    
    event.preventDefault();
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    onContinueDrawing(coords.x, coords.y);
  }, [isDrawingMode, onContinueDrawing, getCanvasCoordinates]);

  const handleMouseUp = useCallback((event?: React.MouseEvent) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    
    if (event) event.preventDefault();
    
    isDrawingRef.current = false;
    onEndDrawing();
  }, [isDrawingMode, onEndDrawing]);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!isDrawingMode) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
    
    isDrawingRef.current = true;
    onStartDrawing(coords.x, coords.y, pageNumber);
  }, [isDrawingMode, pageNumber, onStartDrawing, getCanvasCoordinates]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
    onContinueDrawing(coords.x, coords.y);
  }, [isDrawingMode, onContinueDrawing, getCanvasCoordinates]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    
    event.preventDefault();
    isDrawingRef.current = false;
    onEndDrawing();
  }, [isDrawingMode, onEndDrawing]);

  // Global event listeners to catch events outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        onEndDrawing();
      }
    };

    // Add global listeners
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [handleMouseUp, onEndDrawing]);

  // Determine cursor style based on tool
  const getCursorStyle = () => {
    if (!isDrawingMode) return 'default';
    
    switch (currentTool) {
      case 'highlighter':
        return 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M3 21h4L19 9l-4-4L3 17v4z\' fill=\'%23ffff00\' stroke=\'%23000\' stroke-width=\'1\'/%3E%3C/svg%3E") 12 20, crosshair';
      case 'eraser':
        return 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23ff69b4\' stroke=\'%23000\' stroke-width=\'1\'/%3E%3C/svg%3E") 12 12, crosshair';
      default:
        return 'crosshair';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{
        cursor: getCursorStyle(),
        touchAction: 'none',
        zIndex: 10
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
