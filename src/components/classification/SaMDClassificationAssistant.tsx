import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, RotateCcw, AlertTriangle, FileText, Zap } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useSaMDClassificationAssistant } from '@/hooks/useSaMDClassificationAssistant';

interface SaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function SaMDClassificationAssistant({ 
  isOpen, 
  onClose, 
  onClassificationComplete 
}: SaMDClassificationAssistantProps) {
  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useSaMDClassificationAssistant();

  const handleComplete = () => {
    if (session.result) {
      onClassificationComplete(session.result.class, session.result);
      onClose();
    }
  };

  const getClassColor = (deviceClass: DeviceClass): string => {
    switch (deviceClass) {
      case 'Class A':
        return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case 'Class B':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'Class C':
        return 'text-amber-600 border-amber-200 bg-amber-50';
      default:
        return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class A':
        return <FileText className="h-5 w-5 text-emerald-600" />;
      case 'Class B':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'Class C':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
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
            <Zap className="h-5 w-5 text-blue-600" />
            Software as a Medical Device (SaMD) Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isComplete && session.result ? (
            // Result Display
            <Card className={`border-2 ${getClassColor(session.result.class)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  SaMD Classification Result
                </CardTitle>
                <CardDescription>
                  Based on your answers, here is the recommended classification:
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
                  <h4 className="font-semibold mb-2">Applicable Rule/Standard:</h4>
                  <p className="text-sm text-muted-foreground">{session.result.rule}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description:</h4>
                  <p className="text-sm">{session.result.description}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Important Software Requirements
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• IEC 62304: Software lifecycle processes must be followed</li>
                    <li>• ISO 14971: Risk management must include software-specific risks</li>
                    <li>• Software validation and verification documentation required</li>
                    <li>• Cybersecurity considerations per MDR Annex I, Section 17</li>
                    <li>• Clinical evaluation may include software performance studies</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800">Key Software Standards:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>IEC 62304:</strong> Medical device software - Software life cycle processes</li>
                    <li>• <strong>IEC 62366-1:</strong> Medical devices - Usability engineering</li>
                    <li>• <strong>ISO 14155:</strong> Clinical investigation of medical devices</li>
                    <li>• <strong>ISO 27001:</strong> Information security management</li>
                    <li>• <strong>FDA Software as Medical Device Guidance</strong></li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Disclaimer:</strong> This classification is for guidance only and should not replace professional regulatory consultation. 
                    Software medical devices require specialized expertise in software validation, cybersecurity, and lifecycle management.
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
            // Question Display
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

          {/* Navigation */}
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
              Question {session.path.length} of SaMD Classification
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}