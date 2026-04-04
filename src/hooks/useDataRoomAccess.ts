import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataRoomAccess, InviteInvestorInput, AccessStatus } from '@/types/dataRoom';
import { generateSecureToken } from '@/utils/tokenGenerator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export function useDataRoomAccess(dataRoomId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all access records for a data room
  const { data: accessList = [], isLoading, error } = useQuery({
    queryKey: ['data-room-access', dataRoomId],
    queryFn: async () => {
      if (!dataRoomId) return [];
      
      const { data, error } = await supabase
        .from('data_room_access')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataRoomAccess[];
    },
    enabled: !!dataRoomId,
  });

  // Invite investor (create access record)
  const inviteInvestorMutation = useMutation({
    mutationFn: async ({ dataRoomId: drId, input }: { dataRoomId: string; input: InviteInvestorInput }) => {
      // Use cached user from AuthContext
      const accessToken = generateSecureToken();
      
      const { data, error } = await supabase
        .from('data_room_access')
        .insert({
          data_room_id: drId,
          investor_email: input.investor_email,
          investor_name: input.investor_name,
          investor_organization: input.investor_organization,
          access_level: input.access_level,
          can_download: input.can_download,
          access_expires_at: input.access_expires_at,
          access_token: accessToken,
          status: 'active' as AccessStatus,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoomAccess;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-access'] });
      toast.success('Investor invited successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite investor: ${error.message}`);
    },
  });

  // Revoke access
  const revokeAccessMutation = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('data_room_access')
        .update({ status: 'revoked' as AccessStatus })
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-access'] });
      toast.success('Access revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke access: ${error.message}`);
    },
  });

  // Update permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ 
      accessId, 
      permissions 
    }: { 
      accessId: string; 
      permissions: { 
        can_download?: boolean; 
        access_level?: string;
        access_expires_at?: string;
      } 
    }) => {
      const { error } = await supabase
        .from('data_room_access')
        .update(permissions)
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-access'] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    },
  });

  // Validate access token (for investor portal)
  const validateAccessToken = async (token: string): Promise<{ valid: boolean; access?: DataRoomAccess; dataRoom?: any }> => {
    const { data: access, error } = await supabase
      .from('data_room_access')
      .select('*, data_room:data_rooms(*)')
      .eq('access_token', token)
      .eq('status', 'active')
      .single();

    if (error || !access) {
      return { valid: false };
    }

    // Check if expired
    if (access.access_expires_at) {
      const expiryDate = new Date(access.access_expires_at);
      if (expiryDate < new Date()) {
        // Update status to expired
        await supabase
          .from('data_room_access')
          .update({ status: 'expired' as AccessStatus })
          .eq('id', access.id);
        
        return { valid: false };
      }
    }

    return { 
      valid: true, 
      access: access as any,
      dataRoom: (access as any).data_room 
    };
  };

  // Update last accessed timestamp
  const updateLastAccessedMutation = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('data_room_access')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', accessId);

      if (error) throw error;
    },
  });

  return {
    accessList,
    isLoading,
    error,
    inviteInvestor: inviteInvestorMutation.mutate,
    revokeAccess: revokeAccessMutation.mutate,
    updatePermissions: updatePermissionsMutation.mutate,
    validateAccessToken,
    updateLastAccessed: updateLastAccessedMutation.mutate,
    isInviting: inviteInvestorMutation.isPending,
    isRevoking: revokeAccessMutation.isPending,
    isUpdatingPermissions: updatePermissionsMutation.isPending,
  };
}
