import { toast } from "sonner";

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

/**
 * Validates image dimensions (removed minimum size requirement)
 */
export const validateImageDimensions = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      
      // Accept any valid image dimensions
      resolve({
        isValid: true,
        width,
        height
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: "Failed to load image for validation."
      });
    };
    
    img.src = url;
  });
};

/**
 * Validates image dimensions from a URL (removed minimum size requirement)
 */
export const validateImageDimensionsFromUrl = (url: string): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      
      // Accept any valid image dimensions
      resolve({
        isValid: true,
        width,
        height
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        error: "Failed to load image for validation."
      });
    };
    
    img.src = url;
  });
};

/**
 * Validates image file with basic checks and shows toast message if invalid
 */
export const validateImageFileWithToast = async (file: File): Promise<boolean> => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    toast.error("Please select a valid image file.");
    return false;
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    toast.error("Image file size must be less than 5MB.");
    return false;
  }
  
  // Basic dimension validation (just check if image loads)
  const dimensionValidation = await validateImageDimensions(file);
  if (!dimensionValidation.isValid) {
    toast.error("Failed to validate image. Please try another file.");
    return false;
  }
  
  return true;
};

/**
 * Validates image URL with basic checks and shows toast message if invalid
 */
export const validateImageUrlWithToast = async (url: string): Promise<boolean> => {
  try {
    // Basic URL validation
    new URL(url);
  } catch {
    toast.error("Please enter a valid image URL.");
    return false;
  }
  
  // Skip dimension validation due to CORS restrictions in restricted environments
  // Just check if it looks like an image URL
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  const looksLikeImageUrl = hasImageExtension || 
    url.includes('image') || 
    url.startsWith('data:image/') ||
    url.includes('imgur') ||
    url.includes('unsplash') ||
    url.includes('picsum') ||
    // Allow any HTTPS URL to accommodate search results
    url.startsWith('https://');
  
  if (!looksLikeImageUrl) {
    toast.error("Please enter a valid image URL that ends with an image extension or is from a known image service.");
    return false;
  }
  
  return true;
};