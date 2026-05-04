import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuthorOption {
  id: string;
  name: string;
  email?: string | null;
  type: 'user' | 'custom' | 'pending';
  title?: string | null;
}

interface AuthorsData {
  authors: AuthorOption[];
  allAuthorsMap: Record<string, AuthorOption>;
}

async function fetchAuthorsData(companyId: string): Promise<AuthorsData> {
  // Fetch all company users (all access levels)
  const { data: companyUsers, error: usersError } = await supabase
    .from('user_company_access')
    .select(`
      user_id,
      access_level,
      external_role,
      user_profiles!inner(id, first_name, last_name, email)
    `)
    .eq('company_id', companyId);

  if (usersError) {
    console.error('Error fetching company users:', usersError);
  }

  // Fetch department-role assignments for title resolution (e.g. "CEO")
  const userIds = (companyUsers || []).map((u: any) => u.user_id).filter(Boolean);
  let deptRolesByUser: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: deptRows } = await supabase
      .from('user_department_assignments')
      .select('user_id, role')
      .eq('company_id', companyId)
      .in('user_id', userIds);
    (deptRows || []).forEach((r: any) => {
      const roles: string[] = Array.isArray(r.role) ? r.role.filter(Boolean) : [];
      if (roles.length > 0 && !deptRolesByUser[r.user_id]) {
        deptRolesByUser[r.user_id] = roles[0];
      }
    });
  }

  const humanize = (s?: string | null) =>
    s ? s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null;

  // Fetch all pending invitations (all access levels)
  const { data: pendingInvitations, error: invitationsError } = await supabase
    .from('user_invitations')
    .select('id, email, first_name, last_name, access_level')
    .eq('company_id', companyId)
    .eq('status', 'pending');

  if (invitationsError) {
    console.error('Error fetching pending invitations:', invitationsError);
  }

  // Fetch document_authors for fallback name lookup
  const { data: documentAuthors, error: docAuthorsError } = await supabase
    .from('document_authors')
    .select('id, name, last_name, email, is_visible, user_id, user_invitation_id')
    .eq('company_id', companyId);

  if (docAuthorsError) {
    console.error('Error fetching document authors:', docAuthorsError);
  }

  // Format active user options
  const userOptions: AuthorOption[] = (companyUsers || [])
    .filter(u => u.user_profiles)
    .map(u => {
      const profile = u.user_profiles as any;
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Unknown User';
      const title =
        deptRolesByUser[u.user_id] ||
        humanize((u as any).external_role) ||
        humanize((u as any).access_level);
      return {
        id: u.user_id,
        name: fullName,
        email: profile.email,
        type: 'user' as const,
        title
      };
    });

  // Format pending invitation options
  const pendingOptions: AuthorOption[] = (pendingInvitations || [])
    .map(inv => {
      const fullName = [inv.first_name, inv.last_name].filter(Boolean).join(' ') || inv.email || 'Unknown User';
      return {
        id: inv.id,
        name: fullName,
        email: inv.email,
        type: 'pending' as const
      };
    });

  // Build a map of all authors (users + pending + document_authors) for name lookup
  const authorsMap: Record<string, AuthorOption> = {};

  // Format ALL document authors for lookup map (includes hidden ones for document references)
  const allDocumentAuthorOptions: AuthorOption[] = (documentAuthors || [])
    .map(a => ({
      id: (a as any).id,
      name: [(a as any).name, (a as any).last_name].filter(Boolean).join(' ') || 'Unknown Author',
      email: (a as any).email,
      type: 'custom' as const
    }));

  // Format visible document authors for selection (only those with is_visible = true AND email is null)
  // This matches the StakeholdersTab.tsx filter for custom stakeholders
  const customAuthorOptions: AuthorOption[] = (documentAuthors || [])
    .filter(a => (a as any).is_visible === true && (a as any).email === null)
    .map(a => ({
      id: (a as any).id,
      name: [(a as any).name, (a as any).last_name].filter(Boolean).join(' ') || 'Unknown Author',
      email: (a as any).email,
      type: 'custom' as const
    }));

  // Add ALL document_authors first (lower priority) - includes hidden ones for document lookup
  allDocumentAuthorOptions.forEach(a => {
    authorsMap[a.id] = a;
  });

  // Add pending invitations
  pendingOptions.forEach(p => {
    authorsMap[p.id] = p;
  });

  // Add users (higher priority, will override if same ID)
  userOptions.forEach(u => {
    authorsMap[u.id] = u;
  });

  return {
    authors: [...userOptions, ...pendingOptions, ...customAuthorOptions],
    allAuthorsMap: authorsMap
  };
}

export function useDocumentAuthors(companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['document-authors', companyId],
    queryFn: () => fetchAuthorsData(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const authors = data?.authors ?? [];
  const allAuthorsMap = data?.allAuthorsMap ?? {};

  const fetchAuthors = useCallback(async () => {
    if (!companyId) return;
    await queryClient.invalidateQueries({ queryKey: ['document-authors', companyId] });
  }, [companyId, queryClient]);

  const createCustomAuthor = async (name: string, email?: string): Promise<string | null> => {
    if (!companyId || !name.trim()) return null;

    // Check if already exists
    const existingAuthor = authors.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (existingAuthor) {
      return existingAuthor.id;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: insertData, error } = await supabase
        .from('document_authors')
        .insert({
          company_id: companyId,
          name: name.trim(),
          email: email || null,
          created_by: userData?.user?.id
        })
        .select('id')
        .single();

      if (error) {
        // If unique constraint violation, the author already exists
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('document_authors')
            .select('id')
            .eq('company_id', companyId)
            .eq('name', name.trim())
            .single();

          if (existing) {
            fetchAuthors();
            return existing.id;
          }
        }
        console.error('Error creating custom author:', error);
        return null;
      }

      fetchAuthors();
      return insertData.id;
    } catch (error) {
      console.error('Error creating custom author:', error);
      return null;
    }
  };

  // Helper to get author by ID (checks both users and document_authors)
  const getAuthorById = useCallback((id: string): AuthorOption | undefined => {
    return allAuthorsMap[id];
  }, [allAuthorsMap]);

  return {
    authors,
    allAuthorsMap,
    isLoading,
    createCustomAuthor,
    refreshAuthors: fetchAuthors,
    getAuthorById
  };
}
