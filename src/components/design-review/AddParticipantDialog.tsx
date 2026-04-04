import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PARTICIPANT_ROLE_LABELS, ParticipantRole } from '@/types/designReview';
import { checkIndependentEligibility, EligibilityResult } from '@/services/reviewerEligibilityService';
import { useTranslation } from '@/hooks/useTranslation';

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AddParticipantDialogProps {
  reviewId: string;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  existingParticipantIds: string[];
  onAdd: (userId: string, role: ParticipantRole) => Promise<void>;
}

export default function AddParticipantDialog({
  reviewId,
  companyId,
  isOpen,
  onClose,
  existingParticipantIds,
  onAdd,
}: AddParticipantDialogProps) {
  const { lang } = useTranslation();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>('reviewer');
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch company users
  useEffect(() => {
    if (!isOpen || !companyId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('user_company_access')
        .select('user_id, user_profiles!inner(id, email, first_name, last_name)')
        .eq('company_id', companyId);
      const formatted: CompanyUser[] = (data || []).map((item: any) => ({
        id: item.user_profiles.id,
        email: item.user_profiles.email,
        first_name: item.user_profiles.first_name,
        last_name: item.user_profiles.last_name,
      }));
      setUsers(formatted.filter(u => !existingParticipantIds.includes(u.id)));
      setLoading(false);
    })();
  }, [isOpen, companyId, existingParticipantIds]);

  // Check eligibility when independent_reviewer role + user selected
  useEffect(() => {
    if (selectedRole !== 'independent_reviewer' || !selectedUserId) {
      setEligibility(null);
      return;
    }
    let cancelled = false;
    setEligibilityLoading(true);
    checkIndependentEligibility(reviewId, selectedUserId).then(result => {
      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedRole, selectedUserId, reviewId]);

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedRole) return;
    setSubmitting(true);
    try {
      await onAdd(selectedUserId, selectedRole);
      setSelectedUserId('');
      setSelectedRole('reviewer');
      setEligibility(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (u: CompanyUser) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return name || u.email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lang('designReview.addParticipantDialog')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{lang('designReview.user')}</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? lang('designReview.loadingUsers') : lang('designReview.selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{getUserName(u)}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </SelectItem>
                ))}
                {users.length === 0 && !loading && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">{lang('designReview.noAvailableUsers')}</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{lang('designReview.roleLabel')}</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ParticipantRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PARTICIPANT_ROLE_LABELS) as [ParticipantRole, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SWR-C-13 warning */}
          {selectedRole === 'independent_reviewer' && selectedUserId && (
            eligibilityLoading ? (
              <p className="text-sm text-muted-foreground">{lang('designReview.checkingEligibility')}</p>
            ) : eligibility && !eligibility.eligible ? (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">{lang('designReview.cleanHandsWarning')}</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-1">
                    {lang('designReview.cleanHandsWarningMessage', { count: eligibility.conflictCount })}
                  </p>
                  <div className="mt-1 text-xs text-amber-600">
                    {lang('designReview.conflictsLabel')} {eligibility.conflictDetails.join(', ')}
                  </div>
                </div>
              </div>
            ) : eligibility?.eligible ? (
              <p className="text-sm text-green-600">✓ {lang('designReview.userEligible')}</p>
            ) : null
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{lang('designReview.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!selectedUserId || submitting}>
            {submitting ? lang('designReview.adding') : lang('designReview.addParticipant')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
