import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, ArrowRight, Lightbulb } from 'lucide-react';
import { useProductPhaseDependencies } from '@/hooks/useProductPhaseDependencies';
import type { ProductPhaseDependency } from '@/services/productPhaseDependencyService';

interface DependencyEditDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  phaseId: string;
  phaseName: string;
  availablePhases: Array<{ id: string; name: string; position: number }>;
  onDependenciesChange?: () => void;
}

export function DependencyEditDialog({
  open,
  onClose,
  productId,
  phaseId,
  phaseName,
  availablePhases,
  onDependenciesChange
}: DependencyEditDialogProps) {
  const {
    dependencies,
    loadDependencies,
    createDependency,
    updateDependency,
    deleteDependency,
    importCompanyDependencies,
    getDependencyTypeLabel,
    getDependencyTypeDescription
  } = useProductPhaseDependencies(productId);

  const [newDependency, setNewDependency] = useState({
    sourcePhaseId: '',
    dependencyType: 'finish_to_start' as ProductPhaseDependency['dependency_type'],
    lagDays: 0
  });

  useEffect(() => {
    if (open) {
      loadDependencies();
    }
  }, [open, loadDependencies]);

  // Get dependencies where this phase is the target (incoming dependencies)
  const incomingDependencies = dependencies.filter(dep => dep.target_phase_id === phaseId);
  
  // Get dependencies where this phase is the source (outgoing dependencies)
  const outgoingDependencies = dependencies.filter(dep => dep.source_phase_id === phaseId);

  // Get available predecessor phases (excluding self and phases that already have dependencies)
  const availablePredecessors = availablePhases.filter(phase => 
    phase.id !== phaseId && 
    !incomingDependencies.some(dep => dep.source_phase_id === phase.id)
  );

  const handleAddDependency = async () => {
    if (!newDependency.sourcePhaseId) return;

    const result = await createDependency({
      product_id: productId,
      source_phase_id: newDependency.sourcePhaseId,
      target_phase_id: phaseId,
      dependency_type: newDependency.dependencyType,
      lag_days: newDependency.lagDays
    });

    if (result.success) {
      setNewDependency({
        sourcePhaseId: '',
        dependencyType: 'finish_to_start',
        lagDays: 0
      });
      onDependenciesChange?.();
    }
  };

  const handleUpdateDependency = async (depId: string, updates: Partial<Pick<ProductPhaseDependency, 'dependency_type' | 'lag_days'>>) => {
    await updateDependency(depId, updates);
    onDependenciesChange?.();
  };

  const handleDeleteDependency = async (depId: string) => {
    await deleteDependency(depId);
    onDependenciesChange?.();
  };

  const getPhaseNameById = (id: string) => {
    return availablePhases.find(p => p.id === id)?.name || 'Unknown Phase';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Dependencies - {phaseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incoming Dependencies */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Predecessors (Phases this depends on)</h3>
            
            {incomingDependencies.length > 0 ? (
              <div className="space-y-3">
                {incomingDependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getPhaseNameById(dep.source_phase_id)}</Badge>
                        <span className="text-sm text-muted-foreground">→</span>
                        <Badge variant="secondary">{phaseName}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Dependency Type</Label>
                          <Select
                            value={dep.dependency_type}
                            onValueChange={(value) => handleUpdateDependency(dep.id, { 
                              dependency_type: value as ProductPhaseDependency['dependency_type'] 
                            })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="finish_to_start">Finish to Start (FS)</SelectItem>
                              <SelectItem value="start_to_start">Start to Start (SS)</SelectItem>
                              <SelectItem value="finish_to_finish">Finish to Finish (FF)</SelectItem>
                              <SelectItem value="start_to_finish">Start to Finish (SF)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getDependencyTypeDescription(dep.dependency_type)}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Lag Days</Label>
                          <Input
                            type="number"
                            value={dep.lag_days}
                            onChange={(e) => handleUpdateDependency(dep.id, { 
                              lag_days: parseInt(e.target.value) || 0 
                            })}
                            className="h-8"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDependency(dep.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No predecessor dependencies defined.</p>
            )}

            {/* Quick Actions */}
            <div className="mt-4 space-y-3">
              {/* Smart suggestions */}
              {availablePredecessors.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p className="font-medium mb-2">Quick Setup:</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Create sequential dependency with previous phase
                          const prevPhase = availablePredecessors.find(p => 
                            p.position === Math.max(...availablePredecessors.map(ph => ph.position))
                          );
                          if (prevPhase) {
                            setNewDependency({
                              sourcePhaseId: prevPhase.id,
                              dependencyType: 'finish_to_start',
                              lagDays: 0
                            });
                          }
                        }}
                        className="bg-white hover:bg-blue-100"
                      >
                        Sequential Flow
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Add new dependency */}
              {availablePredecessors.length > 0 && (
                <div className="p-4 border border-dashed rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add Predecessor</span>
                  </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Predecessor Phase</Label>
                    <Select value={newDependency.sourcePhaseId} onValueChange={(value) => 
                      setNewDependency(prev => ({ ...prev, sourcePhaseId: value }))
                    }>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select phase..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePredecessors.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select 
                      value={newDependency.dependencyType} 
                      onValueChange={(value) => 
                        setNewDependency(prev => ({ 
                          ...prev, 
                          dependencyType: value as ProductPhaseDependency['dependency_type'] 
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finish_to_start">FS</SelectItem>
                        <SelectItem value="start_to_start">SS</SelectItem>
                        <SelectItem value="finish_to_finish">FF</SelectItem>
                        <SelectItem value="start_to_finish">SF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Lag Days</Label>
                    <Input
                      type="number"
                      value={newDependency.lagDays}
                      onChange={(e) => setNewDependency(prev => ({ 
                        ...prev, 
                        lagDays: parseInt(e.target.value) || 0 
                      }))}
                      className="h-8"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleAddDependency}
                  disabled={!newDependency.sourcePhaseId}
                  className="mt-3"
                  size="sm"
                >
                  Add Dependency
                </Button>
                </div>
              )}
            </div>
          </div>

          {/* Outgoing Dependencies (Read-only) */}
          {outgoingDependencies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Successors (Phases that depend on this)</h3>
              <div className="space-y-2">
                {outgoingDependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline">{phaseName}</Badge>
                    <span className="text-sm text-muted-foreground">→</span>
                    <Badge variant="secondary">{getPhaseNameById(dep.target_phase_id)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      ({getDependencyTypeLabel(dep.dependency_type)}, {dep.lag_days} days)
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                To modify these dependencies, edit the successor phases.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}