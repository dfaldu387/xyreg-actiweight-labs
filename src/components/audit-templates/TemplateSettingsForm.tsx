
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { TemplateSettingsGroup } from "@/types/templateSettings";
import { useTranslation } from "@/hooks/useTranslation";

interface TemplateSettingsFormProps {
  companyId: string;
}

export function TemplateSettingsForm({ companyId }: TemplateSettingsFormProps) {
  const { lang } = useTranslation();
  const { settings, updateSetting, isLoading, saveSettings } = useTemplateSettings(companyId);
  const [hasChanges, setHasChanges] = useState(false);

  const settingsGroups: TemplateSettingsGroup[] = [
    {
      category: "defaults",
      title: lang('companySettings.auditTemplates.settings.defaults.title'),
      description: lang('companySettings.auditTemplates.settings.defaults.description'),
      settings: [
        {
          key: "default_duration",
          label: lang('companySettings.auditTemplates.settings.defaults.defaultDuration'),
          description: lang('companySettings.auditTemplates.settings.defaults.defaultDurationDesc'),
          type: "string",
          category: "defaults",
          defaultValue: "2-3 days"
        },
        {
          key: "default_auditor_type",
          label: lang('companySettings.auditTemplates.settings.defaults.defaultAuditorType'),
          description: lang('companySettings.auditTemplates.settings.defaults.defaultAuditorTypeDesc'),
          type: "select",
          category: "defaults",
          defaultValue: "Internal",
          options: [
            { value: "Internal", label: lang('companySettings.auditTemplates.settings.auditorTypes.internal') },
            { value: "External", label: lang('companySettings.auditTemplates.settings.auditorTypes.external') },
            { value: "Both", label: lang('companySettings.auditTemplates.settings.auditorTypes.both') }
          ]
        },
        {
          key: "auto_assign_lifecycle_phase",
          label: lang('companySettings.auditTemplates.settings.defaults.autoAssignLifecycle'),
          description: lang('companySettings.auditTemplates.settings.defaults.autoAssignLifecycleDesc'),
          type: "boolean",
          category: "defaults",
          defaultValue: true
        }
      ]
    },
    {
      category: "notifications",
      title: lang('companySettings.auditTemplates.settings.notifications.title'),
      description: lang('companySettings.auditTemplates.settings.notifications.description'),
      settings: [
        {
          key: "notify_template_assignment",
          label: lang('companySettings.auditTemplates.settings.notifications.templateAssignment'),
          description: lang('companySettings.auditTemplates.settings.notifications.templateAssignmentDesc'),
          type: "boolean",
          category: "notifications",
          defaultValue: true
        },
        {
          key: "reminder_days_before_audit",
          label: lang('companySettings.auditTemplates.settings.notifications.reminderDays'),
          description: lang('companySettings.auditTemplates.settings.notifications.reminderDaysDesc'),
          type: "number",
          category: "notifications",
          defaultValue: 7,
          validation: { min: 1, max: 30 }
        },
        {
          key: "escalation_enabled",
          label: lang('companySettings.auditTemplates.settings.notifications.enableEscalation'),
          description: lang('companySettings.auditTemplates.settings.notifications.enableEscalationDesc'),
          type: "boolean",
          category: "notifications",
          defaultValue: false
        }
      ]
    },
    {
      category: "workflows",
      title: lang('companySettings.auditTemplates.settings.workflows.title'),
      description: lang('companySettings.auditTemplates.settings.workflows.description'),
      settings: [
        {
          key: "require_approval",
          label: lang('companySettings.auditTemplates.settings.workflows.requireApproval'),
          description: lang('companySettings.auditTemplates.settings.workflows.requireApprovalDesc'),
          type: "boolean",
          category: "workflows",
          defaultValue: false
        },
        {
          key: "auto_create_from_standard",
          label: lang('companySettings.auditTemplates.settings.workflows.autoCreate'),
          description: lang('companySettings.auditTemplates.settings.workflows.autoCreateDesc'),
          type: "boolean",
          category: "workflows",
          defaultValue: true
        },
        {
          key: "template_versioning",
          label: lang('companySettings.auditTemplates.settings.workflows.versioning'),
          description: lang('companySettings.auditTemplates.settings.workflows.versioningDesc'),
          type: "boolean",
          category: "workflows",
          defaultValue: false
        }
      ]
    },
    {
      category: "rules",
      title: lang('companySettings.auditTemplates.settings.rules.title'),
      description: lang('companySettings.auditTemplates.settings.rules.description'),
      settings: [
        {
          key: "max_audits_per_phase",
          label: lang('companySettings.auditTemplates.settings.rules.maxAuditsPerPhase'),
          description: lang('companySettings.auditTemplates.settings.rules.maxAuditsPerPhaseDesc'),
          type: "number",
          category: "rules",
          defaultValue: 5,
          validation: { min: 1, max: 20 }
        },
        {
          key: "mandatory_audit_types",
          label: lang('companySettings.auditTemplates.settings.rules.mandatoryAuditTypes'),
          description: lang('companySettings.auditTemplates.settings.rules.mandatoryAuditTypesDesc'),
          type: "multiselect",
          category: "rules",
          defaultValue: [],
          options: [
            { value: "Design Review", label: lang('companySettings.auditTemplates.settings.auditTypes.designReview') },
            { value: "Risk Management", label: lang('companySettings.auditTemplates.settings.auditTypes.riskManagement') },
            { value: "Clinical Evaluation", label: lang('companySettings.auditTemplates.settings.auditTypes.clinicalEvaluation') },
            { value: "Quality System", label: lang('companySettings.auditTemplates.settings.auditTypes.qualitySystem') }
          ]
        },
        {
          key: "restrict_external_auditors",
          label: lang('companySettings.auditTemplates.settings.rules.restrictExternal'),
          description: lang('companySettings.auditTemplates.settings.rules.restrictExternalDesc'),
          type: "boolean",
          category: "rules",
          defaultValue: false
        }
      ]
    },
    {
      category: "digital_templates",
      title: lang('companySettings.auditTemplates.settings.digitalTemplates.title'),
      description: lang('companySettings.auditTemplates.settings.digitalTemplates.description'),
      settings: [
        {
          key: "enable_design_review_template",
          label: lang('companySettings.auditTemplates.settings.digitalTemplates.enableDesignReview'),
          description: lang('companySettings.auditTemplates.settings.digitalTemplates.enableDesignReviewDesc'),
          type: "boolean",
          category: "digital_templates",
          defaultValue: false
        },
        {
          key: "auto_populate_phase_content",
          label: lang('companySettings.auditTemplates.settings.digitalTemplates.autoPopulate'),
          description: lang('companySettings.auditTemplates.settings.digitalTemplates.autoPopulateDesc'),
          type: "boolean",
          category: "digital_templates",
          defaultValue: true
        },
        {
          key: "allow_template_customization",
          label: lang('companySettings.auditTemplates.settings.digitalTemplates.allowCustomization'),
          description: lang('companySettings.auditTemplates.settings.digitalTemplates.allowCustomizationDesc'),
          type: "boolean",
          category: "digital_templates",
          defaultValue: true
        },
        {
          key: "digital_template_approval",
          label: lang('companySettings.auditTemplates.settings.digitalTemplates.requireApproval'),
          description: lang('companySettings.auditTemplates.settings.digitalTemplates.requireApprovalDesc'),
          type: "boolean",
          category: "digital_templates",
          defaultValue: false
        }
      ]
    }
  ];

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key, value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveSettings();
      setHasChanges(false);
      toast.success(lang('companySettings.auditTemplates.settingsSavedSuccess'));
    } catch (error) {
      toast.error(lang('companySettings.auditTemplates.failedToSaveSettings'));
    }
  };

  const handleReset = () => {
    // Reset to default values
    settingsGroups.forEach(group => {
      group.settings.forEach(setting => {
        updateSetting(setting.key, setting.defaultValue);
      });
    });
    setHasChanges(true);
    toast.info(lang('companySettings.auditTemplates.settingsResetToDefaults'));
  };

  const renderSettingField = (setting: any) => {
    const value = settings[setting.key] ?? setting.defaultValue;

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
            />
            <Label>{value ? lang('companySettings.auditTemplates.enabled') : lang('companySettings.auditTemplates.disabled')}</Label>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
            min={setting.validation?.min}
            max={setting.validation?.max}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={(newValue) => handleSettingChange(setting.key, newValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "string":
        return (
          <Input
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
          />
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {setting.options?.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Switch
                  checked={value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValue = checked 
                      ? [...value, option.value]
                      : value.filter((v: string) => v !== option.value);
                    handleSettingChange(setting.key, newValue);
                  }}
                />
                <Label>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return <Input value={value} onChange={(e) => handleSettingChange(setting.key, e.target.value)} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{lang('companySettings.auditTemplates.loadingSettings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{lang('companySettings.auditTemplates.configurationSettings')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('companySettings.auditTemplates.configurationSettingsDesc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {lang('companySettings.auditTemplates.resetToDefaults')}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {lang('companySettings.auditTemplates.saveSettings')}
          </Button>
        </div>
      </div>

      {settingsGroups.map((group, groupIndex) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {group.settings.map((setting, settingIndex) => (
              <div key={setting.key} className="space-y-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
                {renderSettingField(setting)}
                {settingIndex < group.settings.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
