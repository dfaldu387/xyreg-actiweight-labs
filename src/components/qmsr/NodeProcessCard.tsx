/**
 * NodeProcessCard — 6-block "Process Card" (Turtle-style) for a QMS node.
 *
 * Lives inside the right-rail RBRNodeDetailDrawer as a single collapsible
 * section (closed by default), replacing the legacy NodeInternalProcessPopover.
 *
 * Blocks rendered:
 *   1. Purpose            — qms_node_internal_processes.process_description
 *   2. Inputs             — seeded defaults (v2) / DB jsonb (v3)
 *   3. Outputs            — seeded defaults (v2) / DB jsonb (v3)
 *   4. Process Steps      — qms_node_internal_processes.process_steps
 *   5. Controls           — required SOPs (reuses the v0 collapsible content)
 *   6. Metrics            — derived from RBR pulse + CAPA aggregation
 *
 * v1 scope: visual upgrade + wiring of existing data. Inputs/Outputs/Metrics
 * fall back to muted "not defined yet" placeholders until v2 seeds them.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronRight,
  Settings2,
  Target,
  ArrowDownToLine,
  ArrowUpFromLine,
  ListOrdered,
  Link2,
  Activity,
  FileText,
  Edit2,
  Save,
  X,
  Loader2,
  HelpCircle,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  useQmsNodeData,
  useNodeSOPRequirements,
  type SOPRequirementStatus,
} from '@/hooks/useQmsNodeProcess';
import {
  NODE_SOP_RECOMMENDATIONS,
  TRACK_BADGE_STYLES,
  type SOPRecommendation,
} from '@/data/nodeSOPRecommendations';
import { formatSopDisplayId } from '@/constants/sopAutoSeedTiers';
import type { RBRPulseStatus } from '@/hooks/useRBRPulseStatus';
import {
  getNodeProcessDefault,
  type NodeProcessDefault,
} from '@/data/nodeProcessDefaults';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface NodeProcessCardProps {
  companyId: string | undefined;
  nodeId: string;
  nodeLabel: string;
  isoClause?: string;
  pulse: RBRPulseStatus;
  onSopRowClick: (
    sop: SOPRecommendation,
    status: SOPRequirementStatus | undefined,
  ) => void;
}

const blockHeader = (
  Icon: React.ComponentType<{ className?: string }>,
  label: string,
  tone: 'purple' | 'blue' | 'emerald' | 'amber' | 'slate' = 'slate',
) => {
  const toneCls = {
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-500',
  }[tone];
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={cn('h-3.5 w-3.5', toneCls)} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </span>
    </div>
  );
};

const placeholder = (text: string) => (
  <p className="text-xs italic text-slate-400">{text}</p>
);

export function NodeProcessCard({
  companyId,
  nodeId,
  nodeLabel,
  isoClause,
  pulse,
  onSopRowClick,
}: NodeProcessCardProps) {
  const [open, setOpen] = useState(true);
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [draftPurpose, setDraftPurpose] = useState('');
  const [editingInputs, setEditingInputs] = useState(false);
  const [draftInputs, setDraftInputs] = useState<string[]>([]);
  const [editingOutputs, setEditingOutputs] = useState(false);
  const [draftOutputs, setDraftOutputs] = useState<string[]>([]);
  const [editingSteps, setEditingSteps] = useState(false);
  const [draftSteps, setDraftSteps] = useState<string[]>([]);

  const nodeProcess = useQmsNodeData(companyId, nodeId);
  const sopRecommendations: SOPRecommendation[] =
    NODE_SOP_RECOMMENDATIONS[nodeId] || [];
  const { data: sopStatuses, isLoading: sopStatusesLoading } =
    useNodeSOPRequirements(companyId, nodeId);

  const defaults: NodeProcessDefault | undefined = getNodeProcessDefault(nodeId);

  // DB values win; otherwise fall back to the canonical defaults seeded for
  // ~17 helix nodes. Inputs/outputs are persisted as jsonb arrays; when null
  // we fall back to the canonical defaults.
  const purpose =
    nodeProcess.process?.process_description || '';
  const rawSteps = nodeProcess.process?.process_steps;
  const dbSteps = Array.isArray(rawSteps) ? rawSteps : [];
  const steps = dbSteps.length > 0 ? dbSteps : (defaults?.steps ?? []);
  const dbInputs = nodeProcess.process?.inputs;
  const dbOutputs = nodeProcess.process?.outputs;
  const inputs = Array.isArray(dbInputs) ? dbInputs : (defaults?.inputs ?? []);
  const outputs = Array.isArray(dbOutputs) ? dbOutputs : (defaults?.outputs ?? []);
  const hasDefaults = !!defaults;

  const missingSops = sopStatuses?.filter((s) => s.status === 'missing').length ?? 0;

  // Block 6 — derived metrics from the live pulse.
  const metrics: { label: string; value: string; tone?: string }[] = [
    {
      label: 'RBR pulse',
      value:
        pulse.status.charAt(0).toUpperCase() + pulse.status.slice(1),
      tone:
        pulse.status === 'critical'
          ? 'text-red-600'
          : pulse.status === 'active'
          ? 'text-amber-600'
          : pulse.status === 'validated'
          ? 'text-emerald-600'
          : 'text-slate-500',
    },
    {
      label: 'Approved / Total',
      value: `${pulse.approvedCount} / ${pulse.count}`,
    },
    {
      label: 'Pending',
      value: String(pulse.pendingCount),
      tone: pulse.pendingCount > 0 ? 'text-amber-600' : 'text-slate-600',
    },
  ];

  const handleStartEditPurpose = () => {
    setDraftPurpose(purpose || defaults?.purpose || '');
    setEditingPurpose(true);
  };

  const handleSavePurpose = async () => {
    await nodeProcess.saveProcess.mutateAsync({ description: draftPurpose });
    setEditingPurpose(false);
  };

  // ---- Inputs editor ----
  const handleStartEditInputs = () => {
    setDraftInputs(inputs.length ? [...inputs] : ['']);
    setEditingInputs(true);
  };
  const handleSaveInputs = async () => {
    const cleaned = draftInputs.map((s) => s.trim()).filter(Boolean);
    await nodeProcess.saveProcess.mutateAsync({
      description: purpose,
      steps: dbSteps.length > 0 ? (dbSteps as any) : undefined,
      inputs: cleaned,
    });
    setEditingInputs(false);
  };

  // ---- Outputs editor ----
  const handleStartEditOutputs = () => {
    setDraftOutputs(outputs.length ? [...outputs] : ['']);
    setEditingOutputs(true);
  };
  const handleSaveOutputs = async () => {
    const cleaned = draftOutputs.map((s) => s.trim()).filter(Boolean);
    await nodeProcess.saveProcess.mutateAsync({
      description: purpose,
      steps: dbSteps.length > 0 ? (dbSteps as any) : undefined,
      outputs: cleaned,
    });
    setEditingOutputs(false);
  };

  // ---- Steps editor ----
  const handleStartEditSteps = () => {
    setDraftSteps(steps.length ? steps.map((s: any) => s.description) : ['']);
    setEditingSteps(true);
  };
  const handleSaveSteps = async () => {
    const cleaned = draftSteps
      .map((s) => s.trim())
      .filter(Boolean)
      .map((description, i) => ({ step: i + 1, description }));
    await nodeProcess.saveProcess.mutateAsync({
      description: purpose,
      steps: cleaned,
    });
    setEditingSteps(false);
  };

  /** Apply the entire boilerplate: purpose + steps in one save. */
  const handleUseTemplate = async () => {
    if (!defaults) return;
    try {
      await nodeProcess.saveProcess.mutateAsync({
        description: defaults.purpose,
        steps: defaults.steps,
        inputs: defaults.inputs,
        outputs: defaults.outputs,
      });
      toast.success('Template applied — edit any block to refine');
    } catch {
      toast.error('Could not apply template');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-muted/40 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                  open && 'rotate-90',
                )}
              />
              <Settings2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                Internal Process
              </span>
              {isoClause && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  · §{isoClause}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {sopRecommendations.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {sopRecommendations.length} SOPs
                </span>
              )}
              {missingSops > 0 && (
                <span className="text-[11px] font-medium text-red-600">
                  · {missingSops} missing
                </span>
              )}
              {(nodeProcess.isLoading || sopStatusesLoading) && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* "Use template" call-to-action — only when nothing is defined yet. */}
            {hasDefaults && !purpose && dbSteps.length === 0 && (
              <div className="rounded-md border border-purple-200 bg-purple-50/60 p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-purple-900">
                    Start with a boilerplate
                  </p>
                  <p className="text-[11px] text-purple-700/80 mt-0.5">
                    A canonical ISO 13485-aligned Purpose and Process Steps for
                    "{nodeLabel}" will be applied. You can edit any block afterwards.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 px-2 gap-1 text-[11px] bg-purple-600 hover:bg-purple-700"
                  disabled={nodeProcess.saveProcess.isPending}
                  onClick={handleUseTemplate}
                >
                  {nodeProcess.saveProcess.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Use template
                </Button>
              </div>
            )}

            {/* Block 1 — Purpose */}
            <div className="rounded-md border bg-white p-3">
              <div className="flex items-center justify-between">
                {blockHeader(Target, '1. Purpose', 'purple')}
                {!editingPurpose ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 -mt-1 gap-1 text-[11px]"
                    onClick={handleStartEditPurpose}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1 -mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => setEditingPurpose(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 px-2 gap-1 text-[11px]"
                      disabled={nodeProcess.saveProcess.isPending}
                      onClick={handleSavePurpose}
                    >
                      {nodeProcess.saveProcess.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {editingPurpose ? (
                <Textarea
                  value={draftPurpose}
                  onChange={(e) => setDraftPurpose(e.target.value)}
                  placeholder={`Describe the purpose of "${nodeLabel}"...`}
                  className="min-h-[80px] text-xs"
                />
              ) : purpose ? (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {purpose}
                </p>
              ) : defaults?.purpose ? (
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Suggested: {defaults.purpose}
                </p>
              ) : (
                placeholder('No purpose defined yet. Click Edit to add one.')
              )}
            </div>

            {/* Block 2 + 3 — Inputs / Outputs (seeded defaults arrive in v2) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-white p-3">
                <div className="flex items-center justify-between">
                  {blockHeader(ArrowDownToLine, '2. Inputs', 'blue')}
                  {!editingInputs ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 -mt-1 gap-1 text-[11px]"
                      onClick={handleStartEditInputs}
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1 -mt-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setEditingInputs(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 px-2 gap-1 text-[11px]"
                        disabled={nodeProcess.saveProcess.isPending}
                        onClick={handleSaveInputs}
                      >
                        {nodeProcess.saveProcess.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {editingInputs ? (
                  <div className="space-y-1.5">
                    {draftInputs.map((val, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          value={val}
                          onChange={(e) => {
                            const next = [...draftInputs];
                            next[i] = e.target.value;
                            setDraftInputs(next);
                          }}
                          placeholder="Input item"
                          className="flex-1 text-xs px-2 py-1 border border-input rounded bg-background"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => setDraftInputs(draftInputs.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 gap-1 text-[11px] text-blue-600"
                      onClick={() => setDraftInputs([...draftInputs, ''])}
                    >
                      <Plus className="h-3 w-3" />
                      Add input
                    </Button>
                  </div>
                ) : inputs.length > 0 ? (
                  <ul className="space-y-1">
                    {inputs.map((i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  placeholder('No inputs defined yet')
                )}
              </div>
              <div className="rounded-md border bg-white p-3">
                <div className="flex items-center justify-between">
                  {blockHeader(ArrowUpFromLine, '3. Outputs', 'emerald')}
                  {!editingOutputs ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 -mt-1 gap-1 text-[11px]"
                      onClick={handleStartEditOutputs}
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1 -mt-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setEditingOutputs(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 px-2 gap-1 text-[11px]"
                        disabled={nodeProcess.saveProcess.isPending}
                        onClick={handleSaveOutputs}
                      >
                        {nodeProcess.saveProcess.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {editingOutputs ? (
                  <div className="space-y-1.5">
                    {draftOutputs.map((val, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          value={val}
                          onChange={(e) => {
                            const next = [...draftOutputs];
                            next[i] = e.target.value;
                            setDraftOutputs(next);
                          }}
                          placeholder="Output item"
                          className="flex-1 text-xs px-2 py-1 border border-input rounded bg-background"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => setDraftOutputs(draftOutputs.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 gap-1 text-[11px] text-emerald-600"
                      onClick={() => setDraftOutputs([...draftOutputs, ''])}
                    >
                      <Plus className="h-3 w-3" />
                      Add output
                    </Button>
                  </div>
                ) : outputs.length > 0 ? (
                  <ul className="space-y-1">
                    {outputs.map((o) => (
                      <li key={o} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  placeholder('No outputs defined yet')
                )}
              </div>
            </div>

            {/* Block 4 — Process Steps (horizontal stepper) */}
            <div className="rounded-md border bg-white p-3">
              <div className="flex items-center justify-between">
                {blockHeader(ListOrdered, '4. Process Steps', 'amber')}
                {!editingSteps ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 -mt-1 gap-1 text-[11px]"
                    onClick={handleStartEditSteps}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1 -mt-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setEditingSteps(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 px-2 gap-1 text-[11px]"
                      disabled={nodeProcess.saveProcess.isPending}
                      onClick={handleSaveSteps}
                    >
                      {nodeProcess.saveProcess.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {editingSteps ? (
                <div className="space-y-1.5">
                  {draftSteps.map((val, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="flex-shrink-0 mt-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        {i + 1}
                      </span>
                      <Textarea
                        value={val}
                        onChange={(e) => {
                          const next = [...draftSteps];
                          next[i] = e.target.value;
                          setDraftSteps(next);
                        }}
                        placeholder="Describe this step"
                        className="flex-1 min-h-[40px] text-xs"
                      />
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground"
                          disabled={i === 0}
                          onClick={() => {
                            const next = [...draftSteps];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            setDraftSteps(next);
                          }}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground"
                          disabled={i === draftSteps.length - 1}
                          onClick={() => {
                            const next = [...draftSteps];
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            setDraftSteps(next);
                          }}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground"
                        onClick={() => setDraftSteps(draftSteps.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 gap-1 text-[11px] text-amber-700"
                    onClick={() => setDraftSteps([...draftSteps, ''])}
                  >
                    <Plus className="h-3 w-3" />
                    Add step
                  </Button>
                </div>
              ) : steps.length > 0 ? (
                <ol className="space-y-1.5">
                  {steps.map((s) => (
                    <li key={s.step} className="flex items-start gap-2 text-xs">
                      <span className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        {s.step}
                      </span>
                      <span className="text-slate-700">{s.description}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                placeholder('No steps defined yet')
              )}
            </div>

            {/* Block 5 — Controls (Required SOPs) */}
            <div className="rounded-md border bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                {blockHeader(Link2, '5. Controls (Required SOPs)', 'purple')}
                {sopRecommendations.length > 0 && (
                  <span className="text-[11px] text-muted-foreground -mt-1">
                    {sopRecommendations.length}
                    {missingSops > 0 && (
                      <span className="text-red-600 font-medium">
                        {' '}· {missingSops} missing
                      </span>
                    )}
                  </span>
                )}
              </div>
              {sopRecommendations.length === 0 ? (
                placeholder('No SOPs recommended for this node')
              ) : (
                <ScrollArea className="max-h-[260px]">
                  <div className="space-y-1.5 pr-1">
                    {sopRecommendations.map((sop) => {
                      const status = sopStatuses?.find(
                        (s) => s.sopNumber === sop.sopNumber,
                      );
                      const displayId =
                        status?.displayId || formatSopDisplayId(sop.sopNumber);
                      const docName =
                        status?.documentName || sop.clauseDescription;
                      const trackStyles = TRACK_BADGE_STYLES[sop.track];
                      const s = status?.status ?? 'missing';
                      const statusStyles =
                        s === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s === 'in-review' || s === 'draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : s === 'not-applicable'
                          ? 'bg-slate-50 text-slate-500 border-slate-200'
                          : 'bg-red-50 text-red-700 border-red-200';
                      const statusLabel =
                        s === 'in-review'
                          ? 'In review'
                          : s === 'not-applicable'
                          ? 'N/A'
                          : s.charAt(0).toUpperCase() + s.slice(1);
                      return (
                        <button
                          key={sop.sopNumber}
                          type="button"
                          onClick={() => onSopRowClick(sop, status)}
                          className={cn(
                            'w-full text-left p-2 rounded-md border bg-white hover:bg-muted/40 transition-colors',
                            'flex items-start gap-2',
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-semibold text-slate-700">
                                {displayId}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[9px] font-bold px-1 py-0 h-4 border-transparent',
                                  trackStyles?.bg,
                                  trackStyles?.text,
                                )}
                              >
                                {sop.track}
                              </Badge>
                              {status?.tier === 'A' && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-slate-200 text-slate-400"
                                >
                                  Tier A
                                </Badge>
                              )}
                              {status?.tier === 'B' && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-slate-300 text-slate-500"
                                >
                                  Tier B
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 truncate mt-0.5">
                              {docName}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] h-4 px-1.5 flex-shrink-0',
                              statusStyles,
                            )}
                          >
                            {statusLabel}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Block 6 — Metrics / Effectiveness */}
            <div className="rounded-md border bg-white p-3">
              {blockHeader(Activity, '6. Metrics / Effectiveness', 'slate')}
              <div className="grid grid-cols-3 gap-2">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5 text-center"
                  >
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        m.tone || 'text-slate-700',
                      )}
                    >
                      {m.value}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}