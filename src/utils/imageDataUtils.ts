
// Comprehensive utility for handling and repairing image data

export const repairImageData = (imageData: any): string[] => {
  if (!imageData) {
    return [];
  }

  // If it's already an array of valid strings, return as-is
  if (Array.isArray(imageData)) {
    const validImages: string[] = [];
    
    for (let i = 0; i < imageData.length; i++) {
      const item = imageData[i];
      
      if (typeof item === 'string') {
        if (item.startsWith('data:') || item.startsWith('http')) {
          validImages.push(item);
        }
      } else if (Array.isArray(item)) {
        // Handle fragmented base64 data
        const reconstructed = item.join('');
        if (reconstructed.startsWith('data:') || reconstructed.startsWith('http')) {
          validImages.push(reconstructed);
        }
      } else if (typeof item === 'object' && item !== null) {
        // Handle object-wrapped items with _type and value properties (common corruption pattern)
        if (item._type && item.value) {
          if (typeof item.value === 'string' && (item.value.startsWith('data:') || item.value.startsWith('http'))) {
            validImages.push(item.value);
          } else if (Array.isArray(item.value)) {
            const reconstructed = item.value.join('');
            if (reconstructed.startsWith('data:') || reconstructed.startsWith('http')) {
              validImages.push(reconstructed);
            }
          }
        } else if (item.value) {
          if (typeof item.value === 'string' && (item.value.startsWith('data:') || item.value.startsWith('http'))) {
            validImages.push(item.value);
          } else if (Array.isArray(item.value)) {
            const reconstructed = item.value.join('');
            if (reconstructed.startsWith('data:') || reconstructed.startsWith('http')) {
              validImages.push(reconstructed);
            }
          }
        }
      }
    }
    
    return validImages;
  }

  // If it's a single string
  if (typeof imageData === 'string') {
    // Check if it's a valid image URL or base64
    if (imageData.startsWith('http') || imageData.startsWith('data:')) {
      return [imageData];
    }
    
    // Try parsing as JSON first (common corruption case)
    try {
      const parsed = JSON.parse(imageData);
      return repairImageData(parsed); // Recursive call with parsed data
    } catch {
      // CRITICAL: Do NOT split by comma as this corrupts base64 data
      // Base64 data URLs contain commas and splitting them breaks the image
      console.warn('Failed to parse image data as JSON, treating as single invalid item');
      return [];
    }
  }

  // Handle object-wrapped data (especially _type objects)
  if (typeof imageData === 'object' && imageData !== null) {
    // Check for _type and value properties (common corruption pattern)
    if (imageData._type && imageData.value !== undefined) {
      return repairImageData(imageData.value); // Recursive call
    }
    
    // Check for object with value property
    if (imageData.value !== undefined) {
      return repairImageData(imageData.value); // Recursive call
    }
    
    // Check for common object properties
    if (imageData.data || imageData.url) {
      const url = imageData.data || imageData.url;
      if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http'))) {
        return [url];
      }
    }
    
    // Check if it's an object with numeric keys (array-like object)
    const keys = Object.keys(imageData);
    if (keys.every(key => !isNaN(Number(key)))) {
      const arrayData = keys.sort((a, b) => Number(a) - Number(b)).map(key => imageData[key]);
      return repairImageData(arrayData); // Recursive call
    }
  }

  return [];
};

export const validateImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('data:');
};

export const sanitizeImageArray = (images: any): string[] => {
  if (!images) return [];
  
  const repairedImages = repairImageData(images);
  return repairedImages.filter(validateImageUrl);
};

// Enhanced function to ensure proper JSON array format for storage
export const prepareImagesForStorage = (images: string[]): string => {
  if (!Array.isArray(images)) {
    console.warn('prepareImagesForStorage: input is not an array, converting');
    const sanitized = sanitizeImageArray(images);
    return JSON.stringify(sanitized);
  }
  
  // Validate each image URL
  const validImages = images.filter(validateImageUrl);
  return JSON.stringify(validImages);
};

// Function to safely parse images from storage
export const parseImagesFromStorage = (storedData: any): string[] => {
  if (!storedData) return [];
  
  // If it's already an array, use it directly
  if (Array.isArray(storedData)) {
    return sanitizeImageArray(storedData);
  }
  
  // If it's a string, try to parse as JSON
  if (typeof storedData === 'string') {
    try {
      const parsed = JSON.parse(storedData);
      return sanitizeImageArray(parsed);
    } catch {
      // If JSON parsing fails, DO NOT split by comma as it corrupts base64
      console.warn('Failed to parse stored image data as JSON');
      return [];
    }
  }
  
  // For any other type, try to sanitize
  return sanitizeImageArray(storedData);
};

// New function to handle deep nested object structures
export const deepExtractImages = (data: any, depth: number = 0): string[] => {
  if (depth > 5) {
    return [];
  }
  
  if (!data) return [];
  
  // If it's a string and looks like an image
  if (typeof data === 'string' && (data.startsWith('data:') || data.startsWith('http'))) {
    return [data];
  }
  
  // If it's an array, process each item
  if (Array.isArray(data)) {
    const results: string[] = [];
    for (const item of data) {
      results.push(...deepExtractImages(item, depth + 1));
    }
    return results;
  }
  
  // If it's an object, check common properties
  if (typeof data === 'object' && data !== null) {
    const results: string[] = [];
    
    // Check for value property first (most common)
    if (data.value !== undefined) {
      results.push(...deepExtractImages(data.value, depth + 1));
    }
    
    // Check for data property
    if (data.data !== undefined) {
      results.push(...deepExtractImages(data.data, depth + 1));
    }
    
    // Check for url property
    if (data.url !== undefined) {
      results.push(...deepExtractImages(data.url, depth + 1));
    }
    
    // If no common properties found, check all properties
    if (results.length === 0) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          results.push(...deepExtractImages(data[key], depth + 1));
        }
      }
    }
    
    return results;
  }
  
  return [];
};
