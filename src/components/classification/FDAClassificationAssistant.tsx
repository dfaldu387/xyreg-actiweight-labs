import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FDAClassificationResult {
  productCode: string;
  productCodeName: string;
  deviceClass: 'Class I' | 'Class II' | 'Class III';
  regulatoryPathway: '510(k) Exempt' | '510(k) Clearance' | 'PMA';
  panelName: string;
  rationale: string;
  riskFactors: string[];
  predicateDevices: string[];
  fdaGuidanceLinks: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FDAClassificationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (deviceClass: 'Class I' | 'Class II' | 'Class III', result: FDAClassificationResult) => void;
}

export function FDAClassificationAssistant({ isOpen, onClose, onComplete }: FDAClassificationAssistantProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FDAClassificationResult | null>(null);

  const [formData, setFormData] = useState({
    deviceDescription: '',
    intendedUse: '',
    bodyContact: '',
    technology: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return formData.deviceDescription.length > 20;
    if (step === 2) return formData.intendedUse.length > 20;
    if (step === 3) return formData.bodyContact !== '';
    if (step === 4) return formData.technology !== '';
    return false;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      await handleClassify();
    }
  };

  const handleClassify = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fda-classify', {
        body: formData
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (data.error.includes('Payment required')) {
          toast.error('AI credits exhausted. Please add credits to your workspace.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      setResult(data as FDAClassificationResult);
      setStep(5);
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Failed to classify device. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result.deviceClass, result);
      handleReset();
    }
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    setFormData({
      deviceDescription: '',
      intendedUse: '',
      bodyContact: '',
      technology: '',
    });
    onClose();
  };

  const getConfidenceBadge = (confidence: string) => {
    const styles = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[confidence as keyof typeof styles]}`}>
        {confidence.toUpperCase()} Confidence
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🇺🇸 FDA Device Classification Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          {step <= 4 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Device Description */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-base font-semibold">Device Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide a detailed description of your medical device, including its design, components, and functionality.
                </p>
              </div>
              <Textarea
                placeholder="Example: A handheld ultrasound imaging device that uses piezoelectric transducers to generate real-time images of internal body structures..."
                value={formData.deviceDescription}
                onChange={(e) => handleInputChange('deviceDescription', e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                {formData.deviceDescription.length} characters (minimum 20)
              </p>
            </div>
          )}

          {/* Step 2: Intended Use */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-base font-semibold">Intended Use & Indications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe the specific clinical purpose, target patient population, and conditions the device is intended to diagnose, treat, or monitor.
                </p>
              </div>
              <Textarea
                placeholder="Example: Intended for use by trained healthcare professionals to diagnose cardiac abnormalities in adult patients in hospital settings..."
                value={formData.intendedUse}
                onChange={(e) => handleInputChange('intendedUse', e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                {formData.intendedUse.length} characters (minimum 20)
              </p>
            </div>
          )}

          {/* Step 3: Body Contact */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-base font-semibold">Body Contact Type</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  How does the device interact with the patient's body?
                </p>
              </div>
              <RadioGroup value={formData.bodyContact} onValueChange={(val) => handleInputChange('bodyContact', val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-contact" id="non-contact" />
                  <Label htmlFor="non-contact" className="font-normal cursor-pointer">
                    Non-contact (e.g., diagnostic software, lab equipment)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="surface-contact" id="surface-contact" />
                  <Label htmlFor="surface-contact" className="font-normal cursor-pointer">
                    Surface contact (e.g., electrode pads, ultrasound probe)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external-communicating" id="external-communicating" />
                  <Label htmlFor="external-communicating" className="font-normal cursor-pointer">
                    External communicating (e.g., endoscope, catheter)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="implantable" id="implantable" />
                  <Label htmlFor="implantable" className="font-normal cursor-pointer">
                    Implantable (e.g., pacemaker, hip implant)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Technology */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-base font-semibold">Technology Type</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  What is the primary technology or mechanism of action?
                </p>
              </div>
              <RadioGroup value={formData.technology} onValueChange={(val) => handleInputChange('technology', val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mechanical" id="mechanical" />
                  <Label htmlFor="mechanical" className="font-normal cursor-pointer">
                    Mechanical (e.g., surgical instruments, wheelchairs)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="electronic" id="electronic" />
                  <Label htmlFor="electronic" className="font-normal cursor-pointer">
                    Electronic/Electrical (e.g., monitors, imaging devices)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="software" id="software" />
                  <Label htmlFor="software" className="font-normal cursor-pointer">
                    Software as a Medical Device (SaMD)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="biological" id="biological" />
                  <Label htmlFor="biological" className="font-normal cursor-pointer">
                    Biological/Chemical (e.g., test kits, drug-device combo)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combination" id="combination" />
                  <Label htmlFor="combination" className="font-normal cursor-pointer">
                    Combination product
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && result && (
            <div className="space-y-6 animate-fade-in">
              <Alert className={result.confidence === 'high' ? 'border-green-500 bg-green-50' : result.confidence === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {result.confidence === 'high' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-base">Classification Result</div>
                      <div className="text-sm">
                        <span className="font-medium">Device Class:</span> {result.deviceClass}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Regulatory Pathway:</span> {result.regulatoryPathway}
                      </div>
                    </div>
                  </div>
                  {getConfidenceBadge(result.confidence)}
                </div>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Product Code</Label>
                  <p className="text-sm mt-1">
                    <span className="font-mono font-medium">{result.productCode}</span> - {result.productCodeName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Medical Specialty Panel: {result.panelName}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Classification Rationale</Label>
                  <p className="text-sm text-muted-foreground mt-1">{result.rationale}</p>
                </div>

                {result.riskFactors.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Key Risk Factors</Label>
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
                      {result.riskFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.predicateDevices.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Suggested Predicate Devices (for 510(k))</Label>
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
                      {result.predicateDevices.map((device, idx) => (
                        <li key={idx}>{device}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Label className="text-sm font-semibold mb-2 block">Verification & Resources</Label>
                  <div className="space-y-2">
                    <a
                      href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm?start_search=1&productcode=${result.productCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View FDA Product Classification Database
                    </a>
                    <a
                      href="https://www.fda.gov/medical-devices/classify-your-medical-device/how-determine-if-your-product-medical-device"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      FDA: How to Determine if Your Product is a Medical Device
                    </a>
                    {result.fdaGuidanceLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        FDA Guidance Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>

                {result.confidence !== 'high' && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> This classification has {result.confidence} confidence. We recommend consulting with a regulatory expert and verifying with FDA's official product classification database.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {step > 1 && step <= 4 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 5 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                Start Over
              </Button>
            )}

            {step < 5 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : step === 4 ? (
                  'Classify Device'
                ) : (
                  'Next'
                )}
              </Button>
            )}

            {step === 5 && result && (
              <Button onClick={handleComplete} className="ml-auto">
                Use This Classification
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}