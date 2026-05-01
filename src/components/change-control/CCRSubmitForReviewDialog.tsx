import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanyUsers, type CompanyUser } from '@/hooks/useCompanyUsers';

export interface CCRSubmitForReviewPayload {
  reason: string;
  technical_reviewer_id: string;
  quality_reviewer_id: string;
  regulatory_reviewer_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  initial?: {
    technical_reviewer_id?: string | null;
    quality_reviewer_id?: string | null;
    regulatory_reviewer_id?: string | null;
  };
  onConfirm: (payload: CCRSubmitForReviewPayload) => Promise<void> | void;
}

export function CCRSubmitForReviewDialog({
  open,
  onOpenChange,
  companyId,
  initial,
  onConfirm,
}: Props) {
  const { users, isLoading } = useCompanyUsers(companyId);
  const [reason, setReason] = useState('');
  const [technical, setTechnical] = useState<string>(initial?.technical_reviewer_id ?? '');
  const [quality, setQuality] = useState<string>(initial?.quality_reviewer_id ?? '');
  const [regulatory, setRegulatory] = useState<string>(initial?.regulatory_reviewer_id ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setTechnical(initial?.technical_reviewer_id ?? '');
      setQuality(initial?.quality_reviewer_id ?? '');
      setRegulatory(initial?.regulatory_reviewer_id ?? '');
    }
  }, [open, initial?.technical_reviewer_id, initial?.quality_reviewer_id, initial?.regulatory_reviewer_id]);

  const ready =
    reason.trim().length > 0 && !!technical && !!quality && !!regulatory;

  const handleConfirm = async () => {
    if (!ready) return;
    setSubmitting(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        technical_reviewer_id: technical,
        quality_reviewer_id: quality,
        regulatory_reviewer_id: regulatory,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const renderUserSelect = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={isLoading ? 'Loading users…' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.length === 0 && !isLoading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No users available for this company
          </div>
        ) : (
          users.map((u: CompanyUser) => (
            <SelectItem key={u.id} value={u.id}>
              <span className="font-medium">{u.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit CCR for Review</DialogTitle>
          <DialogDescription>
            Assign a reviewer for each gate. Each reviewer will be responsible for
            recording their approval (Technical, Quality, Regulatory). The same
            person can be selected for multiple gates if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ccr-tech-reviewer">
              Technical Reviewer <span className="text-destructive">*</span>
            </Label>
            {renderUserSelect('ccr-tech-reviewer', technical, setTechnical, 'Select technical reviewer')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-quality-reviewer">
              Quality Reviewer <span className="text-destructive">*</span>
            </Label>
            {renderUserSelect('ccr-quality-reviewer', quality, setQuality, 'Select quality reviewer')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-reg-reviewer">
              Regulatory Reviewer <span className="text-destructive">*</span>
            </Label>
            {renderUserSelect('ccr-reg-reviewer', regulatory, setRegulatory, 'Select regulatory reviewer')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-submit-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ccr-submit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Captured for the audit trail (ISO 13485 §4.2.5)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!ready || submitting}>
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}