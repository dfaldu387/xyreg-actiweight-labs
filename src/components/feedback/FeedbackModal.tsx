import React, { useState, useRef, useEffect } from 'react';
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
import { Upload, X, Camera, Video, Square, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useTranslation } from '@/hooks/useTranslation';

const MAX_RECORDING_SECONDS = 90;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  screenshot: string;
  onSubmit: (feedback: FeedbackData) => Promise<{ success: boolean, message: string }>;
  onCaptureScreen?: () => void;
  onClearScreenshot?: () => void;
  isCapturing?: boolean;
  // Notifies parent so it can hide the dialog while recording.
  onRecordingChange?: (recording: boolean) => void;
}

export interface FeedbackVideo {
  // Object URL for preview (revoked on cleanup) and blob for upload
  previewUrl: string;
  blob: Blob;
  filename: string;
  source: 'upload' | 'recording';
}

export interface FeedbackData {
  type: 'bug_report' | 'improvement_suggestion';
  title: string;
  description: string;
  screenshot: string;
  screenshots: string[];
  videos: FeedbackVideo[];
  company_id: string;
}

export function FeedbackModal({ open, onClose, screenshot, onSubmit, onCaptureScreen, onClearScreenshot, isCapturing = false, onRecordingChange }: FeedbackModalProps) {
  const { lang } = useTranslation();
  const [type, setType] = useState<FeedbackData['type']>('bug_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<FeedbackVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const allImages = [...(screenshot ? [screenshot] : []), ...uploadedImages];
  const companyId = useCompanyId();

  // Free object URLs when component unmounts or videos array shrinks.
  useEffect(() => {
    return () => {
      videos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
      stopRecordingStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecordingStream = () => {
    if (recordingStreamRef.current) {
      try {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch { /* track may already be stopped */ }
      const extra = (recordingStreamRef.current as any)._extraCleanup;
      if (typeof extra === 'function') {
        try { extra(); } catch { /* noop */ }
      }
      recordingStreamRef.current = null;
    }
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const startScreenRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      toast.error('Screen recording is not supported in this browser.');
      return;
    }
    try {
      // preferCurrentTab makes Chrome auto-share the current tab without the
      // source picker. Trade-off: Chrome shows a blue "Sharing this tab"
      // header at the top during recording (its required user-consent UI).
      const displayMediaOptions: any = {
        video: { displaySurface: 'browser', frameRate: 15 },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        systemAudio: 'include',
      };
      const displayStream: MediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // Try to also capture the microphone so the user can narrate.
      // Fail open: if mic permission is denied, we still record screen + system audio.
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.warn('Mic capture skipped:', micErr);
        toast.message('Recording without microphone (permission denied).');
      }

      // Merge mic + display audio into a single stream for the recorder.
      const tracks: MediaStreamTrack[] = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...(micStream ? micStream.getAudioTracks() : []),
      ];
      const stream = new MediaStream(tracks);

      // Keep both source streams on the ref so cleanup stops them all.
      const cleanupStreams = () => {
        displayStream.getTracks().forEach((t) => t.stop());
        if (micStream) micStream.getTracks().forEach((t) => t.stop());
      };
      recordingStreamRef.current = {
        getTracks: () => stream.getTracks().concat(
          displayStream.getTracks(),
          micStream ? micStream.getTracks() : []
        ),
      } as MediaStream;
      // Override stop to clean up both source streams.
      (recordingStreamRef.current as any)._extraCleanup = cleanupStreams;
      recordedChunksRef.current = [];

      const mimeCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || 'video/webm',
        });
        if (blob.size > MAX_VIDEO_BYTES) {
          toast.error('Recording exceeded 100 MB and was discarded.');
          // Note: bucket-level limit also enforces this server-side
        } else if (blob.size > 0) {
          const filename = `feedback-recording-${Date.now()}.webm`;
          setVideos((prev) => [
            ...prev,
            {
              previewUrl: URL.createObjectURL(blob),
              blob,
              filename,
              source: 'recording',
            },
          ]);
        }
        recordedChunksRef.current = [];
        stopRecordingStream();
        setIsRecording(false);
        setRecordingSeconds(0);
        // Tell parent so it can reopen the dialog with the new video attached.
        onRecordingChange?.(false);
      };

      // Auto-stop if user revokes screen-share permission via browser UI.
      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorder.state === 'recording') recorder.stop();
      });

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
      // Tell parent so it can hide the dialog and show the floating Stop pill.
      onRecordingChange?.(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_RECORDING_SECONDS && recorder.state === 'recording') {
            recorder.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      // User cancelled the picker is the most common path; don't toast for that.
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        console.error('Screen recording failed:', err);
        toast.error(err?.message || 'Failed to start screen recording.');
      }
      stopRecordingStream();
      setIsRecording(false);
    }
  };


  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  // console.log('companyId', companyId);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nextVideos: FeedbackVideo[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setUploadedImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_BYTES) {
          toast.error(`${file.name} exceeds 100 MB limit.`);
          return;
        }
        nextVideos.push({
          previewUrl: URL.createObjectURL(file),
          blob: file,
          filename: file.name,
          source: 'upload',
        });
      } else {
        toast.error(`${file.name} is not an image or video.`);
      }
    });
    if (nextVideos.length) setVideos((prev) => [...prev, ...nextVideos]);
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
        videos,
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
      videos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
      setVideos([]);
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
          {/* Attachments — screenshots + videos in one section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label>Screenshot &amp; Video</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {onCaptureScreen && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCaptureScreen}
                    disabled={isCapturing || isRecording}
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
                {isRecording ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <Circle className="h-2.5 w-2.5 fill-red-600 text-red-600 animate-pulse" />
                      {formatRecordingTime(recordingSeconds)}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopScreenRecording}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startScreenRecording}
                    disabled={isCapturing}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Record screen
                  </Button>
                )}
              </div>
            </div>

            {(allImages.length > 0 || videos.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {allImages.map((img, idx) => (
                  <div key={`img-${idx}`} className="border rounded-lg p-2 bg-muted relative">
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
                {videos.map((v, idx) => (
                  <div key={`vid-${v.filename}-${idx}`} className="border rounded-lg p-2 bg-muted relative">
                    <video
                      src={v.previewUrl}
                      controls
                      className="w-full h-32 object-contain rounded bg-black"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80%]">
                        {v.source === 'recording' ? 'Screen recording' : v.filename}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(v.blob.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveVideo(idx)}
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
                <div className="text-sm text-muted-foreground mb-3">
                  Upload screenshots or a video to help describe the issue
                  <br />
                  <span className="text-xs">
                    Images: PNG, JPG, GIF, WEBP &nbsp;·&nbsp; Videos: WebM, MP4, MOV (max {MAX_RECORDING_SECONDS}s, 100 MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording}
                >
                  {lang('feedback.chooseFile')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
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