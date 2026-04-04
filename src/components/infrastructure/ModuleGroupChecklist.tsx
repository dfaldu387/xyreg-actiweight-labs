import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Shield, FileText, Beaker, CheckCircle2, Loader2 } from 'lucide-react';
import { ValidationRationaleCard, type ValidationVerdict, type TestEnvironmentData } from './ValidationRationaleCard';
import type { TestStepResult } from './ValidationTestStepChecklist';
import type { SignatureMeaning } from './ValidationSignatureBlock';
import type { XyregModuleGroup } from '@/data/xyregModuleGroups';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleGroupValidation, useSaveModuleGroupValidation } from '@/hooks/useModuleGroupValidation';

/** Resolve :companyName placeholder in navigateTo routes */
function resolveTestStepRoutes(
  steps: { step: string; expectedResult: string; navigateTo?: string }[] | undefined,
  companyName: string
): { step: string; expectedResult: string; navigateTo?: string }[] {
  if (!steps) return [];
  return steps.map(s => ({
    ...s,
    navigateTo: s.navigateTo?.replace(':companyName', encodeURIComponent(companyName)),
  }));
}

interface ModuleGroupChecklistProps {
  moduleGroup: XyregModuleGroup;
  companyId: string;
  adoptedReleaseId?: string | null;
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
  adoptedReleaseId: propAdoptedReleaseId,
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
  isSaving: propIsSaving = false,
}: ModuleGroupChecklistProps) {
  const { lang } = useTranslation();
  const { companyName } = useParams<{ companyName: string }>();
  const decodedCompany = companyName || '';

  // Resolve :companyName in test step navigateTo routes
  const resolvedIqSteps = useMemo(() => resolveTestStepRoutes(moduleGroup.testSteps?.iq, decodedCompany), [moduleGroup, decodedCompany]);
  const resolvedOqSteps = useMemo(() => resolveTestStepRoutes(moduleGroup.testSteps?.oq, decodedCompany), [moduleGroup, decodedCompany]);
  const resolvedPqSteps = useMemo(() => resolveTestStepRoutes(moduleGroup.testSteps?.pq, decodedCompany), [moduleGroup, decodedCompany]);

  // Use adopted release ID from parent (null means no release adopted yet)
  const adoptedReleaseId = propAdoptedReleaseId ?? null;
  const { data: savedRecord, isLoading: isLoadingRecord } = useModuleGroupValidation(
    companyId, adoptedReleaseId, moduleGroup.id
  );
  const saveMutation = useSaveModuleGroupValidation(companyId);

  // Track if we've hydrated from DB to avoid overwriting user input
  const [hydrated, setHydrated] = useState(false);

  const defaultTestEnv: TestEnvironmentData = {
    xyregVersion: releaseVersion || '',
    instanceUrl: window.location.origin,
  };

  // IQ state
  const [iqVerdict, setIqVerdict] = useState<ValidationVerdict | ''>(initialIq?.verdict || '');
  const [iqReasoning, setIqReasoning] = useState(initialIq?.reasoning || '');
  const [iqEvidence, setIqEvidence] = useState(initialIq?.evidence_notes || '');
  const [iqEvidenceDocIds, setIqEvidenceDocIds] = useState<string[]>(initialIq?.evidence_doc_ids || []);
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

  // Hydrate from DB when saved record loads
  useEffect(() => {
    if (savedRecord && !hydrated) {
      setHydrated(true);
      // IQ
      if (savedRecord.iq_verdict) setIqVerdict(savedRecord.iq_verdict as ValidationVerdict);
      if (savedRecord.iq_reasoning) setIqReasoning(savedRecord.iq_reasoning);
      if (savedRecord.iq_evidence_notes) setIqEvidence(savedRecord.iq_evidence_notes);
      if (savedRecord.iq_evidence_doc_ids) setIqEvidenceDocIds(savedRecord.iq_evidence_doc_ids);
      if (savedRecord.iq_test_environment && Object.keys(savedRecord.iq_test_environment).length > 0) setIqTestEnv(savedRecord.iq_test_environment);
      if (savedRecord.iq_test_step_results?.length > 0) setIqTestStepResults(savedRecord.iq_test_step_results);
      if (savedRecord.iq_signatures && Object.keys(savedRecord.iq_signatures).length > 0) setIqSigs(savedRecord.iq_signatures);
      // OQ
      if (savedRecord.oq_verdict) setOqVerdict(savedRecord.oq_verdict as ValidationVerdict);
      if (savedRecord.oq_reasoning) setOqReasoning(savedRecord.oq_reasoning);
      if (savedRecord.oq_deviations_noted) setOqDeviations(savedRecord.oq_deviations_noted);
      if (savedRecord.oq_risk_accepted !== null) setOqRiskAccepted(savedRecord.oq_risk_accepted ?? undefined);
      if (savedRecord.oq_risk_rationale) setOqRiskRationale(savedRecord.oq_risk_rationale);
      if (savedRecord.oq_evidence_doc_ids) setOqEvidenceDocIds(savedRecord.oq_evidence_doc_ids);
      if (savedRecord.oq_test_environment && Object.keys(savedRecord.oq_test_environment).length > 0) setOqTestEnv(savedRecord.oq_test_environment);
      if (savedRecord.oq_test_step_results?.length > 0) setOqTestStepResults(savedRecord.oq_test_step_results);
      if (savedRecord.oq_signatures && Object.keys(savedRecord.oq_signatures).length > 0) setOqSigs(savedRecord.oq_signatures);
      // PQ
      if (savedRecord.pq_verdict) setPqVerdict(savedRecord.pq_verdict as ValidationVerdict);
      if (savedRecord.pq_reasoning) setPqReasoning(savedRecord.pq_reasoning);
      if (savedRecord.pq_evidence_notes) setPqEvidence(savedRecord.pq_evidence_notes);
      if (savedRecord.pq_evidence_doc_ids) setPqEvidenceDocIds(savedRecord.pq_evidence_doc_ids);
      if (savedRecord.pq_test_environment && Object.keys(savedRecord.pq_test_environment).length > 0) setPqTestEnv(savedRecord.pq_test_environment);
      if (savedRecord.pq_test_step_results?.length > 0) setPqTestStepResults(savedRecord.pq_test_step_results);
      if (savedRecord.pq_signatures && Object.keys(savedRecord.pq_signatures).length > 0) setPqSigs(savedRecord.pq_signatures);
      // Overall
      if (savedRecord.overall_verdict) setOverallVerdict(savedRecord.overall_verdict);
      if (savedRecord.overall_rationale) setOverallRationale(savedRecord.overall_rationale);
      if (savedRecord.conditions) setConditions(savedRecord.conditions);
    }
  }, [savedRecord, hydrated]);

  const isSaving = propIsSaving || saveMutation.isPending;

  // Track whether the user has made any manual changes (not just hydration/auto-detect)
  const userHasEdited = React.useRef(false);
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingFromDb = isLoadingRecord || (!hydrated && savedRecord !== undefined && savedRecord !== null);

  // Build the save payload
  const buildPayload = React.useCallback(() => ({
    release_id: adoptedReleaseId,
    module_group_id: moduleGroup.id,
    release_version: iqTestEnv?.xyregVersion || releaseVersion || '',
    iq_rationale: { verdict: iqVerdict, reasoning: iqReasoning, evidence_notes: iqEvidence, evidence_doc_ids: iqEvidenceDocIds, test_environment: iqTestEnv, test_step_results: iqTestStepResults },
    oq_rationale: { verdict: oqVerdict, reasoning: oqReasoning, deviations_noted: oqDeviations, risk_accepted: oqRiskAccepted, risk_rationale: oqRiskRationale, evidence_doc_ids: oqEvidenceDocIds, test_environment: oqTestEnv, test_step_results: oqTestStepResults },
    pq_rationale: { verdict: pqVerdict, reasoning: pqReasoning, evidence_notes: pqEvidence, evidence_doc_ids: pqEvidenceDocIds, test_environment: pqTestEnv, test_step_results: pqTestStepResults },
    overall_verdict: overallVerdict,
    overall_rationale: overallRationale,
    conditions,
    iq_signatures: iqSigs,
    oq_signatures: oqSigs,
    pq_signatures: pqSigs,
  }), [
    iqVerdict, iqReasoning, iqEvidence, iqEvidenceDocIds, iqTestEnv, iqTestStepResults, iqSigs,
    oqVerdict, oqReasoning, oqDeviations, oqRiskAccepted, oqRiskRationale, oqEvidenceDocIds, oqTestEnv, oqTestStepResults, oqSigs,
    pqVerdict, pqReasoning, pqEvidence, pqEvidenceDocIds, pqTestEnv, pqTestStepResults, pqSigs,
    overallVerdict, overallRationale, conditions, moduleGroup.id, releaseVersion, adoptedReleaseId, iqTestEnv?.xyregVersion
  ]);

  // Auto-save: only fires after user has made a real edit, debounced 2s
  useEffect(() => {
    // Don't save during initial load or hydration
    if (isLoadingRecord) return;
    if (!userHasEdited.current) return;

    // Must have meaningful data
    const hasAnyData = iqVerdict || oqVerdict || pqVerdict || iqReasoning || oqReasoning || pqReasoning || overallVerdict;
    if (!hasAnyData) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveMutation.mutate(buildPayload());
    }, 2000);

    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [buildPayload, isLoadingRecord]);

  // Wrapper setters that mark userHasEdited = true
  const userEdit = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T | ((prev: T) => T)) => {
    userHasEdited.current = true;
    setter(value);
  };

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
    // Called by parent for backward compatibility
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
        <div className="flex items-center gap-2 w-fit shrink-0">
          <Badge variant="outline" className={`w-fit whitespace-nowrap ${
            moduleGroup.processRisk === 'high' ? 'border-destructive/50 text-destructive' :
            moduleGroup.processRisk === 'medium' ? 'border-amber-500/50 text-amber-700' :
            'border-emerald-500/50 text-emerald-700'
          }`}>
            {lang('infrastructure.checklist.risk', { level: moduleGroup.processRisk })}
          </Badge>
          <Badge variant="outline" className="text-xs w-fit whitespace-nowrap">
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
        testSteps={resolvedIqSteps}
        testStepResults={iqTestStepResults}
        onTestStepsChange={userEdit(setIqTestStepResults)}
        phase="iq"
        signatures={iqSigs}
        onSignAsInitiator={(meaning) => handleSignature('iq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('iq', 'approver', meaning, userId)}
        onVerdictChange={userEdit(setIqVerdict)}
        onReasoningChange={userEdit(setIqReasoning)}
        onEvidenceNotesChange={userEdit(setIqEvidence)}
        onLinkDoc={(id) => setIqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setIqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onTestEnvironmentChange={userEdit(setIqTestEnv)}
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
        testSteps={resolvedOqSteps}
        testStepResults={oqTestStepResults}
        onTestStepsChange={userEdit(setOqTestStepResults)}
        phase="oq"
        signatures={oqSigs}
        onSignAsInitiator={(meaning) => handleSignature('oq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('oq', 'approver', meaning, userId)}
        onVerdictChange={userEdit(setOqVerdict)}
        onReasoningChange={userEdit(setOqReasoning)}
        onLinkDoc={(id) => setOqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setOqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onDeviationsChange={userEdit(setOqDeviations)}
        onRiskAcceptedChange={userEdit(setOqRiskAccepted)}
        onRiskRationaleChange={userEdit(setOqRiskRationale)}
        onTestEnvironmentChange={userEdit(setOqTestEnv)}
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
        testSteps={resolvedPqSteps}
        testStepResults={pqTestStepResults}
        onTestStepsChange={userEdit(setPqTestStepResults)}
        phase="pq"
        signatures={pqSigs}
        onSignAsInitiator={(meaning) => handleSignature('pq', 'initiator', meaning)}
        onSignAsApprover={(meaning, userId) => handleSignature('pq', 'approver', meaning, userId)}
        onVerdictChange={userEdit(setPqVerdict)}
        onReasoningChange={userEdit(setPqReasoning)}
        onEvidenceNotesChange={userEdit(setPqEvidence)}
        onLinkDoc={(id) => setPqEvidenceDocIds(prev => [...prev, id])}
        onUnlinkDoc={(id) => setPqEvidenceDocIds(prev => prev.filter(d => d !== id))}
        onTestEnvironmentChange={userEdit(setPqTestEnv)}
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
            <Select value={overallVerdict} onValueChange={(v) => { userHasEdited.current = true; setOverallVerdict(v); }}>
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
              onChange={(e) => { userHasEdited.current = true; setOverallRationale(e.target.value); }}
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
                onChange={(e) => { userHasEdited.current = true; setConditions(e.target.value); }}
                placeholder={lang('infrastructure.checklist.conditionsPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-save status */}
      <div className="flex items-center justify-end gap-2 py-2">
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        ) : savedRecord ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Saved {new Date(savedRecord.updated_at).toLocaleString()}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
