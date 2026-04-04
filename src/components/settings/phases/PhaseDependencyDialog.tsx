import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, ArrowRight, Clock, PlayCircle, Square, StopCircle } from 'lucide-react';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { ConsolidatedPhase } from '@/services/consolidatedPhaseService';
import { type DependencyType } from '@/services/phaseDependencyService';
import { toast } from 'sonner';

interface PhaseDependencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: ConsolidatedPhase;
  availablePhases: ConsolidatedPhase[];
  companyId: string;
  onDataChange?: () => void;
}

export function PhaseDependencyDialog({
  open,
  onOpenChange,
  phase,
  availablePhases,
  companyId,
  onDataChange
}: PhaseDependencyDialogProps) {
  const [sourcePhaseId, setSourcePhaseId] = useState<string>('');
  const [targetPhaseId, setTargetPhaseId] = useState<string>('');
  const [dependencyType, setDependencyType] = useState<DependencyType>('finish_to_start');
  const [lagDays, setLagDays] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);

  const {
    dependencies,
    isLoading,
    loadDependencies,
    createDependency,
    deleteDependency,
    getPhaseDependencies,
    getDependencyTypeLabel,
    getDependencyTypeDescription,
  } = usePhaseDependencies(companyId);

  useEffect(() => {
    if (open && companyId) {
      loadDependencies();
    }
  }, [open, companyId, loadDependencies]);

  const [phaseDependencies, setPhaseDependencies] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  
  useEffect(() => {
    console.log('[PhaseDependencyDialog] useEffect triggered!', { 
      open, 
      phaseId: phase.id, 
      phase: phase,
      hasGetPhaseDependencies: !!getPhaseDependencies 
    });
    
    const fetchPhaseDependencies = async () => {
      if (phase.id && open) {
        console.log('[PhaseDependencyDialog] About to call getPhaseDependencies with phase ID:', phase.id);
        console.log('[PhaseDependencyDialog] Expected phase ID for Finalization & Transfer: af990121-d1ff-4be7-8b87-1a0895c0f05f');
        console.log('[PhaseDependencyDialog] Phase ID matches expected?', phase.id === 'af990121-d1ff-4be7-8b87-1a0895c0f05f');
        
        try {
          const response = await getPhaseDependencies(phase.id);
          console.log('[PhaseDependencyDialog] Response received:', response);
          if (response && response.success) {
            console.log('[PhaseDependencyDialog] Setting dependencies:', {
              incoming: response.incoming?.length || 0,
              outgoing: response.outgoing?.length || 0,
              incomingData: response.incoming,
              outgoingData: response.outgoing
            });
            setPhaseDependencies({
              incoming: response.incoming || [],
              outgoing: response.outgoing || []
            });
          } else {
            console.error('[PhaseDependencyDialog] Failed to load phase dependencies:', response?.error);
            setPhaseDependencies({ incoming: [], outgoing: [] });
          }
        } catch (error) {
          console.error('[PhaseDependencyDialog] Error in fetchPhaseDependencies:', error);
          setPhaseDependencies({ incoming: [], outgoing: [] });
        }
      } else {
        console.log('[PhaseDependencyDialog] Not fetching - conditions not met:', { phaseId: phase.id, open });
      }
    };
    
    if (open && phase.id) {
      fetchPhaseDependencies();
    }
  }, [phase.id, open]);

  const incomingDeps = phaseDependencies.incoming || [];
  const outgoingDeps = phaseDependencies.outgoing || [];
  
  console.log('[PhaseDependencyDialog] Current dependencies state:', {
    incoming: incomingDeps.length,
    outgoing: outgoingDeps.length,
    incomingDeps,
    outgoingDeps
  });

  // Check if a dependency already exists
  const dependencyExists = (sourcePhaseId: string, targetPhaseId: string, dependencyType: string) => {
    const allDeps = [...incomingDeps, ...outgoingDeps];
    return allDeps.some(dep => 
      dep.source_phase_id === sourcePhaseId && 
      dep.target_phase_id === targetPhaseId && 
      dep.dependency_type === dependencyType
    );
  };

  const handleCreateDependency = async () => {
    // Require both phases for any dependency
    if (!sourcePhaseId || !targetPhaseId) {
      toast.error('Please select both source and target phases');
      return;
    }

    if (sourcePhaseId === targetPhaseId) {
      toast.error('A phase cannot depend on itself');
      return;
    }

    // Check if this exact dependency already exists
    if (dependencyExists(sourcePhaseId, targetPhaseId, dependencyType)) {
      toast.error(`A ${getDependencyTypeLabel(dependencyType)} dependency already exists between these phases`);
      setIsCreating(false);
      return;
    }

    setIsCreating(true);
    
    // For now, simplify by always creating normal dependencies
    // The span logic needs to be handled differently since the table doesn't have end_phase_id
    const dependencyConfig = {
      source_phase_id: sourcePhaseId,
      target_phase_id: targetPhaseId,
      dependency_type: dependencyType,
      lag_days: lagDays,
      company_id: companyId,
    };

    const result = await createDependency(dependencyConfig);

    if (result.success) {
      // Refresh the local phase dependencies state
      const deps = await getPhaseDependencies(phase.id);
      if (deps.success) {
        setPhaseDependencies(deps);
      }
      setSourcePhaseId('');
      setTargetPhaseId('');
      setDependencyType('finish_to_start');
      setLagDays(0);
      onDataChange?.();
    }
    setIsCreating(false);
  };

  const handleDeleteDependency = async (dependencyId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling that might close the dialog
    event?.stopPropagation();
    
    try {
      const result = await deleteDependency(dependencyId);
      if (result.success) {
        // Refresh the local phase dependencies state
        const deps = await getPhaseDependencies(phase.id);
        if (deps.success) {
          setPhaseDependencies(deps);
        }
        onDataChange?.();
        toast.success('Dependency deleted successfully');
      } else {
        toast.error('Failed to delete dependency');
      }
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast.error('Failed to delete dependency');
    }
  };

  const getPhaseById = (id: string) => availablePhases.find(p => p.id === id);

  const getShortDependencyTypeLabel = (type: string) => {
    switch (type) {
      case 'finish_to_start': return 'FS';
      case 'start_to_start': return 'SS';
      case 'finish_to_finish': return 'FF';
      case 'start_to_finish': return 'SF';
      case 'span_between_phases': return 'SPAN';
      default: return type.toUpperCase();
    }
  };

  const getDependencyIcon = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return <StopCircle className="h-4 w-4" />;
      case 'start_to_start':
        return <PlayCircle className="h-4 w-4" />;
      case 'finish_to_finish':
        return <Square className="h-4 w-4" />;
      case 'start_to_finish':
        return <ArrowRight className="h-4 w-4" />;
      case 'span_between_phases':
        return <ArrowRight className="h-4 w-4 text-purple-600" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getDependencyColor = (type: string) => {
    switch (type) {
      case 'finish_to_start': return 'bg-blue-100 text-blue-800';
      case 'start_to_start': return 'bg-green-100 text-green-800';
      case 'finish_to_finish': return 'bg-purple-100 text-purple-800';
      case 'start_to_finish': return 'bg-orange-100 text-orange-800';
      case 'span_between_phases': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show dependency type selector when both phases are selected
  const showDependencyTypes = sourcePhaseId && targetPhaseId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Dependencies - {phase.name}</DialogTitle>
          <DialogDescription>
            Define relationships between this phase and others to control scheduling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Dependencies */}
          <div className="space-y-4">
            <h4 className="font-medium">Current Dependencies</h4>
            
            {/* Incoming Dependencies */}
            {incomingDeps.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">This phase depends on:</h5>
                {incomingDeps.map(dep => {
                  const sourcePhase = getPhaseById(dep.source_phase_id);
                  const endPhase = dep.end_phase_id ? getPhaseById(dep.end_phase_id) : null;
                  const isSpan = dep.dependency_type === 'span_between_phases';
                  
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{sourcePhase?.name || 'Unknown'}</Badge>
                        <div className="flex items-center space-x-1">
                          {getDependencyIcon(dep.dependency_type)}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <Badge variant="outline">{phase.name}</Badge>
                        {isSpan && endPhase && (
                          <>
                            <div className="flex items-center space-x-1">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                            <Badge variant="outline">{endPhase.name}</Badge>
                          </>
                        )}
                        <div className="flex items-center space-x-1">
                          <Badge className={`text-xs ${getDependencyColor(dep.dependency_type)}`}>
                            {isSpan ? 'FS' : getShortDependencyTypeLabel(dep.dependency_type)}
                          </Badge>
                          {isSpan && (
                            <>
                              <span className="text-xs text-muted-foreground">+</span>
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                FS
                              </Badge>
                            </>
                          )}
                        </div>
                        {dep.lag_days > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            +{dep.lag_days} days
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteDependency(dep.id, e)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Outgoing Dependencies */}
            {outgoingDeps.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">This phase controls:</h5>
                {outgoingDeps.map(dep => {
                  const targetPhase = getPhaseById(dep.target_phase_id);
                  const endPhase = dep.end_phase_id ? getPhaseById(dep.end_phase_id) : null;
                  const isSpan = dep.dependency_type === 'span_between_phases';
                  
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{phase.name}</Badge>
                        <div className="flex items-center space-x-1">
                          {getDependencyIcon(dep.dependency_type)}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <Badge variant="outline">{targetPhase?.name || 'Unknown'}</Badge>
                        {isSpan && endPhase && (
                          <>
                            <div className="flex items-center space-x-1">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                            <Badge variant="outline">{endPhase.name}</Badge>
                          </>
                        )}
                        <div className="flex items-center space-x-1">
                          <Badge className={`text-xs ${getDependencyColor(dep.dependency_type)}`}>
                            {isSpan ? 'FS' : getShortDependencyTypeLabel(dep.dependency_type)}
                          </Badge>
                          {isSpan && (
                            <>
                              <span className="text-xs text-muted-foreground">+</span>
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                FS
                              </Badge>
                            </>
                          )}
                        </div>
                        {dep.lag_days > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            +{dep.lag_days} days
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteDependency(dep.id, e)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {incomingDeps.length === 0 && outgoingDeps.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No dependencies defined for this phase
              </p>
            )}
          </div>

          {/* Add New Dependency */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Dependency
            </h4>
            
            {/* Phase Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourcePhase">Source Phase</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  The phase that must happen first
                </p>
                <Select value={sourcePhaseId} onValueChange={setSourcePhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source phase" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-[70]">
                    {availablePhases
                      .filter(p => p.id !== targetPhaseId)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetPhase">Target Phase</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  The phase that will be affected
                </p>
                <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target phase" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-[70]">
                    {availablePhases
                      .filter(p => p.id !== sourcePhaseId)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show dependency type selector only when both phases are selected */}
            {showDependencyTypes && (
              <div>
                <Label htmlFor="dependencyType">Dependency Type</Label>
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Dependency:</strong> {getPhaseById(sourcePhaseId)?.name} → {getPhaseById(targetPhaseId)?.name}
                </div>
                <Select value={dependencyType} onValueChange={(value: DependencyType) => setDependencyType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="finish_to_start">
                      <div className="flex flex-col">
                        <span className="font-medium">Finish to Start</span>
                        <span className="text-xs text-muted-foreground">Target starts after source finishes (most common)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="start_to_start">
                      <div className="flex flex-col">
                        <span className="font-medium">Start to Start</span>
                        <span className="text-xs text-muted-foreground">Both phases start at the same time</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="finish_to_finish">
                      <div className="flex flex-col">
                        <span className="font-medium">Finish to Finish</span>
                        <span className="text-xs text-muted-foreground">Both phases finish at the same time</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="start_to_finish">
                      <div className="flex flex-col">
                        <span className="font-medium">Start to Finish</span>
                        <span className="text-xs text-muted-foreground">Target finishes when source starts (rare)</span>
                      </div>
                     </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {getDependencyTypeDescription(dependencyType)}
                </p>
              </div>
            )}

            {/* Lag Days */}
            {showDependencyTypes && (
              <div>
                <Label htmlFor="lagDays">Lag Days (optional)</Label>
                <Input
                  id="lagDays"
                  type="number"
                  min="0"
                  value={lagDays}
                  onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Additional days to wait after the dependency condition is met
                </p>
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateDependency}
              disabled={!sourcePhaseId || isCreating}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Dependency'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}