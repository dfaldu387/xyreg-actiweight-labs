import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, PenTool, Clock, User, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { ReAuthDialog } from '../components/ReAuthDialog';
import { ESignService } from '../lib/esign.service';
import { SIGNATURE_MEANINGS } from '../lib/esign.constants';
import { useAuth } from '@/context/AuthContext';
import type { ESignRequest, ESignRecord, AuthMethod } from '../lib/esign.types';

interface SigningCeremonyProps {
  documentName: string;
  documentId: string;
  signRequest: ESignRequest | null;
  onSigned: (record: ESignRecord, authMethod: AuthMethod) => void;
  onBack: () => void;
}

export function SigningCeremony({ documentName, documentId, signRequest, onSigned, onBack }: SigningCeremonyProps) {
  const [showReAuth, setShowReAuth] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Find current user's signer record
  const currentSigner = signRequest?.signers.find(s => s.user_id === user?.id);
  const meaningLabel = SIGNATURE_MEANINGS.find(m => m.value === currentSigner?.meaning)?.label ?? 'Signer';
  const userName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email || 'Unknown';
  const userEmail = user?.email || '';

  const handleAuthenticated = async (authMethod: AuthMethod) => {
    if (!signRequest || !currentSigner || !user?.id) return;

    setIsSigning(true);
    setError('');
    try {
      const documentHash = await ESignService.computeDocumentHash(documentId);

      const record = await ESignService.signDocument(
        signRequest.id,
        currentSigner.id,
        user.id,
        documentHash,
        currentSigner.meaning,
        authMethod
      );

      if (record) {
        onSigned(record, authMethod);
      } else {
        setError('Failed to apply signature. Please try again.');
      }
    } catch (err) {
      console.error('[ESign] Signing error:', err);
      setError('An error occurred while signing. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Document Preview</span>
          <span className="text-xs text-muted-foreground ml-auto">Read-only</span>
        </div>
        <div className="bg-gray-50 flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">{documentName}</p>
            <p className="text-xs text-muted-foreground">Document preview rendered here (PDF/image)</p>
          </div>
        </div>
      </div>

      {/* Signature Form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <PenTool className="h-4 w-4 text-primary" />
          Electronic Signature
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Full Name
            </Label>
            <Input value={userName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Meaning of Signature
            </Label>
            <Input value={meaningLabel} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Date
            </Label>
            <Input value={dateStr} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Time
            </Label>
            <Input value={timeStr} disabled className="bg-muted" />
          </div>
        </div>
      </div>

      {/* Part 11 Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          By signing, you confirm that the information above is accurate. Your electronic signature is legally
          equivalent to a handwritten signature per FDA 21 CFR Part 11. You will be required to re-authenticate
          before your signature is applied.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => setShowReAuth(true)}
          size="lg"
          className="gap-2"
          disabled={isSigning || !currentSigner}
        >
          {isSigning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PenTool className="h-4 w-4" />
          )}
          {isSigning ? 'Applying Signature...' : 'Sign Document'}
        </Button>
      </div>

      <ReAuthDialog
        open={showReAuth}
        onOpenChange={setShowReAuth}
        email={userEmail}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
