
/**
 * Utility functions for handling droppable IDs in drag-and-drop operations
 * These ensure safe encoding/decoding of phase names that may contain special characters
 */

/**
 * Create a safe droppable ID for a phase name
 */
export function encodePhaseDroppableId(phaseName: string): string {
  // Use base64 encoding to handle special characters safely
  return `phase_${btoa(encodeURIComponent(phaseName))}`;
}

/**
 * Decode a phase droppable ID back to the original phase name
 */
export function decodePhaseDroppableId(droppableId: string): string | null {
  try {
    if (!droppableId.startsWith('phase_')) {
      return null;
    }
    
    const encoded = droppableId.replace('phase_', '');
    return decodeURIComponent(atob(encoded));
  } catch (error) {
    console.error('Failed to decode phase droppable ID:', droppableId, error);
    return null;
  }
}

/**
 * Create a safe draggable ID for a product
 */
export function createProductDraggableId(productId: string): string {
  return `product_${productId}`;
}

/**
 * Extract product ID from a draggable ID
 */
export function extractProductId(draggableId: string): string | null {
  if (!draggableId.startsWith('product_')) {
    return null;
  }
  
  return draggableId.replace('product_', '');
}

/**
 * Check if a droppable ID represents a phase
 */
export function isPhaseDroppableId(droppableId: string): boolean {
  return droppableId.startsWith('phase_');
}

/**
 * Check if a draggable ID represents a product
 */
export function isProductDraggableId(draggableId: string): boolean {
  return draggableId.startsWith('product_');
}
