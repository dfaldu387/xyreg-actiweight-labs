import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, RotateCcw, FileText } from "lucide-react";
import { useSwitzerlandClassificationAssistant } from "@/hooks/useSwitzerlandClassificationAssistant";
import { cn } from "@/lib/utils";
import { GenericRuleTextDialog } from './GenericRuleTextDialog';
import { getSwitzerlandRuleByNumber } from '@/data/switzerlandRuleTexts';

interface SwitzerlandClassificationTriggerProps {
  onClassificationSelected: (riskClass: string, result: any) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function SwitzerlandClassificationTrigger({
  onClassificationSelected,
  isOpen: externalIsOpen,
  onOpenChange,
  showButton = true
}: SwitzerlandClassificationTriggerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const { session, currentQuestion, selectOption, goBack, restart, canGoBack, isComplete } = useSwitzerlandClassificationAssistant();

  const handleRuleClick = (ruleText: string) => {
    const ruleMatch = ruleText.match(/Rule\s+(\d+)/i);
    if (ruleMatch) {
      setSelectedRule(ruleMatch[1]);
      setRuleDialogOpen(true);
    }
  };

  const handleComplete = () => {
    if (session.result) {
      // Map Swiss classes to internal format
      // Check longer class names first to avoid false matches
      let riskClass = '';
      const deviceClass = session.result.class;

      if (deviceClass.includes('Class III')) riskClass = 'III';
      else if (deviceClass.includes('Class IIb')) riskClass = 'IIb';
      else if (deviceClass.includes('Class IIa')) riskClass = 'IIa';
      else if (deviceClass.includes('Class I')) {
        // Handle Class I subcategories
        if (deviceClass.includes('Ir')) riskClass = 'Ir';
        else if (deviceClass.includes('Im')) riskClass = 'Im';
        else if (deviceClass.includes('Is')) riskClass = 'Is';
        else riskClass = 'I';
      }

      onClassificationSelected(riskClass, session.result);
      setIsOpen(false);
      restart();
    }
  };

  return (
    <>
      {showButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Swissmedic Assistant
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Swissmedic Classification Assistant
            </DialogTitle>
          </DialogHeader>

          {!isComplete && currentQuestion && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
                {currentQuestion.description && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
                )}
                {currentQuestion.helpText && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">{currentQuestion.helpText}</p>
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
                    {option.helpText && (
                      <div className="text-sm text-muted-foreground mt-1">{option.helpText}</div>
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
                  Restart
                </Button>
              </div>
            </div>
          )}

          {isComplete && session.result && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Classification Complete</h3>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {session.result.class}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-accent rounded-lg space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">Applicable Rule</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRuleClick(session.result!.rule)}
                      className="h-auto py-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Rule Text
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{session.result.rule}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{session.result.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleComplete} className="flex-1">
                  Apply Classification
                </Button>
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-3 bg-muted/50 rounded-md border border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Disclaimer:</span> This assistant provides guidance based on Swiss Medical Devices Ordinance (MedDO/MepV) but xyreg assumes no responsibility for the accuracy of classifications. Always consult with qualified regulatory experts for final validation. This tool is for informational purposes only.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <GenericRuleTextDialog
        isOpen={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        rule={selectedRule ? getSwitzerlandRuleByNumber(selectedRule) : null}
        marketName="Switzerland (Swissmedic)"
        regulationDescription="Swiss Medical Devices Ordinance (MedDO/MepV - SR 812.213)"
        officialUrl="https://www.fedlex.admin.ch/eli/cc/2020/552/en"
        officialLinkText="View Official Fedlex Source"
      />
    </>
  );
}
