import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, X, Clock, Link, CheckCircle } from 'lucide-react';
import { ConsolidatedPhase } from '@/services/consolidatedPhaseService';
import { type DependencyType } from '@/services/phaseDependencyService';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { toast } from 'sonner';

interface DependencyCreationPanelProps {
  selectedPhases: ConsolidatedPhase[];
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DependencyCreationPanel({
  selectedPhases,
  companyId,
  onClose,
  onSuccess
}: DependencyCreationPanelProps) {
  const [sourcePhaseId, setSourcePhaseId] = useState<string>(selectedPhases[0]?.id || '');
  const [targetPhaseId, setTargetPhaseId] = useState<string>(selectedPhases[1]?.id || '');
  const [dependencyType, setDependencyType] = useState<DependencyType>('finish_to_start');
  const [lagDays, setLagDays] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);

  const { createDependency, getDependencyTypeLabel, getDependencyTypeDescription } = usePhaseDependencies(companyId);

  const handleSwapPhases = () => {
    const temp = sourcePhaseId;
    setSourcePhaseId(targetPhaseId);
    setTargetPhaseId(temp);
  };

  const handleCreateDependency = async () => {
    if (!sourcePhaseId || !targetPhaseId) {
      toast.error('Please select both source and target phases');
      return;
    }

    if (sourcePhaseId === targetPhaseId) {
      toast.error('A phase cannot depend on itself');
      return;
    }

    setIsCreating(true);
    const result = await createDependency({
      source_phase_id: sourcePhaseId,
      target_phase_id: targetPhaseId,
      dependency_type: dependencyType,
      lag_days: lagDays,
      company_id: companyId,
    });

    if (result.success) {
      toast.success('Dependency created successfully');
      onSuccess();
    }
    setIsCreating(false);
  };

  const sourcePhase = selectedPhases.find(p => p.id === sourcePhaseId);
  const targetPhase = selectedPhases.find(p => p.id === targetPhaseId);

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5" />
            Create Dependency
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Representation */}
        <div className="flex items-center justify-center space-x-2 p-4 bg-muted/30 rounded-lg">
          <Badge variant="outline" className="text-sm font-medium">
            {sourcePhase?.name || 'Select source'}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-sm font-medium">
            {targetPhase?.name || 'Select target'}
          </Badge>
        </div>

        {/* Phase Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Source Phase</Label>
            <Select value={sourcePhaseId} onValueChange={setSourcePhaseId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {selectedPhases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Target Phase</Label>
            <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {selectedPhases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleSwapPhases}>
            ⇄ Swap Direction
          </Button>
        </div>

        {/* Dependency Type */}
        <div>
          <Label className="text-sm">Dependency Type</Label>
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
          <p className="text-xs text-muted-foreground mt-1">
            {getDependencyTypeDescription(dependencyType)}
          </p>
        </div>

        {/* Lag Days */}
        <div>
          <Label className="text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Lag Days
          </Label>
          <Input
            type="number"
            value={lagDays}
            onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="h-9"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Additional days to wait after dependency condition is met
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCreateDependency}
            disabled={isCreating || !sourcePhaseId || !targetPhaseId}
            className="flex-1"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Dependency'}
          </Button>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}