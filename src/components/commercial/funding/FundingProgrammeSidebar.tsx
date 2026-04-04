import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Plus, Globe, Flag, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { FundingProgramme, FundingApplication } from '@/hooks/useFundingProgrammes';

interface Props {
  programmes: FundingProgramme[];
  applications: FundingApplication[];
  selectedProgrammeId: string | null;
  onSelect: (id: string) => void;
}

const REGION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  EU: { label: 'European Union', icon: Globe, color: 'text-blue-500' },
  US: { label: 'United States', icon: Flag, color: 'text-red-500' },
  National: { label: 'National Programmes', icon: Building2, color: 'text-amber-500' },
};

const STATUS_COLORS: Record<string, string> = {
  exploring: 'bg-muted text-muted-foreground',
  preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  awarded: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function FundingProgrammeSidebar({ programmes, applications, selectedProgrammeId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>({ EU: true, US: true, National: true });

  const filtered = programmes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.funding_body?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, FundingProgramme[]>>((acc, p) => {
    const region = p.region || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(p);
    return acc;
  }, {});

  const getAppForProgramme = (pId: string) => applications.find(a => a.programme_id === pId);

  const getEligibilityScore = (programme: FundingProgramme, app?: FundingApplication) => {
    if (!app || !programme.eligibility_criteria.length) return 0;
    const answered = programme.eligibility_criteria.filter(c => app.checklist_responses[c.id]?.answer === 'yes').length;
    return Math.round((answered / programme.eligibility_criteria.length) * 100);
  };

  const totalTracked = applications.length;
  const exploring = applications.filter(a => a.status === 'exploring').length;
  const preparing = applications.filter(a => a.status === 'preparing').length;
  const submitted = applications.filter(a => a.status === 'submitted').length;

  return (
    <div className="w-72 border-r bg-muted/30 flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programmes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="px-3 py-2 border-b text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">Pipeline: {totalTracked} tracked</div>
        <div className="flex gap-2">
          {exploring > 0 && <span>{exploring} exploring</span>}
          {preparing > 0 && <span>· {preparing} preparing</span>}
          {submitted > 0 && <span>· {submitted} submitted</span>}
        </div>
      </div>

      {/* Programme list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([region, progs]) => {
          const config = REGION_CONFIG[region] || { label: region, icon: Globe, color: 'text-muted-foreground' };
          const Icon = config.icon;
          return (
            <Collapsible
              key={region}
              open={openRegions[region] !== false}
              onOpenChange={open => setOpenRegions(prev => ({ ...prev, [region]: open }))}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50">
                {openRegions[region] !== false ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Icon className={cn('h-3.5 w-3.5', config.color)} />
                {config.label}
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{progs.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {progs.map(prog => {
                  const app = getAppForProgramme(prog.id);
                  const score = getEligibilityScore(prog, app);
                  const isSelected = prog.id === selectedProgrammeId;
                  return (
                    <button
                      key={prog.id}
                      onClick={() => onSelect(prog.id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 text-sm border-l-2 transition-colors',
                        isSelected
                          ? 'border-l-primary bg-primary/5 text-foreground'
                          : 'border-l-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className="font-medium text-xs leading-tight truncate">{prog.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{prog.funding_body}</div>
                      {app && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={score} className="h-1 flex-1" />
                          <Badge className={cn('text-[9px] px-1 py-0', STATUS_COLORS[app.status])}>
                            {app.status}
                          </Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
