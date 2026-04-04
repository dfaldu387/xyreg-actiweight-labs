import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Save, Loader2, Plus, X, Flag } from "lucide-react";
import { useReadinessGates } from "@/hooks/useReadinessGates";
import { toast } from "sonner";

interface ReadinessGatesFormProps {
  productId: string;
  companyId: string;
}

interface ReadinessGate {
  id: string;
  name: string;
  order: number;
  entry_criteria: string[];
  exit_criteria: string[];
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  decision_date: string | null;
  decision: 'go' | 'no_go' | 'conditional' | null;
  decision_makers: string[];
}

interface GateDecision {
  gate_id: string;
  date: string;
  decision: 'go' | 'no_go' | 'conditional';
  rationale: string;
  attendees: string[];
}

export function ReadinessGatesForm({ productId, companyId }: ReadinessGatesFormProps) {
  const { data, isLoading, save, isSaving } = useReadinessGates(productId, companyId);
  
  const [formData, setFormData] = useState({
    gates: [] as ReadinessGate[],
    current_gate_id: "",
    decision_log: [] as GateDecision[],
  });

  const [newGate, setNewGate] = useState<{
    name: string;
    entry_criteria: string;
    exit_criteria: string;
    status: 'not_started' | 'in_progress' | 'passed' | 'failed';
    decision: 'go' | 'no_go' | 'conditional' | '';
    decision_makers: string;
  }>({
    name: "",
    entry_criteria: "",
    exit_criteria: "",
    status: "not_started",
    decision: "",
    decision_makers: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      setFormData({
        gates: (data.gates as ReadinessGate[]) || [],
        current_gate_id: data.current_gate_id || "",
        decision_log: (data.decision_log as GateDecision[]) || [],
      });
    }
  }, [data]);

  const defaultGateNames = [
    "Gate 0: Idea Screening",
    "Gate 1: Concept Approval",
    "Gate 2: Feasibility Complete",
    "Gate 3: Design Freeze",
    "Gate 4: Verification Complete",
    "Gate 5: Validation Complete",
    "Gate 6: Production Release",
  ];

  const addGate = () => {
    if (!newGate.name.trim()) return;
    
    const gate: ReadinessGate = {
      id: crypto.randomUUID(),
      name: newGate.name,
      order: formData.gates.length,
      entry_criteria: newGate.entry_criteria ? newGate.entry_criteria.split('\n').filter(c => c.trim()) : [],
      exit_criteria: newGate.exit_criteria ? newGate.exit_criteria.split('\n').filter(c => c.trim()) : [],
      status: newGate.status,
      decision_date: null,
      decision: newGate.decision || null,
      decision_makers: newGate.decision_makers ? newGate.decision_makers.split(',').map(d => d.trim()) : [],
    };

    if (editingIndex !== null) {
      const updated = [...formData.gates];
      updated[editingIndex] = { ...gate, id: formData.gates[editingIndex].id, order: editingIndex };
      setFormData({ ...formData, gates: updated });
      setEditingIndex(null);
    } else {
      setFormData({ ...formData, gates: [...formData.gates, gate] });
    }
    
    setNewGate({
      name: "",
      entry_criteria: "",
      exit_criteria: "",
      status: "not_started" as const,
      decision: "",
      decision_makers: "",
    });
  };

  const editGate = (index: number) => {
    const gate = formData.gates[index];
    setNewGate({
      name: gate.name,
      entry_criteria: gate.entry_criteria.join('\n'),
      exit_criteria: gate.exit_criteria.join('\n'),
      status: gate.status,
      decision: gate.decision || "",
      decision_makers: gate.decision_makers.join(', '),
    });
    setEditingIndex(index);
  };

  const removeGate = (index: number) => {
    setFormData({ ...formData, gates: formData.gates.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      await save({
        gates: formData.gates,
        current_gate_id: formData.current_gate_id || (formData.gates[0]?.id ?? ""),
        decision_log: formData.decision_log,
      });
      toast.success("Readiness gates saved");
    } catch (error) {
      toast.error("Failed to save readiness gates");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-500 text-white",
    passed: "bg-green-500 text-white",
    failed: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Product Readiness Gates
        </CardTitle>
        <CardDescription>
          Define stage gates with entry/exit criteria and track go/no-go decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Gate Selection */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">Current Gate</h3>
          <Select value={formData.current_gate_id} onValueChange={(v) => setFormData({ ...formData, current_gate_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select current gate" />
            </SelectTrigger>
            <SelectContent>
              {formData.gates.length > 0 
                ? formData.gates.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))
                : defaultGateNames.map((g, i) => (
                    <SelectItem key={i} value={g}>{g}</SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>

        {/* Gate Definition */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Flag className="h-4 w-4" />
            {editingIndex !== null ? "Edit Gate" : "Add Stage Gate"}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gate Name</Label>
              <Select value={newGate.name} onValueChange={(v) => setNewGate({ ...newGate, name: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gate name" />
                </SelectTrigger>
                <SelectContent>
                  {defaultGateNames.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newGate.status} onValueChange={(v: any) => setNewGate({ ...newGate, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Criteria (one per line)</Label>
              <Textarea
                value={newGate.entry_criteria}
                onChange={(e) => setNewGate({ ...newGate, entry_criteria: e.target.value })}
                placeholder="What must be true to enter this gate..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Exit Criteria (one per line)</Label>
              <Textarea
                value={newGate.exit_criteria}
                onChange={(e) => setNewGate({ ...newGate, exit_criteria: e.target.value })}
                placeholder="What must be completed to pass this gate..."
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={newGate.decision} onValueChange={(v: any) => setNewGate({ ...newGate, decision: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="no_go">No Go</SelectItem>
                  <SelectItem value="conditional">Conditional Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Decision Makers (comma-separated)</Label>
              <Input
                value={newGate.decision_makers}
                onChange={(e) => setNewGate({ ...newGate, decision_makers: e.target.value })}
                placeholder="e.g., CEO, VP Engineering, RA Director"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingIndex !== null && (
              <Button variant="outline" onClick={() => {
                setEditingIndex(null);
                setNewGate({
                  name: "",
                  entry_criteria: "",
                  exit_criteria: "",
                  status: "not_started",
                  decision: "",
                  decision_makers: "",
                });
              }}>
                Cancel
              </Button>
            )}
            <Button type="button" onClick={addGate}>
              <Plus className="h-4 w-4 mr-2" />
              {editingIndex !== null ? "Update Gate" : "Add Gate"}
            </Button>
          </div>
        </div>

        {/* Gates List */}
        {formData.gates.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Defined Gates</h3>
            <div className="space-y-2">
              {formData.gates.map((gate, index) => (
                <div key={gate.id} className="p-4 bg-secondary/20 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{gate.name}</span>
                      <Badge className={statusColors[gate.status]}>{gate.status.replace("_", " ")}</Badge>
                      {gate.decision && (
                        <Badge variant="outline">{gate.decision.replace("_", " ")}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editGate(index)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeGate(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Entry Criteria:</span>
                      <ul className="list-disc list-inside">
                        {gate.entry_criteria.length > 0 
                          ? gate.entry_criteria.map((c, i) => <li key={i}>{c}</li>)
                          : <li>Not defined</li>
                        }
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Exit Criteria:</span>
                      <ul className="list-disc list-inside">
                        {gate.exit_criteria.length > 0 
                          ? gate.exit_criteria.map((c, i) => <li key={i}>{c}</li>)
                          : <li>Not defined</li>
                        }
                      </ul>
                    </div>
                  </div>
                  {gate.decision_makers.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Decision Makers:</span> {gate.decision_makers.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Readiness Gates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
