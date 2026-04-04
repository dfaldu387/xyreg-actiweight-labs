import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Save, Loader2, Plus, X, AlertTriangle, Briefcase } from "lucide-react";
import { useTeamGaps } from "@/hooks/useTeamGaps";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamGapsFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

interface Competencies {
  regulatory?: 'strong' | 'developing' | 'gap' | 'outsourced';
  clinical?: 'strong' | 'developing' | 'gap' | 'outsourced';
  commercial?: 'strong' | 'developing' | 'gap' | 'outsourced';
  manufacturing?: 'strong' | 'developing' | 'gap' | 'outsourced';
  quality?: 'strong' | 'developing' | 'gap' | 'outsourced';
  engineering?: 'strong' | 'developing' | 'gap' | 'outsourced';
}

interface CriticalGap {
  role: string;
  priority: 'high' | 'medium' | 'low';
  target_hire_date: string;
  budget: number | null;
}

interface HiringRoadmapItem {
  role: string;
  phase: string;
  reason: string;
}

interface Advisor {
  name: string;
  expertise: string;
  affiliation: string;
  linkedin_url?: string;
}

interface FounderAllocation {
  product?: number;
  fundraising?: number;
  operations?: number;
  sales?: number;
  other?: number;
}

export function TeamGapsForm({ productId, companyId, disabled = false }: TeamGapsFormProps) {
  const { data, isLoading, save, isSaving } = useTeamGaps(productId, companyId);
  const { lang } = useTranslation();
  
  const [formData, setFormData] = useState({
    competencies: {} as Competencies,
    critical_gaps: [] as CriticalGap[],
    hiring_roadmap: [] as HiringRoadmapItem[],
    advisors: [] as Advisor[],
    founder_allocation: { product: 0, fundraising: 0, operations: 0, sales: 0, other: 0 } as FounderAllocation,
  });

  const [newGap, setNewGap] = useState<CriticalGap>({ role: "", priority: "medium", target_hire_date: "", budget: null });
  const [newRoadmapItem, setNewRoadmapItem] = useState<HiringRoadmapItem>({ role: "", phase: "", reason: "" });
  const [newAdvisor, setNewAdvisor] = useState<Advisor>({ name: "", expertise: "", affiliation: "", linkedin_url: "" });

  useEffect(() => {
    if (data) {
      setFormData({
        competencies: (data.competencies as Competencies) || {},
        critical_gaps: (data.critical_gaps as CriticalGap[]) || [],
        hiring_roadmap: (data.hiring_roadmap as HiringRoadmapItem[]) || [],
        advisors: (data.advisors as Advisor[]) || [],
        founder_allocation: (data.founder_allocation as FounderAllocation) || { product: 0, fundraising: 0, operations: 0, sales: 0, other: 0 },
      });
    }
  }, [data]);

  const addGap = () => {
    if (!newGap.role.trim()) return;
    setFormData({ ...formData, critical_gaps: [...formData.critical_gaps, newGap] });
    setNewGap({ role: "", priority: "medium", target_hire_date: "", budget: null });
  };

  const removeGap = (index: number) => {
    setFormData({ ...formData, critical_gaps: formData.critical_gaps.filter((_, i) => i !== index) });
  };

  const addRoadmapItem = () => {
    if (!newRoadmapItem.role.trim()) return;
    setFormData({ ...formData, hiring_roadmap: [...formData.hiring_roadmap, newRoadmapItem] });
    setNewRoadmapItem({ role: "", phase: "", reason: "" });
  };

  const removeRoadmapItem = (index: number) => {
    setFormData({ ...formData, hiring_roadmap: formData.hiring_roadmap.filter((_, i) => i !== index) });
  };

  const addAdvisor = () => {
    if (!newAdvisor.name.trim()) return;
    setFormData({ ...formData, advisors: [...formData.advisors, newAdvisor] });
    setNewAdvisor({ name: "", expertise: "", affiliation: "", linkedin_url: "" });
  };

  const removeAdvisor = (index: number) => {
    setFormData({ ...formData, advisors: formData.advisors.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      await save({
        competencies: formData.competencies,
        critical_gaps: formData.critical_gaps,
        hiring_roadmap: formData.hiring_roadmap,
        advisors: formData.advisors,
        founder_allocation: formData.founder_allocation,
      });
      toast.success(lang('teamProfile.gapAnalysis.toast.saved'));
    } catch (error) {
      toast.error(lang('teamProfile.gapAnalysis.toast.saveFailed'));
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

  const competencyOptions = [
    { value: "strong", label: lang('teamProfile.gapAnalysis.competencyOptions.strong') },
    { value: "developing", label: lang('teamProfile.gapAnalysis.competencyOptions.developing') },
    { value: "gap", label: lang('teamProfile.gapAnalysis.competencyOptions.gap') },
    { value: "outsourced", label: lang('teamProfile.gapAnalysis.competencyOptions.outsourced') },
  ];

  const priorityColors: Record<string, string> = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-yellow-500 text-black",
    low: "bg-muted text-muted-foreground",
  };

  const competencyColors: Record<string, string> = {
    strong: "text-green-600",
    developing: "text-yellow-600",
    gap: "text-destructive",
    outsourced: "text-blue-600",
  };

  const competencyAreas = [
    { key: "regulatory", label: lang('teamProfile.gapAnalysis.competencyAreas.regulatory') },
    { key: "clinical", label: lang('teamProfile.gapAnalysis.competencyAreas.clinical') },
    { key: "engineering", label: lang('teamProfile.gapAnalysis.competencyAreas.engineering') },
    { key: "commercial", label: lang('teamProfile.gapAnalysis.competencyAreas.commercial') },
    { key: "manufacturing", label: lang('teamProfile.gapAnalysis.competencyAreas.manufacturing') },
    { key: "quality", label: lang('teamProfile.gapAnalysis.competencyAreas.quality') },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {lang('teamProfile.gapAnalysis.title')}
        </CardTitle>
        <CardDescription>
          {lang('teamProfile.gapAnalysis.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Competency Matrix */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">{lang('teamProfile.gapAnalysis.competencyMatrix')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {competencyAreas.map((comp) => (
              <div key={comp.key} className="space-y-2">
                <Label className="text-sm">{comp.label}</Label>
                <Select
                  value={(formData.competencies as any)[comp.key] || ""}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    competencies: { ...formData.competencies, [comp.key]: v }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={lang('teamProfile.gapAnalysis.placeholders.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competencyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Founder Time Allocation */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {lang('teamProfile.gapAnalysis.founderAllocation')}
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: "product", label: lang('teamProfile.gapAnalysis.allocationLabels.product') },
              { key: "fundraising", label: lang('teamProfile.gapAnalysis.allocationLabels.fundraising') },
              { key: "operations", label: lang('teamProfile.gapAnalysis.allocationLabels.operations') },
              { key: "sales", label: lang('teamProfile.gapAnalysis.allocationLabels.sales') },
              { key: "other", label: lang('teamProfile.gapAnalysis.allocationLabels.other') },
            ].map((item) => (
              <div key={item.key} className="space-y-2">
                <Label className="text-sm">{item.label}</Label>
                <Input
                  type="number"
                  value={(formData.founder_allocation as any)[item.key] || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    founder_allocation: { 
                      ...formData.founder_allocation, 
                      [item.key]: parseFloat(e.target.value) || 0 
                    }
                  })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Critical Hiring Gaps */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {lang('teamProfile.gapAnalysis.criticalHiringGaps')}
          </h3>

          <div className="grid grid-cols-4 gap-2 items-end">
            <Input
              value={newGap.role}
              onChange={(e) => setNewGap({ ...newGap, role: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.roleTitle')}
            />
            <Select value={newGap.priority} onValueChange={(v: any) => setNewGap({ ...newGap, priority: v })}>
              <SelectTrigger>
                <SelectValue placeholder={lang('teamProfile.gapAnalysis.placeholders.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{lang('teamProfile.gapAnalysis.priority.high')}</SelectItem>
                <SelectItem value="medium">{lang('teamProfile.gapAnalysis.priority.medium')}</SelectItem>
                <SelectItem value="low">{lang('teamProfile.gapAnalysis.priority.low')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={newGap.target_hire_date}
              onChange={(e) => setNewGap({ ...newGap, target_hire_date: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.targetHireDate')}
            />
            <Button type="button" onClick={addGap}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {formData.critical_gaps.map((gap, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge className={priorityColors[gap.priority]}>{lang(`teamProfile.gapAnalysis.priority.${gap.priority}`)}</Badge>
                  <span className="font-medium">{gap.role}</span>
                  {gap.target_hire_date && (
                    <span className="text-muted-foreground text-sm">{lang('teamProfile.gapAnalysis.target')} {gap.target_hire_date}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeGap(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Roadmap */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">{lang('teamProfile.gapAnalysis.hiringRoadmap')}</h3>

          <div className="grid grid-cols-4 gap-2 items-end">
            <Input
              value={newRoadmapItem.role}
              onChange={(e) => setNewRoadmapItem({ ...newRoadmapItem, role: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.role')}
            />
            <Input
              value={newRoadmapItem.phase}
              onChange={(e) => setNewRoadmapItem({ ...newRoadmapItem, phase: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.phase')}
            />
            <Input
              value={newRoadmapItem.reason}
              onChange={(e) => setNewRoadmapItem({ ...newRoadmapItem, reason: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.reason')}
            />
            <Button type="button" onClick={addRoadmapItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {formData.hiring_roadmap.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{item.phase || lang('teamProfile.gapAnalysis.tbd')}</Badge>
                  <span className="font-medium">{item.role}</span>
                  {item.reason && <span className="text-muted-foreground text-sm">- {item.reason}</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeRoadmapItem(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Advisory Board */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">{lang('teamProfile.gapAnalysis.advisoryBoard')}</h3>

          <div className="grid grid-cols-4 gap-2 items-end">
            <Input
              value={newAdvisor.name}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, name: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.name')}
            />
            <Input
              value={newAdvisor.expertise}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, expertise: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.expertise')}
            />
            <Input
              value={newAdvisor.affiliation}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, affiliation: e.target.value })}
              placeholder={lang('teamProfile.gapAnalysis.placeholders.affiliation')}
            />
            <Button type="button" onClick={addAdvisor}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {formData.advisors.map((advisor, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">{advisor.name}</span>
                  <span className="text-muted-foreground text-sm"> • {advisor.expertise}</span>
                  {advisor.affiliation && (
                    <span className="text-muted-foreground text-sm"> ({advisor.affiliation})</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAdvisor(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {lang('teamProfile.gapAnalysis.saveTeamAnalysis')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
