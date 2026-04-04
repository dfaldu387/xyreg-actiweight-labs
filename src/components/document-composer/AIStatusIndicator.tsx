import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Zap,
  Loader2
} from 'lucide-react';
import { useCompanyApiKeys } from '@/hooks/useCompanyApiKeys';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AIStatusIndicatorProps {
  className?: string;
}

export function AIStatusIndicator({ className = "" }: AIStatusIndicatorProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { apiKeys, getApiKey } = useCompanyApiKeys(activeCompanyRole?.companyId || '');
  const { lang } = useTranslation();

  const hasOpenAIKey = !!getApiKey('openai');
  const hasAnthropicKey = !!getApiKey('anthropic');
  const hasGeminiKey = !!getApiKey('gemini');
  const hasAnyAIKey = hasOpenAIKey || hasAnthropicKey || hasGeminiKey;

  if (apiKeys.isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground px-1 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">{lang('aiStatus.checkingStatus')}</span>
      </div>
    );
  }

  if (hasAnyAIKey) {
    return (
      <div className={`flex items-center justify-between px-1 ${className}`}>
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-emerald-600" />
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0">
            <Zap className="w-2.5 h-2.5 mr-1" />
            AI Active
          </Badge>
        </div>
      </div>
    );
  }

  // No AI keys — show a subtle, helpful hint (not alarming)
  return (
    <div className={`flex items-center justify-between px-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">AI features available</span>
      </div>
      <span className="text-[10px] text-muted-foreground/60 italic">Contact admin to enable</span>
    </div>
  );
}
