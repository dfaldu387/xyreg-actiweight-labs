import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from 'uuid';

export type DealStatus = 'new' | 'watching' | 'interested' | 'passed' | 'invested';

// Individual note item with its own sharing settings
export interface NoteItem {
  id: string;
  content: string;
  share_with_company: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestorDealNote {
  id: string;
  investor_profile_id: string;
  share_settings_id: string;
  rating: number | null;
  status: DealStatus;
  notes: NoteItem[] | null; // Array of notes, each with own sharing settings
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useInvestorDealNotes(shareSettingsId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: dealNote, isLoading, error } = useQuery({
    queryKey: ["investor-deal-note", shareSettingsId, user?.id],
    queryFn: async () => {
      if (!shareSettingsId) return null;

      // Use cached user from AuthContext
      if (!user) return null;

      // First get investor profile
      const { data: profile } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return null;

      const { data, error } = await supabase
        .from("investor_deal_notes")
        .select("*")
        .eq("investor_profile_id", profile.id)
        .eq("share_settings_id", shareSettingsId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as InvestorDealNote | null;
    },
    enabled: !!shareSettingsId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<InvestorDealNote, 'rating' | 'status' | 'notes' | 'tags'>>) => {
      if (!shareSettingsId) throw new Error("No share settings ID");

      // Use cached user from AuthContext
      if (!user) throw new Error("Not authenticated");

      // Get investor profile
      const { data: profile } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) throw new Error("Investor profile not found");

      const { data, error } = await supabase
        .from("investor_deal_notes")
        .upsert({
          investor_profile_id: profile.id,
          share_settings_id: shareSettingsId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'investor_profile_id,share_settings_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-deal-note", shareSettingsId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const setRating = (rating: number | null) => {
    upsertMutation.mutate({ rating });
  };

  const setStatus = (status: DealStatus) => {
    upsertMutation.mutate({ status });
  };

  const addTag = (tag: string) => {
    const currentTags = dealNote?.tags || [];
    if (!currentTags.includes(tag)) {
      upsertMutation.mutate({ tags: [...currentTags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = dealNote?.tags || [];
    upsertMutation.mutate({ tags: currentTags.filter(t => t !== tag) });
  };

  // Add a new note with its own sharing settings
  const addNote = (content: string, shareWithCompany: boolean, isAnonymous: boolean) => {
    const currentNotes = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
    const newNote: NoteItem = {
      id: uuidv4(),
      content,
      share_with_company: shareWithCompany,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    upsertMutation.mutate({ notes: [...currentNotes, newNote] });
  };

  // Update an existing note
  const updateNote = (noteId: string, content: string, shareWithCompany: boolean, isAnonymous: boolean) => {
    const currentNotes = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
    const updatedNotes = currentNotes.map(note =>
      note.id === noteId
        ? { ...note, content, share_with_company: shareWithCompany, is_anonymous: isAnonymous, updated_at: new Date().toISOString() }
        : note
    );
    upsertMutation.mutate({ notes: updatedNotes });
  };

  // Delete a note
  const deleteNote = (noteId: string) => {
    const currentNotes = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
    const filteredNotes = currentNotes.filter(note => note.id !== noteId);
    upsertMutation.mutate({ notes: filteredNotes });
  };

  // Get notes filtered by sharing status
  const getSharedNotes = () => {
    const notesArray = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
    return notesArray.filter(note => note.share_with_company);
  };

  const getPrivateNotes = () => {
    const notesArray = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
    return notesArray.filter(note => !note.share_with_company);
  };

  return {
    dealNote,
    isLoading,
    error,
    setRating,
    setStatus,
    addTag,
    removeTag,
    addNote,
    updateNote,
    deleteNote,
    getSharedNotes,
    getPrivateNotes,
    isSaving: upsertMutation.isPending,
  };
}
