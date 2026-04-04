import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ApiKeyType = 'gemini' | 'openai' | 'anthropic' | 'serpapi' | 'google_vertex';

interface CompanyApiKey {
  id: string;
  company_id: string;
  key_type: ApiKeyType;
  encrypted_key: string;
  created_at: string;
  updated_at: string;
}

interface CompanyApiKeys {
  keys: CompanyApiKey[];
  isLoading: boolean;
  error: string | null;
}

interface UseCompanyApiKeysResult {
  apiKeys: CompanyApiKeys;
  refreshApiKeys: () => Promise<void>;
  createApiKey: (keyType: ApiKeyType, key: string) => Promise<boolean>;
  updateApiKey: (keyId: string, key: string) => Promise<boolean>;
  deleteApiKey: (keyId: string) => Promise<boolean>;
  getApiKey: (keyType: ApiKeyType) => CompanyApiKey | null;
}

export function useCompanyApiKeys(companyId: string): UseCompanyApiKeysResult {
  const [apiKeys, setApiKeys] = useState<CompanyApiKeys>({
    keys: [],
    isLoading: true,
    error: null
  });

  const loadApiKeys = async () => {
    try {
      setApiKeys(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error: fetchError } = await supabase
        .from('company_api_keys')
        .select('*')
        .eq('company_id', companyId)
        .order('key_type');

      if (fetchError) throw fetchError;

      setApiKeys({
        keys: (data || []) as CompanyApiKey[],
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Error loading API keys:', err);
      setApiKeys(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load API keys'
      }));
    }
  };

  const createApiKey = async (keyType: ApiKeyType, key: string): Promise<boolean> => {
    try {
      setApiKeys(prev => ({ ...prev, error: null }));

      // For now, we'll store the key as plain text (in production, this should be encrypted)
      const { error: insertError } = await supabase
        .from('company_api_keys')
        .insert({
          company_id: companyId,
          key_type: keyType,
          encrypted_key: key // In production, encrypt this
        });

      if (insertError) throw insertError;

      await loadApiKeys();
      return true;
    } catch (err) {
      console.error('Error creating API key:', err);
      setApiKeys(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to create API key'
      }));
      return false;
    }
  };

  const updateApiKey = async (keyId: string, key: string): Promise<boolean> => {
    try {
      setApiKeys(prev => ({ ...prev, error: null }));

      const { error: updateError } = await supabase
        .from('company_api_keys')
        .update({
          encrypted_key: key, // In production, encrypt this
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId);

      if (updateError) throw updateError;

      await loadApiKeys();
      return true;
    } catch (err) {
      console.error('Error updating API key:', err);
      setApiKeys(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to update API key'
      }));
      return false;
    }
  };

  const deleteApiKey = async (keyId: string): Promise<boolean> => {
    try {
      setApiKeys(prev => ({ ...prev, error: null }));

      const { error: deleteError } = await supabase
        .from('company_api_keys')
        .delete()
        .eq('id', keyId);

      if (deleteError) throw deleteError;

      await loadApiKeys();
      return true;
    } catch (err) {
      console.error('Error deleting API key:', err);
      setApiKeys(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to delete API key'
      }));
      return false;
    }
  };

  const getApiKey = (keyType: ApiKeyType): CompanyApiKey | null => {
    return apiKeys.keys.find(key => key.key_type === keyType) || null;
  };

  const refreshApiKeys = async () => {
    await loadApiKeys();
  };

  useEffect(() => {
    if (companyId) {
      loadApiKeys();
    }
  }, [companyId]);

  return {
    apiKeys,
    refreshApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    getApiKey
  };
}

// Hook for checking if specific API keys are available
export function useApiKeyStatus(companyId: string) {
  const { apiKeys } = useCompanyApiKeys(companyId);

  return {
    isLoading: apiKeys.isLoading,
    geminiAvailable: !!apiKeys.keys.find(key => key.key_type === 'gemini'),
    openaiAvailable: !!apiKeys.keys.find(key => key.key_type === 'openai'),
    anthropicAvailable: !!apiKeys.keys.find(key => key.key_type === 'anthropic'),
    serpapiAvailable: !!apiKeys.keys.find(key => key.key_type === 'serpapi'),
    getKey: (keyType: ApiKeyType) => apiKeys.keys.find(key => key.key_type === keyType)?.encrypted_key || null
  };
}