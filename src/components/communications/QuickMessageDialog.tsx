import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useCommunicationThreads } from "@/hooks/useCommunicationThreads";

interface QuickMessageUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string | null;
}

interface QuickMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: QuickMessageUser;
  companyId: string;
}

export function QuickMessageDialog({ open, onOpenChange, recipient, companyId }: QuickMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { createThread } = useCommunicationThreads({ companyId });

  const recipientName = [recipient.first_name, recipient.last_name].filter(Boolean).join(" ") || recipient.email;

  const getInitials = () => {
    const first = recipient.first_name?.charAt(0) || "";
    const last = recipient.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || recipient.email.charAt(0).toUpperCase();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await createThread.mutateAsync({
        title: `Message to ${recipientName}`,
        companyId,
        participantUserIds: [recipient.id],
        initialMessage: message.trim(),
        threadType: "direct_message",
      });
      toast.success(`Message sent to ${recipientName}`);
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Message</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipient.avatar_url || undefined} alt={recipientName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{recipientName}</p>
            <p className="text-xs text-muted-foreground">{recipient.email}</p>
          </div>
        </div>
        <Textarea
          placeholder={`Write a message to ${recipientName}...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSend();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!message.trim() || isSending}>
            <Send className="h-4 w-4 mr-1" />
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
