import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, ArrowLeft, RotateCcw, CheckCircle2, BookOpen } from 'lucide-react';
import { useIndiaClassificationAssistant } from '@/hooks/useIndiaClassificationAssistant';
import { ClassificationResult } from '@/types/classification';
import { GenericRuleTextDialog } from './GenericRuleTextDialog';
import { indiaRuleTexts } from '@/data/indiaRuleTexts';

interface IndiaClassificationTriggerProps {
  onClassificationSelected: (riskClass: string, result: ClassificationResult) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

const IndiaClassificationTrigger: React.FC<IndiaClassificationTriggerProps> = ({
  onClassificationSelected,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [showRuleText, setShowRuleText] = useState(false);
  
  const {
    session,
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
  } = useIndiaClassificationAssistant();

  const handleApply = () => {
    if (session.result) {
      // India uses letter classes (A, B, C, D) - extract just the letter for the callback
      const deviceClass = session.result.class;
      let riskClass: string = deviceClass;

      if (deviceClass.includes('Class A')) riskClass = 'A';
      else if (deviceClass.includes('Class B')) riskClass = 'B';
      else if (deviceClass.includes('Class C')) riskClass = 'C';
      else if (deviceClass.includes('Class D')) riskClass = 'D';

      onClassificationSelected(riskClass, session.result);
      setIsOpen(false);
      restart();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    restart();
  };

  const getRuleContent = (rule: string) => {
    const ruleData = indiaRuleTexts[rule];
    if (ruleData) {
      return {
        title: ruleData.title,
        content: ruleData.content
      };
    }
    return {
      title: rule,
      content: 'Rule text not available for this classification.'
    };
  };

  return (
    <>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Classification Assistant
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              India CDSCO Classification Assistant
            </DialogTitle>
            <DialogDescription>
              Answer questions to determine the device classification under Medical Devices Rules, 2017
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {!isComplete && currentQuestion && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-medium text-foreground">
                    {currentQuestion.text}
                  </h3>
                  {currentQuestion.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => selectOption(option)}
                      className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="text-sm font-medium">{option.text}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    disabled={!canGoBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restart}
                    className="gap-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {isComplete && session.result && (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        Classification Result
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Device Class:</span>{' '}
                          <span className="font-bold text-green-700 dark:text-green-300">
                            Class {session.result.class}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Rule:</span>{' '}
                          {session.result.rule}
                        </p>
                        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                          {session.result.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRuleText(true)}
                    className="gap-1"
                  >
                    <BookOpen className="h-4 w-4" />
                    View Rule Details
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={restart}
                      className="gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Start Over
                    </Button>
                    <Button size="sm" onClick={handleApply}>
                      Apply Classification
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {session.result && (
        <GenericRuleTextDialog
          isOpen={showRuleText}
          onClose={() => setShowRuleText(false)}
          rule={{
            id: session.result.rule,
            title: getRuleContent(session.result.rule).title,
            text: getRuleContent(session.result.rule).content,
            source: 'Medical Devices Rules, 2017'
          }}
          marketName="India"
          regulationDescription="CDSCO Medical Devices Rules, 2017"
          officialUrl="https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Diagnostics/"
          officialLinkText="View CDSCO Official Website"
        />
      )}
    </>
  );
};

export default IndiaClassificationTrigger;
