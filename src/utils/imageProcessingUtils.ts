/**
 * Resizes an image file to a square format with specified dimensions
 * Maintains aspect ratio and centers the image within the square
 * 
 * @param file - The image file to resize
 * @param maxSize - The target size for both width and height (default: 400px)
 * @returns Promise resolving to a Blob of the resized image
 */
export async function resizeImageToSquare(file: File, maxSize: number = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Fill with white background (for transparency handling)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, maxSize, maxSize);
      
      // Calculate scaling to fit image within square while maintaining aspect ratio
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (maxSize - scaledWidth) / 2;
      const y = (maxSize - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        0.9 // Quality factor for compression
      );
      
      // Clean up
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}
