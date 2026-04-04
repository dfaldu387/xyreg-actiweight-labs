import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Trash2, GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsabilityStudyRow, StudyParticipant, StudyTask } from "@/services/usabilityStudyService";

// Keep the legacy interface for backward compat with EvaluationPlanTab JSON parsing
export interface UsabilityStudy {
  id: string;
  name: string;
  study_type: string;
  objective: string;
  method: string;
  participants: string;
  tasks: string;
  acceptance_criteria: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed';
}

export const FORMATIVE_STUDY_TYPES = [
  { value: 'heuristic_evaluation', label: 'Heuristic Evaluation' },
  { value: 'cognitive_walkthrough', label: 'Cognitive Walkthrough' },
  { value: 'expert_review', label: 'Expert Review' },
  { value: 'early_prototype_test', label: 'Early Prototype User Test' },
  { value: 'functional_prototype_test', label: 'Functional Prototype User Test' },
  { value: 'think_aloud', label: 'Think-Aloud Study' },
  { value: 'contextual_inquiry', label: 'Contextual Inquiry' },
  { value: 'other', label: 'Other' },
];

export const SUMMATIVE_STUDY_TYPES = [
  { value: 'simulated_use', label: 'Simulated Use Study' },
  { value: 'clinical_use', label: 'Clinical Use Study' },
  { value: 'comparative_usability', label: 'Comparative Usability Study' },
  { value: 'knowledge_task_analysis', label: 'Knowledge & Task Analysis' },
  { value: 'use_error_validation', label: 'Use Error Validation' },
  { value: 'labeling_comprehension', label: 'Labeling Comprehension Study' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  planned: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
};

const EVALUATION_METHODS = [
  'Observation', 'Think-Aloud', 'Video Recording', 'Screen Recording',
  'Eye Tracking', 'Post-test Interview', 'Questionnaire (SUS/PSSUQ)',
  'Cognitive Walkthrough', 'Heuristic Evaluation', 'Expert Review',
];

interface StudyCardProps {
  study: UsabilityStudyRow;
  section: 'formative' | 'summative';
  onChange: (updated: Partial<UsabilityStudyRow>) => void;
  onDelete: () => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

// ── Collapsible sub-section ──────────────────────────────────────
function SubSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pl-5 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Export as both names for backward compat
export const StudyCard = StudyCardV2Impl;
export { StudyCardV2Impl as StudyCardV2 };

function StudyCardV2Impl({ study, section, onChange, onDelete, disabled, defaultOpen = false }: StudyCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const studyTypes = section === 'formative' ? FORMATIVE_STUDY_TYPES : SUMMATIVE_STUDY_TYPES;
  const typeLabel = studyTypes.find(t => t.value === study.study_subtype)?.label || study.study_subtype;

  const update = (field: keyof UsabilityStudyRow, value: any) => {
    onChange({ [field]: value });
  };

  // ── Participant helpers ──
  const addParticipant = () => {
    const next: StudyParticipant[] = [
      ...(study.participants_structured || []),
      { id: crypto.randomUUID(), participant_id: `User ${(study.participants_structured?.length || 0) + 1}`, user_group: '', demographics: '' },
    ];
    update('participants_structured', next);
  };
  const updateParticipant = (idx: number, field: keyof StudyParticipant, value: string) => {
    const next = [...(study.participants_structured || [])];
    next[idx] = { ...next[idx], [field]: value };
    update('participants_structured', next);
  };
  const removeParticipant = (idx: number) => {
    update('participants_structured', (study.participants_structured || []).filter((_, i) => i !== idx));
  };

  // ── Task helpers ──
  const addTask = () => {
    const next: StudyTask[] = [
      ...(study.tasks_structured || []),
      { id: crypto.randomUUID(), task_id: `T${(study.tasks_structured?.length || 0) + 1}`, description: '', instruction: '', acceptance_criteria: '', ui_area: '' },
    ];
    update('tasks_structured', next);
  };
  const updateTask = (idx: number, field: keyof StudyTask, value: string) => {
    const next = [...(study.tasks_structured || [])];
    next[idx] = { ...next[idx], [field]: value };
    update('tasks_structured', next);
  };
  const removeTask = (idx: number) => {
    update('tasks_structured', (study.tasks_structured || []).filter((_, i) => i !== idx));
  };

  // ── Methods toggle ──
  const toggleMethod = (method: string) => {
    const current = study.methods_used || [];
    const next = current.includes(method) ? current.filter(m => m !== method) : [...current, method];
    update('methods_used', next);
  };

  return (
    <Card className="border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{study.name || 'Untitled Study'}</span>
                <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
                <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[study.status])}>
                  {study.status.replace('_', ' ')}
                </Badge>
                {study.study_dates && <span className="text-xs text-muted-foreground">{study.study_dates}</span>}
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 border-t">
            {/* ── Basic Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Study Name</label>
                <Input value={study.name} onChange={e => update('name', e.target.value)} placeholder="e.g., Formative Evaluation Round 2" disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Study Type</label>
                <Select value={study.study_subtype} onValueChange={v => update('study_subtype', v)} disabled={disabled}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {studyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select value={study.status} onValueChange={v => update('status', v)} disabled={disabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Study Dates</label>
                <Input value={study.study_dates} onChange={e => update('study_dates', e.target.value)} placeholder="e.g., 15-17 March 2025" disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Conductors / Investigators</label>
                <Input value={study.conductors} onChange={e => update('conductors', e.target.value)} placeholder="Names and roles" disabled={disabled} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Objective</label>
              <Textarea value={study.objective} onChange={e => update('objective', e.target.value)} placeholder="What usability questions will this study answer?" className="min-h-[80px]" disabled={disabled} />
            </div>

            {/* ── Prototype & Scope ── */}
            <SubSection title="Prototype & Scope">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Prototype / Device ID</label>
                  <Input value={study.prototype_id} onChange={e => update('prototype_id', e.target.value)} placeholder="e.g., PR2" disabled={disabled} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Software Version</label>
                  <Input value={study.software_version} onChange={e => update('software_version', e.target.value)} placeholder="e.g., 0.9.0" disabled={disabled} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">UI Under Evaluation</label>
                  <Input value={study.ui_under_evaluation} onChange={e => update('ui_under_evaluation', e.target.value)} placeholder="e.g., Terminal software v0.9" disabled={disabled} />
                </div>
              </div>
            </SubSection>

            {/* ── Participants ── */}
            <SubSection title={`Participants (${study.participants_structured?.length || 0})`}>
              {(study.participants_structured || []).map((p, idx) => (
                <div key={p.id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
                  <Input value={p.participant_id} onChange={e => updateParticipant(idx, 'participant_id', e.target.value)} placeholder="ID" disabled={disabled} className="text-sm" />
                  <Select value={p.user_group} onValueChange={v => updateParticipant(idx, 'user_group', v)} disabled={disabled}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={p.demographics} onChange={e => updateParticipant(idx, 'demographics', e.target.value)} placeholder="Age, role, experience..." disabled={disabled} className="text-sm" />
                  {!disabled && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeParticipant(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {!disabled && (
                <Button variant="outline" size="sm" onClick={addParticipant}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Participant
                </Button>
              )}
              {/* Legacy free-text fallback */}
              {study.participants_text && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-xs text-muted-foreground">Legacy Notes</label>
                  <Textarea value={study.participants_text} onChange={e => update('participants_text', e.target.value)} className="min-h-[60px] text-sm" disabled={disabled} />
                </div>
              )}
            </SubSection>

            {/* ── Training ── */}
            <SubSection title="Training">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Training Description</label>
                <Textarea value={study.training_description} onChange={e => update('training_description', e.target.value)} placeholder="What training was given before the test?" className="min-h-[60px]" disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Training-to-Test Interval</label>
                <Input value={study.training_to_test_interval} onChange={e => update('training_to_test_interval', e.target.value)} placeholder="e.g., 30 minutes" disabled={disabled} />
              </div>
            </SubSection>

            {/* ── Tasks ── */}
            <SubSection title={`Tasks (${study.tasks_structured?.length || 0})`}>
              {(study.tasks_structured || []).map((t, idx) => (
                <div key={t.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.task_id || `Task ${idx + 1}`}</span>
                    {!disabled && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeTask(idx)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input value={t.task_id} onChange={e => updateTask(idx, 'task_id', e.target.value)} placeholder="Task ID (e.g., T1)" disabled={disabled} className="text-sm" />
                    <Input value={t.ui_area} onChange={e => updateTask(idx, 'ui_area', e.target.value)} placeholder="UI Area" disabled={disabled} className="text-sm" />
                  </div>
                  <Textarea value={t.description} onChange={e => updateTask(idx, 'description', e.target.value)} placeholder="Task description" className="min-h-[40px] text-sm" disabled={disabled} />
                  <Textarea value={t.instruction} onChange={e => updateTask(idx, 'instruction', e.target.value)} placeholder="Instructions given to participant" className="min-h-[40px] text-sm" disabled={disabled} />
                  <Input value={t.acceptance_criteria} onChange={e => updateTask(idx, 'acceptance_criteria', e.target.value)} placeholder="Acceptance criteria" disabled={disabled} className="text-sm" />
                </div>
              ))}
              {!disabled && (
                <Button variant="outline" size="sm" onClick={addTask}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                </Button>
              )}
              {/* Legacy free-text fallback */}
              {study.tasks_text && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-xs text-muted-foreground">Legacy Notes</label>
                  <Textarea value={study.tasks_text} onChange={e => update('tasks_text', e.target.value)} className="min-h-[60px] text-sm" disabled={disabled} />
                </div>
              )}
            </SubSection>

            {/* ── Methods & Setup ── */}
            <SubSection title="Methods & Setup">
              <div className="space-y-2">
                <label className="text-sm font-medium">Evaluation Methods</label>
                <div className="flex flex-wrap gap-2">
                  {EVALUATION_METHODS.map(m => {
                    const selected = (study.methods_used || []).includes(m);
                    return (
                      <Badge
                        key={m}
                        variant={selected ? "default" : "outline"}
                        className={cn("cursor-pointer transition-colors", selected && "bg-primary text-primary-foreground")}
                        onClick={() => !disabled && toggleMethod(m)}
                      >
                        {m}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Test Location</label>
                  <Input value={study.test_location} onChange={e => update('test_location', e.target.value)} placeholder="Venue, address" disabled={disabled} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Test Conditions</label>
                  <Input value={study.test_conditions} onChange={e => update('test_conditions', e.target.value)} placeholder="Environmental conditions" disabled={disabled} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Other Equipment</label>
                <Input value={study.other_equipment} onChange={e => update('other_equipment', e.target.value)} placeholder="Cameras, recording software..." disabled={disabled} />
              </div>
            </SubSection>

            {/* ── Method / Protocol (legacy) ── */}
            <SubSection title="Method / Protocol">
              <Textarea value={study.method} onChange={e => update('method', e.target.value)} placeholder="Describe the evaluation method, protocol, and setup..." className="min-h-[80px]" disabled={disabled} />
            </SubSection>

            {/* ── Interview / Questionnaire ── */}
            <SubSection title="Interview / Questionnaire">
              <Textarea value={study.interview_questions} onChange={e => update('interview_questions', e.target.value)} placeholder="Post-test interview questions, Likert scales, questionnaires..." className="min-h-[80px]" disabled={disabled} />
            </SubSection>

            {/* ── Acceptance Criteria ── */}
            <SubSection title="Acceptance Criteria" defaultOpen>
              <Textarea value={study.acceptance_criteria} onChange={e => update('acceptance_criteria', e.target.value)} placeholder="Pass/fail criteria, success metrics..." className="min-h-[80px]" disabled={disabled} />
            </SubSection>

            {/* ── Accompanying Documents ── */}
            <SubSection title="Accompanying Documents">
              <Textarea value={study.accompanying_docs} onChange={e => update('accompanying_docs', e.target.value)} placeholder="List of reference documents provided..." className="min-h-[60px]" disabled={disabled} />
            </SubSection>

            {!disabled && (
              <div className="flex justify-end pt-2">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove Study
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ── Legacy helpers (still used by EvaluationPlanTab for backward compat) ──

export function createEmptyStudy(section: 'formative' | 'summative'): UsabilityStudy {
  return {
    id: crypto.randomUUID(),
    name: '',
    study_type: section === 'formative' ? 'heuristic_evaluation' : 'simulated_use',
    objective: '',
    method: '',
    participants: '',
    tasks: '',
    acceptance_criteria: '',
    status: 'draft',
  };
}

export function parseStudies(raw: string | null, section: 'formative' | 'summative'): UsabilityStudy[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    if (raw.trim()) {
      return [{
        id: crypto.randomUUID(),
        name: section === 'formative' ? 'Formative Evaluation (Legacy)' : 'Summative Evaluation (Legacy)',
        study_type: section === 'formative' ? 'other' : 'simulated_use',
        objective: raw,
        method: '',
        participants: '',
        tasks: '',
        acceptance_criteria: '',
        status: 'draft',
      }];
    }
  }
  return [];
}
