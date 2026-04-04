import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataRoom, CreateDataRoomInput, DataRoomStatus } from '@/types/dataRoom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Utility function to process date fields for database operations
const processDateFields = (input: Partial<CreateDataRoomInput>) => ({
  ...input,
  access_start_date: input.access_start_date === '' || input.access_start_date === undefined ? null : input.access_start_date,
  access_end_date: input.access_end_date === '' || input.access_end_date === undefined ? null : input.access_end_date,
});

export function useDataRooms(companyId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all data rooms for a company
  const { data: dataRooms = [], isLoading, error } = useQuery({
    queryKey: ['data-rooms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('data_rooms')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataRoom[];
    },
    enabled: !!companyId,
  });

  // Get single data room by ID
  const getDataRoomById = async (id: string): Promise<DataRoom | null> => {
    const { data, error } = await supabase
      .from('data_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DataRoom;
  };

  // Create new data room
  const createDataRoomMutation = useMutation({
    mutationFn: async ({ companyId: cId, input }: { companyId: string; input: CreateDataRoomInput }) => {
      // Use cached user from AuthContext
      // Process date fields to handle empty strings
      const processedInput = processDateFields(input);
      
      const { data, error } = await supabase
        .from('data_rooms')
        .insert({
          company_id: cId,
          name: processedInput.name,
          description: processedInput.description,
          status: 'draft' as DataRoomStatus,
          access_start_date: processedInput.access_start_date,
          access_end_date: processedInput.access_end_date,
          branding_logo_url: processedInput.branding_logo_url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      toast.success('Data room created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create data room: ${error.message}`);
    },
  });

  // Update data room
  const updateDataRoomMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateDataRoomInput> }) => {
      // Process date fields to handle empty strings
      const processedInput = processDateFields(input);

      const { data, error } = await supabase
        .from('data_rooms')
        .update(processedInput)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      toast.success('Data room updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update data room: ${error.message}`);
    },
  });

  // Delete data room (soft delete to archived status)
  const deleteDataRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('data_rooms')
        .update({ status: 'archived' as DataRoomStatus })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      toast.success('Data room archived successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive data room: ${error.message}`);
    },
  });

  // Activate data room
  const activateDataRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('data_rooms')
        .update({ status: 'active' as DataRoomStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      toast.success('Data room activated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate data room: ${error.message}`);
    },
  });

  return {
    dataRooms,
    isLoading,
    error,
    getDataRoomById,
    createDataRoom: createDataRoomMutation.mutate,
    updateDataRoom: updateDataRoomMutation.mutate,
    deleteDataRoom: deleteDataRoomMutation.mutate,
    activateDataRoom: activateDataRoomMutation.mutate,
    isCreating: createDataRoomMutation.isPending,
    isUpdating: updateDataRoomMutation.isPending,
    isDeleting: deleteDataRoomMutation.isPending,
    isActivating: activateDataRoomMutation.isPending,
  };
}
