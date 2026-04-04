import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TestCase } from "@/services/vvService";

interface TestCaseDetailDialogProps {
  testCase: TestCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestCaseDetailDialog({ testCase, open, onOpenChange }: TestCaseDetailDialogProps) {
  if (!testCase) return null;

  const steps = Array.isArray(testCase.test_steps) ? testCase.test_steps : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {testCase.test_case_id}
            <Badge variant="outline" className="capitalize">{testCase.test_type}</Badge>
            <Badge variant="secondary" className="capitalize">{testCase.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">{testCase.name}</h4>
            {testCase.description && (
              <p className="text-sm text-muted-foreground mt-1">{testCase.description}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Level:</span> <span className="text-muted-foreground capitalize">{testCase.test_level}</span></div>
            <div><span className="font-medium">Priority:</span> <span className="text-muted-foreground capitalize">{testCase.priority}</span></div>
            {testCase.category && <div><span className="font-medium">Category:</span> <span className="text-muted-foreground capitalize">{testCase.category}</span></div>}
            {testCase.test_method && <div><span className="font-medium">Method:</span> <span className="text-muted-foreground capitalize">{testCase.test_method}</span></div>}
            {testCase.estimated_duration && <div><span className="font-medium">Est. Duration:</span> <span className="text-muted-foreground">{testCase.estimated_duration} min</span></div>}
            {testCase.sample_size && <div><span className="font-medium">Sample Size:</span> <span className="text-muted-foreground">{testCase.sample_size}</span></div>}
          </div>

          {testCase.preconditions && (
            <>
              <Separator />
              <div>
                <h5 className="font-medium text-sm mb-1">Preconditions</h5>
                <p className="text-sm text-muted-foreground">{testCase.preconditions}</p>
              </div>
            </>
          )}

          {steps.length > 0 && (
            <>
              <Separator />
              <div>
                <h5 className="font-medium text-sm mb-2">Test Steps</h5>
                <div className="space-y-2">
                  {steps.map((step: any, i: number) => (
                    <div key={i} className="border rounded p-2 text-sm">
                      <span className="font-medium">Step {i + 1}:</span> {step.step || step.action || step.description || ''}
                      {step.expected && (
                        <p className="text-xs text-muted-foreground mt-1">Expected: {step.expected}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {testCase.expected_results && (
            <>
              <Separator />
              <div>
                <h5 className="font-medium text-sm mb-1">Expected Results</h5>
                <p className="text-sm text-muted-foreground">{testCase.expected_results}</p>
              </div>
            </>
          )}

          {testCase.acceptance_criteria && (
            <>
              <Separator />
              <div>
                <h5 className="font-medium text-sm mb-1">Acceptance Criteria</h5>
                <p className="text-sm text-muted-foreground">{testCase.acceptance_criteria}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
