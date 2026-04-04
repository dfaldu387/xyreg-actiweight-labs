
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentReviewer {
  id: string;
  name: string;
  role: string;
}

export const useDocumentReviewers = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateDocumentReviewers = async (documentId: string, reviewers: DocumentReviewer[]): Promise<boolean> => {
    setIsUpdating(true);
    try {
      // Convert reviewers to a format compatible with Json type
      const reviewersJson = reviewers as unknown as any;
      
      // For now, we'll store reviewers in the document metadata
      // In a real implementation, you'd have a separate reviewers table
      const { error } = await supabase
        .from('documents')
        .update({ 
          reviewers: reviewersJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document reviewers:', error);
        toast.error('Failed to update reviewers');
        return false;
      }

      toast.success('Reviewers updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateDocumentReviewers:', error);
      toast.error('Failed to update reviewers');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    updateDocumentReviewers
  };
};
