import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Users, DollarSign, BookOpen, Award, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { ClinicalEvidencePlan, StudyDesign } from '@/types/investorModules';

interface InvestorClinicalEvidenceProps {
  data: ClinicalEvidencePlan | null;
  deviceClass?: string | null;
}

// PMCF requirements and implications by device class
const pmcfRequirementsByClass: Record<string, {
  requirement: 'mandatory' | 'recommended' | 'optional';
  frequency: string;
  scope: string;
  keyActivities: string[];
  regulatoryBasis: string;
  implication: string;
}> = {
  'I': {
    requirement: 'optional',
    frequency: 'As needed',
    scope: 'Limited scope based on clinical claims',
    keyActivities: [
      'Complaint monitoring',
      'Literature review',
      'Clinical claims validation'
    ],
    regulatoryBasis: 'EU MDR Article 61(10)',
    implication: 'For Class I devices, PMCF is generally not mandatory unless clinical claims require ongoing substantiation. The focus is on vigilance and complaint handling.'
  },
  'IIa': {
    requirement: 'recommended',
    frequency: 'Periodic (typically every 2-5 years)',
    scope: 'Proactive evidence collection recommended',
    keyActivities: [
      'PMCF surveys or registries',
      'Systematic literature review',
      'Clinical performance monitoring',
      'User feedback analysis'
    ],
    regulatoryBasis: 'EU MDR Article 61(11)',
    implication: 'Class IIa devices should demonstrate ongoing safety and performance. PMCF activities help confirm benefit-risk ratio remains acceptable and support periodic safety update reports (PSURs).'
  },
  'IIb': {
    requirement: 'mandatory',
    frequency: 'Continuous with annual reporting',
    scope: 'Comprehensive proactive surveillance',
    keyActivities: [
      'PMCF study (registry or survey)',
      'Active vigilance monitoring',
      'Systematic literature surveillance',
      'Clinical performance evaluation',
      'Risk-benefit analysis updates'
    ],
    regulatoryBasis: 'EU MDR Article 61(11), Annex XIV Part B',
    implication: 'Class IIb devices require mandatory PMCF to continuously confirm clinical safety and performance. This directly impacts Notified Body surveillance audits and CE marking renewal.'
  },
  'III': {
    requirement: 'mandatory',
    frequency: 'Continuous with annual reporting',
    scope: 'Rigorous ongoing clinical surveillance',
    keyActivities: [
      'PMCF study (clinical investigation or registry)',
      'Long-term safety follow-up',
      'Proactive vigilance system',
      'Systematic clinical literature review',
      'Real-world evidence collection',
      'Periodic benefit-risk reassessment'
    ],
    regulatoryBasis: 'EU MDR Article 61(12), Annex XIV Part B',
    implication: 'Class III (highest risk) devices have the most stringent PMCF requirements. Notified Bodies expect well-defined PMCF studies with clear endpoints. Failure to demonstrate ongoing safety can trigger conformity assessment reviews.'
  }
};

// Normalize device class for lookup
function normalizeClassForLookup(deviceClass: string | null | undefined): string | null {
  if (!deviceClass) return null;
  const normalized = deviceClass.toLowerCase().replace(/^class[\s-]*/, '').trim();
  const classMap: Record<string, string> = {
    'i': 'I', 'is': 'I', 'im': 'I', 'ir': 'I',
    'iia': 'IIa', 'iib': 'IIb',
    'iii': 'III'
  };
  return classMap[normalized] || null;
}

function formatCurrency(value: number | null, currency: string = 'USD'): string {
  if (!value) return '—';
  const symbol = currency === 'EUR' ? '€' : '$';
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  return `${symbol}${(value / 1_000).toFixed(0)}K`;
}

export function InvestorClinicalEvidence({ data, deviceClass }: InvestorClinicalEvidenceProps) {
  const normalizedClass = normalizeClassForLookup(deviceClass);
  const pmcfInfo = normalizedClass ? pmcfRequirementsByClass[normalizedClass] : null;
  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Clinical evidence plan not yet defined
        </CardContent>
      </Card>
    );
  }

  const studyDesign = (data.study_design || {}) as StudyDesign;
  const hasStudyDesign = studyDesign?.type || studyDesign?.sample_size || (studyDesign?.endpoints && studyDesign.endpoints.length > 0);
  const hasKOLs = data.kols && Array.isArray(data.kols) && data.kols.length > 0;
  const hasLiterature = data.supporting_literature && Array.isArray(data.supporting_literature) && data.supporting_literature.length > 0;
  const hasStakeholderReqs = data.regulator_requirements || data.payer_requirements || data.physician_requirements;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Clinical Evidence Plan</h3>
      </div>

      {/* Evidence Requirements by Stakeholder */}
      {hasStakeholderReqs && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evidence Requirements by Stakeholder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.regulator_requirements && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Regulators</p>
                  <p className="text-sm">{data.regulator_requirements}</p>
                </div>
              )}
              {data.payer_requirements && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Payers</p>
                  <p className="text-sm">{data.payer_requirements}</p>
                </div>
              )}
              {data.physician_requirements && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">Physicians</p>
                  <p className="text-sm">{data.physician_requirements}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Design */}
      {hasStudyDesign && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Design</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {studyDesign.type && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Study Type</p>
                  <p className="font-semibold">{studyDesign.type}</p>
                </div>
              )}
              {studyDesign.sample_size && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Sample Size</p>
                  <p className="font-semibold">{studyDesign.sample_size} patients</p>
                </div>
              )}
              {studyDesign.duration_months && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">{studyDesign.duration_months} months</p>
                </div>
              )}
              {studyDesign.control && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Control</p>
                  <p className="font-semibold">{studyDesign.control}</p>
                </div>
              )}
            </div>

            {studyDesign.endpoints && studyDesign.endpoints.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Endpoints</p>
                <div className="flex flex-wrap gap-2">
                  {studyDesign.endpoints.map((endpoint, idx) => (
                    <Badge key={idx} variant="outline">{endpoint}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline & Budget */}
      {(data.study_start_date || data.study_end_date || data.study_budget) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.study_start_date && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study Start</p>
                    <p className="font-semibold">{data.study_start_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.study_end_date && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study End</p>
                    <p className="font-semibold">{data.study_end_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.study_budget && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study Budget</p>
                    <p className="font-semibold">{formatCurrency(data.study_budget, data.study_budget_currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PMCF Requirements */}
      {data.pmcf_required && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Post-Market Clinical Follow-up (PMCF) Required
                </CardTitle>
              </div>
              {pmcfInfo && (
                <Badge 
                  variant={pmcfInfo.requirement === 'mandatory' ? 'destructive' : pmcfInfo.requirement === 'recommended' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {pmcfInfo.requirement === 'mandatory' ? 'Mandatory' : pmcfInfo.requirement === 'recommended' ? 'Recommended' : 'Optional'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custom PMCF Plan if provided */}
            {data.pmcf_plan && (
              <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <p className="text-sm font-medium mb-1">PMCF Plan</p>
                <p className="text-sm text-muted-foreground">{data.pmcf_plan}</p>
              </div>
            )}
            
            {/* Device Class Context */}
            {pmcfInfo && normalizedClass && (
              <div className="space-y-4">
                {/* Implication Summary */}
                <div className="flex gap-3 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                      What this means for Class {normalizedClass}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400/90">
                      {pmcfInfo.implication}
                    </p>
                  </div>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Monitoring Frequency</p>
                    <p className="text-sm font-medium">{pmcfInfo.frequency}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Regulatory Basis</p>
                    <p className="text-sm font-medium">{pmcfInfo.regulatoryBasis}</p>
                  </div>
                </div>

                {/* Required Activities */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Key PMCF Activities for Class {normalizedClass}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pmcfInfo.keyActivities.map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <span className="font-medium">Scope: </span>{pmcfInfo.scope}
                </div>
              </div>
            )}

            {/* Fallback if no device class info */}
            {!pmcfInfo && !data.pmcf_plan && (
              <p className="text-sm text-muted-foreground">
                Post-Market Clinical Follow-up is required for this device. Specific requirements depend on the device classification and intended purpose.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* KOL Engagement */}
      {hasKOLs && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Key Opinion Leaders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.kol_strategy && (
              <p className="text-sm text-muted-foreground mb-4">{data.kol_strategy}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.kols.map((kol, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{kol.name}</p>
                    <p className="text-xs text-muted-foreground">{kol.institution}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{kol.role}</Badge>
                    {kol.engaged && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" title="Engaged" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supporting Literature */}
      {hasLiterature && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Supporting Literature</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.supporting_literature.map((lit, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{lit.citation}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lit.relevance}</p>
                  {lit.url && (
                    <a href={lit.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      View publication →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
