import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, RotateCcw, AlertTriangle, FileText, Zap, Shield, Flag } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useChinaSaMDClassificationAssistant } from '@/hooks/useChinaSaMDClassificationAssistant';

interface ChinaSaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function ChinaSaMDClassificationAssistant({
  isOpen,
  onClose,
  onClassificationComplete
}: ChinaSaMDClassificationAssistantProps) {
  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useChinaSaMDClassificationAssistant();

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
        return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'Class III':
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
        return <Zap className="h-5 w-5 text-amber-600" />;
      case 'Class III':
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
            <Flag className="h-5 w-5 text-red-600" />
            NMPA Software Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isComplete && session.result ? (
            <Card className={`border-2 ${getClassColor(session.result.class)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  NMPA Software Classification Result
                </CardTitle>
                <CardDescription>
                  Based on your answers, here is the recommended classification under NMPA regulations:
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

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-800 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    NMPA Regulatory Requirements
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {session.result.class === 'Class III' && (
                      <>
                        <li>• NMPA registration required (pre-market approval)</li>
                        <li>• Clinical trials in China required</li>
                        <li>• Chinese Agent or Legal Manufacturer required</li>
                        <li>• GMP certification required</li>
                        <li>• Chinese language documentation</li>
                      </>
                    )}
                    {session.result.class === 'Class II' && (
                      <>
                        <li>• NMPA registration required</li>
                        <li>• Quality management system certification</li>
                        <li>• Chinese Agent required for foreign manufacturers</li>
                        <li>• Chinese language documentation</li>
                      </>
                    )}
                    {session.result.class === 'Class I' && (
                      <>
                        <li>• NMPA filing (Bei'an) required</li>
                        <li>• Basic quality management requirements</li>
                        <li>• Chinese Agent required for foreign manufacturers</li>
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
                    <li>• GB/T 25000.51: Software product quality requirements</li>
                    <li>• Cybersecurity requirements per NMPA guidance</li>
                    <li>• Software description document (SDD) required</li>
                    <li>• Clinical evaluation report for Class II/III</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Disclaimer:</strong> This classification is for guidance only. NMPA regulations require specific documentation in Chinese. Always consult with a Chinese regulatory expert.
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{currentQuestion.helpText}</p>
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
              Question {session.path.length} of NMPA Classification
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
