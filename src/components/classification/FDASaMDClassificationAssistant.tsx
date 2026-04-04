import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, RotateCcw, AlertTriangle, FileText, Zap, Shield, Flag } from 'lucide-react';
import { DeviceClass, ClassificationResult } from '@/types/classification';
import { useFDASaMDClassificationAssistant } from '@/hooks/useFDASaMDClassificationAssistant';

interface FDASaMDClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationComplete: (deviceClass: DeviceClass, result?: ClassificationResult) => void;
}

export function FDASaMDClassificationAssistant({ 
  isOpen, 
  onClose, 
  onClassificationComplete 
}: FDASaMDClassificationAssistantProps) {
  const {
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    session
  } = useFDASaMDClassificationAssistant();

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
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
  };

  const getRegulatoryPathway = (deviceClass: DeviceClass): string => {
    switch (deviceClass) {
      case 'Class I':
        return '510(k) Exempt (General Controls)';
      case 'Class II':
        return '510(k) Clearance (Special Controls)';
      case 'Class III':
        return 'PMA or De Novo Classification';
      default:
        return 'Consult FDA guidance';
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
            FDA SaMD Classification Assistant (IMDRF Framework)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isComplete && session.result ? (
            // Result Display
            <Card className={`border-2 ${getClassColor(session.result.class)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getClassIcon(session.result.class)}
                  FDA SaMD Classification Result
                </CardTitle>
                <CardDescription>
                  Based on the IMDRF risk categorization framework:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Device Classification:</h4>
                    <Badge variant="outline" className={`text-lg px-3 py-1 ${getClassColor(session.result.class)}`}>
                      {session.result.class}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Regulatory Pathway:</h4>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {getRegulatoryPathway(session.result.class)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">IMDRF Category & Rationale:</h4>
                  <p className="text-sm text-muted-foreground">{session.result.rule}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description:</h4>
                  <p className="text-sm">{session.result.description}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    FDA Regulatory Requirements
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 21 CFR Part 820: Quality System Regulation (QSR)</li>
                    <li>• 21 CFR Part 11: Electronic records and signatures</li>
                    <li>• FDA Cybersecurity Guidance: Pre-market and post-market</li>
                    <li>• Medical Device Reporting (MDR) requirements</li>
                    <li>• Establishment registration and device listing</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    SaMD-Specific FDA Guidance
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• FDA SaMD Guidance: Software as a Medical Device</li>
                    <li>• Clinical Decision Support Software Guidance</li>
                    <li>• AI/ML-Based SaMD Action Plan considerations</li>
                    <li>• Software Pre-Cert considerations (if applicable)</li>
                    <li>• Predetermined Change Control Plan (PCCP) for AI/ML</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800">Key FDA Standards:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>IEC 62304:</strong> Medical device software lifecycle (FDA-recognized)</li>
                    <li>• <strong>ISO 14971:</strong> Risk management</li>
                    <li>• <strong>IEC 62366-1:</strong> Usability engineering</li>
                    <li>• <strong>AAMI TIR57:</strong> Medical device cybersecurity</li>
                    <li>• <strong>IMDRF SaMD Documents:</strong> N10, N12, N23</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Disclaimer:</strong> This classification is for guidance only and should not replace professional regulatory consultation. 
                    FDA classification depends on intended use, indications for use, and specific product characteristics. 
                    Always verify with FDA guidance and consider Pre-Submission meetings for novel products.
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
              Question {session.path.length} of FDA IMDRF Classification
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
