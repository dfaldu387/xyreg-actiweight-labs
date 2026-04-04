import { useState, useEffect, useCallback } from 'react';
import { ModuleProgress, ModuleContent } from '@/types/onboarding';

const MODULE_PROGRESS_STORAGE_KEY = 'xyreg-module-progress';

export function useModuleProgress() {
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>(() => {
    const stored = localStorage.getItem(MODULE_PROGRESS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key].startedAt) parsed[key].startedAt = new Date(parsed[key].startedAt);
          if (parsed[key].completedAt) parsed[key].completedAt = new Date(parsed[key].completedAt);
          if (parsed[key].lastAccessed) parsed[key].lastAccessed = new Date(parsed[key].lastAccessed);
        });
        return parsed;
      } catch {
        return {};
      }
    }
    return {};
  });

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem(MODULE_PROGRESS_STORAGE_KEY, JSON.stringify(moduleProgress));
  }, [moduleProgress]);

  const startModule = useCallback((moduleId: string, totalSteps: number) => {
    setModuleProgress(prev => ({
      ...prev,
      [moduleId]: {
        moduleId,
        startedAt: new Date(),
        currentStep: 0,
        totalSteps,
        completedSteps: [],
        skippedSteps: [],
        timeSpent: 0,
        lastAccessed: new Date()
      }
    }));
  }, []);

  const completeStep = useCallback((moduleId: string, stepIndex: number) => {
    setModuleProgress(prev => {
      const current = prev[moduleId];
      if (!current) return prev;

      const completedSteps = [...current.completedSteps];
      if (!completedSteps.includes(stepIndex)) {
        completedSteps.push(stepIndex);
      }

      return {
        ...prev,
        [moduleId]: {
          ...current,
          completedSteps,
          currentStep: Math.min(stepIndex + 1, current.totalSteps - 1),
          lastAccessed: new Date()
        }
      };
    });
  }, []);

  const skipStep = useCallback((moduleId: string, stepIndex: number) => {
    setModuleProgress(prev => {
      const current = prev[moduleId];
      if (!current) return prev;

      const skippedSteps = [...current.skippedSteps];
      if (!skippedSteps.includes(stepIndex)) {
        skippedSteps.push(stepIndex);
      }

      return {
        ...prev,
        [moduleId]: {
          ...current,
          skippedSteps,
          currentStep: Math.min(stepIndex + 1, current.totalSteps - 1),
          lastAccessed: new Date()
        }
      };
    });
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    setModuleProgress(prev => {
      const current = prev[moduleId];
      if (!current) return prev;

      return {
        ...prev,
        [moduleId]: {
          ...current,
          completedAt: new Date(),
          lastAccessed: new Date()
        }
      };
    });
  }, []);

  const updateTimeSpent = useCallback((moduleId: string, additionalSeconds: number) => {
    setModuleProgress(prev => {
      const current = prev[moduleId];
      if (!current) return prev;

      return {
        ...prev,
        [moduleId]: {
          ...current,
          timeSpent: current.timeSpent + additionalSeconds,
          lastAccessed: new Date()
        }
      };
    });
  }, []);

  const getModuleProgress = useCallback((moduleId: string): ModuleProgress | null => {
    return moduleProgress[moduleId] || null;
  }, [moduleProgress]);

  const isModuleCompleted = useCallback((moduleId: string): boolean => {
    const progress = moduleProgress[moduleId];
    return !!progress?.completedAt;
  }, [moduleProgress]);

  const isModuleInProgress = useCallback((moduleId: string): boolean => {
    const progress = moduleProgress[moduleId];
    return !!progress?.startedAt && !progress?.completedAt;
  }, [moduleProgress]);

  const getCompletionPercentage = useCallback((moduleId: string): number => {
    const progress = moduleProgress[moduleId];
    if (!progress) return 0;
    if (progress.completedAt) return 100;

    const completed = progress.completedSteps.length + progress.skippedSteps.length;
    return Math.round((completed / progress.totalSteps) * 100);
  }, [moduleProgress]);

  const getOverallProgress = useCallback((moduleIds: string[]): number => {
    if (moduleIds.length === 0) return 0;
    
    const total = moduleIds.reduce((sum, id) => sum + getCompletionPercentage(id), 0);
    return Math.round(total / moduleIds.length);
  }, [getCompletionPercentage]);

  const resetModuleProgress = useCallback((moduleId: string) => {
    setModuleProgress(prev => {
      const updated = { ...prev };
      delete updated[moduleId];
      return updated;
    });
  }, []);

  const resetAllProgress = useCallback(() => {
    setModuleProgress({});
    localStorage.removeItem(MODULE_PROGRESS_STORAGE_KEY);
  }, []);

  return {
    moduleProgress,
    startModule,
    completeStep,
    skipStep,
    completeModule,
    updateTimeSpent,
    getModuleProgress,
    isModuleCompleted,
    isModuleInProgress,
    getCompletionPercentage,
    getOverallProgress,
    resetModuleProgress,
    resetAllProgress
  };
}
