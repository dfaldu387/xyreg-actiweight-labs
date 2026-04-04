import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, ArrowRight, Clock, PlayCircle, Square, StopCircle } from 'lucide-react';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { usePhaseScheduling } from '@/hooks/usePhaseScheduling';
import { type Phase } from '@/components/settings/phases/ConsolidatedPhaseDataService';
import { type DependencyType } from '@/services/phaseDependencyService';
import { toast } from 'sonner';

interface DependencyManagementProps {
  companyId: string;
  phases: Phase[];
  onDataChange?: () => void;
}

const DependencyManagement: React.FC<DependencyManagementProps> = ({
  companyId,
  phases,
  onDataChange
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourcePhaseId, setSourcePhaseId] = useState<string>('');
  const [targetPhaseId, setTargetPhaseId] = useState<string>('');
  const [dependencyType, setDependencyType] = useState<DependencyType>('finish_to_start');
  const [lagDays, setLagDays] = useState<number>(0);

  const {
    dependencies,
    isLoading: dependenciesLoading,
    loadDependencies,
    createDependency,
    deleteDependency,
    getDependencyTypeLabel,
    getDependencyTypeDescription,
  } = usePhaseDependencies(companyId);

  const {
    isLoading: schedulingLoading,
    previewData,
    hasChanges,
    generatePreview,
    applyCalculatedSchedule,
    clearPreview,
  } = usePhaseScheduling(companyId);

  useEffect(() => {
    if (companyId) {
      loadDependencies();
    }
  }, [companyId, loadDependencies]);

  const handleCreateDependency = async () => {
    if (!sourcePhaseId || !targetPhaseId) {
      toast.error('Please select both source and target phases');
      return;
    }

    if (sourcePhaseId === targetPhaseId) {
      toast.error('A phase cannot depend on itself');
      return;
    }

    const result = await createDependency({
      source_phase_id: sourcePhaseId,
      target_phase_id: targetPhaseId,
      dependency_type: dependencyType,
      lag_days: lagDays,
      company_id: companyId,
    });

    if (result.success) {
      setIsDialogOpen(false);
      setSourcePhaseId('');
      setTargetPhaseId('');
      setDependencyType('finish_to_start');
      setLagDays(0);
      onDataChange?.();
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    const result = await deleteDependency(dependencyId);
    if (result.success) {
      onDataChange?.();
    }
  };

  const handleGeneratePreview = async () => {
    await generatePreview(phases);
  };

  const handleApplySchedule = async () => {
    const success = await applyCalculatedSchedule();
    if (success) {
      onDataChange?.();
    }
  };

  const getPhaseById = (id: string) => phases.find(p => p.id === id);

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
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const isLoading = dependenciesLoading || schedulingLoading;

  return (
    <div className="space-y-6">
      {/* Dependencies Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Phase Dependencies</CardTitle>
              <CardDescription>
                Define relationships between phases to control their scheduling
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dependency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Phase Dependency</DialogTitle>
                  <DialogDescription>
                    Define how one phase depends on another for scheduling
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sourcePhase">Source Phase</Label>
                    <Select value={sourcePhaseId} onValueChange={setSourcePhaseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases.map(phase => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dependencyType">Dependency Type</Label>
                    <Select value={dependencyType} onValueChange={(value: DependencyType) => setDependencyType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finish_to_start">Finish to Start</SelectItem>
                        <SelectItem value="start_to_start">Start to Start</SelectItem>
                        <SelectItem value="finish_to_finish">Finish to Finish</SelectItem>
                        <SelectItem value="start_to_finish">Start to Finish</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getDependencyTypeDescription(dependencyType)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="targetPhase">Target Phase</Label>
                    <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases.map(phase => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lagDays">Lag Days (optional)</Label>
                    <Input
                      id="lagDays"
                      type="number"
                      value={lagDays}
                      onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Additional days to wait after the dependency condition is met
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDependency} disabled={isLoading}>
                    Create Dependency
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {dependencies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No dependencies defined yet. Add dependencies to enable automatic phase scheduling.
            </p>
          ) : (
            <div className="space-y-3">
              {dependencies.map(dependency => {
                const sourcePhase = getPhaseById(dependency.source_phase_id);
                const targetPhase = getPhaseById(dependency.target_phase_id);
                
                return (
                  <div
                    key={dependency.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{sourcePhase?.name || 'Unknown'}</Badge>
                        <div className="flex items-center space-x-1">
                          {getDependencyIcon(dependency.dependency_type)}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <Badge variant="outline">{targetPhase?.name || 'Unknown'}</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">
                          {getDependencyTypeLabel(dependency.dependency_type)}
                        </span>
                        {dependency.lag_days > 0 && (
                          <span className="ml-2 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            +{dependency.lag_days} days
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDependency(dependency.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Preview & Application */}
      {dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Automatic Scheduling</CardTitle>
            <CardDescription>
              Calculate and apply phase dates based on dependencies
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isLoading}
                  variant="outline"
                >
                  Preview Schedule
                </Button>
                
                {hasChanges && (
                  <Button
                    onClick={handleApplySchedule}
                    disabled={isLoading}
                  >
                    Apply Schedule
                  </Button>
                )}
                
                {previewData.length > 0 && (
                  <Button
                    onClick={clearPreview}
                    disabled={isLoading}
                    variant="ghost"
                  >
                    Clear Preview
                  </Button>
                )}
              </div>

              {previewData.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Schedule Preview</h4>
                  {previewData.map(preview => (
                    <div
                      key={preview.phase.id}
                      className={`flex items-center justify-between p-3 rounded ${
                        preview.isChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{preview.phase.name}</span>
                        {preview.isChanged && (
                          <Badge variant="secondary" className="ml-2">Changed</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {preview.calculatedStart.toLocaleDateString()} - {preview.calculatedEnd.toLocaleDateString()} 
                        <span className="ml-2">({preview.durationDays} days)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DependencyManagement;