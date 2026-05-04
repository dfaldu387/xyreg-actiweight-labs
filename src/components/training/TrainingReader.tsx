import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Pause, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStartReading, useHeartbeatRead, useCompleteReading } from "@/hooks/useTrainingPhase";

interface Props {
  recordId: string;
  moduleId: string;
  moduleName: string;
  sourceDocumentId: string | null;
  minimumReadSeconds: number;
  initialReadSeconds: number;
  requiresQuiz: boolean;
  onComplete: () => void;
}

const HEARTBEAT_MS = 10_000;
const IDLE_MS = 30_000;

export function TrainingReader({
  recordId,
  moduleId,
  moduleName,
  sourceDocumentId,
  minimumReadSeconds,
  initialReadSeconds,
  requiresQuiz,
  onComplete,
}: Props) {
  const [seconds, setSeconds] = useState(initialReadSeconds);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [paused, setPaused] = useState(false);
  const [content, setContent] = useState<string>("Loading source document…");
  const lastActivity = useRef<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const startReading = useStartReading();
  const heartbeat = useHeartbeatRead();
  const completeReading = useCompleteReading();

  // Mark started on mount
  useEffect(() => {
    startReading.mutate(recordId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  // Load source document text
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!sourceDocumentId) {
        setContent(`No source document linked. Please review the SOP/WI: ${moduleName}.`);
        return;
      }
      const { data } = await supabase
        .from("documents")
        .select("name, brief_summary, description")
        .eq("id", sourceDocumentId)
        .single();
      if (!alive) return;
      const text = [data?.name, data?.brief_summary, data?.description]
        .filter(Boolean).join("\n\n");
      setContent(text || `${moduleName} (no extended description available)`);
    })();
    return () => { alive = false; };
  }, [sourceDocumentId, moduleName]);

  // Activity tracking
  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    window.addEventListener("scroll", bump, true);
    window.addEventListener("keydown", bump);
    window.addEventListener("mousemove", bump);
    const onVis = () => { if (document.hidden) lastActivity.current = 0; };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("scroll", bump, true);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("mousemove", bump);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Heartbeat tick
  useEffect(() => {
    const id = setInterval(() => {
      const idle = Date.now() - lastActivity.current > IDLE_MS;
      if (idle || document.hidden) { setPaused(true); return; }
      setPaused(false);
      const add = HEARTBEAT_MS / 1000;
      setSeconds(s => s + add);
      heartbeat.mutate({ recordId, addedSeconds: add });
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [recordId, heartbeat]);

  // Scroll detection
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReachedBottom(true);
  };

  const minMet = seconds >= minimumReadSeconds;
  const canContinue = minMet && reachedBottom;
  const remaining = Math.max(0, minimumReadSeconds - seconds);
  const pct = Math.min(100, Math.round((seconds / minimumReadSeconds) * 100));

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{moduleName}</h3>
          {paused && <Badge variant="outline" className="ml-auto"><Pause className="h-3 w-3 mr-1" />Paused</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum read time: {fmt(minimumReadSeconds)}. The Continue button unlocks once you reach the end and the timer is met.
        </p>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs tabular-nums w-20 text-right">
            {fmt(seconds)} / {fmt(minimumReadSeconds)}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none whitespace-pre-wrap"
      >
        {content}
        <div className="h-16" />
        <p className="text-xs text-muted-foreground italic mt-8">— End of document —</p>
      </div>

      <div className="border-t p-4 flex items-center justify-between bg-background">
        <div className="text-xs text-muted-foreground">
          {!reachedBottom && "Scroll to the end to enable Continue."}
          {reachedBottom && !minMet && `Wait ${fmt(remaining)} more.`}
          {canContinue && <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Read complete</span>}
        </div>
        <Button
          disabled={!canContinue || completeReading.isPending}
          onClick={() => completeReading.mutate(
            { recordId, requiresQuiz },
            { onSuccess: onComplete }
          )}
        >
          Continue to {requiresQuiz ? "Quiz" : "Sign"}
        </Button>
      </div>
    </div>
  );
}