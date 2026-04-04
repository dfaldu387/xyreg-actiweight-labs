import React, { useState, useCallback } from 'react';
import { ExternalLink, Banknote, Beaker, Calendar, Play, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FundingProgrammeSidebar } from './FundingProgrammeSidebar';
import { FundingEligibilityChecklist } from './FundingEligibilityChecklist';
import { FundingWorkspace } from './FundingWorkspace';
import {
  useFundingProgrammes,
  useFundingApplications,
  useStartFundingApplication,
  useUpdateFundingApplication,
  type FundingApplication,
} from '@/hooks/useFundingProgrammes';

interface Props {
  companyId: string;
}

const STATUS_OPTIONS = [
  { value: 'exploring', label: 'Exploring' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
];

export function FundingGrantsTab({ companyId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: programmes = [], isLoading: loadingProgrammes } = useFundingProgrammes();
  const { data: applications = [], isLoading: loadingApps } = useFundingApplications(companyId);
  const startApp = useStartFundingApplication(companyId);
  const updateApp = useUpdateFundingApplication(companyId);

  const selected = programmes.find(p => p.id === selectedId);
  const app = applications.find(a => a.programme_id === selectedId);

  const handleChecklistUpdate = useCallback(
    (criterionId: string, answer: 'yes' | 'no' | 'partial' | 'unknown', notes: string) => {
      if (!app) return;
      const newResponses = { ...app.checklist_responses, [criterionId]: { answer, notes } };
      updateApp.mutate({ id: app.id, checklist_responses: newResponses } as any);
    },
    [app, updateApp]
  );

  const handleWorkspaceStatusChange = useCallback(
    (itemId: string, status: string) => {
      if (!app) return;
      const existing = [...(app.workspace_items || [])];
      const idx = existing.findIndex(w => w.id === itemId);
      if (idx >= 0) existing[idx] = { ...existing[idx], status };
      else existing.push({ id: itemId, status });
      updateApp.mutate({ id: app.id, workspace_items: existing } as any);
    },
    [app, updateApp]
  );

  if (loadingProgrammes || loadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex border rounded-xl overflow-hidden bg-background min-h-[600px]">
      {/* Sidebar */}
      <FundingProgrammeSidebar
        programmes={programmes}
        applications={applications}
        selectedProgrammeId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Banknote className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Funding & Grants Navigator</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Select a funding programme from the sidebar to assess eligibility, track your application,
              and manage required documentation. {programmes.length} programmes available across EU, US, and national schemes.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Programme header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!app ? (
                    <Button
                      size="sm"
                      onClick={() => startApp.mutate(selected.id)}
                      disabled={startApp.isPending}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Start Tracking
                    </Button>
                  ) : (
                    <Select
                      value={app.status}
                      onValueChange={v => updateApp.mutate({ id: app.id, status: v } as any)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selected.url && (
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a href={selected.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Portal
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick info badges */}
              <div className="flex flex-wrap gap-2">
                {selected.funding_body && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Banknote className="h-3 w-3" /> {selected.funding_body}
                  </Badge>
                )}
                {selected.typical_budget_range && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    {selected.typical_budget_range}
                  </Badge>
                )}
                {selected.trl_range && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Beaker className="h-3 w-3" /> {selected.trl_range}
                  </Badge>
                )}
                {selected.deadline_info && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Calendar className="h-3 w-3" /> {selected.deadline_info}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Tabs for checklist + workspace */}
            <Tabs defaultValue="eligibility" className="space-y-4">
              <TabsList>
                <TabsTrigger value="eligibility">
                  Eligibility Checklist
                  {selected.eligibility_criteria.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                      {selected.eligibility_criteria.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="workspace">
                  Application Workspace
                  {selected.checklist_items.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                      {selected.checklist_items.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="eligibility">
                <FundingEligibilityChecklist
                  criteria={selected.eligibility_criteria}
                  responses={app?.checklist_responses || {}}
                  onUpdate={handleChecklistUpdate}
                  readOnly={!app}
                />
                {!app && (
                  <div className="mt-4 p-4 rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Start tracking this programme to assess eligibility
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startApp.mutate(selected.id)}
                      disabled={startApp.isPending}
                      className="gap-1.5"
                    >
                      <ArrowRight className="h-3.5 w-3.5" /> Begin Assessment
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="workspace">
                <FundingWorkspace
                  items={selected.checklist_items}
                  statuses={(app?.workspace_items || []) as { id: string; status: 'not_started' | 'draft' | 'in_progress' | 'complete'; notes?: string }[]}
                  onStatusChange={handleWorkspaceStatusChange}
                  readOnly={!app}
                />
                {!app && (
                  <div className="mt-4 p-4 rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">
                      Start tracking to manage application documents
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
