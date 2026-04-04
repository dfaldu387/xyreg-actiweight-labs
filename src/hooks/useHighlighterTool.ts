
import { useState, useCallback, useRef, useEffect } from 'react';

interface HighlightSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
  boundingRect: DOMRect;
  pageRelativeCoords: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  range: Range;
}

interface HighlighterToolState {
  isSelecting: boolean;
  currentSelection: HighlightSelection | null;
  pendingHighlight: HighlightSelection | null;
  highlightColor: string;
}

export function useHighlighterTool() {
  const [state, setState] = useState<HighlighterToolState>({
    isSelecting: false,
    currentSelection: null,
    pendingHighlight: null,
    highlightColor: '#ffff00'
  });

  const isMouseDownRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const getPageNumber = useCallback((element: Element): number => {
    const pageElement = element.closest('[data-page-number]') || 
                       element.closest('.react-pdf__Page');
    
    if (pageElement) {
      const pageNumber = pageElement.getAttribute('data-page-number');
      if (pageNumber) return parseInt(pageNumber, 10);
      
      const pages = document.querySelectorAll('.react-pdf__Page');
      for (let i = 0; i < pages.length; i++) {
        if (pages[i] === pageElement) return i + 1;
      }
    }
    
    return 1;
  }, []);

  const getPageRelativeCoordinates = useCallback((
    rect: DOMRect, 
    pageNumber: number
  ) => {
    const pageElement = document.querySelector(
      `[data-page-number="${pageNumber}"], .react-pdf__Page:nth-child(${pageNumber})`
    ) as HTMLElement;
    
    if (!pageElement) {
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
    
    const pageRect = pageElement.getBoundingClientRect();
    
    return {
      left: rect.left - pageRect.left,
      top: rect.top - pageRect.top,
      width: rect.width,
      height: rect.height
    };
  }, []);

  const captureTextSelection = useCallback((): HighlightSelection | null => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (!text) return null;

    const rect = range.getBoundingClientRect();
    const pageNumber = getPageNumber(range.commonAncestorContainer as Element);
    const pageRelativeCoords = getPageRelativeCoordinates(rect, pageNumber);
    
    return {
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      pageNumber,
      boundingRect: rect,
      pageRelativeCoords,
      range: range.cloneRange()
    };
  }, [getPageNumber, getPageRelativeCoordinates]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const target = event.target as Element;
    
    // Only handle mouse down on PDF content
    if (!target.closest('.react-pdf__Page') && !target.closest('[data-pdf-content]')) {
      return;
    }

    isMouseDownRef.current = true;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    
    setState(prev => ({ 
      ...prev, 
      isSelecting: true,
      currentSelection: null 
    }));

    // Clear any existing selection
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isMouseDownRef.current || !startPointRef.current) return;

    // Update current selection during drag
    const selection = captureTextSelection();
    if (selection) {
      setState(prev => ({ 
        ...prev, 
        currentSelection: selection 
      }));
    }
  }, [captureTextSelection]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isMouseDownRef.current) return;

    isMouseDownRef.current = false;
    startPointRef.current = null;

    const selection = captureTextSelection();
    
    setState(prev => ({ 
      ...prev, 
      isSelecting: false,
      currentSelection: null,
      pendingHighlight: selection 
    }));
  }, [captureTextSelection]);

  const confirmHighlight = useCallback(() => {
    const highlight = state.pendingHighlight;
    if (!highlight) return null;

    setState(prev => ({ 
      ...prev, 
      pendingHighlight: null 
    }));

    // Clear the text selection
    window.getSelection()?.removeAllRanges();

    return {
      start_offset: highlight.startOffset,
      end_offset: highlight.endOffset,
      highlighted_text: highlight.text,
      color: state.highlightColor,
      page_number: highlight.pageNumber,
      position: {
        x: highlight.pageRelativeCoords.left,
        y: highlight.pageRelativeCoords.top,
        width: highlight.pageRelativeCoords.width,
        height: highlight.pageRelativeCoords.height
      }
    };
  }, [state.pendingHighlight, state.highlightColor]);

  const cancelHighlight = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      pendingHighlight: null,
      currentSelection: null 
    }));
    window.getSelection()?.removeAllRanges();
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, highlightColor: color }));
  }, []);

  const startHighlighting = useCallback(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const stopHighlighting = useCallback(() => {
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    setState({
      isSelecting: false,
      currentSelection: null,
      pendingHighlight: null,
      highlightColor: '#ffff00'
    });
    
    window.getSelection()?.removeAllRanges();
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isSelecting: state.isSelecting,
    currentSelection: state.currentSelection,
    pendingHighlight: state.pendingHighlight,
    highlightColor: state.highlightColor,
    startHighlighting,
    stopHighlighting,
    confirmHighlight,
    cancelHighlight,
    setHighlightColor
  };
}
