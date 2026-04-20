import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Key,
  Search,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  Image,
  Eye,
  EyeOff,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiKeyType } from '@/hooks/useCompanyApiKeys';


interface CompanyApiKeyInfo {
  id: string;
  name: string;
  api_keys: {
    id: string;
    key_type: ApiKeyType;
    created_at: string;
    updated_at: string;
    encrypted_key: string;
    token_usage_data: any;
    last_usage_at: string | null;
    usage_last_synced_at: string | null;
  }[];
}

const API_KEY_TYPES: { value: ApiKeyType; label: string; icon: React.ReactNode }[] = [
  { value: 'gemini', label: 'Gemini', icon: <Bot className="w-4 h-4 text-primary" /> },
  { value: 'openai', label: 'OpenAI', icon: <Bot className="w-4 h-4 text-success" /> },
  { value: 'anthropic', label: 'Anthropic', icon: <Bot className="w-4 h-4 text-warning" /> },
  { value: 'serpapi', label: 'SerpAPI', icon: <Image className="w-4 h-4 text-destructive" /> },
  { value: 'google_vertex' as ApiKeyType, label: 'Google Vertex AI', icon: <Bot className="w-4 h-4 text-primary" /> },
  { value: 'elevenlabs', label: 'ElevenLabs', icon: <Bot className="w-4 h-4 text-pink-500" /> }
];

function SuperAdminApiKeyManagement() {
  const [companies, setCompanies] = useState<CompanyApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showKeys, setShowKeys] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal state
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState<CompanyApiKeyInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API Key form state
  const [editingKeyType, setEditingKeyType] = useState<ApiKeyType | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFilter, setAiFilter] = useState('all');

  // Bulk operation state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkKeyType, setBulkKeyType] = useState<ApiKeyType | ''>('');
  const [bulkKeyValue, setBulkKeyValue] = useState('');
  const [showBulkKeyValue, setShowBulkKeyValue] = useState(false);
  const [bulkSelectedCompanies, setBulkSelectedCompanies] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkOverwriteExisting, setBulkOverwriteExisting] = useState(false);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [verifyingKey, setVerifyingKey] = useState<string | null>(null);

  // Verify key function - decrypts and validates the key
  const handleVerifyKey = async (keyType: ApiKeyType) => {
    if (!selectedCompanyForModal) return;

    const apiKey = selectedCompanyForModal.api_keys.find(k => k.key_type === keyType);
    if (!apiKey) {
      toast.error('No key found to verify');
      return;
    }

    setVerifyingKey(keyType);
    try {
      const keyValue = apiKey.encrypted_key;

      const isGeminiKey = keyType === 'gemini';
      const expectedPrefix = isGeminiKey ? 'AIza' : '';
      const hasValidPrefix = !expectedPrefix || keyValue.startsWith(expectedPrefix);
      const hasValidLength = keyValue.length >= 30;

      console.log('[SuperAdmin] Key verification:', {
        keyType,
        keyLength: keyValue.length,
        prefix: keyValue.substring(0, 4),
        suffix: keyValue.substring(keyValue.length - 4),
        hasValidPrefix,
        hasValidLength
      });

      // Live validation for ElevenLabs keys
      if (keyType === 'elevenlabs' && hasValidLength) {
        try {
          const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': keyValue },
          });
          if (response.ok) {
            toast.success(
              <div>
                <strong>ElevenLabs key verified!</strong>
                <br />
                <span className="text-xs">Successfully connected to ElevenLabs API.</span>
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.error(
              <div>
                <strong>ElevenLabs key rejected!</strong>
                <br />
                <span className="text-xs">API returned status {response.status}. Please check the key.</span>
              </div>,
              { duration: 8000 }
            );
          }
        } catch (fetchErr) {
          toast.error('Could not reach ElevenLabs API to validate key.');
        }
        return;
      }

      // For Google Vertex AI, check if it's a valid service account JSON
      if (keyType === 'google_vertex' as ApiKeyType) {
        try {
          const parsed = JSON.parse(keyValue);
          if (parsed.type === 'service_account' && parsed.private_key && parsed.client_email) {
            toast.success(
              <div>
                <strong>Valid service account JSON!</strong>
                <br />
                <span className="text-xs">
                  Project: {parsed.project_id} | Email: {parsed.client_email}
                </span>
              </div>,
              { duration: 5000 }
            );
            return;
          }
        } catch {
          // Not JSON, fall through to standard validation
        }
      }

      if (hasValidLength && hasValidPrefix) {
        toast.success(
          <div>
            <strong>Key looks valid!</strong>
            <br />
            <span className="text-xs">
              Length: {keyValue.length} chars | Prefix: {keyValue.substring(0, 4)}...
            </span>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div>
            <strong>Key appears invalid!</strong>
            <br />
            <span className="text-xs">
              Length: {keyValue.length} chars (expected 30+)
              {isGeminiKey && !hasValidPrefix && <><br />Prefix: "{keyValue.substring(0, 4)}" (expected "AIza")</>}
            </span>
            <br />
            <span className="text-xs text-amber-200">Please re-enter the key.</span>
          </div>,
          { duration: 8000 }
        );
      }
    } catch (error) {
      console.error('Key verification error:', error);
      toast.error('Failed to verify key: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setVerifyingKey(null);
    }
  };

  useEffect(() => {
    loadCompaniesApiKeys();
  }, []);

  const loadCompaniesApiKeys = async (): Promise<CompanyApiKeyInfo[]> => {
    try {
      setIsLoading(true);

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .or('is_archived.eq.false,is_archived.is.null')
        .not('name', 'is', null)
        .neq('name', '')
        .order('name');

      if (companiesError) throw companiesError;

      const { data: apiKeysData, error: apiKeysError } = await supabase
        .from('company_api_keys')
        .select('id, company_id, key_type, created_at, updated_at, encrypted_key, token_usage_data, last_usage_at, usage_last_synced_at')
        .order('key_type');

      if (apiKeysError) throw apiKeysError;

      const companiesWithKeys = (companiesData?.map(company => ({
        id: company.id,
        name: company.name,
        api_keys: apiKeysData?.filter(key => key.company_id === company.id) || []
      })) || []) as CompanyApiKeyInfo[];

      setCompanies(companiesWithKeys);
      return companiesWithKeys;
    } catch (error) {
      console.error('Error loading companies API keys:', error);
      toast.error('Failed to load companies API key status');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const refreshModalCompany = (companyList: CompanyApiKeyInfo[], companyId: string) => {
    const updatedCompany = companyList.find(company => company.id === companyId) || null;
    setSelectedCompanyForModal(updatedCompany);
  };

  const getApiKeyStatus = (company: CompanyApiKeyInfo, keyType: ApiKeyType) => {
    const hasKey = company.api_keys.some(key => key.key_type === keyType);
    return hasKey ? 'configured' : 'not-configured';
  };
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().startsWith(searchQuery.toLowerCase());
    const matchesCompany = !selectedCompany || selectedCompany === 'all' || company.id === selectedCompany;

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'configured') {
        matchesStatus = company.api_keys.length > 0;
      } else if (statusFilter === 'not-configured') {
        matchesStatus = company.api_keys.length === 0;
      }
    }
    let matchesAi = true;
    if (aiFilter !== 'all') {
      matchesAi = company.api_keys.some(key => key.key_type === aiFilter);
    }

    return matchesSearch && matchesCompany && matchesStatus && matchesAi;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, statusFilter, aiFilter]);

  const getStatusBadge = (status: string) => {
    if (status === 'configured') {
      return <Badge variant="default" className="bg-success text-success-foreground">Configured</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Not Configured</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'configured') {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    return <XCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const getApiKeyCounts = () => {
    const counts = {
      total: companies.length,
      withKeys: companies.filter(c => c.api_keys.length > 0).length,
      gemini: companies.filter(c => c.api_keys.some(k => k.key_type === 'gemini')).length,
      openai: companies.filter(c => c.api_keys.some(k => k.key_type === 'openai')).length,
      anthropic: companies.filter(c => c.api_keys.some(k => k.key_type === 'anthropic')).length,
      serpapi: companies.filter(c => c.api_keys.some(k => k.key_type === 'serpapi')).length,
      google_vertex: companies.filter(c => c.api_keys.some(k => k.key_type === 'google_vertex')).length,
      elevenlabs: companies.filter(c => c.api_keys.some(k => k.key_type === 'elevenlabs')).length
    };
    return counts;
  };

  const handleManageCompany = (company: CompanyApiKeyInfo) => {
    setSelectedCompanyForModal(company);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCompanyForModal(null);
    setEditingKeyType(null);
    setNewKeyValue('');
    setShowKeyValue(false);
    setIsGenerating(false);
  };

  const handleAddKey = (keyType: ApiKeyType) => {
    setEditingKeyType(keyType);
    setNewKeyValue('');
    setShowKeyValue(false);
  };

  const handleEditKey = (keyType: ApiKeyType) => {
    setEditingKeyType(keyType);
    setNewKeyValue('');
    setShowKeyValue(false);
  };

  const handleSaveKey = async () => {
    if (!selectedCompanyForModal || !editingKeyType || !newKeyValue.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsSaving(true);
    try {
      const existingKey = selectedCompanyForModal.api_keys.find(key => key.key_type === editingKeyType);

      const { error } = await supabase
        .from('company_api_keys')
        .upsert(
          {
            id: existingKey?.id,
            company_id: selectedCompanyForModal.id,
            key_type: editingKeyType,
            encrypted_key: newKeyValue.trim(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'company_id,key_type' }
        );

      if (error) throw error;

      toast.success(`${API_KEY_TYPES.find(t => t.value === editingKeyType)?.label} API key ${existingKey ? 'updated' : 'saved'} successfully`);

      const refreshedCompanies = await loadCompaniesApiKeys();
      refreshModalCompany(refreshedCompanies, selectedCompanyForModal.id);

      setEditingKeyType(null);
      setNewKeyValue('');
      setShowKeyValue(false);
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (keyType: ApiKeyType) => {
    if (!selectedCompanyForModal) return;

    const apiKey = selectedCompanyForModal.api_keys.find(key => key.key_type === keyType);
    if (!apiKey) return;

    if (!confirm(`Are you sure you want to delete the ${API_KEY_TYPES.find(t => t.value === keyType)?.label} API key?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('company_api_keys')
        .delete()
        .eq('id', apiKey.id);

      if (error) throw error;
      toast.success(`${API_KEY_TYPES.find(t => t.value === keyType)?.label} API key deleted successfully`);

      // Refresh data
      await loadCompaniesApiKeys();

      // Update modal data
      const updatedCompany = companies.find(c => c.id === selectedCompanyForModal.id);
      if (updatedCompany) {
        setSelectedCompanyForModal(updatedCompany);
      }

    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingKeyType(null);
    setNewKeyValue('');
    setShowKeyValue(false);
  };

  const handleSyncUsage = async (keyType: ApiKeyType) => {
    if (!selectedCompanyForModal) return;

    const apiKey = selectedCompanyForModal.api_keys.find(key => key.key_type === keyType);
    if (!apiKey) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-api-key-usage', {
        body: {
          keyId: apiKey.id,
          keyType: keyType,
          apiKey: apiKey.encrypted_key
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`${API_KEY_TYPES.find(t => t.value === keyType)?.label} usage data synced successfully`);

        // Fetch the updated API key data directly from the database
        const { data: updatedKeyData, error: fetchError } = await supabase
          .from('company_api_keys')
          .select('id, company_id, key_type, created_at, updated_at, encrypted_key, token_usage_data, last_usage_at, usage_last_synced_at')
          .eq('id', apiKey.id)
          .single();

        if (fetchError) throw fetchError;

        // Update the modal data with fresh data
        if (updatedKeyData) {
          const updatedKeys = selectedCompanyForModal.api_keys.map(key =>
            key.id === updatedKeyData.id ? updatedKeyData as any : key
          );
          setSelectedCompanyForModal({
            ...selectedCompanyForModal,
            api_keys: updatedKeys
          });
        }

        // Refresh the full list in background
        await loadCompaniesApiKeys();
      } else {
        throw new Error(data.error || 'Failed to sync usage data');
      }
    } catch (error) {
      console.error('Error syncing usage:', error);
      toast.error(`Failed to sync usage data: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoGenerateKey = async (keyType: ApiKeyType) => {
    if (!selectedCompanyForModal) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-openai-key', {
        body: {
          companyId: selectedCompanyForModal.id,
          companyName: selectedCompanyForModal.name,
          keyType: keyType
        }
      });

      if (error) throw error;

      if (data.success) {
        // Auto-populate the key field with generated key
        setNewKeyValue(data.apiKey);
        setEditingKeyType(keyType);
        setShowKeyValue(true);

        toast.success(data.message || `${keyType} API key generated successfully`);

        // Refresh data to show the new key
        await loadCompaniesApiKeys();

        // Update modal data
        const updatedCompany = companies.find(c => c.id === selectedCompanyForModal.id);
        if (updatedCompany) {
          setSelectedCompanyForModal(updatedCompany);
        }
      } else {
        throw new Error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error(`Failed to generate ${keyType} API key: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk operation handlers
  const openBulkModal = () => {
    setBulkKeyType('');
    setBulkKeyValue('');
    setShowBulkKeyValue(false);
    setBulkSelectedCompanies(new Set());
    setBulkOverwriteExisting(false);
    setBulkSearchQuery('');
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkKeyType('');
    setBulkKeyValue('');
    setShowBulkKeyValue(false);
    setBulkSelectedCompanies(new Set());
    setBulkOverwriteExisting(false);
    setBulkSearchQuery('');
  };

  const bulkFilteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(bulkSearchQuery.toLowerCase())
  );

  const toggleBulkCompany = (companyId: string) => {
    setBulkSelectedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const toggleBulkSelectAll = () => {
    if (bulkSelectedCompanies.size === bulkFilteredCompanies.length) {
      setBulkSelectedCompanies(new Set());
    } else {
      setBulkSelectedCompanies(new Set(bulkFilteredCompanies.map(c => c.id)));
    }
  };

  const handleBulkAddKeys = async () => {
    if (!bulkKeyType || !bulkKeyValue.trim() || bulkSelectedCompanies.size === 0) {
      toast.error('Please select a key type, enter a key value, and select at least one company');
      return;
    }

    setIsBulkSaving(true);
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    try {
      const plainKey = bulkKeyValue.trim();
      const selectedIds = Array.from(bulkSelectedCompanies);

      for (const companyId of selectedIds) {
        try {
          const company = companies.find(c => c.id === companyId);
          const existingKey = company?.api_keys.find(k => k.key_type === bulkKeyType);

          if (existingKey && !bulkOverwriteExisting) {
            skippedCount++;
            continue;
          }

          if (existingKey) {
            const { error } = await supabase
              .from('company_api_keys')
              .update({ encrypted_key: plainKey, updated_at: new Date().toISOString() })
              .eq('id', existingKey.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('company_api_keys')
              .insert({ company_id: companyId, key_type: bulkKeyType, encrypted_key: plainKey });
            if (error) throw error;
          }
          successCount++;
        } catch (err) {
          console.error(`Error adding key for company ${companyId}:`, err);
          errorCount++;
        }
      }

      const messages: string[] = [];
      if (successCount > 0) messages.push(`${successCount} added/updated`);
      if (skippedCount > 0) messages.push(`${skippedCount} skipped (already configured)`);
      if (errorCount > 0) messages.push(`${errorCount} failed`);

      if (errorCount > 0) {
        toast.warning(`Bulk operation completed: ${messages.join(', ')}`);
      } else {
        toast.success(`Bulk operation completed: ${messages.join(', ')}`);
      }

      await loadCompaniesApiKeys();
      closeBulkModal();
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Bulk operation failed');
    } finally {
      setIsBulkSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const counts = getApiKeyCounts();

  // Provider accent colors for visual distinction
  const providerAccents: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    gemini: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    openai: { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    anthropic: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    serpapi: { border: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
    google_vertex: { border: 'border-l-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  };

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Key Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.total} companies — {counts.withKeys} with API keys
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openBulkModal} className="bg-background gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Bulk Add Key
        </Button>
      </div>

      {/* Summary Cards — compact stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Companies tile */}
        <div className="relative overflow-hidden rounded-xl border bg-card p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Companies</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{counts.total}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {counts.withKeys} with API keys
          </p>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-primary/5" />
        </div>

        {API_KEY_TYPES.map((type) => {
          const accent = providerAccents[type.value] || providerAccents.gemini;
          const count = counts[type.value as keyof typeof counts] as number;
          const percentage = counts.total > 0 ? Math.round((count / counts.total) * 100) : 0;
          return (
            <div key={type.value} className={`relative overflow-hidden rounded-xl border bg-card p-4 border-l-4 ${accent.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{type.label}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight">{count}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${accent.dot} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{percentage}%</span>
              </div>
              <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-muted/30" />
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg space-y-3">
      {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(newValue) => setStatusFilter(newValue)}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="configured">Configured</SelectItem>
              <SelectItem value="not-configured">Not Configured</SelectItem>
            </SelectContent>
          </Select>
          <Select value={aiFilter} onValueChange={setAiFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All AI Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI Models</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="serpapi">SerpAPI</SelectItem>
              <SelectItem value="google_vertex">Google Vertex AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="pl-5 font-semibold text-md uppercase tracking-wider text-muted-foreground">Company</TableHead>
                {API_KEY_TYPES.map((type) => {
                  const accent = providerAccents[type.value] || providerAccents.gemini;
                  return (
                    <TableHead key={type.value} className="text-center font-semibold text-md uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                        {type.label}
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="text-center font-semibold text-md uppercase tracking-wider text-muted-foreground">Keys</TableHead>
                <TableHead className="text-right pr-5 font-semibold text-md uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.map((company) => (
                <TableRow key={company.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="pl-5 font-medium py-3 text-md">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2.5 cursor-default">
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <span className="truncate max-w-[200px]">{company.name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{company.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {API_KEY_TYPES.map((type) => {
                    const status = getApiKeyStatus(company, type.value);
                    const isConfigured = status === 'configured';
                    return (
                      <TableCell key={type.value} className="text-center py-3">
                        {isConfigured ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 font-medium text-md px-2.5">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-md text-muted-foreground/60">
                            <XCircle className="w-3.5 h-3.5" />
                            No Key
                          </span>
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-center py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-md font-semibold ${
                      company.api_keys.length > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {company.api_keys.length}
                    </span>
                  </TableCell>

                  <TableCell className="text-right pr-5 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageCompany(company)}
                      className="h-8 px-3 text-md font-medium opacity-70 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-3 h-3 mr-1.5" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Search className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-sm font-medium">No companies found</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Try adjusting your search or filters</p>
            </div>
          )}


        {/* Pagination */}
        <div className="flex items-center justify-between px-16 py-2.5 border-t text-sm text-slate-700">
          <span>
            Showing {filteredCompanies.length} companies · Page {currentPage}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[65px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>Page {currentPage}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <span className="sr-only">Previous</span>
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              >
                <span className="sr-only">Next</span>
                ›
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Bulk Add Key Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Bulk Add API Key
            </DialogTitle>
            <DialogDescription>
              Add the same API key to multiple companies at once
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Key Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key Type</Label>
              <Select value={bulkKeyType} onValueChange={(val) => setBulkKeyType(val as ApiKeyType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key type" />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">{type.icon} {type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Key Value */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key Value</Label>
              <div className="relative">
                <Textarea
                  value={bulkKeyValue}
                  onChange={(e) => setBulkKeyValue(e.target.value)}
                  placeholder="Enter the API key to assign to selected companies"
                  className="pr-10 min-h-[80px] font-mono text-sm resize-none"
                  rows={3}
                  style={showBulkKeyValue ? {} : ({
                    WebkitTextSecurity: 'disc',
                    fontFamily: 'monospace'
                  } as React.CSSProperties)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowBulkKeyValue(!showBulkKeyValue)}
                >
                  {showBulkKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Overwrite toggle */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Switch
                id="bulk-overwrite"
                checked={bulkOverwriteExisting}
                onCheckedChange={setBulkOverwriteExisting}
              />
              <Label htmlFor="bulk-overwrite" className="text-sm cursor-pointer">
                Overwrite existing keys (if a company already has this key type configured, update it)
              </Label>
            </div>

            {/* Company Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Select Companies ({bulkSelectedCompanies.size} selected)
                </Label>
                <Button variant="ghost" size="sm" onClick={toggleBulkSelectAll}>
                  {bulkSelectedCompanies.size === bulkFilteredCompanies.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search companies..."
                  value={bulkSearchQuery}
                  onChange={(e) => setBulkSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-md max-h-[250px] overflow-y-auto">
                {bulkFilteredCompanies.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No companies found</div>
                ) : (
                  bulkFilteredCompanies.map((company) => {
                    const hasExistingKey = bulkKeyType ? company.api_keys.some(k => k.key_type === bulkKeyType) : false;
                    return (
                      <div
                        key={company.id}
                        className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                          bulkSelectedCompanies.has(company.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => toggleBulkCompany(company.id)}
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedCompanies.has(company.id)}
                          onChange={() => toggleBulkCompany(company.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{company.name}</span>
                        </div>
                        {hasExistingKey && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {bulkOverwriteExisting ? 'Will update' : 'Has key (skip)'}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeBulkModal} disabled={isBulkSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkAddKeys}
                disabled={isBulkSaving || !bulkKeyType || !bulkKeyValue.trim() || bulkSelectedCompanies.size === 0}
              >
                {isBulkSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Adding Keys...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Add Key to {bulkSelectedCompanies.size} {bulkSelectedCompanies.size === 1 ? 'Company' : 'Companies'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company API Key Management Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                {selectedCompanyForModal?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage API key configuration
              </DialogDescription>
            </DialogHeader>
            {/* Quick status row */}
            {selectedCompanyForModal && (
              <div className="flex items-center gap-3 mt-3">
                {API_KEY_TYPES.map((type) => {
                  const hasKey = selectedCompanyForModal.api_keys.some(key => key.key_type === type.value);
                  const accent = providerAccents[type.value] || providerAccents.gemini;
                  return (
                    <div key={type.value} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${hasKey ? accent.dot : 'bg-muted-foreground/30'}`} />
                      <span className={`text-[11px] ${hasKey ? 'text-foreground font-medium' : 'text-muted-foreground/60'}`}>
                        {type.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scrollable content */}
          {selectedCompanyForModal && (
            <div className="overflow-y-auto px-5 py-4 space-y-2" style={{ maxHeight: 'calc(85vh - 160px)' }}>
              {API_KEY_TYPES.map((type) => {
                const apiKey = selectedCompanyForModal.api_keys.find(key => key.key_type === type.value);
                const accent = providerAccents[type.value] || providerAccents.gemini;
                const isEditing = editingKeyType === type.value;

                return (
                  <div key={type.value} className={`rounded-lg border ${isEditing ? 'ring-1 ring-primary/30 border-primary/30' : ''}`}>
                    {/* Row header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
                        <span className="text-sm font-medium">{type.label}</span>
                        {apiKey ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0 h-5">
                            Active
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Not set</span>
                        )}
                      </div>

                      {/* Actions — only when not editing */}
                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          {apiKey ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleSyncUsage(type.value)} disabled={isSaving || isGenerating}>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Sync
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleVerifyKey(type.value)} disabled={isSaving || isGenerating || verifyingKey === type.value}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {verifyingKey === type.value ? '...' : 'Verify'}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleEditKey(type.value)} disabled={isSaving || isGenerating}>
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteKey(type.value)} disabled={isSaving || isGenerating}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleAddKey(type.value)} disabled={isSaving || isGenerating}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add Key
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit form — inline */}
                    {isEditing && (
                      <div className="px-4 pb-3 space-y-2">
                        <div className="relative">
                          <Textarea
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            placeholder={`Enter ${type.label} API key`}
                            className="pr-10 min-h-[60px] font-mono text-xs resize-none"
                            rows={2}
                            style={showKeyValue ? {} : ({ WebkitTextSecurity: 'disc', fontFamily: 'monospace' } as React.CSSProperties)}
                          />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setShowKeyValue(!showKeyValue)}>
                            {showKeyValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveKey} disabled={!newKeyValue.trim() || isSaving || isGenerating} size="sm" className="h-7 text-xs px-3">
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button variant="ghost" onClick={cancelEdit} disabled={isSaving || isGenerating} size="sm" className="h-7 text-xs px-3">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Usage details — collapsible inline */}
                    {!isEditing && apiKey && apiKey.token_usage_data && Object.keys(apiKey.token_usage_data).length > 0 && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="rounded-md bg-muted/40 px-3 py-2 space-y-1">
                          {apiKey.token_usage_data.error ? (
                            <span className="text-[11px] text-destructive flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {apiKey.token_usage_data.error}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {apiKey.token_usage_data.status && (
                                <span className="text-[11px] text-muted-foreground">Status: <span className="font-medium text-foreground">{apiKey.token_usage_data.status}</span></span>
                              )}
                              {apiKey.token_usage_data.model_count !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Models: <span className="font-medium text-foreground">{apiKey.token_usage_data.model_count}</span></span>
                              )}
                              {apiKey.token_usage_data.total_tokens !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Tokens: <span className="font-medium text-foreground">{apiKey.token_usage_data.total_tokens.toLocaleString()}</span></span>
                              )}
                              {apiKey.token_usage_data.total_requests !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Requests: <span className="font-medium text-foreground">{apiKey.token_usage_data.total_requests.toLocaleString()}</span></span>
                              )}
                              {apiKey.token_usage_data.total_searches !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Searches: <span className="font-medium text-foreground">{apiKey.token_usage_data.total_searches.toLocaleString()}</span></span>
                              )}
                              {apiKey.token_usage_data.total_input_token_limit !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Input Limit: <span className="font-medium text-foreground">{apiKey.token_usage_data.total_input_token_limit.toLocaleString()}</span></span>
                              )}
                              {apiKey.token_usage_data.total_output_token_limit !== undefined && (
                                <span className="text-[11px] text-muted-foreground">Output Limit: <span className="font-medium text-foreground">{apiKey.token_usage_data.total_output_token_limit.toLocaleString()}</span></span>
                              )}
                            </div>
                          )}
                          {apiKey.last_usage_at && (
                            <span className="text-[10px] text-muted-foreground/70 block">Last used {new Date(apiKey.last_usage_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Meta line for configured keys */}
                    {!isEditing && apiKey && !(apiKey.token_usage_data && Object.keys(apiKey.token_usage_data).length > 0) && (
                      <div className="px-4 pb-3 pt-0">
                        <span className="text-[10px] text-muted-foreground/60">
                          Added {new Date(apiKey.created_at).toLocaleDateString()} · Updated {new Date(apiKey.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-3 border-t bg-muted/20">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={() => { loadCompaniesApiKeys(); closeModal(); }}>
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Refresh & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuperAdminApiKeyManagement;
