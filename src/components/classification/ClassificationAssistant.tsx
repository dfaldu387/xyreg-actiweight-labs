import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, CheckCircle, AlertTriangle, BookOpen, Shield, FileText } from 'lucide-react';
import { useClassificationAssistant } from '@/hooks/useClassificationAssistant';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { RuleTextDialog } from './RuleTextDialog';
import { getRuleByNumber } from '@/data/mdrRuleTexts';

interface ClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete?: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
  initialQuestionId?: string;
}

export function ClassificationAssistant({ 
  isOpen, 
  onClose, 
  onClassificationComplete,
  initialQuestionId 
}: ClassificationAssistantProps) {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useClassificationAssistant(initialQuestionId);

  const handleComplete = () => {
    if (session.result && onClassificationComplete) {
      // Pass complete result including decisionPath, ruleText, and ruleSource
      const completeResult = {
        ...session.result,
        decisionPath: session.result.decisionPath || [],
        ruleText: session.result.ruleText || '',
        ruleSource: session.result.ruleSource || ''
      };
      onClassificationComplete(session.result.class, completeResult);
    }
    onClose();
  };

  const handleRuleClick = (ruleText: string) => {
    // Extract rule number from text like "(MDR Annex VIII, Rule 14)"
    const ruleMatch = ruleText.match(/Rule\s+(\d+)/i);
    if (ruleMatch) {
      setSelectedRule(ruleMatch[1]);
      setRuleDialogOpen(true);
    }
  };

  const getCurrentRule = () => {
    if (selectedRule) {
      return getRuleByNumber(selectedRule);
    }
    return null;
  };

  const getClassColor = (deviceClass: DeviceClass) => {
    if (deviceClass.includes('Class I')) return 'bg-green-100 text-green-800 border-green-200';
    if (deviceClass.includes('Class IIa')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (deviceClass.includes('Class IIb')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (deviceClass.includes('Class III')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    if (deviceClass === 'Not a medical device' || deviceClass === 'Consultation required') {
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <CheckCircle className="h-5 w-5" />;
  };

  if (!currentQuestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            EU MDR Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator and controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Question {session.path.length}</span>
            <div className="flex gap-2">
              {canGoBack && (
                <Button variant="outline" size="sm" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
            </div>
          </div>

          {/* Current question or result */}
          {isComplete && session.result ? (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  Classification Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-2 font-semibold ${getClassColor(session.result.class)}`}
                  >
                    {session.result.class}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Applicable Rule</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{session.result.rule}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRuleClick(session.result.rule)}
                        className="h-6 px-2 text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View Rule Text
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                    <p className="text-sm">{session.result.description}</p>
                  </div>
                </div>

                {/* Official Rule Text - Blue Info Box */}
                {session.result.ruleText && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Official Regulatory Text</p>
                        <p className="italic">{session.result.ruleText}</p>
                        {session.result.ruleSource && (
                          <p className="text-xs mt-2 text-blue-600">Source: {session.result.ruleSource}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Result Disclaimer */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Important Legal Disclaimer</p>
                      <p>
                        <strong>xyreg takes no responsibility for the accuracy of this classification.</strong> 
                        This guidance tool should not replace professional regulatory consultation. 
                        You must verify all classifications with qualified regulatory experts and ensure 
                        compliance with all applicable regulations. Final regulatory responsibility lies with you.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleComplete} className="flex-1">
                    Use This Classification
                  </Button>
                  <Button variant="outline" onClick={restart}>
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg leading-tight">{currentQuestion.text}</CardTitle>
                {currentQuestion.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestion.helpText && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">{currentQuestion.helpText}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 text-left hover:bg-gray-50 border-gray-200"
                      onClick={() => selectOption(option)}
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{option.text}</div>
                        {option.helpText && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {option.helpText}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Disclaimer Footer */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700">
                <p className="font-medium mb-1">Disclaimer</p>
                <p>
                  This assistant provides guidance based on EU MDR Annex VIII classification rules but 
                  <strong> xyreg assumes no responsibility for the accuracy of classifications</strong>. 
                  Always consult with qualified regulatory experts for final validation. 
                  This tool is for informational purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <RuleTextDialog
        isOpen={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        rule={getCurrentRule()}
      />
    </Dialog>
  );
}