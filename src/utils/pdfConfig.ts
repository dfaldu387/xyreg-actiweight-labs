
import { pdfjs } from 'react-pdf';

// Use react-pdf's built-in PDF.js version for perfect compatibility
const getWorkerVersion = () => pdfjs.version;

// Cache the worker version since it doesn't change during runtime
let cachedWorkerVersion: string | null = null;
const getCachedWorkerVersion = () => {
  if (!cachedWorkerVersion) {
    cachedWorkerVersion = getWorkerVersion();
  }
  return cachedWorkerVersion;
};

// Multiple fallback worker URLs in order of preference
const getWorkerUrls = () => {
  const version = getCachedWorkerVersion();
  return [
    // Modern format with .mjs extension
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`,
    // Legacy format with .min.js extension
    `https://unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.js`,
    // JSDelivr CDN as backup
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`,
    // Protocol-relative URL as final fallback
    `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`
  ];
};

const testWorkerUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 } as any);
    return response.ok;
  } catch {
    return false;
  }
};

export const initializePdfJs = async () => {
  const version = getCachedWorkerVersion();
  
  const workerUrls = getWorkerUrls();
  
  // Try each worker URL until one works
  for (const workerUrl of workerUrls) {
    
    try {
      const isAccessible = await testWorkerUrl(workerUrl);
      if (isAccessible) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // If all URLs fail, let react-pdf use its default worker
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
  
  return false;
};

// Cache the PDF options to prevent unnecessary recreations
let cachedPdfOptions: any = null;

// Minimal PDF.js document options to prevent compatibility issues
export const getPdfOptions = () => {
  if (!cachedPdfOptions) {
    const version = getCachedWorkerVersion();
    cachedPdfOptions = {
      // Disable potentially problematic features
      disableStream: false,
      disableAutoFetch: false,
      disableFontFace: false,
      
      // Use minimal configuration
      cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
      cMapPacked: true,
      
      // Disable standard fonts to prevent loading issues
      standardFontDataUrl: undefined
    };
  }
  return cachedPdfOptions;
};

export { pdfjs };
