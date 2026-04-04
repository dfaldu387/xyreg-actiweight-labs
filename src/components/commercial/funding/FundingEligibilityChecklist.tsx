import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, MinusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EligibilityCriterion, FundingApplication } from '@/hooks/useFundingProgrammes';

type Answer = 'yes' | 'no' | 'partial' | 'unknown';

interface Props {
  criteria: EligibilityCriterion[];
  responses: FundingApplication['checklist_responses'];
  onUpdate: (criterionId: string, answer: Answer, notes: string) => void;
  readOnly?: boolean;
}

const ANSWER_OPTIONS: { value: Answer; icon: React.ElementType; label: string; color: string }[] = [
  { value: 'yes', icon: CheckCircle2, label: 'Yes', color: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'partial', icon: MinusCircle, label: 'Partial', color: 'text-amber-500' },
  { value: 'no', icon: XCircle, label: 'No', color: 'text-red-500' },
  { value: 'unknown', icon: HelpCircle, label: 'Unknown', color: 'text-muted-foreground' },
];

export function FundingEligibilityChecklist({ criteria, responses, onUpdate, readOnly }: Props) {
  const grouped = criteria.reduce<Record<string, EligibilityCriterion[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const yesCount = criteria.filter(c => responses[c.id]?.answer === 'yes').length;
  const partialCount = criteria.filter(c => responses[c.id]?.answer === 'partial').length;
  const score = criteria.length > 0 ? Math.round(((yesCount + partialCount * 0.5) / criteria.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground">Eligibility Score</div>
          <div className="text-3xl font-bold text-foreground">{score}%</div>
          <Progress value={score} className="mt-2 h-2" />
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-1">
          <div className="text-emerald-600">{yesCount} eligible</div>
          <div className="text-amber-500">{partialCount} partial</div>
          <div>{criteria.length - yesCount - partialCount} remaining</div>
        </div>
      </div>

      {/* Grouped criteria */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{category}</Badge>
            <span className="text-[10px] font-normal">
              {items.filter(i => responses[i.id]?.answer === 'yes').length}/{items.length} met
            </span>
          </h4>
          <div className="space-y-3">
            {items.map(criterion => {
              const response = responses[criterion.id] || { answer: 'unknown' as Answer, notes: '' };
              return (
                <div key={criterion.id} className="rounded-lg border p-3 bg-card">
                  <div className="text-sm font-medium mb-2">{criterion.question}</div>
                  <div className="flex gap-1 mb-2">
                    {ANSWER_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = response.answer === opt.value;
                      return (
                        <button
                          key={opt.value}
                          disabled={readOnly}
                          onClick={() => onUpdate(criterion.id, opt.value, response.notes || '')}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all border',
                            isSelected
                              ? `${opt.color} border-current bg-current/10 font-medium`
                              : 'text-muted-foreground border-transparent hover:border-border'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    placeholder="Notes (optional)..."
                    value={response.notes || ''}
                    onChange={e => onUpdate(criterion.id, response.answer, e.target.value)}
                    disabled={readOnly}
                    className="text-xs min-h-[40px] resize-none"
                    rows={1}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
