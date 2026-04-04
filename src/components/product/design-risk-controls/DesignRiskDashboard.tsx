import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, FileText, AlertTriangle, TestTube, Network, Microscope,
  CheckCircle2, Clock, Circle, XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskOverviewCard } from "./RiskOverviewCard";

interface DesignRiskDashboardProps {
  productId: string;
  companyId: string;
}

interface StudyEntry {
  status?: string;
  [key: string]: unknown;
}

function parseStudyStatuses(plan: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!Array.isArray(plan)) return counts;
  (plan as StudyEntry[]).forEach((study) => {
    const status = (study.status || "Draft").toLowerCase();
    const key = status.charAt(0).toUpperCase() + status.slice(1);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function getMitigationStatus(hazard: { residual_risk_level?: string; residual_risk?: string; mitigation_measure?: string; risk_control_measure?: string }): string {
  const residualRisk = hazard.residual_risk_level || hazard.residual_risk;
  const hasMitigation = !!(hazard.mitigation_measure || hazard.risk_control_measure);
  if (residualRisk === 'Low' && hasMitigation) return 'mitigated';
  if (hasMitigation) return 'in_progress';
  return 'open';
}

export function DesignRiskDashboard({ productId, companyId }: DesignRiskDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // User Needs
  const { data: userNeeds, isLoading: loadingUN } = useQuery({
    queryKey: ['drc-dashboard-user-needs', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_needs')
        .select('id, status')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  // Requirements
  const { data: requirements, isLoading: loadingReq } = useQuery({
    queryKey: ['drc-dashboard-requirements', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('id, verification_status')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  // Hazards
  const { data: hazards, isLoading: loadingHaz } = useQuery({
    queryKey: ['drc-dashboard-hazards', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('id, residual_risk_level, residual_risk, mitigation_measure, risk_control_measure')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  // Test Cases
  const { data: testCases, isLoading: loadingTC } = useQuery({
    queryKey: ['drc-dashboard-test-cases', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_cases')
        .select('id, status')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  // Traceability Links
  const { data: traceLinks, isLoading: loadingTrace } = useQuery({
    queryKey: ['drc-dashboard-traceability', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('traceability_links')
        .select('id')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  // Usability Engineering Files (for formative/summative)
  const { data: ueFiles, isLoading: loadingUE } = useQuery({
    queryKey: ['drc-dashboard-ue', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usability_engineering_files')
        .select('formative_plan, summative_plan')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  const navigateToTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams, { replace: true });
  };

  // Compute summaries
  const unTotal = userNeeds?.length || 0;
  const unMet = userNeeds?.filter(u => u.status === 'Met').length || 0;

  const reqTotal = requirements?.length || 0;
  const reqVerified = requirements?.filter(r => r.verification_status === 'Verified').length || 0;
  const reqInProgress = requirements?.filter(r => r.verification_status === 'In Progress').length || 0;

  const hazTotal = hazards?.length || 0;
  const hazMitigated = hazards?.filter(h => getMitigationStatus(h) === 'mitigated').length || 0;
  const hazInProgress = hazards?.filter(h => getMitigationStatus(h) === 'in_progress').length || 0;
  const hazOpen = hazards?.filter(h => getMitigationStatus(h) === 'open').length || 0;

  const tcTotal = testCases?.length || 0;
  const tcPassed = testCases?.filter(t => t.status === 'passed').length || 0;
  const tcFailed = testCases?.filter(t => t.status === 'failed').length || 0;
  const tcInProgress = testCases?.filter(t => t.status === 'in_progress').length || 0;

  const traceTotal = traceLinks?.length || 0;

  const formativeStatuses = parseStudyStatuses(ueFiles?.formative_plan);
  const summativeStatuses = parseStudyStatuses(ueFiles?.summative_plan);
  const formativeTotal = Object.values(formativeStatuses).reduce((a, b) => a + b, 0);
  const summativeTotal = Object.values(summativeStatuses).reduce((a, b) => a + b, 0);

  const renderSkeleton = () => (
    <Skeleton className="h-32 w-full rounded-lg" />
  );

  const statusBadge = (label: string, count: number, variant: 'green' | 'amber' | 'red' | 'muted') => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      muted: 'bg-muted text-muted-foreground',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
        {count} {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User Needs */}
        {loadingUN ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('requirement-specifications')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                User Needs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unTotal}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unMet > 0 && statusBadge('Met', unMet, 'green')}
                {(unTotal - unMet) > 0 && statusBadge('Not Met', unTotal - unMet, 'amber')}
                {unTotal === 0 && <span className="text-xs text-muted-foreground">No user needs yet</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {loadingReq ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('requirement-specifications')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reqTotal}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {reqVerified > 0 && statusBadge('Verified', reqVerified, 'green')}
                {reqInProgress > 0 && statusBadge('In Progress', reqInProgress, 'amber')}
                {(reqTotal - reqVerified - reqInProgress) > 0 && statusBadge('Not Started', reqTotal - reqVerified - reqInProgress, 'muted')}
                {reqTotal === 0 && <span className="text-xs text-muted-foreground">No requirements yet</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hazards */}
        {loadingHaz ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('risk-management')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Hazards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hazTotal}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hazMitigated > 0 && statusBadge('Mitigated', hazMitigated, 'green')}
                {hazInProgress > 0 && statusBadge('In Progress', hazInProgress, 'amber')}
                {hazOpen > 0 && statusBadge('Open', hazOpen, 'red')}
                {hazTotal === 0 && <span className="text-xs text-muted-foreground">No hazards yet</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Cases */}
        {loadingTC ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('verification-validation')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TestTube className="h-4 w-4 text-purple-500" />
                Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tcTotal}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tcPassed > 0 && statusBadge('Passed', tcPassed, 'green')}
                {tcInProgress > 0 && statusBadge('In Progress', tcInProgress, 'amber')}
                {tcFailed > 0 && statusBadge('Failed', tcFailed, 'red')}
                {(tcTotal - tcPassed - tcInProgress - tcFailed) > 0 && statusBadge('Draft', tcTotal - tcPassed - tcInProgress - tcFailed, 'muted')}
                {tcTotal === 0 && <span className="text-xs text-muted-foreground">No test cases yet</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Traceability */}
        {loadingTrace ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('traceability')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4 text-teal-500" />
                Traceability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{traceTotal}</div>
              <div className="mt-2">
                {traceTotal > 0
                  ? <span className="text-xs text-muted-foreground">{traceTotal} links established</span>
                  : <span className="text-xs text-muted-foreground">No traceability links yet</span>
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usability Engineering */}
        {loadingUE ? renderSkeleton() : (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToTab('usability-engineering')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Microscope className="h-4 w-4 text-violet-500" />
                Usability Engineering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Formative Studies</div>
                  <div className="flex flex-wrap gap-1.5">
                    {formativeTotal > 0 ? (
                      Object.entries(formativeStatuses).map(([status, count]) => (
                        statusBadge(status, count,
                          status.toLowerCase() === 'completed' ? 'green' :
                          status.toLowerCase().includes('progress') ? 'amber' : 'muted'
                        )
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None planned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Summative Studies</div>
                  <div className="flex flex-wrap gap-1.5">
                    {summativeTotal > 0 ? (
                      Object.entries(summativeStatuses).map(([status, count]) => (
                        statusBadge(status, count,
                          status.toLowerCase() === 'completed' ? 'green' :
                          status.toLowerCase().includes('progress') ? 'amber' : 'muted'
                        )
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None planned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risk Overview Card */}
      <RiskOverviewCard productId={productId} />
    </div>
  );
}
