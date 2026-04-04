import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Stepper } from '@/components/ui/stepper';
import { PenTool } from 'lucide-react';
import { AssignSigners } from './steps/AssignSigners';
import { SigningCeremony } from './steps/SigningCeremony';
import { SignatureComplete } from './steps/SignatureComplete';
import { SignatureStatusBadge } from './components/SignatureStatusBadge';
import { ESignService } from './lib/esign.service';
import type { ESignPopupProps, ESignRequest, ESignRecord, AuthMethod } from './lib/esign.types';
import { useAuth } from '@/context/AuthContext';

const STEPS = ['Assign Signers', 'Sign Document', 'Complete'];

export function ESignPopup({ open, onOpenChange, documentId, documentName, onClose, onComplete }: ESignPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [signRequest, setSignRequest] = useState<ESignRequest | null>(null);
  const [signatureRecord, setSignatureRecord] = useState<ESignRecord | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const { user } = useAuth();

  // Reset state when dialog opens so it always starts at step 0
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setSignRequest(null);
      setSignatureRecord(null);
      setAuthMethod(null);
    }
  }, [open]);

  const handleClose = () => {
    setCurrentStep(0);
    setSignRequest(null);
    setSignatureRecord(null);
    setAuthMethod(null);
    onOpenChange(false);
    onClose?.();
  };

  const handleSignersAssigned = (request: ESignRequest) => {
    setSignRequest(request);
    setCurrentStep(1);
  };

  const handleSigned = (record: ESignRecord, method: AuthMethod) => {
    setSignatureRecord(record);
    setAuthMethod(method);
    setCurrentStep(2);
    if (signRequest) {
      onComplete?.(signRequest);
    }
  };

  const signedCount = signRequest?.signers.filter(s => s.status === 'signed').length ?? 0;
  const totalCount = signRequest?.signers.length ?? 0;

  // Stepper uses 1-based indexing
  const stepperStep = currentStep + 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              E-Signature — {documentName}
            </DialogTitle>
            <SignatureStatusBadge
              status={signRequest?.status ?? (currentStep === 0 ? 'pending' : currentStep === 1 ? 'in_progress' : 'completed')}
              signedCount={signedCount}
              totalCount={totalCount}
            />
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="py-2">
          <Stepper steps={STEPS} currentStep={stepperStep} orientation="horizontal" />
        </div>

        {/* Step Content */}
        <div className="mt-4">
          {currentStep === 0 && (
            <AssignSigners
              documentId={documentId}
              onSubmit={handleSignersAssigned}
            />
          )}
          {currentStep === 1 && (
            <SigningCeremony
              documentName={documentName}
              documentId={documentId}
              signRequest={signRequest}
              onSigned={handleSigned}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && (
            <SignatureComplete
              documentId={documentId}
              documentName={documentName}
              signatureRecord={signatureRecord}
              authMethod={authMethod}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
