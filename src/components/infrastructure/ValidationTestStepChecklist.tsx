import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, MinusCircle, ListChecks, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface TestStepResult {
  step: string;
  expectedResult: string;
  result: 'pass' | 'fail' | 'na' | '';
  notes: string;
}

interface ValidationTestStepChecklistProps {
  steps: { step: string; expectedResult: string; navigateTo?: string }[];
  results: TestStepResult[];
  onChange: (results: TestStepResult[]) => void;
  disabled?: boolean;
}

export function ValidationTestStepChecklist({
  steps,
  results,
  onChange,
  disabled = false,
}: ValidationTestStepChecklistProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);

  // Ensure results array matches steps
  const normalizedResults: TestStepResult[] = steps.map((s, i) => ({
    step: s.step,
    expectedResult: s.expectedResult,
    result: results[i]?.result || '',
    notes: results[i]?.notes || '',
  }));

  const completedCount = normalizedResults.filter(r => r.result !== '').length;

  const updateResult = (index: number, field: 'result' | 'notes', value: string) => {
    const updated = [...normalizedResults];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  if (steps.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-md border-border">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <ListChecks className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Test Steps</span>
            </div>
            <Badge variant={completedCount === steps.length ? 'default' : 'outline'} className="text-xs">
              {completedCount}/{steps.length} completed
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="divide-y divide-border">
            {normalizedResults.map((item, idx) => (
              <div key={idx} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                        {item.step}
                      </p>
                      {steps[idx]?.navigateTo && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(steps[idx].navigateTo!);
                          }}
                          title={`Navigate to: ${steps[idx].navigateTo}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Go
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium">Expected:</span> {item.expectedResult}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'pass' ? 'default' : 'outline'}
                      className={`h-7 w-7 p-0 ${item.result === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => updateResult(idx, 'result', item.result === 'pass' ? '' : 'pass')}
                      disabled={disabled}
                      title="Pass"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'fail' ? 'destructive' : 'outline'}
                      className="h-7 w-7 p-0"
                      onClick={() => updateResult(idx, 'result', item.result === 'fail' ? '' : 'fail')}
                      disabled={disabled}
                      title="Fail"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'na' ? 'default' : 'outline'}
                      className={`h-7 w-7 p-0 ${item.result === 'na' ? 'bg-gray-800 hover:bg-gray-900 text-white border-gray-800' : ''}`}
                      onClick={() => updateResult(idx, 'result', item.result === 'na' ? '' : 'na')}
                      disabled={disabled}
                      title="N/A"
                    >
                      <MinusCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {(item.result === 'fail' || item.notes) && (
                  <Textarea
                    value={item.notes}
                    onChange={(e) => updateResult(idx, 'notes', e.target.value)}
                    placeholder={item.result === 'fail' ? 'Describe the failure and any observations...' : 'Optional notes...'}
                    rows={2}
                    disabled={disabled}
                    className="resize-none text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
