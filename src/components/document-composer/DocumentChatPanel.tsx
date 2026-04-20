import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Send, X, GripVertical, Users, Loader2, UserPlus, Search, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useDocumentThread } from '@/hooks/useDocumentThread';
import { useDocumentChatMembers, ChatMember, ChatRole } from '@/hooks/useDocumentChatMembers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTypingIndicator } from '@/hooks/useCommunicationThreads';
import { formatDistanceToNow } from 'date-fns';

interface DocumentChatPanelProps {
  documentId?: string | null;
  companyId?: string;
  documentName?: string;
  onClose?: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  /** When true, renders for embedding in a tabbed panel — no own header, resize, or border. */
  embedded?: boolean;
}

export function DocumentChatPanel({
  documentId,
  companyId,
  documentName,
  onClose,
  width,
  onWidthChange,
  embedded = false,
}: DocumentChatPanelProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  console.log('[DocumentChatPanel] Props | documentId:', documentId, '| companyId:', companyId, '| documentName:', documentName);

  const { threadId, messages, isLoading, isSending, sendMessage } = useDocumentThread({
    documentId,
    companyId,
    documentName,
    enabled: !!documentId,
  });

  const {
    memberIds, members, companyUsers,
    isOwner, canMessage, canInvite,
    currentUserRole, addUserToChat, changeUserRole, removeUserFromChat,
  } = useDocumentChatMembers({
    documentId,
    companyId,
    documentName,
    enabled: true,
  });

  // Supabase Realtime typing indicator (broadcast)
  const { typingUsers, sendTyping } = useTypingIndicator(threadId || null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onWidthChange) return;
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width ?? 600;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      // Handle is on left edge — dragging right shrinks, left grows
      const newWidth = Math.max(280, Math.min(800, startWidth - (ev.clientX - startX)));
      onWidthChange?.(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, onWidthChange]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentUserName = useMemo(() => {
    if (!user) return 'You';
    const name = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ');
    return name || user.email?.split('@')[0] || 'You';
  }, [user]);

  const orderedMembers = useMemo(() => {
    if (!user?.id) return members;
    const you = members.find((m) => m.user_id === user.id);
    if (!you) return members;
    return [you, ...members.filter((m) => m.user_id !== user.id)];
  }, [members, user?.id]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const currentUserMember = members.find((m) => m.user_id === user?.id);

  return (
    <div
      className={cn('bg-background flex flex-col shrink-0 relative', !embedded && 'border-l')}
      style={embedded ? { width: '100%', height: '100%' } : { width: `${width ?? 600}px` }}
    >
      {/* Resize handle on LEFT edge — only when not embedded */}
      {!embedded && (
        <div
          className="absolute top-0 -left-[8px] w-4 h-full cursor-col-resize z-10 group flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="flex h-6 w-4 items-center justify-center rounded-sm border bg-border shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Header — only when not embedded */}
      {!embedded && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ background: '#E1F5EE' }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: '#0F6E56' }} />
            <span className="text-sm font-medium" style={{ color: '#0F6E56' }}>Team Chat</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Members bar + Add user trigger */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/20 min-h-[36px]">
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {orderedMembers.length > 0 ? (
            <>
              <span className="text-[10px] text-muted-foreground shrink-0 mr-1">In chat:</span>
              {(() => {
                const maxAvatars = 2;
                const visible = orderedMembers.slice(0, maxAvatars);
                const extraCount = Math.max(0, orderedMembers.length - maxAvatars);

                return (
                  <>
                    {visible.map((m, idx) => (
                      <Avatar
                        key={m.user_id}
                        className={cn('w-5 h-5 shrink-0', idx > 0 && '-ml-2')}
                        title={m.name}
                      >
                        <AvatarFallback
                          className="text-[8px] font-medium text-white"
                          style={{ background: m.user_id === user?.id ? '#0F6E56' : '#1D9E75' }}
                        >
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}

                    {extraCount > 0 && (
                      <Avatar
                        className={cn('w-5 h-5 shrink-0', visible.length > 0 && '-ml-2')}
                        title={`${extraCount} more`}
                      >
                        <AvatarFallback className="text-[8px] font-medium text-white" style={{ background: '#1D9E75' }}>
                          +{extraCount}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">No participants yet</span>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'h-6 px-2 rounded flex items-center gap-1 text-[11px] font-medium transition-colors shrink-0',
            canInvite ? 'hover:bg-muted cursor-pointer' : 'opacity-40 cursor-not-allowed'
          )}
          style={{ color: '#0F6E56' }}
          title={canInvite ? 'Add people to this conversation' : 'Only the owner can add people'}
          disabled={!canInvite}
          onClick={() => canInvite && setAddUserOpen(true)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Share / Add People Dialog — Google Docs style */}
      <Dialog open={addUserOpen} onOpenChange={(open) => { setAddUserOpen(open); if (!open) setUserSearch(''); }}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-lg font-normal text-foreground">
              Share "{documentName || 'Document'}"
            </h2>
          </div>

          {/* Search / Add people input */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Add people..."
                className="h-12 text-sm rounded-lg border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-3"
                autoFocus
              />
            </div>

            {/* Search results dropdown */}
            {userSearch.trim() && (
              <div className="mt-1 border rounded-lg shadow-lg bg-background max-h-[180px] overflow-y-auto">
                {companyUsers
                  .filter((u) => {
                    const q = userSearch.toLowerCase();
                    return u.name.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q) ?? false);
                  })
                  .filter((u) => u.user_id !== user?.id)
                  .map((cu) => {
                    const alreadyInChat = memberIds.includes(cu.user_id);
                    return (
                      <button
                        key={cu.user_id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors',
                          alreadyInChat && 'opacity-40 cursor-default'
                        )}
                        disabled={alreadyInChat}
                        onClick={async () => {
                          await addUserToChat(cu);
                          setUserSearch('');
                        }}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs font-medium text-white" style={{ background: '#1D9E75' }}>
                            {getInitials(cu.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cu.name}</p>
                          {cu.email && <p className="text-xs text-muted-foreground truncate">{cu.email}</p>}
                        </div>
                        {alreadyInChat && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                      </button>
                    );
                  })}
                {companyUsers.filter((u) => {
                  const q = userSearch.toLowerCase();
                  return (u.name.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q) ?? false)) && u.user_id !== user?.id;
                }).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No matching users</p>
                )}
              </div>
            )}
          </div>

          {/* People with access */}
          <div className="px-6 pb-2">
            <p className="text-sm font-medium text-foreground mb-3">People with access</p>
            <div className="space-y-1 max-h-[220px] overflow-y-auto">
              {/* Current user */}
              <div className="flex items-center gap-3 py-2 px-1 rounded-lg">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback
                    className="text-xs font-medium text-white"
                    style={{ background: currentUserRole === 'owner' ? '#0F6E56' : '#1D9E75' }}
                  >
                    {getInitials(currentUserName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentUserName} (you)</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 capitalize">
                  {currentUserRole === 'editor' ? 'Reviewer' : currentUserRole}
                </span>
              </div>

              {/* Other members */}
              {members
                .filter((m) => m.user_id !== user?.id)
                .map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 py-2 px-1 rounded-lg">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback
                        className="text-xs font-medium text-white"
                        style={{ background: m.role === 'owner' ? '#0F6E56' : '#1D9E75' }}
                      >
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                    </div>
                    {/* Owner sees role dropdown for non-owner members; others see static label */}
                    {isOwner && m.role !== 'owner' ? (
                      <div className="flex items-center gap-1">
                        <Select
                          value={m.role}
                          onValueChange={(val) => changeUserRole(m.user_id, val as ChatRole)}
                        >
                          <SelectTrigger className="h-7 w-[100px] text-xs border-0 bg-transparent hover:bg-muted">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Reviewer</SelectItem>
                            <SelectItem value="collaborator">Collaborator</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeUserFromChat(m.user_id)}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title={`Remove ${m.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0 capitalize">
                        {m.role === 'editor' ? 'Reviewer' : m.role}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Footer — Done button */}
          <div className="flex justify-end px-6 py-4 border-t mt-2">
            <Button
              onClick={() => { setAddUserOpen(false); setUserSearch(''); }}
              className="rounded-full px-6"
              style={{ background: '#0F6E56' }}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" style={{ color: '#1D9E75' }} />
            <p className="text-sm">Loading chat...</p>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: '#1D9E75', opacity: 0.5 }} />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation about this document</p>
          </div>
        )}

        {messages.map((msg: any) => {
          const isOwn = msg.sender_user_id === user?.id;
          const name = isOwn ? currentUserName : (msg.sender_name || 'Unknown');
          return (
            <div key={msg.id} className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
              <div className={cn('flex gap-2 max-w-[90%]', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                <Avatar className="w-6 h-6 shrink-0 mt-1">
                  <AvatarFallback
                    className="text-[10px] font-medium text-white"
                    style={{ background: isOwn ? '#0F6E56' : '#1D9E75' }}
                  >
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
              <div className={cn('text-[10px] text-muted-foreground px-1', isOwn ? 'text-right mr-8' : 'ml-8')}>
                {(() => {
                  const diff = Date.now() - new Date(msg.created_at).getTime();
                  return diff < 60000 ? 'just now' : formatDistanceToNow(new Date(msg.created_at), { addSuffix: true });
                })()}
                <span> &middot; {name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        {typingUsers.length > 0 && (
          <p className="text-[10px] text-muted-foreground mb-1 px-1">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(', ')} are typing...`}
          </p>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={!documentId ? 'Save the document first to chat' : canMessage ? 'Message...' : 'You need Editor role to send messages'}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isLoading || !documentId || !threadId || !canMessage}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isSending || !documentId || !threadId || !canMessage}
            className="h-10 w-10 p-0 shrink-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Real-time chat for this document
        </p>
      </div>
    </div>
  );
}
