import { useState, useCallback, useRef } from 'react';

export interface BulkOperationProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  currentItem?: string;
  startTime?: Date;
  errors: string[];
}

export interface ProgressCallback {
  (progress: Partial<BulkOperationProgress>): void;
}

export function useBulkOperationProgress() {
  const [progress, setProgress] = useState<BulkOperationProgress>({
    isRunning: false,
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  });

  const progressRef = useRef<BulkOperationProgress>(progress);
  progressRef.current = progress;

  const startOperation = useCallback((total: number) => {
    setProgress({
      isRunning: true,
      total,
      completed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: undefined,
      startTime: new Date(),
      errors: []
    });
  }, []);

  const updateProgress = useCallback((update: Partial<BulkOperationProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...update
    }));
  }, []);

  const completeOperation = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      currentItem: undefined
    }));
  }, []);

  const reset = useCallback(() => {
    setProgress({
      isRunning: false,
      total: 0,
      completed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    });
  }, []);

  const getProgressCallback = useCallback((): ProgressCallback => {
    return (update: Partial<BulkOperationProgress>) => {
      updateProgress(update);
    };
  }, [updateProgress]);

  return {
    progress,
    startOperation,
    updateProgress,
    completeOperation,
    reset,
    getProgressCallback
  };
}