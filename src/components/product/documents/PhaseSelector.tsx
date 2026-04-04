
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UnifiedPhaseUpdateService } from "@/services/unifiedPhaseUpdateService";

interface PhaseSelectorProps {
  productId: string;
  companyId: string;
  currentPhase?: string | null;
  availablePhases: any[];
  onPhaseChanged: () => void;
}

export function PhaseSelector({
  productId,
  companyId,
  currentPhase,
  availablePhases,
  onPhaseChanged
}: PhaseSelectorProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [isChanging, setIsChanging] = useState(false);

  const handlePhaseChange = async () => {
    if (!selectedPhaseId) {
      toast.error('Please select a phase');
      return;
    }

    const targetPhase = availablePhases.find(p => p.id === selectedPhaseId);
    if (!targetPhase) {
      toast.error('Invalid phase selected');
      return;
    }

    setIsChanging(true);
    try {
      console.log('Changing product phase to:', targetPhase.name);

      // Use the unified service for consistent updates
      const result = await UnifiedPhaseUpdateService.updateProductPhase(
        productId,
        selectedPhaseId,
        companyId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to change phase');
      }

      toast.success(`Product phase changed to "${targetPhase.name}"`);
      setSelectedPhaseId('');
      onPhaseChanged();

    } catch (error) {
      console.error('Error changing product phase:', error);
      toast.error('Failed to change product phase');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          Change Product Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span>Current Phase:</span>
          <Badge variant="outline">
            {currentPhase || 'Not Set'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select new phase..." />
            </SelectTrigger>
            <SelectContent>
              {availablePhases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handlePhaseChange}
            disabled={!selectedPhaseId || isChanging}
            size="sm"
          >
            {isChanging ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              'Change'
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Changing the phase will trigger creation of template-based documents for the new phase.
        </div>
      </CardContent>
    </Card>
  );
}
