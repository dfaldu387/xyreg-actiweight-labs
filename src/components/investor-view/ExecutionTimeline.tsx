import { Stepper } from "@/components/ui/stepper";
import { ISO_13485_PHASES } from "@/data/iso13485Phases";
import { format } from "date-fns";

interface PhaseDate {
  phaseId: string;
  startDate?: string;
  endDate?: string;
}

interface ExecutionTimelineProps {
  currentPhase: 'concept-planning' | 'design-inputs' | 'design-development' | 'verification-validation' | 'transfer-production' | 'market-surveillance';
  phaseDates?: PhaseDate[];
}

export function ExecutionTimeline({ currentPhase, phaseDates }: ExecutionTimelineProps) {
  // Aggregate dates by phase - multiple DB phases can map to one ISO phase
  // Take earliest startDate and latest endDate for each ISO phase
  const phaseDateMap = new Map<string, { startDate?: string; endDate?: string }>();
  phaseDates?.forEach(pd => {
    const existing = phaseDateMap.get(pd.phaseId);
    if (!existing) {
      phaseDateMap.set(pd.phaseId, { startDate: pd.startDate, endDate: pd.endDate });
    } else {
      // Use earliest start date
      if (pd.startDate && (!existing.startDate || pd.startDate < existing.startDate)) {
        existing.startDate = pd.startDate;
      }
      // Use latest end date
      if (pd.endDate && (!existing.endDate || pd.endDate > existing.endDate)) {
        existing.endDate = pd.endDate;
      }
    }
  });

  const formatDateRange = (startDate?: string, endDate?: string): string | undefined => {
    if (!startDate && !endDate) return undefined;

    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'MMM yyyy');
      } catch {
        return dateStr;
      }
    };

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) {
      return `From ${formatDate(startDate)}`;
    }
    if (endDate) {
      return `Until ${formatDate(endDate)}`;
    }
    return undefined;
  };

  const steps = ISO_13485_PHASES.map(phase => {
    const dates = phaseDateMap.get(phase.id);
    return {
      label: phase.name,
      subtitle: phase.isoReference,
      dateRange: formatDateRange(dates?.startDate, dates?.endDate),
    };
  });

  const phaseToStepMap: Record<string, number> = {
    'concept-planning': 1,
    'design-inputs': 2,
    'design-development': 3,
    'verification-validation': 4,
    'transfer-production': 5,
    'market-surveillance': 6,
  };

  const currentStep = phaseToStepMap[currentPhase] || 1;

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Execution Timeline
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          ISO 13485 Aligned Development Process
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          orientation="responsive"
          className="max-w-4xl mx-auto"
        />

        <div className="mt-6 sm:mt-8 text-center text-sm text-muted-foreground">
          <p>Current Phase: <span className="font-semibold text-foreground">{ISO_13485_PHASES[currentStep - 1]?.name}</span></p>
          <p className="text-xs mt-1 max-w-md mx-auto">{ISO_13485_PHASES[currentStep - 1]?.description}</p>
        </div>
      </div>
    </section>
  );
}
