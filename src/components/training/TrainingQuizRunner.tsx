import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Sparkles, RotateCcw } from "lucide-react";
import { useQuizQuestions, useSubmitQuizAttempt, useGenerateQuiz } from "@/hooks/useTrainingPhase";
import type { TrainingQuizQuestion } from "@/types/training";

interface Props {
  recordId: string;
  moduleId: string;
  userId: string;
  companyId: string;
  passThreshold: number;
  maxAttempts: number;
  attemptsSoFar: number;
  phase: "quiz_ready" | "quiz_failed";
  onPassed: () => void;
  canEdit?: boolean;
}

export function TrainingQuizRunner(props: Props) {
  const { data: questions = [], isLoading } = useQuizQuestions(props.moduleId);
  const submit = useSubmitQuizAttempt();
  const generate = useGenerateQuiz();

  const shuffled = useMemo(() => [...questions].sort(() => Math.random() - 0.5), [questions]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState<{ score: number; passed: boolean } | null>(null);

  if (props.phase === "quiz_failed" && !done) {
    return (
      <div className="p-8 text-center space-y-3">
        <XCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-semibold">Quiz attempts exhausted</h3>
        <p className="text-sm text-muted-foreground">
          You've used all {props.maxAttempts} attempts. Your trainer has been notified to review with you.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading quiz…</div>;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-primary mx-auto" />
        <h3 className="font-semibold">No quiz yet for this module</h3>
        <p className="text-sm text-muted-foreground">
          Generate 10 CtQ-focused questions from the source SOP using AI.
        </p>
        {props.canEdit && (
          <Button onClick={() => generate.mutate(props.moduleId)} disabled={generate.isPending}>
            {generate.isPending ? "Generating…" : "Generate quiz with AI"}
          </Button>
        )}
      </div>
    );
  }

  const finish = () => {
    const payload = shuffled.map((q) => ({
      question_id: q.id,
      chosen_index: answers[q.id] ?? -1,
      correct: (answers[q.id] ?? -1) === q.correct_index,
    }));
    submit.mutate(
      {
        recordId: props.recordId,
        moduleId: props.moduleId,
        userId: props.userId,
        companyId: props.companyId,
        answers: payload,
        passThreshold: props.passThreshold,
        maxAttempts: props.maxAttempts,
      },
      {
        onSuccess: (res) => {
          setDone({ score: res.score, passed: res.passed });
          if (res.passed) setTimeout(() => props.onPassed(), 1200);
        },
      }
    );
  };

  if (done) {
    return (
      <div className="p-6 space-y-4 overflow-y-auto h-full">
        <div className="text-center space-y-2">
          {done.passed ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          ) : (
            <XCircle className="h-12 w-12 text-amber-500 mx-auto" />
          )}
          <h3 className="text-xl font-semibold">{done.score}%</h3>
          <p className="text-sm text-muted-foreground">
            {done.passed ? "Passed — proceeding to signature." : `Below ${props.passThreshold}% threshold.`}
          </p>
          {!done.passed && props.attemptsSoFar + 1 < props.maxAttempts && (
            <Button onClick={() => { setDone(null); setIdx(0); setAnswers({}); }}>
              <RotateCcw className="h-4 w-4 mr-1" /> Retry
            </Button>
          )}
        </div>
        <div className="space-y-3 mt-6">
          {shuffled.map((q, i) => {
            const chosen = answers[q.id];
            const ok = chosen === q.correct_index;
            return (
              <Card key={q.id} className="p-3 space-y-1">
                <div className="flex items-start gap-2 text-sm">
                  {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" /> : <XCircle className="h-4 w-4 text-amber-500 mt-0.5" />}
                  <span className="font-medium">{i + 1}. {q.question}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Correct: {q.options[q.correct_index]}
                </p>
                {q.explanation && <p className="text-xs pl-6 italic">{q.explanation}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const q: TrainingQuizQuestion | undefined = shuffled[idx];
  if (!q) return null;
  const chosen = answers[q.id];
  const last = idx === shuffled.length - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center justify-between bg-muted/30">
        <Badge variant="outline">Question {idx + 1} of {shuffled.length}</Badge>
        <span className="text-xs text-muted-foreground">Pass at {props.passThreshold}%</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <h3 className="text-base font-semibold">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
              className={`w-full text-left p-3 rounded-md border text-sm transition ${
                chosen === i ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t p-4 flex justify-end gap-2">
        {!last ? (
          <Button disabled={chosen === undefined} onClick={() => setIdx(i => i + 1)}>Next</Button>
        ) : (
          <Button disabled={chosen === undefined || submit.isPending} onClick={finish}>
            {submit.isPending ? "Scoring…" : "Submit quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}