
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  routeLoadTime: number;
  memoryUsage?: number;
  renderTime: number;
}

export function usePerformanceMonitor(routeName: string) {
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(performance.now());
  
  useEffect(() => {
    // Record route load time
    const loadTime = Date.now() - startTimeRef.current;
    
    // Record render time
    const renderTime = performance.now() - renderStartRef.current;
    
    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;
    
    const metrics: PerformanceMetrics = {
      routeLoadTime: loadTime,
      renderTime,
      ...(memoryUsage && { memoryUsage })
    };
    
    // Log metrics for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metrics for ${routeName}:`, metrics);
      
      // Warn if performance is poor
      if (loadTime > 2000) {
        console.warn(`Slow route load detected for ${routeName}: ${loadTime}ms`);
      }
      
      if (renderTime > 100) {
        console.warn(`Slow render detected for ${routeName}: ${renderTime}ms`);
      }
    }
    
    // Reset for next measurement
    startTimeRef.current = Date.now();
    renderStartRef.current = performance.now();
  }, [routeName]);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      // Cleanup any performance observers if needed
    };
  }, []);
}
