import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAPARecord, CAPA_SOURCE_LABELS, calculateRiskLevel } from '@/types/capa';
import { useUpdateCAPA } from '@/hooks/useCAPAData';
import { Edit, Save, X, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPADetailsTabProps {
  capa: CAPARecord;
}

export function CAPADetailsTab({ capa }: CAPADetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateCAPA();
  const { lang } = useTranslation();

  const [formData, setFormData] = useState({
    problem_description: capa.problem_description,
    immediate_correction: capa.immediate_correction || '',
    severity: capa.severity?.toString() || '',
    probability: capa.probability?.toString() || '',
    target_investigation_date: capa.target_investigation_date || '',
    target_implementation_date: capa.target_implementation_date || '',
    target_verification_date: capa.target_verification_date || '',
    target_closure_date: capa.target_closure_date || '',
    requires_regulatory_update: capa.requires_regulatory_update,
    regulatory_impact_description: capa.regulatory_impact_description || '',
  });

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: capa.id,
      updates: {
        problem_description: formData.problem_description,
        immediate_correction: formData.immediate_correction || null,
        severity: formData.severity ? parseInt(formData.severity) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        target_investigation_date: formData.target_investigation_date || null,
        target_implementation_date: formData.target_implementation_date || null,
        target_verification_date: formData.target_verification_date || null,
        target_closure_date: formData.target_closure_date || null,
        requires_regulatory_update: formData.requires_regulatory_update,
        regulatory_impact_description: formData.regulatory_impact_description || null,
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      problem_description: capa.problem_description,
      immediate_correction: capa.immediate_correction || '',
      severity: capa.severity?.toString() || '',
      probability: capa.probability?.toString() || '',
      target_investigation_date: capa.target_investigation_date || '',
      target_implementation_date: capa.target_implementation_date || '',
      target_verification_date: capa.target_verification_date || '',
      target_closure_date: capa.target_closure_date || '',
      requires_regulatory_update: capa.requires_regulatory_update,
      regulatory_impact_description: capa.regulatory_impact_description || '',
    });
    setIsEditing(false);
  };

  const riskLevel = calculateRiskLevel(
    formData.severity ? parseInt(formData.severity) : null,
    formData.probability ? parseInt(formData.probability) : null
  );

  const riskScore = formData.severity && formData.probability
    ? parseInt(formData.severity) * parseInt(formData.probability)
    : null;

  const canEdit = !['closed', 'rejected'].includes(capa.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Problem Definition */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{lang('capa.problemDefinition')}</CardTitle>
            <CardDescription>{lang('capa.coreDescription')}</CardDescription>
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{lang('capa.sourceType')}</span>
              <Badge variant="outline" className="ml-2">{CAPA_SOURCE_LABELS[capa.source_type]}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">{lang('capa.capaType')}</span>
              <Badge variant="secondary" className="ml-2 capitalize">{capa.capa_type}</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{lang('capa.problemDescription')}</Label>
            {isEditing ? (
              <Textarea
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                rows={4}
              />
            ) : (
              <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                {capa.problem_description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{lang('capa.immediateCorrection')}</Label>
            {isEditing ? (
              <Textarea
                value={formData.immediate_correction}
                onChange={(e) => setFormData({ ...formData, immediate_correction: e.target.value })}
                rows={3}
                placeholder={lang('capa.describeImmediateCorrections')}
              />
            ) : (
              <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                {capa.immediate_correction || lang('capa.noImmediateCorrection')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {lang('capa.riskAssessment')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('capa.severity')}</Label>
              {isEditing ? (
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({ ...formData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-2xl font-bold">{capa.severity ?? '—'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{lang('capa.probability')}</Label>
              {isEditing ? (
                <Select
                  value={formData.probability}
                  onValueChange={(v) => setFormData({ ...formData, probability: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-2xl font-bold">{capa.probability ?? '—'}</div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{lang('capa.riskScore')}</span>
            <span className="text-xl font-bold">{riskScore ?? '—'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{lang('capa.riskLevel')}</span>
            {riskLevel ? (
              <Badge
                variant={riskLevel === 'critical' || riskLevel === 'high' ? 'destructive' : 'secondary'}
              >
                {riskLevel.toUpperCase()}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {lang('capa.targetDates')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'target_investigation_date', label: lang('capa.investigationDate') },
            { key: 'target_implementation_date', label: lang('capa.implementationDate') },
            { key: 'target_verification_date', label: lang('capa.verificationDate') },
            { key: 'target_closure_date', label: lang('capa.closureDate') },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-muted-foreground">{label}</Label>
              {isEditing ? (
                <Input
                  type="date"
                  className="w-40"
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                />
              ) : (
                <span className="text-sm">
                  {capa[key as keyof CAPARecord]
                    ? format(new Date(capa[key as keyof CAPARecord] as string), 'MMM d, yyyy')
                    : '—'}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Regulatory Impact */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{lang('capa.regulatoryImpact')}</CardTitle>
          <CardDescription>{lang('capa.regulatoryImpactDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>{lang('capa.requiresRegulatoryUpdate')}</Label>
            {isEditing ? (
              <Select
                value={formData.requires_regulatory_update ? 'yes' : 'no'}
                onValueChange={(v) => setFormData({ ...formData, requires_regulatory_update: v === 'yes' })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{lang('capa.yes')}</SelectItem>
                  <SelectItem value="no">{lang('capa.no')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={capa.requires_regulatory_update ? 'destructive' : 'secondary'}>
                {capa.requires_regulatory_update ? lang('capa.yes') : lang('capa.no')}
              </Badge>
            )}
          </div>

          {(formData.requires_regulatory_update || capa.regulatory_impact_description) && (
            <div className="space-y-2">
              <Label>{lang('capa.impactDescription')}</Label>
              {isEditing ? (
                <Textarea
                  value={formData.regulatory_impact_description}
                  onChange={(e) => setFormData({ ...formData, regulatory_impact_description: e.target.value })}
                  rows={3}
                  placeholder={lang('capa.describeRegulatoryImpact')}
                />
              ) : (
                <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                  {capa.regulatory_impact_description || lang('capa.noDescriptionProvided')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
