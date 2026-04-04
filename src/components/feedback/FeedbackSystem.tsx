import React, { useState } from 'react';
import { FeedbackButton } from './FeedbackButton';
// import { ScreenshotCapture } from './ScreenshotCapture';
import { SimpleScreenshot } from './SimpleScreenshot';
import { FeedbackModal, type FeedbackData } from './FeedbackModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeedbackSystem() {
  const [showCapture, setShowCapture] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [screenshot, setScreenshot] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleFeedbackClick = () => {
    setShowModal(true);
  };

  const handleCaptureScreen = () => {
    setShowModal(false);
    setIsCapturing(true);
    setShowCapture(true);
  };

  const handleCaptureComplete = (annotatedImage: string) => {
    setScreenshot(annotatedImage);
    setShowCapture(false);
    setIsCapturing(false);
    setShowModal(true);
  };

  const handleCaptureCancel = () => {
    setShowCapture(false);
    setIsCapturing(false);
    setShowModal(true);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsCapturing(loading);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setScreenshot('');
  };

  const handleClearScreenshot = () => {
    setScreenshot('');
  };

  const handleSubmitFeedback = async (feedback: FeedbackData) => {
    try {
      // Hard guard: reject submissions without company context
      if (!feedback.company_id) {
        return {
          success: false,
          message: 'Cannot submit feedback without a company context.',
        };
      }

      // Get current page metadata
      const pageMetadata = {
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      };

      // Get the current session to ensure we have a valid auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('No valid session found. Please log in again.');
      }

      let screenshotUrl = null;
      const screenshotUrls: string[] = [];

      // Upload all screenshots to storage
      const imagesToUpload = feedback.screenshots?.length ? feedback.screenshots : (feedback.screenshot ? [feedback.screenshot] : []);
      
      for (const imageData of imagesToUpload) {
        if (!imageData) continue;
        const screenshotFile = new File(
          [await fetch(imageData).then(r => r.blob())],
          `feedback-${Date.now()}-${screenshotUrls.length}.png`,
          { type: 'image/png' }
        );

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(`${session.user.id}/${screenshotFile.name}`, screenshotFile);

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
          throw uploadError;
        }

        screenshotUrls.push(uploadData.path);
      }
      
      screenshotUrl = screenshotUrls[0] || null;

      // Insert feedback data directly into the database
      const insertData: any = {
        user_id: session.user.id,
        type: feedback.type,
        title: feedback.title,
        description: feedback.description,
        screenshot_url: screenshotUrl,
        screenshot_urls: screenshotUrls,
        company_id: feedback.company_id,
      };

      const { data, error } = await supabase
        .from('feedback_submissions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        return {
          success: false,
          message: 'Failed to submit feedback',
        };
        throw error;
      }

      return {
        success: true,
        message: 'Feedback submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again later or contact support.',
        variant: 'destructive',
      });
      throw error; // Re-throw so the modal can handle the error state
    }
  };

  return (
    <>
      <FeedbackButton onClick={handleFeedbackClick} />

      {showCapture && (
        <SimpleScreenshot
          onComplete={handleCaptureComplete}
          onCancel={handleCaptureCancel}
          onLoadingChange={handleLoadingChange}
        />
      )}

      {
        isCapturing && (
          <div className="screenshot-capture-overlay fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Capturing screenshot...</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCaptureCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      }

      <FeedbackModal
        open={showModal}
        onClose={handleModalClose}
        screenshot={screenshot}
        onSubmit={handleSubmitFeedback}
        onCaptureScreen={handleCaptureScreen}
        onClearScreenshot={handleClearScreenshot}
        isCapturing={isCapturing}
      />
    </>
  );
}