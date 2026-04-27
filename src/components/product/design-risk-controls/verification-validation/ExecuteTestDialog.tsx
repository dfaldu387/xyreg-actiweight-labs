import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, AlertTriangle, Users, ChevronDown, ChevronUp, Bug, FilePlus2 } from "lucide-react";
import { TestCase, VVService } from "@/services/vvService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUsabilityEngineeringFile, IntendedUser } from "@/services/usabilityEngineeringService";
import { LogDefectDialog } from "./LogDefectDialog";
import { CreateRequirementFromFailureDialog } from "./CreateRequirementFromFailureDialog";

interface ExecuteTestDialogProps {
  testCase: TestCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId: string;
  onExecutionSaved: () => void;
}

interface StepResult {
  step_number: number;
  status: 'pass' | 'fail' | 'not_executed';
  notes: string;
}

export function ExecuteTestDialog({ testCase, open, onOpenChange, companyId, productId, onExecutionSaved }: ExecuteTestDialogProps) {
  const [softwareVersion, setSoftwareVersion] = useState("");
  const [hardwareVersion, setHardwareVersion] = useState("");
  const [environmentInfo, setEnvironmentInfo] = useState("");
  const [actualResults, setActualResults] = useState("");
  const [verdict, setVerdict] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Defect creation prompt state
  const [showDefectPrompt, setShowDefectPrompt] = useState(false);
  const [logDefectOpen, setLogDefectOpen] = useState(false);
  const [createRequirementOpen, setCreateRequirementOpen] = useState(false);
  const [savedExecutionId, setSavedExecutionId] = useState<string | null>(null);

  // Usability fields
  const [participantId, setParticipantId] = useState("");
  const [participantProfile, setParticipantProfile] = useState("");
  const [useErrorsCount, setUseErrorsCount] = useState<number>(0);
  const [useErrorsDescription, setUseErrorsDescription] = useState("");
  const [taskCompletion, setTaskCompletion] = useState<string>("");
  const [timeOnTask, setTimeOnTask] = useState<number | undefined>(undefined);
  const [intendedUsers, setIntendedUsers] = useState<IntendedUser[]>([]);

  const isUsabilityTest = testCase?.test_level === 'formative' || testCase?.test_level === 'summative';

  // Load intended users for usability tests
  useEffect(() => {
    if (isUsabilityTest && open) {
      getUsabilityEngineeringFile(productId).then(uef => {
        if (uef?.intended_users) {
          setIntendedUsers(uef.intended_users);
        }
      }).catch(() => {});
    }
  }, [isUsabilityTest, open, productId]);

  // Initialize step results from test_steps
  useEffect(() => {
    if (testCase?.test_steps && Array.isArray(testCase.test_steps)) {
      setStepResults(testCase.test_steps.map((_: any, i: number) => ({
        step_number: i + 1,
        status: 'not_executed' as const,
        notes: '',
      })));
    } else {
      setStepResults([]);
    }
    // Reset form
    setSoftwareVersion("");
    setHardwareVersion("");
    setEnvironmentInfo("");
    setActualResults("");
    setVerdict("");
    setNotes("");
    setParticipantId("");
    setParticipantProfile("");
    setUseErrorsCount(0);
    setUseErrorsDescription("");
    setTaskCompletion("");
    setTimeOnTask(undefined);
  }, [testCase]);

  const handleStepStatusChange = (index: number, status: 'pass' | 'fail') => {
    setStepResults(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const handleStepNotesChange = (index: number, notes: string) => {
    setStepResults(prev => prev.map((s, i) => i === index ? { ...s, notes } : s));
  };

  const handleSave = async () => {
    if (!testCase || !verdict) {
      toast.error("Please select a verdict before saving.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const executionId = await VVService.getNextExecutionId(companyId);

      // Build environment_info JSON with usability data if applicable
      const envInfo: Record<string, any> = {
        environment_description: environmentInfo,
        step_results: stepResults,
      };

      if (isUsabilityTest) {
        envInfo.participant_id = participantId;
        envInfo.participant_profile = participantProfile;
        envInfo.use_errors_count = useErrorsCount;
        envInfo.use_errors_description = useErrorsDescription;
        envInfo.task_completion = taskCompletion;
        envInfo.time_on_task = timeOnTask;
      }

      const savedExecution = await VVService.createTestExecution({
        test_case_id: testCase.id,
        execution_id: executionId,
        executed_by: user.id,
        execution_date: new Date().toISOString(),
        environment_info: envInfo,
        software_version: softwareVersion || null,
        hardware_version: hardwareVersion || null,
        actual_results: actualResults || null,
        status: verdict,
        notes: notes || null,
        attachments: null,
        execution_time_minutes: timeOnTask || null,
      });

      toast.success(`Execution ${executionId} saved successfully.`);
      onExecutionSaved();
      
      // If verdict is fail, prompt to create defect instead of closing immediately
      if (verdict === 'fail') {
        setSavedExecutionId(savedExecution.id);
        setShowDefectPrompt(true);
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Failed to save execution:", err);
      toast.error(err.message || "Failed to save execution.");
    } finally {
      setSaving(false);
    }
  };

  if (!testCase) return null;

  const steps = Array.isArray(testCase.test_steps) ? testCase.test_steps : [];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <div className="px-6 pt-6 pb-3 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Execute: {testCase.test_case_id}
              {isUsabilityTest && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {testCase.test_level === 'formative' ? 'Formative' : 'Summative'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Test Case Info */}
          <div className="space-y-1 bg-muted/30 rounded p-3 mt-3">
            <p className="font-medium text-sm">{testCase.name}</p>
            {testCase.description && <p className="text-xs text-muted-foreground">{testCase.description}</p>}
          </div>

          {/* Sticky Pass Criteria callout */}
          {testCase.acceptance_criteria && (
            <div className="mt-3 border-l-4 border-primary bg-primary/5 rounded-r-md p-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">✓ Pass Criteria</p>
              <p className="text-sm whitespace-pre-wrap break-words">{testCase.acceptance_criteria}</p>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">

        <Separator />

        {/* Environment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Software Version</Label>
            <Input value={softwareVersion} onChange={e => setSoftwareVersion(e.target.value)} placeholder="e.g. 2.1.0" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Hardware Version</Label>
            <Input value={hardwareVersion} onChange={e => setHardwareVersion(e.target.value)} placeholder="e.g. Rev C" className="h-8 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Environment Info</Label>
          <Input value={environmentInfo} onChange={e => setEnvironmentInfo(e.target.value)} placeholder="e.g. Test bench #3, 25°C" className="h-8 text-sm" />
        </div>

        {/* Usability-specific fields */}
        {isUsabilityTest && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary flex items-center gap-1">
                <Users className="h-3 w-3" />
                IEC 62366-1 Usability Evaluation Fields
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Participant ID</Label>
                  <Input value={participantId} onChange={e => setParticipantId(e.target.value)} placeholder="e.g. P01" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Participant Profile</Label>
                  {intendedUsers.length > 0 ? (
                    <Select value={participantProfile} onValueChange={setParticipantProfile}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select profile" /></SelectTrigger>
                      <SelectContent>
                        {intendedUsers.map((u, i) => (
                          <SelectItem key={i} value={u.profile}>{u.profile}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={participantProfile} onChange={e => setParticipantProfile(e.target.value)} placeholder="User profile" className="h-8 text-sm" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Use Errors Observed (count)</Label>
                  <Input type="number" min={0} value={useErrorsCount} onChange={e => setUseErrorsCount(parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Task Completion</Label>
                  <Select value={taskCompletion} onValueChange={setTaskCompletion}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="with_difficulty">With Difficulty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Use Errors Description</Label>
                <Textarea value={useErrorsDescription} onChange={e => setUseErrorsDescription(e.target.value)} placeholder="Describe observed use errors..." rows={2} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Time on Task (minutes)</Label>
                <Input type="number" min={0} value={timeOnTask ?? ''} onChange={e => setTimeOnTask(e.target.value ? parseInt(e.target.value) : undefined)} className="h-8 text-sm" />
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Step-by-step execution */}
        {steps.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Test Steps ({steps.length})</Label>
            {steps.map((step: any, index: number) => {
              const actionText = step.action || step.description || step.step || '';
              const isLong = actionText.length > 200;
              return (
                <StepCard
                  key={index}
                  index={index}
                  actionText={actionText}
                  isLong={isLong}
                  expected={step.expected_result || step.expected}
                  stepResult={stepResults[index]}
                  onStatusChange={handleStepStatusChange}
                  onNotesChange={handleStepNotesChange}
                />
              );
            })}
          </div>
        )}

        {/* Actual Results */}
        <div>
          <Label className="text-xs">Actual Results</Label>
          <Textarea value={actualResults} onChange={e => setActualResults(e.target.value)} placeholder="Document actual results observed..." rows={3} className="text-sm" />
        </div>

        {/* Verdict */}
        <div>
          <Label className="text-xs font-semibold">Overall Verdict</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {([
              { value: 'pass', label: 'Pass', desc: 'Meets acceptance criteria', icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, activeClasses: 'bg-green-50 border-green-500', hoverClass: 'hover:bg-green-50' },
              { value: 'fail', label: 'Fail', desc: 'Does not meet criteria', icon: <XCircle className="h-4 w-4 text-red-600" />, activeClasses: 'bg-red-50 border-red-500', hoverClass: 'hover:bg-red-50' },
              { value: 'blocked', label: 'Blocked', desc: 'Cannot execute (dependency or environment issue)', icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />, activeClasses: 'bg-yellow-50 border-yellow-500', hoverClass: 'hover:bg-yellow-50' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVerdict(opt.value)}
                className={`flex flex-col items-center gap-1 border rounded-md p-2 cursor-pointer transition-colors ${opt.hoverClass} ${verdict === opt.value ? opt.activeClasses : ''}`}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground text-center">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional observations..." rows={2} className="text-sm" />
        </div>

        </div>{/* end scrollable area */}

        <div className="px-6 pb-6 pt-3 shrink-0 border-t">
          {showDefectPrompt ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bug className="h-4 w-4 text-destructive" />
                Test failed — what's the root cause?
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowDefectPrompt(false); onOpenChange(false); }}>
                  Skip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowDefectPrompt(false); setCreateRequirementOpen(true); onOpenChange(false); }}
                  title="Spec gap — create a missing requirement"
                >
                  <FilePlus2 className="h-3 w-3 mr-1" /> Create Requirement
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setShowDefectPrompt(false); setLogDefectOpen(true); onOpenChange(false); }}>
                  <Bug className="h-3 w-3 mr-1" /> Log Defect
                </Button>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !verdict}>
                {saving ? 'Saving...' : 'Save Execution'}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Log Defect Dialog — opens after fail verdict */}
    <LogDefectDialog
      open={logDefectOpen}
      onOpenChange={setLogDefectOpen}
      productId={productId}
      companyId={companyId}
      prefillTestCaseId={testCase?.id}
      prefillTestExecutionId={savedExecutionId}
    />

    {/* Create Requirement from Failure Dialog — alternative path on fail */}
    <CreateRequirementFromFailureDialog
      open={createRequirementOpen}
      onOpenChange={setCreateRequirementOpen}
      testCase={testCase}
      executionId={savedExecutionId}
      productId={productId}
      companyId={companyId}
      onCreated={onExecutionSaved}
    />
    </>
  );
}

/** Collapsible step card with structured layout */
function StepCard({ index, actionText, isLong, expected, stepResult, onStatusChange, onNotesChange }: {
  index: number;
  actionText: string;
  isLong: boolean;
  expected?: string;
  stepResult?: StepResult;
  onStatusChange: (index: number, status: 'pass' | 'fail') => void;
  onNotesChange: (index: number, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(!isLong);
  const status = stepResult?.status || 'not_executed';

  const borderColor = status === 'pass' 
    ? 'border-l-green-500' 
    : status === 'fail' 
    ? 'border-l-destructive' 
    : 'border-l-muted-foreground/30';

  return (
    <div className={`border rounded-lg border-l-4 ${borderColor} overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold shrink-0">
            {index + 1}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {status === 'pass' ? '✓ Passed' : status === 'fail' ? '✗ Failed' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={status === 'pass' ? 'default' : 'outline'}
            className="h-6 px-2 text-xs"
            onClick={() => onStatusChange(index, 'pass')}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Pass
          </Button>
          <Button
            size="sm"
            variant={status === 'fail' ? 'destructive' : 'outline'}
            className="h-6 px-2 text-xs"
            onClick={() => onStatusChange(index, 'fail')}
          >
            <XCircle className="h-3 w-3 mr-1" /> Fail
          </Button>
        </div>
      </div>

      {/* Action text */}
      <div className="px-3 py-2 space-y-2">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Action</p>
          <p className={`text-sm whitespace-pre-wrap break-words ${!expanded ? 'line-clamp-3' : ''}`}>
            {actionText}
          </p>
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs text-primary mt-0.5"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <><ChevronUp className="h-3 w-3 mr-0.5" /> Show less</> : <><ChevronDown className="h-3 w-3 mr-0.5" /> Show more</>}
            </Button>
          )}
        </div>

        {/* Expected result */}
        {expected && (
          <div className="bg-muted/50 rounded px-2 py-1.5 border-l-2 border-primary/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Expected Result</p>
            <p className="text-xs whitespace-pre-wrap break-words">{expected}</p>
          </div>
        )}

        {/* Step notes */}
        <Input
          placeholder="Step notes / observations..."
          value={stepResult?.notes || ''}
          onChange={e => onNotesChange(index, e.target.value)}
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}
