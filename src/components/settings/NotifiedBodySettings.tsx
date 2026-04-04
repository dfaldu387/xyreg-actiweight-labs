import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building, HelpCircle, SaveIcon } from "lucide-react";
import { NotifiedBody } from "@/types/notifiedBody";
import { NotifiedBodySearchDropdown } from "./NotifiedBodySearchDropdown";
import { NotifiedBodyDisplay } from "./NotifiedBodyDisplay";
import { NotifiedBodyDiscoveryTool } from "./NotifiedBodyDiscoveryTool";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface NotifiedBodySettingsProps {
  companyId: string;
  companyName: string;
  initialNotifiedBody?: NotifiedBody;
}

export function NotifiedBodySettings({
  companyId,
  companyName,
  initialNotifiedBody
}: NotifiedBodySettingsProps) {
  const { lang } = useTranslation();
  // Notified Body selection state
  const [hasNotifiedBodyAnswer, setHasNotifiedBodyAnswer] = useState<boolean | null>(null);
  const [selectedNotifiedBody, setSelectedNotifiedBody] = useState<NotifiedBody | undefined>(
    initialNotifiedBody
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing notified body data
  useEffect(() => {
    const loadNotifiedBody = async () => {
      try {
        // Get company's notified body reference
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('notified_body_id')
          .eq('id', companyId)
          .single();

        if (companyError) {
          console.error('Error loading company data:', companyError);
          return;
        }

        if (companyData?.notified_body_id) {
          // Load the actual notified body data
          const { data: notifiedBodyData, error: nbError } = await supabase
            .from('notified_bodies')
            .select('*')
            .eq('id', companyData.notified_body_id)
            .single();

          if (nbError) {
            console.error('Error loading notified body data:', nbError);
            return;
          }

          if (notifiedBodyData) {
            // Map database fields to NotifiedBody interface
            const mappedNotifiedBody: NotifiedBody = {
              id: notifiedBodyData.id,
              name: notifiedBodyData.name,
              nb_number: notifiedBodyData.nb_number,
              scope: {
                mdr: notifiedBodyData.scope_mdr || false,
                ivdr: notifiedBodyData.scope_ivdr || false,
                highRiskActiveImplantables: notifiedBodyData.scope_high_risk_active_implantables || false,
                highRiskImplantsNonActive: notifiedBodyData.scope_high_risk_implants_non_active || false,
                medicalSoftware: notifiedBodyData.scope_medical_software || false,
                sterilizationMethods: notifiedBodyData.scope_sterilization_methods || false,
                drugDeviceCombinations: notifiedBodyData.scope_drug_device_combinations || false,
              },
              address: notifiedBodyData.address,
              contactNumber: notifiedBodyData.contact_number,
              email: notifiedBodyData.email,
              website: notifiedBodyData.website,
              country: notifiedBodyData.country,
              source: (notifiedBodyData.data_source === 'manual_entry' || notifiedBodyData.data_source === 'custom_import') ? 'manual' : 'database',
              data_source: notifiedBodyData.data_source as 'official_eu_nando' | 'manual_entry' | 'custom_import',
            };
            setSelectedNotifiedBody(mappedNotifiedBody);
            setHasNotifiedBodyAnswer(true);
          }
        }
      } catch (error) {
        console.error('Error in loadNotifiedBody:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      loadNotifiedBody();
    } else {
      setIsLoading(false);
    }
  }, [companyId]);

  const handleNotifiedBodyAnswer = (hasOne: boolean) => {
    setHasNotifiedBodyAnswer(hasOne);
    if (!hasOne) {
      setSelectedNotifiedBody(undefined);
    }
  };

  const handleNotifiedBodySelect = (notifiedBody: NotifiedBody) => {
    setSelectedNotifiedBody(notifiedBody);
  };

  const handleDiscoveryToolSelect = (notifiedBody: NotifiedBody) => {
    setSelectedNotifiedBody(notifiedBody);
    // Switch back to "Yes, I have one" mode since they've now selected one
    setHasNotifiedBodyAnswer(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update company notified body in database
      const { error } = await supabase
        .from('companies')
        .update({ 
          notified_body_id: selectedNotifiedBody?.id || null 
        })
        .eq('id', companyId);

      if (error) {
        console.error("Failed to update notified body settings:", error);
        toast.error(lang('settings.notifiedBody.updateError'));
        return;
      }

      toast.success(lang('settings.notifiedBody.updateSuccess'));
    } catch (error) {
      console.error("Failed to update notified body settings:", error);
      toast.error(lang('settings.notifiedBody.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">{lang('settings.notifiedBody.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium">{lang('settings.notifiedBody.label')}</Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {lang('settings.notifiedBody.question')}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={hasNotifiedBodyAnswer === true ? "default" : "outline"}
                onClick={() => handleNotifiedBodyAnswer(true)}
                className="min-w-[140px]"
              >
                {lang('settings.notifiedBody.yesHaveOne')}
              </Button>
              <Button
                type="button"
                variant={hasNotifiedBodyAnswer === false ? "default" : "outline"}
                onClick={() => handleNotifiedBodyAnswer(false)}
                className="min-w-[180px]"
              >
                {lang('settings.notifiedBody.noNeedHelp')}
              </Button>
            </div>
          </div>

          {hasNotifiedBodyAnswer === true && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{lang('settings.notifiedBody.selectLabel')}</Label>
                <NotifiedBodySearchDropdown
                  value={selectedNotifiedBody}
                  onSelect={handleNotifiedBodySelect}
                  placeholder={lang('settings.notifiedBody.searchPlaceholder')}
                />
              </div>

              {selectedNotifiedBody && (
                <div className="space-y-2">
                  <Label>{lang('settings.notifiedBody.selectedLabel')}</Label>
                  <NotifiedBodyDisplay notifiedBody={selectedNotifiedBody} />
                </div>
              )}
            </div>
          )}

          {hasNotifiedBodyAnswer === false && (
            <div className="space-y-4">
              <NotifiedBodyDiscoveryTool onSelect={handleDiscoveryToolSelect} />
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full md:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? lang('common.saving') : (
          <>
            <SaveIcon className="mr-2 h-4 w-4" /> {lang('settings.notifiedBody.saveButton')}
          </>
        )}
      </Button>
    </form>
  );
}
