
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AuthUser } from "@/services/authService";
import type { Session } from "@supabase/supabase-js";

type TemplateSettingRow = Database['public']['Tables']['template_settings']['Row'];
type TemplateSettingInsert = Database['public']['Tables']['template_settings']['Insert'];

export const fetchTemplateSettings = async (companyId: string): Promise<TemplateSettingRow[]> => {
  // Authentication context debugging for fetch

  const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

  
  const { data, error } = await supabase
    .from('template_settings')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Fetch error:', error);
    throw error;
  }

  return data || [];
};

export const saveTemplateSettings = async (
  companyId: string, 
  settingsArray: TemplateSettingInsert[], 
  user?: AuthUser | null,
  session?: Session | null,
  isDevMode?: boolean
) => {

  
  // Handle dev mode differently
  if (isDevMode) {
    
    
    // For dev mode, we still need to ensure we're authenticated with Supabase
    // Let's try to get any existing session or create a temporary one
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

    
    // If no session in dev mode, we'll proceed but log it
    if (!currentSession) {
      console.warn('No session in dev mode - database operations may fail due to RLS policies');
    }
  } else {
    // For production mode, handle session management properly
    
    
    // If we have a session, ensure the Supabase client is using it
    if (session) {
      
      await supabase.auth.setSession(session);
    }
    
    // Get current auth state from supabase
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    
    // Validate authentication before database operations
    if (!currentSession) {
      throw new Error('No valid session found. Please log in and try again.');
    }
  }
  
 
  
  // Delete existing settings for this company
  const { error: deleteError } = await supabase
    .from('template_settings')
    .delete()
    .eq('company_id', companyId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw new Error(`Failed to delete existing settings: ${deleteError.message}`);
  }

  

  // Insert new settings
  const { error: insertError, data } = await supabase
    .from('template_settings')
    .insert(settingsArray)
    .select();

  if (insertError) {
    console.error('Insert error:', insertError);
    throw new Error(`Failed to save settings: ${insertError.message}`);
  }

  // Validate that the settings were actually inserted
  if (!data || data.length === 0) {
    console.error('No data returned from insert operation');
    throw new Error('Settings were not saved - this may be due to insufficient permissions');
  }

  
  return data;
};
