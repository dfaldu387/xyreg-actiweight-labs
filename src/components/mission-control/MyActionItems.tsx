import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, FileCheck, AlertTriangle, Search, GraduationCap, Shield, Calendar, MessageSquare, CheckCircle2, ArrowUpCircle } from "lucide-react";
import { useMissionControlData } from "@/hooks/useMissionControlData";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { NotificationService } from "@/services/notificationService";
import { ThreadDetailSheet } from "@/components/communications/ThreadDetailSheet";
import { useCommunicationThreads } from "@/hooks/useCommunicationThreads";
import { useAppNotifications } from "@/hooks/useAppNotifications";
import { TrainingDetailModal } from "./TrainingDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

// Parse Supabase timestamp as UTC (Supabase returns UTC without 'Z' suffix)
function parseUTCTimestamp(timestamp: string): Date {
  const raw = timestamp.endsWith('Z') || timestamp.includes('+') || /[+-]\d{2}:\d{2}$/.test(timestamp)
    ? timestamp
    : timestamp + 'Z';
  return new Date(raw);
}

// Format timestamp same as chat MessageTimeline
function formatTimeAgo(timestamp: string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? parseUTCTimestamp(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 3) return `${diffHr}h ago`;
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return format(date, 'MMM d, yyyy');
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: "approval" | "deadline" | "training" | "audit" | "communication" | "system";
  priority: "high" | "medium" | "low";
  dueDate?: Date;
  productName?: string;
  companyName?: string;
  url?: string;
  threadId?: string;
}

interface MyActionItemsProps {
  className?: string;
  productId?: string;
  companyId?: string;
  showDeadlinesOnly?: boolean;
}

const TYPE_FILTERS = ['all', 'approval', 'deadline', 'training', 'audit', 'communication'] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

export function MyActionItems({ className, productId, companyId, showDeadlinesOnly }: MyActionItemsProps) {
  const { actionItems, isLoading, refetch } = useMissionControlData({ companyId });
  const { threads } = useCommunicationThreads({ companyId: companyId || undefined });
  const { notifications: appNotifications } = useAppNotifications(companyId);
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { user } = useAuth();
  const { companyRoles } = useCompanyRole();

  // Merge communication notifications from useAppNotifications (same source as NotificationBell)
  const mergedActionItems = useMemo(() => {
    // Start with non-communication action items only (avoid duplicates from useMissionControlData)
    const items = (actionItems || []).filter(i => i.type !== 'communication');

    // Add each communication and system notification as its own action item
    const existingIds = new Set(items.map(i => i.id));
    (appNotifications || []).forEach((notif) => {
      if (notif.category !== 'communication' && notif.category !== 'system') return;
      const itemId = `app-notif-${notif.id}`;
      if (existingIds.has(itemId)) return;

      if (notif.category === 'communication') {
        items.push({
          id: itemId,
          title: notif.title,
          description: notif.message || 'New message',
          type: 'communication',
          priority: 'medium',
          dueDate: notif.created_at ? parseUTCTimestamp(notif.created_at) : undefined,
          threadId: notif.entity_type === 'communication_thread' ? notif.entity_id : undefined,
        });
      } else if (notif.category === 'system') {
        items.push({
          id: itemId,
          title: notif.title,
          description: notif.message || '',
          type: 'system' as const,
          priority: 'high',
          dueDate: notif.created_at ? parseUTCTimestamp(notif.created_at) : undefined,
          url: notif.action_url || undefined,
        });
      }
    });

    return items;
  }, [actionItems, appNotifications]);
  const currentCompanyName = companyRoles.find((r) => r.companyId === companyId)?.companyName;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TypeFilter>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedTrainingRecordId, setSelectedTrainingRecordId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  // Fetch dismissed items from DB
  useEffect(() => {
    if (!user?.id || !companyId) return;
    supabase
      .from('action_item_dismissals')
      .select('action_item_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (data) setDoneIds(data.map((d) => d.action_item_id));
      });
  }, [user?.id, companyId]);

  // Real-time: refetch action items when new app_notifications arrive
  useEffect(() => {
    if (!user?.id || !companyId) return;

    const channel = supabase
      .channel(`mc-action-items-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, companyId, refetch]);

  const markAsDone = useCallback(async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user?.id || !companyId) return;
    // Optimistic update
    setDoneIds((prev) => [...prev, itemId]);
    const { error } = await supabase.from('action_item_dismissals').insert({
      user_id: user.id,
      action_item_id: itemId,
      company_id: companyId,
    });
    if (error) {
      // Revert on failure
      setDoneIds((prev) => prev.filter((id) => id !== itemId));
    }
  }, [user?.id, companyId]);

  const undoDone = useCallback(async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    // Optimistic update
    setDoneIds((prev) => prev.filter((id) => id !== itemId));
    const { error } = await supabase
      .from('action_item_dismissals')
      .delete()
      .eq('user_id', user.id)
      .eq('action_item_id', itemId);
    if (error) {
      // Revert on failure
      setDoneIds((prev) => [...prev, itemId]);
    }
  }, [user?.id]);

  const selectedThread = selectedThreadId ? threads.find(t => t.id === selectedThreadId) || null : null;

  const filteredItems = useMemo(() => {
    let items = mergedActionItems || [];

    if (showDeadlinesOnly) {
      items = items.filter(item => item.type === "deadline");
    }

    if (activeFilter !== "all") {
      items = items.filter(item => item.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q)
      );
    }

    // Filter out done items unless "Show closed" is checked
    if (!showClosed) {
      items = items.filter(item => !doneIds.includes(item.id));
    }

    return items.sort((a, b) => {
      // Done items go to the bottom when showing closed
      const aDone = doneIds.includes(a.id);
      const bDone = doneIds.includes(b.id);
      if (aDone !== bDone) return aDone ? 1 : -1;

      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      // Sort by time — newest first
      if (a.dueDate && b.dueDate) return b.dueDate.getTime() - a.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [mergedActionItems, searchQuery, activeFilter, showDeadlinesOnly, showClosed, doneIds]);

  const doneCount = (mergedActionItems || []).filter(item => doneIds.includes(item.id)).length;

  const handleItemClick = async (item: ActionItem) => {
    if (item.type === "communication" && item.id.startsWith("comm-")) {
      const notificationId = item.id.replace("comm-", "");

      // Mark notification as read (legacy)
      const notificationService = new NotificationService();
      await notificationService.markAsRead(notificationId);

      // Open thread if we have a threadId
      if (item.threadId) {
        setSelectedThreadId(item.threadId);
      }

      await refetch();
      return;
    }

    // App notification communication items (new system)
    if (item.type === "communication" && item.id.startsWith("app-notif-")) {
      // Open thread if we have a threadId
      if (item.threadId) {
        setSelectedThreadId(item.threadId);
      }

      await refetch();
      return;
    }

    if (item.type === "training" && item.id.startsWith("training-")) {
      const recordId = item.id.replace("training-", "");
      setSelectedTrainingRecordId(recordId);
      return;
    }

    // System notifications (e.g., new release) → navigate to infrastructure
    if (item.type === "system" && currentCompanyName) {
      const url = item.url || `/app/company/${encodeURIComponent(currentCompanyName)}/infrastructure`;
      navigate(url);
      return;
    }

    // Review items → navigate to review page with scroll+highlight+autoopen
    if (item.type === "approval" && currentCompanyName) {
      const docId = item.id
        .replace(/^app-notif-/, '')
        .replace(/^review-phase-/, '')
        .replace(/^review-doc-/, '');
      navigate(`/app/company/${encodeURIComponent(currentCompanyName)}/review?highlight=${docId}&autoopen=true&t=${Date.now()}`);
      return;
    }

    if (item.url) navigate(item.url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval": return <FileCheck className="h-3.5 w-3.5" />;
      case "deadline": return <Clock className="h-3.5 w-3.5" />;
      case "training": return <GraduationCap className="h-3.5 w-3.5" />;
      case "audit": return <Shield className="h-3.5 w-3.5" />;
      case "communication": return <MessageSquare className="h-3.5 w-3.5" />;
      case "system": return <ArrowUpCircle className="h-3.5 w-3.5" />;
      default: return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return lang('missionControl.overdue');
    if (diffDays === 0) return lang('missionControl.dueToday');
    if (diffDays === 1) return lang('missionControl.dueTomorrow');
    return lang('missionControl.dueInDays').replace('{{days}}', String(diffDays));
  };

  const filterLabels: Record<TypeFilter, string> = {
    all: lang('missionControl.widgets.filterAll'),
    approval: lang('missionControl.widgets.filterApprovals'),
    deadline: lang('missionControl.widgets.filterDeadlines'),
    training: lang('missionControl.widgets.filterTraining'),
    audit: lang('missionControl.widgets.filterAudits'),
    communication: lang('missionControl.widgets.filterCommunications'),
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                {lang('missionControl.myActionItems')}
              </CardTitle>
              <CardDescription className="mt-1">
                {lang('missionControl.tasksRequiringAttention')}
              </CardDescription>
            </div>
            {doneCount > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={showClosed}
                  onCheckedChange={(checked) => setShowClosed(checked === true)}
                  className="h-3.5 w-3.5"
                />
                Show closed
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('missionControl.widgets.searchActions')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Type filter chips */}
          {!showDeadlinesOnly && (
            <div className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {filter !== 'all' && getTypeIcon(filter)}
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          )}

          {/* Items list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang('common.loading')}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || activeFilter !== 'all'
                  ? lang('missionControl.widgets.noMatchingActions')
                  : lang('missionControl.widgets.noActionsRequired')
                }
              </div>
            ) : (
              filteredItems.map((item) => {
                const isDone = doneIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${isDone ? 'opacity-50' : ''}`}
                    onClick={() => !isDone && handleItemClick(item)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-muted-foreground">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-[600px]">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/70">
                          {item.dueDate && (
                            <span>{formatTimeAgo(item.dueDate)}</span>
                          )}
                          {item.productName && (
                            <span>{item.productName} • {item.companyName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                        {item.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.dueDate)}
                          </div>
                        )}
                        {isDone ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => undoDone(e, item.id)}
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={(e) => markAsDone(e, item.id)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thread detail sheet for communication items */}
      <ThreadDetailSheet
        thread={selectedThread}
        open={!!selectedThread}
        onOpenChange={(open) => { if (!open) setSelectedThreadId(null); }}
      />

      {/* Training detail modal */}
      <TrainingDetailModal
        open={!!selectedTrainingRecordId}
        onOpenChange={(open) => { if (!open) setSelectedTrainingRecordId(null); }}
        trainingRecordId={selectedTrainingRecordId}
      />
    </>
  );
}
