import { useState, useCallback, useEffect, useRef } from 'react';
import { useStableCallback } from './useStableCallback';
import { debounce } from '@/utils/debounce';
import { DeviceCharacteristics, EnhancedProductMarket, IntendedPurposeData } from '@/types/client';
import { Device3DModel } from '@/types';
import { prepareImagesForStorage, sanitizeImageArray } from '@/utils/imageDataUtils';

interface DeviceComponent {
  name: string;
  description: string;
}

export interface LocalDeviceState {
  // Basic device information
  productName: string;
  modelReference: string;
  deviceType: string | DeviceCharacteristics;
  deviceCategory: string;
  deviceClass: "I" | "IIa" | "IIb" | "III" | undefined;
  regulatoryStatus: string;
  intendedUse: string;
  intendedPurposeData: IntendedPurposeData;
  description: string;
  keyFeatures: string[];
  deviceComponents: DeviceComponent[];
  images: string[];
  videos: string[];
  basicUdiDi: string;
  udiDi: string;
  udiPi: string;
  gtin: string;
  modelVersion: string;
  markets: EnhancedProductMarket[];
  ceMarkStatus: string;
  notifiedBody: string;
  isoCertifications: string[];
  designFreezeDate: string | Date | null;
  currentLifecyclePhase: string;
  projectedLaunchDate: string | Date | null;
  conformityAssessmentRoute: string;
  intendedUsers: string[];
  clinicalBenefits: string[];
  userInstructions: {
    how_to_use?: string;
    charging?: string;
    maintenance?: string;
  };
  deviceCompliance: string[];
  deviceSummary: string;
  registrationNumber: string;
  registrationStatus: string;
  registrationDate: string | Date | null;
  marketAuthorizationHolder: string;
  contraindications: string[];
  totalNPV: number;
  selectedCurrency: string;
  models3D: Device3DModel[];
}

interface DeviceStateConfig {
  initialData: LocalDeviceState;
  onSave: (field: string, value: any) => Promise<void>;
}

// Define which fields should be debounced (text inputs)
const TEXT_FIELDS_TO_DEBOUNCE = new Set([
  'productName',
  'modelReference',
  'deviceCategory',
  'regulatoryStatus',
  'intendedUse',
  'description',
  'ceMarkStatus',
  'notifiedBody',
  'conformityAssessmentRoute',
  'basicUdiDi',
  'udiDi',
  'udiPi',
  'gtin',
  'modelVersion',
  'registrationNumber',
  'registrationStatus',
  'marketAuthorizationHolder',
  'deviceSummary'
]);

// Define which fields contain arrays that need special JSON handling
const ARRAY_FIELDS = new Set([
  'images',
  'videos',
  'keyFeatures',
  'deviceComponents',
  'markets',
  'isoCertifications',
  'intendedUsers',
  'clinicalBenefits',
  'deviceCompliance',
  'contraindications',
  'models3D'
]);

export function useLocalDeviceState({ initialData, onSave }: DeviceStateConfig) {
  const [localState, setLocalState] = useState<LocalDeviceState>(initialData);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Use stable callback for onSave
  const stableOnSave = useStableCallback(onSave);

  // Create stable debounced save functions using useRef to prevent recreation
  const debouncedSaveRef = useRef<Map<string, ReturnType<typeof debounce>>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any field is dirty
  const isDirty = dirtyFields.size > 0;

  // Check if any field is saving
  const isSaving = savingFields.size > 0;

  // Stable save field function with proper array handling
  const saveField = useCallback(async (field: string) => {
    console.log(`💾 [LocalDeviceState] Saving field: ${field}`);

    setSavingFields(prev => new Set(prev).add(field));

    try {
      let valueToSave = (localState as any)[field];
      
      // CRITICAL: Special handling for image and video arrays to ensure proper JSON storage
      if (field === 'images' || field === 'videos') {
        if (Array.isArray(valueToSave)) {
          // Sanitize the array first to ensure all items are valid
          const sanitizedArray = sanitizeImageArray(valueToSave);
          // Convert array to properly formatted JSON string for storage
          valueToSave = prepareImagesForStorage(sanitizedArray);
          console.log(`📸 [LocalDeviceState] Prepared ${field} for storage:`, sanitizedArray.length, 'valid images');
        } else {
          // If it's not an array, try to sanitize it first
          const sanitizedArray = sanitizeImageArray(valueToSave);
          valueToSave = prepareImagesForStorage(sanitizedArray);
          console.log(`🔧 [LocalDeviceState] Repaired and prepared ${field} for storage:`, sanitizedArray.length, 'valid images');
        }
      } else if (ARRAY_FIELDS.has(field) && Array.isArray(valueToSave)) {
        // For other array fields, ensure proper JSON stringification
        valueToSave = JSON.stringify(valueToSave);
      }
      
      await stableOnSave(field, valueToSave);
      
      // Only update dirty fields after successful save
      setDirtyFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      
      console.log(`✅ [LocalDeviceState] Successfully saved field: ${field}`);
    } catch (error) {
      console.error(`❌ [LocalDeviceState] Error saving field ${field}:`, error);
    } finally {
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  }, [localState, stableOnSave]);

  // Stable typing state management
  const setTypingState = useCallback((typing: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setIsTyping(typing);
    
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000); // Stop typing indicator after 2 seconds of no activity
    }
  }, []);

  // Optimized update field function with stable references
  const updateField = useCallback((field: keyof LocalDeviceState, value: any) => {
    console.log(`🔄 [LocalDeviceState] Updating field: ${field}`);
    
    // Special handling for image arrays to ensure they remain as proper arrays
    if (field === 'images' || field === 'videos') {
      // Always ensure we're working with a sanitized array
      const sanitizedValue = Array.isArray(value) ? sanitizeImageArray(value) : sanitizeImageArray([value]);
      console.log(`🎯 [LocalDeviceState] Sanitized ${field}:`, sanitizedValue.length, 'valid images');
      
      // Update local state immediately for UI responsiveness
      setLocalState(prevState => ({
        ...prevState,
        [field]: sanitizedValue,
      }));
      
      // Mark field as dirty and save immediately for image arrays
      setDirtyFields(prev => new Set(prev).add(field));
      setTimeout(() => saveField(field), 0);
      return;
    }
    
    // Update local state immediately for UI responsiveness
    setLocalState(prevState => ({
      ...prevState,
      [field]: value,
    }));
    
    // Mark field as dirty but don't trigger save immediately for text fields
    if (TEXT_FIELDS_TO_DEBOUNCE.has(field)) {
      setTypingState(true);
      
      // Create or get debounced save function for this field
      if (!debouncedSaveRef.current.has(field)) {
        const debouncedSave = debounce(() => {
          console.log(`⏰ [LocalDeviceState] Debounced save triggered for: ${field}`);
          setDirtyFields(prev => new Set(prev).add(field));
          saveField(field);
        }, 2000); // Increased to 2 seconds for better typing experience
        
        debouncedSaveRef.current.set(field, debouncedSave);
      }
      
      const debouncedSave = debouncedSaveRef.current.get(field);
      if (debouncedSave) {
        debouncedSave();
      }
    } else {
      // For non-text fields (dropdowns, arrays, etc.), mark as dirty and save immediately
      setDirtyFields(prev => new Set(prev).add(field));
      setTimeout(() => saveField(field), 0);
    }
  }, [saveField, setTypingState]);

  // Save all pending changes
  const saveAllPendingChanges = useCallback(async () => {
    const pendingFields = Array.from(dirtyFields);
    if (pendingFields.length === 0) return;

    console.log('💾 [LocalDeviceState] Saving all pending changes:', pendingFields);
    
    // Cancel any pending debounced saves
    debouncedSaveRef.current.forEach((debouncedFn, field) => {
      if (pendingFields.includes(field)) {
        debouncedFn.cancel?.();
      }
    });

    // Save all pending fields
    await Promise.all(pendingFields.map(field => saveField(field)));
  }, [dirtyFields, saveField]);

  // Reset when initial data changes
  useEffect(() => {
    console.log('🔄 [LocalDeviceState] Resetting state with new initial data');
    setLocalState(initialData);
    setDirtyFields(new Set());
    setSavingFields(new Set());
    setIsTyping(false);
    debouncedSaveRef.current.clear();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      saveAllPendingChanges();
    };
  }, [saveAllPendingChanges]);

  return {
    localState,
    updateField,
    dirtyFields,
    savingFields,
    isDirty,
    isSaving,
    saveAllPendingChanges,
    isTyping
  };
}
