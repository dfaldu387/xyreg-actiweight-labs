
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChevronRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { cleanPhaseName } from "@/utils/phaseNumbering";
import { toast } from "sonner";

interface LifecyclePhasesProps {
  companyId: string;
  currentPhase?: string;
  onPhaseChange?: (phaseName: string) => void;
}

export function LifecyclePhases({ companyId, currentPhase, onPhaseChange }: LifecyclePhasesProps) {
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCompanyPhases();
  }, [companyId]);

  const loadCompanyPhases = async () => {
    try {
      setLoading(true);
      
      // Get company phases from database
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      setPhases(phasesData.activePhases);

      // Calculate progress for each phase (simplified calculation)
      const progressData: Record<string, number> = {};
      for (const phase of phasesData.activePhases) {
        // For now, use position-based progress calculation
        // In a real implementation, this would be based on document completion
        const totalPhases = phasesData.activePhases.length;
        const currentPosition = phase.position || 0;
        progressData[phase.name] = Math.min((currentPosition / totalPhases) * 100, 100);
      }
      setPhaseProgress(progressData);

    } catch (error) {
      console.error('Error loading company phases:', error);
      toast.error('Failed to load lifecycle phases');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseStatus = (phaseName: string) => {
    if (phaseName === currentPhase) {
      return 'current';
    }
    
    const phase = phases.find(p => p.name === phaseName);
    if (!phase) return 'pending';
    
    const currentPhaseIndex = phases.findIndex(p => p.name === currentPhase);
    const phaseIndex = phases.findIndex(p => p.name === phaseName);
    
    if (currentPhaseIndex === -1) return 'pending';
    
    return phaseIndex < currentPhaseIndex ? 'completed' : 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner className="mr-2" />
          Loading lifecycle phases...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle Phases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No lifecycle phases configured for this company.
          </p>
        ) : (
          phases.map((phase, index) => {
            const status = getPhaseStatus(phase.name);
            const progress = phaseProgress[phase.name] || 0;
            const displayName = cleanPhaseName(phase.name);
            
            return (
              <div
                key={phase.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${getStatusColor(status)}`}
                onClick={() => onPhaseChange?.(phase.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <div>
                      <h4 className="font-medium">{displayName}</h4>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Position {phase.position || index + 1}
                    </Badge>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
                
                {status === 'current' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {phases.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Phases: {phases.length}</span>
              <span>
                Current: {currentPhase || 'Not set'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
