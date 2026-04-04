
import { useState, useCallback, useRef } from 'react';

interface EnhancedCommentPosition {
  x: number;
  y: number;
  pageNumber: number;
  pageX: number; // Relative to page
  pageY: number; // Relative to page
  scale: number;
  textContext?: {
    selectedText: string;
    beforeText: string;
    afterText: string;
  };
  documentDimensions?: {
    pageWidth: number;
    pageHeight: number;
    documentWidth: number;
    documentHeight: number;
  };
}

export function useEnhancedCommentPositioning() {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState<EnhancedCommentPosition | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

  const captureTextContext = useCallback((selection: Selection | null): EnhancedCommentPosition['textContext'] | undefined => {
    if (!selection || selection.isCollapsed) return undefined;

    const selectedText = selection.toString();
    const range = selection.getRangeAt(0);
    
    // Get surrounding text context
    const container = range.commonAncestorContainer;
    const fullText = container.textContent || '';
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    // Extract 50 characters before and after for context
    const beforeText = fullText.substring(Math.max(0, startOffset - 50), startOffset);
    const afterText = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 50));

    return {
      selectedText,
      beforeText,
      afterText
    };
  }, []);

  const getPageFromCoordinates = useCallback((x: number, y: number, containerElement: HTMLElement): number => {
    // Find the PDF page element that contains these coordinates
    const pages = containerElement.querySelectorAll('.react-pdf__Page');
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      const rect = page.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      // Adjust coordinates relative to container
      const adjustedY = y + containerElement.scrollTop - containerRect.top;
      const pageTop = rect.top - containerRect.top + containerElement.scrollTop;
      const pageBottom = pageTop + rect.height;
      
      if (adjustedY >= pageTop && adjustedY <= pageBottom) {
        return i + 1; // Page numbers are 1-indexed
      }
    }
    
    return 1; // Default to first page
  }, []);

  const calculatePageRelativePosition = useCallback((
    x: number, 
    y: number, 
    pageNumber: number, 
    containerElement: HTMLElement
  ): { pageX: number; pageY: number; documentDimensions?: EnhancedCommentPosition['documentDimensions'] } => {
    const pages = containerElement.querySelectorAll('.react-pdf__Page');
    const pageElement = pages[pageNumber - 1] as HTMLElement;
    
    if (!pageElement) {
      return { pageX: x, pageY: y };
    }

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    // Calculate position relative to the page
    const pageX = ((x - pageRect.left) / pageRect.width) * 100; // As percentage
    const pageY = ((y - pageRect.top) / pageRect.height) * 100; // As percentage
    
    return {
      pageX,
      pageY,
      documentDimensions: {
        pageWidth: pageRect.width,
        pageHeight: pageRect.height,
        documentWidth: containerRect.width,
        documentHeight: containerRect.height
      }
    };
  }, []);

  const getCurrentScale = useCallback((containerElement: HTMLElement): number => {
    // Try to extract scale from PDF viewer controls or calculate from page size
    const pageElement = containerElement.querySelector('.react-pdf__Page') as HTMLElement;
    if (!pageElement) return 1.0;
    
    // Simple scale estimation based on page width
    const pageWidth = pageElement.getBoundingClientRect().width;
    const containerWidth = containerElement.getBoundingClientRect().width;
    
    return Math.round((pageWidth / (containerWidth * 0.8)) * 10) / 10; // Rough scale estimate
  }, []);

  const startPositioning = useCallback((
    x: number, 
    y: number, 
    containerElement?: HTMLElement
  ) => {
    if (!containerElement) {
      // Fallback to simple positioning
      setCommentPosition({
        x,
        y,
        pageNumber: 1,
        pageX: x,
        pageY: y,
        scale: 1.0
      });
      setShowCommentInput(true);
      return;
    }

    // Capture current text selection if any
    const selection = window.getSelection();
    const textContext = captureTextContext(selection);
    setSelectedText(selection?.toString() || '');

    // Determine which page this position is on
    const pageNumber = getPageFromCoordinates(x, y, containerElement);
    
    // Calculate page-relative coordinates
    const { pageX, pageY, documentDimensions } = calculatePageRelativePosition(
      x, y, pageNumber, containerElement
    );
    
    // Get current scale
    const scale = getCurrentScale(containerElement);

    const enhancedPosition: EnhancedCommentPosition = {
      x,
      y,
      pageNumber,
      pageX,
      pageY,
      scale,
      textContext,
      documentDimensions
    };

    setCommentPosition(enhancedPosition);
    setShowCommentInput(true);
  }, [captureTextContext, getPageFromCoordinates, calculatePageRelativePosition, getCurrentScale]);

  const convertToStorageFormat = useCallback((position: EnhancedCommentPosition) => {
    return {
      x: position.x,
      y: position.y,
      page_number: position.pageNumber,
      page_x: position.pageX,
      page_y: position.pageY,
      scale: position.scale,
      text_context: position.textContext,
      document_dimensions: position.documentDimensions,
      viewport_width: position.documentDimensions?.documentWidth,
      viewport_height: position.documentDimensions?.documentHeight
    };
  }, []);

  const clearPosition = useCallback(() => {
    setShowCommentInput(false);
    setCommentPosition(null);
    setSelectedText('');
  }, []);

  return {
    showCommentInput,
    commentPosition,
    selectedText,
    startPositioning,
    clearPosition,
    convertToStorageFormat,
    // Legacy compatibility
    temporaryPins: [],
    isPositioningMode: false,
    activeInputPinId: null,
    addTemporaryPin: () => {},
    removeTemporaryPin: () => {},
    clearAllTemporaryPins: clearPosition,
    handleDocumentClick: () => {}
  };
}
