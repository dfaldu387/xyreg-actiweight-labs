
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDevMode } from "@/context/DevModeContext";
import { fetchTemplateSettings, saveTemplateSettings } from "@/utils/templateSettingsQueries";
import type { Database } from "@/integrations/supabase/types";

type TemplateSettingInsert = Database['public']['Tables']['template_settings']['Insert'];

export function useTemplateSettings(companyId: string) {
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const { user, session, refreshSession } = useAuth();
  const { isDevMode } = useDevMode();
  const queryClient = useQueryClient();

  // Use React Query for caching template settings
  const { data: fetchedSettings, isLoading, refetch } = useQuery({
    queryKey: ['template-settings', companyId],
    queryFn: async () => {
      const data = await fetchTemplateSettings(companyId);
      // Convert array of settings to key-value object
      return data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Merge fetched settings with local changes
  const settings = { ...fetchedSettings, ...localSettings };

  // Listen for settings updates from other components
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail.companyId === companyId) {
        setLocalSettings(event.detail.settings);
        // Also invalidate the cache
        queryClient.invalidateQueries({ queryKey: ['template-settings', companyId] });
      }
    };

    window.addEventListener('templateSettingsUpdated', handleSettingsUpdate as EventListener);

    return () => {
      window.removeEventListener('templateSettingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, [companyId, queryClient]);

  const fetchSettings = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async (settingOverrides?: Record<string, any>) => {
    try {
      // Authentication context debugging
      // console.log('=== Authentication Context Debug ===');
      // console.log('User:', user);
      // console.log('Session:', session);
      // console.log('User ID:', user?.id);
      // console.log('Session exists:', !!session);
      // console.log('Company ID:', companyId);
      // console.log('Dev Mode:', isDevMode);
      // console.log('Current settings being saved:', settings);

      // Validate authentication before attempting to save
      if (!user) {
        throw new Error('User is not authenticated. Please log in and try again.');
      }

      // For dev mode, we'll handle authentication differently
      if (isDevMode) {
        // console.log('Dev mode active - using mock authentication');
        
        // Merge current settings with any overrides
        const finalSettings = { ...settings, ...settingOverrides };
        
        // Convert settings object back to array format for database
        const settingsArray: TemplateSettingInsert[] = Object.entries(finalSettings).map(([key, value]) => ({
          company_id: companyId,
          setting_key: key,
          setting_value: value, // This should already be JSON-compatible
          setting_type: typeof value === 'boolean' ? 'boolean' : 
                       typeof value === 'number' ? 'number' :
                       Array.isArray(value) ? 'array' : 'string',
          category: getCategoryForSetting(key)
        }));

        // console.log('Settings array to save (dev mode):', settingsArray);

        const savedData = await saveTemplateSettings(companyId, settingsArray, user, session, isDevMode);
        
        // Validate that settings were actually saved
        if (!savedData || savedData.length === 0) {
          throw new Error('Settings were not saved - please check your permissions');
        }

        // console.log('Settings saved successfully (dev mode):', savedData);
        
        // Clear local changes and invalidate cache to refetch
        setLocalSettings({});
        queryClient.invalidateQueries({ queryKey: ['template-settings', companyId] });
        window.dispatchEvent(new CustomEvent('templateSettingsUpdated', {
          detail: { companyId, settings: finalSettings }
        }));

        toast.success('Settings saved successfully');
        return;
      }

      // For real authentication, refresh session first
      if (!session) {
        // console.log('No session found, attempting to refresh...');
        await refreshSession();
        
        // Check if we have a session after refresh
        if (!session) {
          throw new Error('Unable to establish authenticated session. Please log in again.');
        }
      }

      // console.log('Attempting to save settings for authenticated user:', user.email);

      // Merge current settings with any overrides
      const finalSettings = { ...settings, ...settingOverrides };
      
      // Convert settings object back to array format for database
      const settingsArray: TemplateSettingInsert[] = Object.entries(finalSettings).map(([key, value]) => ({
        company_id: companyId,
        setting_key: key,
        setting_value: value, // This should already be JSON-compatible
        setting_type: typeof value === 'boolean' ? 'boolean' : 
                     typeof value === 'number' ? 'number' :
                     Array.isArray(value) ? 'array' : 'string',
        category: getCategoryForSetting(key)
      }));

      // console.log('Settings array to save:', settingsArray);

      const savedData = await saveTemplateSettings(companyId, settingsArray, user, session, isDevMode);
      
      // Validate that settings were actually saved
      if (!savedData || savedData.length === 0) {
        throw new Error('Settings were not saved - please check your permissions');
      }

      // console.log('Settings saved successfully:', savedData);

      // Clear local changes and invalidate cache to refetch
      setLocalSettings({});
      queryClient.invalidateQueries({ queryKey: ['template-settings', companyId] });
      window.dispatchEvent(new CustomEvent('templateSettingsUpdated', {
        detail: { companyId, settings: finalSettings }
      }));

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('=== Save Settings Error ===');
      console.error('Error:', error);
      console.error('User context:', user);
      console.error('Session context:', session);
      
      // Enhanced error handling for authentication issues
      if (error instanceof Error) {
        if (error.message.includes('auth')) {
          toast.error('Authentication error: Please log in again');
        } else if (error.message.includes('permission')) {
          toast.error('Permission denied: You may not have access to save settings');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to save settings');
      }
      throw error;
    }
  };

  const getCategoryForSetting = (key: string): string => {
    // Add specific handling for sidebar settings
    if (key.startsWith('sidebar_')) return 'defaults';
    // Add specific handling for currency setting
    if (key === 'default_currency') return 'defaults';
    if (key === 'show_demo_banners') return 'defaults';
    if (key.startsWith('default_')) return 'defaults';
    if (key.includes('notify') || key.includes('reminder') || key.includes('escalation')) return 'notifications';
    if (key.includes('approval') || key.includes('workflow') || key.includes('versioning')) return 'workflows';
    if (key.includes('max_') || key.includes('mandatory') || key.includes('restrict')) return 'rules';
    if (key.includes('udi_')) return 'udi_configuration';
    return 'defaults';
  };

  return {
    settings,
    updateSetting,
    saveSettings,
    isLoading,
    refetch: fetchSettings
  };
}
