import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useTranslation } from '@/hooks/useTranslation';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  screenshot: string;
  onSubmit: (feedback: FeedbackData) => Promise<{ success: boolean, message: string }>;
  onCaptureScreen?: () => void;
  onClearScreenshot?: () => void;
  isCapturing?: boolean;
}

export interface FeedbackData {
  type: 'bug_report' | 'improvement_suggestion';
  title: string;
  description: string;
  screenshot: string;
  screenshots: string[];
  company_id: string;
}

export function FeedbackModal({ open, onClose, screenshot, onSubmit, onCaptureScreen, onClearScreenshot, isCapturing = false }: FeedbackModalProps) {
  const { lang } = useTranslation();
  const [type, setType] = useState<FeedbackData['type']>('bug_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allImages = [...(screenshot ? [screenshot] : []), ...uploadedImages];
  const companyId = useCompanyId();
  // console.log('companyId', companyId);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    // If index 0 and screenshot exists, it's the captured screenshot
    if (screenshot && index === 0) {
      onClearScreenshot?.();
      return;
    }
    const uploadIndex = screenshot ? index - 1 : index;
    setUploadedImages(prev => prev.filter((_, i) => i !== uploadIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const result: { success: boolean, message: string } = await onSubmit({
        type,
        title: title.trim(),
        description: description.trim(),
        screenshot: allImages[0] || '',
        screenshots: allImages,
        company_id: companyId,
      });
      // console.log('result', result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // Reset form
      setType('bug_report');
      setTitle('');
      setDescription('');
      setUploadedImages([]);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('feedback.submitFeedback')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshot/Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{lang('feedback.screenshot')}</Label>
              {onCaptureScreen && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCaptureScreen}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {lang('feedback.capturing')}
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      {lang('feedback.captureScreen')}
                    </>
                  )}
                </Button>
              )}
            </div>
            {allImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {allImages.map((img, idx) => (
                  <div key={idx} className="border rounded-lg p-2 bg-muted relative">
                    <img
                      src={img}
                      alt={`${lang('feedback.screenshotAlt')} ${idx + 1}`}
                      className="w-full h-32 object-contain rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground mb-2">
                  {lang('feedback.uploadDescription')}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {lang('feedback.chooseFile')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">{lang('feedback.type')}</Label>
            <Select value={type} onValueChange={(value: FeedbackData['type']) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder={lang('feedback.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug_report">{lang('feedback.bugReport')}</SelectItem>
                <SelectItem value="improvement_suggestion">{lang('feedback.improvementSuggestion')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{lang('feedback.titleLabel')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'bug_report'
                  ? lang('feedback.bugTitlePlaceholder')
                  : lang('feedback.suggestionTitlePlaceholder')
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{lang('feedback.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'bug_report'
                  ? lang('feedback.bugDescriptionPlaceholder')
                  : lang('feedback.suggestionDescriptionPlaceholder')
              }
              rows={4}
            />
          </div>

          {/* Company context warning */}
          {!companyId && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Cannot determine company context from this page. Please navigate to a company-scoped page before submitting feedback.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {lang('feedback.cancel')}
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting || !companyId}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {lang('feedback.submitting')}
                </>
              ) : (
                lang('feedback.submitFeedback')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}