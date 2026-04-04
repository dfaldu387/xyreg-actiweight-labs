import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, AlertCircle } from 'lucide-react';

interface AIPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: string) => void;
  prompt: string;
  sectionTitle?: string;
}

export function AIPromptDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  prompt, 
  sectionTitle 
}: AIPromptDialogProps) {
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(userResponse);
      setUserResponse('');
      onClose();
    } catch (error) {
      console.error('Error submitting AI prompt response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUserResponse('');
    onClose();
  };

  // Extract the actual question from the AI_PROMPT_NEEDED format
  const extractedPrompt = prompt.replace(/\[AI_PROMPT_NEEDED:\s*/, '').replace(/\]$/, '');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Content Generation
          </DialogTitle>
          <DialogDescription>
            The AI needs additional information to generate accurate content for this section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sectionTitle && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-muted-foreground">
                Section: {sectionTitle}
              </Label>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Information Needed</h4>
                <p className="text-amber-700 text-sm leading-relaxed">
                  {extractedPrompt}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-response" className="text-sm font-medium">
              Your Response
            </Label>
            <Textarea
              id="user-response"
              placeholder="Please provide the requested information..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              rows={4}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Be as specific and detailed as possible. This information will be used to generate accurate, compliant content.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Skip for Now
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!userResponse.trim() || isSubmitting}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Generating...' : 'Generate Content'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}