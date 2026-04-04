import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, CheckCircle, Stethoscope, AlertTriangle, Zap } from 'lucide-react';
import { useEUSaMDClassificationAssistant } from '@/hooks/useEUSaMDClassificationAssistant';
import { DeviceClass, ClassificationResult } from '@/types/classification';

interface EUSaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (result: ClassificationResult) => void;
  onUseClassification?: (result: ClassificationResult) => void;
}

export function EUSaMDClassificationAssistant({
  isOpen,
  onClose,
  onClassificationComplete,
  onUseClassification
}: EUSaMDClassificationAssistantProps) {


  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useEUSaMDClassificationAssistant();

  const handleComplete = () => {
    if (session.result) {
      onClassificationComplete(session.result);
    }
    onClose();
  };

  const handleUseClassification = () => {
    if (session.result && onUseClassification) {
      onUseClassification(session.result);
    }
    onClose();
  };

  const getClassColor = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class I':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'Class IIa':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Class IIb':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Class III':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getClassIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case 'Class I':
        return <CheckCircle className="h-5 w-5" />;
      case 'Class IIa':
        return <Stethoscope className="h-5 w-5" />;
      case 'Class IIb':
        return <AlertTriangle className="h-5 w-5" />;
      case 'Class III':
        return <Zap className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            EU MDR SaMD Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isComplete ? (
            <>
              {/* Question Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                  {currentQuestion.description && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {currentQuestion.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
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

              {/* Help Text */}
              {currentQuestion.helpText && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-800">{currentQuestion.helpText}</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Classification Result */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  SaMD Classification Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.result && (
                  <>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getClassColor(session.result.class)} flex items-center gap-2 text-base px-3 py-1`}>
                        {getClassIcon(session.result.class)}
                        {session.result.class}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p><strong>Rule:</strong> {session.result.rule}</p>
                      <p><strong>Description:</strong> {session.result.description}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Important EU MDR Requirements for SaMD:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• SaMD must comply with software lifecycle requirements (IEC 62304)</li>
                        <li>• Clinical evaluation specific to software performance required</li>
                        <li>• Quality management system must address software development processes</li>
                        <li>• Post-market surveillance must include software performance monitoring</li>
                        <li>• Algorithm transparency and validation documentation required</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {canGoBack && (
                <Button variant="outline" onClick={goBack} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous Question
                </Button>
              )}
              <Button variant="outline" onClick={restart} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Start Over
              </Button>
            </div>

            {isComplete && (
              <div className="flex gap-2">
                {onUseClassification && (
                  <Button onClick={handleUseClassification} variant="default">
                    Use Classification
                  </Button>
                )}
                <Button onClick={handleComplete} variant="outline">
                  Complete Classification
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}