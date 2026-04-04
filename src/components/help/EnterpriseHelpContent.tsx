import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Lightbulb, AlertCircle, ArrowRight, Info,
  Shield, FileWarning, AlertTriangle, ClipboardCheck,
  Building2, Wrench, Users, FileText, Globe, BarChart3, Target, DollarSign
} from 'lucide-react';

// Reusable components (same pattern as helpContentRegistry)
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">{title}</h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const WarningCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const InfoCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-3 bg-muted/50 rounded-lg border">
    <h5 className="font-medium text-sm mb-1">{title}</h5>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const StepList: React.FC<{ steps: string[] }> = ({ steps }) => (
  <ol className="space-y-2 text-sm text-muted-foreground">
    {steps.map((step, idx) => (
      <li key={idx} className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
          {idx + 1}
        </span>
        <span>{step}</span>
      </li>
    ))}
  </ol>
);

const RegulatoryBadge: React.FC<{ standard: string }> = ({ standard }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
    <Shield className="h-3 w-3 mr-1" />
    {standard}
  </span>
);

// ============ NC TRENDS ============
export const NCTrendsHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.ncTrends';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §8.3" />
      <RegulatoryBadge standard="21 CFR 820.90" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleShows`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.trendingDashboard`)} description={lang(`${k}.trendingDashboardDesc`)} />
        <InfoCard title={lang(`${k}.crossDeviceAnalysis`)} description={lang(`${k}.crossDeviceAnalysisDesc`)} />
        <InfoCard title={lang(`${k}.rootCauseDistribution`)} description={lang(`${k}.rootCauseDistributionDesc`)} />
        <InfoCard title={lang(`${k}.closureMetrics`)} description={lang(`${k}.closureMetricsDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`), lang(`${k}.step5`)]} />
    </HelpSection>

    <HelpSection title={lang(`${k}.auditorExpectations`)}>
      <p className="text-sm text-muted-foreground">{lang(`${k}.auditorIntro`)}</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
        <li>{lang(`${k}.auditorQ1`)}</li>
        <li>{lang(`${k}.auditorQ2`)}</li>
        <li>{lang(`${k}.auditorQ3`)}</li>
      </ul>
    </HelpSection>

    <WarningCard>{lang(`${k}.warning`)}</WarningCard>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ CAPA TRENDS ============
export const CAPATrendsHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.capaTrends';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §8.5.2/8.5.3" />
      <RegulatoryBadge standard="21 CFR 820.198" />
      <RegulatoryBadge standard="QMSR §820.198" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleShows`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.healthIndex`)} description={lang(`${k}.healthIndexDesc`)} />
        <InfoCard title={lang(`${k}.statusDistribution`)} description={lang(`${k}.statusDistributionDesc`)} />
        <InfoCard title={lang(`${k}.sourceAnalysis`)} description={lang(`${k}.sourceAnalysisDesc`)} />
        <InfoCard title={lang(`${k}.agingDistribution`)} description={lang(`${k}.agingDistributionDesc`)} />
        <InfoCard title={lang(`${k}.effectivenessTracking`)} description={lang(`${k}.effectivenessTrackingDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`), lang(`${k}.step5`)]} />
    </HelpSection>

    <HelpSection title={lang(`${k}.auditorExpectations`)}>
      <p className="text-sm text-muted-foreground">{lang(`${k}.auditorIntro`)}</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
        <li>{lang(`${k}.auditorQ1`)}</li>
        <li>{lang(`${k}.auditorQ2`)}</li>
        <li>{lang(`${k}.auditorQ3`)}</li>
        <li>{lang(`${k}.auditorQ4`)}</li>
        <li>{lang(`${k}.auditorQ5`)}</li>
      </ul>
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ GLOBAL CHANGE CONTROL ============
export const GlobalChangeControlHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.changeControl';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §7.3.9" />
      <RegulatoryBadge standard="21 CFR 820.30(i)" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleShows`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.changeRequestDashboard`)} description={lang(`${k}.changeRequestDashboardDesc`)} />
        <InfoCard title={lang(`${k}.impactAssessment`)} description={lang(`${k}.impactAssessmentDesc`)} />
        <InfoCard title={lang(`${k}.approvalWorkflow`)} description={lang(`${k}.approvalWorkflowDesc`)} />
        <InfoCard title={lang(`${k}.implementationTracking`)} description={lang(`${k}.implementationTrackingDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`), lang(`${k}.step5`)]} />
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ MANAGEMENT REVIEW ============
export const ManagementReviewHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.managementReview';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §5.6" />
      <RegulatoryBadge standard="21 CFR 820.20" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.requiredInputs`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.auditResults`)} description={lang(`${k}.auditResultsDesc`)} />
        <InfoCard title={lang(`${k}.customerFeedback`)} description={lang(`${k}.customerFeedbackDesc`)} />
        <InfoCard title={lang(`${k}.processPerformance`)} description={lang(`${k}.processPerformanceDesc`)} />
        <InfoCard title={lang(`${k}.capaStatus`)} description={lang(`${k}.capaStatusDesc`)} />
        <InfoCard title={lang(`${k}.regulatoryChanges`)} description={lang(`${k}.regulatoryChangesDesc`)} />
        <InfoCard title={lang(`${k}.previousFollowups`)} description={lang(`${k}.previousFollowupsDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.requiredOutputs`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.improvementDecisions`)} description={lang(`${k}.improvementDecisionsDesc`)} />
        <InfoCard title={lang(`${k}.resourceNeeds`)} description={lang(`${k}.resourceNeedsDesc`)} />
        <InfoCard title={lang(`${k}.regulatoryActions`)} description={lang(`${k}.regulatoryActionsDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`), lang(`${k}.step5`)]} />
    </HelpSection>

    <WarningCard>{lang(`${k}.warning`)}</WarningCard>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ DESIGN REVIEW (ENTERPRISE) ============
export const EnterpriseDesignReviewHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.designReview';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §7.3.5" />
      <RegulatoryBadge standard="21 CFR 820.30(e)" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleShows`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.reviewCalendar`)} description={lang(`${k}.reviewCalendarDesc`)} />
        <InfoCard title={lang(`${k}.crossDeviceStatus`)} description={lang(`${k}.crossDeviceStatusDesc`)} />
        <InfoCard title={lang(`${k}.findingsActionItems`)} description={lang(`${k}.findingsActionItemsDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.auditorExpectations`)}>
      <p className="text-sm text-muted-foreground">{lang(`${k}.auditorIntro`)}</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
        <li>{lang(`${k}.auditorQ1`)}</li>
        <li>{lang(`${k}.auditorQ2`)}</li>
        <li>{lang(`${k}.auditorQ3`)}</li>
      </ul>
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ INFRASTRUCTURE ============
export const InfrastructureHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.infrastructure';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §6.3" />
      <RegulatoryBadge standard="21 CFR 820.70(f)" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.categories`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.facilities`)} description={lang(`${k}.facilitiesDesc`)} />
        <InfoCard title={lang(`${k}.processEquipment`)} description={lang(`${k}.processEquipmentDesc`)} />
        <InfoCard title={lang(`${k}.digitalSystems`)} description={lang(`${k}.digitalSystemsDesc`)} />
        <InfoCard title={lang(`${k}.supportingServices`)} description={lang(`${k}.supportingServicesDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`), lang(`${k}.step5`)]} />
    </HelpSection>

    <WarningCard>{lang(`${k}.warning`)}</WarningCard>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ CALIBRATION SCHEDULE ============
export const CalibrationScheduleHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.calibration';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §7.6" />
      <RegulatoryBadge standard="21 CFR 820.72" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleManages`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.equipmentRegistry`)} description={lang(`${k}.equipmentRegistryDesc`)} />
        <InfoCard title={lang(`${k}.calibrationCalendar`)} description={lang(`${k}.calibrationCalendarDesc`)} />
        <InfoCard title={lang(`${k}.calibrationRecords`)} description={lang(`${k}.calibrationRecordsDesc`)} />
        <InfoCard title={lang(`${k}.outOfTolerance`)} description={lang(`${k}.outOfToleranceDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.auditorExpectations`)}>
      <p className="text-sm text-muted-foreground">{lang(`${k}.auditorIntro`)}</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
        <li>{lang(`${k}.auditorQ1`)}</li>
        <li>{lang(`${k}.auditorQ2`)}</li>
        <li>{lang(`${k}.auditorQ3`)}</li>
        <li>{lang(`${k}.auditorQ4`)}</li>
      </ul>
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ COMPETENCY MATRIX ============
export const CompetencyMatrixHelp: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §6.2" />
      <RegulatoryBadge standard="21 CFR 820.25" />
    </div>
    <p className="text-sm text-muted-foreground">
      The Competency Matrix maps every team member's qualifications against the competencies required for their role. ISO 13485 requires that personnel performing work affecting product quality are competent based on education, training, skills, and experience.
    </p>

    <HelpSection title="What This Module Shows">
      <div className="space-y-2">
        <InfoCard
          title="Role-Competency Mapping"
          description="For each role (e.g., Design Engineer, Quality Manager, RA Specialist), define the required competencies: technical skills, regulatory knowledge, process qualifications."
        />
        <InfoCard
          title="Gap Analysis"
          description="Automatically identifies gaps where team members lack required competencies for their assigned roles. Each gap becomes a training need."
        />
        <InfoCard
          title="Training Status"
          description="Cross-reference with the Training Management module to show which training courses address which competency gaps."
        />
        <InfoCard
          title="Qualification Evidence"
          description="Attach certificates, diplomas, assessment results, and on-the-job training records as evidence of competence."
        />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <StepList steps={[
        "Define competency requirements for each role in your organization",
        "Assign team members to their roles",
        "Review the auto-generated gap analysis for unmet competencies",
        "Create training plans to address gaps",
        "Upload evidence as training is completed",
        "Review the matrix annually and after organizational changes"
      ]} />
    </HelpSection>

    <TipCard>
      The Competency Matrix is a living document. Update it whenever roles change, new regulations apply, or new products are added to the portfolio.
    </TipCard>
  </div>
);

// ============ QMS GAP ANALYSIS ============
export const QMSGapAnalysisHelp: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485:2016" />
      <RegulatoryBadge standard="21 CFR Part 820 / QMSR" />
    </div>
    <p className="text-sm text-muted-foreground">
      QMS Gap Analysis evaluates your Quality Management System against ISO 13485 requirements clause-by-clause. This is an organizational-level assessment — it examines whether your QMS procedures, processes, and records meet the standard's requirements, not whether a specific device's technical file is complete.
    </p>

    <HelpSection title="What This Module Does">
      <div className="space-y-2">
        <InfoCard
          title="Clause-by-Clause Assessment"
          description="Systematically evaluate each ISO 13485 clause: is it addressed? Partially implemented? Fully compliant? Not applicable?"
        />
        <InfoCard
          title="Evidence Linking"
          description="For each clause, link to the SOPs, records, and processes that demonstrate compliance. Missing evidence highlights gaps."
        />
        <InfoCard
          title="Compliance Score"
          description="Visual dashboard showing overall QMS compliance percentage and breakdown by clause section (4-8)."
        />
        <InfoCard
          title="Remediation Planning"
          description="For each gap, create action items with owners, due dates, and priority. Track progress toward full compliance."
        />
      </div>
    </HelpSection>

    <HelpSection title="When to Use It">
      <StepList steps={[
        "Before initial certification — assess readiness for the certification audit",
        "After major organizational changes — new processes, restructuring, M&A activity",
        "Before surveillance audits — identify and fix gaps proactively",
        "After standard revisions — evaluate impact of updated requirements",
        "As part of annual QMS review during Management Review"
      ]} />
    </HelpSection>

    <WarningCard>
      This is different from device-level GSPR gap analysis. QMS Gap Analysis assesses the organizational quality system; GSPR analysis assesses device-specific safety requirements.
    </WarningCard>

    <TipCard>
      Run the gap analysis 3-6 months before your next audit. This gives enough time to close identified gaps and create evidence of compliance.
    </TipCard>
  </div>
);

// ============ COMPLIANCE ACTIVITIES ============
export const ComplianceActivitiesHelp: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §4.1" />
    </div>
    <p className="text-sm text-muted-foreground">
      Compliance Activities tracks actionable tasks arising from QMS requirements — audit findings, gap analysis remediation, regulatory change implementations, and process improvement initiatives. Think of it as the "to-do list" for your quality system.
    </p>

    <HelpSection title="Activity Types">
      <div className="space-y-2">
        <InfoCard
          title="Audit Follow-ups"
          description="Action items from internal or external audits that need resolution before the next audit cycle."
        />
        <InfoCard
          title="Gap Remediation"
          description="Tasks generated from QMS Gap Analysis to address identified weaknesses in your quality system."
        />
        <InfoCard
          title="Regulatory Updates"
          description="Implementation tasks for new or changed regulations — updating SOPs, retraining staff, modifying processes."
        />
        <InfoCard
          title="Process Improvements"
          description="Proactive quality improvement initiatives beyond minimum compliance requirements."
        />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <StepList steps={[
        "Activities are auto-created from audit findings, gap analysis, and CAPA actions",
        "Assign owners and set realistic due dates",
        "Track progress through status workflow (Open → In Progress → Review → Closed)",
        "Attach evidence of completion (updated SOPs, training records, etc.)",
        "Review open activities in Management Review"
      ]} />
    </HelpSection>

    <TipCard>
      Use Compliance Activities as the single source of truth for all quality-related tasks. This prevents action items from getting lost across emails, spreadsheets, and meeting notes.
    </TipCard>
  </div>
);

// ============ GLOBAL QUALITY MANUAL ============
export const GlobalQualityManualHelp: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §4.2.2" />
    </div>
    <p className="text-sm text-muted-foreground">
      The Global Quality Manual is the top-level document of your Quality Management System. It defines your organization's quality policy, QMS scope, process interactions, and the framework for all subordinate SOPs and work instructions.
    </p>

    <HelpSection title="Required Contents">
      <div className="space-y-2">
        <InfoCard
          title="QMS Scope"
          description="What products, processes, and sites are covered by your QMS? Any exclusions must be justified (e.g., excluding design controls for a manufacturer that only produces to customer specifications)."
        />
        <InfoCard
          title="Quality Policy"
          description="Top management's commitment to quality, regulatory compliance, and continual improvement. Must be communicated, understood, and reviewed for continuing suitability."
        />
        <InfoCard
          title="Process Interactions"
          description="A process map showing how your QMS processes relate to each other — design controls, production, purchasing, monitoring, improvement."
        />
        <InfoCard
          title="Document Hierarchy"
          description="How your documentation system is structured: Quality Manual → SOPs → Work Instructions → Forms & Records."
        />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <StepList steps={[
        "Define your QMS scope including all applicable ISO 13485 clauses",
        "Document your quality policy and get top management sign-off",
        "Map your process interactions showing inputs, outputs, and responsibilities",
        "Reference your SOPs by section (don't duplicate SOP content in the manual)",
        "Review and update during Management Review — the manual is a living document"
      ]} />
    </HelpSection>

    <TipCard>
      Keep the Quality Manual concise (15-30 pages). It should provide the framework and reference SOPs for details — not try to contain all procedure details itself.
    </TipCard>
  </div>
);

// ============ IP MANAGEMENT ============
export const IPManagementHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      IP Management provides a centralized view of your organization's intellectual property portfolio — patents, trademarks, trade secrets, and licensing agreements. For MedTech companies, IP strategy directly impacts market exclusivity, valuation, and competitive positioning.
    </p>

    <HelpSection title="What This Module Manages">
      <div className="space-y-2">
        <InfoCard
          title="Patent Portfolio"
          description="Track patent applications, grants, expirations, and maintenance fees across jurisdictions. Link patents to specific devices and technology areas."
        />
        <InfoCard
          title="Trademark Registry"
          description="Brand names, logos, and product identifiers registered in each market. Monitor renewal dates and opposition proceedings."
        />
        <InfoCard
          title="Trade Secrets"
          description="Confidential manufacturing processes, algorithms, and know-how. Document access controls and NDA coverage."
        />
        <InfoCard
          title="Licensing Agreements"
          description="Inbound and outbound licenses — technology you license from others and IP you license to partners."
        />
      </div>
    </HelpSection>

    <HelpSection title="Strategic Considerations">
      <StepList steps={[
        "Map IP to products: which patents protect which devices?",
        "Monitor patent expiry dates and plan for post-patent revenue decline",
        "Identify freedom-to-operate risks before entering new markets",
        "Track competitor patent filings in your technology space",
        "Include IP status in investment and M&A due diligence packages"
      ]} />
    </HelpSection>

    <TipCard>
      Patent expiry dates should feed into your Commercial Intelligence financial models — post-patent decline rates typically range from 20-40% annually in MedTech.
    </TipCard>
  </div>
);

// ============ AUDIT LOG ============
export const AuditLogHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpEnterprise.auditLog';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-2 flex-wrap">
      <RegulatoryBadge standard="ISO 13485 §4.2.5" />
      <RegulatoryBadge standard="21 CFR Part 11" />
    </div>
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatGetsLogged`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.documentActions`)} description={lang(`${k}.documentActionsDesc`)} />
        <InfoCard title={lang(`${k}.recordChanges`)} description={lang(`${k}.recordChangesDesc`)} />
        <InfoCard title={lang(`${k}.userActions`)} description={lang(`${k}.userActionsDesc`)} />
        <InfoCard title={lang(`${k}.systemEvents`)} description={lang(`${k}.systemEventsDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.howToUseIt`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`)]} />
    </HelpSection>

    <WarningCard>{lang(`${k}.warning`)}</WarningCard>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ COMMERCIAL INTELLIGENCE ============
export const CommercialIntelligenceHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.commercialIntelligence';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.modules.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.modules.blueprint.title`)} description={lang(`${k}.modules.blueprint.description`)} />
        <InfoCard title={lang(`${k}.modules.canvas.title`)} description={lang(`${k}.modules.canvas.description`)} />
        <InfoCard title={lang(`${k}.modules.market.title`)} description={lang(`${k}.modules.market.description`)} />
        <InfoCard title={lang(`${k}.modules.performance.title`)} description={lang(`${k}.modules.performance.description`)} />
        <InfoCard title={lang(`${k}.modules.pricing.title`)} description={lang(`${k}.modules.pricing.description`)} />
        <InfoCard title={lang(`${k}.modules.access.title`)} description={lang(`${k}.modules.access.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ STRATEGIC BLUEPRINT ============
export const StrategicBlueprintHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.strategicBlueprint';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.components.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.components.vision.title`)} description={lang(`${k}.components.vision.description`)} />
        <InfoCard title={lang(`${k}.components.positioning.title`)} description={lang(`${k}.components.positioning.description`)} />
        <InfoCard title={lang(`${k}.components.growth.title`)} description={lang(`${k}.components.growth.description`)} />
        <InfoCard title={lang(`${k}.components.kpis.title`)} description={lang(`${k}.components.kpis.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ MARKET ANALYSIS (ENTERPRISE) ============
export const EnterpriseMarketAnalysisHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.enterpriseMarketAnalysis';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.modules.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.modules.marketMap.title`)} description={lang(`${k}.modules.marketMap.description`)} />
        <InfoCard title={lang(`${k}.modules.competitive.title`)} description={lang(`${k}.modules.competitive.description`)} />
        <InfoCard title={lang(`${k}.modules.growth.title`)} description={lang(`${k}.modules.growth.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ COMMERCIAL PERFORMANCE ============
export const CommercialPerformanceHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.commercialPerformance';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.metrics.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.metrics.revenue.title`)} description={lang(`${k}.metrics.revenue.description`)} />
        <InfoCard title={lang(`${k}.metrics.margin.title`)} description={lang(`${k}.metrics.margin.description`)} />
        <InfoCard title={lang(`${k}.metrics.marketLevel.title`)} description={lang(`${k}.metrics.marketLevel.description`)} />
        <InfoCard title={lang(`${k}.metrics.cac.title`)} description={lang(`${k}.metrics.cac.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ PRICING STRATEGY ============
export const EnterprisePricingStrategyHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.pricingStrategy';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.components.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.components.framework.title`)} description={lang(`${k}.components.framework.description`)} />
        <InfoCard title={lang(`${k}.components.consistency.title`)} description={lang(`${k}.components.consistency.description`)} />
        <InfoCard title={lang(`${k}.components.corridors.title`)} description={lang(`${k}.components.corridors.description`)} />
        <InfoCard title={lang(`${k}.components.reimbursement.title`)} description={lang(`${k}.components.reimbursement.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ GLOBAL MARKET ACCESS ============
export const GlobalMarketAccessHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'qmsArchitectureHelp.marketAccess';
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatModuleCovers`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.marketEntryStrategy`)} description={lang(`${k}.marketEntryStrategyDesc`)} />
        <InfoCard title={lang(`${k}.registrationStatus`)} description={lang(`${k}.registrationStatusDesc`)} />
        <InfoCard title={lang(`${k}.localRequirements`)} description={lang(`${k}.localRequirementsDesc`)} />
        <InfoCard title={lang(`${k}.reimbursementLandscape`)} description={lang(`${k}.reimbursementLandscapeDesc`)} />
      </div>
    </HelpSection>

    <HelpSection title={lang(`${k}.strategicQuestions`)}>
      <StepList steps={[lang(`${k}.step1`), lang(`${k}.step2`), lang(`${k}.step3`), lang(`${k}.step4`)]} />
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};
