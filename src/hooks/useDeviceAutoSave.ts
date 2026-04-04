
import { useCallback, useRef } from 'react';
import { useAutoSave } from './useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseDeviceAutoSaveOptions {
  productId: string;
  enabled?: boolean;
}

export function useDeviceAutoSave({ productId, enabled = true }: UseDeviceAutoSaveOptions) {
  const lastSaveAttempt = useRef<number>(0);
  
  const saveToDatabase = useCallback(async (updates: Record<string, any>) => {
    // Prevent duplicate saves within 1 second
    const now = Date.now();
    if (now - lastSaveAttempt.current < 1000) {
      return;
    }
    lastSaveAttempt.current = now;

    try {
      console.log('Auto-saving device data:', Object.keys(updates));
      
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        console.error('Auto-save failed:', error);
        throw error;
      }

      console.log('Auto-save successful');
    } catch (error) {
      console.error('Database save error:', error);
      toast.error('Failed to auto-save changes');
      throw error;
    }
  }, [productId]);

  const { saveStatus, hasUnsavedChanges, forceSave } = useAutoSave({
    data: {}, // We'll pass specific updates directly to saveToDatabase
    onSave: saveToDatabase,
    delay: 15000, // Auto-save every 15 seconds
    enabled
  });

  // Create a stable save function that doesn't trigger re-renders
  const debouncedSave = useCallback((updates: Record<string, any>) => {
    if (!enabled || Object.keys(updates).length === 0) return;
    
    // Use a timeout to debounce rapid changes
    const timeoutId = setTimeout(() => {
      saveToDatabase(updates).catch(console.error);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [saveToDatabase, enabled]);

  return {
    debouncedSave,
    saveStatus,
    hasUnsavedChanges,
    forceSave: () => forceSave()
  };
}
