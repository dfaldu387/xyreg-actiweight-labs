
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phase, PhaseCategory } from "./SimplifiedPhaseDataService";
import { useTranslation } from "@/hooks/useTranslation";

interface PhaseStatisticsProps {
  activePhases: Phase[];
  availablePhases: Phase[];
  categories: PhaseCategory[];
}

export function PhaseStatistics({ activePhases, availablePhases, categories }: PhaseStatisticsProps) {
  const { lang } = useTranslation();

  // Filter out "No Phase" system entry from counts
  const filteredActive = activePhases.filter(phase => phase.name !== 'No Phase');
  const filteredAvailable = availablePhases.filter(phase => phase.name !== 'No Phase');

  return (
    <Card>
      <CardContent className="!pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">{filteredActive.length} {lang('lifecyclePhases.stats.activePhases')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">{filteredAvailable.length} {lang('lifecyclePhases.stats.availablePhases')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium">{categories.length} {lang('lifecyclePhases.stats.categories')}</span>
            </div>
          </div>
          <div className="text-muted-foreground capitalize">
            {lang('lifecyclePhases.stats.total')}: {filteredActive.length + filteredAvailable.length} {lang('lifecyclePhases.stats.phasesConfigured')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
