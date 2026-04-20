import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  Target,
  Package,
  Calendar,
  Shield,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  BarChart3,
  Layers,
  Users,
} from 'lucide-react';

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

// ============ BOM ============
export const BOMHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Bill of Materials (BOM) is the single source of truth for every material, component, and sub-assembly
      in your medical device. It feeds into procurement, manufacturing, risk management, and regulatory submissions.
    </p>

    <HelpSection title="What the BOM Contains">
      <div className="space-y-2">
        <InfoCard title="Component Hierarchy" description="Structured tree of assemblies, sub-assemblies, and individual parts with parent-child relationships." />
        <InfoCard title="Material Specifications" description="Material names, grades, suppliers, and specifications for each item — including biocompatibility classification." />
        <InfoCard title="Supplier & Cost Data" description="Approved supplier(s), unit costs, lead times, and minimum order quantities for procurement planning." />
        <InfoCard title="Regulatory Flags" description="Critical-to-quality indicators, patient contact classification, and REACH/RoHS compliance status per item." />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Add items</strong> using the + button — specify part number, description, material, and quantity.</p>
        <p>• <strong>Link suppliers</strong> from your approved supplier list for traceability.</p>
        <p>• <strong>Flag critical items</strong> that require incoming inspection or certificates of conformity.</p>
        <p>• <strong>Revision control</strong> — each BOM change creates a new revision requiring approval.</p>
      </div>
    </HelpSection>

    <HelpSection title="ISO 13485 Requirements">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          ISO 13485 §7.5.6 requires complete identification and traceability of materials and components.
          Your BOM serves as the master record — ensure every component has a unique identifier and traceable supplier.
        </p>
      </div>
    </HelpSection>

    <TipCard>Link your BOM items to the Traceability Matrix to demonstrate end-to-end design control from requirements through materials to verification.</TipCard>

    <WarningCard>Changing a BOM item after design freeze triggers a Change Control Request (CCR). Always route BOM changes through your change management process.</WarningCard>
  </div>
);

// ============ GANTT CHART ============
export const GanttChartHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Gantt Chart provides a visual timeline of your device development project. Tasks, milestones,
      and document deadlines are displayed on a time axis with dependency tracking and critical path highlighting.
    </p>

    <HelpSection title="Key Features">
      <div className="space-y-2">
        <InfoCard title="Task Dependencies" description="Link tasks with finish-to-start, start-to-start, or other dependency types to model your workflow accurately." />
        <InfoCard title="Document Integration" description="Document tasks open the Document Draft Drawer directly — edit, review, and approve documents without leaving the timeline view." />
        <InfoCard title="Milestone Tracking" description="Phase gates and key milestones appear as diamond markers. Click to see readiness status and gate criteria." />
        <InfoCard title="Baseline Comparison" description="Compare current timeline against your approved baseline to identify drift and schedule risks." />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Drag tasks</strong> to reschedule — dependencies automatically adjust downstream dates.</p>
        <p>• <strong>Right-click</strong> for quick actions: assign, set priority, add dependency, or link to document.</p>
        <p>• <strong>Zoom</strong> in/out to switch between day, week, month, and quarter views.</p>
        <p>• <strong>Filter</strong> by assignee, phase, or status to focus on what matters.</p>
      </div>
    </HelpSection>

    <TipCard>Document-type tasks (e.g., "Draft Risk Management Plan") integrate directly with Document Studio — clicking the task opens the authoring drawer.</TipCard>
  </div>
);

// ============ ESSENTIAL GATES ============
export const EssentialGatesHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Essential Gates are phase-gate checkpoints that verify your device development is on track before advancing
      to the next lifecycle phase. Each gate has defined criteria that must be satisfied.
    </p>

    <HelpSection title="Gate Structure">
      <div className="space-y-2">
        <InfoCard title="Gate Criteria" description="Each gate defines mandatory deliverables, reviews, and approvals required for passage. Criteria are derived from your company's phase template." />
        <InfoCard title="Readiness Score" description="Percentage of completed criteria. Gates turn green at 100% — partial completion shows amber with a progress indicator." />
        <InfoCard title="Gate Reviews" description="Formal review meetings where the gate committee evaluates readiness and decides: pass, conditional pass, or hold." />
      </div>
    </HelpSection>

    <HelpSection title="Why Gates Matter">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          ISO 13485 §7.3.4 requires design reviews at suitable stages. Phase gates are your documented evidence of design review
          and management decision-making at each critical development milestone.
        </p>
      </div>
    </HelpSection>

    <TipCard>Don't skip gates even under schedule pressure — auditors will check for evidence of phase transitions and the associated review records.</TipCard>
  </div>
);

// ============ INVESTOR SHARE ============
export const InvestorShareHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Genesis Investor Share module creates a secure, read-only view of your device's business case
      that can be shared with external investors, advisors, or board members without giving them platform access.
    </p>

    <HelpSection title="What's Included">
      <div className="space-y-2">
        <InfoCard title="Business Case Summary" description="Executive overview, market sizing (TAM/SAM/SOM), competitive landscape, and financial projections." />
        <InfoCard title="Viability Scorecard" description="Technical, regulatory, and commercial readiness scores with supporting evidence." />
        <InfoCard title="Team Profile" description="Key team members, roles, and competency coverage." />
        <InfoCard title="Timeline & Milestones" description="High-level project timeline with phase gates and key deliverables." />
      </div>
    </HelpSection>

    <HelpSection title="Sharing & Access">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Generate a share link</strong> — creates a unique, time-limited URL for external access.</p>
        <p>• <strong>Access controls</strong> — set expiry dates and track who viewed the share.</p>
        <p>• <strong>Watermarking</strong> — shared views include a recipient identifier to prevent unauthorised distribution.</p>
      </div>
    </HelpSection>

    <TipCard>Complete your Genesis business case sections before sharing — incomplete sections reduce investor confidence.</TipCard>

    <WarningCard>Share links give read-only access to sensitive commercial data. Always set an expiry date and revoke access after the engagement concludes.</WarningCard>
  </div>
);

// ============ NPV ANALYSIS ============
export const NPVAnalysisHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The NPV (Net Present Value) and rNPV (risk-adjusted NPV) analysis provides financial modelling
      for your medical device development program, accounting for development costs, probability of success,
      and projected revenue streams.
    </p>

    <HelpSection title="Key Concepts">
      <div className="space-y-2">
        <InfoCard title="NPV (Net Present Value)" description="Sum of all future cash flows discounted to present value. Positive NPV means the project creates value; negative means it destroys value." />
        <InfoCard title="rNPV (Risk-Adjusted NPV)" description="NPV weighted by the cumulative probability of success at each development phase (technical LoS × regulatory LoS × commercial LoS). This is the medtech industry standard." />
        <InfoCard title="Discount Rate" description="The rate used to discount future cash flows. Typically 10-15% for medtech, reflecting the cost of capital and industry risk." />
        <InfoCard title="Likelihood of Success (LoS)" description="Probability that the project will pass each phase gate — technical feasibility, regulatory approval, and commercial adoption." />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Enter <strong>development phase costs</strong> — R&D, regulatory, clinical, manufacturing setup.</p>
        <p>• Set <strong>LoS percentages</strong> for each phase to reflect realistic probabilities.</p>
        <p>• Input <strong>revenue projections</strong> — unit price, volume, and growth trajectory.</p>
        <p>• Review the <strong>sensitivity analysis</strong> to understand which inputs have the greatest impact.</p>
      </div>
    </HelpSection>

    <TipCard>rNPV is the gold standard for medtech investment decisions. Investors and boards expect risk-adjusted projections, not unweighted NPV.</TipCard>

    <WarningCard>Be conservative with LoS estimates. Industry data suggests 60-70% technical LoS, 70-85% regulatory LoS, and 50-70% commercial LoS for novel Class II/III devices.</WarningCard>
  </div>
);

// ============ COMPLIANCE INSTANCES ============
export const ComplianceInstancesHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Compliance Instances (CIs) are the regulated document registry for your device. Each CI represents
      a unique regulatory document with a UUID that serves as the single source of truth for its identity,
      version history, and approval status.
    </p>

    <HelpSection title="Core Concepts">
      <div className="space-y-2">
        <InfoCard title="CI UUID" description="Every document gets a unique identifier at creation. This UUID is permanent — it follows the document through all revisions and never changes." />
        <InfoCard title="Document Status" description="Draft → In Review → Approved → Superseded. Each transition is logged in the audit trail with the responsible user." />
        <InfoCard title="Version Control" description="CI Version is the formal version number (1.0, 2.0). Content Snapshots track every save. Phase Template Version tracks the template used." />
        <InfoCard title="Regulatory Linking" description="CIs are linked to regulatory dossier sections, gap analysis items, and traceability matrix entries via their UUID." />
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Create a CI</strong> to register a new regulated document — this assigns the UUID immediately.</p>
        <p>• <strong>Open the Draft Drawer</strong> to author or edit the document content in Document Studio.</p>
        <p>• <strong>Submit for Review</strong> when the document is ready for formal review and approval.</p>
        <p>• <strong>Link to Dossier</strong> — attach the CI to the relevant Technical File section.</p>
      </div>
    </HelpSection>

    <TipCard>The CI UUID is the anchor for all regulatory traceability. Never delete a CI — supersede it instead to maintain the audit trail.</TipCard>
  </div>
);

// ============ PRODUCT DEFINITION PAGE ============
export const ProductDefinitionPageHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Product Definition page is your device's identity card — it captures all the fundamental
      information that drives classification, regulatory strategy, and documentation requirements.
    </p>

    <HelpSection title="What to Define">
      <div className="space-y-2">
        <InfoCard title="Device Description" description="Clear, concise description of what the device is, how it works, and its physical/software characteristics." />
        <InfoCard title="Intended Use & Purpose" description="The specific medical purpose, target patient population, and clinical indication — this drives your entire regulatory strategy." />
        <InfoCard title="Classification" description="Risk class (I, IIa, IIb, III under MDR; Class I, II, III under FDA) based on intended use, duration of contact, and invasiveness." />
        <InfoCard title="Target Markets" description="Geographic markets where you plan to sell — each market has distinct regulatory requirements." />
      </div>
    </HelpSection>

    <HelpSection title="Why It Matters">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Your device definition determines everything downstream: which standards apply, what clinical evidence is needed,
          which conformity assessment route to follow, and how complex your technical file will be. Getting it right early
          saves months of rework.
        </p>
      </div>
    </HelpSection>

    <TipCard>Complete the Intended Use and Classification first — these two fields drive the entire regulatory strategy and determine which gap analysis frameworks appear.</TipCard>
  </div>
);

// ============ PRODUCT AUDIT LOG ============
export const ProductAuditLogHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Device Audit Trail provides a 21 CFR Part 11 compliant record of all actions performed
      on this device's documents and records. It answers: Who did What, When, and Why.
    </p>

    <HelpSection title="What's Tracked">
      <div className="space-y-2">
        <InfoCard title="Document Actions" description="Creation, editing, review submission, approval, rejection, and supersession of every document CI." />
        <InfoCard title="Record Changes" description="Modifications to device definition, classification, risk assessments, and design control records." />
        <InfoCard title="User Attribution" description="Every action is attributed to a specific authenticated user with timestamp and session information." />
        <InfoCard title="Reason Logging" description="Changes that require justification (e.g., post-approval edits) capture the reason/rationale." />
      </div>
    </HelpSection>

    <HelpSection title="21 CFR Part 11 Compliance">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          The audit trail is append-only and tamper-evident. Entries cannot be modified or deleted.
          This meets the FDA's requirements for electronic records and electronic signatures under 21 CFR Part 11.
        </p>
      </div>
    </HelpSection>

    <HelpSection title="How to Use It">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Filter by user</strong> to see all actions by a specific team member.</p>
        <p>• <strong>Filter by date range</strong> to focus on a specific period (e.g., during an audit).</p>
        <p>• <strong>Search</strong> for specific documents or actions using the search bar.</p>
        <p>• <strong>Export CSV</strong> for offline analysis or to provide to auditors.</p>
      </div>
    </HelpSection>

    <TipCard>During regulatory audits, export the audit trail for the review period and provide it proactively — this demonstrates process maturity and transparency.</TipCard>
  </div>
);
