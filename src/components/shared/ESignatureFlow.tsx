import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenTool, User, Shield, Clock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReAuthContent } from '@/components/esign/components/ReAuthContent';
import { ESignService } from '@/components/esign/lib/esign.service';
import type { AuthMethod } from '@/components/esign/lib/esign.types';

const SIGNATURE_MEANINGS = [
  { value: 'reviewer', label: 'Reviewer — I have reviewed this document' },
  { value: 'approver', label: 'Approver — I approve this document' },
  { value: 'author', label: 'Author — I authored this document' },
  { value: 'other', label: 'Other' },
];

type SignStep = 'form' | 'reauth' | 'complete';

interface ESignatureFlowProps {
  documentId: string;
  documentName: string;
  meaning?: string;
  lockMeaning?: boolean;
  onComplete: () => void;
  onBack: () => void;
  filePath?: string;
}

export function ESignatureFlow({
  documentId,
  documentName,
  meaning = 'author',
  lockMeaning = true,
  onComplete,
  onBack,
  filePath,
}: ESignatureFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<SignStep>('form');
  const [fullLegalName, setFullLegalName] = useState('');
  const [signatureMeaning, setSignatureMeaning] = useState(meaning);
  const [customMeaning, setCustomMeaning] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const effectiveMeaning = signatureMeaning === 'other' ? customMeaning : signatureMeaning;

  const handleProceedToReAuth = () => {
    if (!fullLegalName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }
    if (signatureMeaning === 'other' && !customMeaning.trim()) {
      toast.error('Please enter a custom meaning');
      return;
    }
    setStep('reauth');
  };

  const handleAuthenticated = async (method: AuthMethod) => {
    setIsSigning(true);
    try {
      const cleanDocId = documentId.replace(/^template-/, '');
      const documentHash = await ESignService.computeDocumentHash(filePath || cleanDocId);

      await ESignService.logAuditEvent(
        cleanDocId, null, user?.id || '', 'signature_applied',
        { meaning: effectiveMeaning, auth_method: method, full_legal_name: fullLegalName }
      );

      const { error: signError } = await supabase
        .from('esign_records')
        .insert({
          user_id: user?.id,
          document_id: cleanDocId,
          document_hash: documentHash,
          meaning: effectiveMeaning,
          user_agent: navigator.userAgent,
          auth_method: method,
          full_legal_name: fullLegalName,
        });

      if (signError) throw signError;

      setStep('complete');
      toast.success('Signature applied successfully');
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('Signing error:', err);
      toast.error('Failed to apply signature');
    } finally {
      setIsSigning(false);
    }
  };

  // Complete step
  if (step === 'complete') {
    return (
      <div className="space-y-4 py-4">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-base font-semibold text-green-800">Signed Successfully</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Signed by <strong>{fullLegalName}</strong> as <strong>{effectiveMeaning}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Re-auth step — reuses ReAuthContent inline
  if (step === 'reauth') {
    return (
      <div className="space-y-2 py-2">
        <ReAuthContent
          email={user?.email || ''}
          onAuthenticated={handleAuthenticated}
          onCancel={() => setStep('form')}
          active={true}
        />
      </div>
    );
  }

  // Form step
  return (
    <div className="space-y-4 py-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <PenTool className="h-4 w-4 text-primary" />
        Electronic Signature — {documentName}
      </h4>

      <div className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Full Legal Name *
            </Label>
            <Input
              value={fullLegalName}
              onChange={(e) => setFullLegalName(e.target.value)}
              placeholder="Type your full legal name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Meaning of Signature *
            </Label>
            <Select value={signatureMeaning} onValueChange={setSignatureMeaning} disabled={lockMeaning}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIGNATURE_MEANINGS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {signatureMeaning === 'other' && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Custom Meaning *</Label>
              <Input
                value={customMeaning}
                onChange={(e) => setCustomMeaning(e.target.value)}
                placeholder="Enter custom meaning of signature"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Date
            </Label>
            <Input value={dateStr} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Time
            </Label>
            <Input value={timeStr} disabled className="bg-muted" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          By signing, you confirm that the information above is accurate. Your electronic signature is legally
          equivalent to a handwritten signature per FDA 21 CFR Part 11. You will be required to re-authenticate
          before your signature is applied.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleProceedToReAuth} className="gap-2" disabled={isSigning || !fullLegalName.trim()}>
          <PenTool className="h-4 w-4" /> Send
        </Button>
      </div>
    </div>
  );
}
