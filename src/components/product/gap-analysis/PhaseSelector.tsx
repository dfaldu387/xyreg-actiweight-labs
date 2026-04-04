import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';

interface Phase {
  id: string;
  name: string;
  position: number;
}

interface PhaseSelectorProps {
  selectedPhases: string[];
  onPhasesChange: (phases: string[]) => void;
  companyId?: string;
  disabled?: boolean;
}

export function PhaseSelector({
  selectedPhases,
  onPhasesChange,
  companyId,
  disabled = false
}: PhaseSelectorProps) {
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch company phases with optimized caching
  const { data: phases = [], isLoading, isFetching } = useQuery({
    queryKey: ['company-phases', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (error) {
        console.error('Error fetching phases:', error);
        return [];
      }

      // Filter out "No Phase" entry — UI shows "Core" elsewhere, not in gap analysis
      return (data as Phase[]).filter(p => p.name.toLowerCase() !== 'no phase');
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutes - phases don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Only show loading if query is enabled and actually loading
  const isActuallyLoading = !!companyId && (isLoading || isFetching);

  const handlePhaseToggle = useCallback((phaseId: string) => {
    console.log(`[PhaseSelector] Toggling phase ${phaseId}, current phases:`, selectedPhases);
    if (selectedPhases.includes(phaseId)) {
      const newPhases = selectedPhases.filter(id => id !== phaseId);
      console.log(`[PhaseSelector] Removing phase, new phases:`, newPhases);
      onPhasesChange(newPhases);
    } else {
      const newPhases = [...selectedPhases, phaseId];
      console.log(`[PhaseSelector] Adding phase, new phases:`, newPhases);
      onPhasesChange(newPhases);
    }
  }, [selectedPhases, onPhasesChange]);

  const handleClearAll = useCallback(() => {
    onPhasesChange([]);
  }, [onPhasesChange]);

  const handleSelectAll = useCallback(() => {
    onPhasesChange(phases.map(phase => phase.id));
  }, [phases, onPhasesChange]);

  const selectedPhaseNames = useMemo(() => {
    if (selectedPhases.length === 0) {
      return { firstPhase: null, remainingCount: 0, showIndependentPhases: true };
    }
    
    const sortedPhases = phases
      .filter(phase => selectedPhases.includes(phase.id))
      .sort((a, b) => a.position - b.position);
    
    return {
      firstPhase: sortedPhases[0]?.name || null,
      remainingCount: sortedPhases.length > 1 ? sortedPhases.length - 1 : 0,
      showIndependentPhases: false
    };
  }, [phases, selectedPhases]);

  // Show loading only if companyId exists and query is actually loading
  if (isActuallyLoading) {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{lang('gapAnalysis.phaseSelector.phases')}</div>
        <div className="text-sm text-muted-foreground">{lang('gapAnalysis.phaseSelector.loadingPhases')}</div>
      </div>
    );
  }

  // If no companyId, don't show phases section
  if (!companyId) {
    return null;
  }

  if (phases.length === 0) {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{lang('gapAnalysis.phaseSelector.phases')}</div>
        <div className="text-sm text-muted-foreground">{lang('gapAnalysis.phaseSelector.noPhasesConfigured')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-foreground">{lang('gapAnalysis.phaseSelector.phases')}</div>
      <div className="flex flex-wrap gap-1 items-center">
        {selectedPhaseNames.showIndependentPhases ? (
          <Badge
            variant="secondary"
            className="text-xs bg-blue-50 text-blue-700 border-blue-200 capitalize"
          >
            {lang('gapAnalysis.phaseSelector.phasesIndependent')}
          </Badge>
        ) : selectedPhaseNames.firstPhase ? (
          <>
            <Badge
              variant="secondary"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {selectedPhaseNames.firstPhase}
            </Badge>
            {selectedPhaseNames.remainingCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                +{selectedPhaseNames.remainingCount}
              </Badge>
            )}
          </>
        ) : null}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-6 px-2 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              {lang('gapAnalysis.phaseSelector.edit')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{lang('gapAnalysis.phaseSelector.selectApplicablePhases')}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 px-2 text-xs"
                  >
                    {lang('gapAnalysis.phaseSelector.all')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-6 px-2 text-xs"
                  >
                    {lang('gapAnalysis.phaseSelector.clear')}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {lang('gapAnalysis.phaseSelector.leaveEmptyHint')}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {phases.map((phase) => (
                  <div
                    key={phase.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => handlePhaseToggle(phase.id)}
                  >
                    <Checkbox
                      checked={selectedPhases.includes(phase.id)}
                      onChange={() => handlePhaseToggle(phase.id)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {phase.name}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 px-3"
                >
                  {lang('gapAnalysis.phaseSelector.done')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}