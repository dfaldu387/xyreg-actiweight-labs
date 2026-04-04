
import { useState, useCallback, useRef, useEffect } from 'react';

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  pageNumber: number;
  timestamp: number;
}

interface DrawingState {
  isDrawing: boolean;
  currentPath: DrawingPath | null;
  paths: DrawingPath[];
  selectedTool: 'pen' | 'highlighter' | 'eraser';
  selectedColor: string;
  brushSize: number;
}

export function useDrawingTool() {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: null,
    paths: [],
    selectedTool: 'highlighter', // Default to highlighter
    selectedColor: '#ffff00', // Default to yellow for highlighter
    brushSize: 10 // Larger default size for highlighter
  });

  // Single source of truth for drawing state
  const drawingStateRef = useRef({
    isDrawing: false,
    currentPath: null as DrawingPath | null,
    lastPoint: null as { x: number; y: number } | null
  });

  // Debug logging
  const logState = useCallback((action: string, details?: any) => {
    console.log(`🎨 Drawing Tool - ${action}:`, {
      isDrawing: drawingStateRef.current.isDrawing,
      hasCurrentPath: !!drawingStateRef.current.currentPath,
      pathPointsCount: drawingStateRef.current.currentPath?.points.length || 0,
      ...details
    });
  }, []);

  // Reset drawing state - recovery mechanism
  const resetDrawingState = useCallback(() => {
    logState('Reset Drawing State');
    drawingStateRef.current = {
      isDrawing: false,
      currentPath: null,
      lastPoint: null
    };
    setState(prev => ({
      ...prev,
      isDrawing: false,
      currentPath: null
    }));
  }, [logState]);

  const startDrawing = useCallback((x: number, y: number, pageNumber: number) => {
    logState('Start Drawing', { x, y, pageNumber });
    
    // Ensure we're not already drawing
    if (drawingStateRef.current.isDrawing) {
      logState('Warning: Already drawing, resetting state');
      resetDrawingState();
    }

    const newPath: DrawingPath = {
      id: `path_${Date.now()}_${Math.random()}`,
      points: [{ x, y }],
      color: state.selectedColor,
      width: state.brushSize,
      tool: state.selectedTool,
      pageNumber,
      timestamp: Date.now()
    };

    drawingStateRef.current = {
      isDrawing: true,
      currentPath: newPath,
      lastPoint: { x, y }
    };

    setState(prev => ({
      ...prev,
      isDrawing: true,
      currentPath: newPath
    }));
  }, [state.selectedColor, state.brushSize, state.selectedTool, logState, resetDrawingState]);

  const continueDrawing = useCallback((x: number, y: number) => {
    if (!drawingStateRef.current.isDrawing || !drawingStateRef.current.currentPath) {
      logState('Warning: Continue drawing called without active drawing state');
      return;
    }

    const lastPoint = drawingStateRef.current.lastPoint;
    if (!lastPoint) return;

    // Throttle points to improve performance - only add if moved enough
    const distance = Math.sqrt(
      Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
    );
    
    if (distance < 2) return; // Skip if movement is too small

    const updatedPath = {
      ...drawingStateRef.current.currentPath,
      points: [...drawingStateRef.current.currentPath.points, { x, y }]
    };

    drawingStateRef.current.currentPath = updatedPath;
    drawingStateRef.current.lastPoint = { x, y };

    setState(prev => ({
      ...prev,
      currentPath: updatedPath
    }));
  }, [logState]);

  const endDrawing = useCallback(() => {
    if (!drawingStateRef.current.isDrawing || !drawingStateRef.current.currentPath) {
      logState('Warning: End drawing called without active drawing state');
      return null;
    }

    const completedPath = drawingStateRef.current.currentPath;
    logState('End Drawing', { pointsCount: completedPath.points.length });
    
    // Only save paths with multiple points
    if (completedPath.points.length < 2) {
      logState('Warning: Path too short, discarding');
      resetDrawingState();
      return null;
    }

    setState(prev => ({
      ...prev,
      isDrawing: false,
      currentPath: null,
      paths: [...prev.paths, completedPath]
    }));

    drawingStateRef.current = {
      isDrawing: false,
      currentPath: null,
      lastPoint: null
    };

    return completedPath;
  }, [logState, resetDrawingState]);

  const clearAll = useCallback(() => {
    logState('Clear All');
    resetDrawingState();
    setState(prev => ({
      ...prev,
      paths: [],
      currentPath: null,
      isDrawing: false
    }));
  }, [logState, resetDrawingState]);

  const undo = useCallback(() => {
    logState('Undo');
    setState(prev => ({
      ...prev,
      paths: prev.paths.slice(0, -1)
    }));
  }, [logState]);

  const setTool = useCallback((tool: 'pen' | 'highlighter' | 'eraser') => {
    logState('Set Tool', { tool });
    setState(prev => {
      // Auto-adjust color and brush size based on tool
      let newColor = prev.selectedColor;
      let newBrushSize = prev.brushSize;
      
      if (tool === 'highlighter') {
        // If switching to highlighter and current color isn't highlighter-friendly, switch to yellow
        if (!['#ffff00', '#00ff00', '#ff00ff', '#00ffff'].includes(prev.selectedColor)) {
          newColor = '#ffff00'; // Default to yellow
        }
        // Ensure brush size is appropriate for highlighter
        if (prev.brushSize < 8) {
          newBrushSize = 10;
        }
      } else if (tool === 'pen') {
        // For pen, use smaller brush size if current is too large
        if (prev.brushSize > 5) {
          newBrushSize = 2;
        }
      }
      
      return { 
        ...prev, 
        selectedTool: tool,
        selectedColor: newColor,
        brushSize: newBrushSize
      };
    });
  }, [logState]);

  const setColor = useCallback((color: string) => {
    logState('Set Color', { color });
    setState(prev => ({ ...prev, selectedColor: color }));
  }, [logState]);

  const setBrushSize = useCallback((size: number) => {
    logState('Set Brush Size', { size });
    setState(prev => ({ ...prev, brushSize: size }));
  }, [logState]);

  // Auto-recovery mechanism - check for stuck state every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (drawingStateRef.current.isDrawing && 
          (!drawingStateRef.current.currentPath || drawingStateRef.current.currentPath.points.length === 0)) {
        logState('Auto-recovery: Detected stuck drawing state');
        resetDrawingState();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [logState, resetDrawingState]);

  return {
    isDrawing: state.isDrawing,
    currentPath: state.currentPath,
    paths: state.paths,
    selectedTool: state.selectedTool,
    selectedColor: state.selectedColor,
    brushSize: state.brushSize,
    startDrawing,
    continueDrawing,
    endDrawing,
    clearAll,
    undo,
    setTool,
    setColor,
    setBrushSize,
    resetDrawingState // Expose for manual recovery
  };
}
