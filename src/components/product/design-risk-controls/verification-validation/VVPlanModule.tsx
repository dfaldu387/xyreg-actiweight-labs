import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Sparkles, Users, FileEdit, Pencil } from "lucide-react";
import { vvService, type VVPlan } from "@/services/vvService";
import { useTranslation } from "@/hooks/useTranslation";
import type { VVPlanInitialData } from "./CreateVVPlanSheet";
import { VVPlanDetailSheet } from "./VVPlanDetailSheet";
import { AIVVPlanSuggestionsDialog } from "./AIVVPlanSuggestionsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CompactScopeToggle from "@/components/product/shared/CompactScopeToggle";
import { SaveContentAsDocCIDialog } from "@/components/shared/SaveContentAsDocCIDialog";
import { VVPlanStudioBridgeService } from "@/services/vvPlanStudioBridgeService";
import { toast } from "sonner";

function generateVVPlanHtml(plan: VVPlan): string {
  let html = `<h1>${plan.name} v${plan.version}</h1>`;
  if (plan.description) html += `<p>${plan.description}</p>`;
  if (plan.scope) html += `<h2>1. Scope &amp; Boundaries</h2><p>${plan.scope}</p>`;
  if (plan.methodology) html += `<h2>2. Methodology</h2><p>${plan.methodology}</p>`;
  if (plan.acceptance_criteria) html += `<h2>3. Acceptance Criteria</h2><p>${plan.acceptance_criteria}</p>`;
  const roles = plan.roles_responsibilities;
  const hasRoles = roles && typeof roles === 'object' && (Array.isArray(roles) ? roles.length > 0 : Object.keys(roles).length > 0);
  if (hasRoles) {
    html += `<h2>4. Roles &amp; Responsibilities</h2><table><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>`;
    if (Array.isArray(roles)) {
      (roles as Array<{ role: string; responsibility: string }>).forEach((r) => {
        html += `<tr><td>${r.role}</td><td>${r.responsibility}</td></tr>`;
      });
    } else {
      Object.entries(roles).forEach(([role, responsibility]) => {
        html += `<tr><td>${role}</td><td>${String(responsibility)}</td></tr>`;
      });
    }
    html += `</tbody></table>`;
  }
  return html;
}

interface VVPlanModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function VVPlanModule({ productId, companyId, disabled = false }: VVPlanModuleProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { user } = useAuth();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VVPlan | null>(null);
  const [scopeViewOverride, setScopeViewOverride] = useState<'individual' | 'product_family' | null>(null);
  const [ciExportPlan, setCiExportPlan] = useState<VVPlan | null>(null);

  const { data: company } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch product to get basic_udi_di
  const { data: product } = useQuery({
    queryKey: ['product-basic-udi', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, basic_udi_di')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const familyIdentifier = product?.basic_udi_di || null;
  const canShowFamily = !!familyIdentifier;
  const scopeView = scopeViewOverride ?? (canShowFamily ? 'product_family' : 'individual');

  const { data: vvPlans, isLoading } = useQuery({
    queryKey: ['vv-plans', companyId, productId, scopeView, familyIdentifier],
    queryFn: () => {
      if (scopeView === 'product_family' && familyIdentifier) {
        return vvService.getVVPlansByFamily(companyId, familyIdentifier);
      }
      return vvService.getVVPlans(companyId, productId);
    },
  });

  const navigateToStudio = async (plan: VVPlan) => {
    if (!company?.name) return;
    try {
      await VVPlanStudioBridgeService.upsertTemplate(plan, companyId, productId);
      const encodedCompanyName = encodeURIComponent(company.name);
      navigate(`/app/company/${encodedCompanyName}/document-studio?templateId=VV-PLAN-${plan.id}&productId=${productId}`);
    } catch (error) {
      console.error('Error opening in studio:', error);
      toast.error('Failed to open in Document Studio');
    }
  };

  const handleCreatePlan = async () => {
    if (disabled || !company?.name) return;
    try {
      const newPlan = await vvService.createVVPlan({
        company_id: companyId,
        product_id: productId,
        name: 'V&V Master Plan v1.0',
        version: '1.0',
        status: 'draft',
        scope: '',
        methodology: '',
        acceptance_criteria: '',
        roles_responsibilities: {},
        created_by: user!.id,
        scope_type: scopeView,
        family_identifier: scopeView === 'product_family' ? familyIdentifier || undefined : undefined,
      });
      toast.success('V&V Plan created');
      await navigateToStudio(newPlan);
    } catch (error) {
      console.error('Error creating V&V plan:', error);
      toast.error('Failed to create V&V Plan');
    }
  };

  const handleEditPlan = async (plan: VVPlan) => {
    if (disabled) return;
    await navigateToStudio(plan);
  };

  const handleAIAccept = async (data: VVPlanInitialData) => {
    if (!company?.name) return;
    try {
      const newPlan = await vvService.createVVPlan({
        company_id: companyId,
        product_id: productId,
        name: data.name || 'V&V Master Plan v1.0',
        version: data.version || '1.0',
        status: 'draft',
        description: data.description,
        scope: data.scope,
        methodology: Array.isArray(data.methodology) ? data.methodology.join(', ') : (data.methodology || ''),
        acceptance_criteria: data.acceptance_criteria,
        roles_responsibilities: data.roles || {},
        created_by: user!.id,
        scope_type: data.scope_type || scopeView,
        family_identifier: scopeView === 'product_family' ? familyIdentifier || undefined : undefined,
      });
      toast.success('V&V Plan created from AI suggestions');
      await navigateToStudio(newPlan);
    } catch (error) {
      console.error('Error creating V&V plan from AI:', error);
      toast.error('Failed to create V&V Plan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default';
      case 'draft': return 'secondary';
      case 'under_review': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{lang('verificationValidation.vvPlan.title')}</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            {lang('verificationValidation.vvPlan.createPlan')}
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{lang('verificationValidation.vvPlan.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('verificationValidation.vvPlan.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAISuggestions(true)} disabled={disabled}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
          <Button onClick={handleCreatePlan} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('verificationValidation.vvPlan.createPlan')}
          </Button>
        </div>
      </div>

      {/* Scope Mode Selector */}
      {canShowFamily && (
        <CompactScopeToggle
            scopeView={scopeView}
            onScopeChange={(scope) => setScopeViewOverride(scope)}
            familyIdentifier={familyIdentifier}
            showInfoBanner
            infoBannerText={`Plans in this view are shared across all variants with Basic UDI-DI: ${familyIdentifier}`}
          />
      )}

      {!vvPlans || vvPlans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">{lang('verificationValidation.vvPlan.noPlansCreated')}</h4>
            <p className="text-muted-foreground">
              {lang('verificationValidation.vvPlan.emptyStateDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vvPlans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.scope_type === 'product_family' && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        Family
                      </Badge>
                    )}
                    <Badge variant={getStatusColor(plan.status)} className="gap-1">
                      {getStatusIcon(plan.status)}
                      {plan.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{lang('verificationValidation.vvPlan.labels.version')}:</span>
                    <span className="text-muted-foreground ml-2">{plan.version}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{lang('verificationValidation.vvPlan.labels.created')}:</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {plan.scope && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">{lang('verificationValidation.vvPlan.labels.scope')}:</span>
                      <p className="text-muted-foreground mt-1">{plan.scope}</p>
                    </div>
                  )}
                  {plan.methodology && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">{lang('verificationValidation.vvPlan.labels.methodology')}:</span>
                      <p className="text-muted-foreground mt-1">{plan.methodology}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={disabled} onClick={() => setSelectedPlan(plan)}>
                    <FileText className="h-4 w-4 mr-2" />
                    {lang('verificationValidation.vvPlan.viewDetails')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={disabled} onClick={() => handleEditPlan(plan)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {lang('verificationValidation.vvPlan.editPlan')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={disabled} onClick={() => setCiExportPlan(plan)}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Send to CI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('verificationValidation.vvPlan.guidelines.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.vvPlan.guidelines.verificationFocus')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {lang('verificationValidation.vvPlan.guidelines.componentUnitTesting')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.integrationTesting')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.systemLevelVerification')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.requirementsTraceability')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.vvPlan.guidelines.validationFocus')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {lang('verificationValidation.vvPlan.guidelines.userNeedsFulfillment')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.clinicalEvaluation')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.usabilityTesting')}</li>
                <li>• {lang('verificationValidation.vvPlan.guidelines.realWorldPerformance')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('verificationValidation.vvPlan.guidelines.noteLabel')}:</strong> {lang('verificationValidation.vvPlan.guidelines.noteText')}
            </p>
          </div>
        </CardContent>
      </Card>


      {selectedPlan && (
        <VVPlanDetailSheet
          open={!!selectedPlan}
          onOpenChange={(open) => { if (!open) setSelectedPlan(null); }}
          plan={selectedPlan}
          productId={productId}
          companyId={companyId}
          companyName={company?.name || ''}
          onEdit={handleEditPlan}
        />
      )}

      <AIVVPlanSuggestionsDialog
        open={showAISuggestions}
        onOpenChange={setShowAISuggestions}
        productId={productId}
        companyId={companyId}
        onAccept={handleAIAccept}
        scopeType={scopeView}
        familyIdentifier={familyIdentifier}
      />

      {/* Send to CI from card-level action */}
      {ciExportPlan && company?.name && (
        <SaveContentAsDocCIDialog
          open={!!ciExportPlan}
          onOpenChange={(open) => { if (!open) setCiExportPlan(null); }}
          title={`V&V Plan: ${ciExportPlan.name}`}
          htmlContent={generateVVPlanHtml(ciExportPlan)}
          templateIdKey={`VV-PLAN-${ciExportPlan.id}`}
          companyId={companyId}
          companyName={company.name}
          productId={productId}
          defaultScope="device"
        />
      )}
    </div>
  );
}
