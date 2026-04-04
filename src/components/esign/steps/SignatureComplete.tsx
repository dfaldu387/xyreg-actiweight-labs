import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Clock, FileSearch } from 'lucide-react';
import { AuditTrailDrawer } from '../components/AuditTrailDrawer';
import { useAuth } from '@/context/AuthContext';
import type { ESignRecord, AuthMethod } from '../lib/esign.types';

const AUTH_METHOD_LABELS: Record<AuthMethod, string> = {
  password_reauth: 'Password Re-Authentication',
  totp_authenticator: 'Google Authenticator (TOTP)',
  email_otp: 'Email OTP Verification',
};

interface SignatureCompleteProps {
  documentId: string;
  documentName: string;
  signatureRecord: ESignRecord | null;
  authMethod: AuthMethod | null;
  onClose: () => void;
}

export function SignatureComplete({ documentId, documentName, signatureRecord, authMethod, onClose }: SignatureCompleteProps) {
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const { user } = useAuth();

  const signedAt = signatureRecord?.signed_at ? new Date(signatureRecord.signed_at) : new Date();
  const dateStr = signedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = signedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const userName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email || 'Unknown';
  const userEmail = user?.email || '';

  const meaningLabel = signatureRecord?.meaning
    ? signatureRecord.meaning.charAt(0).toUpperCase() + signatureRecord.meaning.slice(1)
    : 'Signer';

  const authLabel = authMethod ? AUTH_METHOD_LABELS[authMethod] : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800">Signature Applied Successfully</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You signed as <span className="font-medium text-foreground">{meaningLabel}</span> on {dateStr} at {timeStr}
        </p>
      </div>

      {/* Signature Metadata */}
      <div className="border rounded-lg divide-y">
        <div className="px-4 py-3 bg-muted/30">
          <h4 className="text-sm font-semibold">Signature Record</h4>
          <p className="text-xs text-muted-foreground">This record is immutable and cannot be modified</p>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Signer</p>
            <p className="text-sm">{userName} ({userEmail})</p>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Timestamp (UTC)</p>
            <p className="text-sm">{signedAt.toISOString()}</p>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Authentication Method</p>
            <p className="text-sm">{authLabel}</p>
          </div>
        </div>

        {signatureRecord?.document_hash && (
          <div className="px-4 py-3 flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Document Hash (SHA-256)</p>
              <p className="text-xs font-mono text-muted-foreground break-all">{signatureRecord.document_hash}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setShowAuditTrail(true)} className="gap-2">
          <FileSearch className="h-4 w-4" />
          View Audit Trail
        </Button>
        <Button onClick={onClose} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Close
        </Button>
      </div>

      <AuditTrailDrawer
        open={showAuditTrail}
        onOpenChange={setShowAuditTrail}
        documentId={documentId}
        documentName={documentName}
      />
    </div>
  );
}
