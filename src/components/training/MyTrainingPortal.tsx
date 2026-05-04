import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, CheckCircle2, AlertTriangle, Clock, PlayCircle, FileText, ShieldCheck,
} from "lucide-react";
import { useUserTrainingRecords } from "@/hooks/useTrainingRecords";
import { useAuth } from "@/context/AuthContext";
import { TrainingWorkflowDialog } from "./TrainingWorkflowDialog";

interface Props { companyId: string | undefined }

const PHASE_META: Record<string, { label: string; color: string; icon: any }> = {
  not_started: { label: "Start", color: "bg-slate-500", icon: PlayCircle },
  reading:     { label: "Reading", color: "bg-blue-500", icon: BookOpen },
  quiz_ready:  { label: "Take quiz", color: "bg-violet-500", icon: FileText },
  quiz_failed: { label: "Trainer review", color: "bg-amber-500", icon: AlertTriangle },
  sign_ready:  { label: "Sign", color: "bg-teal-500", icon: ShieldCheck },
  completed:   { label: "Complete", color: "bg-emerald-500", icon: CheckCircle2 },
  expired:     { label: "Re-train", color: "bg-rose-500", icon: AlertTriangle },
};

export function MyTrainingPortal({ companyId }: Props) {
  const { user } = useAuth();
  const { data: records = [], isLoading } = useUserTrainingRecords(user?.id, companyId);
  const [openId, setOpenId] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const today = new Date();
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const dueNow: any[] = [], inProgress: any[] = [], upcoming: any[] = [], completed: any[] = [];
    for (const r of records as any[]) {
      const phase = r.phase ?? "not_started";
      const due = r.due_date ? new Date(r.due_date) : null;
      if (phase === "completed") completed.push(r);
      else if (phase === "reading" || phase === "quiz_ready" || phase === "sign_ready") inProgress.push(r);
      else if (phase === "quiz_failed" || phase === "expired" || (due && due < today)) dueNow.push(r);
      else if (due && due <= in30) upcoming.push(r);
      else upcoming.push(r);
    }
    return { dueNow, inProgress, upcoming, completed };
  }, [records]);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const Section = ({ title, items, tone }: { title: string; items: any[]; tone?: string }) => (
    items.length === 0 ? null : (
      <div className="space-y-2">
        <h3 className={`text-sm font-semibold ${tone || ""}`}>{title} <span className="text-muted-foreground font-normal">({items.length})</span></h3>
        <div className="grid gap-2">
          {items.map((r: any) => {
            const phase = r.phase ?? "not_started";
            const meta = PHASE_META[phase] ?? PHASE_META.not_started;
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${meta.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{r.training_module?.name || "Module"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{phase.replace("_", " ")}</Badge>
                    {r.due_date && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(r.due_date).toLocaleDateString()}</span>}
                    {r.training_module?.requires_quiz && <span>· Quiz required</span>}
                  </div>
                </div>
                <Button size="sm" onClick={() => setOpenId(r.id)}>
                  {phase === "completed" ? "Review" : meta.label}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <Section title="Due now" items={buckets.dueNow} tone="text-rose-600" />
      <Section title="In progress" items={buckets.inProgress} tone="text-blue-600" />
      <Section title="Upcoming" items={buckets.upcoming} />
      <Section title="Completed" items={buckets.completed} tone="text-emerald-600" />

      {records.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No training assignments yet. Your trainer will assign modules based on your role.
        </Card>
      )}

      <TrainingWorkflowDialog
        recordId={openId}
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}