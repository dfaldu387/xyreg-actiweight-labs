import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquareText, X, ChevronRight, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeBotPanel } from "./KnowledgeBotPanel";
import { useTranslation } from "@/hooks/useTranslation";

interface KnowledgeBotWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

export function KnowledgeBotWidget({ companyId, onRemove }: KnowledgeBotWidgetProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { lang } = useTranslation();

  const { data: entryCount = 0 } = useQuery({
    queryKey: ["slack-knowledge-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase
        .from("slack_knowledge_entries")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      return count || 0;
    },
    enabled: !!companyId,
  });

  const cardBody = (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ask questions about your Slack conversations. {entryCount} file{entryCount !== 1 ? "s" : ""} ingested.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setPanelOpen(true)}
      >
        <MessageSquareText className="h-4 w-4 mr-2" />
        Open Knowledge Bot
      </Button>
    </div>
  );

  return (
    <>
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Knowledge Bot
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>{cardBody}</CardContent>
      </Card>

      <KnowledgeBotPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        companyId={companyId}
      />
    </>
  );
}
