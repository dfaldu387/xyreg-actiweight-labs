import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as htmlToImage from 'html-to-image';
import { ImageEditor } from './ImageEditor';
import { useTranslation } from '@/hooks/useTranslation';

interface SimpleScreenshotProps {
  onComplete: (screenshot: string) => void;
  onCancel: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function SimpleScreenshot({ onComplete, onCancel, onLoadingChange }: SimpleScreenshotProps) {
  const { lang } = useTranslation();
  const [isCapturing, setIsCapturing] = useState(true);
  const [screenshot, setScreenshot] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    captureScreenshot();
  }, []);

  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      onLoadingChange?.(true);

      // Hide the feedback system before capturing (but keep overlay visible to user)
      const feedbackElements = document.querySelectorAll('[data-feedback-system]');
      
      feedbackElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Store original scroll position
      const originalScrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const originalScrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Add a small delay to ensure DOM updates are processed
      await new Promise(resolve => setTimeout(resolve, 300));

      let dataUrl: string;

      // Try multiple capture methods
      try {
        // Method 1: html-to-image with viewport container
        dataUrl = await captureWithHtmlToImage(originalScrollX, originalScrollY);
      } catch (error) {
        console.warn('html-to-image method failed, trying alternative:', error);
        
        // Method 2: Direct document capture with html-to-image
        dataUrl = await htmlToImage.toPng(document.body, {
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: '#ffffff',
          pixelRatio: 1,
          quality: 0.9,
          filter: (node) => {
            // Filter out feedback system elements and loading overlays
            const element = node as HTMLElement;
            return !(
              element.hasAttribute('data-feedback-system') ||
              element.classList.contains('screenshot-capture-overlay') ||
              (element.classList.contains('fixed') && 
               element.classList.contains('inset-0') && 
               element.classList.contains('z-50') && 
               element.classList.contains('bg-black/80'))
            );
          }
        });
      }

      // Restore feedback elements
      feedbackElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      // Ensure scroll position is maintained
      window.scrollTo(originalScrollX, originalScrollY);

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Failed to generate screenshot');
      }

      setScreenshot(dataUrl);
      setIsCapturing(false);
      onLoadingChange?.(false);

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setIsCapturing(false);
      onLoadingChange?.(false);
    }
  };

  const captureWithHtmlToImage = async (scrollX: number, scrollY: number): Promise<string> => {
    // Create a temporary container that shows only the visible viewport
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = `${window.innerWidth}px`;
    tempContainer.style.height = `${window.innerHeight}px`;
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.zIndex = '9999';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.pointerEvents = 'none';
    
    // Clone the entire document body
    const bodyClone = document.body.cloneNode(true) as HTMLElement;
    
    // Remove ALL loading overlays
    const elementsToRemove = [
      '.screenshot-capture-overlay',
      '[data-feedback-system]',
      '.fixed.inset-0.z-50.bg-black\\/80',
      '.bg-background.rounded-lg.p-6.flex.flex-col.items-center.gap-4'
    ];
    
    elementsToRemove.forEach(selector => {
      const elements = bodyClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Position the clone to show the scrolled content
    bodyClone.style.position = 'absolute';
    bodyClone.style.top = `-${scrollY}px`;
    bodyClone.style.left = `-${scrollX}px`;
    bodyClone.style.width = `${document.body.scrollWidth}px`;
    bodyClone.style.height = `${document.body.scrollHeight}px`;
    bodyClone.style.margin = '0';
    bodyClone.style.padding = '0';
    bodyClone.style.transform = 'none';
    
    tempContainer.appendChild(bodyClone);
    document.body.appendChild(tempContainer);

    // Wait for the container to be rendered
    await new Promise(resolve => setTimeout(resolve, 200));

    // Use html-to-image to capture the container
    const dataUrl = await htmlToImage.toPng(tempContainer, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff',
      pixelRatio: 1,
      quality: 0.9,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      }
    });

    // Clean up the temporary container
    document.body.removeChild(tempContainer);

    return dataUrl;
  };

  const handleComplete = () => {
    if (screenshot) {
      onComplete(screenshot);
    }
  };

//   const handleRetake = () => {
//     setScreenshot('');
//     setShowEditor(false);
//     captureScreenshot();
//   };

  const handleEdit = () => {
    setShowEditor(true);
  };

  const handleEditorComplete = (annotatedImage: string) => {
    setScreenshot(annotatedImage);
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  if (isCapturing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" data-feedback-system>
        <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{lang('feedback.capturingScreenshot')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            {lang('feedback.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <ImageEditor
        screenshot={screenshot}
        onComplete={handleEditorComplete}
        onCancel={handleEditorCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" data-feedback-system>
      <div className="bg-background rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{lang('feedback.screenshotCaptured')}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {screenshot && (
          <div className="space-y-4">
            <div className="border rounded-lg p-2 bg-muted">
              <img
                src={screenshot}
                alt={lang('feedback.capturedScreenshotAlt')}
                className="w-full h-auto max-h-[60vh] object-contain rounded"
              />
            </div>

            <div className="flex justify-end gap-2">
              {/* <Button variant="outline" onClick={handleRetake}>
                Retake
              </Button> */}
              <Button variant="outline" onClick={handleEdit}>
                {lang('feedback.editor')}
              </Button>
              <Button onClick={handleComplete}>
                {lang('feedback.done')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
