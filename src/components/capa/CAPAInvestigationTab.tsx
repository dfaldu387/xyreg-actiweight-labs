import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAPARecord, RCAMethodology, RootCauseCategory } from '@/types/capa';
import { ProblemComplexity } from '@/types/rcaData';
import { useUpdateCAPA } from '@/hooks/useCAPAData';
import { RCAToolsPanel } from './rca/RCAToolsPanel';
import { RCAMethodSelector } from './rca/RCAMethodSelector';
import { Edit, Save, X, Search, CheckCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAInvestigationTabProps {
  capa: CAPARecord;
}

const ROOT_CAUSE_CATEGORY_LABELS: Record<RootCauseCategory, string> = {
  process: 'Process',
  human_error: 'Human Error',
  material: 'Material',
  design: 'Design',
  equipment: 'Equipment',
  environment: 'Environment',
};

export function CAPAInvestigationTab({ capa }: CAPAInvestigationTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateCAPA();
  const { lang } = useTranslation();

  // Support both legacy single methodology and new array format
  const getInitialMethodologies = (): RCAMethodology[] => {
    if (capa.rca_methodologies && capa.rca_methodologies.length > 0) {
      return capa.rca_methodologies;
    }
    if (capa.rca_methodology) {
      return [capa.rca_methodology];
    }
    return [];
  };

  const [formData, setFormData] = useState({
    problem_complexity: (capa.problem_complexity as ProblemComplexity) || null,
    rca_methodologies: getInitialMethodologies(),
    rca_override_reason: capa.rca_override_reason || '',
    root_cause_category: capa.root_cause_category || '',
    root_cause_summary: capa.root_cause_summary || '',
    voe_plan: capa.voe_plan || '',
    voe_success_criteria: capa.voe_success_criteria || '',
    voe_result: capa.voe_result || '',
  });

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: capa.id,
      updates: {
        problem_complexity: formData.problem_complexity,
        // Save both for backward compatibility
        rca_methodology: formData.rca_methodologies[0] || null,
        rca_methodologies: formData.rca_methodologies,
        rca_override_reason: formData.rca_override_reason || null,
        root_cause_category: (formData.root_cause_category as RootCauseCategory) || null,
        root_cause_summary: formData.root_cause_summary || null,
        voe_plan: formData.voe_plan || null,
        voe_success_criteria: formData.voe_success_criteria || null,
        voe_result: formData.voe_result as 'pending' | 'pass' | 'fail' || null,
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      problem_complexity: (capa.problem_complexity as ProblemComplexity) || null,
      rca_methodologies: getInitialMethodologies(),
      rca_override_reason: capa.rca_override_reason || '',
      root_cause_category: capa.root_cause_category || '',
      root_cause_summary: capa.root_cause_summary || '',
      voe_plan: capa.voe_plan || '',
      voe_success_criteria: capa.voe_success_criteria || '',
      voe_result: capa.voe_result || '',
    });
    setIsEditing(false);
  };

  const canEdit = !['closed', 'rejected'].includes(capa.status);

  // Get current methodologies (form data if editing, otherwise saved values)
  const currentMethodologies = isEditing ? formData.rca_methodologies : getInitialMethodologies();

  return (
    <div className="space-y-6">
      {/* Root Cause Analysis with Helix Decision Tree */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              {lang('capa.rootCauseAnalysis')}
            </CardTitle>
            <CardDescription>{lang('capa.rcaDescription')}</CardDescription>
          </div>
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {lang('capa.edit')}
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {lang('capa.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {lang('capa.save')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            /* Editing Mode - Show full RCA Method Selector */
            <RCAMethodSelector
              severity={capa.severity}
              probability={capa.probability}
              problemComplexity={formData.problem_complexity}
              selectedMethodologies={formData.rca_methodologies}
              onComplexityChange={(c) => setFormData(prev => ({ ...prev, problem_complexity: c }))}
              onMethodologiesChange={(m) => setFormData(prev => ({ ...prev, rca_methodologies: m }))}
              onOverrideReasonChange={(r) => setFormData(prev => ({ ...prev, rca_override_reason: r }))}
              overrideReason={formData.rca_override_reason}
              readOnly={false}
            />
          ) : (
            /* View Mode - Show summary */
            <RCAMethodSelector
              severity={capa.severity}
              probability={capa.probability}
              problemComplexity={(capa.problem_complexity as ProblemComplexity) || null}
              selectedMethodologies={currentMethodologies}
              onComplexityChange={() => {}}
              onMethodologiesChange={() => {}}
              readOnly={true}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>{lang('capa.rootCauseCategory')}</Label>
              {isEditing ? (
                <Select
                  value={formData.root_cause_category}
                  onValueChange={(v) => setFormData({ ...formData, root_cause_category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={lang('capa.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROOT_CAUSE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  {capa.root_cause_category ? (
                    <Badge variant="secondary">
                      {ROOT_CAUSE_CATEGORY_LABELS[capa.root_cause_category]}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">{lang('capa.notCategorized')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{lang('capa.rootCauseSummary')}</Label>
            {isEditing ? (
              <Textarea
                value={formData.root_cause_summary}
                onChange={(e) => setFormData({ ...formData, root_cause_summary: e.target.value })}
                rows={5}
                placeholder={lang('capa.documentRootCause')}
              />
            ) : (
              <div className="bg-muted/50 p-4 rounded-md min-h-[100px]">
                {capa.root_cause_summary ? (
                  <p className="text-sm whitespace-pre-wrap">{capa.root_cause_summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {lang('capa.noRootCauseDocumented')}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visual RCA Tools - Now supports all 4 methodologies */}
      {/* Key forces remount when methodology selection changes */}
      <RCAToolsPanel
        key={`rca-panel-${currentMethodologies.join(',')}`}
        capa={capa}
        readOnly={!canEdit}
        selectedMethodologies={currentMethodologies}
      />

      {/* Approvals Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {lang('capa.approvalStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">{lang('capa.technicalLeadApproval')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang('capa.requiredForInvestigation')}
                </p>
              </div>
              <Badge variant={capa.technical_approved ? 'default' : 'outline'}>
                {capa.technical_approved ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> {lang('capa.approved')}</>
                ) : (
                  lang('capa.pending')
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">{lang('capa.qualityLeadApproval')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang('capa.requiredForPlanning')}
                </p>
              </div>
              <Badge variant={capa.quality_approved ? 'default' : 'outline'}>
                {capa.quality_approved ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> {lang('capa.approved')}</>
                ) : (
                  lang('capa.pending')
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification of Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {lang('capa.voeTitle')}
          </CardTitle>
          <CardDescription>{lang('capa.voeDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{lang('capa.voePlan')}</Label>
            {isEditing ? (
              <Textarea
                value={formData.voe_plan}
                onChange={(e) => setFormData({ ...formData, voe_plan: e.target.value })}
                rows={3}
                placeholder={lang('capa.describeVoePlan')}
              />
            ) : (
              <div className="bg-muted/50 p-3 rounded-md">
                {capa.voe_plan ? (
                  <p className="text-sm whitespace-pre-wrap">{capa.voe_plan}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{lang('capa.noVoePlan')}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{lang('capa.successCriteria')}</Label>
            {isEditing ? (
              <Textarea
                value={formData.voe_success_criteria}
                onChange={(e) => setFormData({ ...formData, voe_success_criteria: e.target.value })}
                rows={3}
                placeholder={lang('capa.defineSuccessCriteria')}
              />
            ) : (
              <div className="bg-muted/50 p-3 rounded-md">
                {capa.voe_success_criteria ? (
                  <p className="text-sm whitespace-pre-wrap">{capa.voe_success_criteria}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{lang('capa.noSuccessCriteria')}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Label>{lang('capa.voeResult')}</Label>
            {isEditing ? (
              <Select
                value={formData.voe_result}
                onValueChange={(v) => setFormData({ ...formData, voe_result: v })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{lang('capa.pending')}</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant={
                  capa.voe_result === 'pass' ? 'default' :
                  capa.voe_result === 'fail' ? 'destructive' :
                  'outline'
                }
              >
                {capa.voe_result?.toUpperCase() || lang('capa.notSet')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
