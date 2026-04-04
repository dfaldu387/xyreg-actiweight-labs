import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DesignReview, DesignReviewFinding, DesignReviewManifestItem, DesignReviewSignature, DesignReviewParticipant } from '@/types/designReview';
import { toast } from 'sonner';

export function useDesignReviews(companyId?: string, productId?: string) {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['design-reviews', companyId, productId],
    queryFn: async () => {
      let query = supabase
        .from('design_reviews' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (companyId) query = query.eq('company_id', companyId);
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DesignReview[];
    },
    enabled: !!companyId,
  });

  const createReview = useMutation({
    mutationFn: async (input: Partial<DesignReview>) => {
      const { data, error } = await supabase
        .from('design_reviews' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DesignReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-reviews'] });
      toast.success('Design Review created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DesignReview> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_reviews' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DesignReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-reviews'] });
      toast.success('Design Review updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_reviews' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-reviews'] });
      toast.success('Design Review deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { reviewsQuery, createReview, updateReview, deleteReview };
}

export function useDesignReviewDetail(reviewId?: string) {
  const queryClient = useQueryClient();

  const reviewQuery = useQuery({
    queryKey: ['design-review', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_reviews' as any)
        .select('*')
        .eq('id', reviewId!)
        .single();
      if (error) throw error;
      return data as unknown as DesignReview;
    },
    enabled: !!reviewId,
  });

  const manifestQuery = useQuery({
    queryKey: ['design-review-manifest', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_review_manifest_items' as any)
        .select('*')
        .eq('design_review_id', reviewId!)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as DesignReviewManifestItem[];
    },
    enabled: !!reviewId,
  });

  const findingsQuery = useQuery({
    queryKey: ['design-review-findings', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_review_findings' as any)
        .select('*')
        .eq('design_review_id', reviewId!)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as DesignReviewFinding[];
    },
    enabled: !!reviewId,
  });

  const signaturesQuery = useQuery({
    queryKey: ['design-review-signatures', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_review_signatures' as any)
        .select('*')
        .eq('design_review_id', reviewId!)
        .order('signed_at');
      if (error) throw error;
      return (data || []) as unknown as DesignReviewSignature[];
    },
    enabled: !!reviewId,
  });

  const participantsQuery = useQuery({
    queryKey: ['design-review-participants', reviewId],
    queryFn: async () => {
      const { data: participants, error } = await supabase
        .from('design_review_participants' as any)
        .select('*')
        .eq('design_review_id', reviewId!)
        .order('invited_at');
      if (error) throw error;
      if (!participants || participants.length === 0) return [];

      const userIds = [...new Set((participants as any[]).map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles' as any)
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((pr: any) => [pr.id, pr]));
      return (participants as any[]).map((p: any) => ({
        ...p,
        user_profiles: profileMap.get(p.user_id) || { first_name: null, last_name: null, email: '' },
      })) as (DesignReviewParticipant & { user_profiles: { first_name: string | null; last_name: string | null; email: string } })[];
    },
    enabled: !!reviewId,
  });

  // Mutations for sub-resources
  const addManifestItem = useMutation({
    mutationFn: async (item: Partial<DesignReviewManifestItem>) => {
      const { data, error } = await supabase
        .from('design_review_manifest_items' as any)
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['design-review-manifest', reviewId] }),
    onError: (err: any) => toast.error(err.message),
  });

  const addFinding = useMutation({
    mutationFn: async (finding: Partial<DesignReviewFinding>) => {
      const { data, error } = await supabase
        .from('design_review_findings' as any)
        .insert(finding as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-review-findings', reviewId] });
      toast.success('Finding added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateFinding = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DesignReviewFinding> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_review_findings' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['design-review-findings', reviewId] }),
    onError: (err: any) => toast.error(err.message),
  });

  const addSignature = useMutation({
    mutationFn: async (sig: Partial<DesignReviewSignature>) => {
      const { data, error } = await supabase
        .from('design_review_signatures' as any)
        .insert(sig as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-review-signatures', reviewId] });
      toast.success('Signature recorded');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addParticipant = useMutation({
    mutationFn: async (p: Partial<DesignReviewParticipant>) => {
      const { data, error } = await supabase
        .from('design_review_participants' as any)
        .insert(p as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['design-review-participants', reviewId] }),
    onError: (err: any) => toast.error(err.message),
  });

  const removeParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from('design_review_participants' as any)
        .delete()
        .eq('id', participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-review-participants', reviewId] });
      toast.success('Participant removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    reviewQuery,
    manifestQuery,
    findingsQuery,
    signaturesQuery,
    participantsQuery,
    addManifestItem,
    addFinding,
    updateFinding,
    addSignature,
    addParticipant,
    removeParticipant,
  };
}
