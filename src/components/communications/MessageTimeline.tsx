
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Download, X } from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';
import { CommunicationMessage } from '@/types/communications';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';

interface MessageTimelineProps {
  messages: CommunicationMessage[];
  threadId?: string;
  onSendMessage?: (content: string, files?: File[]) => Promise<void>;
  typingUsers?: string[];
  onTyping?: () => void;
  disabled?: boolean;
}

interface PendingAttachment {
  id: string;
  file: File;
  preview?: string;
}

export function MessageTimeline({ messages, threadId, onSendMessage, typingUsers = [], onTyping, disabled = false }: MessageTimelineProps) {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSenderName = (message: CommunicationMessage) => {
    if (message.sender_profile) {
      const name = [message.sender_profile.first_name, message.sender_profile.last_name].filter(Boolean).join(' ');
      return name || message.sender_profile.email;
    }
    return 'Unknown';
  };

  const getSenderInitials = (message: CommunicationMessage) => {
    const name = getSenderName(message);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const parseTimestamp = (timestamp: string): Date => {
    const raw = timestamp.endsWith('Z') || timestamp.includes('+') || /[+-]\d{2}:\d{2}$/.test(timestamp)
      ? timestamp
      : timestamp + 'Z';
    return new Date(raw);
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return lang('communications.messageTimeline.unknownTime');
    try {
      const date = parseTimestamp(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);

      // Recent messages: relative time
      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHr < 3) return `${diffHr}h ago`;

      // Today: show time
      if (isToday(date)) return format(date, 'h:mm a');
      // Yesterday
      if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
      // Older
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return lang('communications.messageTimeline.unknownTime');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: lang('communications.messageTimeline.toast.fileTooLarge'),
          description: lang('communications.messageTimeline.toast.fileTooLargeDesc'),
          variant: "destructive"
        });
        return;
      }

      const newAttachment: PendingAttachment = {
        id: Math.random().toString(36).substr(2, 9),
        file
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        newAttachment.preview = e.target?.result as string;
        setPendingAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) {
      toast({
        title: lang('communications.messageTimeline.toast.emptyMessage'),
        description: lang('communications.messageTimeline.toast.emptyMessageDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      if (onSendMessage) {
        const files = pendingAttachments.length > 0 ? pendingAttachments.map(a => a.file) : undefined;
        await onSendMessage(newMessage, files);
      }

      toast({
        title: lang('communications.messageTimeline.toast.messageSent'),
        description: lang('communications.messageTimeline.toast.messageSentDesc'),
      });

      setNewMessage('');
      setPendingAttachments([]);
    } catch (error) {
      toast({
        title: lang('communications.messageTimeline.toast.errorSending'),
        description: lang('communications.messageTimeline.toast.errorSendingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">{lang('communications.messageTimeline.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang('communications.messageTimeline.noMessages')}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMe = user?.id === message.sender_user_id;

                  return (
                    <div key={message.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className={isMe ? "bg-primary text-primary-foreground text-xs" : "bg-muted text-xs"}>
                          {getSenderInitials(message)}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`max-w-[75%] w-fit ${isMe ? 'items-end ml-auto' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium text-xs">
                            {isMe ? 'You' : getSenderName(message)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(message.created_at)}
                          </span>
                        </div>

                        <div className={`rounded-2xl px-4 py-2.5 w-fit ${
                          isMe
                            ? 'bg-primary/15 border border-primary/25 rounded-tr-sm ml-auto'
                            : 'bg-muted/50 border rounded-tl-sm'
                        }`}>
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}

                          {/* Attachment image previews */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className={message.content ? `mt-2 pt-2 border-t ${isMe ? 'border-primary/20' : 'border-border/20'}` : ""}>
                              <div className="flex flex-wrap gap-2">
                                {message.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    type="button"
                                    onClick={() => setPreviewUrl(attachment.signed_url || null)}
                                    className="group relative block cursor-pointer"
                                  >
                                    <img
                                      src={attachment.signed_url || ''}
                                      alt={attachment.file_name}
                                      className="h-20 w-20 object-cover rounded-lg border border-border"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="shrink-0 px-4 py-1.5">
          <p className="text-xs text-muted-foreground animate-pulse">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(', ')} are typing...`}
          </p>
        </div>
      )}

      {/* Sticky compose area */}
      {disabled ? (
        <div className="shrink-0 border-t bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">This thread is archived and read-only.</p>
        </div>
      ) : (
        <div className="shrink-0 border-t bg-background p-4">
          <div className="space-y-3">
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              placeholder={lang('communications.messageTimeline.compose.placeholder')}
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); onTyping?.(); }}
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                  {lang('communications.messageTimeline.compose.attachFiles')}
                </Button>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG only. Max 10MB
                </span>
              </div>

              <Button
                className="gap-2"
                onClick={handleSendMessage}
                disabled={isLoading || (!newMessage.trim() && pendingAttachments.length === 0)}
              >
                <Send className="h-4 w-4" />
                {isLoading ? lang('communications.messageTimeline.compose.sending') : lang('communications.messageTimeline.compose.send')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen image preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 text-white hover:text-gray-300 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      )}
    </div>
  );
}
