import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, RotateCcw, AlertTriangle, FileText, Zap, Shield, Flag } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useSouthKoreaSaMDClassificationAssistant } from '@/hooks/useSouthKoreaSaMDClassificationAssistant';

interface SouthKoreaSaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function SouthKoreaSaMDClassificationAssistant({
  isOpen,
  onClose,
  onClassificationComplete
}: SouthKoreaSaMDClassificationAssistantProps) {
  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useSouthKoreaSaMDClassificationAssistant();

  const handleComplete = () => {
    if (session.result) {
      onClassificationComplete(session.result.class, session.result);
      onClose();
    }
  };

  const getClassColor = (deviceClass: DeviceClass): string => {
    switch (deviceClass) {
      case 'Class 1':
        return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case 'Class 2':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'Class 3':
        return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'Class 4':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class 1':
        return <FileText className="h-5 w-5 text-emerald-600" />;
      case 'Class 2':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'Class 3':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'Class 4':
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
            <Flag className="h-5 w-5 text-blue-600" />
            MFDS Software Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isComplete && session.result ? (
            <Card className={`border-2 ${getClassColor(session.result.class)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  MFDS Software Classification Result
                </CardTitle>
                <CardDescription>
                  Based on your answers, here is the recommended classification under South Korea's Medical Devices Act:
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    MFDS Regulatory Requirements
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {session.result.class === 'Class 4' && (
                      <>
                        <li>• MFDS Pre-market Approval required</li>
                        <li>• Clinical trials in Korea typically required</li>
                        <li>• Korean Authorized Representative (KAR) required</li>
                        <li>• GMP (KGMP) certification required</li>
                        <li>• Korean language documentation</li>
                      </>
                    )}
                    {session.result.class === 'Class 3' && (
                      <>
                        <li>• MFDS Approval required</li>
                        <li>• Clinical data required</li>
                        <li>• Korean Authorized Representative (KAR) required</li>
                        <li>• GMP certification required</li>
                      </>
                    )}
                    {session.result.class === 'Class 2' && (
                      <>
                        <li>• MFDS Certification required</li>
                        <li>• Korean Authorized Representative (KAR) required</li>
                        <li>• Quality management system compliance</li>
                      </>
                    )}
                    {session.result.class === 'Class 1' && (
                      <>
                        <li>• MFDS Notification required</li>
                        <li>• Korean Authorized Representative (KAR) required</li>
                        <li>• Basic quality management</li>
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
                    <li>• MFDS Software guidance compliance</li>
                    <li>• Cybersecurity requirements</li>
                    <li>• Korean language labeling and instructions</li>
                    <li>• Clinical evaluation for Class 3/4</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Disclaimer:</strong> This classification is for guidance only. MFDS requirements are specific to South Korea. Always consult with a Korean regulatory expert.
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">{currentQuestion.helpText}</p>
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
              Question {session.path.length} of MFDS Classification
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
