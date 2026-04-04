import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Download, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";

interface TraceabilitySettingsProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

interface SettingsState {
  linkTypes: Record<string, boolean>;
  automationRules: Record<string, boolean>;
}

const LINK_TYPE_KEYS = ['traces_to', 'verified_by', 'validated_by', 'controls_risk', 'implements', 'depends_on'] as const;
const AUTOMATION_KEYS = ['auto_link_tests', 'auto_link_risks', 'validate_circular', 'enforce_coverage'] as const;

const DEFAULT_SETTINGS: SettingsState = {
  linkTypes: { traces_to: true, verified_by: true, validated_by: true, controls_risk: true, implements: false, depends_on: false },
  automationRules: { auto_link_tests: true, auto_link_risks: true, validate_circular: true, enforce_coverage: false },
};

function loadSettings(productId: string): SettingsState {
  try {
    const raw = localStorage.getItem(`traceability-settings-${productId}`);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* fall through */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(productId: string, settings: SettingsState) {
  localStorage.setItem(`traceability-settings-${productId}`, JSON.stringify(settings));
}

export function TraceabilitySettings({ productId, companyId, disabled = false }: TraceabilitySettingsProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings(productId));

  const updateLinkType = useCallback((id: string, checked: boolean) => {
    setSettings(prev => {
      const next = { ...prev, linkTypes: { ...prev.linkTypes, [id]: checked } };
      saveSettings(productId, next);
      return next;
    });
  }, [productId]);

  const updateAutomationRule = useCallback((id: string, checked: boolean) => {
    setSettings(prev => {
      const next = { ...prev, automationRules: { ...prev.automationRules, [id]: checked } };
      saveSettings(productId, next);
      return next;
    });
  }, [productId]);

  const handleExportSettings = () => {
    if (disabled) return;
    toast.info(lang('traceability.settings.toastExportComingSoon'));
  };

  const handleImportSettings = () => {
    if (disabled) return;
    toast.info(lang('traceability.settings.toastImportComingSoon'));
  };

  const handleRefreshLinks = async () => {
    if (disabled) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] }),
      queryClient.invalidateQueries({ queryKey: ['traceability-visual'] }),
    ]);
    toast.success('Traceability data refreshed');
  };

  const linkTypeMeta = [
    { id: 'traces_to', label: lang('traceability.settings.linkType.tracesTo'), description: lang('traceability.settings.linkType.tracesToDesc') },
    { id: 'verified_by', label: lang('traceability.settings.linkType.verifiedBy'), description: lang('traceability.settings.linkType.verifiedByDesc') },
    { id: 'validated_by', label: lang('traceability.settings.linkType.validatedBy'), description: lang('traceability.settings.linkType.validatedByDesc') },
    { id: 'controls_risk', label: lang('traceability.settings.linkType.controlsRisk'), description: lang('traceability.settings.linkType.controlsRiskDesc') },
    { id: 'implements', label: lang('traceability.settings.linkType.implements'), description: lang('traceability.settings.linkType.implementsDesc') },
    { id: 'depends_on', label: lang('traceability.settings.linkType.dependsOn'), description: lang('traceability.settings.linkType.dependsOnDesc') },
  ];

  const automationMeta = [
    { id: 'auto_link_tests', label: lang('traceability.settings.automation.autoLinkTests'), description: lang('traceability.settings.automation.autoLinkTestsDesc') },
    { id: 'auto_link_risks', label: lang('traceability.settings.automation.autoLinkRisks'), description: lang('traceability.settings.automation.autoLinkRisksDesc') },
    { id: 'validate_circular', label: lang('traceability.settings.automation.validateCircular'), description: lang('traceability.settings.automation.validateCircularDesc') },
    { id: 'enforce_coverage', label: lang('traceability.settings.automation.enforceCoverage'), description: lang('traceability.settings.automation.enforceCoverageDesc') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{lang('traceability.settings.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('traceability.settings.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang('traceability.settings.linkTypes')}</CardTitle>
            <CardDescription>{lang('traceability.settings.linkTypesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkTypeMeta.map((lt) => {
              const enabled = settings.linkTypes[lt.id] ?? false;
              return (
                <div key={lt.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={lt.id}
                    checked={enabled}
                    disabled={disabled}
                    onCheckedChange={(checked) => updateLinkType(lt.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label htmlFor={lt.id} className="text-sm font-medium text-foreground">
                        {lt.label}
                      </label>
                      <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                        {enabled ? lang('traceability.settings.enabled') : lang('traceability.settings.disabled')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lt.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang('traceability.settings.automationRules')}</CardTitle>
            <CardDescription>{lang('traceability.settings.automationRulesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {automationMeta.map((rule) => {
              const enabled = settings.automationRules[rule.id] ?? false;
              return (
                <div key={rule.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={rule.id}
                    checked={enabled}
                    disabled={disabled}
                    onCheckedChange={(checked) => updateAutomationRule(rule.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label htmlFor={rule.id} className="text-sm font-medium text-foreground">
                        {rule.label}
                      </label>
                      <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                        {enabled ? lang('traceability.settings.active') : lang('traceability.settings.inactive')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('traceability.settings.matrixDisplayOptions')}</CardTitle>
          <CardDescription>{lang('traceability.settings.matrixDisplayOptionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.settings.defaultRowTypes')}</h4>
              <div className="space-y-2">
                <Badge variant="outline">{lang('traceability.settings.userNeedsUN')}</Badge>
                <Badge variant="outline">{lang('traceability.settings.systemRequirementsSR')}</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.settings.defaultColumnTypes')}</h4>
              <div className="space-y-2">
                <Badge variant="outline">{lang('traceability.settings.systemRequirementsSR')}</Badge>
                <Badge variant="outline">{lang('traceability.settings.softwareRequirementsSWR')}</Badge>
                <Badge variant="outline">{lang('traceability.settings.hardwareRequirementsHWR')}</Badge>
                <Badge variant="outline">{lang('traceability.settings.testCasesTC')}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('traceability.settings.maintenanceActions')}</CardTitle>
          <CardDescription>{lang('traceability.settings.maintenanceActionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={handleRefreshLinks} disabled={disabled}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {lang('traceability.settings.refreshAllLinks')}
            </Button>
            <Button variant="outline" onClick={handleExportSettings} disabled={disabled}>
              <Download className="h-4 w-4 mr-2" />
              {lang('traceability.settings.exportSettings')}
            </Button>
            <Button variant="outline" onClick={handleImportSettings} disabled={disabled}>
              <Upload className="h-4 w-4 mr-2" />
              {lang('traceability.settings.importSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('traceability.settings.standards')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.settings.regulatoryRequirements')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.settings.fda21CFR')}</li>
                <li>{lang('traceability.settings.iso13485')}</li>
                <li>{lang('traceability.settings.iec62304')}</li>
                <li>{lang('traceability.settings.iso14971')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.settings.bestPractices')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.settings.bidirectionalTraceability')}</li>
                <li>{lang('traceability.settings.completeCoverage')}</li>
                <li>{lang('traceability.settings.regularReviews')}</li>
                <li>{lang('traceability.settings.automatedValidation')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('traceability.settings.note')}</strong> {lang('traceability.settings.noteText')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
