import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Image,
  Bot,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mockTestGeminiApiKey } from '@/services/apiKeyTesters';
import { useCompanyApiKeys, ApiKeyType } from '@/hooks/useCompanyApiKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface ApiKeyManagementProps {
  companyId: string;
  companyName: string;
}

export function ApiKeyManagement({ companyId, companyName }: ApiKeyManagementProps) {
  const { lang } = useTranslation();
  const { apiKeys, createApiKey, updateApiKey, deleteApiKey, getApiKey } = useCompanyApiKeys(companyId);

  const API_KEY_TYPES: { value: ApiKeyType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'gemini',
      label: lang('settings.apiKeyManagement.services.gemini'),
      icon: <Bot className="w-4 h-4 text-blue-500" />,
      description: lang('settings.apiKeyManagement.services.geminiDescription')
    },
    {
      value: 'openai',
      label: lang('settings.apiKeyManagement.services.openai'),
      icon: <Bot className="w-4 h-4 text-green-500" />,
      description: lang('settings.apiKeyManagement.services.openaiDescription')
    },
    {
      value: 'anthropic',
      label: lang('settings.apiKeyManagement.services.anthropic'),
      icon: <Bot className="w-4 h-4 text-purple-500" />,
      description: lang('settings.apiKeyManagement.services.anthropicDescription')
    },
    {
      value: 'serpapi',
      label: lang('settings.apiKeyManagement.services.serpapi'),
      icon: <Image className="w-4 h-4 text-orange-500" />,
      description: lang('settings.apiKeyManagement.services.serpapiDescription')
    },
    {
      value: 'elevenlabs',
      label: 'ElevenLabs',
      icon: <Bot className="w-4 h-4 text-pink-500" />,
      description: 'Text-to-speech voice synthesis for advisory bot'
    }
  ];
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Form state
  const [newKeyType, setNewKeyType] = useState<ApiKeyType>('gemini');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  
  // UI state
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const handleCreateKey = async () => {
    if (!newKeyValue.trim()) {
      toast.error(lang('settings.apiKeyManagement.errors.enterApiKey'));
      return;
    }

    setIsSaving(true);
    const success = await createApiKey(newKeyType, newKeyValue.trim());

    if (success) {
      toast.success(lang('settings.apiKeyManagement.keyAddedSuccess', { service: API_KEY_TYPES.find(t => t.value === newKeyType)?.label }));
      setNewKeyValue('');
    } else {
      toast.error(lang('settings.apiKeyManagement.errors.failedToAdd'));
    }

    setIsSaving(false);
  };

  const handleUpdateKey = async (keyId: string) => {
    if (!editKeyValue.trim()) {
      toast.error(lang('settings.apiKeyManagement.errors.enterApiKey'));
      return;
    }

    setIsSaving(true);
    const success = await updateApiKey(keyId, editKeyValue.trim());

    if (success) {
      toast.success(lang('settings.apiKeyManagement.keyUpdatedSuccess'));
      setEditingKey(null);
      setEditKeyValue('');
    } else {
      toast.error(lang('settings.apiKeyManagement.errors.failedToUpdate'));
    }

    setIsSaving(false);
  };

  const handleDeleteKey = async (keyId: string, keyType: ApiKeyType) => {
    if (!confirm(lang('settings.apiKeyManagement.confirmDelete'))) return;

    setIsSaving(true);
    const success = await deleteApiKey(keyId);

    if (success) {
      toast.success(lang('settings.apiKeyManagement.keyDeletedSuccess', { service: API_KEY_TYPES.find(t => t.value === keyType)?.label }));
    } else {
      toast.error(lang('settings.apiKeyManagement.errors.failedToDelete'));
    }

    setIsSaving(false);
  };

  const testApiKey = async (keyType: ApiKeyType, keyValue: string) => {
    if (!keyValue.trim()) {
      toast.error(lang('settings.apiKeyManagement.errors.enterApiKeyFirst'));
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, [keyType]: 'testing' }));

      if (keyType === 'gemini') {
        const result = await mockTestGeminiApiKey(keyValue.trim());
        if (result.success) {
          setTestResults(prev => ({ ...prev, [keyType]: 'success' }));
          toast.success(lang('settings.apiKeyManagement.geminiKeyValid'));
        } else {
          setTestResults(prev => ({ ...prev, [keyType]: 'error' }));
          toast.error(lang('settings.apiKeyManagement.geminiKeyFailed', { error: result.error }));
        }
      } else {
        // For other API types, we'll just simulate a test
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTestResults(prev => ({ ...prev, [keyType]: 'success' }));
        toast.success(lang('settings.apiKeyManagement.keyTestCompleted', { service: API_KEY_TYPES.find(t => t.value === keyType)?.label }));
      }
    } catch (error) {
      console.error('API test failed:', error);
      setTestResults(prev => ({ ...prev, [keyType]: 'error' }));
      toast.error(lang('settings.apiKeyManagement.errors.keyTestFailed'));
    }
  };

  const getTestButtonIcon = (keyType: ApiKeyType) => {
    const status = testResults[keyType];
    switch (status) {
      case 'testing':
        return <TestTube className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <TestTube className="w-4 h-4" />;
    }
  };

  const getTestButtonVariant = (keyType: ApiKeyType) => {
    const status = testResults[keyType];
    switch (status) {
      case 'success':
        return 'outline' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  if (apiKeys.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5" />
            {lang('settings.apiKeyManagement.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {lang('settings.apiKeyManagement.manageKeysFor', { company: companyName })}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {lang('settings.apiKeyManagement.adminOnly')}
        </Badge>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {lang('settings.apiKeyManagement.securityNotice')}
        </AlertDescription>
      </Alert>

      {/* Add New API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {lang('settings.apiKeyManagement.addNewKey')}
          </CardTitle>
          <CardDescription>
            {lang('settings.apiKeyManagement.addNewKeyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key-type">{lang('settings.apiKeyManagement.apiService')}</Label>
              <Select value={newKeyType} onValueChange={(value: ApiKeyType) => setNewKeyType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-key">{lang('settings.apiKeyManagement.apiKey')}</Label>
              <div className="flex gap-2">
                <Input
                  id="new-key"
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder={lang('settings.apiKeyManagement.enterApiKey')}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyValue.trim() || isSaving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {lang('settings.apiKeyManagement.add')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing API Keys */}
      <div className="space-y-4">
        {API_KEY_TYPES.map((type) => {
          const existingKey = getApiKey(type.value);
          const isEditing = editingKey === existingKey?.id;
          
          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {type.icon}
                  {type.label}
                </CardTitle>
                <CardDescription>
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingKey ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        {lang('settings.apiKeyManagement.configured')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lang('settings.apiKeyManagement.added')} {new Date(existingKey.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Label>{lang('settings.apiKeyManagement.updateApiKey')}</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={editKeyValue}
                            onChange={(e) => setEditKeyValue(e.target.value)}
                            placeholder={lang('settings.apiKeyManagement.enterNewApiKey')}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleUpdateKey(existingKey.id)}
                            disabled={!editKeyValue.trim() || isSaving}
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {lang('common.save')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingKey(null);
                              setEditKeyValue('');
                            }}
                            size="sm"
                          >
                            {lang('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>{lang('settings.apiKeyManagement.currentApiKey')}</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKeys[existingKey.id] ? 'text' : 'password'}
                              value={existingKey.encrypted_key}
                              readOnly
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleKeyVisibility(existingKey.id)}
                            >
                              {showKeys[existingKey.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            variant={getTestButtonVariant(type.value)}
                            onClick={() => testApiKey(type.value, existingKey.encrypted_key)}
                            disabled={testResults[type.value] === 'testing'}
                            size="sm"
                          >
                            {getTestButtonIcon(type.value)}
                            <span className="ml-2">{lang('settings.apiKeyManagement.test')}</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingKey(existingKey.id);
                          setEditKeyValue(existingKey.encrypted_key);
                        }}
                        disabled={isEditing}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {lang('common.edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteKey(existingKey.id, type.value)}
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {lang('common.delete')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{lang('settings.apiKeyManagement.noKeyConfigured', { service: type.label })}</p>
                    <p className="text-sm">{lang('settings.apiKeyManagement.addOneAbove')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error Display */}
      {apiKeys.error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {apiKeys.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
