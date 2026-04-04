import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InvestorProfile } from "@/types/investor";

export function useInvestorProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isFetching, error } = useQuery({
    queryKey: ["investor-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("investor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as InvestorProfile | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - prevents refetches that cause flicker
  });

  const createProfileMutation = useMutation({
    mutationFn: async (profileData: Omit<InvestorProfile, 'id' | 'user_id' | 'verification_tier' | 'verified_at' | 'admin_notes' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("investor_profiles")
        .insert({
          user_id: user.id,
          ...profileData,
          verification_tier: 'tier1', // Auto-grant Tier 1 on profile completion
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-profile"] });
      toast.success("Investor profile created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<InvestorProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("investor_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const isVerified = profile?.verification_tier === 'tier1' || 
                     profile?.verification_tier === 'tier2' || 
                     profile?.verification_tier === 'verified';

  const hasVerifiedBadge = profile?.verification_tier === 'tier2' || 
                           profile?.verification_tier === 'verified';

  return {
    profile,
    isLoading,
    isFetching,
    error,
    isVerified,
    hasVerifiedBadge,
    createProfile: createProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
  };
}
