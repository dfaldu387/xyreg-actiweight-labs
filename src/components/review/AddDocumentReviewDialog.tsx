import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, Send, FileText, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddDocumentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
  };
  onReviewAdded: (reviewText: string) => void;
}

export function AddDocumentReviewDialog({
  open,
  onOpenChange,
  document,
  onReviewAdded
}: AddDocumentReviewDialogProps) {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reviewType, setReviewType] = useState<'approval' | 'changes_requested' | 'information'>('approval');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      toast.error('Please provide review comments');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a comment thread for this review
      const { data: threadData, error: threadError } = await supabase
        .from('comment_threads')
        .insert({
          document_id: document.id,
          is_internal: false
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add the review comment
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          thread_id: threadData.id,
          user_id: user?.id,
          content: reviewText.trim()
        });

      if (commentError) throw commentError;

      // Optionally update document status based on review type
      if (reviewType === 'changes_requested') {
        await supabase
          .from('documents')
          .update({ status: 'in_testing' })
          .eq('id', document.id);
      }

      toast.success('Review added successfully');
      onReviewAdded(reviewText);
      setReviewText('');
      setRating(null);
      setPriority('medium');
      setReviewType('approval');
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Star
              className={`h-5 w-5 ${rating && star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
                }`}
            />
          </button>
        ))}
        {rating && (
          <span className="ml-2 text-sm text-gray-600">
            {rating} of 5 stars
          </span>
        )}
      </div>
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getReviewTypeColor = (type: string) => {
    switch (type) {
      case 'approval': return 'bg-green-100 text-green-700 border-green-200';
      case 'changes_requested': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'information': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Add Review for {document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Reviewing as: {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </span>
            </div>
          </div>

          {/* Review Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Review Type</label>
            <Select value={reviewType} onValueChange={(value: any) => setReviewType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="changes_requested">Changes Requested</SelectItem>
                <SelectItem value="information">Information/Question</SelectItem>
              </SelectContent>
            </Select>
            <Badge className={`inline-flex ${getReviewTypeColor(reviewType)}`}>
              {reviewType.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Badge className={`inline-flex ${getPriorityColor(priority)}`}>
              {priority.toUpperCase()}
            </Badge>
          </div>

          {/* Rating */}
          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Rating (Optional)</label>
            {renderStars()}
          </div> */}

          {/* Review Comments */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Review Comments</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Provide detailed feedback about the document..."
              className="min-h-[120px] resize-none"
              rows={6}
            />
            <div className="text-xs text-gray-500">
              {reviewText.length}/1000 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reviewText.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}