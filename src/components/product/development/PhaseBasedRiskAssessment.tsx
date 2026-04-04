import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LikelihoodOfApprovalSlider } from '@/components/product/timeline/LikelihoodOfApprovalSlider';
import { DevelopmentRNPVService, MilestoneData } from '@/services/developmentRNPVService';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface PhaseBasedRiskAssessmentProps {
  productId: string;
  onRiskDataChange?: (combinedLoA: number, milestones: MilestoneData[]) => void;
}

export function PhaseBasedRiskAssessment({ productId, onRiskDataChange }: PhaseBasedRiskAssessmentProps) {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, [productId]);

  const loadMilestones = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const milestoneData = await DevelopmentRNPVService.getMilestoneData(productId);
      setMilestones(milestoneData);
      
      if (milestoneData.length > 0) {
        const combinedLoS = DevelopmentRNPVService.calculateCombinedLoS(milestoneData);
        onRiskDataChange?.(combinedLoS, milestoneData);
      }
    } catch (err) {
      setError('Failed to load milestone data');
      console.error('Error loading milestones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMilestoneLoS = async (milestoneId: string, newLoS: number) => {
    setIsSaving(true);
    try {
      // Update in database
      const { error } = await supabase
        .from('lifecycle_phases')
        .update({ likelihood_of_success: newLoS })
        .eq('id', milestoneId);

      if (error) throw error;

      // Update local state
      const updatedMilestones = milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, likelihood_of_success: newLoS }
          : m
      );
      setMilestones(updatedMilestones);

      // Notify parent of the change
      const combinedLoS = DevelopmentRNPVService.calculateCombinedLoS(updatedMilestones);
      onRiskDataChange?.(combinedLoS, updatedMilestones);
      
    } catch (err) {
      setError('Failed to update milestone LoS');
      console.error('Error updating milestone LoS:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const combinedLoS = milestones.length > 0 
    ? DevelopmentRNPVService.calculateCombinedLoS(milestones)
    : 0;

  const overallRisk = (1 - combinedLoS) * 100;
  
  const getRiskLevel = (risk: number) => {
    if (risk <= 15) return { level: 'Low', color: 'bg-green-500', variant: 'default' as const };
    if (risk <= 35) return { level: 'Medium', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { level: 'High', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const riskInfo = getRiskLevel(overallRisk);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading phase risk data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadMilestones}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phase-based Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No development phases found for this product. Risk assessment is based on milestone Likelihood of Success (LoS) values.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Phase-based Risk Assessment</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMilestones}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Risk assessment based on Likelihood of Success (LoS) for each development phase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Overall Risk Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(combinedLoS * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Combined LoS</div>
          </div>
          <div className="text-center">
            <Badge variant={riskInfo.variant} className="text-lg px-3 py-1">
              {overallRisk.toFixed(1)}%
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Overall Risk</div>
          </div>
          <div className="text-center">
            <Badge variant={riskInfo.variant}>
              {riskInfo.level} Risk
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
          </div>
        </div>

        {/* Risk Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Probability</span>
            <span>{(combinedLoS * 100).toFixed(1)}%</span>
          </div>
          <Progress value={combinedLoS * 100} className="h-2" />
        </div>

        {/* Individual Phase Risk */}
        <div className="space-y-3">
          <h4 className="font-medium">Phase-by-Phase Likelihood of Success</h4>
          {milestones.map((milestone) => {
            const phaseRisk = 100 - milestone.likelihood_of_success;
            const phaseRiskInfo = getRiskLevel(phaseRisk);
            
            return (
              <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{milestone.phaseName}</span>
                    {milestone.likelihood_of_success >= 85 ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : milestone.likelihood_of_success >= 70 ? (
                      <AlertTriangle className="h-4 w-4 text-secondary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {milestone.status} • Position: {milestone.position}
                  </div>
                  {milestone.estimated_budget && (
                    <div className="text-xs text-muted-foreground">
                      Budget: ${milestone.estimated_budget.toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right min-w-[80px]">
                    <Badge variant={phaseRiskInfo.variant} className="text-xs">
                      {phaseRisk.toFixed(1)}% Risk
                    </Badge>
                  </div>
                  
                  <LikelihoodOfApprovalSlider
                    likelihood={milestone.likelihood_of_success}
                    onUpdate={(newLoS) => updateMilestoneLoS(milestone.id, newLoS)}
                    editable={true}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Risk Calculation Explanation */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <strong>Risk Calculation:</strong> The overall project risk is calculated by multiplying the LoS values of all phases. 
          For example, if Phase 1 has 90% LoS and Phase 2 has 80% LoS, the combined LoS is 90% × 80% = 72%.
          {milestones.length > 1 && (
            <div className="mt-1">
              <strong>Current calculation:</strong> {milestones.map(m => `${m.likelihood_of_success}%`).join(' × ')} = {(combinedLoS * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {isSaving && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Saving changes...
          </div>
        )}
      </CardContent>
    </Card>
  );
}