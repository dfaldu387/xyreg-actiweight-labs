import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Beaker, ArrowLeft, RotateCcw, Info } from 'lucide-react';
import { useCanadaIVDClassificationAssistant } from '@/hooks/useCanadaIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';
import { cn } from '@/lib/utils';

interface CanadaIVDClassificationTriggerProps {
  onClassificationSelected?: (riskClass: string, result: ClassificationResult) => void;
  onOpenChange?: (isOpen: boolean) => void;
  showButton?: boolean;
}

export function CanadaIVDClassificationTrigger({
  onClassificationSelected,
  onOpenChange,
  showButton = true
}: CanadaIVDClassificationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { session, currentQuestion, selectOption, goBack, restart, canGoBack, isComplete } = useCanadaIVDClassificationAssistant();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
    if (!open) {
      restart();
    }
  };

  const handleComplete = () => {
    if (session.result && onClassificationSelected) {
      // Extract class number from "Class X" format
      let riskClass = '';
      const deviceClass = session.result.class;
      
      if (deviceClass.includes('Class IV')) riskClass = 'IV';
      else if (deviceClass.includes('Class III')) riskClass = 'III';
      else if (deviceClass.includes('Class II')) riskClass = 'II';
      else if (deviceClass.includes('Class I')) riskClass = 'I';

      onClassificationSelected(riskClass, session.result);
      handleOpenChange(false);
    }
  };

  return (
    <>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
          className="gap-2"
        >
          <Beaker className="h-4 w-4" />
          Canada IVD Assistant
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Health Canada IVD Classification Assistant
            </DialogTitle>
          </DialogHeader>

          {!isComplete && currentQuestion && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
                {currentQuestion.helpText && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{currentQuestion.helpText}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectOption(option)}
                    className={cn(
                      "w-full p-4 text-left border-2 rounded-lg transition-all",
                      "hover:border-primary hover:bg-accent",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                  >
                    <div className="font-medium">{option.text}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                {canGoBack && (
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
          )}

          {isComplete && session.result && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <Badge className="text-lg px-4 py-2 mb-4" variant="default">
                  {session.result.class}
                </Badge>
                <h3 className="text-lg font-semibold mb-2">{session.result.rule}</h3>
                <p className="text-muted-foreground">{session.result.description}</p>
              </div>

              {session.result.ruleText && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                        Regulatory Basis
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {session.result.ruleText}
                      </p>
                      {session.result.ruleSource && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                          Source: {session.result.ruleSource}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {session.result.requirements && session.result.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {session.result.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {session.result.productCodeExamples && session.result.productCodeExamples.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Examples:</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.result.productCodeExamples.map((example, idx) => (
                      <Badge key={idx} variant="secondary">{example}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleComplete} className="flex-1">
                  Use This Classification
                </Button>
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
