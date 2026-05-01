import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { DraftTabGroupService } from '@/services/draftTabGroupService';

const COLOR_OPTIONS = [
  { value: 'amber', label: 'Amber', class: 'bg-amber-400' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-400' },
  { value: 'green', label: 'Green', class: 'bg-green-400' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-400' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-400' },
  { value: 'slate', label: 'Slate', class: 'bg-slate-400' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  selectedTabIds: string[];
  allOpenTabIds: string[];
  onSaved?: () => void;
}

export function SaveDraftTabGroupDialog({
  open,
  onOpenChange,
  companyId,
  selectedTabIds,
  allOpenTabIds,
  onSaved,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [isShared, setIsShared] = useState(false);
  const [scope, setScope] = useState<'selected' | 'all'>('selected');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setColor('amber');
      setIsShared(false);
      setScope(selectedTabIds.length > 0 ? 'selected' : 'all');
    }
  }, [open, selectedTabIds.length]);

  const memberIds = scope === 'selected' ? selectedTabIds : allOpenTabIds;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (memberIds.length === 0) {
      toast.error('Group must have at least one document');
      return;
    }
    setSaving(true);
    try {
      await DraftTabGroupService.create({
        company_id: companyId,
        name: name.trim(),
        description: description.trim() || null,
        color,
        is_shared: isShared,
        member_ci_ids: memberIds,
      });
      toast.success(`Group "${name.trim()}" saved with ${memberIds.length} document(s)`);
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save tab group</DialogTitle>
          <DialogDescription>
            Save your open drafts as a named group. Reopen later to bulk edit them in tabs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. QA SOPs review" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-desc">Description (optional)</Label>
            <Textarea id="group-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition ${c.class} ${color === c.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scope</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'selected' | 'all')}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected" id="scope-sel" disabled={selectedTabIds.length === 0} />
                <Label htmlFor="scope-sel" className="font-normal cursor-pointer">
                  Selected tabs ({selectedTabIds.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="scope-all" />
                <Label htmlFor="scope-all" className="font-normal cursor-pointer">
                  All open tabs ({allOpenTabIds.length})
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="share-toggle" className="cursor-pointer">Share with company</Label>
              <p className="text-xs text-muted-foreground">Other members can open this group; only you can edit it.</p>
            </div>
            <Switch id="share-toggle" checked={isShared} onCheckedChange={setIsShared} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || memberIds.length === 0}>
            {saving ? 'Saving…' : `Save group (${memberIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
