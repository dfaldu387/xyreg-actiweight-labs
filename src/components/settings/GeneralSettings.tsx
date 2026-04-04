
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileTab } from "./tabs/CompanyProfileTab";

import { SystemConfigTab } from "./tabs/SystemConfigTab";
import { AdministrationTab } from "./tabs/AdministrationTab";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useTranslation } from "@/hooks/useTranslation";


interface GeneralSettingsProps {
  companyId: string;
  companyName: string;
}

const VALID_SUBMENUS = ['profile', 'system', 'admin'] as const;
const DEFAULT_SUBMENU = 'profile';

export function GeneralSettings({ companyId, companyName }: GeneralSettingsProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auth context and role context
  const { user } = useAuth();
  const { activeRole } = useCompanyRole();

  // Get submenu from URL parameter, memoized to prevent unnecessary recalculations
  const submenuFromUrl = useMemo(() => {
    const submenuParam = searchParams.get('submenu');
    if (submenuParam && VALID_SUBMENUS.includes(submenuParam as typeof VALID_SUBMENUS[number])) {
      return submenuParam as typeof VALID_SUBMENUS[number];
    }
    return DEFAULT_SUBMENU;
  }, [searchParams]);

  // Update URL when submenu changes, using useCallback to prevent unnecessary re-renders
  const handleSubmenuChange = useCallback((value: string) => {
    // Only update if value is valid and different from current
    if (!VALID_SUBMENUS.includes(value as typeof VALID_SUBMENUS[number])) {
      return;
    }

    const currentSubmenu = searchParams.get('submenu');
    // Only update URL if the value actually changed
    if (currentSubmenu !== value) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('submenu', value);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (error) {
          console.error('[GeneralSettings] Error fetching company:', error);
          toast.error(lang('settings.general.errors.failedToLoadCompany'));
          return;
        }

        setCompany(data);
      } catch (error) {
        console.error('[GeneralSettings] Error in fetchCompanyData:', error);
        toast.error(lang('settings.general.errors.errorLoadingCompany'));
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const handleSave = async (section: string) => {
    if (!company) return;

    setIsSaving(true);
    try {
      

      const { error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', companyId);

      if (error) {
        console.error('[GeneralSettings] Error saving company:', error);
        toast.error(lang('settings.general.errors.failedToSave', { section }));
        return;
      }

      toast.success(lang('settings.general.savedSuccessfully', { section }));
    } catch (error) {
      console.error('[GeneralSettings] Error in handleSave:', error);
      toast.error(lang('settings.general.errors.errorSaving', { section }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setCompany((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('settings.general.loadingSettings')}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">{lang('settings.general.companyNotFound')}</h3>
          <p className="text-muted-foreground">{lang('settings.general.unableToLoadCompany')}</p>
        </div>
      </div>
    );
  }

  // Check if user has admin privileges for the Administration tab
  const isAdmin = hasAdminPrivileges(activeRole);

  return (
    <div className="space-y-6">
      <Tabs value={submenuFromUrl} onValueChange={handleSubmenuChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">{lang('settings.general.tabs.companyProfile')}</TabsTrigger>
          <TabsTrigger value="system">{lang('settings.general.tabs.systemConfiguration')}</TabsTrigger>
          <TabsTrigger value="admin" disabled={!isAdmin}>
            {lang('settings.general.tabs.administration')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <CompanyProfileTab
            company={company}
            companyId={companyId}
            companyName={companyName}
            isSaving={isSaving}
            onInputChange={handleInputChange}
            onSave={handleSave}
          />
        </TabsContent>
        
        <TabsContent value="system" className="space-y-6">
          <SystemConfigTab companyId={companyId} companyName={companyName} />
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-6">
          <AdministrationTab companyId={companyId} companyName={companyName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
