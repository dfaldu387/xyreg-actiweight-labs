
import { useEffect, useRef, useCallback, useState } from 'react';
import { debounce } from '@/utils/debounce';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  validateData?: (data: T) => boolean;
}

interface UseAutoSaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  forceSave: () => Promise<void>;
  isTyping: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 30000, // 30 seconds
  enabled = true,
  validateData
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const lastSavedData = useRef<T>(data);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: T, savedData: T): boolean => {
    return JSON.stringify(currentData) !== JSON.stringify(savedData);
  }, []);

  // Save function with typing detection
  const saveData = useCallback(async (dataToSave: T) => {
    if (!enabled || isTyping) return;
    
    // Validate data if validator is provided
    if (validateData && !validateData(dataToSave)) {
      console.log('Auto-save skipped: data validation failed');
      return;
    }

    try {
      setSaveStatus('saving');
      await onSave(dataToSave);
      lastSavedData.current = dataToSave;
      setLastSaved(new Date());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [onSave, enabled, validateData, isTyping]);

  // Enhanced debounced save with reduced delay
  const debouncedSave = useCallback(
    debounce((dataToSave: T) => {
      if (hasDataChanged(dataToSave, lastSavedData.current)) {
        saveData(dataToSave);
      }
    }, 2000), // Reduced to 2 seconds
    [saveData, hasDataChanged]
  );

  // Force save function
  const forceSave = useCallback(async () => {
    await saveData(data);
  }, [saveData, data]);

  // Track typing activity
  useEffect(() => {
    if (hasDataChanged(data, lastSavedData.current)) {
      setHasUnsavedChanges(true);
      setIsTyping(true);
      
      // Clear existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set typing to false after user stops typing for 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      
      debouncedSave(data);
    }
  }, [data, debouncedSave, hasDataChanged]);

  // Auto-save on interval only when not typing
  useEffect(() => {
    if (!enabled || isTyping) return;

    const interval = setInterval(() => {
      if (hasDataChanged(data, lastSavedData.current)) {
        setHasUnsavedChanges(true);
        saveData(data);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [data, delay, enabled, saveData, hasDataChanged, isTyping]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    forceSave,
    isTyping
  };
}
