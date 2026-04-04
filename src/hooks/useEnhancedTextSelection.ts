
import { useState, useCallback, useRef } from 'react';

interface TextSelection {
  text: string;
  boundingRect: DOMRect;
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  pageRelativeCoords: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export function useEnhancedTextSelection() {
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionTimeoutRef = useRef<NodeJS.Timeout>();

  const getPageNumber = useCallback((element: Element): number => {
    const pageElement = element.closest('[data-page-number]') || 
                       element.closest('.react-pdf__Page');
    
    if (pageElement) {
      const pageNumber = pageElement.getAttribute('data-page-number');
      if (pageNumber) return parseInt(pageNumber, 10);
      
      // Fallback: find page number from siblings
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
  ): TextSelection['pageRelativeCoords'] => {
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

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectedText(null);
      return null;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (!text) {
      setSelectedText(null);
      return null;
    }

    // Get the bounding rectangle of the selection
    const rect = range.getBoundingClientRect();
    
    // Find which page this selection is on
    const pageNumber = getPageNumber(range.commonAncestorContainer as Element);
    
    // Get page-relative coordinates
    const pageRelativeCoords = getPageRelativeCoordinates(rect, pageNumber);
    
    const textSelection: TextSelection = {
      text,
      boundingRect: rect,
      pageNumber,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      pageRelativeCoords
    };
    
    setSelectedText(textSelection);
    console.log('📝 Text selected:', { text: text.substring(0, 50), pageNumber, coords: pageRelativeCoords });
    
    return textSelection;
  }, [getPageNumber, getPageRelativeCoordinates]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    // Delay capture to ensure selection is complete
    selectionTimeoutRef.current = setTimeout(() => {
      const target = event.target as Element;
      
      // Only capture selections within PDF content
      if (target.closest('.react-pdf__Page') || target.closest('[data-pdf-content]')) {
        captureSelection();
      }
    }, 100);
  }, [captureSelection]);

  const clearSelection = useCallback(() => {
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const startSelectionMode = useCallback(() => {
    setIsSelecting(true);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const stopSelectionMode = useCallback(() => {
    setIsSelecting(false);
    document.removeEventListener('mouseup', handleMouseUp);
    clearSelection();
  }, [handleMouseUp, clearSelection]);

  return {
    selectedText,
    isSelecting,
    startSelectionMode,
    stopSelectionMode,
    captureSelection,
    clearSelection
  };
}
