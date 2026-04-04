
import { useState, useCallback, useRef, useEffect } from 'react';

interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
  clientHeight: number;
  clientWidth: number;
}

export function useSimpleScrollTracking() {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ 
    scrollTop: 0, 
    scrollLeft: 0, 
    clientHeight: 0, 
    clientWidth: 0 
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate adjusted position based on current scroll vs stored scroll
  const calculateAdjustedPosition = useCallback((
    originalX: number, 
    originalY: number, 
    storedScrollTop: number = 0
  ) => {
    const currentScrollDiff = scrollPosition.scrollTop - storedScrollTop;
    return {
      x: originalX,
      y: originalY - currentScrollDiff
    };
  }, [scrollPosition]);

  // Store current position with scroll context
  const storePosition = useCallback((x: number, y: number) => {
    return {
      x,
      y,
      scroll_top: scrollPosition.scrollTop,
      scroll_left: scrollPosition.scrollLeft,
      viewport_width: scrollPosition.clientWidth,
      viewport_height: scrollPosition.clientHeight
    };
  }, [scrollPosition]);

  // Setup scroll tracking
  useEffect(() => {
    const iframe = iframeRef.current;
    const container = containerRef.current;
    
    if (!iframe && !container) return;

    let cleanup: (() => void) | null = null;

    const updateScrollPosition = (element: HTMLElement | Window) => {
      let scrollTop = 0;
      let scrollLeft = 0;
      let clientHeight = 0;
      let clientWidth = 0;

      if (element instanceof Window) {
        scrollTop = element.pageYOffset;
        scrollLeft = element.pageXOffset;
        clientHeight = element.innerHeight;
        clientWidth = element.innerWidth;
      } else {
        scrollTop = element.scrollTop;
        scrollLeft = element.scrollLeft;
        clientHeight = element.clientHeight;
        clientWidth = element.clientWidth;
      }

      setScrollPosition({
        scrollTop,
        scrollLeft,
        clientHeight,
        clientWidth
      });
    };

    const setupIframeTracking = () => {
      try {
        const iframeWindow = iframe?.contentWindow;
        const iframeDoc = iframe?.contentDocument;
        
        if (iframeWindow && iframeDoc) {
          const handleScroll = () => updateScrollPosition(iframeWindow);
          const handleResize = () => updateScrollPosition(iframeWindow);
          
          // Initial setup
          updateScrollPosition(iframeWindow);
          
          // Add listeners
          iframeWindow.addEventListener('scroll', handleScroll);
          iframeWindow.addEventListener('resize', handleResize);
          
          cleanup = () => {
            iframeWindow.removeEventListener('scroll', handleScroll);
            iframeWindow.removeEventListener('resize', handleResize);
          };
          
          return true;
        }
      } catch (error) {
        console.warn('Could not access iframe content:', error);
      }
      return false;
    };

    const setupContainerTracking = () => {
      if (container) {
        const handleScroll = () => updateScrollPosition(container);
        const handleResize = () => updateScrollPosition(container);
        
        updateScrollPosition(container);
        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        cleanup = () => {
          container.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleResize);
        };
        
        return true;
      }
      return false;
    };

    // Try iframe tracking first, fall back to container
    if (iframe) {
      const handleLoad = () => {
        if (!setupIframeTracking()) {
          setupContainerTracking();
        }
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        handleLoad();
      } else {
        iframe.addEventListener('load', handleLoad);
      }
    } else {
      setupContainerTracking();
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return {
    iframeRef,
    containerRef,
    scrollPosition,
    calculateAdjustedPosition,
    storePosition
  };
}
