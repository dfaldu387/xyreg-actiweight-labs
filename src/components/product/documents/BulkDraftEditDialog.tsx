import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCCRsByCompany } from '@/hooks/useChangeControlData';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { MultiAuthorSelector } from '@/components/common/MultiAuthorSelector';
import { PhaseRestrictedDatePicker } from '@/components/ui/phase-restricted-date-picker';
import { X, Loader2 } from 'lucide-react';

export interface BulkDraftTarget {
  id: string;
  name: string;
}

interface BulkDraftEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: BulkDraftTarget[];
  companyId: string;
  onApplied?: () => void;
}

type FieldKey =
  | 'authors_ids'
  | 'reviewer_group_ids'
  | 'change_control_ref'
  | 'tags'
  | 'next_review_date'
  | 'status'
  | 'document_type';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'In Review', 'Approved', 'Rejected', 'N/A'];
const DOC_TYPE_OPTIONS = ['Document', 'Record', 'Report', 'Manual', 'SOP', 'Form', 'Template', 'Checklist'];

/**
 * Bulk-edit dialog for the open-tabs strip in DocumentDraftDrawer.
 * Only the fields ticked in "Apply" are written. Updates the same
 * `phase_assigned_document_template` row that useCIDocumentMetadata edits.
 */
export function BulkDraftEditDialog({
  open,
  onOpenChange,
  targets,
  companyId,
  onApplied,
}: BulkDraftEditDialogProps) {
  const { data: ccrs = [] } = useCCRsByCompany(companyId);
  const { reviewerGroups = [] } = useReviewerGroups(companyId);

  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    authors_ids: false,
    reviewer_group_ids: false,
    change_control_ref: false,
    tags: false,
    next_review_date: false,
    status: false,
    document_type: false,
  });
  const [authorMode, setAuthorMode] = useState<'add' | 'replace'>('add');
  const [reviewerMode, setReviewerMode] = useState<'add' | 'replace'>('add');
  const [tagMode, setTagMode] = useState<'add' | 'replace'>('add');

  const [authorsIds, setAuthorsIds] = useState<string[]>([]);
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>([]);
  const [changeControlRef, setChangeControlRef] = useState<string>('__none__');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  const enabledCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled],
  );

  const toggle = (k: FieldKey) => setEnabled((e) => ({ ...e, [k]: !e[k] }));

  const handleAddTag = (raw: string) => {
    const t = raw.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput('');
  };

  const handleApply = async () => {
    if (enabledCount === 0 || targets.length === 0) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    // For "add" modes (authors / reviewer groups / tags), we need each row's
    // current value to merge — fetch them once.
    let currentRows: Record<string, any> = {};
    if (
      (enabled.authors_ids && authorMode === 'add') ||
      (enabled.reviewer_group_ids && reviewerMode === 'add') ||
      (enabled.tags && tagMode === 'add')
    ) {
      const { data } = await supabase
        .from('phase_assigned_document_template')
        .select('id, authors_ids, reviewer_group_ids, tags')
        .in('id', targets.map((t) => t.id));
      (data || []).forEach((r: any) => {
        currentRows[r.id] = r;
      });
    }

    for (const target of targets) {
      const patch: Record<string, any> = { updated_at: new Date().toISOString() };
      const current = currentRows[target.id] || {};

      if (enabled.authors_ids) {
        const existing: string[] = Array.isArray(current.authors_ids) ? current.authors_ids : [];
        patch.authors_ids =
          authorMode === 'replace'
            ? authorsIds
            : Array.from(new Set([...existing, ...authorsIds]));
      }
      if (enabled.reviewer_group_ids) {
        const existing: string[] = Array.isArray(current.reviewer_group_ids)
          ? current.reviewer_group_ids
          : [];
        patch.reviewer_group_ids =
          reviewerMode === 'replace'
            ? reviewerGroupIds
            : Array.from(new Set([...existing, ...reviewerGroupIds]));
      }
      if (enabled.tags) {
        const existing: string[] = Array.isArray(current.tags) ? current.tags : [];
        patch.tags =
          tagMode === 'replace' ? tags : Array.from(new Set([...existing, ...tags]));
      }
      if (enabled.change_control_ref) {
        patch.change_control_ref = changeControlRef === '__none__' ? null : changeControlRef;
      }
      if (enabled.next_review_date) {
        patch.next_review_date = nextReviewDate
          ? `${nextReviewDate.getFullYear()}-${String(nextReviewDate.getMonth() + 1).padStart(2, '0')}-${String(nextReviewDate.getDate()).padStart(2, '0')}`
          : null;
      }
      if (enabled.status && status) patch.status = status;
      if (enabled.document_type && documentType) patch.document_type = documentType;

      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update(patch as any)
        .eq('id', target.id);

      if (error) {
        console.error('Bulk update failed for', target.id, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    setSubmitting(false);
    if (successCount > 0) {
      toast.success(
        `Updated ${successCount} draft${successCount === 1 ? '' : 's'}` +
          (failCount > 0 ? ` (${failCount} failed)` : ''),
      );
      // Notify any open drawer to refetch its CI metadata
      window.dispatchEvent(new CustomEvent('xyreg:ci-metadata-bulk-updated', {
        detail: { ids: targets.map(t => t.id) },
      }));
      onApplied?.();
      onOpenChange(false);
    } else if (failCount > 0) {
      toast.error('Bulk update failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk edit {targets.length} draft{targets.length === 1 ? '' : 's'}</DialogTitle>
          <DialogDescription>
            Tick a field's checkbox to apply that change to every selected draft. Untouched fields stay as-is.
          </DialogDescription>
        </DialogHeader>

        {/* Targets summary */}
        <div className="rounded-md border bg-muted/30 p-2">
          <ScrollArea className="max-h-20">
            <div className="flex flex-wrap gap-1">
              {targets.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-4 py-2">
            {/* Authors */}
            <FieldRow
              checked={enabled.authors_ids}
              onToggle={() => toggle('authors_ids')}
              label="Authors"
            >
              <div className="flex items-center gap-2 mb-2">
                <ModeToggle value={authorMode} onChange={setAuthorMode} />
              </div>
              <MultiAuthorSelector
                value={authorsIds}
                onChange={setAuthorsIds}
                companyId={companyId}
                disabled={!enabled.authors_ids}
                label=""
                placeholder="Select authors"
              />
            </FieldRow>

            {/* Reviewer Groups */}
            <FieldRow
              checked={enabled.reviewer_group_ids}
              onToggle={() => toggle('reviewer_group_ids')}
              label="Reviewer Groups"
            >
              <div className="flex items-center gap-2 mb-2">
                <ModeToggle value={reviewerMode} onChange={setReviewerMode} />
              </div>
              <div className="space-y-1">
                {reviewerGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground">No reviewer groups configured</p>
                )}
                {reviewerGroups.map((group: any) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={reviewerGroupIds.includes(group.id)}
                      onCheckedChange={(c) => {
                        setReviewerGroupIds((prev) =>
                          c ? [...prev, group.id] : prev.filter((id) => id !== group.id),
                        );
                      }}
                      disabled={!enabled.reviewer_group_ids}
                    />
                    <span className="truncate">{group.name}</span>
                  </label>
                ))}
              </div>
            </FieldRow>

            {/* CCR */}
            <FieldRow
              checked={enabled.change_control_ref}
              onToggle={() => toggle('change_control_ref')}
              label="Change Control Ref. (CCR)"
            >
              <Select
                value={changeControlRef}
                onValueChange={setChangeControlRef}
                disabled={!enabled.change_control_ref}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Link to a CCR…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {ccrs.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No CCRs available for this company
                    </div>
                  ) : (
                    ccrs.map((ccr: any) => (
                      <SelectItem key={ccr.ccr_id || ccr.id} value={ccr.ccr_id || ccr.id}>
                        <span className="font-mono text-xs mr-2">{ccr.ccr_id || ccr.id}</span>
                        <span className="truncate">{ccr.title || ccr.summary || ''}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FieldRow>

            {/* Tags */}
            <FieldRow
              checked={enabled.tags}
              onToggle={() => toggle('tags')}
              label="Tags"
            >
              <div className="flex items-center gap-2 mb-2">
                <ModeToggle value={tagMode} onChange={setTagMode} />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Type tag and press Enter"
                disabled={!enabled.tags}
                className="h-8 text-sm"
              />
            </FieldRow>

            {/* Next review date */}
            <FieldRow
              checked={enabled.next_review_date}
              onToggle={() => toggle('next_review_date')}
              label="Next Review Date"
            >
              <PhaseRestrictedDatePicker
                date={nextReviewDate}
                setDate={(d) => setNextReviewDate(d || undefined)}
                disabled={!enabled.next_review_date}
              />
            </FieldRow>

            {/* Status */}
            <FieldRow
              checked={enabled.status}
              onToggle={() => toggle('status')}
              label="Status"
            >
              <Select value={status} onValueChange={setStatus} disabled={!enabled.status}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            {/* Document Type */}
            <FieldRow
              checked={enabled.document_type}
              onToggle={() => toggle('document_type')}
              label="Document Type"
            >
              <Select value={documentType} onValueChange={setDocumentType} disabled={!enabled.document_type}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={submitting || enabledCount === 0}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Apply to {targets.length} draft{targets.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  checked,
  onToggle,
  label,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
      </label>
      <div className={checked ? '' : 'opacity-50 pointer-events-none'}>{children}</div>
      <Separator />
    </div>
  );
}

function ModeToggle({
  value,
  onChange,
}: {
  value: 'add' | 'replace';
  onChange: (v: 'add' | 'replace') => void;
}) {
  return (
    <div className="inline-flex rounded-md border text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('add')}
        className={`px-2 py-1 ${value === 'add' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
      >
        Add to existing
      </button>
      <button
        type="button"
        onClick={() => onChange('replace')}
        className={`px-2 py-1 ${value === 'replace' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
      >
        Replace
      </button>
    </div>
  );
}