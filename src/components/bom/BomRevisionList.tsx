import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Copy, Archive, FileText, ChevronDown, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBomRevisions, useCreateBomRevision, useArchiveBomRevision, useCloneBomRevision, useAutoCloneForEdit } from '@/hooks/useBom';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { BomRevision } from '@/types/bom';
import { BomDetailPanel } from './BomDetailPanel';
import { useTranslation } from '@/hooks/useTranslation';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  obsolete: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function BomRevisionList() {
  const { lang } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const companyId = useCompanyId();
  const { data: revisions, isLoading } = useBomRevisions(productId);
  const createMutation = useCreateBomRevision(productId || '');
  const archiveMutation = useArchiveBomRevision(productId || '');
  const cloneMutation = useCloneBomRevision(productId || '');
  const autoCloneMutation = useAutoCloneForEdit(productId || '');

  const [archivingRevision, setArchivingRevision] = useState<BomRevision | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Resolve working revision: latest draft, or latest active (read-only)
  const workingRevision = useMemo(() => {
    if (!revisions?.length) return null;
    const draft = revisions.find(r => r.status === 'draft');
    if (draft) return draft;
    const active = revisions.find(r => r.status === 'active');
    if (active) return active;
    return revisions[0];
  }, [revisions]);

  // History revisions: everything except the working one
  const historyRevisions = useMemo(() => {
    if (!revisions?.length || !workingRevision) return [];
    return revisions.filter(r => r.id !== workingRevision.id && r.status !== 'draft');
  }, [revisions, workingRevision]);

  // Auto-create a draft if no revisions exist
  useEffect(() => {
    if (isLoading || autoCreating) return;
    if (revisions && revisions.length === 0 && productId && companyId) {
      setAutoCreating(true);
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await createMutation.mutateAsync({
          product_id: productId,
          company_id: companyId,
          revision: 'A',
          description: 'Initial working BOM',
          created_by: user.id,
        });
        setAutoCreating(false);
      })();
    }
  }, [isLoading, revisions, productId, companyId]);

  const handleEditActive = async (rev: BomRevision) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !companyId) return;
    await autoCloneMutation.mutateAsync({
      activeRevisionId: rev.id,
      companyId,
      userId: user.id,
    });
  };

  if (isLoading || autoCreating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!workingRevision) return null;

  const isDraft = workingRevision.status === 'draft';
  const isActive = workingRevision.status === 'active';

  return (
    <div className="space-y-6">
      {/* Status info bar */}
      {isDraft && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            {lang('bom.workingDraft')} — {lang('bom.workingDraftInfo')} <span className="font-medium text-foreground">Rev {workingRevision.revision}</span>
          </p>
        </div>
      )}
      {isActive && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ✓ {lang('bom.approved')} — Rev {workingRevision.revision}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditActive(workingRevision)}
            disabled={autoCloneMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-1" />
            {lang('bom.editViaEco')}
          </Button>
        </div>
      )}
      {!isDraft && !isActive && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Rev {workingRevision.revision} — <Badge variant="secondary" className={statusColors[workingRevision.status]}>{workingRevision.status}</Badge>
          </p>
        </div>
      )}

      {/* Inline BOM detail panel (no back button, no header) */}
      <BomDetailPanel
        revision={workingRevision}
        onBack={() => {}}
        embedded
      />

      {/* Revision History collapsible */}
      {historyRevisions.length > 0 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              {lang('bom.revisionHistory')} ({historyRevisions.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang('bom.revision')}</TableHead>
                      <TableHead>{lang('bom.status')}</TableHead>
                      <TableHead className="text-right">{lang('bom.items')}</TableHead>
                      <TableHead className="text-right">{lang('bom.totalCost')}</TableHead>
                      <TableHead>{lang('bom.description')}</TableHead>
                      <TableHead>{lang('bom.lastUpdated')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRevisions.map(rev => (
                      <TableRow key={rev.id}>
                        <TableCell className="font-mono font-semibold">Rev {rev.revision}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[rev.status]}>{rev.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{rev.item_count || 0}</TableCell>
                        <TableCell className="text-right font-mono">
                          {rev.currency} {rev.total_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{rev.description || '—'}</TableCell>
                        <TableCell>{format(new Date(rev.updated_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Archive confirmation dialog */}
      <AlertDialog open={!!archivingRevision} onOpenChange={() => setArchivingRevision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('bom.archiveBomRevision')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('bom.archiveConfirm')} <strong>Rev {archivingRevision?.revision}</strong> {lang('bom.archiveConfirmSuffix')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!archivingRevision) return;
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await archiveMutation.mutateAsync({ id: archivingRevision.id, userId: user.id });
                setArchivingRevision(null);
              }}
            >
              {lang('bom.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
