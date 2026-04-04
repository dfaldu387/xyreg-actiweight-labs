import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import { useSwissIVDClassificationAssistant } from '@/hooks/useSwissIVDClassificationAssistant';
import { ClassificationResult } from '@/types/classification';

interface SwissIVDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (classification: string, result: ClassificationResult) => void;
}

export function SwissIVDClassificationAssistant({
  isOpen,
  onClose,
  onComplete
}: SwissIVDClassificationAssistantProps) {
  const {
    session,
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete
  } = useSwissIVDClassificationAssistant();

  const handleComplete = () => {
    if (session.result && onComplete) {
      onComplete(session.result.class, session.result);
    }
    onClose();
    restart();
  };

  const handleClose = () => {
    onClose();
    restart();
  };

  const getClassBadgeVariant = (classification: string) => {
    if (classification.includes('D')) return 'destructive';
    if (classification.includes('C')) return 'default';
    if (classification.includes('B')) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">🇨🇭</span>
            Swiss IVD Classification Assistant
          </DialogTitle>
          <DialogDescription>
            Determine the IVD classification based on Swiss IvDO (Classes A, B, C, D)
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-4">
          {isComplete && session.result ? (
            <div className="space-y-4">
              {/* Result Header */}
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Classification Result
                    </CardTitle>
                    <Badge variant={getClassBadgeVariant(session.result.class)} className="text-lg px-3 py-1">
                      {session.result.class}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Regulatory Rule</h4>
                    <p className="text-sm">{session.result.rule}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                    <p className="text-sm">{session.result.description}</p>
                  </div>
                  {session.result.regulatoryPathway && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Regulatory Pathway</h4>
                      <p className="text-sm font-medium text-primary">{session.result.regulatoryPathway}</p>
                    </div>
                  )}
                  {session.result.productCodeExamples && session.result.productCodeExamples.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Example Products</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.result.productCodeExamples.map((code, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements */}
              {session.result.requirements && session.result.requirements.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {session.result.requirements.map((req, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Swissmedic Link */}
              <Card className="bg-muted/50">
                <CardContent className="py-3">
                  <a
                    href="https://www.swissmedic.ch/swissmedic/en/home/medical-devices/md-market-access.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Swissmedic IVD Market Access Information
                  </a>
                </CardContent>
              </Card>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Step {session.path.length}</span>
                {canGoBack && (
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>

              {/* Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                  {currentQuestion.helpText && (
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {currentQuestion.helpText}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-left"
                      onClick={() => selectOption(option)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{option.text}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading classification questions...
            </div>
          )}
        </div>

        {/* Action buttons - always visible at bottom */}
        {isComplete && session.result && (
          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={restart} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Use This Classification
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
