import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, FileText, CheckCircle, AlertCircle, UserPlus, ArrowRight } from "lucide-react";
import { useMissionControlData } from "@/hooks/useMissionControlData";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface ActivityItem {
  id: string;
  type: "status_change" | "document_upload" | "task_completion" | "user_added" | "milestone";
  title: string;
  description: string;
  productName?: string;
  companyName?: string;
  timestamp: Date;
  user?: string;
  url?: string;
}

interface ActivityStreamProps {
  productId?: string;
  companyId?: string;
}

export function ActivityStream({ productId, companyId }: ActivityStreamProps) {
  const { activityItems, isLoading } = useMissionControlData({ companyId });
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "status_change": return <AlertCircle className="h-4 w-4" />;
      case "document_upload": return <FileText className="h-4 w-4" />;
      case "task_completion": return <CheckCircle className="h-4 w-4" />;
      case "user_added": return <UserPlus className="h-4 w-4" />;
      case "milestone": return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "status_change": return "bg-warning text-warning-foreground";
      case "document_upload": return "bg-primary text-primary-foreground";
      case "task_completion": return "bg-success text-success-foreground";
      case "user_added": return "bg-secondary text-secondary-foreground";
      case "milestone": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleActivityClick = (item: ActivityItem) => {
    if (item.url) {
      navigate(item.url);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {lang('missionControl.activityStream')}
        </CardTitle>
        <CardDescription>
          {lang('missionControl.recentActivityAcross')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {lang('missionControl.loadingActivity')}
          </div>
        ) : !activityItems || activityItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {lang('missionControl.noRecentActivity')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto space-y-4">
            {activityItems.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => handleActivityClick(item)}
              >
                <Badge className={`${getActivityColor(item.type)} flex items-center gap-1 px-2 py-1`}>
                  {getActivityIcon(item.type)}
                </Badge>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {item.productName && (
                      <>
                        <span>{item.productName}</span>
                        {item.companyName && (
                          <>
                            <span>•</span>
                            <span>{item.companyName}</span>
                          </>
                        )}
                        <span>•</span>
                      </>
                    )}
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    {item.user && (
                      <>
                        <span>•</span>
                        <span>{lang('missionControl.by')} {item.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
            {/* {activityItems.length > 8 && (
              <div className="text-center pt-4">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All Activity
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )} */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}