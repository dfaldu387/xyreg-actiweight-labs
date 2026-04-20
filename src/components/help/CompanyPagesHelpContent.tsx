import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Lightbulb,
  FileText,
  Target,
  Package,
  Shield,
  Users,
  DollarSign,
  BarChart3,
  Barcode,
  Layers,
  Store,
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

// ============ PERMISSIONS ============
export const CompanyPermissionsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Permissions page manages who can access what within your organisation. Roles, departments,
      and individual access rights are configured here to enforce the principle of least privilege.
    </p>

    <HelpSection title="Role Types">
      <div className="space-y-2">
        <InfoCard title="Owner" description="Full administrative control including billing, user management, and all data. Cannot be removed — only transferred." />
        <InfoCard title="Admin" description="Can manage users, roles, and settings. Cannot transfer ownership or access billing." />
        <InfoCard title="Editor" description="Can create, edit, and submit documents. Cannot approve documents or manage users." />
        <InfoCard title="Viewer" description="Read-only access to assigned products and documents. Cannot make any changes." />
        <InfoCard title="Consultant" description="Functionally equivalent to Editor. Used for external users who need editing access." />
      </div>
    </HelpSection>

    <HelpSection title="ISO 13485 Requirements">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          ISO 13485 §5.5.1 requires defined responsibilities and authorities. Document who can author, review, and approve
          documents — auditors will check that approvals were made by authorised personnel.
        </p>
      </div>
    </HelpSection>

    <TipCard>Assign product-specific access to limit who can see and edit each device's data. This is especially important for confidential pre-launch projects.</TipCard>

    <WarningCard>Always have at least two users with Admin or Owner role to prevent lockout if someone leaves the organisation.</WarningCard>
  </div>
);

// ============ PRODUCTS LIST ============
export const CompanyProductsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Products page shows all medical devices in your portfolio. Each product card displays
      key status indicators: lifecycle phase, classification, compliance score, and document completeness.
    </p>

    <HelpSection title="Product Management">
      <div className="space-y-2">
        <InfoCard title="Add a Product" description="Click '+ New Product' to register a new medical device. You'll define its name, description, classification, and intended markets." />
        <InfoCard title="Product Families" description="Group related products into families (e.g., different sizes of the same device). Family members share risk analysis and design history." />
        <InfoCard title="Lifecycle Phases" description="Each product progresses through phases (Concept → Feasibility → Design → Verification → Validation → Production). Active phases determine what work is in scope." />
      </div>
    </HelpSection>

    <HelpSection title="Bulk Operations">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Select multiple products using checkboxes to perform bulk operations.</p>
        <p>• Available bulk actions: change phase, assign team members, export data, archive.</p>
        <p>• The amber action bar appears when products are selected.</p>
      </div>
    </HelpSection>

    <TipCard>Use product families for variant management — it reduces duplication of risk analysis, requirements, and shared design documentation.</TipCard>
  </div>
);

// ============ PORTFOLIO LANDING ============
export const CompanyPortfolioLandingHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Portfolio Landing page provides a strategic overview of your entire device portfolio —
      financial health, project status, regulatory readiness, and resource allocation across all products.
    </p>

    <HelpSection title="Portfolio Tabs">
      <div className="space-y-2">
        <InfoCard title="Financial Overview" description="Revenue projections, development costs, and rNPV analysis across the portfolio. Includes budget burn rate and runway." />
        <InfoCard title="Project Health" description="Status of each product's development: on-track, at-risk, or delayed. Aggregated from milestone and gate data." />
        <InfoCard title="Resource Allocation" description="Team assignment matrix showing who is working on what and identifying resource bottlenecks." />
        <InfoCard title="Regulatory Pipeline" description="Submission status and timeline for each product across target markets." />
      </div>
    </HelpSection>

    <TipCard>Use the portfolio view for management reviews (ISO 13485 §5.6) — it provides the data needed to assess resource adequacy and product status.</TipCard>
  </div>
);

// ============ BUDGET DASHBOARD ============
export const CompanyBudgetHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Budget Dashboard tracks financial planning and expenditure across your device development programs.
      It provides burn rate analysis, budget vs. actual comparisons, and forecasting tools.
    </p>

    <HelpSection title="Key Metrics">
      <div className="space-y-2">
        <InfoCard title="Budget vs. Actual" description="Compare planned spending against actual expenditure by category (R&D, regulatory, clinical, manufacturing)." />
        <InfoCard title="Burn Rate" description="Monthly spending rate with runway projection — how many months of funding remain at current spending." />
        <InfoCard title="Cost per Product" description="Breakdown of development costs allocated to each product in the portfolio." />
        <InfoCard title="Forecast" description="Projected spending based on current commitments and upcoming milestones." />
      </div>
    </HelpSection>

    <TipCard>Link budget items to lifecycle phases to track spending against the development plan — this helps identify phases that consistently exceed budget.</TipCard>
  </div>
);

// ============ USER-PRODUCT MATRIX ============
export const CompanyUserProductMatrixHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The User-Product Matrix provides a cross-reference view showing which users have access to which
      products and their role on each product. This is essential for access control governance.
    </p>

    <HelpSection title="How to Read the Matrix">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Rows</strong> = team members. <strong>Columns</strong> = products.</p>
        <p>• Each cell shows the user's role on that product (Admin, Editor, Viewer, or no access).</p>
        <p>• Click a cell to modify access — changes take effect immediately.</p>
        <p>• Use the filters to focus on specific departments or products.</p>
      </div>
    </HelpSection>

    <TipCard>Review this matrix quarterly and before audits — it provides the evidence auditors need to verify that access controls are properly managed (ISO 13485 §4.1.5).</TipCard>

    <WarningCard>Users without product access cannot see the product at all. Ensure reviewers and approvers have at least Viewer access to all products they may need to review.</WarningCard>
  </div>
);

// ============ BASIC UDI ============
export const CompanyBasicUDIHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Basic UDI-DI Registry manages your organisation's Unique Device Identifiers at the group level.
      Each Basic UDI-DI represents a device model group and is the key identifier in EUDAMED.
    </p>

    <HelpSection title="UDI Hierarchy">
      <div className="space-y-2">
        <InfoCard title="Basic UDI-DI" description="The top-level identifier for a device model group. Required for EUDAMED registration. Assigned by an issuing agency (GS1, HIBCC, ICCBBA, IFA)." />
        <InfoCard title="UDI-DI" description="Identifies a specific device configuration (size, model, packaging). Links to the Basic UDI-DI." />
        <InfoCard title="UDI-PI" description="Production identifier — lot number, serial number, expiry date. Applied at manufacturing time." />
      </div>
    </HelpSection>

    <HelpSection title="EUDAMED Integration">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Under MDR Article 29, manufacturers must assign a Basic UDI-DI to each device model and register it in EUDAMED
          before placing the device on the EU market. The Basic UDI-DI is the anchor for all EUDAMED data.
        </p>
      </div>
    </HelpSection>

    <TipCard>Register with an issuing agency (GS1 is most common in Europe) and obtain your company prefix before creating Basic UDI-DIs.</TipCard>
  </div>
);

// ============ ROLE ACCESS CONTROL ============
export const CompanyRoleAccessHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Role Access Control defines custom roles beyond the standard set (Owner, Admin, Editor, Viewer).
      Custom roles allow fine-grained permission management aligned with your organisational structure.
    </p>

    <HelpSection title="Custom Role Features">
      <div className="space-y-2">
        <InfoCard title="Granular Permissions" description="Define exactly which modules, actions, and data each custom role can access." />
        <InfoCard title="Department-Based" description="Roles can be scoped to specific departments — e.g., 'QA Reviewer' with approval rights only for quality documents." />
        <InfoCard title="Role Aggregation" description="Users can have multiple roles. Permissions are merged — the most permissive access wins." />
      </div>
    </HelpSection>

    <TipCard>Create roles that match your SOP-defined responsibilities — this makes it easy to demonstrate to auditors that system access aligns with documented authority.</TipCard>
  </div>
);

// ============ REVIEWER ANALYTICS ============
export const CompanyReviewerAnalyticsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Reviewer Analytics tracks the performance and workload of document reviewers and approvers across
      your organisation. It helps identify bottlenecks and ensure timely review cycles.
    </p>

    <HelpSection title="Key Metrics">
      <div className="space-y-2">
        <InfoCard title="Average Review Time" description="Mean time from review request to completion, broken down by reviewer and document type." />
        <InfoCard title="Review Queue Depth" description="Number of pending reviews per person — identifies overloaded reviewers." />
        <InfoCard title="Approval Rate" description="Percentage of documents approved on first submission vs. returned for revision." />
        <InfoCard title="Overdue Reviews" description="Documents awaiting review past their due date, with escalation indicators." />
      </div>
    </HelpSection>

    <TipCard>Use this data in management reviews to assess whether review resources are adequate — long review times often indicate understaffing or unclear review criteria.</TipCard>
  </div>
);

// ============ PLATFORMS ============
export const CompanyPlatformsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Platforms page manages the technology platforms and shared components that underpin multiple
      products in your portfolio. Platform changes can affect multiple devices simultaneously.
    </p>

    <HelpSection title="Platform Management">
      <div className="space-y-2">
        <InfoCard title="Shared Components" description="Components, software libraries, or subsystems used across multiple products. Changes require impact analysis across all dependent devices." />
        <InfoCard title="Platform Versioning" description="Track platform versions independently from product versions. Each product references a specific platform version." />
        <InfoCard title="Impact Analysis" description="When a platform changes, automatically identify all affected products and trigger change control assessments." />
      </div>
    </HelpSection>

    <TipCard>Platform-level change control prevents surprises — a single platform update can affect safety and performance of every product built on it.</TipCard>

    <WarningCard>Always perform a risk impact analysis before updating a shared platform component. MDR requires manufacturers to evaluate the impact of changes on all affected devices.</WarningCard>
  </div>
);

// ============ MARKETPLACE ============
export const CompanyMarketplaceHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Marketplace Preview shows how your company and products appear in the XyReg public marketplace.
      This is the storefront view that potential partners, distributors, and customers will see.
    </p>

    <HelpSection title="Marketplace Features">
      <div className="space-y-2">
        <InfoCard title="Company Profile" description="Your organisation's public-facing information: description, certifications, regulatory capabilities, and contact details." />
        <InfoCard title="Product Listings" description="Published products with descriptions, classifications, target markets, and regulatory status." />
        <InfoCard title="Certification Badges" description="Verified certifications (ISO 13485, CE marking, FDA clearance) displayed as trust signals." />
      </div>
    </HelpSection>

    <TipCard>Keep your marketplace profile updated — it serves as a digital business card for regulatory partners and potential customers evaluating your capabilities.</TipCard>
  </div>
);
