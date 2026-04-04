import { useState, useCallback, useRef } from 'react';

export interface CategoryProgress {
  name: string;
  completedSuggestions: number;
  isComplete: boolean;
}

export interface AIGenerationProgress {
  isRunning: boolean;
  currentBatch: number;
  totalBatches: number;
  currentCategory: string;
  totalSuggestions: number;
  completedSuggestions: number;
  startTime?: Date;
  errors: string[];
  partialResults: any[];
  categoryProgress: CategoryProgress[];
}

export interface AIProgressUpdate {
  batchNumber: number;
  totalBatches: number;
  category: string;
  suggestions: any[];
  completedSuggestions?: number;
  error?: string;
}

export function useAIGenerationProgress() {
  const [progress, setProgress] = useState<AIGenerationProgress>({
    isRunning: false,
    currentBatch: 0,
    totalBatches: 0,
    currentCategory: '',
    totalSuggestions: 0,
    completedSuggestions: 0,
    errors: [],
    partialResults: [],
    categoryProgress: []
  });

  const progressRef = useRef<AIGenerationProgress>(progress);
  progressRef.current = progress;

  const startGeneration = useCallback((totalBatches: number, totalSuggestions: number) => {
    const categories = [
      'Safety & Core Performance',
      'Usability & Human Factors', 
      'Lifecycle & Information Management'
    ];
    
    setProgress({
      isRunning: true,
      currentBatch: 0,
      totalBatches,
      currentCategory: '',
      totalSuggestions,
      completedSuggestions: 0,
      startTime: new Date(),
      errors: [],
      partialResults: [],
      categoryProgress: categories.map(name => ({
        name,
        completedSuggestions: 0,
        isComplete: false
      }))
    });
  }, []);

  const updateProgress = useCallback((update: AIProgressUpdate) => {
    setProgress(prev => {
      console.log('[useAIGenerationProgress] Current progress before update:', prev);
      console.log('[useAIGenerationProgress] Update received:', update);
      
      // Use completedSuggestions from update if available (this is the running total from edge function)
      const newCompletedCount = update.completedSuggestions !== undefined 
        ? update.completedSuggestions 
        : prev.completedSuggestions + (update.suggestions?.length || 0);
      
      // Update category progress
      const updatedCategoryProgress = prev.categoryProgress.map(cat => {
        if (cat.name === update.category && update.suggestions?.length > 0) {
          return {
            ...cat,
            completedSuggestions: cat.completedSuggestions + update.suggestions.length,
            isComplete: false
          };
        }
        return cat;
      });
      
      // Mark the category as complete if this is the last batch for this category
      // In our setup, each category is processed in one batch, so mark it complete when we have suggestions
      if (update.suggestions?.length > 0) {
        const currentCategoryIndex = updatedCategoryProgress.findIndex(cat => cat.name === update.category);
        if (currentCategoryIndex >= 0) {
          updatedCategoryProgress[currentCategoryIndex].isComplete = true;
        }
      }
      
      const newProgress = {
        ...prev,
        currentBatch: update.batchNumber,
        totalBatches: update.totalBatches,
        currentCategory: update.category,
        completedSuggestions: newCompletedCount,
        partialResults: [...prev.partialResults, ...update.suggestions],
        errors: update.error ? [...prev.errors, update.error] : prev.errors,
        categoryProgress: updatedCategoryProgress
      };
      
      console.log('[useAIGenerationProgress] New progress state:', newProgress);
      return newProgress;
    });
  }, []);

  const completeGeneration = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      currentCategory: 'Complete'
    }));
  }, []);

  const reset = useCallback(() => {
    setProgress({
      isRunning: false,
      currentBatch: 0,
      totalBatches: 0,
      currentCategory: '',
      totalSuggestions: 0,
      completedSuggestions: 0,
      errors: [],
      partialResults: [],
      categoryProgress: []
    });
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (progress.totalSuggestions === 0) return 0;
    return Math.round((progress.completedSuggestions / progress.totalSuggestions) * 100);
  }, [progress.completedSuggestions, progress.totalSuggestions]);

  const getElapsedTime = useCallback(() => {
    if (!progress.startTime) return 0;
    return Math.floor((Date.now() - progress.startTime.getTime()) / 1000);
  }, [progress.startTime]);

  const getEstimatedTimeRemaining = useCallback(() => {
    const elapsed = getElapsedTime();
    const percentage = getProgressPercentage();
    if (percentage === 0 || elapsed === 0) return 0;
    
    const totalEstimated = (elapsed / percentage) * 100;
    return Math.max(0, Math.floor(totalEstimated - elapsed));
  }, [getElapsedTime, getProgressPercentage]);

  return {
    progress,
    startGeneration,
    updateProgress,
    completeGeneration,
    reset,
    getProgressPercentage,
    getElapsedTime,
    getEstimatedTimeRemaining
  };
}