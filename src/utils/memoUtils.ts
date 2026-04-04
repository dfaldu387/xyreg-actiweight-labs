
/**
 * Utility for creating a stable array reference that only changes when the array contents change
 * This helps prevent unnecessary re-renders in React components
 */
export function createStableArray<T>(array: T[]): T[] {
  // Use a WeakMap to store stable references
  const cache = new WeakMap();
  
  // Helper function to check deep equality of arrays
  const areArraysEqual = (a: T[], b: T[]): boolean => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    
    return true;
  };
  
  // Create a stable reference for this array
  const stableArray = cache.get(array) || array;
  
  if (areArraysEqual(stableArray, array)) {
    return stableArray;
  }
  
  return array;
}
