import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Lightbulb, CheckCircle2, AlertTriangle, XCircle, Clock, MinusCircle, ClipboardCheck, Monitor } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ValidationEvidenceLinker } from './ValidationEvidenceLinker';
import { ValidationSignatureBlock, type SignatureMeaning } from './ValidationSignatureBlock';
import { ValidationTestStepChecklist, type TestStepResult } from './ValidationTestStepChecklist';
import { Building2, UserCheck, RotateCcw, Loader2 } from 'lucide-react';

export interface TestEnvironmentData {
  xyregVersion?: string;
  instanceUrl?: string;
  browser?: string;
  os?: string;
  network?: string;
}

/** Auto-detect browser name and version from userAgent */
function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Firefox/')) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}`.trim();
  return ua.slice(0, 60);
}

/** Auto-detect operating system from userAgent */
function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows NT 10.0')) return ua.includes('Windows NT 10.0; Win64') ? 'Windows 10/11 (64-bit)' : 'Windows 10/11';
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X')) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.');
    return ver ? `macOS ${ver}` : 'macOS';
  }
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return navigator.platform || 'Unknown';
}

export type ResponsibilityType = 'customer_authored' | 'vendor_supplied';

export type ValidationVerdict =
  | 'acceptable'
  | 'acceptable_with_observations'
  | 'not_acceptable'
  | 'not_applicable'
  | 'deferred';

interface SignatureData {
  initiatorId?: string;
  initiatorSignedAt?: string;
  initiatorMeaning?: SignatureMeaning;
  approverId?: string;
  approverSignedAt?: string;
  approverMeaning?: SignatureMeaning;
}

interface ValidationRationaleCardProps {
  title: string;
  description: string;
  criticalThinkingPrompt: string;
  verdict: ValidationVerdict | '';
  reasoning: string;
  evidenceNotes?: string;
  deviationsNoted?: string;
  riskAccepted?: boolean;
  riskRationale?: string;
  acceptanceCriteria?: string;
  testEnvironment?: TestEnvironmentData;
  evidenceDocIds?: string[];
  companyId?: string;
  responsibilityType?: ResponsibilityType;
  testSteps?: { step: string; expectedResult: string; navigateTo?: string }[];
  testStepResults?: TestStepResult[];
  onTestStepsChange?: (results: TestStepResult[]) => void;
  phase?: 'iq' | 'oq' | 'pq';
  signatures?: SignatureData;
  onSignAsInitiator?: (meaning: SignatureMeaning) => void;
  onSignAsApprover?: (meaning: SignatureMeaning, approverId: string) => void;
  onVerdictChange: (verdict: ValidationVerdict) => void;
  onReasoningChange: (reasoning: string) => void;
  onEvidenceNotesChange?: (notes: string) => void;
  onLinkDoc?: (docId: string) => void;
  onUnlinkDoc?: (docId: string) => void;
  onDeviationsChange?: (deviations: string) => void;
  onRiskAcceptedChange?: (accepted: boolean) => void;
  onRiskRationaleChange?: (rationale: string) => void;
  onTestEnvironmentChange?: (env: TestEnvironmentData) => void;
  showDeviations?: boolean;
  showRiskAcceptance?: boolean;
  disabled?: boolean;
  invalidatedByCore?: boolean;
  invalidatedService?: string;
}

const VERDICT_ICONS: Record<ValidationVerdict, { icon: React.ReactNode; color: string }> = {
  acceptable: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600' },
  acceptable_with_observations: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600' },
  not_acceptable: { icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  not_applicable: { icon: <MinusCircle className="h-4 w-4" />, color: 'text-muted-foreground' },
  deferred: { icon: <Clock className="h-4 w-4" />, color: 'text-blue-600' },
};

const VERDICT_KEYS: ValidationVerdict[] = ['acceptable', 'acceptable_with_observations', 'not_acceptable', 'not_applicable', 'deferred'];

const VERDICT_LABEL_KEYS: Record<ValidationVerdict, string> = {
  acceptable: 'infrastructure.rationaleCard.acceptable',
  acceptable_with_observations: 'infrastructure.rationaleCard.acceptableWithObservations',
  not_acceptable: 'infrastructure.rationaleCard.notAcceptable',
  not_applicable: 'infrastructure.rationaleCard.notApplicable',
  deferred: 'infrastructure.rationaleCard.deferred',
};

const RESPONSIBILITY_BANNERS: Record<ResponsibilityType, { icon: React.ReactNode; label: string; description: string; className: string }> = {
  customer_authored: {
    icon: <UserCheck className="h-4 w-4" />,
    label: 'Customer Responsibility',
    description: 'Your team performs and documents this qualification step',
    className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  vendor_supplied: {
    icon: <Building2 className="h-4 w-4" />,
    label: 'Vendor Evidence Supplied',
    description: 'Review and accept XYREG\'s pre-executed test results (Rationale Cards)',
    className: 'bg-blue-50 border-blue-200 text-blue-800',
  },
};

export function ValidationRationaleCard({
  title,
  description,
  criticalThinkingPrompt,
  verdict,
  reasoning,
  evidenceNotes = '',
  deviationsNoted = '',
  riskAccepted,
  riskRationale = '',
  acceptanceCriteria,
  testEnvironment = {},
  evidenceDocIds = [],
  companyId,
  responsibilityType,
  testSteps,
  testStepResults,
  onTestStepsChange,
  phase,
  signatures,
  onSignAsInitiator,
  onSignAsApprover,
  onVerdictChange,
  onReasoningChange,
  onEvidenceNotesChange,
  onLinkDoc,
  onUnlinkDoc,
  onDeviationsChange,
  onRiskAcceptedChange,
  onRiskRationaleChange,
  onTestEnvironmentChange,
  showDeviations = false,
  showRiskAcceptance = false,
  disabled = false,
  invalidatedByCore = false,
  invalidatedService,
}: ValidationRationaleCardProps) {
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const hasAutoDetected = React.useRef(false);

  // Auto-detect browser/OS/URL on first open when fields are empty (fixes G3)
  React.useEffect(() => {
    if (isOpen && !hasAutoDetected.current && onTestEnvironmentChange && !disabled) {
      const needsDetection = !testEnvironment?.browser && !testEnvironment?.os;
      if (needsDetection) {
        hasAutoDetected.current = true;
        onTestEnvironmentChange({
          ...testEnvironment,
          instanceUrl: testEnvironment?.instanceUrl || window.location.origin,
          browser: detectBrowser(),
          os: detectOS(),
          network: testEnvironment?.network || 'Public Internet',
        });
      }
    }
  }, [isOpen]);

  const verdictMeta = verdict ? VERDICT_ICONS[verdict] : undefined;
  const verdictLabel = verdict ? lang(VERDICT_LABEL_KEYS[verdict]) : undefined;
  const isComplete = verdict !== '' && reasoning.trim().length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border ${invalidatedByCore ? 'border-destructive/50 bg-destructive/5' : isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-border'}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {invalidatedByCore && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {lang('infrastructure.rationaleCard.invalidatedBy', { service: invalidatedService || '' })}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {verdictMeta && (
                  <Badge variant="outline" className={`text-xs ${verdictMeta.color}`}>
                    {verdictMeta.icon}
                    <span className="ml-1">{verdictLabel}</span>
                  </Badge>
                )}
                {isComplete && !invalidatedByCore && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 space-y-4">
            {/* Responsibility Banner */}
            {responsibilityType && (
              <div className={`flex items-start gap-2 p-3 rounded-md border ${RESPONSIBILITY_BANNERS[responsibilityType].className}`}>
                {RESPONSIBILITY_BANNERS[responsibilityType].icon}
                <div>
                  <p className="text-xs font-semibold">{RESPONSIBILITY_BANNERS[responsibilityType].label}</p>
                  <p className="text-xs opacity-80">{RESPONSIBILITY_BANNERS[responsibilityType].description}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground">{description}</p>

            {/* Test Environment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  Test Environment
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={disabled || isDetecting}
                  onClick={() => {
                    setIsDetecting(true);
                    setTimeout(() => {
                      onTestEnvironmentChange?.({
                        ...testEnvironment,
                        instanceUrl: testEnvironment?.instanceUrl || window.location.origin,
                        browser: detectBrowser(),
                        os: detectOS(),
                        network: testEnvironment?.network || 'Public Internet',
                      });
                      setIsDetecting(false);
                    }, 600);
                  }}
                >
                  {isDetecting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                  {isDetecting ? 'Detecting...' : 'Auto-detect'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">XYREG Version</Label>
                  <Input
                    value={testEnvironment?.xyregVersion || ''}
                    onChange={(e) => onTestEnvironmentChange?.({ ...testEnvironment, xyregVersion: e.target.value })}
                    placeholder="e.g., v1.0.0"
                    disabled={disabled}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Instance URL</Label>
                  <Input
                    value={testEnvironment?.instanceUrl || ''}
                    readOnly
                    disabled={disabled}
                    className="h-8 text-sm bg-muted/50 cursor-default"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Browser & Version</Label>
                  <Input
                    value={testEnvironment?.browser || ''}
                    onChange={(e) => onTestEnvironmentChange?.({ ...testEnvironment, browser: e.target.value })}
                    placeholder="e.g., Chrome 124"
                    disabled={disabled}
                    className="h-8 text-sm bg-muted/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Operating System</Label>
                  <Input
                    value={testEnvironment?.os || ''}
                    onChange={(e) => onTestEnvironmentChange?.({ ...testEnvironment, os: e.target.value })}
                    placeholder="e.g., Windows 11"
                    disabled={disabled}
                    className="h-8 text-sm bg-muted/50"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Network / Access</Label>
                  <Select
                    value={testEnvironment?.network || ''}
                    onValueChange={(v) => onTestEnvironmentChange?.({ ...testEnvironment, network: v })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select network type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corporate LAN">Corporate LAN</SelectItem>
                      <SelectItem value="Corporate VPN">Corporate VPN</SelectItem>
                      <SelectItem value="Public Internet">Public Internet</SelectItem>
                      <SelectItem value="Air-gapped Network">Air-gapped Network</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Acceptance Criteria (read-only) */}
            {acceptanceCriteria && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
                <ClipboardCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-0.5">Acceptance Criteria</p>
                  <p className="text-xs text-blue-700">{acceptanceCriteria}</p>
                </div>
              </div>
            )}

            {/* Test Step Checklist */}
            {testSteps && testSteps.length > 0 && onTestStepsChange && (
              <ValidationTestStepChecklist
                steps={testSteps}
                results={testStepResults || []}
                onChange={onTestStepsChange}
                disabled={disabled}
              />
            )}

            {/* Critical Thinking Prompt */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">{criticalThinkingPrompt}</p>
            </div>

            {/* Verdict Selector */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{lang('infrastructure.rationaleCard.verdict')} <span className="text-destructive">*</span></Label>
              <Select value={verdict} onValueChange={(v) => onVerdictChange(v as ValidationVerdict)} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={lang('infrastructure.rationaleCard.selectDetermination')} />
                </SelectTrigger>
                <SelectContent>
                  {VERDICT_KEYS.map(key => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={VERDICT_ICONS[key].color}>{VERDICT_ICONS[key].icon}</span>
                        {lang(VERDICT_LABEL_KEYS[key])}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reasoning */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{lang('infrastructure.rationaleCard.rationale')} <span className="text-destructive">*</span></Label>
              <Textarea
                value={reasoning}
                onChange={(e) => onReasoningChange(e.target.value)}
                placeholder={lang('infrastructure.rationaleCard.rationalePlaceholder')}
                rows={3}
                disabled={disabled}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {lang('infrastructure.rationaleCard.rationaleHelp')}
              </p>
            </div>

            {/* Deviations (OQ specific) */}
            {showDeviations && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{lang('infrastructure.rationaleCard.deviationsNoted')}</Label>
                <Textarea
                  value={deviationsNoted}
                  onChange={(e) => onDeviationsChange?.(e.target.value)}
                  placeholder={lang('infrastructure.rationaleCard.deviationsPlaceholder')}
                  rows={2}
                  disabled={disabled}
                  className="resize-none"
                />
              </div>
            )}

            {/* Risk Acceptance (OQ specific) */}
            {showRiskAcceptance && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">{lang('infrastructure.rationaleCard.residualRiskAccepted')}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={riskAccepted === true ? 'default' : 'outline'}
                      onClick={() => onRiskAcceptedChange?.(true)}
                      disabled={disabled}
                      className="h-7 text-xs"
                    >
                      {lang('infrastructure.rationaleCard.yes')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={riskAccepted === false ? 'destructive' : 'outline'}
                      onClick={() => onRiskAcceptedChange?.(false)}
                      disabled={disabled}
                      className="h-7 text-xs"
                    >
                      {lang('infrastructure.rationaleCard.no')}
                    </Button>
                  </div>
                </div>
                {riskAccepted !== undefined && (
                  <Textarea
                    value={riskRationale}
                    onChange={(e) => onRiskRationaleChange?.(e.target.value)}
                    placeholder={lang('infrastructure.rationaleCard.riskRationalePlaceholder')}
                    rows={2}
                    disabled={disabled}
                    className="resize-none"
                  />
                )}
              </div>
            )}

            {/* Evidence & Document References */}
            {companyId && onLinkDoc && onUnlinkDoc ? (
              <ValidationEvidenceLinker
                linkedDocIds={evidenceDocIds}
                onLinkDoc={onLinkDoc}
                onUnlinkDoc={onUnlinkDoc}
                freeTextNotes={evidenceNotes}
                onNotesChange={(notes) => onEvidenceNotesChange?.(notes)}
                companyId={companyId}
                disabled={disabled}
              />
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{lang('infrastructure.rationaleCard.evidenceNotes')}</Label>
                <Textarea
                  value={evidenceNotes}
                  onChange={(e) => onEvidenceNotesChange?.(e.target.value)}
                  placeholder={lang('infrastructure.rationaleCard.evidencePlaceholder')}
                  rows={2}
                  disabled={disabled}
                  className="resize-none"
                />
              </div>
            )}

            {/* E-Signature Block */}
            {phase && onSignAsInitiator && onSignAsApprover && (
              <ValidationSignatureBlock
                phase={phase}
                signatures={signatures || {}}
                companyId={companyId}
                onSignAsInitiator={onSignAsInitiator}
                onSignAsApprover={onSignAsApprover}
                disabled={disabled}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
