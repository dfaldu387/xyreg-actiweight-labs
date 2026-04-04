import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface Prompt {
  id: string;
  name: string;
  description?: string;
  additional_instructions: string;
  default_temperature: number;
  default_max_tokens: number;
  default_context_chunks: number;
  is_default: boolean;
  is_active: boolean;
}

interface PromptSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  activePromptId: string | null;
  onPromptChange: (promptId: string | null) => void;
}

// Users can only add additional instructions (default 6 are always applied by backend)

export function PromptSettingsDrawer({
  open,
  onOpenChange,
  companyId,
  activePromptId,
  onPromptChange,
}: PromptSettingsDrawerProps) {
  const { user } = useAuth();
  const [currentPromptId, setCurrentPromptId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [originalInstructions, setOriginalInstructions] = useState('');

  // Load prompt when dialog opens
  useEffect(() => {
    if (open && companyId) {
      loadPrompt();
    }
  }, [open, companyId]);

  const loadPrompt = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: Prompt }>(
        `/ai/prompts/${companyId}/active?prompt_type=rag_summary`
      );
      if (response.data.success && response.data.data) {
        const prompt = response.data.data;
        setCurrentPromptId(prompt.id);
        // Load additional instructions (may be empty)
        const additional = prompt.additional_instructions || '';
        setAdditionalInstructions(additional);
        setOriginalInstructions(additional);
      } else {
        // No custom prompt exists yet, start empty
        setCurrentPromptId('default');
        setAdditionalInstructions('');
        setOriginalInstructions('');
      }
    } catch (error) {
      console.error('Failed to load prompt:', error);
      setCurrentPromptId('default');
      setAdditionalInstructions('');
      setOriginalInstructions('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentPromptId === 'default') {
        // Create new prompt with additional instructions
        const response = await apiClient.post<{ success: boolean; data: Prompt }>('/ai/prompts', {
          company_id: companyId,
          user_id: user?.id,
          name: 'Custom RAG Summary',
          description: 'Additional instructions for document summarization',
          prompt_type: 'rag_summary',
          additional_instructions: additionalInstructions,
          default_temperature: 0.2,
          default_max_tokens: 2500,
          is_default: true,
        });
        if (response.data.success) {
          toast.success('Instructions saved');
          setCurrentPromptId(response.data.data.id);
          setOriginalInstructions(additionalInstructions);
          onPromptChange(response.data.data.id);
        }
      } else {
        // Update existing prompt
        const response = await apiClient.put<{ success: boolean; data: Prompt }>(
          `/ai/prompts/${currentPromptId}`,
          { additional_instructions: additionalInstructions, user_id: user?.id }
        );
        if (response.data.success) {
          toast.success('Instructions updated');
          setOriginalInstructions(additionalInstructions);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setAdditionalInstructions('');
    toast.info('Instructions cleared');
  };

  const hasContent = additionalInstructions.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>AI Prompt Settings</DialogTitle>
          <DialogDescription>
            Customize how AI responds to your queries
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label htmlFor="additional-instructions">User Instructions</Label>
              <p className="text-xs text-muted-foreground">
                Add custom guidelines to enhance AI responses. These will be added to the default instructions.
              </p>
              <Textarea
                id="additional-instructions"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Example:&#10;- Focus on regulatory compliance details&#10;- Include specific section references&#10;- Highlight risk assessments"
                rows={16}
                className="font-mono text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={!hasContent}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <div className="flex-1" />
              <Button
                onClick={handleSave}
                disabled={isSaving || additionalInstructions === originalInstructions}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
