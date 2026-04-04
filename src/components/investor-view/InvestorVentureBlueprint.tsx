import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp } from "lucide-react";
import type { VentureBlueprintStep } from "@/types/investorView";

interface InvestorVentureBlueprintProps {
  steps: VentureBlueprintStep[];
}

// Steps 1-4 are Phase 1, Steps 5-8 are Phase 2
const PHASE_1_STEPS = [1, 2, 3, 4];
const PHASE_2_STEPS = [5, 6, 7, 8];

export function InvestorVentureBlueprint({ steps }: InvestorVentureBlueprintProps) {
  // Filter steps that have notes
  const stepsWithNotes = steps.filter(step => step.notes && step.notes.trim().length > 0);
  
  if (stepsWithNotes.length === 0) {
    return null;
  }

  const phase1Steps = stepsWithNotes.filter(s => PHASE_1_STEPS.includes(s.id));
  const phase2Steps = stepsWithNotes.filter(s => PHASE_2_STEPS.includes(s.id));

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Strategic Planning</h2>
          <p className="text-muted-foreground">Venture Blueprint - Key strategic insights and planning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Phase 1: Opportunity & Definition */}
        {phase1Steps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-lg text-foreground">Opportunity & Definition</h3>
            </div>
            <div className="space-y-4">
              {phase1Steps.map((step) => (
                <Card key={step.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {step.notes}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Feasibility & Planning */}
        {phase2Steps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-lg text-foreground">Feasibility & Planning</h3>
            </div>
            <div className="space-y-4">
              {phase2Steps.map((step) => (
                <Card key={step.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {step.notes}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
