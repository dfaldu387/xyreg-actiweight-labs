import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Clock, Calendar, Play, ChevronDown, ChevronRight, Users, FileText, BarChart2 } from "lucide-react";
import { formatDate } from "@/lib/date";
import { PhaseStatusToggle } from "./PhaseStatusToggle";
import { useEfficientPermission } from "@/hooks/useEfficientPermission";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PhaseTimelineManagerProps {
  phases: Array<{
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
    position?: number;
    likelihood_of_approval?: number;
    typical_start_day?: number;
    typical_duration_days?: number;
  }>;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  onSetCurrentPhase?: (phaseId: string) => void;
  onPhaseStatusChange?: (phaseId: string, status: "Open" | "Closed" | "N/A") => void;
  productId?: string;
  companyId?: string;
}

export function PhaseTimelineManager({
  phases,
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  onSetCurrentPhase,
  onPhaseStatusChange,
  productId,
  companyId,
}: PhaseTimelineManagerProps) {
  // State for tracking which phases are expanded
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  
  // Check user permissions for this product
  const { hasPermission, loading: permissionsLoading } = useEfficientPermission(
    'product',
    productId,
    'E' // Require editor permissions for timeline changes
  );

  // Helper functions for expansion state
  const togglePhaseExpansion = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const expandAllPhases = () => {
    setExpandedPhases(new Set(phases.map(p => p.id)));
  };

  const collapseAllPhases = () => {
    setExpandedPhases(new Set());
  };
  
  const getPhaseStatusIcon = (phase: any) => {
    if (phase.status === 'Closed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (phase.isCurrentPhase) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    if (phase.status === 'N/A') {
      return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
    return <Calendar className="h-4 w-4 text-gray-400" />;
  };

  const calculatePhaseDuration = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return null;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Phase Timeline
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllPhases}
              disabled={phases.length === 0}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllPhases}
              disabled={phases.length === 0}
            >
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          return (
            <Collapsible key={phase.id} open={isExpanded} onOpenChange={() => togglePhaseExpansion(phase.id)}>
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {getPhaseStatusIcon(phase)}
                        <h3 className="font-medium">{phase.name}</h3>
                        {phase.isCurrentPhase && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <PhaseStatusToggle
                          status={phase.status as "Open" | "Closed" | "N/A"}
                          onStatusChange={(status) => onPhaseStatusChange?.(phase.id, status)}
                          disabled={!hasPermission}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    {/* Phase Duration and Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`start-${phase.id}`}>Start Date</Label>
                        <Input
                          id={`start-${phase.id}`}
                          type="date"
                          value={phase.startDate ? phase.startDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => onPhaseStartDateChange?.(phase.id, e.target.value ? new Date(e.target.value) : undefined)}
                          disabled={!hasPermission}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`end-${phase.id}`}>End Date</Label>
                        <Input
                          id={`end-${phase.id}`}
                          type="date"
                          value={phase.endDate ? phase.endDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => onPhaseEndDateChange?.(phase.id, e.target.value ? new Date(e.target.value) : undefined)}
                          disabled={!hasPermission}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Label>Duration</Label>
                        <div className="text-sm text-muted-foreground py-2">
                          {calculatePhaseDuration(phase.startDate, phase.endDate) 
                            ? `${calculatePhaseDuration(phase.startDate, phase.endDate)} days`
                            : 'Not set'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Phase Details Section */}
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Phase Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Activities */}
                        <div className="flex items-center gap-2 text-sm">
                          <BarChart2 className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">Activities:</span>
                          <span className="font-medium">0</span>
                        </div>
                        
                        {/* Documents */}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Documents:</span>
                          <span className="font-medium">0</span>
                        </div>
                        
                        {/* Team Members */}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-medium">0</span>
                        </div>
                      </div>

                      {/* Phase Statistics */}
                      {phase.likelihood_of_approval && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Success Likelihood:</span>
                          <Badge variant="outline">
                            {phase.likelihood_of_approval}%
                          </Badge>
                        </div>
                      )}

                      {/* Typical Metrics */}
                      {(phase.typical_start_day || phase.typical_duration_days) && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <div className="font-medium mb-1">Company Standards:</div>
                          {phase.typical_start_day && (
                            <div>Typical start: Day {phase.typical_start_day}</div>
                          )}
                          {phase.typical_duration_days && (
                            <div>Typical duration: {phase.typical_duration_days} days</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Current Phase Actions */}
                    {phase.isCurrentPhase && (
                      <div className="border-t pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetCurrentPhase?.(phase.id)}
                          disabled={!hasPermission}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Mark as Current
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}