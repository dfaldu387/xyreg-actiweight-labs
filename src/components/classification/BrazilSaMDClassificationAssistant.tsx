import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, RotateCcw, AlertTriangle, FileText, Zap, Shield, Flag } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useBrazilSaMDClassificationAssistant } from '@/hooks/useBrazilSaMDClassificationAssistant';

interface BrazilSaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function BrazilSaMDClassificationAssistant({
  isOpen,
  onClose,
  onClassificationComplete
}: BrazilSaMDClassificationAssistantProps) {
  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useBrazilSaMDClassificationAssistant();

  const handleComplete = () => {
    if (session.result) {
      onClassificationComplete(session.result.class, session.result);
      onClose();
    }
  };

  const getClassColor = (deviceClass: DeviceClass): string => {
    switch (deviceClass) {
      case 'Class I':
        return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case 'Class II':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'Class III':
        return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'Class IV':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class I':
        return <FileText className="h-5 w-5 text-emerald-600" />;
      case 'Class II':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'Class III':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'Class IV':
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-600" />
            ANVISA Software Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isComplete && session.result ? (
            <Card className={`border-2 ${getClassColor(session.result.class)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  ANVISA Software Classification Result
                </CardTitle>
                <CardDescription>
                  Based on your answers, here is the recommended classification under ANVISA regulations:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Classification:</h4>
                  <Badge variant="outline" className={`text-lg px-3 py-1 ${getClassColor(session.result.class)}`}>
                    {session.result.class}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Applicable Rule:</h4>
                  <p className="text-sm text-muted-foreground">{session.result.rule}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Description:</h4>
                  <p className="text-sm">{session.result.description}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    ANVISA Regulatory Requirements
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {session.result.class === 'Class IV' && (
                      <>
                        <li>• Full ANVISA registration required</li>
                        <li>• Good Manufacturing Practices (BPF) certification</li>
                        <li>• Brazilian Representative (BRH) required</li>
                        <li>• Clinical evidence required</li>
                        <li>• Post-market surveillance program</li>
                      </>
                    )}
                    {session.result.class === 'Class III' && (
                      <>
                        <li>• ANVISA registration required</li>
                        <li>• Quality management system certification</li>
                        <li>• Clinical evidence required</li>
                        <li>• Brazilian Representative (BRH) required</li>
                      </>
                    )}
                    {session.result.class === 'Class II' && (
                      <>
                        <li>• ANVISA notification required</li>
                        <li>• Quality management system</li>
                        <li>• Brazilian Representative (BRH) required</li>
                      </>
                    )}
                    {session.result.class === 'Class I' && (
                      <>
                        <li>• Basic ANVISA registration</li>
                        <li>• Quality management requirements</li>
                        <li>• Labeling in Portuguese</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Software-Specific Requirements
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• IEC 62304: Medical device software lifecycle</li>
                    <li>• ISO 14971: Risk management</li>
                    <li>• IN 77/2020: ANVISA software guidance</li>
                    <li>• Cybersecurity requirements</li>
                    <li>• Portuguese language documentation</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Disclaimer:</strong> This classification is for guidance only. Always verify requirements with ANVISA and consult with a Brazilian regulatory expert.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleComplete} className="flex-1">
                    Use This Classification
                  </Button>
                  <Button variant="outline" onClick={restart}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{currentQuestion.text}</CardTitle>
                {currentQuestion.description && (
                  <CardDescription>{currentQuestion.description}</CardDescription>
                )}
                {currentQuestion.helpText && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">{currentQuestion.helpText}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full justify-between h-auto p-4 text-left"
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
                    <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={!canGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous Question
            </Button>

            <div className="text-sm text-muted-foreground">
              Question {session.path.length} of ANVISA Classification
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
