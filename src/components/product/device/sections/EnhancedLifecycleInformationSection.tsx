
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhaseTimelineManager } from "@/components/product/timeline/PhaseTimelineManager";
import { MarketLaunchDateManager } from "@/components/product/device/timeline/MarketLaunchDateManager";
import { ComplianceInstanceDueDateManager } from "@/components/product/device/compliance/ComplianceInstanceDueDateManager";

import { LifecycleErrorBoundary } from "../LifecycleErrorBoundary";

interface EnhancedLifecycleInformationSectionProps {
  designFreezeDate?: Date | string;
  currentLifecyclePhase?: string;
  projectedLaunchDate?: Date | string;
  marketLaunchDates?: Record<string, string>;
  conformityAssessmentRoute?: string;
  onDesignFreezeDateChange?: (date: Date | undefined) => void;
  onCurrentLifecyclePhaseChange?: (value: string) => void;
  onProjectedLaunchDateChange?: (date: Date | undefined) => void;
  onMarketLaunchDatesChange?: (dates: Record<string, string>) => void;
  onConformityAssessmentRouteChange?: (value: string) => void;
  isLoading?: boolean;
  availableLifecyclePhases?: Array<{ id: string; name: string; description?: string }>;
  isLoadingPhases?: boolean;
  progress?: number;
  productId?: string;
  companyId?: string;
  phases?: Array<{
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
  }>;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  product?: any;
}

// Simple inline fallback components for missing dependencies
const MarketLaunchFallback = ({ marketLaunchDates = {}, onMarketLaunchDatesChange, primaryLaunchDate }: any) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Market-specific launch dates will be configured here. Primary launch date: {primaryLaunchDate ? new Date(primaryLaunchDate).toLocaleDateString() : 'Not set'}
    </p>
    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
      <p className="text-sm text-muted-foreground">Market launch date management coming soon</p>
    </div>
  </div>
);

const ComplianceFallback = () => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Compliance instance due dates and tracking will be managed here.
    </p>
    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
      <p className="text-sm text-muted-foreground">Compliance due date management coming soon</p>
    </div>
  </div>
);

const PhaseTimelineFallback = ({ phases = [], progress }: any) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Phase timeline and progress tracking. Current progress: {progress || 0}%
    </p>
    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-sm text-muted-foreground">
        {phases.length > 0 ? `${phases.length} phases configured` : 'No phases configured yet'}
      </p>
    </div>
  </div>
);

export function EnhancedLifecycleInformationSection({
  designFreezeDate,
  currentLifecyclePhase = '',
  projectedLaunchDate,
  marketLaunchDates = {},
  conformityAssessmentRoute = '',
  onDesignFreezeDateChange,
  onCurrentLifecyclePhaseChange,
  onProjectedLaunchDateChange,
  onMarketLaunchDatesChange,
  onConformityAssessmentRouteChange,
  isLoading = false,
  availableLifecyclePhases = [],
  isLoadingPhases = false,
  progress,
  productId,
  companyId,
  phases = [],
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  product
}: EnhancedLifecycleInformationSectionProps) {
  const parseDate = (date: Date | string | undefined): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return undefined;
  };

  return (
    <LifecycleErrorBoundary>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>7. Lifecycle Information</CardTitle>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Lifecycle Overview</TabsTrigger>
                <TabsTrigger value="timeline">Phase Timeline</TabsTrigger>
                <TabsTrigger value="market-launch">Market Launch</TabsTrigger>
                <TabsTrigger value="ci-due-dates">CI Due Dates</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div>
                  <Label>Design Freeze Date</Label>
                  <div className="mt-2">
                    <DatePicker
                      date={parseDate(designFreezeDate)}
                      setDate={(date) => onDesignFreezeDateChange?.(date)}
                      placeholder="Select design freeze date"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="current-lifecycle-phase">Current Lifecycle Phase</Label>
                  <Select 
                    value={currentLifecyclePhase} 
                    onValueChange={onCurrentLifecyclePhaseChange}
                    disabled={isLoading || isLoadingPhases}
                  >
                    <SelectTrigger id="current-lifecycle-phase" className="mt-2">
                      <SelectValue placeholder={isLoadingPhases ? "Loading phases..." : "Select current phase"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLifecyclePhases.length > 0 ? (
                        availableLifecyclePhases.map((phase) => (
                          <SelectItem key={phase.id} value={phase.name}>
                            {phase.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-phases" disabled>
                          {isLoadingPhases ? "Loading..." : "No phases configured"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Projected Launch Date</Label>
                  <div className="mt-2">
                    <DatePicker
                      date={parseDate(projectedLaunchDate)}
                      setDate={(date) => onProjectedLaunchDateChange?.(date)}
                      placeholder="Select projected launch date"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="conformity-assessment-route">Conformity Assessment Route</Label>
                  <Input
                    id="conformity-assessment-route"
                    value={conformityAssessmentRoute}
                    onChange={(e) => onConformityAssessmentRouteChange?.(e.target.value)}
                    placeholder="e.g., Annex II, Annex III"
                    disabled={isLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <LifecycleErrorBoundary>
                  {PhaseTimelineManager ? (
                    <PhaseTimelineManager
                      productId={productId}
                      companyId={companyId}
                      phases={phases}
                      onPhaseStartDateChange={onPhaseStartDateChange}
                      onPhaseEndDateChange={onPhaseEndDateChange}
                      progress={progress}
                    />
                  ) : (
                    <PhaseTimelineFallback phases={phases} progress={progress} />
                  )}
                </LifecycleErrorBoundary>
              </TabsContent>

              <TabsContent value="market-launch" className="mt-6">
                <LifecycleErrorBoundary>
                  {MarketLaunchDateManager ? (
                    <MarketLaunchDateManager
                      marketLaunchDates={marketLaunchDates}
                      onMarketLaunchDatesChange={onMarketLaunchDatesChange}
                      primaryLaunchDate={parseDate(projectedLaunchDate)}
                      productId={productId}
                    />
                  ) : (
                    <MarketLaunchFallback 
                      marketLaunchDates={marketLaunchDates}
                      onMarketLaunchDatesChange={onMarketLaunchDatesChange}
                      primaryLaunchDate={parseDate(projectedLaunchDate)}
                    />
                  )}
                </LifecycleErrorBoundary>
              </TabsContent>

              <TabsContent value="ci-due-dates" className="mt-6">
                <LifecycleErrorBoundary>
                  {ComplianceInstanceDueDateManager ? (
                    <ComplianceInstanceDueDateManager productId={productId} />
                  ) : (
                    <ComplianceFallback />
                  )}
                </LifecycleErrorBoundary>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </LifecycleErrorBoundary>
  );
}
