import React, { useState, useMemo } from "react";
import { Bell, AlertTriangle, FileText, CheckCircle2, Send, Users, MessageSquare, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DirectNameFix } from "@/components/eudamed/DirectNameFix";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppNotifications } from "@/hooks/useAppNotifications";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useThreadSheet } from "@/context/ThreadSheetContext";

// Unified notification shape for rendering
interface UnifiedNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;       // legacy type OR new action
  category?: string;  // new system only
  actor_name?: string | null;
  action_url?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
  source: 'legacy' | 'app';
}

export function NotificationBell() {
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { companyRoles } = useCompanyRole();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const { openThread } = useThreadSheet();

  // Legacy notifications
  const {
    notifications: legacyNotifications,
    unreadCount: legacyUnread,
    markAsRead: legacyMarkAsRead,
    markAllAsRead: legacyMarkAllAsRead,
  } = useNotifications(companyId);

  // New app notifications (realtime)
  const {
    notifications: appNotifications,
    unreadCount: appUnread,
    markAsRead: appMarkAsRead,
    markAllAsRead: appMarkAllAsRead,
  } = useAppNotifications(companyId);

  // Merge and sort both notification sources
  const allNotifications = useMemo<UnifiedNotification[]>(() => {
    const legacy: UnifiedNotification[] = legacyNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
      source: 'legacy' as const,
      entity_id: n.data?.thread_id || null,
    }));

    const app: UnifiedNotification[] = appNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.action,
      category: n.category,
      actor_name: n.actor_name,
      action_url: n.action_url,
      entity_id: n.entity_id,
      is_read: n.is_read,
      created_at: n.created_at,
      source: 'app' as const,
    }));

    return [...legacy, ...app].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [legacyNotifications, appNotifications]);

  const totalUnread = legacyUnread + appUnread;

  const hasNoxMedical = companyRoles.some(role => role.companyName === 'Nox Medical');
  const noxMedicalCompanyId = companyRoles.find(role => role.companyName === 'Nox Medical')?.companyId || '';

  const getNotificationIcon = (notification: UnifiedNotification) => {
    // New app notification categories
    if (notification.source === 'app') {
      switch (notification.category) {
        case 'review':
          return <FileText className="h-4 w-4 text-primary flex-shrink-0" />;
        case 'document':
          return <FileText className="h-4 w-4 text-primary flex-shrink-0" />;
        case 'team':
          return <Users className="h-4 w-4 text-green-600 flex-shrink-0" />;
        case 'communication':
          return <MessageSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />;
        case 'system':
          return <ArrowUpCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />;
        default:
          return <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
      }
    }

    // Legacy notification types
    switch (notification.type) {
      case 'document_assigned':
        return <FileText className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'group_create':
      case 'group_updated':
      case 'group_member_added':
        return <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  // Derive company name for navigation
  const currentCompanyName = companyRoles.find(r => r.companyId === companyId)?.companyName;

  const handleNotificationClick = (notification: UnifiedNotification) => {
    if (!notification.is_read) {
      if (notification.source === 'app') {
        appMarkAsRead(notification.id);
      } else {
        legacyMarkAsRead(notification.id);
      }
    }

    // Navigate based on notification category
    setIsDropdownOpen(false);

    // Communication notifications — open thread sheet
    const isCommunication =
      (notification.source === 'app' && notification.category === 'communication') ||
      (notification.source === 'legacy' && notification.type === 'communication');

    if (isCommunication) {
      // entity_id for app notifications, or thread_id from legacy notification data
      const threadId = notification.entity_id || (notification as any).data?.thread_id;
      if (threadId) {
        openThread(threadId);
        return;
      }
    }

    if (notification.source === 'app' && notification.category === 'review' && currentCompanyName) {
      const entityId = notification.entity_id || '';
      // Add timestamp to force re-trigger when already on the review page
      const params = entityId ? `?highlight=${entityId}&t=${Date.now()}` : '';
      navigate(`/app/company/${encodeURIComponent(currentCompanyName)}/review${params}`);
    } else if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.source === 'app' && (notification as any).category === 'system' && currentCompanyName) {
      // Fallback for system notifications (e.g., new_release) without action_url
      navigate(`/app/company/${encodeURIComponent(currentCompanyName)}/infrastructure`);
    }
  };

  const handleMarkAllAsRead = () => {
    legacyMarkAllAsRead();
    appMarkAllAsRead();
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} modal={false} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {!isDropdownOpen && totalUnread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[25rem]" align="end" forceMount>
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Notifications</h3>
              {totalUnread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllAsRead();
                  }}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              You have {totalUnread} unread notification{totalUnread !== 1 ? 's' : ''}
            </p>

            {hasNoxMedical && (
              <>
                <DropdownMenuItem
                  className="flex-col items-start p-3 cursor-pointer bg-orange-50 dark:bg-orange-950/20"
                  onClick={() => setShowUrgentModal(true)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <div className="font-medium text-sm flex-1">URGENT: Product Name Issue Detected</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Now</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <div className="max-h-96 overflow-y-auto overflow-x-hidden">
              {allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p>No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                allNotifications.map((notification, index) => (
                  <div key={`${notification.source}-${notification.id}`}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                    className={`flex-col items-start p-3 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="border p-2 rounded-lg flex-shrink-0">{getNotificationIcon(notification)}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>{notification.title}</div>
                        {notification.message && (
                          <div className={`text-xs mt-0.5 line-clamp-2 ${notification.is_read ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>{notification.message}</div>
                        )}
                        <div className={`text-xs mt-1 text-right ${notification.is_read ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  </div>
                ))
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showUrgentModal} onOpenChange={setShowUrgentModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              URGENT: Product Name Issue Detected
            </DialogTitle>
            <DialogDescription className="text-orange-700">
              Products are using trade names instead of EUDAMED device names. This needs immediate correction.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <DirectNameFix
              companyId={noxMedicalCompanyId}
              companyName="Nox Medical"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
