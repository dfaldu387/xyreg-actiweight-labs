import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, RotateCcw, CheckCircle, AlertTriangle, FileText, Beaker, ChevronDown, ChevronUp, ListChecks, BookOpen } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useClassificationAssistant } from '@/hooks/useClassificationAssistant';
import { ivdrClassificationQuestions } from '@/data/ivdrClassificationRules';
import { ClassificationDecisionPath } from './ClassificationDecisionPath';

interface IVDRClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete?: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function IVDRClassificationAssistant({
  isOpen,
  onClose,
  onClassificationComplete
}: IVDRClassificationAssistantProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Use the same hook but with IVDR questions
  const {
    session,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete
  } = useClassificationAssistant();

  // Override the questions to use IVDR rules
  const currentQuestion = ivdrClassificationQuestions[session.currentQuestionId] || null;

  const handleComplete = () => {
    if (session.result && onClassificationComplete) {
      // Extend result with decision path data
      const extendedResult = {
        ...session.result,
        decisionPath: {
          path: session.path,
          answers: session.answers
        }
      };
      onClassificationComplete(session.result.class, extendedResult as any);
    }
    onClose();
  };

  const handleRestart = () => {
    setShowDetails(false);
    restart();
  };

  const getClassColor = (deviceClass: DeviceClass): string => {
    switch (deviceClass) {
      case 'Class A': return 'bg-green-100 text-green-800 border-green-300';
      case 'Class B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Class C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Class D': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class A': return <CheckCircle className="h-5 w-5" />;
      case 'Class B': return <FileText className="h-5 w-5" />;
      case 'Class C': return <AlertTriangle className="h-5 w-5" />;
      case 'Class D': return <Beaker className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            IVDR Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isComplete && currentQuestion && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                  {currentQuestion.description && (
                    <CardDescription className="text-sm">
                      {currentQuestion.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {currentQuestion.helpText && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-blue-800">{currentQuestion.helpText}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-4"
                        onClick={() => selectOption(option)}
                      >
                        <div>
                          <div className="font-medium">{option.text}</div>
                          {option.helpText && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.helpText}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isComplete && session.result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  IVDR Classification Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`px-3 py-1 text-lg font-semibold ${getClassColor(session.result.class)}`}
                  >
                    {session.result.class}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Applicable Rule</h4>
                  <p className="text-sm">{session.result.rule}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{session.result.description}</p>
                </div>

                <Separator />

                {/* Expandable Details Section */}
                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <ListChecks className="h-4 w-4" />
                        View Classification Details
                      </span>
                      {showDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    {/* Decision Path */}
                    <ClassificationDecisionPath
                      path={session.path}
                      answers={session.answers}
                      questions={ivdrClassificationQuestions}
                    />

                    {/* Official Rule Text */}
                    {session.result.ruleText && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          Official Rule Text
                        </h4>
                        <div className="border rounded-md bg-muted/30 p-4 space-y-2">
                          {session.result.ruleSource && (
                            <p className="text-xs text-muted-foreground font-medium">
                              Source: {session.result.ruleSource}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-line text-foreground/90">
                            {session.result.ruleText}
                          </p>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> This classification is based on the information provided and IVDR rules. 
                    Always consult with regulatory experts and review the complete IVDR requirements for your specific device. 
                    This tool provides guidance only and does not constitute official regulatory advice.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleComplete} className="flex-1">
                    Use This Classification
                  </Button>
                  <Button variant="outline" onClick={handleRestart}>
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={!canGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleRestart}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
