import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { CompanyDataUpdateService } from '@/services/companyDataUpdateService';
import { PasswordExpirationService, type PasswordPolicy } from '@/services/passwordExpirationService';

interface PasswordPolicySettingsProps {
  companyId: string;
}

export function PasswordPolicySettings({ companyId }: PasswordPolicySettingsProps) {
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [expirationDays, setExpirationDays] = useState('90');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load existing policy on mount
  useEffect(() => {
    const loadPolicy = async () => {
      const policy = await PasswordExpirationService.getCompanyPasswordPolicy(companyId);
      setEnabled(policy.enabled);
      setExpirationDays(String(policy.expirationDays));
      setIsLoaded(true);
    };
    loadPolicy();
  }, [companyId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'password_policy',
        data: {
          enabled,
          expirationDays: parseInt(expirationDays, 10),
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(lang('settings.administration.passwordPolicy.saved'));
    } catch (err: any) {
      console.error('Failed to save password policy:', err);
      toast.error(err.message || 'Failed to save password policy');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {lang('settings.administration.passwordPolicy.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.administration.passwordPolicy.description')}
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="password-expiration-toggle" className="text-sm font-medium">
                {lang('settings.administration.passwordPolicy.enable')}
              </Label>
              <Switch
                id="password-expiration-toggle"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {/* Expiration days selection */}
            {enabled && (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Password must be changed every:</Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="120">120 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="360">360 days</SelectItem>
                  </SelectContent>
                </Select>
                {expirationDays === '90' && (
                  <Badge variant="secondary" className="text-xs">
                    {lang('settings.administration.passwordPolicy.recommended')}
                  </Badge>
                )}

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    If a user belongs to multiple companies, the strictest (shortest) policy applies.
                  </p>
                </div>
              </div>
            )}

            {/* Save button */}
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? 'Saving...' : lang('common.save')}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
