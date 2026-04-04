
import { useCallback, useRef } from 'react';

/**
 * Creates a callback that has a stable identity but still captures the latest props/state
 * This prevents unnecessary re-renders while ensuring the callback always has access to current values
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  // Store the callback in a ref so we can update it without causing re-renders
  const callbackRef = useRef(callback);
  
  // Update the ref whenever the callback changes
  callbackRef.current = callback;
  
  // Return a stable callback that delegates to the current callback in the ref
  // This function's identity will never change
  return useCallback(
    ((...args: Parameters<T>): ReturnType<T> => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}
