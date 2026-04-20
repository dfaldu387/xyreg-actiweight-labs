import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';

interface InviteParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  companyId: string;
  existingUserIds: string[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function InviteParticipantDialog({
  open,
  onOpenChange,
  threadId,
  companyId,
  existingUserIds,
}: InviteParticipantDialogProps) {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !companyId) return;
    setSelected([]);
    setSearch('');

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select(`
            user_id,
            user_profiles!inner(id, email, first_name, last_name)
          `)
          .eq('company_id', companyId);

        if (error) throw error;

        const options: UserOption[] = (data || [])
          .filter((item: any) => !existingUserIds.includes(item.user_profiles.id))
          .map((item: any) => {
            const p = item.user_profiles;
            return {
              id: p.id,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email,
              email: p.email,
            };
          });

        setUsers(options);
      } catch (err) {
        console.error('Error fetching users for invite:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, companyId, existingUserIds]);

  const toggleUser = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleInvite = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const inserts = selected.map(userId => ({
        thread_id: threadId,
        user_id: userId,
        role: 'participant',
        is_internal: true,
        unread_count: 0,
      }));

      const { error } = await supabase
        .from('thread_participants')
        .insert(inserts);

      if (error) throw error;

      toast.success(`Invited ${selected.length} participant(s)`);
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
      onOpenChange(false);
    } catch (err) {
      console.error('Error inviting participants:', err);
      toast.error('Failed to invite participants');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Participants</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users available to invite
            </p>
          ) : (
            filtered.map(u => (
              <label
                key={u.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(u.id)}
                  onCheckedChange={() => toggleUser(u.id)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={selected.length === 0 || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Invite ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
