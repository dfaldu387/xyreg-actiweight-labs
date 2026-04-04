import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Flag, Save, Loader2, Calendar, CheckCircle2, Circle, XCircle, ExternalLink } from "lucide-react";
import { useReadinessGates } from "@/hooks/useReadinessGates";
import { toast } from "sonner";
import { ISO_13485_PHASES } from "@/data/iso13485Phases";
import { Link } from "react-router-dom";

interface EssentialGatesTimelineFormProps {
  productId: string;
  companyId: string;
}

interface PhaseItem {
  id: string;
  name: string;
  description?: string;
  position: number;
}

interface GateData {
  phaseId: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  decision: 'go' | 'no_go' | 'conditional' | null;
  entry_criteria: string[];
  exit_criteria: string[];
  decision_makers: string[];
  decision_date: string | null;
  decision_rationale: string;
}

const defaultGateData = (phaseId: string): GateData => ({
  phaseId,
  startDate: '',
  endDate: '',
  status: 'not_started',
  decision: null,
  entry_criteria: [],
  exit_criteria: [],
  decision_makers: [],
  decision_date: null,
  decision_rationale: '',
});

export function EssentialGatesTimelineForm({ productId, companyId }: EssentialGatesTimelineFormProps) {
  const [searchParams] = useSearchParams();
  const isInvestorMode = searchParams.get('returnTo') === 'investor-share';
  
  // Fetch Product Realisation Lifecycle phases from company settings
  const { data: realisationPhases, isLoading: phasesLoading } = useQuery({
    queryKey: ['product-realisation-phases', companyId],
    queryFn: async () => {
      // First find the "Product Realisation Lifecycle" category
      const { data: category, error: catError } = await supabase
        .from('phase_categories')
        .select('id')
        .eq('name', 'Product Realisation Lifecycle')
        .single();
      
      if (catError || !category) {
        console.log('Product Realisation Lifecycle category not found, using fallback');
        return null;
      }
      
      // Get phases from this category for this company
      const { data: phases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name, description, position')
        .eq('company_id', companyId)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('position');
      
      if (phasesError) throw phasesError;
      return phases as PhaseItem[];
    },
    enabled: !!companyId
  });

  // Use real phases if available, otherwise fall back to ISO_13485_PHASES
  const phases: PhaseItem[] = useMemo(() => {
    if (realisationPhases && realisationPhases.length > 0) {
      return realisationPhases;
    }
    // Fallback to ISO 13485 phases
    return ISO_13485_PHASES.map((p, idx) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      position: idx
    }));
  }, [realisationPhases]);

  const { data, isLoading, save, isSaving } = useReadinessGates(productId, companyId);
  
  const [gates, setGates] = useState<GateData[]>([]);
  const [currentPhaseId, setCurrentPhaseId] = useState<string>('');

  // Initialize gates when phases or data changes
  useEffect(() => {
    if (phases.length > 0) {
      const savedGates = (data?.gates as any[]) || [];
      const dataAny = data as any;
      const phaseDates = (dataAny?.phase_dates as any[]) || [];
      
      const mergedGates = phases.map(phase => {
        const savedGate = savedGates.find((g: any) => g.phaseId === phase.id || g.id === phase.id);
        const phaseDate = phaseDates.find((pd: any) => pd.phaseId === phase.id);
        
        return {
          ...defaultGateData(phase.id),
          ...(savedGate || {}),
          phaseId: phase.id,
          startDate: phaseDate?.startDate || savedGate?.startDate || '',
          endDate: phaseDate?.endDate || savedGate?.endDate || '',
        };
      });
      
      setGates(mergedGates);
      
      // Set current phase - prefer saved, otherwise first phase
      const savedCurrentPhase = data?.current_gate_id || dataAny?.current_phase;
      if (savedCurrentPhase && phases.some(p => p.id === savedCurrentPhase)) {
        setCurrentPhaseId(savedCurrentPhase);
      } else if (!currentPhaseId || !phases.some(p => p.id === currentPhaseId)) {
        setCurrentPhaseId(phases[0]?.id || '');
      }
    }
  }, [phases, data]);

  const updateGate = (phaseId: string, field: keyof GateData, value: any) => {
    setGates(prev => prev.map(g => 
      g.phaseId === phaseId ? { ...g, [field]: value } : g
    ));
  };

  const handleSave = async () => {
    try {
      await save({
        gates: gates,
        current_gate_id: currentPhaseId,
        decision_log: gates
          .filter(g => g.decision && g.decision_date)
          .map(g => ({
            gate_id: g.phaseId,
            date: g.decision_date,
            decision: g.decision,
            rationale: g.decision_rationale,
            attendees: g.decision_makers,
          })),
      });
      toast.success("Gates & Timeline saved successfully");
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  if (isLoading || phasesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentPhase = phases.find(p => p.id === currentPhaseId);
  const usingRealPhases = realisationPhases && realisationPhases.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress': return <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_started: "bg-muted text-muted-foreground",
      in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      passed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return styles[status] || styles.not_started;
  };

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;
    const styles: Record<string, string> = {
      go: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      no_go: "bg-destructive/10 text-destructive border-destructive/20",
      conditional: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };
    return styles[decision];
  };

  

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Current Development Stage
          </CardTitle>
          <CardDescription>
            {usingRealPhases 
              ? 'Your Product Realisation Lifecycle phases from company settings'
              : 'Using standard ISO 13485 phases (configure your phases in Company Settings)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={currentPhaseId} onValueChange={setCurrentPhaseId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select current phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentPhase?.description && (
              <div className="text-sm text-muted-foreground">
                {currentPhase.description}
              </div>
            )}
          </div>

          {/* Visual Phase Stepper */}
          <div className="mt-6 flex items-center justify-between">
            {phases.map((phase, index) => {
              const gate = gates.find(g => g.phaseId === phase.id);
              const isCurrent = phase.id === currentPhaseId;
              
              return (
                <div key={phase.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${isCurrent 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : gate?.status === 'passed' 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-muted-foreground/30 bg-muted/50'
                        }
                      `}
                    >
                      {gate?.status === 'passed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-[100px] leading-tight ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {phase.name}
                    </span>
                  </div>
                  {index < phases.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${gate?.status === 'passed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Gates Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isInvestorMode ? 'Timeline & Milestones' : 'Timeline & Gate Decisions'}
          </CardTitle>
          <CardDescription>
            {isInvestorMode 
              ? 'Set timeline dates and phase completion status for each development stage'
              : 'Set dates, status, and go/no-go decisions for each phase'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {phases.map((phase) => {
              const gate = gates.find(g => g.phaseId === phase.id) || defaultGateData(phase.id);
              
              return (
                <AccordionItem 
                  key={phase.id} 
                  value={phase.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(gate.status)}
                        <div className="text-left">
                          <p className="font-medium">{phase.name}</p>
                          {phase.description && (
                            <p className="text-xs text-muted-foreground">{phase.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gate.startDate && gate.endDate && (
                          <span className="text-xs text-muted-foreground">
                            {gate.startDate} → {gate.endDate}
                          </span>
                        )}
                        <Badge variant="outline" className={getStatusBadge(gate.status)}>
                          {gate.status.replace('_', ' ')}
                        </Badge>
                        {gate.decision && (
                          <Badge variant="outline" className={getDecisionBadge(gate.decision)}>
                            {gate.decision.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid gap-4 pt-2">
                      {/* Dates & Status Row - simplified for investor mode */}
                      <div className={`grid gap-4 ${isInvestorMode ? 'grid-cols-3' : 'grid-cols-4'}`}>
                        <div className="space-y-2">
                          <Label className="text-xs">Start Date</Label>
                          <div className={`rounded-md p-0.5 ${gate.startDate ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                            <Input
                              type="date"
                              value={gate.startDate}
                              onChange={(e) => updateGate(phase.id, 'startDate', e.target.value)}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">End Date</Label>
                          <div className={`rounded-md p-0.5 ${gate.endDate ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                            <Input
                              type="date"
                              value={gate.endDate}
                              onChange={(e) => updateGate(phase.id, 'endDate', e.target.value)}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Select 
                            value={gate.status} 
                            onValueChange={(v: any) => updateGate(phase.id, 'status', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {isInvestorMode ? (
                                <>
                                  <SelectItem value="not_started">Planned</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="passed">Complete</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="not_started">Not Started</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="passed">Passed</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Decision dropdown - hidden in investor mode */}
                        {!isInvestorMode && (
                          <div className="space-y-2">
                            <Label className="text-xs">Decision</Label>
                            <Select 
                              value={gate.decision || ''} 
                              onValueChange={(v: any) => updateGate(phase.id, 'decision', v || null)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="go">Go</SelectItem>
                                <SelectItem value="no_go">No Go</SelectItem>
                                <SelectItem value="conditional">Conditional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Criteria Row - hidden in investor mode */}
                      {!isInvestorMode && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Entry Criteria (one per line)</Label>
                            <Textarea
                              value={gate.entry_criteria.join('\n')}
                              onChange={(e) => updateGate(phase.id, 'entry_criteria', e.target.value.split('\n').filter(c => c.trim()))}
                              placeholder="What must be true to start this phase..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Exit Criteria (one per line)</Label>
                            <Textarea
                              value={gate.exit_criteria.join('\n')}
                              onChange={(e) => updateGate(phase.id, 'exit_criteria', e.target.value.split('\n').filter(c => c.trim()))}
                              placeholder="What must be completed to pass this gate..."
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      {/* Decision Details - hidden in investor mode */}
                      {!isInvestorMode && (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Decision Date</Label>
                              <Input
                                type="date"
                                value={gate.decision_date || ''}
                                onChange={(e) => updateGate(phase.id, 'decision_date', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label className="text-xs">Decision Makers (comma-separated)</Label>
                              <Input
                                value={gate.decision_makers.join(', ')}
                                onChange={(e) => updateGate(phase.id, 'decision_makers', e.target.value.split(',').map(d => d.trim()))}
                                placeholder="CEO, VP Engineering, RA Director"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Decision Rationale</Label>
                            <Textarea
                              value={gate.decision_rationale}
                              onChange={(e) => updateGate(phase.id, 'decision_rationale', e.target.value)}
                              placeholder="Why was this decision made? Document key factors..."
                              rows={2}
                            />
                          </div>
                        </>
                      )}

                      {/* Simplified milestone notes for investor mode */}
                      {isInvestorMode && (
                        <div className="space-y-2">
                          <Label className="text-xs">Key Milestones (optional)</Label>
                          <Textarea
                            value={gate.decision_rationale}
                            onChange={(e) => updateGate(phase.id, 'decision_rationale', e.target.value)}
                            placeholder="Key achievements or goals for this phase..."
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Navigation hint to Milestones */}
      {!isInvestorMode && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                For detailed milestone and document tracking per phase, visit the Dashboard
              </div>
              <Link to={`/app/product/${productId}/dashboard`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Gates & Timeline
        </Button>
      </div>
    </div>
  );
}
