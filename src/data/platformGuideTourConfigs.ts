/**
 * Tour configurations for each Platform Guide section.
 * Maps section IDs from platformGuideModule to routes and @reactour step configs.
 *
 * All 16 sections have tours with 5–10 steps each. Company-level sections
 * navigate to their dedicated pages. Orientation and device-level sections
 * navigate to the most relevant company-level page that demonstrates the concept.
 */

export interface PlatformTourStepConfig {
  selector: string;
  title: string;
  description: string;
}

export interface PlatformTourConfig {
  route: string; // relative path after /app/company/{company}
  steps: PlatformTourStepConfig[];
}

export const PLATFORM_TOUR_CONFIGS: Record<string, PlatformTourConfig> = {
  // ── Tier 1: Platform Orientation ──────────────────────────────────────
  'welcome-to-xyreg': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="sidebar"]', title: '👋 Welcome to XyReg', description: 'This is your primary navigation — the L1 Module Bar. It is always visible and organised into clear sections. Let\'s walk through it top to bottom. Press "Next" to continue.' },
      { selector: '[data-tour="sidebar"]', title: '🎯 Mission Control (Top)', description: 'The top icon is Mission Control — your personal "What should I do today?" dashboard. It shows your action items, pending approvals, and deadlines across all devices. Press "Next" to continue.' },
      { selector: '[data-tour="sidebar"]', title: '🏢 Company Level (Middle)', description: 'Below Mission Control are Company Level modules: Portfolio, Suppliers, Documents, CAPA, Change Control, Training, and Budget. These apply across your entire organisation. Press "Next" to continue.' },
      { selector: '[data-tour="sidebar"]', title: '📱 Device Level (Below)', description: 'When you enter a device, the sidebar switches to Device Level modules: Classification, Risk Analysis, Design Controls, V&V, Usability, Clinical Evaluation, and UDI. Press "Next" to continue.' },
      { selector: '[data-tour="sidebar"]', title: '📝 Document Studio (Bottom)', description: 'At the bottom of L1 sits Document Studio — your document generation engine. It assembles Technical Files, SOPs, and regulatory submissions from your structured data. Press "Next" to continue.' },
      { selector: '[data-tour="main-menu"]', title: '📂 L2 — Contextual Sidebar', description: 'This wider panel is L2 — it shows sub-items for whichever L1 module is active. For example, under Company you see Portfolio, Suppliers, Documents, and more. Press "Next" to continue.' },
      { selector: '[data-tour="products"]', title: '📱 Your Device Portfolio', description: 'These are your device cards. Each one is a medical device with its own Technical File. Click any card to enter Device Level — the deepest level. Press "Next" to continue.' },
      { selector: '[data-tour="add-product"]', title: '➕ Add a New Device', description: 'Click "+ Add Device" to create a new medical device. You will define its name, intended purpose, risk class, and target markets. Press "Next" to continue.' },
      { selector: '[data-tour="help-button"]', title: '❓ Help & Learning Centre', description: 'Click this button (or press F1) to open the Learning Centre with guides, reference topics, and more interactive tours. Press "Next" to finish.' },
      { selector: '[data-tour="dashboard-content"]', title: '🔗 The Living Technical File', description: 'Everything in XyReg is interconnected: requirements → risks → tests → design outputs. This "Living Technical File" mirrors how regulators expect your documentation. Explore after this tour!' },
    ],
  },

  'platform-architecture': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="breadcrumb-client-compass"]', title: '🧭 Client Compass — Level 1', description: 'Click this "Client Compass" breadcrumb to navigate to the top level — your multi-company lobby where you see all organisations at a glance.' },
      { selector: '[data-tour="sidebar"]', title: '📋 The Three-Level Sidebar', description: 'Click any icon on this sidebar to switch modules. Notice how it adapts: at Client Compass it shows company management, at Company Level cross-cutting modules, at Device Level the Technical File sections.' },
      { selector: '[data-tour="main-menu"]', title: '🏢 Company Level (L2)', description: 'Browse this contextual panel — it lists all Company Level modules: Suppliers, Training, CAPA, Change Control, Documents, Budget. Click any item here to navigate to that module.' },
      { selector: '[data-tour="products"]', title: '📱 Device Level (L3)', description: 'Click any device card here to enter Device Level. Inside you will manage the full Technical File: Classification, Risk, Design Controls, V&V, Usability, and more.' },
      { selector: '[data-tour="dashboard-content"]', title: '🔗 The Digital Thread', description: 'Scroll through this content area — everything is linked: requirements → risks → test cases → design outputs. This traceability is what regulators look for during audits.' },
      { selector: '[data-tour="sidebar"]', title: '🔀 Shared vs. Device-Scoped', description: 'Notice modules like Documents and CAPA appear in this sidebar at both Company and Device Level. Click them at Company Level for company-wide records, or inside a device for device-specific records.' },
      { selector: '[data-tour="breadcrumb-client-compass"]', title: '⬆️ Moving Between Levels', description: 'Click "Client Compass" in this breadcrumb to go to L1. Click your company name to return to L2. Click a device to go to L3. The breadcrumb always tells you where you are.' },
    ],
  },

  'navigation-sidebar': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="sidebar"]', title: 'L1 — Primary Module Bar', description: 'The narrow icon strip on the far left is always visible. Each icon represents a top-level module group. Single-click any icon to navigate directly to that module.' },
      { selector: '[data-tour="main-menu"]', title: 'L2 — Contextual Sidebar', description: 'The wider panel next to L1 shows sub-items for the active module. For example, under Company you see Portfolio, Suppliers, Documents, CAPA, and more.' },
      { selector: '[data-tour="sidebar"]', title: 'Expanding and Collapsing L2', description: 'Double-click any L1 icon to toggle the L2 panel open or closed. You can also use the small chevron (arrow) buttons at the top and bottom of L1 to expand without double-clicking.' },
      { selector: '[data-tour="sidebar"]', title: 'Single-Click vs Double-Click', description: 'Single-click navigates to the module. Double-click toggles the L2 panel visibility. This is an important distinction — single-click is for navigation, double-click is for panel management.' },
      { selector: '[data-tour="products"]', title: 'Company → Device Transition', description: 'Click any device in the portfolio to descend from Company Level into Device Level. The sidebar will update to show device-specific modules like Classification, Risk, V&V, and Traceability.' },
      { selector: 'body', title: 'Breadcrumb Navigation', description: 'The breadcrumb trail at the top of the page always shows your current position: Client Compass > Company > (Device). Click any breadcrumb to navigate back up the hierarchy.' },
      { selector: '[data-tour="help-button"]', title: 'Keyboard Shortcuts', description: 'Press F1 to open Help anytime. Use the sidebar icons for quick navigation. The search bar (if available) lets you find products, documents, and modules by name.' },
    ],
  },

  // ── Tier 2: Company Level Modules ─────────────────────────────────────
  'mission-control': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="sidebar"]', title: 'Mission Control', description: 'Mission Control is your daily command centre. It is the first icon in the sidebar and shows portfolio-wide health, action items, and upcoming deadlines.' },
      { selector: '[data-tour="products"]', title: 'Portfolio Health Overview', description: 'Your devices are listed here with status indicators. Green = on track, Amber = needs attention, Red = critical issues. This gives you an at-a-glance view of your entire portfolio.' },
      { selector: 'body', title: 'Action Items & Deadlines', description: 'Mission Control aggregates open tasks, overdue items, pending approvals, and upcoming milestones across all your devices into one unified view.' },
      { selector: 'body', title: 'Compliance Score', description: 'Each device has a compliance score based on document completion, gap analysis results, and audit findings. Mission Control shows the aggregate score for your entire portfolio.' },
      { selector: '[data-tour="sidebar"]', title: 'Quick Actions', description: 'From Mission Control you can quickly jump to any device, open a pending CAPA, review a document awaiting approval, or start a new audit — all without navigating through menus.' },
    ],
  },

  'client-compass': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="breadcrumb-client-compass"]', title: 'What is Client Compass?', description: 'Click this "Client Compass" breadcrumb to navigate to Level 1. This is the multi-company lobby — essential for consultants and multi-site organisations managing several companies.' },
      { selector: '[data-tour="sidebar"]', title: 'Switching Between Companies', description: 'From Client Compass, click any company in the sidebar to enter that company\'s context. All modules, data, and devices will switch to reflect the selected company.' },
      { selector: '[data-tour="products"]', title: 'You Are Inside a Company Now', description: 'These are your device cards — you are inside one company right now. Click "Client Compass" in the breadcrumb above to go back and see all your companies.' },
      { selector: '[data-tour="dashboard-content"]', title: 'Company Cards in Client Compass', description: 'When you visit Client Compass, each company card shows: number of devices, compliance score, open actions, and recent activity. Use it to prioritise which company needs attention.' },
      { selector: '[data-tour="sidebar"]', title: 'Data Isolation', description: 'Notice the modules in this sidebar — Suppliers, Documents, CAPA records, and devices all belong to the current company only. Each company\'s data is completely isolated and never mixed.' },
    ],
  },

  'company-dashboard-portfolio': {
    route: '/portfolio-landing',
    steps: [
      { selector: 'body', title: 'Company Dashboard', description: 'The Company Dashboard shows company-level metrics: total devices, overall compliance score, document completion rate, and open actions across all products.' },
      { selector: '[data-tour="products"]', title: 'Device Portfolio', description: 'Your product portfolio lists all medical devices. Each card shows the device name, risk class, current lifecycle phase, and compliance status.' },
      { selector: '[data-tour="add-product"]', title: 'Adding a New Device', description: 'Click "Add Device" to create a new medical device. You will be guided through defining its name, intended purpose, and initial configuration.' },
      { selector: 'body', title: 'Portfolio Views', description: 'You can view your portfolio in multiple formats: Sunburst Chart, Phases Chart, Device Cards, Timeline View, Data Table, and more. Choose the view that best suits your workflow.' },
      { selector: '[data-tour="products"]', title: 'Entering a Device', description: 'Click on any device card to enter Device Level. This opens the full Technical File for that device — Classification, Risk, Design Controls, Documents, and more.' },
      { selector: 'body', title: 'Device Families & Bundles', description: 'XyReg supports device families (sibling devices sharing characteristics) and bundle projects (grouping related devices for feasibility analysis).' },
    ],
  },

  'supplier-management': {
    route: '/suppliers',
    steps: [
      { selector: '[data-tour="suppliers"]', title: 'Approved Supplier List', description: 'This is your company-wide Approved Supplier List (ASL) — required by ISO 13485. It tracks all suppliers, their certifications, evaluation status, and linked products.' },
      { selector: '[data-tour="add-supplier"]', title: 'Adding a Supplier', description: 'Click here to add a new supplier. You will enter their details, upload certifications (e.g. ISO 13485 certificates), and set evaluation schedules.' },
      { selector: '[data-tour="suppliers"]', title: 'Supplier Evaluations', description: 'Each supplier has an evaluation history. You can record periodic assessments, track performance issues, and maintain evidence for audit readiness.' },
      { selector: 'body', title: 'Certifications & Expiry Tracking', description: 'Upload supplier certificates and set expiry dates. XyReg will alert you before certificates expire so you can request renewals proactively.' },
      { selector: 'body', title: 'Linking Suppliers to Products', description: 'Connect suppliers to the specific devices they supply components for. This creates traceability and helps during impact assessments when a supplier issue arises.' },
      { selector: '[data-tour="sidebar"]', title: 'Supplier Module Access', description: 'The Supplier module is a company-level module — it appears in the sidebar when you are at Company Level. It covers all devices, not just one.' },
    ],
  },

  'company-documents-compliance': {
    route: '/documents',
    steps: [
      { selector: '[data-tour="documents"]', title: 'Company Document Library', description: 'This is your company-level document library. It contains QMS documents, SOPs, quality policies, work instructions, and other company-wide records.' },
      { selector: 'body', title: 'Document Versioning', description: 'Every document has a version history. When you upload a new version, the previous versions are preserved. You can compare versions and track changes over time.' },
      { selector: 'body', title: 'Approval Workflows', description: 'Documents can go through approval workflows. Reviewers and approvers are notified automatically, and digital signatures are recorded for compliance.' },
      { selector: 'body', title: 'Document Categories', description: 'Documents are organised by type: SOPs, Policies, Templates, Forms, Records, and more. Use filters and search to find what you need quickly.' },
      { selector: 'body', title: 'Company vs. Device Documents', description: 'Company-level documents apply across the organisation (e.g., Quality Manual, SOP for CAPA). Device-level documents live inside each product\'s Technical File. They are separate libraries.' },
      { selector: '[data-tour="sidebar"]', title: 'Related Compliance Modules', description: 'From the sidebar you can also access Gap Analysis, Audits, and Activities — all at company level. These complement the document library for full QMS compliance.' },
    ],
  },

  'company-operations': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="sidebar"]', title: 'Company Operations Overview', description: 'Company Operations is a group of modules accessible from the sidebar: Budget, CAPA, Change Control, PMS, Training, Communications, and Audit Log.' },
      { selector: 'body', title: 'CAPA (Corrective & Preventive Actions)', description: 'The company-level CAPA module tracks quality issues across all devices. Record complaints, investigate root causes, implement corrective actions, and verify effectiveness.' },
      { selector: 'body', title: 'Change Control', description: 'Change Control manages planned changes to processes, products, or documentation. Each change request goes through a review and approval workflow before implementation.' },
      { selector: 'body', title: 'Training Management', description: 'Track staff training requirements, completion status, and certifications. Link training records to SOPs to ensure everyone has read and understood current procedures.' },
      { selector: 'body', title: 'Budget & Cost Tracking', description: 'The Budget module helps you track development costs, regulatory submission fees, and other expenses associated with your device portfolio.' },
      { selector: 'body', title: 'Audit Log', description: 'Every action in XyReg is recorded in the Audit Log. This provides a complete trail of who did what and when — essential for regulatory audits and inspections.' },
    ],
  },

  // ── Tier 3: Device Level Modules ──────────────────────────────────────
  'device-dashboard-definition': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Enter a Device', description: 'Click any product card to enter Device Level. You will see the Device Dashboard — the central hub for one specific medical device.' },
      { selector: 'body', title: 'Device Dashboard', description: 'The Device Dashboard shows completion status across all Technical File sections: Description, Classification, Risk, Design Controls, V&V, Documents, and more.' },
      { selector: 'body', title: 'Device Description', description: 'In the Device Definition section, you define: device name, intended purpose, indications for use, target patient population, user profile, and operating environment.' },
      { selector: 'body', title: 'UDI (Unique Device Identification)', description: 'Configure your UDI-DI codes here. XyReg supports GS1, HIBCC, and ICCBBA issuing agencies and generates the proper barcode format for your labelling needs.' },
      { selector: 'body', title: 'Target Markets', description: 'Define which markets your device targets: EU (MDR), US (FDA), UK (UKCA), and others. Each market determines which regulatory pathway and requirements apply.' },
      { selector: '[data-tour="add-product"]', title: 'Creating a New Device', description: 'If you don\'t have a device yet, click here to create one. After creation, click on it to enter Device Level and start building its Technical File.' },
    ],
  },

  'classification-regulatory-pathway': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Classification Lives Inside a Device', description: 'To classify a device, click on it first to enter Device Level. The Classification module is in the device sidebar.' },
      { selector: 'body', title: 'EU MDR Classification', description: 'For EU markets, the Classification Wizard walks you through the MDR Annex VIII rules. Answer questions about your device\'s characteristics and it determines the risk class (I, IIa, IIb, III).' },
      { selector: 'body', title: 'FDA Classification', description: 'For US markets, determine whether your device requires a 510(k), De Novo, or PMA submission. The wizard helps identify the appropriate product code and predicate devices.' },
      { selector: 'body', title: 'Regulatory Pathway', description: 'Based on classification, XyReg recommends the regulatory pathway: CE Marking route for EU, 510(k)/PMA for FDA, UKCA for UK, and more.' },
      { selector: 'body', title: 'Classification Evidence', description: 'The wizard generates a classification rationale document that you can include in your Technical File. This shows regulators how you arrived at your classification decision.' },
    ],
  },

  'design-risk-controls': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Design & Risk Inside a Device', description: 'Click a product to enter Device Level. Design Controls, Risk Management, V&V, and Traceability all live inside the device\'s Technical File.' },
      { selector: 'body', title: 'Requirements Management', description: 'Define user needs, design inputs, and design outputs. Requirements are the foundation of your Design Controls per ISO 13485 §7.3.' },
      { selector: 'body', title: 'Risk Management (FMEA)', description: 'The Risk module supports ISO 14971-compliant FMEA. Identify hazards, estimate severity and probability, define risk controls, and track residual risk.' },
      { selector: 'body', title: 'Verification & Validation (V&V)', description: 'Create test protocols, record test results, and link them to requirements. V&V demonstrates that your device meets its design inputs (verification) and user needs (validation).' },
      { selector: 'body', title: 'Usability Engineering', description: 'Per IEC 62366, define use scenarios, identify use errors, and document formative and summative usability evaluations.' },
      { selector: 'body', title: 'Traceability Matrix', description: 'The Traceability Matrix automatically links requirements → risks → test cases → design outputs. This "digital thread" is what auditors look for to verify design control compliance.' },
    ],
  },

  'device-compliance-instances': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Device-Level Compliance', description: 'Each device has its own compliance modules — separate from company-level compliance. Click a product to access device-specific Documents, Gap Analysis, and Audits.' },
      { selector: 'body', title: 'Device Documents', description: 'Device-level documents form the Technical File: risk analysis reports, design history files, clinical evaluation reports, IFU, labelling, and more.' },
      { selector: 'body', title: 'Device Gap Analysis', description: 'Run a gap analysis against specific standards (e.g., MDR Essential Requirements, FDA Design Controls) to identify what\'s missing from your Technical File.' },
      { selector: 'body', title: 'Device Audits', description: 'Schedule and manage device-specific audits: internal audits, design reviews, and pre-submission readiness checks.' },
      { selector: 'body', title: 'Activities & Checklists', description: 'Track device-level activities, checklists, and action items. These are scoped to the individual device and do not affect other products in your portfolio.' },
    ],
  },

  'device-operations-lifecycle': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Device Operations', description: 'Click a product to access device-level operations: Design Review, PMS, CAPA, Change Control, Milestones, and Manufacturing.' },
      { selector: 'body', title: 'Design Review', description: 'Conduct formal design reviews at key milestones. Record attendees, decisions, action items, and link to relevant design documents.' },
      { selector: 'body', title: 'Post-Market Surveillance (PMS)', description: 'After market launch, PMS tracks complaint handling, vigilance reporting, PMCF studies, and periodic safety update reports (PSUR/PMSR).' },
      { selector: 'body', title: 'Device-Level CAPA', description: 'Device-specific CAPA records track issues found during testing, production, or post-market use. They are separate from company-level CAPAs.' },
      { selector: 'body', title: 'Milestones & Lifecycle Phases', description: 'Track your device through lifecycle phases: Concept, Feasibility, Design & Development, Verification, Validation, Transfer, Production, and Post-Market.' },
      { selector: 'body', title: 'Manufacturing Transfer', description: 'Document the transfer from design to manufacturing: process validation, equipment qualification, and production specifications.' },
    ],
  },

  // ── Tier 4: Strategic & Business Tools ────────────────────────────────
  'business-case-genesis': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="products"]', title: 'Business Case Tools', description: 'Business Case and Genesis are accessible inside each device. Click a product to enter Device Level, then find the Business Case section in the sidebar.' },
      { selector: 'body', title: 'Venture Blueprint', description: 'The Venture Blueprint is a structured business plan for your medical device. It covers market analysis, competitive landscape, pricing strategy, and go-to-market plan.' },
      { selector: 'body', title: 'Market Analysis', description: 'Define your target market size (TAM, SAM, SOM), growth rates, and key market drivers. This feeds into the financial projections.' },
      { selector: 'body', title: 'Risk-Adjusted NPV (rNPV)', description: 'The rNPV calculator estimates the net present value of your device, adjusted for technical, regulatory, and commercial risk. Input development costs, timelines, and probability of success.' },
      { selector: 'body', title: 'Genesis — Investor Readiness', description: 'Genesis is a checklist and scoring tool that evaluates how ready your device project is for investor review. It covers regulatory strategy, IP, team, market, and financials.' },
      { selector: 'body', title: 'Business Model Canvas', description: 'Generate a Business Model Canvas for your device: value proposition, customer segments, channels, revenue streams, and cost structure — all tailored to medtech.' },
    ],
  },

  'draft-studio': {
    route: '/portfolio-landing',
    steps: [
      { selector: '[data-tour="sidebar"]', title: 'Document Studio Access', description: 'Document Studio is a primary module — always accessible from the sidebar regardless of your current context. Look for the Document Studio icon in L1.' },
      { selector: 'body', title: 'What is Document Studio?', description: 'Document Studio is a document creation workspace. It combines templates, data integration, and a rich editor to help you produce regulatory-ready documents efficiently.' },
      { selector: 'body', title: 'Document Templates', description: 'Choose from pre-built templates for common regulatory documents: Clinical Evaluation Reports, Risk Management Files, Technical Documentation summaries, and more.' },
      { selector: 'body', title: 'Data Integration', description: 'Document Studio can pull data directly from your device records — requirements, risks, test results, classification decisions — and inject them into document templates automatically.' },
      { selector: 'body', title: 'Rich Editor', description: 'The built-in editor supports formatting, tables, images, and cross-references. Edit documents directly in XyReg without needing external word processors.' },
      { selector: 'body', title: 'Export & Sharing', description: 'Export finished documents as PDF or Word files. Share drafts with team members for review and approval before finalising.' },
    ],
  },
};

/**
 * Check if a platform guide section has a tour configured
 */
export function hasPlatformTour(sectionId: string): boolean {
  return sectionId in PLATFORM_TOUR_CONFIGS;
}
