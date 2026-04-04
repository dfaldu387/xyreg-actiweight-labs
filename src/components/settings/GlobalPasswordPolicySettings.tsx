import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

export function GlobalPasswordPolicySettings() {
  const { lang } = useTranslation();
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [globalDays, setGlobalDays] = useState('90');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('description')
        .eq('is_archived', false)
        .limit(1);

      if (companies && companies.length > 0 && companies[0].description) {
        try {
          const parsed = JSON.parse(companies[0].description);
          if (parsed.passwordPolicy) {
            setGlobalEnabled(parsed.passwordPolicy.enabled === true);
            setGlobalDays(String(parsed.passwordPolicy.expirationDays || 90));
          }
        } catch {
          // ignore
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const handleApplyToAllUsers = async () => {
    setIsSaving(true);
    try {
      const { data: allCompanies, error: fetchError } = await supabase
        .from('companies')
        .select('id, description')
        .eq('is_archived', false);

      if (fetchError) throw fetchError;

      const policyData = {
        enabled: globalEnabled,
        expirationDays: parseInt(globalDays, 10),
      };

      const total = allCompanies?.length || 0;
      setProgress({ current: 0, total });
      let successCount = 0;

      for (let i = 0; i < (allCompanies || []).length; i++) {
        const company = allCompanies![i];
        let existingOrgData: Record<string, any> = {};
        if (company.description) {
          try {
            existingOrgData = JSON.parse(company.description);
          } catch {
            existingOrgData = {};
          }
        }

        const { error: updateError } = await supabase
          .from('companies')
          .update({
            description: JSON.stringify({
              ...existingOrgData,
              passwordPolicy: policyData,
            }),
          })
          .eq('id', company.id);

        if (!updateError) successCount++;
        setProgress({ current: i + 1, total });
      }

      toast.success(
        globalEnabled
          ? `Password expiration (${globalDays} days) enforced for all users`
          : 'Password expiration disabled for all users'
      );
    } catch (err: any) {
      console.error('Failed to apply password policy:', err);
      toast.error(err.message || 'Failed to apply password policy');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '320px' }}>
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">
          {lang('settings.administration.passwordPolicy.title')}
          <Badge variant="outline" className="ml-2 text-xs font-normal align-middle">
            21 CFR Part 11
          </Badge>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enforce password expiration for all platform users. Required for regulatory compliance.
        </p>
      </div>

      <div className="flex items-center justify-between py-3 px-3 border rounded-md">
        <Label htmlFor="global-password-expiration-toggle" className="text-sm font-medium">
          {lang('settings.administration.passwordPolicy.enable')}
        </Label>
        <Switch
          id="global-password-expiration-toggle"
          checked={globalEnabled}
          onCheckedChange={setGlobalEnabled}
        />
      </div>

      {globalEnabled && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Password must be changed every:</Label>
          <Select value={globalDays} onValueChange={setGlobalDays}>
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
          {globalDays === '90' && (
            <Badge variant="secondary" className="text-xs">
              {lang('settings.administration.passwordPolicy.recommended')}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p>Users with expired passwords will be blocked and forced to create a new password on login.</p>
          <p>Google OAuth users are automatically exempt. Super admins are always exempt.</p>
        </div>
      </div>

      <Button
        onClick={handleApplyToAllUsers}
        disabled={isSaving}
        size="sm"
      >
        {isSaving
          ? `Applying... ${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%`
          : 'Apply to All Users'}
      </Button>
    </div>
  );
}
