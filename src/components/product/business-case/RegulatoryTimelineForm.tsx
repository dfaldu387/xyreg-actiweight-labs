import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, Loader2, Plus, X, Globe, AlertTriangle } from "lucide-react";
import { useRegulatoryTimeline } from "@/hooks/useRegulatoryTimeline";
import { toast } from "sonner";

interface RegulatoryTimelineFormProps {
  productId: string;
  companyId: string;
}

interface MarketTimeline {
  market: string;
  submission_date: string | null;
  approval_date_best: string | null;
  approval_date_expected: string | null;
  approval_date_worst: string | null;
}

interface RegulatoryMilestone {
  milestone: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending';
  market: string;
}

interface RegulatoryDependency {
  dependency: string;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export function RegulatoryTimelineForm({ productId, companyId }: RegulatoryTimelineFormProps) {
  const { data, isLoading, save, isSaving } = useRegulatoryTimeline(productId, companyId);
  
  const [formData, setFormData] = useState({
    market_timelines: [] as MarketTimeline[],
    milestones: [] as RegulatoryMilestone[],
    dependencies: [] as RegulatoryDependency[],
    benchmark_notes: "",
    similar_device_timeline_months: "",
  });

  const [newTimeline, setNewTimeline] = useState<MarketTimeline>({
    market: "US",
    submission_date: "",
    approval_date_best: "",
    approval_date_expected: "",
    approval_date_worst: "",
  });

  const [newMilestone, setNewMilestone] = useState<RegulatoryMilestone>({
    milestone: "",
    date: "",
    status: "pending",
    market: "US",
  });

  const [newDependency, setNewDependency] = useState<RegulatoryDependency>({
    dependency: "",
    impact: "medium",
    mitigation: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        market_timelines: (data.market_timelines as MarketTimeline[]) || [],
        milestones: (data.milestones as RegulatoryMilestone[]) || [],
        dependencies: (data.dependencies as RegulatoryDependency[]) || [],
        benchmark_notes: data.benchmark_notes || "",
        similar_device_timeline_months: data.similar_device_timeline_months?.toString() || "",
      });
    }
  }, [data]);

  const addTimeline = () => {
    if (!newTimeline.market) return;
    setFormData({ ...formData, market_timelines: [...formData.market_timelines, newTimeline] });
    setNewTimeline({
      market: "US",
      submission_date: "",
      approval_date_best: "",
      approval_date_expected: "",
      approval_date_worst: "",
    });
  };

  const removeTimeline = (index: number) => {
    setFormData({ ...formData, market_timelines: formData.market_timelines.filter((_, i) => i !== index) });
  };

  const addMilestone = () => {
    if (!newMilestone.milestone.trim()) return;
    setFormData({ ...formData, milestones: [...formData.milestones, newMilestone] });
    setNewMilestone({ milestone: "", date: "", status: "pending", market: "US" });
  };

  const removeMilestone = (index: number) => {
    setFormData({ ...formData, milestones: formData.milestones.filter((_, i) => i !== index) });
  };

  const addDependency = () => {
    if (!newDependency.dependency.trim()) return;
    setFormData({ ...formData, dependencies: [...formData.dependencies, newDependency] });
    setNewDependency({ dependency: "", impact: "medium", mitigation: "" });
  };

  const removeDependency = (index: number) => {
    setFormData({ ...formData, dependencies: formData.dependencies.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      await save({
        market_timelines: formData.market_timelines,
        milestones: formData.milestones,
        dependencies: formData.dependencies,
        benchmark_notes: formData.benchmark_notes || null,
        similar_device_timeline_months: formData.similar_device_timeline_months 
          ? parseInt(formData.similar_device_timeline_months) 
          : null,
      });
      toast.success("Regulatory timeline saved");
    } catch (error) {
      toast.error("Failed to save regulatory timeline");
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

  const markets = [
    { value: "US", label: "United States (FDA)" },
    { value: "EU", label: "European Union (MDR)" },
    { value: "UK", label: "United Kingdom (UKCA)" },
    { value: "CA", label: "Canada (Health Canada)" },
    { value: "AU", label: "Australia (TGA)" },
    { value: "JP", label: "Japan (PMDA)" },
    { value: "CN", label: "China (NMPA)" },
    { value: "BR", label: "Brazil (ANVISA)" },
  ];

  const impactColors: Record<string, string> = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-yellow-500 text-black",
    low: "bg-muted text-muted-foreground",
  };

  const statusColors: Record<string, string> = {
    completed: "bg-green-500 text-white",
    in_progress: "bg-blue-500 text-white",
    pending: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Regulatory Timeline
        </CardTitle>
        <CardDescription>
          Plan regulatory milestones with best/expected/worst case scenarios for each target market
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benchmark Info */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">Benchmark & Reference</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Similar Device Timeline (months)</Label>
              <Input
                type="number"
                value={formData.similar_device_timeline_months}
                onChange={(e) => setFormData({ ...formData, similar_device_timeline_months: e.target.value })}
                placeholder="e.g., 18"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Benchmark Notes</Label>
            <Textarea
              value={formData.benchmark_notes}
              onChange={(e) => setFormData({ ...formData, benchmark_notes: e.target.value })}
              placeholder="Reference similar device approvals, historical timelines..."
              rows={2}
            />
          </div>
        </div>

        {/* Market Timelines */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Market Authorization Timelines
          </h3>
          
          <div className="grid grid-cols-5 gap-2 items-end">
            <Select value={newTimeline.market} onValueChange={(v) => setNewTimeline({ ...newTimeline, market: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {markets.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-xs">Submission</Label>
              <Input
                type="date"
                value={newTimeline.submission_date || ""}
                onChange={(e) => setNewTimeline({ ...newTimeline, submission_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-green-600">Best</Label>
              <Input
                type="date"
                value={newTimeline.approval_date_best || ""}
                onChange={(e) => setNewTimeline({ ...newTimeline, approval_date_best: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-yellow-600">Expected</Label>
              <Input
                type="date"
                value={newTimeline.approval_date_expected || ""}
                onChange={(e) => setNewTimeline({ ...newTimeline, approval_date_expected: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-red-600">Worst</Label>
                <Input
                  type="date"
                  value={newTimeline.approval_date_worst || ""}
                  onChange={(e) => setNewTimeline({ ...newTimeline, approval_date_worst: e.target.value })}
                />
              </div>
              <Button type="button" onClick={addTimeline} className="mt-auto">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {formData.market_timelines.map((timeline, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{timeline.market}</Badge>
                  <span className="text-sm">Submit: {timeline.submission_date || "-"}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">{timeline.approval_date_best || "-"}</span>
                  <span className="text-yellow-600">{timeline.approval_date_expected || "-"}</span>
                  <span className="text-red-600">{timeline.approval_date_worst || "-"}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeTimeline(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">Key Milestones</h3>
          
          <div className="grid grid-cols-5 gap-2 items-end">
            <Input
              value={newMilestone.milestone}
              onChange={(e) => setNewMilestone({ ...newMilestone, milestone: e.target.value })}
              placeholder="Milestone name"
            />
            <Input
              type="date"
              value={newMilestone.date}
              onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
            />
            <Select value={newMilestone.market} onValueChange={(v) => setNewMilestone({ ...newMilestone, market: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {markets.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newMilestone.status} onValueChange={(v: any) => setNewMilestone({ ...newMilestone, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={addMilestone}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            {formData.milestones.map((ms, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{ms.market}</Badge>
                  <span>{ms.milestone}</span>
                  <Badge className={statusColors[ms.status]}>{ms.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{ms.date || "-"}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dependencies / Risks */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dependencies & Risks
          </h3>
          
          <div className="grid grid-cols-4 gap-2 items-end">
            <Input
              value={newDependency.dependency}
              onChange={(e) => setNewDependency({ ...newDependency, dependency: e.target.value })}
              placeholder="Dependency / Risk"
            />
            <Select value={newDependency.impact} onValueChange={(v: any) => setNewDependency({ ...newDependency, impact: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Impact</SelectItem>
                <SelectItem value="medium">Medium Impact</SelectItem>
                <SelectItem value="low">Low Impact</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={newDependency.mitigation}
              onChange={(e) => setNewDependency({ ...newDependency, mitigation: e.target.value })}
              placeholder="Mitigation strategy"
            />
            <Button type="button" onClick={addDependency}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            {formData.dependencies.map((dep, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge className={impactColors[dep.impact]}>{dep.impact}</Badge>
                  <span>{dep.dependency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{dep.mitigation || "No mitigation"}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeDependency(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Regulatory Timeline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
