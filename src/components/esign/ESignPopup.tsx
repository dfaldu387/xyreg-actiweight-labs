import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PenTool } from 'lucide-react';
import { AssignSigners } from './steps/AssignSigners';
import { SigningCeremony } from './steps/SigningCeremony';
import { SignatureComplete } from './steps/SignatureComplete';
import { SignatureStatusBadge } from './components/SignatureStatusBadge';
import { ESignService } from './lib/esign.service';
import type { ESignPopupProps, ESignRequest, ESignRecord, AuthMethod } from './lib/esign.types';
import { useAuth } from '@/context/AuthContext';

export function ESignPopup({ open, onOpenChange, documentId, documentName, onClose, onComplete, selfSigner }: ESignPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [signRequest, setSignRequest] = useState<ESignRequest | null>(null);
  const [signatureRecord, setSignatureRecord] = useState<ESignRecord | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [postSignError, setPostSignError] = useState<string | null>(null);
  const bootstrapInFlightRef = useRef(false);
  const { user } = useAuth();

  // Reset state when dialog opens so it always starts at step 0
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setSignRequest(null);
      setSignatureRecord(null);
      setAuthMethod(null);
      setBootstrapError(null);
      setPostSignError(null);
      bootstrapInFlightRef.current = false;
    }
  }, [open]);

  // Self-sign flow: when selfSigner is provided, auto-create a single-signer
  // request and jump straight to the signing ceremony (skip Add Signers).
  useEffect(() => {
    if (!open || !selfSigner) return;
    if (signRequest || bootstrapInFlightRef.current) return;
    bootstrapInFlightRef.current = true;
    let cancelled = false;
    (async () => {
      setBootstrapError(null);
      try {
        const documentHash = await ESignService.computeDocumentHash(documentId);
        const request = await ESignService.createSignRequest(
          documentId,
          documentHash,
          selfSigner.userId,
          'parallel',
          [{
            userId: selfSigner.userId,
            displayName: selfSigner.displayName,
            meaning: selfSigner.meaning,
            orderIndex: 0,
          }],
        );
        if (cancelled) return;
        if (request) {
          setSignRequest(request);
          setCurrentStep(1);
        } else {
          setBootstrapError('Failed to start signing session. Please try again.');
        }
      } catch (e) {
        if (cancelled) return;
        console.error('[ESignPopup] self-sign bootstrap failed', e);
        setBootstrapError('An error occurred while preparing the signature. Please try again.');
      } finally {
        bootstrapInFlightRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [open, selfSigner, documentId, signRequest]);

  const handleClose = () => {
    setCurrentStep(0);
    setSignRequest(null);
    setSignatureRecord(null);
    setAuthMethod(null);
    setPostSignError(null);
    bootstrapInFlightRef.current = false;
    onOpenChange(false);
    onClose?.();
  };

  const handleSignersAssigned = (request: ESignRequest) => {
    setSignRequest(request);
    setCurrentStep(1);
  };

  const handleSigned = async (record: ESignRecord, method: AuthMethod) => {
    setSignatureRecord(record);
    setAuthMethod(method);
    setPostSignError(null);
    if (signRequest && onComplete) {
      try {
        await onComplete(signRequest);
      } catch (e) {
        console.error('[ESignPopup] post-signature handler failed', e);
        const extract = (err: unknown): string => {
          if (!err) return 'Unknown error';
          if (err instanceof Error) return err.message;
          if (typeof err === 'string') return err;
          if (typeof err === 'object') {
            const o = err as Record<string, unknown>;
            const parts = [o.message, o.details, o.hint, o.code]
              .filter((x) => typeof x === 'string' && x.length > 0);
            if (parts.length > 0) return parts.join(' — ');
            try { return JSON.stringify(err); } catch { return String(err); }
          }
          return String(err);
        };
        setPostSignError(extract(e));
        setCurrentStep(1);
        return;
      }
    }
    setCurrentStep(2);
  };

  const signedCount = signRequest?.signers.filter(s => s.status === 'signed').length ?? 0;
  const totalCount = signRequest?.signers.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="flex items-start gap-2 min-w-0 flex-1">
              <PenTool className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="break-words leading-snug">
                E-Signature — {documentName}
              </span>
            </DialogTitle>
            <div className="shrink-0">
              <SignatureStatusBadge
                status={signRequest?.status ?? (currentStep === 0 ? 'pending' : currentStep === 1 ? 'in_progress' : 'completed')}
                signedCount={signedCount}
                totalCount={totalCount}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="mt-4">
          {currentStep === 0 && selfSigner && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {bootstrapError ? (
                <span className="text-destructive">{bootstrapError}</span>
              ) : (
                'Preparing your signature…'
              )}
            </div>
          )}
          {currentStep === 0 && !selfSigner && (
            <AssignSigners
              documentId={documentId}
              onSubmit={handleSignersAssigned}
            />
          )}
          {currentStep === 1 && (
            <>
              {postSignError && (
                <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">
                    Signature recorded, but the approval could not be saved.
                  </p>
                  <p className="text-xs text-destructive/80 mt-1 break-words">
                    {postSignError}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your e-signature is captured immutably; retrying will only re-attempt the gate update.
                  </p>
                </div>
              )}
              <SigningCeremony
                documentName={documentName}
                documentId={documentId}
                signRequest={signRequest}
                onSigned={handleSigned}
                onBack={() => (selfSigner ? handleClose() : setCurrentStep(0))}
              />
            </>
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
