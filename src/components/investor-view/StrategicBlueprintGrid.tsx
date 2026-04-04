import { Card } from "@/components/ui/card";

interface StrategicBlueprintGridProps {
  valueProposition: string;
  customerSegments: string[];
  reimbursementStrategy: string[];
  keyResources: string[];
}

export function StrategicBlueprintGrid({
  valueProposition,
  customerSegments,
  reimbursementStrategy,
  keyResources,
}: StrategicBlueprintGridProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">
        Strategic Blueprint
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Large Card: Value Proposition */}
        <Card className="lg:col-span-2 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
            Value Proposition
          </h3>
          <p className="text-foreground leading-relaxed">
            {valueProposition}
          </p>
        </Card>

        {/* Customer Segments */}
        <Card className="p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
            Customer Segments
          </h3>
          <ul className="space-y-2">
            {customerSegments.map((segment, index) => (
              <li key={index} className="text-sm text-foreground flex items-start">
                <span className="mr-2 text-indigo-600 dark:text-indigo-400">•</span>
                {segment}
              </li>
            ))}
          </ul>
        </Card>

        {/* Reimbursement Strategy */}
        <Card className="p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
            Reimbursement Strategy
          </h3>
          <ul className="space-y-2">
            {reimbursementStrategy.map((strategy, index) => (
              <li key={index} className="text-sm text-foreground flex items-start">
                <span className="mr-2 text-indigo-600 dark:text-indigo-400">•</span>
                {strategy}
              </li>
            ))}
          </ul>
        </Card>

        {/* Key Resources */}
        <Card className="lg:col-span-2 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
            Key Resources
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {keyResources.map((resource, index) => (
              <li key={index} className="text-sm text-foreground flex items-start">
                <span className="mr-2 text-indigo-600 dark:text-indigo-400">•</span>
                {resource}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
