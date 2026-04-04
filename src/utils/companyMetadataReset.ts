import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Reset user metadata that forces specific company selection
 * This clears the persistent activeCompany and lastSelectedCompany that cause auto-switching
 */
export async function resetUserCompanyMetadata() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, message: 'No authenticated user' };
    }

    // Clear the problematic metadata fields
    const { error } = await supabase.auth.updateUser({
      data: { 
        activeCompany: null,
        lastSelectedCompany: null,
        role: null // Clear role to force re-determination
      }
    });
    
    if (error) {
      console.error('Error resetting user metadata:', error);
      return { success: false, message: 'Failed to reset user metadata', error };
    }
    
    console.log('User metadata reset successfully');
    toast.success('Company preferences reset successfully');
    
    return { success: true, message: 'User metadata reset successfully' };
  } catch (error) {
    console.error('Error in resetUserCompanyMetadata:', error);
    return { success: false, message: 'Unexpected error occurred', error };
  }
}

/**
 * Set a specific company as the user's primary company
 */
export async function setPrimaryCompany(companyId: string, companyName: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: 'No authenticated user' };
    }

    // Update user metadata with the selected company
    const { error } = await supabase.auth.updateUser({
      data: { 
        activeCompany: companyId,
        lastSelectedCompany: companyName
      }
    });
    
    if (error) {
      console.error('Error setting primary company:', error);
      return { success: false, message: 'Failed to set primary company', error };
    }
    
    // Update the database to mark this company as primary
    const { error: dbError } = await supabase
      .from('user_company_access')
      .update({ is_primary: false })
      .eq('user_id', user.id);
      
    if (dbError) {
      console.error('Error clearing primary flags:', dbError);
    }
    
    const { error: primaryError } = await supabase
      .from('user_company_access')
      .update({ is_primary: true })
      .eq('user_id', user.id)
      .eq('company_id', companyId);
      
    if (primaryError) {
      console.error('Error setting primary company in DB:', primaryError);
    }
    
    toast.success(`Set ${companyName} as primary company`);
    
    return { success: true, message: `${companyName} set as primary company` };
  } catch (error) {
    console.error('Error in setPrimaryCompany:', error);
    return { success: false, message: 'Unexpected error occurred', error };
  }
}