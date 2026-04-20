import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AppNotificationService } from '@/services/appNotificationService';
import { toast } from 'sonner';

const notificationService = new AppNotificationService();

export type ChatRole = 'owner' | 'editor' | 'collaborator';

export interface ChatMember {
  user_id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  is_company_owner: boolean;
  role: ChatRole;
}

/**
 * Manages document chat participants using member_ids UUID[] and member_roles JSONB
 * on document_user_chat_messages.
 *
 * Roles:
 * - owner: can message + invite + change roles (auto-assigned to company owner)
 * - editor: can message, cannot invite (owner assigns this)
 * - collaborator: read-only, cannot message or invite (default for newly added)
 */
export function useDocumentChatMembers(params: {
  documentId?: string | null;
  companyId?: string;
  documentName?: string;
  enabled?: boolean;
}) {
  const { documentId, companyId, documentName, enabled = true } = params;
  const { user } = useAuth();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, ChatRole>>({});
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [companyUsers, setCompanyUsers] = useState<ChatMember[]>([]);
  const [companyOwnerId, setCompanyOwnerId] = useState<string | null>(null);
  const [isCompanyOwnerLoaded, setIsCompanyOwnerLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMemberIdsLoaded, setIsMemberIdsLoaded] = useState(false);
  const initializedRef = useRef(false);
  const latestRowIdRef = useRef<string | null>(null);
  const persistedRef = useRef(false);

  const ready = !!(enabled && documentId && companyId && user?.id);
  const canSeed = !!(enabled && companyId && user?.id);

  // Reset when switching documents
  useEffect(() => {
    initializedRef.current = false;
    persistedRef.current = false;
  }, [documentId, companyId]);

  // 1. Fetch member_ids + member_roles from the latest message
  useEffect(() => {
    if (!ready) {
      setIsMemberIdsLoaded(false);
      latestRowIdRef.current = null;
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      setIsMemberIdsLoaded(false);
      latestRowIdRef.current = null;
      try {
        const { data, error } = await supabase
          .from('document_user_chat_messages')
          .select('id, member_ids, member_roles')
          .eq('document_id', documentId!)
          .eq('company_id', companyId!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[useDocumentChatMembers] Failed to fetch:', error);
          return;
        }

        const ids: string[] = (data?.member_ids as string[]) || [];
        const roles: Record<string, ChatRole> = (data?.member_roles as Record<string, ChatRole>) || {};
        latestRowIdRef.current = (data?.id as string) || null;
        console.log('[useDocumentChatMembers] Fetched | rowId:', data?.id, '| ids:', ids, '| roles:', roles);
        setMemberIds(ids);
        setMemberRoles(roles);
      } catch (err) {
        console.error('[useDocumentChatMembers] Exception:', err);
      } finally {
        setIsLoading(false);
        setIsMemberIdsLoaded(true);
      }
    };

    fetch();

    // Subscribe to realtime updates (role changes, member removals)
    if (!documentId) return;
    const channel = supabase
      .channel(`chat-members-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_user_chat_messages',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.member_ids) {
            setMemberIds(updated.member_ids);
          }
          if (updated?.member_roles) {
            setMemberRoles(updated.member_roles as Record<string, ChatRole>);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_user_chat_messages',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const inserted = payload.new as any;
          if (inserted?.member_ids && inserted.member_ids.length > 0) {
            setMemberIds(inserted.member_ids);
          }
          if (inserted?.member_roles && Object.keys(inserted.member_roles).length > 0) {
            setMemberRoles(inserted.member_roles as Record<string, ChatRole>);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, documentId, companyId]);

  // 2. Fetch company users
  useEffect(() => {
    if (!companyId) { setCompanyUsers([]); return; }

    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select('user_id, is_primary, user_profiles!inner(id, first_name, last_name, email)')
          .eq('company_id', companyId);

        if (error) { console.error('[useDocumentChatMembers] Company users error:', error); return; }

        const users: ChatMember[] = (data || [])
          .filter((u: any) => u.user_profiles)
          .map((u: any) => {
            const p = u.user_profiles;
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown';
            return { user_id: u.user_id, name, email: p.email, is_active: true, is_company_owner: !!u.is_primary, role: 'collaborator' as ChatRole };
          });

        setCompanyUsers(users);
      } catch (err) {
        console.error('[useDocumentChatMembers] Exception:', err);
      }
    };

    fetch();
  }, [companyId]);

  // 2a. Fetch company owner
  useEffect(() => {
    if (!companyId) { setCompanyOwnerId(null); setIsCompanyOwnerLoaded(false); return; }

    let cancelled = false;
    setIsCompanyOwnerLoaded(false);

    const fetch = async () => {
      const { data, error } = await supabase
        .from('user_company_access')
        .select('user_id, is_invite_user')
        .eq('company_id', companyId)
        .eq('is_primary', true)
        .limit(25);

      if (cancelled) return;
      if (error) { setCompanyOwnerId(null); setIsCompanyOwnerLoaded(true); return; }

      const ownerRow = (data || []).find((r: any) => r?.is_invite_user !== true);
      const id = (ownerRow?.user_id || null) as string | null;
      console.log('[useDocumentChatMembers] Company owner:', id);
      setCompanyOwnerId(id);
      setIsCompanyOwnerLoaded(true);
    };

    fetch();
    return () => { cancelled = true; };
  }, [companyId]);

  // 2b. Seed: auto-add owner + current user with proper roles
  useEffect(() => {
    console.log('[useDocumentChatMembers] Seed check | canSeed:', canSeed, '| initialized:', initializedRef.current, '| ownerLoaded:', isCompanyOwnerLoaded, '| memberIdsLoaded:', isMemberIdsLoaded, '| documentId:', documentId, '| userId:', user?.id, '| companyOwnerId:', companyOwnerId, '| companyUsers:', companyUsers.length, '| memberIds:', memberIds, '| memberRoles:', memberRoles);
    if (!canSeed || initializedRef.current || !isCompanyOwnerLoaded) {
      console.log('[useDocumentChatMembers] Seed SKIP | canSeed:', canSeed, '| initialized:', initializedRef.current, '| ownerLoaded:', isCompanyOwnerLoaded);
      return;
    }
    if (documentId && !isMemberIdsLoaded) {
      console.log('[useDocumentChatMembers] Seed SKIP — waiting for memberIds fetch');
      return;
    }

    const ownerId = companyOwnerId;
    const seedIds = Array.from(
      new Set([...(memberIds || []), user?.id, ...(ownerId ? [ownerId] : [])].filter(Boolean) as string[])
    );

    // Build roles:
    // - Company owner (is_primary) → 'owner'
    // - Everyone else → 'collaborator' (owner can upgrade to 'editor')
    const seedRoles: Record<string, ChatRole> = { ...memberRoles };
    const companyOwnerIds = new Set<string>();
    if (ownerId) companyOwnerIds.add(ownerId);
    for (const cu of companyUsers) {
      if (cu.is_company_owner) companyOwnerIds.add(cu.user_id);
    }
    for (const id of seedIds) {
      if (!seedRoles[id]) seedRoles[id] = companyOwnerIds.has(id) ? 'owner' : 'collaborator';
    }
    // Ensure company owners always have 'owner' role
    for (const id of companyOwnerIds) {
      if (seedIds.includes(id)) seedRoles[id] = 'owner';
    }

    // Check if update needed
    const currentSet = new Set(memberIds || []);
    const needsUpdate = seedIds.some(id => !currentSet.has(id));
    if (!needsUpdate && seedIds.length === currentSet.size) {
      // Still ensure roles are set even if ids haven't changed
      setMemberRoles(seedRoles);
      initializedRef.current = true;
      return;
    }

    console.log('[useDocumentChatMembers] Seeding | ids:', seedIds, '| roles:', seedRoles, '| companyOwnerIds:', Array.from(companyOwnerIds), '| currentUserId:', user?.id, '| documentId:', documentId);

    // Persist to DB only if documentId exists
    if (documentId && !persistedRef.current) {
      persistedRef.current = true;
      const latestId = latestRowIdRef.current;
      const senderName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
        .filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'System';

      if (!latestId) {
        // New chat — insert seed message
        (async () => {
          const { data, error } = await supabase.from('document_user_chat_messages').insert({
            document_id: documentId!,
            company_id: companyId!,
            sender_user_id: user!.id,
            sender_name: senderName,
            content: 'Started the conversation',
            member_ids: seedIds,
            member_roles: seedRoles,
          }).select('id').single();

          if (error) { console.error('[useDocumentChatMembers] Seed insert failed:', error); persistedRef.current = false; }
          else if (data) { latestRowIdRef.current = data.id; console.log('[useDocumentChatMembers] Seeded row:', data.id); }
        })();
      } else {
        // Existing chat — patch
        (async () => {
          const { error } = await supabase
            .from('document_user_chat_messages')
            .update({ member_ids: seedIds, member_roles: seedRoles })
            .eq('id', latestId);

          if (error) { console.error('[useDocumentChatMembers] Seed patch failed:', error); persistedRef.current = false; }
        })();
      }
    }

    setMemberIds(seedIds);
    setMemberRoles(seedRoles);
    initializedRef.current = true;
  }, [canSeed, ready, isCompanyOwnerLoaded, companyOwnerId, companyUsers, user?.id, isMemberIdsLoaded, memberIds, memberRoles, documentId, companyId]);

  // 3. Resolve memberIds + roles → ChatMember[]
  useEffect(() => {
    if (memberIds.length === 0) { setMembers([]); return; }

    const userMap = new Map(companyUsers.map(u => [u.user_id, u]));
    const resolved: ChatMember[] = memberIds.map(id => {
      const found = userMap.get(id);
      const role = memberRoles[id] || (id === companyOwnerId ? 'owner' : 'collaborator');
      if (found) {
        return { ...found, is_company_owner: found.is_company_owner || id === companyOwnerId, role };
      }
      return { user_id: id, name: 'Unknown User', email: null, is_active: false, is_company_owner: id === companyOwnerId, role };
    });

    setMembers(resolved);
  }, [memberIds, memberRoles, companyUsers, companyOwnerId]);

  // Current user's role + membership check
  const isMember = user?.id ? memberIds.includes(user.id) : false;
  const currentUserRole: ChatRole = user?.id && isMember ? (memberRoles[user.id] || 'collaborator') : 'collaborator';
  const isOwner = isMember && currentUserRole === 'owner';
  const canMessage = isMember && (currentUserRole === 'owner' || currentUserRole === 'editor' || currentUserRole === 'collaborator');
  const canInvite = isMember && (currentUserRole === 'owner' || currentUserRole === 'editor');

  // 4. Add user to chat (owner only)
  const addUserToChat = useCallback(async (targetUser: ChatMember) => {
    if (!user || !canInvite) {
      if (!canInvite) toast.error('Only owners and editors can add people');
      return;
    }

    const currentIds = new Set(memberIds);
    currentIds.add(user.id);
    currentIds.add(targetUser.user_id);
    const newMemberIds = Array.from(currentIds);

    const newRoles: Record<string, ChatRole> = { ...memberRoles };
    if (!newRoles[targetUser.user_id]) newRoles[targetUser.user_id] = 'collaborator';

    const senderName = [user.user_metadata?.first_name, user.user_metadata?.last_name]
      .filter(Boolean).join(' ') || user.email?.split('@')[0] || 'System';

    // Update local state immediately
    setMemberIds(newMemberIds);
    setMemberRoles(newRoles);

    // Only persist to DB if documentId exists
    if (documentId && companyId) {
      try {
        const { error } = await supabase.from('document_user_chat_messages').insert({
          document_id: documentId,
          company_id: companyId,
          sender_user_id: user.id,
          sender_name: senderName,
          content: `Added ${targetUser.name} to the conversation`,
          member_ids: newMemberIds,
          member_roles: newRoles,
        });

        if (error) { console.error('[useDocumentChatMembers] Add user failed:', error); toast.error('Failed to add user'); return; }
      } catch (err) {
        console.error('[useDocumentChatMembers] Exception:', err);
        toast.error('Failed to add user');
        return;
      }
    }

    // Send notification
    if (targetUser.user_id !== user.id && companyId) {
      const docLabel = documentName || 'a document';
      notificationService.createNotification({
        user_id: targetUser.user_id, actor_id: user.id, actor_name: senderName,
        company_id: companyId, category: 'document', action: 'added_to_chat',
        title: `${senderName} added you to a document conversation`,
        message: `You were added to the chat on "${docLabel}".`,
        priority: 'normal', entity_type: 'document',
        entity_id: documentId || undefined,
        entity_name: docLabel,
        action_url: documentId ? `/app/documents/${documentId}` : undefined,
      }).catch((err) => {
        console.warn('[useDocumentChatMembers] Notification failed:', err);
      });
    }

    toast.success(`${targetUser.name} added to conversation`);
  }, [documentId, companyId, documentName, user, memberIds, memberRoles, canInvite]);

  // 5. Change user role (owner only) — updates latest message silently, no new chat message
  const changeUserRole = useCallback(async (targetUserId: string, newRole: ChatRole) => {
    if (!user || !isOwner) {
      if (!isOwner) toast.error('Only the owner can change roles');
      return;
    }

    if (targetUserId === companyOwnerId) {
      toast.error("Cannot change the owner's role");
      return;
    }

    const newRoles: Record<string, ChatRole> = { ...memberRoles, [targetUserId]: newRole };
    const targetMember = members.find(m => m.user_id === targetUserId);
    const targetName = targetMember?.name || 'User';

    setMemberRoles(newRoles);

    // Update latest message's member_roles silently (no new message)
    if (documentId && companyId) {
      try {
        const { data: latest } = await supabase
          .from('document_user_chat_messages')
          .select('id')
          .eq('document_id', documentId)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest?.id) {
          await supabase.from('document_user_chat_messages')
            .update({ member_roles: newRoles })
            .eq('id', latest.id);
        }
      } catch (err) {
        console.error('[useDocumentChatMembers] Change role failed:', err);
        toast.error('Failed to change role');
        return;
      }
    }

    toast.success(`${targetName} is now ${newRole === 'editor' ? 'a reviewer' : 'a collaborator'}`);
  }, [documentId, companyId, user, memberIds, memberRoles, members, isOwner, companyOwnerId]);

  // 6. Remove user from chat (owner only) — updates latest message silently
  const removeUserFromChat = useCallback(async (targetUserId: string) => {
    if (!user || !isOwner) {
      toast.error('Only the owner can remove people');
      return;
    }

    if (targetUserId === companyOwnerId) {
      toast.error("Cannot remove the owner");
      return;
    }

    const newMemberIds = memberIds.filter(id => id !== targetUserId);
    const newRoles: Record<string, ChatRole> = { ...memberRoles };
    delete newRoles[targetUserId];

    const targetMember = members.find(m => m.user_id === targetUserId);
    const targetName = targetMember?.name || 'User';

    setMemberIds(newMemberIds);
    setMemberRoles(newRoles);

    // Update latest message silently (no new message)
    if (documentId && companyId) {
      try {
        const { data: latest } = await supabase
          .from('document_user_chat_messages')
          .select('id')
          .eq('document_id', documentId)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest?.id) {
          await supabase.from('document_user_chat_messages')
            .update({ member_ids: newMemberIds, member_roles: newRoles })
            .eq('id', latest.id);
        }
      } catch (err) {
        console.error('[useDocumentChatMembers] Remove user failed:', err);
        toast.error('Failed to remove user');
        return;
      }
    }

    toast.success(`${targetName} removed from conversation`);
  }, [documentId, companyId, user, memberIds, memberRoles, members, isOwner, companyOwnerId]);

  return {
    memberIds,
    memberRoles,
    members,
    companyUsers,
    isLoading,
    isMember,
    currentUserRole,
    isOwner,
    canMessage,
    canInvite,
    addUserToChat,
    changeUserRole,
    removeUserFromChat,
  };
}
