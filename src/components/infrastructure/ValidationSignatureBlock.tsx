import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PenLine, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserSelector } from '@/components/common/UserSelector';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type SignatureMeaning = 'authorship' | 'review' | 'qa_release';

interface SignatureData {
  initiatorId?: string;
  initiatorSignedAt?: string;
  initiatorMeaning?: SignatureMeaning;
  approverId?: string;
  approverSignedAt?: string;
  approverMeaning?: SignatureMeaning;
}

interface ValidationSignatureBlockProps {
  phase: 'iq' | 'oq' | 'pq';
  signatures: SignatureData;
  companyId?: string;
  onSignAsInitiator: (meaning: SignatureMeaning) => void;
  onSignAsApprover: (meaning: SignatureMeaning, approverId: string) => void;
  disabled?: boolean;
}

const MEANING_LABELS: Record<SignatureMeaning, string> = {
  authorship: 'Authorship',
  review: 'Review',
  qa_release: 'QA Release',
};

const PHASE_LABELS: Record<string, string> = {
  iq: 'Installation Qualification (IQ)',
  oq: 'Operational Qualification (OQ)',
  pq: 'Performance Qualification (PQ)',
};

export function ValidationSignatureBlock({
  phase,
  signatures,
  companyId,
  onSignAsInitiator,
  onSignAsApprover,
  disabled = false,
}: ValidationSignatureBlockProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [initiatorMeaning, setInitiatorMeaning] = useState<SignatureMeaning>('authorship');
  const [approverMeaning, setApproverMeaning] = useState<SignatureMeaning>('review');
  const [selectedApproverId, setSelectedApproverId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  const isInitiatorSigned = !!signatures.initiatorSignedAt;
  const isApproverSigned = !!signatures.approverSignedAt;
  const isSameUser = currentUserId && signatures.initiatorId === currentUserId;

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">
            Signatures — {PHASE_LABELS[phase]}
          </h4>
          <Badge variant="outline" className="text-xs ml-auto">
            21 CFR Part 11
          </Badge>
        </div>

        <Separator />

        {/* Initiator Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Initiator
          </Label>

          {isInitiatorSigned ? (
            <div className="flex items-center gap-3 p-3 rounded-md bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800">Signed</p>
                <p className="text-xs text-emerald-600">
                  Meaning: {signatures.initiatorMeaning ? MEANING_LABELS[signatures.initiatorMeaning] : '—'} •{' '}
                  {signatures.initiatorSignedAt
                    ? format(new Date(signatures.initiatorSignedAt), 'PPpp')
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={initiatorMeaning}
                onValueChange={(v) => setInitiatorMeaning(v as SignatureMeaning)}
                disabled={disabled}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Meaning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="authorship">Authorship</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="qa_release">QA Release</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="default"
                onClick={() => onSignAsInitiator(initiatorMeaning)}
                disabled={disabled}
                className="h-8 text-xs"
              >
                <PenLine className="h-3 w-3 mr-1" />
                Sign as Initiator
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Approver Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Approver
          </Label>

          {isApproverSigned ? (
            <div className="flex items-center gap-3 p-3 rounded-md bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800">Signed</p>
                <p className="text-xs text-emerald-600">
                  Meaning: {signatures.approverMeaning ? MEANING_LABELS[signatures.approverMeaning] : '—'} •{' '}
                  {signatures.approverSignedAt
                    ? format(new Date(signatures.approverSignedAt), 'PPpp')
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {!isInitiatorSigned && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Awaiting Initiator signature first
                </div>
              )}

              {isInitiatorSigned && (
                <>
                  <UserSelector
                    value={selectedApproverId}
                    onValueChange={(v) => setSelectedApproverId(v)}
                    companyId={companyId}
                    label="Select Approver"
                    placeholder="Choose approver..."
                    allowClear={false}
                    className="[&_label]:text-xs"
                  />

                  {isSameUser && selectedApproverId === currentUserId && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Approver cannot be the same as Initiator (Separation of Duties)
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Select
                      value={approverMeaning}
                      onValueChange={(v) => setApproverMeaning(v as SignatureMeaning)}
                      disabled={disabled || !selectedApproverId}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Meaning" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="qa_release">QA Release</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => selectedApproverId && onSignAsApprover(approverMeaning, selectedApproverId)}
                      disabled={
                        disabled ||
                        !selectedApproverId ||
                        (!!currentUserId && selectedApproverId === signatures.initiatorId)
                      }
                      className="h-8 text-xs"
                    >
                      <PenLine className="h-3 w-3 mr-1" />
                      Sign as Approver
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
