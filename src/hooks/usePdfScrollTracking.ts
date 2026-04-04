
import { useState, useCallback, useRef, useEffect } from 'react';

interface PdfPageInfo {
  pageNumber: number;
  pageTop: number;
  pageHeight: number;
  pageWidth: number;
}

interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
  clientHeight: number;
  clientWidth: number;
}

export function usePdfScrollTracking() {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ 
    scrollTop: 0, 
    scrollLeft: 0, 
    clientHeight: 0, 
    clientWidth: 0 
  });
  const [pageInfo, setPageInfo] = useState<PdfPageInfo[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert viewport coordinates to page-relative coordinates
  const convertToPageCoordinates = useCallback((x: number, y: number) => {
    const adjustedY = y + scrollPosition.scrollTop;
    
    // Find which page this Y coordinate falls on
    const currentPage = pageInfo.find((page, index) => {
      const nextPage = pageInfo[index + 1];
      return adjustedY >= page.pageTop && (!nextPage || adjustedY < nextPage.pageTop);
    });

    if (!currentPage) {
      // Fallback to first page or create default
      return {
        page_number: 1,
        page_x: (x / scrollPosition.clientWidth) * 100,
        page_y: ((y + scrollPosition.scrollTop) / (scrollPosition.clientHeight || 1)) * 100,
        viewport_width: scrollPosition.clientWidth,
        viewport_height: scrollPosition.clientHeight
      };
    }

    // Calculate position within the page as percentage
    const pageY = adjustedY - currentPage.pageTop;
    const pageX = x - scrollPosition.scrollLeft;

    return {
      page_number: currentPage.pageNumber,
      page_x: (pageX / currentPage.pageWidth) * 100,
      page_y: (pageY / currentPage.pageHeight) * 100,
      viewport_width: scrollPosition.clientWidth,
      viewport_height: scrollPosition.clientHeight
    };
  }, [scrollPosition, pageInfo]);

  // Convert page coordinates back to viewport coordinates
  const convertToViewportCoordinates = useCallback((pageCoords: {
    page_number: number;
    page_x: number;
    page_y: number;
  }) => {
    const page = pageInfo.find(p => p.pageNumber === pageCoords.page_number);
    
    if (!page) {
      // Fallback positioning
      return {
        x: (pageCoords.page_x / 100) * scrollPosition.clientWidth,
        y: (pageCoords.page_y / 100) * scrollPosition.clientHeight
      };
    }

    // Calculate actual pixel position
    const pageX = (pageCoords.page_x / 100) * page.pageWidth;
    const pageYInDocument = page.pageTop + (pageCoords.page_y / 100) * page.pageHeight;
    
    // Convert to viewport coordinates (subtract scroll position)
    const viewportX = pageX - scrollPosition.scrollLeft;
    const viewportY = pageYInDocument - scrollPosition.scrollTop;

    return { x: viewportX, y: viewportY };
  }, [pageInfo, scrollPosition]);

  // Setup scroll tracking for iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let iframeWindow: Window | null = null;
    let scrollHandler: (() => void) | null = null;
    let resizeHandler: (() => void) | null = null;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        iframeWindow = iframe.contentWindow;
        if (!iframeDoc || !iframeWindow) return;

        const updateScrollPosition = () => {
          if (!iframeWindow) return;

          setScrollPosition({
            scrollTop: iframeWindow.pageYOffset || iframeDoc.documentElement.scrollTop,
            scrollLeft: iframeWindow.pageXOffset || iframeDoc.documentElement.scrollLeft,
            clientHeight: iframeWindow.innerHeight,
            clientWidth: iframeWindow.innerWidth
          });
        };

        const detectPages = () => {
          if (!iframeWindow) return;
          // For PDFs, we'll estimate page positions
          // This is a simplified approach - real PDF.js integration would be more accurate
          const documentHeight = iframeDoc.documentElement.scrollHeight;
          const viewportHeight = iframeWindow.innerHeight;
          const estimatedPageHeight = viewportHeight * 1.4; // Typical PDF page aspect ratio
          const pageCount = Math.ceil(documentHeight / estimatedPageHeight);

          const pages: PdfPageInfo[] = [];
          for (let i = 0; i < pageCount; i++) {
            pages.push({
              pageNumber: i + 1,
              pageTop: i * estimatedPageHeight,
              pageHeight: estimatedPageHeight,
              pageWidth: iframeWindow.innerWidth
            });
          }
          setPageInfo(pages);
        };

        // Initial setup
        updateScrollPosition();
        detectPages();

        // Store handlers for cleanup
        scrollHandler = updateScrollPosition;
        resizeHandler = () => {
          updateScrollPosition();
          detectPages();
        };

        // Listen for scroll events
        iframeWindow.addEventListener('scroll', scrollHandler);
        iframeWindow.addEventListener('resize', resizeHandler);

      } catch (error) {
        console.warn('Could not access iframe content for scroll tracking:', error);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    
    // Try immediate setup in case iframe is already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
      if (iframeWindow && scrollHandler) {
        iframeWindow.removeEventListener('scroll', scrollHandler);
      }
      if (iframeWindow && resizeHandler) {
        iframeWindow.removeEventListener('resize', resizeHandler);
      }
    };
  }, []);

  return {
    iframeRef,
    scrollPosition,
    convertToPageCoordinates,
    convertToViewportCoordinates,
    pageInfo
  };
}
