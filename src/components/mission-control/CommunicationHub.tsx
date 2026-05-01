import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Bell, Plus, Maximize2, Minimize2, Search, UsersRound, UserPen, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/useTranslation";
import { ThreadCardClickable } from "@/components/communications/ThreadCardClickable";
import { ThreadDetailSheet } from "@/components/communications/ThreadDetailSheet";
import { NewCommunicationDialog } from "@/components/communications/NewCommunicationDialog";
import { CommunicationThread } from "@/types/communications";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { useCommunicationThreads } from "@/hooks/useCommunicationThreads";
import { useCustomerFeatureFlag } from "@/hooks/useCustomerFeatureFlag";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyUser {
  id: string;
  name: string;
  email: string;
}

interface CommunicationHubProps {
  scope: 'multi-company' | 'company' | 'product' | 'reviewer';
  companyId?: string;
  productId?: string;
}

export function CommunicationHub({ scope, companyId, productId }: CommunicationHubProps) {
  const communicationsEnabled = useCustomerFeatureFlag('communications-threads');
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedThread, setSelectedThread] = useState<CommunicationThread | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const { lang } = useTranslation();

  const { threads, isLoading, error, unreadCount, activeCount, myThreadsCount, createThread } = useCommunicationThreads({
    companyId,
    status: isExpanded ? activeTab : undefined,
    searchQuery: isExpanded ? searchQuery : undefined,
  });

  // Fetch company users for recipient dropdown
  useEffect(() => {
    if (!companyId) return;
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select(`
            user_id,
            access_level,
            user_profiles!inner(
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('company_id', companyId);

        if (error) throw error;
        const users: CompanyUser[] = (data || []).map((item: any) => {
          const profile = item.user_profiles;
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          return {
            id: profile.id,
            name: fullName || profile.email,
            email: profile.email,
          };
        });
        setCompanyUsers(users);
      } catch (err) {
        console.error('Error fetching company users:', err);
      }
    };
    fetchUsers();
  }, [companyId]);

  const getScopeTitle = () => {
    switch (scope) {
      case 'multi-company': return lang('missionControl.executiveCommunications');
      case 'company': return lang('missionControl.companyCommunications');
      case 'product': return lang('missionControl.productTeamCommunications');
      case 'reviewer': return lang('missionControl.reviewCommunications');
      default: return lang('missionControl.communications');
    }
  };

  const handleSendQuickMessage = async () => {
    if (!newMessage.trim() || !selectedRecipient || !companyId) return;
    try {
      await createThread.mutateAsync({
        title: `Quick Message: ${newMessage.substring(0, 50)}`,
        companyId,
        participantUserIds: [selectedRecipient],
        initialMessage: newMessage,
        threadType: 'quick',
      });
      setNewMessage('');
      setSelectedRecipient('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Recent threads for collapsed view (max 5)
  const recentThreads = threads.slice(0, 15);

  const handleCloseThread = async (thread: CommunicationThread) => {
    try {
      const { error } = await supabase
        .from('communication_threads')
        .update({ status: 'Closed' })
        .eq('id', thread.id);
      if (error) throw error;
      toast.success('Thread closed', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await supabase
              .from('communication_threads')
              .update({ status: 'Active' })
              .eq('id', thread.id);
          },
        },
      });
    } catch (err) {
      console.error('Error closing thread:', err);
      toast.error('Failed to close thread');
    }
  };

  if (!communicationsEnabled) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {getScopeTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">{lang('missionControl.unableToLoadCommunications')}</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── EXPANDED VIEW ──
  if (isExpanded) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {getScopeTitle()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <ErrorBoundary level="component">
                  <NewCommunicationDialog companyId={companyId}>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      {lang('communications.newCommunication')}
                    </Button>
                  </NewCommunicationDialog>
                </ErrorBoundary>
                <Button size="sm" variant="ghost" onClick={() => setIsExpanded(false)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{unreadCount}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{lang('missionControl.unreadMessages')}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-emerald-500" />
                  <p className="text-lg font-bold">{companyUsers.length}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{lang('missionControl.users')}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  <p className="text-lg font-bold">{activeCount}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{lang('missionControl.activeThreads')}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserPen className="h-5 w-5 text-blue-500" />
                  <p className="text-lg font-bold">{myThreadsCount}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{lang('missionControl.myThreads')}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{lang('communications.tabs.all')}</TabsTrigger>
                <TabsTrigger value="active">{lang('communications.tabs.active')}</TabsTrigger>
                <TabsTrigger value="awaiting-response">{lang('communications.tabs.awaitingResponse')}</TabsTrigger>
                <TabsTrigger value="closed">{lang('communications.tabs.closed')}</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={lang('communications.search.placeholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {(searchQuery || activeTab !== 'all') && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
                </span>
              )}
            </div>

            {/* Thread list */}
            {threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{lang('communications.emptyState.noThreads.title')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <ThreadCardClickable
                    key={thread.id}
                    thread={thread}
                    onClick={setSelectedThread}
                    onArchive={handleCloseThread}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ThreadDetailSheet
          thread={selectedThread}
          open={!!selectedThread}
          onOpenChange={(open) => { if (!open) setSelectedThread(null); }}
        />
      </div>
    );
  }

  // ── COLLAPSED VIEW ──
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {getScopeTitle()}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setIsExpanded(true)} title="Expand communications">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <button
              type="button"
              className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => { setIsExpanded(true); setActiveTab('all'); }}
              title="View unread messages"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{lang('missionControl.unreadMessages')}</p>
            </button>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <UsersRound className="h-6 w-6 text-emerald-500" />
                <p className="text-2xl font-bold">{companyUsers.length}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{lang('missionControl.users')}</p>
            </div>
            <button
              type="button"
              className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => { setIsExpanded(true); setActiveTab('active'); }}
              title="View active threads"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-amber-500" />
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{lang('missionControl.activeThreads')}</p>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => { setIsExpanded(true); setActiveTab('all'); }}
              title="View my threads"
            >
              <div className="flex items-center gap-2">
                <UserPen className="h-6 w-6 text-blue-500" />
                <p className="text-2xl font-bold">{myThreadsCount}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{lang('missionControl.myThreads')}</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <span>{lang('missionControl.recentMessages')}</span>
                <span className="text-xs font-normal text-muted-foreground mt-0.5">
                  Structured threads — subject, participants, history
                </span>
              </div>
              <ErrorBoundary level="component">
                <NewCommunicationDialog companyId={companyId}>
                  <Button size="sm" variant="outline" title="Start a structured, multi-recipient thread">
                    <Plus className="h-4 w-4 mr-1" />
                    New Thread
                  </Button>
                </NewCommunicationDialog>
              </ErrorBoundary>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentThreads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang('missionControl.noRecentCommunications')}
              </div>
            ) : (
              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-3">
                  {recentThreads.map((thread) => (
                    <ThreadCardClickable
                      key={thread.id}
                      thread={thread}
                      onClick={setSelectedThread}
                      onArchive={handleCloseThread}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {lang('missionControl.quickMessage')}
              </span>
              <span className="text-xs font-normal text-muted-foreground mt-0.5">
                Send a fast 1:1 note — no thread title required
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{lang('missionControl.to')}</label>
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={lang('missionControl.selectRecipient')} />
                </SelectTrigger>
                <SelectContent>
                  {companyUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{lang('missionControl.message')}</label>
              <Textarea
                placeholder={lang('missionControl.typeMessageHere')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <Button
              onClick={handleSendQuickMessage}
              disabled={!newMessage.trim() || !selectedRecipient}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {lang('missionControl.sendMessage')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Thread detail sheet */}
      <ThreadDetailSheet
        thread={selectedThread}
        open={!!selectedThread}
        onOpenChange={(open) => { if (!open) setSelectedThread(null); }}
      />
    </div>
  );
}
