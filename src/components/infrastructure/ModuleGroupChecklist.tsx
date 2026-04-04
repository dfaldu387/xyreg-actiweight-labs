import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Shield, FileText, Beaker, CheckCircle2 } from 'lucide-react';
import { ValidationRationaleCard, type ValidationVerdict, type TestEnvironmentData } from './ValidationRationaleCard';
import type { TestStepResult } from './ValidationTestStepChecklist';
import type { SignatureMeaning } from './ValidationSignatureBlock';
import type { XyregModuleGroup } from '@/data/xyregModuleGroups';
import { useTranslation } from '@/hooks/useTranslation';

interface ModuleGroupChecklistProps {
  moduleGroup: XyregModuleGroup;
  companyId: string;
  releaseVersion?: string;
  releaseDate?: string;
  iqRationale?: {
    verdict: ValidationVerdict | '';
    reasoning: string;
    evidence_notes: string;
    evidence_doc_ids?: string[];
  };
  oqRationale?: {
    verdict: ValidationVerdict | '';
    reasoning: string;
    deviations_noted: string;
    risk_accepted?: boolean;
    risk_rationale: string;
    evidence_doc_ids?: string[];
  };
  pqRationale?: {
    verdict: ValidationVerdict | '';
    reasoning: string;
    evidence_notes: string;
    evidence_doc_ids?: string[];
  };
  iqSignatures?: { initiatorId?: string; initiatorSignedAt?: string; initiatorMeaning?: SignatureMeaning; approverId?: string; approverSignedAt?: string; approverMeaning?: SignatureMeaning };
  oqSignatures?: { initiatorId?: string; initiatorSignedAt?: string; initiatorMeaning?: SignatureMeaning; approverId?: string; approverSignedAt?: string; approverMeaning?: SignatureMeaning };
  pqSignatures?: { initiatorId?: string; initiatorSignedAt?: string; initiatorMeaning?: SignatureMeaning; approverId?: string; approverSignedAt?: string; approverMeaning?: SignatureMeaning };
  overallVerdict?: string;
  overallRationale?: string;
  conditions?: string;
  invalidatedByCore?: boolean;
  invalidatedService?: string;
  onSave: (data: {
    iq_rationale: any;
    oq_rationale: any;
    pq_rationale: any;
    overall_verdict: string;
    overall_rationale: string;
    conditions: string;
    iq_signatures?: any;
    oq_signatures?: any;
    pq_signatures?: any;
  }) => void;
  isSaving?: boolean;
}

export function ModuleGroupChecklist({
  moduleGroup,
  companyId,
  releaseVersion,
  releaseDate,
  iqRationale: initialIq,
  oqRationale: initialOq,
  pqRationale: initialPq,
  iqSignatures: initialIqSigs,
  oqSignatures: initialOqSigs,
  pqSignatures: initialPqSigs,
  overallVerdict: initialOverallVerdict = '',
  overallRationale: initialOverallRationale = '',
  conditions: initialConditions = '',
  invalidatedByCore = false,
  invalidatedService,
  onSave,
  isSaving = false,
}: ModuleGroupChecklistProps) {
  const { lang } = useTranslation();

  // IQ state
  const [iqVerdict, setIqVerdict] = useState<ValidationVerdict | ''>(initialIq?.verdict || '');
  const [iqReasoning, setIqReasoning] = useState(initialIq?.reasoning || '');
  const [iqEvidence, setIqEvidence] = useState(initialIq?.evidence_notes || '');
  const [iqEvidenceDocIds, setIqEvidenceDocIds] = useState<string[]>(initialIq?.evidence_doc_ids || []);
  const defaultTestEnv: TestEnvironmentData = {
    xyregVersion: releaseVersion || '',
    instanceUrl: `https://${companyId}.xyreg.app`,
  };
  const [iqTestEnv, setIqTestEnv] = useState<TestEnvironmentData>({ ...defaultTestEnv });

  // OQ state
  const [oqVerdict, setOqVerdict] = useState<ValidationVerdict | ''>(initialOq?.verdict || '');
  const [oqReasoning, setOqReasoning] = useState(initialOq?.reasoning || '');
  const [oqDeviations, setOqDeviations] = useState(initialOq?.deviations_noted || '');
  const [oqRiskAccepted, setOqRiskAccepted] = useState<boolean | undefined>(initialOq?.risk_accepted);
  const [oqRiskRationale, setOqRiskRationale] = useState(initialOq?.risk_rationale || '');
  const [oqEvidenceDocIds, setOqEvidenceDocIds] = useState<string[]>(initialOq?.evidence_doc_ids || []);
  const [oqTestEnv, setOqTestEnv] = useState<TestEnvironmentData>({ ...defaultTestEnv });

  // PQ state
  const [pqVerdict, setPqVerdict] = useState<ValidationVerdict | ''>(initialPq?.verdict || '');
  const [pqReasoning, setPqReasoning] = useState(initialPq?.reasoning || '');
  const [pqEvidence, setPqEvidence] = useState(initialPq?.evidence_notes || '');
  const [pqEvidenceDocIds, setPqEvidenceDocIds] = useState<string[]>(initialPq?.evidence_doc_ids || []);
  const [pqTestEnv, setPqTestEnv] = useState<TestEnvironmentData>({ ...defaultTestEnv });

  // Test step results state
  const [iqTestStepResults, setIqTestStepResults] = useState<TestStepResult[]>([]);
  const [oqTestStepResults, setOqTestStepResults] = useState<TestStepResult[]>([]);
  const [pqTestStepResults, setPqTestStepResults] = useState<TestStepResult[]>([]);

  // Signature state
  const [iqSigs, setIqSigs] = useState(initialIqSigs || {});
  const [oqSigs, setOqSigs] = useState(initialOqSigs || {});
  const [pqSigs, setPqSigs] = useState(initialPqSigs || {});

  // Overall state
  const [overallVerdict, setOverallVerdict] = useState(initialOverallVerdict);
  const [overallRationale, setOverallRationale] = useState(initialOverallRationale);
  const [conditions, setConditions] = useState(initialConditions);

  const handleSignature = (
    phase: 'iq' | 'oq' | 'pq',
    role: 'initiator' | 'approver',
    meaning: SignatureMeaning,
    userId?: string
  ) => {
    const setter = phase === 'iq' ? setIqSigs : phase === 'oq' ? setOqSigs : setPqSigs;
    setter((prev: any) => ({
      ...prev,
      ...(role === 'initiator'
        ? { initiatorId: userId || 'current', initiatorSignedAt: new Date().toISOString(), initiatorMeaning: meaning }
        : { approverId: userId, approverSignedAt: new Date().toISOString(), approverMeaning: meaning }),
    }));
  };

  const handleSave = () => {
    onSave({
      iq_rationale: { verdict: iqVerdict, reasoning: iqReasoning, evidence_notes: iqEvidence, evidence_doc_ids: iqEvidenceDocIds, test_environment: iqTestEnv, test_step_results: iqTestStepResults },
      oq_rationale: { verdict: oqVerdict, reasoning: oqReasoning, deviations_noted: oqDeviations, risk_accepted: oqRiskAccepted, risk_rationale: oqRiskRationale, evidence_doc_ids: oqEvidenceDocIds, test_environment: oqTestEnv, test_step_results: oqTestStepResults },
      pq_rationale: { verdict: pqVerdict, reasoning: pqReasoning, evidence_notes: pqEvidence, evidence_doc_ids: pqEvidenceDocIds, test_environment: pqTestEnv, test_step_results: pqTestStepResults },
      overall_verdict: overallVerdict,
      overall_rationale: overallRationale,
      conditions,
      iq_signatures: iqSigs,
      oq_signatures: oqSigs,
      pq_signatures: pqSigs,
    });
  };

  const allSectionsComplete =
    iqVerdict !== '' && iqReasoning.trim() !== '' &&
    oqVerdict !== '' && oqReasoning.trim() !== '' &&
    pqVerdict !== '' && pqReasoning.trim() !== '' &&
    overallVerdict !== '' && overallRationale.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Release Version Banner */}
      {releaseVersion && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-primary">
            Validating against XYREG Release {releaseVersion}
            {releaseDate && <span className="text-xs font-normal text-muted-foreground ml-1">({releaseDate})</span>}
          </p>
        </div>
      )}

      {/* Module Group Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{moduleGroup.name}</h3>
          <p className="text-sm text-muted-foreground">{moduleGroup.intendedUse}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={
            moduleGroup.processRisk === 'high' ? 'border-destructive/50 text-destructive' :
            moduleGroup.processRisk === 'medium' ? 'border-amber-500/50 text-amber-700' :
            'border-emerald-500/50 text-emerald-700'
          }>
            {lang('infrastructure.checklist.risk', { level: moduleGroup.processRisk })}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {lang('infrastructure.checklist.sops', { count: moduleGroup.sopNumbers.length })}
          </Badge>
        </div>
      </div>

      {/* Features & Dependencies */}
      <div className="flex flex-wrap gap-1.5">
        {moduleGroup.features.map(f => (
          <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
        ))}
      </div>

      <Separator />

      {/* IQ Section */}
      <ValidationRationaleCard
        title={lang('infrastructure.checklist.iqTitle')}
        description={lang('infrastructure.checklist.iqDescription')}
        criticalThinkingPrompt={lang('infrastructure.checklist.iqThinkingPrompt')}
        verdict={iqVerdict}
        reasoning={iqReasoning}
        evidenceNotes={iqEvidence}
        evidenceDocIds={iqEvidenceDocIds}
        companyId={companyId}
        acceptanceCriteria={moduleGroup.acceptanceCriteria?.iq}
        testEnvironment={iqTestEnv}
        responsibilityType="customer_authored"
        testSteps={moduleGroup.testSteps?.iq}
        testStepResults={iqTestStepResults}
        onTestStepsChange={setIqTestStepResults}
        phase="iq"
        signatures={iqSigs}
        onSignAsInitiator={(meaning) => handleSignature('iq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('iq', 'approver', meaning, userId)}
        onVerdictChange={setIqVerdict}
        onReasoningChange={setIqReasoning}
        onEvidenceNotesChange={setIqEvidence}
        onLinkDoc={(id) => setIqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setIqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onTestEnvironmentChange={setIqTestEnv}
        invalidatedByCore={invalidatedByCore}
        invalidatedService={invalidatedService}
      />

      {/* OQ Section */}
      <ValidationRationaleCard
        title={lang('infrastructure.checklist.oqTitle')}
        description={lang('infrastructure.checklist.oqDescription')}
        criticalThinkingPrompt={lang('infrastructure.checklist.oqThinkingPrompt')}
        verdict={oqVerdict}
        reasoning={oqReasoning}
        evidenceNotes=""
        evidenceDocIds={oqEvidenceDocIds}
        companyId={companyId}
        deviationsNoted={oqDeviations}
        riskAccepted={oqRiskAccepted}
        riskRationale={oqRiskRationale}
        acceptanceCriteria={moduleGroup.acceptanceCriteria?.oq}
        testEnvironment={oqTestEnv}
        responsibilityType="vendor_supplied"
        testSteps={moduleGroup.testSteps?.oq}
        testStepResults={oqTestStepResults}
        onTestStepsChange={setOqTestStepResults}
        phase="oq"
        signatures={oqSigs}
        onSignAsInitiator={(meaning) => handleSignature('oq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('oq', 'approver', meaning, userId)}
        onVerdictChange={setOqVerdict}
        onReasoningChange={setOqReasoning}
        onLinkDoc={(id) => setOqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setOqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onDeviationsChange={setOqDeviations}
        onRiskAcceptedChange={setOqRiskAccepted}
        onRiskRationaleChange={setOqRiskRationale}
        onTestEnvironmentChange={setOqTestEnv}
        showDeviations
        showRiskAcceptance
        invalidatedByCore={invalidatedByCore}
        invalidatedService={invalidatedService}
      />

      {/* PQ Section */}
      <ValidationRationaleCard
        title={lang('infrastructure.checklist.pqTitle')}
        description={lang('infrastructure.checklist.pqDescription')}
        criticalThinkingPrompt={lang('infrastructure.checklist.pqThinkingPrompt')}
        verdict={pqVerdict}
        reasoning={pqReasoning}
        evidenceNotes={pqEvidence}
        evidenceDocIds={pqEvidenceDocIds}
        companyId={companyId}
        acceptanceCriteria={moduleGroup.acceptanceCriteria?.pq}
        testEnvironment={pqTestEnv}
        responsibilityType="customer_authored"
        testSteps={moduleGroup.testSteps?.pq}
        testStepResults={pqTestStepResults}
        onTestStepsChange={setPqTestStepResults}
        phase="pq"
        signatures={pqSigs}
        onSignAsInitiator={(meaning) => handleSignature('pq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('pq', 'approver', meaning, userId)}
        onVerdictChange={setPqVerdict}
        onReasoningChange={setPqReasoning}
        onEvidenceNotesChange={setPqEvidence}
        onLinkDoc={(id) => setPqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setPqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onTestEnvironmentChange={setPqTestEnv}
        invalidatedByCore={invalidatedByCore}
        invalidatedService={invalidatedService}
      />

      <Separator />

      {/* Overall Determination */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {lang('infrastructure.checklist.overallDetermination')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
            <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              {lang('infrastructure.checklist.overallThinkingPrompt')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{lang('infrastructure.checklist.overallVerdict')} <span className="text-destructive">*</span></Label>
            <Select value={overallVerdict} onValueChange={setOverallVerdict}>
              <SelectTrigger>
                <SelectValue placeholder={lang('infrastructure.checklist.selectOverallDetermination')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validated">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {lang('infrastructure.checklist.validated')}
                  </span>
                </SelectItem>
                <SelectItem value="validated_with_conditions">
                  <span className="flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-amber-600" />
                    {lang('infrastructure.checklist.validatedWithConditions')}
                  </span>
                </SelectItem>
                <SelectItem value="not_validated">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-destructive" />
                    {lang('infrastructure.checklist.notValidated')}
                  </span>
                </SelectItem>
                <SelectItem value="not_applicable">{lang('infrastructure.checklist.notApplicable')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{lang('infrastructure.checklist.overallRationale')} <span className="text-destructive">*</span></Label>
            <Textarea
              value={overallRationale}
              onChange={(e) => setOverallRationale(e.target.value)}
              placeholder={lang('infrastructure.checklist.overallRationalePlaceholder')}
              rows={3}
              className="resize-none"
            />
          </div>

          {overallVerdict === 'validated_with_conditions' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{lang('infrastructure.checklist.conditions')}</Label>
              <Textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder={lang('infrastructure.checklist.conditionsPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !allSectionsComplete}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? lang('infrastructure.checklist.saving') : lang('infrastructure.checklist.saveValidationRecord')}
        </Button>
      </div>
    </div>
  );
}
