import React, { useEffect, useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FolderOpen, Folder, Trash2, Edit2, Share2, Users, Lock, Loader2 } from 'lucide-react';
import { DraftTabGroupService, DraftTabGroup } from '@/services/draftTabGroupService';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

const COLOR_DOT: Record<string, string> = {
  amber: 'bg-amber-400', blue: 'bg-blue-400', green: 'bg-green-400',
  purple: 'bg-purple-400', rose: 'bg-rose-400', slate: 'bg-slate-400',
};

interface Props {
  companyId: string;
  /** Open all the group's members as draft tabs and pre-select them for bulk edit. */
  onOpenGroup: (memberCiIds: string[]) => void;
}

export function DraftTabGroupsMenu({ companyId, onOpenGroup }: Props) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<DraftTabGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<DraftTabGroup | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DraftTabGroup | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id ?? null));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await DraftTabGroupService.list(companyId);
      setGroups(list);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load tab groups');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleOpen = async (g: DraftTabGroup) => {
    setOpeningId(g.id);
    try {
      onOpenGroup(g.member_ci_ids);
      DraftTabGroupService.touchLastOpened(g.id).catch(() => {});
      setOpen(false);
    } finally {
      setOpeningId(null);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await DraftTabGroupService.update(renameTarget.id, { name: renameValue.trim() });
      toast.success('Group renamed');
      setRenameTarget(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Rename failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await DraftTabGroupService.remove(deleteTarget.id);
      toast.success('Group deleted');
      setDeleteTarget(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleToggleShare = async (g: DraftTabGroup) => {
    try {
      await DraftTabGroupService.update(g.id, { is_shared: !g.is_shared });
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <FolderOpen className="h-3.5 w-3.5" />
            Groups
            {groups.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                {groups.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="border-b p-2">
            <p className="text-xs font-semibold text-muted-foreground px-1">Tab groups</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading…
              </div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No saved groups yet. Select tabs and use “Save as group…” to create one.
              </div>
            ) : (
              <ul>
                {groups.map((g) => {
                  const isOwner = currentUserId === g.owner_user_id;
                  return (
                    <li key={g.id} className="group/item border-b last:border-b-0 hover:bg-muted/50">
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => handleOpen(g)}
                          disabled={openingId === g.id}
                          className="flex-1 min-w-0 text-left flex items-center gap-2"
                        >
                          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${COLOR_DOT[g.color || 'amber'] || 'bg-amber-400'}`} />
                          <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">{g.name}</span>
                              {g.is_shared ? (
                                <Users className="h-3 w-3 text-muted-foreground" aria-label="Shared" />
                              ) : (
                                <Lock className="h-3 w-3 text-muted-foreground/50" aria-label="Private" />
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {g.member_ci_ids.length} document{g.member_ci_ids.length === 1 ? '' : 's'}
                              {g.description ? ` · ${g.description}` : ''}
                            </div>
                          </div>
                        </button>
                        {isOwner && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition">
                            <Button size="icon" variant="ghost" className="h-6 w-6" title="Rename"
                              onClick={(e) => { e.stopPropagation(); setRenameTarget(g); setRenameValue(g.name); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6"
                              title={g.is_shared ? 'Unshare' : 'Share with company'}
                              onClick={(e) => { e.stopPropagation(); handleToggleShare(g); }}>
                              <Share2 className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" title="Delete"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(g); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename group</AlertDialogTitle>
          </AlertDialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={!renameValue.trim()}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              The drafts inside the group are not deleted — only the saved grouping is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
