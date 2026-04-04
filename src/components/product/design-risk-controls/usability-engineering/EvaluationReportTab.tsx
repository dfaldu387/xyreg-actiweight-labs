import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, ChevronDown, FileText, AlertTriangle, CheckCircle2, XCircle, Plus, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUsabilityStudies } from "@/hooks/useUsabilityStudies";
import { UsabilityStudyRow, TaskObservation } from "@/services/usabilityStudyService";
import { updateUsabilityStudy } from "@/services/usabilityStudyService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EvaluationReportTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const OUTCOME_COLORS = {
  success: 'bg-green-100 text-green-800',
  partial_success: 'bg-yellow-100 text-yellow-800',
  fail: 'bg-red-100 text-red-800',
};

const OUTCOME_ICONS = {
  success: CheckCircle2,
  partial_success: AlertTriangle,
  fail: XCircle,
};

export function EvaluationReportTab({ productId, companyId, disabled }: EvaluationReportTabProps) {
  const queryClient = useQueryClient();
  const { studies, isLoading } = useUsabilityStudies(productId);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<UsabilityStudyRow>>>({});

  const completedStudies = studies.filter(s => s.status === 'completed' || s.status === 'in_progress');
  const allStudies = studies;

  const getStudyEdits = (studyId: string) => localEdits[studyId] || {};

  const updateLocal = (studyId: string, field: keyof UsabilityStudyRow, value: any) => {
    setLocalEdits(prev => ({
      ...prev,
      [studyId]: { ...prev[studyId], [field]: value },
    }));
  };

  const saveReport = async (study: UsabilityStudyRow) => {
    const edits = localEdits[study.id];
    if (!edits) return;
    setSavingId(study.id);
    try {
      await updateUsabilityStudy(study.id, edits);
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
      setLocalEdits(prev => { const n = { ...prev }; delete n[study.id]; return n; });
      toast.success('Report saved');
    } catch {
      toast.error('Failed to save report');
    } finally {
      setSavingId(null);
    }
  };

  const getVal = <K extends keyof UsabilityStudyRow>(study: UsabilityStudyRow, field: K): UsabilityStudyRow[K] => {
    const edits = localEdits[study.id];
    if (edits && field in edits) return edits[field] as UsabilityStudyRow[K];
    return study[field];
  };

  // ── Observation helpers ──
  const getObservations = (study: UsabilityStudyRow): TaskObservation[] =>
    (getVal(study, 'observations') as TaskObservation[]) || [];

  const setObservations = (studyId: string, obs: TaskObservation[]) =>
    updateLocal(studyId, 'observations', obs);

  const addObservation = (study: UsabilityStudyRow) => {
    const tasks = study.tasks_structured || [];
    const participants = study.participants_structured || [];
    const obs = getObservations(study);
    const newObs: TaskObservation = {
      task_id: tasks[0]?.task_id || 'T1',
      participant_id: participants[0]?.participant_id || 'User 1',
      observation: '',
      outcome: 'success',
      use_errors: '',
      hazards_encountered: '',
    };
    setObservations(study.id, [...obs, newObs]);
  };

  const updateObservation = (studyId: string, idx: number, field: keyof TaskObservation, value: any, currentObs: TaskObservation[]) => {
    const next = [...currentObs];
    next[idx] = { ...next[idx], [field]: value };
    setObservations(studyId, next);
  };

  const removeObservation = (studyId: string, idx: number, currentObs: TaskObservation[]) => {
    setObservations(studyId, currentObs.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Evaluation Reports</h3>
        <p className="text-sm text-muted-foreground">
          IEC 62366-1 Clauses 5.7/5.9 — Record observations, task outcomes, and learnings per study
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          For each study, add per-participant per-task observations with outcome tracking (Success / Partial / Fail).
          Studies must have tasks and participants defined in the Evaluation Plan tab first.
        </AlertDescription>
      </Alert>

      {allStudies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Studies Yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Create studies in the Evaluation Plan tab first, then record observations and results here.
            </p>
          </CardContent>
        </Card>
      )}

      {allStudies.map(study => {
        const obs = getObservations(study);
        const edits = localEdits[study.id];
        const hasEdits = !!edits && Object.keys(edits).length > 0;

        return (
          <Card key={study.id}>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {study.name || 'Untitled Study'}
                          <Badge variant="outline">{study.study_type}</Badge>
                          <Badge variant="outline" className={cn("text-xs", study.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                            {study.status}
                          </Badge>
                          {hasEdits && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {obs.length} observation(s) · {study.tasks_structured?.length || 0} task(s) · {study.participants_structured?.length || 0} participant(s)
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 border-t pt-4">
                  {/* ── Observation Matrix ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Task Observations</h4>
                      {!disabled && (
                        <Button variant="outline" size="sm" onClick={() => addObservation(study)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Observation
                        </Button>
                      )}
                    </div>

                    {obs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No observations recorded yet. Add one for each task × participant combination.
                      </p>
                    )}

                    {obs.map((o, idx) => {
                      const OutcomeIcon = OUTCOME_ICONS[o.outcome];
                      return (
                        <div key={idx} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              <OutcomeIcon className={cn("h-4 w-4", o.outcome === 'success' ? 'text-green-600' : o.outcome === 'fail' ? 'text-red-600' : 'text-yellow-600')} />
                              <span className="text-sm font-medium">{o.task_id} × {o.participant_id}</span>
                              <Badge className={cn("text-xs", OUTCOME_COLORS[o.outcome])}>{o.outcome.replace('_', ' ')}</Badge>
                            </div>
                            {!disabled && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeObservation(study.id, idx, obs)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input value={o.task_id} onChange={e => updateObservation(study.id, idx, 'task_id', e.target.value, obs)} placeholder="Task ID" disabled={disabled} className="text-sm" />
                            <Input value={o.participant_id} onChange={e => updateObservation(study.id, idx, 'participant_id', e.target.value, obs)} placeholder="Participant ID" disabled={disabled} className="text-sm" />
                            <Select value={o.outcome} onValueChange={v => updateObservation(study.id, idx, 'outcome', v, obs)} disabled={disabled}>
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="partial_success">Partial Success</SelectItem>
                                <SelectItem value="fail">Fail</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea value={o.observation} onChange={e => updateObservation(study.id, idx, 'observation', e.target.value, obs)} placeholder="What was observed?" className="min-h-[40px] text-sm" disabled={disabled} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input value={o.use_errors} onChange={e => updateObservation(study.id, idx, 'use_errors', e.target.value, obs)} placeholder="Use errors encountered" disabled={disabled} className="text-sm" />
                            <Input value={o.hazards_encountered} onChange={e => updateObservation(study.id, idx, 'hazards_encountered', e.target.value, obs)} placeholder="Hazards encountered" disabled={disabled} className="text-sm" />
                          </div>
                          {o.outcome !== 'success' && (
                            <Select value={o.severity || ''} onValueChange={v => updateObservation(study.id, idx, 'severity', v, obs)} disabled={disabled}>
                              <SelectTrigger className="text-sm w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="mid">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Learnings ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-green-700">Positive Learnings</label>
                      <Textarea
                        value={(getVal(study, 'positive_learnings') as string) || ''}
                        onChange={e => updateLocal(study.id, 'positive_learnings', e.target.value)}
                        placeholder="What worked well?"
                        className="min-h-[80px]"
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-red-700">Negative Learnings</label>
                      <Textarea
                        value={(getVal(study, 'negative_learnings') as string) || ''}
                        onChange={e => updateLocal(study.id, 'negative_learnings', e.target.value)}
                        placeholder="Issues found, root causes..."
                        className="min-h-[80px]"
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Recommendations</label>
                    <Textarea
                      value={(getVal(study, 'recommendations') as string) || ''}
                      onChange={e => updateLocal(study.id, 'recommendations', e.target.value)}
                      placeholder="Recommended design changes or further evaluations..."
                      className="min-h-[60px]"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Overall Conclusion</label>
                    <Textarea
                      value={(getVal(study, 'overall_conclusion') as string) || ''}
                      onChange={e => updateLocal(study.id, 'overall_conclusion', e.target.value)}
                      placeholder="Overall assessment of the evaluation..."
                      className="min-h-[60px]"
                      disabled={disabled}
                    />
                  </div>

                  {!disabled && hasEdits && (
                    <div className="flex justify-end">
                      <Button onClick={() => saveReport(study)} disabled={savingId === study.id}>
                        <Save className="h-4 w-4 mr-2" />
                        {savingId === study.id ? 'Saving...' : 'Save Report'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
