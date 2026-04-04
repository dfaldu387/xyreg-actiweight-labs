import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Filter, Calendar, BarChart3 } from "lucide-react";
import { format, differenceInDays, addDays, min, max } from "date-fns";
import { TimelineAxisHeader } from "./TimelineAxisHeader";
import { TimelineDateLines } from "./TodayLine";
import { InteractiveCIBar } from "./InteractiveCIBar";
import { usePhaseCIData } from '@/hooks/usePhaseCIData';
import { TimelineMetrics, calculatePositionFromDate } from '@/utils/ganttDragHandlers';
interface Phase {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  isCurrentPhase?: boolean;
  isOverdue?: boolean;
  position: number;
}
interface PhaseDetailGanttProps {
  phase: Phase;
  product?: any;
  companyId: string;
  onBack: () => void;
}
export function PhaseDetailGantt({
  phase,
  product,
  companyId,
  onBack
}: PhaseDetailGanttProps) {
  const [filterType, setFilterType] = useState<'all' | 'document' | 'gap' | 'activity' | 'audit'>('all');

  // Load CI data for this phase
  const {
    data: ciData,
    isLoading: ciLoading,
    refetch: refetchCIData
  } = usePhaseCIData(phase.id, product?.id || '', companyId);

  // Mock CI instances for demo (replace with actual hook when available)
  const phaseCIs = useMemo(() => {
    return []; // Will be populated when useCI hook is available
  }, []);

  // Calculate phase-focused timeline metrics
  const metrics = useMemo<TimelineMetrics>(() => {
    if (!phase.startDate || !phase.endDate) {
      const now = new Date();
      const futureDate = addDays(now, 30);
      return {
        earliestDate: now,
        latestDate: futureDate,
        totalDays: 30,
        containerWidth: 800
      };
    }

    // For phase detail view, use exact phase dates for accurate positioning
    // Only add minimal padding to prevent bars from touching edges
    const phaseDuration = differenceInDays(phase.endDate, phase.startDate);
    const paddingDays = Math.max(2, Math.round(phaseDuration * 0.05)); // 5% padding or 2 days minimum

    const earliest = addDays(phase.startDate, -paddingDays);
    const latest = addDays(phase.endDate, paddingDays);
    const totalDays = differenceInDays(latest, earliest);
    return {
      earliestDate: earliest,
      latestDate: latest,
      totalDays,
      containerWidth: 800
    };
  }, [phase.startDate, phase.endDate]);

  // Calculate phase position in the focused timeline
  const phasePosition = useMemo(() => {
    if (!phase.startDate || !phase.endDate) {
      return {
        left: 0,
        width: 0
      };
    }
    const left = calculatePositionFromDate(phase.startDate, metrics);
    const right = calculatePositionFromDate(phase.endDate, metrics);
    const width = Math.max(0.5, right - left);
    return {
      left,
      width
    };
  }, [phase.startDate, phase.endDate, metrics]);

  // Group CIs by type for display
  const cisByType = useMemo(() => {
    const grouped = {
      document: [] as any[],
      gap: [] as any[],
      activity: [] as any[],
      audit: [] as any[]
    };
    phaseCIs.forEach(ci => {
      if (ci.type in grouped) {
        grouped[ci.type as keyof typeof grouped].push(ci);
      }
    });
    return grouped;
  }, [phaseCIs]);

  // Filter CIs based on selected filter
  const filteredCIs = useMemo(() => {
    if (filterType === 'all') {
      return phaseCIs;
    }
    return cisByType[filterType] || [];
  }, [phaseCIs, cisByType, filterType]);
  const totalCIs = phaseCIs.length;
  const completedCIs = phaseCIs.filter(ci => ci.status === 'completed').length;
  const progressPercentage = totalCIs > 0 ? Math.round(completedCIs / totalCIs * 100) : 0;
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {phase.name} - Detailed View
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {phase.startDate && phase.endDate && <>
                    {format(phase.startDate, 'MMM dd, yyyy')} - {format(phase.endDate, 'MMM dd, yyyy')} 
                    ({differenceInDays(phase.endDate, phase.startDate)} days)
                  </>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={phase.status === 'Completed' ? 'default' : 'secondary'}>
              {phase.status}
            </Badge>
            {/* Removed status badge under filter as requested */}
          </div>
        </div>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>All Phases</span>
          <span>&gt;</span>
          <span className="font-medium text-foreground">Activities</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter CIs:</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all', 'document', 'gap', 'activity', 'audit'] as const).map(type => {
              let count = 0;
              if (type === 'all') {
                count = (ciData?.documents.total || 0) + (ciData?.gapAnalysis.total || 0) + (ciData?.activities.length || 0) + (ciData?.audits.length || 0);
              } else if (type === 'document') {
                count = ciData?.documents.total || 0;
              } else if (type === 'gap') {
                count = ciData?.gapAnalysis.total || 0;
              } else if (type === 'activity') {
                count = ciData?.activities.length || 0;
              } else if (type === 'audit') {
                count = ciData?.audits.length || 0;
              }
              
              const label = type === 'all' ? 'All' : type === 'activity' ? 'Activities' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
              const isActive = filterType === type;
              
              return <Button 
                key={type} 
                variant={isActive ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType(type)} 
                className={`text-xs px-3 py-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-background border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </Button>;
            })}
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <span className="text-sm font-medium">{progressPercentage}%</span>
              <div className="w-16 h-2 bg-muted rounded-full">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* CI Category Overview Cards */}
          {/*  */}

          {/* Phase timeline visualization */}
          {!ciLoading && <div className="space-y-4">
              <h3 className="text-lg font-semibold">Phase Timeline</h3>
              
              {/* Timeline axis header */}
              <TimelineAxisHeader metrics={metrics} />
              
              {/* Timeline visualization */}
              <div className="overflow-x-auto">
                <div className="min-w-full" style={{
              minWidth: '800px'
            }}>
                  <div className="relative space-y-2 mt-16">
                    {/* Date lines overlay */}
                    <TimelineDateLines metrics={metrics} designFreezeDate={product?.design_freeze_date} projectedLaunchDate={product?.projected_launch_date} />
                    
                    {/* Main phase bar */}
                    <div className="relative h-8 bg-muted rounded">
                      <div className="absolute top-0 h-full bg-primary rounded transition-all duration-200" style={{
                    left: `${phasePosition.left}%`,
                    width: `${phasePosition.width}%`
                  }}>
                        <div className="flex items-center justify-center h-full text-white text-sm font-medium">
                          {phase.name}
                        </div>
                      </div>
                    </div>
                    
                     {/* Enhanced CI sub-task bars with better visualization */}
                     {(filterType === 'all' || filterType === 'document') && ciData?.documents.total > 0 && (
                       <div className="space-y-1">
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Documents Timeline</span>
                           <span>{ciData.documents.completed}/{ciData.documents.total} completed</span>
                         </div>
                         <InteractiveCIBar 
                           type="document" 
                           title={`Documents`} 
                           count={ciData.documents.total} 
                           completed={ciData.documents.completed} 
                           position={phasePosition} 
                           metrics={metrics} 
                           phaseStartDate={phase.startDate} 
                           phaseEndDate={phase.endDate} 
                           items={[]} // Documents don't have individual timeline items yet
                           onItemUpdate={(itemId, updates) => {
                             console.log('Document updated:', itemId, updates);
                             refetchCIData();
                           }} 
                         />
                       </div>
                     )}
                     
                     {(filterType === 'all' || filterType === 'gap') && ciData?.gapAnalysis.total > 0 && (
                       <div className="space-y-1">
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Gap Analysis Timeline</span>
                           <span>{ciData.gapAnalysis.completed}/{ciData.gapAnalysis.total} completed</span>
                         </div>
                         <InteractiveCIBar 
                           type="gap" 
                           title={`Gap Analysis`} 
                           count={ciData.gapAnalysis.total} 
                           completed={ciData.gapAnalysis.completed} 
                           position={phasePosition} 
                           metrics={metrics} 
                           phaseStartDate={phase.startDate} 
                           phaseEndDate={phase.endDate} 
                           items={[]} // Gap analysis items structure needs adjustment
                           onItemUpdate={(itemId, updates) => {
                             console.log('Gap analysis updated:', itemId, updates);
                             refetchCIData();
                           }} 
                         />
                       </div>
                     )}
                     
                     {(filterType === 'all' || filterType === 'activity') && ciData?.activities.length > 0 && (
                       <div className="space-y-1">
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Activities Timeline</span>
                           <span>{ciData.activities.filter(a => a.status === 'completed').length}/{ciData.activities.length} completed</span>
                         </div>
                         <InteractiveCIBar 
                           type="activity" 
                           title={`Activities`} 
                           count={ciData.activities.length} 
                           completed={ciData.activities.filter(a => a.status === 'completed').length} 
                           position={phasePosition} 
                           metrics={metrics} 
                           phaseStartDate={phase.startDate} 
                           phaseEndDate={phase.endDate} 
                           items={ciData.activities} 
                           onItemUpdate={(itemId, updates) => {
                             console.log('Activity updated:', itemId, updates);
                             refetchCIData();
                           }} 
                         />
                       </div>
                     )}
                     
                     {(filterType === 'all' || filterType === 'audit') && ciData?.audits.length > 0 && (
                       <div className="space-y-1">
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Audits Timeline</span>
                           <span>{ciData.audits.filter(a => a.status === 'completed').length}/{ciData.audits.length} completed</span>
                         </div>
                         <InteractiveCIBar 
                           type="audit" 
                           title={`Audits`} 
                           count={ciData.audits.length} 
                           completed={ciData.audits.filter(a => a.status === 'completed').length} 
                           position={phasePosition} 
                           metrics={metrics} 
                           phaseStartDate={phase.startDate} 
                           phaseEndDate={phase.endDate} 
                           items={ciData.audits} 
                           onItemUpdate={(itemId, updates) => {
                             console.log('Audit updated:', itemId, updates);
                             refetchCIData();
                           }} 
                         />
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>}

          {/* CI Instance List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compliance Intelligence Items</h3>
            
            {filteredCIs.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No CIs found for this phase</p>
                <p className="text-sm">Create new compliance intelligence items to track progress</p>
              </div> : <div className="space-y-2">
                {filteredCIs.map(ci => <div key={ci.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {ci.type}
                      </Badge>
                      <div>
                        <div className="font-medium">{ci.title}</div>
                        {ci.description && <div className="text-sm text-muted-foreground">{ci.description}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ci.status === 'completed' ? 'default' : ci.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {ci.status}
                      </Badge>
                      {ci.due_date && <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(ci.due_date), 'MMM dd')}
                        </span>}
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>
      </CardContent>
    </Card>;
}