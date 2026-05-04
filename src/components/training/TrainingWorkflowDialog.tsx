import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { TrainingReader } from "./TrainingReader";
import { TrainingQuizRunner } from "./TrainingQuizRunner";
import { TrainingAttestation } from "./TrainingAttestation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Props {
  recordId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

interface RecordRow {
  id: string;
  user_id: string;
  company_id: string;
  training_module_id: string;
  phase: string;
  read_seconds: number;
  quiz_attempts_count: number;
  module: {
    id: string;
    name: string;
    version: string;
    requires_quiz: boolean;
    minimum_read_seconds: number;
    pass_threshold: number;
    max_attempts: number;
    attestation_text: string;
    source_document_id: string | null;
  };
}

export function TrainingWorkflowDialog({ recordId, open, onOpenChange, onCompleted }: Props) {
  const { user } = useAuth();
  const [record, setRecord] = useState<RecordRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open || !recordId) { setRecord(null); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("training_records")
        .select(`
          id, user_id, company_id, training_module_id, phase, read_seconds, quiz_attempts_count,
          module:training_modules(
            id, name, version, requires_quiz, minimum_read_seconds,
            pass_threshold, max_attempts, attestation_text, source_document_id
          )
        `)
        .eq("id", recordId)
        .single();
      setRecord(data as any);
      setLoading(false);
    })();
  }, [open, recordId, tick]);

  const refresh = () => setTick(t => t + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden flex flex-col">
        {loading && <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>}
        {!loading && record && record.module && (
          <>
            {(record.phase === "not_started" || record.phase === "reading") && (
              <TrainingReader
                recordId={record.id}
                moduleId={record.training_module_id}
                moduleName={record.module.name}
                sourceDocumentId={record.module.source_document_id}
                minimumReadSeconds={record.module.minimum_read_seconds}
                initialReadSeconds={record.read_seconds}
                requiresQuiz={record.module.requires_quiz}
                onComplete={refresh}
              />
            )}
            {(record.phase === "quiz_ready" || record.phase === "quiz_failed") && user && (
              <TrainingQuizRunner
                recordId={record.id}
                moduleId={record.training_module_id}
                userId={user.id}
                companyId={record.company_id}
                passThreshold={record.module.pass_threshold}
                maxAttempts={record.module.max_attempts}
                attemptsSoFar={record.quiz_attempts_count}
                phase={record.phase as any}
                onPassed={refresh}
                canEdit
              />
            )}
            {record.phase === "sign_ready" && user && (
              <TrainingAttestation
                recordId={record.id}
                moduleId={record.training_module_id}
                moduleVersion={record.module.version}
                attestationText={record.module.attestation_text}
                userId={user.id}
                userEmail={user.email ?? ""}
                onSigned={() => { refresh(); onCompleted?.(); }}
              />
            )}
            {record.phase === "completed" && (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-semibold">Training complete</h3>
                <p className="text-sm text-muted-foreground">Signed and recorded.</p>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}