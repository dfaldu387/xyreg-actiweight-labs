import { ModuleContent } from '@/types/onboarding';

export const platformGuideModule: ModuleContent = {
  id: 'platform-guide',
  translationKey: 'platformGuide',
  title: 'XyReg Platform Guide',
  category: 'Core Platform',
  estimatedTime: 60,
  difficulty: 'beginner',
  roles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],

  overview: {
    description: 'A comprehensive, progressive introduction to the XyReg platform — from understanding what the system is and how it is structured, through every company-level and device-level module, to strategic business tools. Designed to build a complete mental model before diving into operations.',
    whoUsesIt: 'Everyone — Regulatory Affairs professionals, Quality Managers, Product Managers, Consultants, Founders, and anyone new to XyReg who needs to understand the platform from the ground up.',
    keyBenefits: [
      'Builds understanding progressively — concepts before operations',
      'Explains the Company vs. Device distinction that confuses most new users',
      'Covers every module with "What, Why, Where, How" for each',
      'Tips and common mistakes from real-world medtech regulatory experience'
    ],
    prerequisites: ['Create an account and sign in']
  },

  steps: [
    // =========================================================================
    // TIER 0: MULTI-COMPANY (Only shown for multi-company users)
    // =========================================================================
    {
      id: 'client-compass',
      title: 'Section 0: Client Compass — Multi-Company Management',
      content: `<strong>What is Client Compass?</strong>

Client Compass is the <strong>multi-company management hub</strong>. It provides a bird's-eye view of all companies you have access to, with status indicators and quick-switch capability.

<strong>Why does it exist?</strong>

Regulatory consultants and multi-company administrators often manage 5, 10, or even 20+ client companies. Without Client Compass, they would need to log out and log back in, or maintain separate browser sessions. Client Compass lets you see all your companies in one view and switch between them instantly.

Even if you work for a single company, Client Compass is your entry point — it shows your company's overall health at a glance.

<strong>Where is it?</strong>

Client Compass is accessible from the <strong>sidebar</strong> under the company navigation. It is also the default view when you first log in if you have access to multiple companies.

<strong>What can you do here?</strong>

<strong>Company Overview:</strong>
• See all companies with their status: Active, Onboarding, Under Review, At Risk
• View key metrics per company: number of devices, compliance percentage, open actions
• Sort and filter companies by status, name, or activity

<strong>Quick Switch:</strong>
• Click any company to switch your entire context to that company
• The sidebar, breadcrumbs, and all data update to reflect the selected company
• Your last-visited company is remembered between sessions

<strong>Company Health Indicators:</strong>
• Document completion rate
• Supplier qualification status
• Open CAPA count
• Upcoming audit dates
• Portfolio compliance percentage

<strong>Adding a New Company:</strong>
1. Click <strong>"Create Company"</strong>
2. Enter company name, address, and contact details
3. Upload company logo (optional but recommended)
4. Configure company settings (language, currency, regulatory frameworks)
5. The company appears in Client Compass immediately`,
      tips: [
        'Use status indicators to prioritise which company needs attention first',
        'Set up company profiles completely — incomplete profiles create issues in regulatory documents',
        'If you manage multiple companies, use Client Compass as your starting point each day',
        'Company logos appear in generated documents — upload a clean, high-resolution logo'
      ],
      commonMistakes: [
        'Forgetting to switch company context before working — always check the breadcrumb',
        'Creating duplicate companies instead of adding users to existing ones',
        'Not completing company profile fields that are required for regulatory submissions',
        'Ignoring "At Risk" status indicators on client companies'
      ]
    },

    // =========================================================================
    // TIER 1: PLATFORM ORIENTATION (Sections 1-3)
    // What is XyReg? How is it structured? Where am I?
    // =========================================================================
    {
      id: 'welcome-to-xyreg',
      title: 'Section 1: Welcome to XyReg',
      content: `<strong>What is XyReg?</strong>

XyReg is a <strong>regulatory intelligence platform</strong> purpose-built for medical device companies. It is not a generic project management tool or a shared drive with folders — it is a structured, regulatory-aware environment that mirrors how regulators expect your device documentation to be organised.

<strong>Why does XyReg exist?</strong>

Bringing a medical device to market requires a <strong>Technical File</strong> (in Europe) or a <strong>Device Master Record</strong> (in the US). These are not single documents — they are collections of hundreds of interconnected records: your device description, intended use, risk analysis, clinical evidence, supplier qualifications, design verification, labelling, post-market surveillance plans, and more. Regulators (Notified Bodies, FDA, MHRA) audit these files to determine if your device is safe and effective.

Traditionally, companies manage these files in shared drives, spreadsheets, and disconnected tools. This creates gaps, version conflicts, and audit failures. XyReg replaces this fragmented approach with a single, structured platform where every piece of your regulatory puzzle has a defined place and is linked to everything it relates to.

<strong>The Living Technical File</strong>

XyReg's core concept is the <strong>Living Technical File</strong>. Unlike a static folder of PDFs, your Technical File in XyReg is alive:
• It updates automatically as you add data, run classification wizards, or upload documents
• It tracks completeness — showing you exactly what is missing
• It maintains traceability — linking requirements to risks to tests to evidence
• It generates compliance gap analyses against specific standards (EU MDR, FDA 21 CFR 820, ISO 13485)

<strong>The Digital Thread</strong>

Everything in XyReg is connected through what we call the <strong>Digital Thread</strong>. When you define a requirement, it links to a risk. That risk links to a design control. The design control links to a verification test. The test links to evidence. If anything changes, the thread shows you every downstream impact. This is the traceability that auditors look for — and XyReg maintains it automatically.

<strong>Who is XyReg for?</strong>

• <strong>Startup founders</strong> building their first device and needing a structured path to market
• <strong>Regulatory Affairs professionals</strong> managing submissions and technical files
• <strong>Quality Managers</strong> maintaining QMS compliance and supplier oversight
• <strong>Consultants</strong> managing multiple client companies and device portfolios
• <strong>Product Managers</strong> tracking device lifecycle from concept to post-market

<strong>What you will learn in this guide:</strong>

This guide walks you through every part of XyReg in a logical order. We start with how the platform is structured (Section 2), then how to navigate it (Section 3), then work through each module from company-level down to device-level, and finally cover strategic business tools. By the end, you will have a complete mental model of the platform.`,
      tips: [
        'Think of XyReg as the "source of truth" for your regulatory file — not a backup of files stored elsewhere',
        'The Living Technical File concept means you should enter data directly in XyReg, not copy-paste from external documents',
        'The Digital Thread only works if you create links between records — XyReg helps, but you need to connect the dots',
        'Bookmark Section 3 (Navigation) — you will refer back to it often as you learn the platform'
      ],
      commonMistakes: [
        'Treating XyReg as a file storage system — it is a structured regulatory platform, not a shared drive',
        'Trying to learn every module at once — follow the sections in order for the best understanding',
        'Skipping the architecture section (Section 2) — understanding Company vs. Device is essential',
        'Not understanding that the Technical File is "living" — it requires ongoing maintenance, not a one-time setup'
      ]
    },
    {
      id: 'platform-architecture',
      title: 'Section 2: Platform Architecture — The Three Levels',
      content: `<strong>What is this?</strong>

XyReg is organised into <strong>three nested levels</strong>. Understanding these levels is the single most important concept for using the platform effectively. Everything in XyReg lives at one of these levels, and knowing which level you are on determines what you can see and do.

<strong>Why three levels?</strong>

Medical device regulations operate at different scopes. Some requirements apply to your <strong>company</strong> (quality management system, supplier management, training). Others apply to a specific <strong>device</strong> (classification, risk analysis, clinical evaluation). And some users — particularly consultants — manage <strong>multiple companies</strong> simultaneously. XyReg mirrors this real-world structure.

<strong>Level 1: Client Compass (Multi-Company)</strong>

The highest level. This is where you see <strong>all companies</strong> you have access to. If you are a consultant managing five client companies, Client Compass shows all five with status indicators and health metrics. If you work for a single company, you will still pass through this level but typically go straight to your company.

What lives here:
• Company list with status indicators (active, onboarding, at risk)
• Cross-company portfolio overview
• Quick-switch between companies

<strong>Level 2: Company Level</strong>

When you select a company, you enter the <strong>Company Level</strong>. This is where company-wide operations live — things that are not specific to any single device but apply across your entire organisation.

What lives here:
• <strong>Company Dashboard</strong> — company health metrics and portfolio overview
• <strong>Portfolio Management</strong> — your list of all devices/products
• <strong>Supplier Management</strong> — Approved Supplier List, evaluations, certifications
• <strong>Document Control</strong> — company-level document library
• <strong>Compliance</strong> — company-level gap analysis, audits, activities
• <strong>Operations</strong> — Budget, CAPA, Change Control, PMS, Training, Communications, Audit Log

<strong>Level 3: Device Level</strong>

When you select a specific device from your portfolio, you enter the <strong>Device Level</strong>. This is the heart of XyReg — where you build the actual Technical File for a single medical device.

What lives here:
• <strong>Device Dashboard</strong> — product overview and completion status
• <strong>Device Information</strong> — General description, Purpose/Intended Use, Identification (UDI), Markets
• <strong>Classification</strong> — EU MDR and FDA classification wizards
• <strong>Design & Risk</strong> — Requirements, Architecture, Risk Management, V&V, Usability, Traceability
• <strong>Device Compliance</strong> — Documents, Gap Analysis, Audits, Activities scoped to this device
• <strong>Device Operations</strong> — Design Review, PMS, CAPA, Change Control, Milestones, Manufacturing

<strong>How the levels nest:</strong>

Think of it like an address:
• Client Compass = the city (all companies)
• Company Level = a building in the city (one company)
• Device Level = a specific floor in the building (one device)

You cannot access device-level data without first being in the context of a company. And you cannot access company data without being authenticated and having access to that company.

<strong>Why does this matter?</strong>

When you look at the sidebar, the available menu items change based on which level you are on. If you are at company level, you see company-level modules (Suppliers, Company Documents). If you are inside a device, you see device-level modules (Classification, Risk, Design Controls). Understanding this context-switching is key to not getting lost.`,
      tips: [
        'Always check which level you are on — the sidebar and breadcrumbs tell you',
        'Company-level modules (like Suppliers) apply across ALL devices in that company',
        'Device-level modules (like Classification) are specific to ONE device only',
        'If you cannot find a menu item, you may be at the wrong level — navigate up or down'
      ],
      commonMistakes: [
        'Looking for device-specific data at the company level (e.g., searching for risk analysis in company documents)',
        'Thinking supplier management is per-device — it is per-company (one supplier list for the entire organisation)',
        'Not realising that company-level compliance and device-level compliance are different scopes',
        'Getting confused when the sidebar changes after selecting a device — this is normal context-switching'
      ]
    },
    {
      id: 'navigation-sidebar',
      title: 'Section 3: Navigation and the Sidebar',
      content: `<strong>What is this?</strong>

The sidebar is your primary navigation tool in XyReg. It is a <strong>context-aware, three-level navigation system</strong> that mirrors the platform's own hierarchy: you move from a multi-company overview, down to a single company, and then into a specific device.

<strong>Understanding the Three-Level Hierarchy</strong>

Everything in XyReg is organised in three nested levels. This hierarchy is the single most important concept to internalise:

<strong>Level 1 — Client Compass (Multi-Company)</strong>
This is the highest level. When you first log in, you land here. Client Compass shows <strong>all companies</strong> you have access to. If you are a consultant managing 5 clients, you see all 5. If you are an in-house team, you see your single company. Think of it as "the lobby" — you choose which company to enter.

<strong>Level 2 — Company Level</strong>
Once you select a company, you enter the Company Level. Here you see everything that applies to the <strong>company as a whole</strong> — not to any single device. This includes: the company dashboard, the device portfolio, suppliers (your Approved Supplier List is company-wide), company-level documents, CAPA, change control, training records, budgets, and audit logs. These are cross-cutting concerns that don't belong to any one device.

<strong>Level 3 — Device Level</strong>
When you click on a specific device in the portfolio, you descend into the Device Level. Now everything you see is scoped to <strong>that one device</strong>: its classification, its risk management file, its requirements, its design verification, its device-specific documents, and its regulatory submissions. This is where the technical file lives.

The <strong>breadcrumb trail</strong> at the top of the page always tells you exactly where you are:
<code>Client Compass > Company Name > Device Name > Module</code>

<strong>The Sidebar Structure: L1 and L2</strong>

The sidebar has two columns that work together:

<strong>L1 — The Primary Module Bar (left-most column)</strong>
This narrow icon strip is always visible. It contains icons for the top-level module groups:
• <strong>Mission Control</strong> — Your daily command centre (context-independent, shows data from all companies and devices)
• <strong>Company modules</strong> — Portfolio, Suppliers, Documents, Compliance, Operations
• <strong>Device modules</strong> — Definition, Classification, Design & Risk, Compliance, Operations (only active when a device is selected)
• <strong>Document Studio</strong> — Document creation workspace
• <strong>Settings</strong> — Company and user configuration

Clicking an L1 icon navigates you directly to that module. The icon highlights to show your current location.

<strong>L2 — The Contextual Sidebar (expandable panel)</strong>
This is the wider panel that appears to the right of L1. It shows the sub-items within the active module group — for example, under Company you see Dashboard, Portfolio, Suppliers, Documents, Gap Analysis, Audits, Activities, Budget, CAPA, Change Control, PMS, Training, Communications, and Audit Log.

<strong>How to Open and Close L2</strong>

The L2 panel supports two interaction modes:

• <strong>Single click</strong> on an L1 icon — Navigates to that module but keeps L2 in its current state (collapsed or expanded). This is the quick-navigate action.

• <strong>Double click</strong> on an L1 icon — Toggles the L2 panel open or closed. If L2 is collapsed, double-clicking expands it to show all sub-items. If L2 is already expanded, double-clicking collapses it back to icons only.

• <strong>Chevron buttons</strong> — At the top and bottom of the collapsed L2 bar, you will see small chevron (arrow) buttons labelled "Open sidebar". Click either of these to expand L2 without double-clicking. This is especially useful on touch devices or when the icon strip is long.

When L2 is collapsed, you see only icons for the sub-items. Hovering over any icon shows a tooltip with its name. Single-clicking an icon navigates to that sub-item directly.

<strong>Context Switching</strong>

When you click on a different company in Client Compass, the entire company context changes — you see that company's data, its portfolio, its suppliers. When you click a different device in the portfolio, the device context changes — you see that device's classification, risks, documents.

The sidebar remembers your last position within each module. If you were on the Suppliers page, navigated away to look at a device, and then clicked back to the Company module, you will return to Suppliers — not to the company dashboard.

<strong>Quick Access</strong>

• Press <strong>F1</strong> at any time to open the Help & Guide system
• Use <strong>Client Compass</strong> to quickly switch between companies
• Use <strong>breadcrumbs</strong> to navigate up the hierarchy without going through the sidebar
• The <strong>Search</strong> function in the top bar lets you search across all modules and data`,
      tips: [
        'Double-click an L1 icon to expand or collapse the L2 contextual sidebar — single click just navigates',
        'Use the chevron buttons at the top or bottom of the collapsed L2 bar to expand it without double-clicking',
        'Learn the three levels first: Client Compass → Company → Device. This mental model unlocks everything else',
        'The sidebar remembers where you were in each module — you can freely jump between modules without losing your place',
        'Use breadcrumbs to navigate upward (e.g., from Device back to Company) — they are faster than the sidebar for going "up"',
        'Collapse the L2 sidebar when working on data-heavy pages to get more screen space'
      ],
      commonMistakes: [
        'Expecting to see device-level modules (like Risk Management or Classification) when no device is selected — you must first click into a device from the portfolio',
        'Not realising that Suppliers, Training, and Budget are company-level features — they will not appear inside a device context',
        'Trying to single-click L1 icons to expand the sidebar — use double-click or the chevron buttons instead',
        'Forgetting that the breadcrumb trail tells you exactly where you are in the hierarchy (Client > Company > Device > Module)',
        'Missing the chevron expand buttons at the top and bottom of the collapsed sidebar'
      ]
    },

    // =========================================================================
    // TIER 2: COMPANY LEVEL MODULES (Sections 4-9)
    // What lives at company level and why?
    // =========================================================================
    {
      id: 'mission-control',
      title: 'Section 4: Mission Control — Your Command Centre',
      content: `<strong>What is Mission Control?</strong>

Mission Control is your <strong>daily operational dashboard</strong>. It is the first thing you see when you log in, and it is designed to answer one question: "What needs my attention today?"

<strong>Why does it exist?</strong>

Managing medical devices involves tracking hundreds of tasks, deadlines, document approvals, supplier renewals, and compliance actions across multiple products. Without a centralised view, critical items get missed. Mission Control aggregates the most important signals from across your entire portfolio into one screen.

<strong>Where is it?</strong>

Mission Control is always accessible from the <strong>top of the sidebar</strong> — it is the first item in the primary module bar. It is context-independent, meaning it shows data from all your companies and devices.

<strong>What can you do here?</strong>

<strong>Portfolio Health Overview:</strong>
• See all your devices at a glance with colour-coded status indicators
• Green = on track, Amber = needs attention, Red = critical issues
• Click any device to jump directly to its dashboard

<strong>Action Items:</strong>
• Documents awaiting your review or approval
• Overdue tasks and approaching deadlines
• Supplier certifications nearing expiry
• CAPA actions requiring your input
• Gap analysis items needing remediation

<strong>Activity Stream:</strong>
• A chronological feed of recent changes across the platform
• Who changed what, when, and in which device
• Filtered by relevance to your role and permissions

<strong>Deadlines and Milestones:</strong>
• Upcoming regulatory submission deadlines
• Design review dates
• Audit schedules
• Certification renewal dates

<strong>Quick Actions:</strong>
• Create a new device
• Upload a document
• Start a gap analysis
• Add a supplier`,
      tips: [
        'Check Mission Control first thing every morning — it surfaces what matters',
        'Use the action items list as your daily to-do list',
        'Click on any portfolio item to jump directly to the relevant device',
        'The activity stream is useful for staying informed about team activity without chasing updates'
      ],
      commonMistakes: [
        'Ignoring Mission Control and navigating directly to individual devices — you will miss cross-cutting issues',
        'Not acting on amber/red status indicators — they escalate if ignored',
        'Treating the activity stream as noise — it contains important audit trail information',
        'Not setting up notification preferences to control what appears in your feed'
      ]
    },
    {
      id: 'company-dashboard-portfolio',
      title: 'Section 5: Company Dashboard and Portfolio',
      content: `<strong>What is the Company Dashboard?</strong>

The Company Dashboard is the <strong>home page for a single company</strong>. It shows company-level metrics, portfolio overview, and quick access to company-level modules.

<strong>Why does it exist?</strong>

While Mission Control shows cross-company data, the Company Dashboard focuses on <strong>one company</strong>. It answers: "How is this company doing overall? What devices does it have? What needs attention at the company level?"

<strong>Where is it?</strong>

When you click on a company in Client Compass (or select it from the sidebar), you land on the Company Dashboard. It is the first page you see at company level.

<strong>What can you do here?</strong>

<strong>Company Metrics:</strong>
• Total devices in portfolio
• Overall compliance score
• Document completion rate
• Open actions and overdue items
• Upcoming milestones and deadlines

<strong>Portfolio Management:</strong>
The Portfolio is your <strong>list of all medical devices</strong> belonging to this company. This is where you:

1. <strong>View all devices</strong> — see each device with its name, classification, lifecycle phase, and status
2. <strong>Add a new device</strong> — click "Add New Product" and enter device name, description, primary regulatory framework, and initial lifecycle phase
3. <strong>Open a device</strong> — click any device to enter its Device Level (Level 3) context
4. <strong>Archive or remove devices</strong> — manage devices that are no longer active

<strong>Device Cards:</strong>
Each device in the portfolio shows:
• Device name and image
• Regulatory classification (e.g., Class IIa EU MDR)
• Current lifecycle phase (Concept, Design, Verification, Validation, Production, Post-Market)
• Compliance score
• Key status indicators

<strong>Portfolio Analytics:</strong>
• Distribution of devices by classification
• Lifecycle phase distribution
• Compliance trends over time
• Resource allocation across devices`,
      tips: [
        'Use the portfolio view to get a quick health check of all your devices',
        'Add devices with clear, consistent names — they appear in many reports',
        'Set the correct lifecycle phase at creation — it drives document requirements',
        'Archive devices rather than deleting them — archived devices retain their audit history'
      ],
      commonMistakes: [
        'Creating a device without setting the regulatory framework — this must be done at creation',
        'Using the same device entry for fundamentally different products — use separate entries',
        'Not updating the lifecycle phase as the device progresses — this affects compliance requirements',
        'Ignoring portfolio-level analytics that reveal cross-device patterns'
      ]
    },
    {
      id: 'supplier-management',
      title: 'Section 6: Supplier Management',
      content: `<strong>What is Supplier Management?</strong>

Supplier Management is where you maintain your <strong>Approved Supplier List (ASL)</strong>, run supplier evaluations, and track supplier certifications and performance.

<strong>Why does it exist?</strong>

ISO 13485 (Section 7.4) requires medical device companies to <strong>evaluate and select suppliers based on their ability to supply product in accordance with requirements</strong>. You must maintain records of evaluation results, any necessary actions, and re-evaluate suppliers periodically. This is not optional — auditors will ask for your ASL and evaluation records.

<strong>Where is it?</strong>

Supplier Management lives at the <strong>Company Level</strong> in the sidebar. This is intentional — suppliers serve your entire company, not a single device. One supplier may provide components for multiple devices.

<strong>What can you do here?</strong>

<strong>Approved Supplier List:</strong>
• View all approved suppliers with their status, rating, and certification expiry dates
• Filter by supplier type (component, service, contract manufacturer, testing lab)
• See which products each supplier is linked to

<strong>Adding a Supplier:</strong>
1. Click <strong>"Add Supplier"</strong>
2. Enter supplier details: name, contact, address, type
3. Specify which products/components they supply
4. Upload supplier agreements and quality documentation

<strong>Running an Evaluation:</strong>
1. Select a supplier and click <strong>"Run Evaluation"</strong>
2. The wizard guides you through evaluation criteria:
   • Quality system (ISO 13485 certification status)
   • Delivery performance
   • Product quality history
   • Financial stability
   • Regulatory compliance
3. Score each criterion and add evidence/notes
4. The system calculates an overall supplier rating
5. Approve or conditionally approve the supplier

<strong>Tracking Certifications:</strong>
• Upload and track supplier certificates (ISO 13485, ISO 14001, etc.)
• Set expiry date alerts — the system warns you before certificates expire
• Link supplier audit reports
• Track supplier corrective actions

<strong>Supplier-Product Links:</strong>
• Link suppliers to specific device components for full traceability
• When a supplier's status changes, all linked devices are flagged
• This creates the supply chain traceability auditors expect`,
      tips: [
        'Evaluate critical suppliers BEFORE placing orders — it is a regulatory requirement',
        'Set up certificate expiry reminders to avoid compliance lapses',
        'Link suppliers to specific device components — this creates the traceability matrix auditors expect',
        'Use the evaluation wizard consistently for all suppliers to maintain objectivity'
      ],
      commonMistakes: [
        'Not evaluating suppliers before using their components — this is a non-conformity in audits',
        'Letting supplier certificates expire without renewal tracking',
        'Treating all suppliers equally — critical suppliers (those affecting safety/performance) need more rigorous evaluation',
        'Not documenting the supplier selection rationale — "we have always used them" is not an acceptable answer for auditors'
      ]
    },
    {
      id: 'company-documents-compliance',
      title: 'Section 7: Company Documents and Compliance',
      content: `<strong>What is this?</strong>

Company-level Documents, Gap Analysis, Audits, and Activities — the modules that manage your <strong>company-wide quality management system (QMS)</strong> documentation and compliance.

<strong>Why does it exist?</strong>

Your QMS operates at the company level. SOPs, quality policies, management review records, training records, and internal audit reports apply to the <strong>entire organisation</strong>, not to a single device. ISO 13485 requires a documented QMS, and these modules are where that documentation lives.

Device-level compliance (covered in Section 13) is different — it tracks documentation specific to a single device's Technical File.

<strong>Where is it?</strong>

These modules are in the <strong>Company Level</strong> sidebar: Documents, Gap Analysis, Audits, Activities.

<strong>What can you do here?</strong>

<strong>Document Control:</strong>
• Upload, organise, and control company-level regulatory documents
• Version control with full revision history
• Approval workflows: Draft → Review → Approve → Effective
• Digital signatures for audit-ready approvals
• Link documents to compliance requirements
• Use templates for common regulatory documents (SOPs, policies, work instructions)

<strong>Gap Analysis:</strong>
• Run automated compliance assessments against regulatory standards
• The system checks your documentation against requirements of ISO 13485, EU MDR, FDA 21 CFR 820
• Each gap is identified with a specific clause reference
• Track remediation progress — assign gaps to team members with due dates
• Re-run assessments to measure improvement over time

<strong>Audits:</strong>
• Schedule and manage internal and external audits
• Create audit plans with scope, criteria, and schedule
• Record audit findings with severity classification
• Track corrective actions arising from audit findings
• Store audit reports and completion evidence

<strong>Activities:</strong>
• Company-level tasks, actions, and workflow items
• Assign activities to team members with due dates
• Track completion and overdue items
• Link activities to audits, CAPAs, or change control requests`,
      tips: [
        'Set up your QMS document structure early — SOPs, policies, and procedures before device-level work',
        'Run gap analysis regularly, not just before audits — it identifies drift early',
        'Use the audit module for both internal audits and tracking external audit findings',
        'Link every gap analysis finding to a remediation activity with an owner and due date'
      ],
      commonMistakes: [
        'Confusing company-level documents with device-level documents — they serve different purposes',
        'Running gap analysis once and never again — compliance is ongoing',
        'Not tracking audit findings to closure — open findings are red flags for external auditors',
        'Leaving documents in Draft status indefinitely — draft documents are not controlled documents'
      ]
    },
    {
      id: 'company-operations',
      title: 'Section 8: Company Operations',
      content: `<strong>What is this?</strong>

Company Operations covers the <strong>operational processes</strong> that run across your entire organisation: Budget, CAPA, Change Control, Post-Market Surveillance (PMS), Training, Communications, and the Audit Log.

<strong>Why does it exist?</strong>

These are the ongoing operational processes that every medical device company must maintain. They are company-wide because a CAPA may affect multiple devices, a change control request may impact the entire QMS, and training applies to people — not to individual devices.

<strong>Where is it?</strong>

Company Operations modules are in the <strong>Company Level</strong> sidebar, below the compliance modules.

<strong>What can you do here?</strong>

<strong>Budget:</strong>
• Track regulatory and development budgets per device and overall
• Monitor spending against plan
• Forecast costs for upcoming regulatory activities

<strong>CAPA (Corrective and Preventive Action):</strong>
• Create CAPA records from complaints, audit findings, non-conformities, or process deviations
• Structured workflow: Initiation → Investigation → Root Cause Analysis → Implementation → Verification of Effectiveness
• Track corrective actions with owners, due dates, and evidence
• Link CAPAs to affected devices, documents, and requirements

<strong>Change Control:</strong>
• Manage changes to your QMS, processes, suppliers, or devices
• Structured CCR (Change Control Request) workflow: Request → Impact Assessment → Approval → Implementation → Verification
• Track affected documents, requirements, and specifications
• Regulatory impact assessment — does this change require a new submission?

<strong>Post-Market Surveillance (PMS):</strong>
• Collect and analyse post-market data: complaints, vigilance reports, literature reviews
• Generate PSUR (Periodic Safety Update Reports) and PMS Reports
• Track trends and signals that may require CAPA or design changes

<strong>Training:</strong>
• Manage training records for all personnel
• Track training requirements per role
• Record training completion and effectiveness assessments

<strong>Communications:</strong>
• Internal notifications and announcements
• Regulatory authority correspondence tracking
• Stakeholder communication logs

<strong>Audit Log:</strong>
• Complete, immutable record of every change made in the system
• Who changed what, when, from what value to what value
• Required for 21 CFR Part 11 compliance and EU MDR audit trail requirements
• Cannot be edited or deleted — this is by design`,
      tips: [
        'CAPA is not just for problems — preventive actions should be initiated proactively',
        'Every change to a device or QMS document should go through Change Control',
        'The Audit Log is your best friend during regulatory audits — it proves everything',
        'Set up training matrices early — auditors will ask "who was trained on what and when?"'
      ],
      commonMistakes: [
        'Creating CAPAs without proper root cause analysis — treating symptoms instead of causes',
        'Making changes without going through Change Control — this is a common audit finding',
        'Not linking PMS findings back to risk management — post-market data must feed back into risk analysis',
        'Ignoring the Audit Log — it exists for regulatory compliance, not just internal tracking'
      ]
    },

    // =========================================================================
    // TIER 3: DEVICE LEVEL MODULES (Sections 10-14)
    // What lives at device level and why?
    // =========================================================================
    {
      id: 'device-dashboard-definition',
      title: 'Section 9: Device Dashboard and Definition',
      content: `<strong>What is this?</strong>

When you select a device from your portfolio, you enter the <strong>Device Level</strong>. The Device Dashboard is your overview of this specific device, and the Device Information tabs (General, Purpose, Identification, Markets) are where you define what the device actually is.

<strong>Why does it exist?</strong>

Every regulatory submission starts with a clear, precise description of the device. Regulators need to know: What is it? What does it do? Who uses it? What is it made of? How is it identified? The Device Information tabs capture all of this in a structured format that maps directly to regulatory submission requirements.

<strong>Where is it?</strong>

Select any device from the Portfolio (Section 6) to enter Device Level. The Dashboard is the default landing page. Device Information tabs are in the sidebar under the device context.

<strong>What can you do here?</strong>

<strong>Device Dashboard:</strong>
• Overview of device completion status — what is done, what is missing
• Classification summary
• Key metrics: document count, risk score, compliance percentage
• Quick links to all device-level modules

<strong>General Tab — Device Description:</strong>
1. Write a clear, technical device description — what it is, what it does, how it works
2. Add key features and technical specifications
3. Include material composition
4. Add device components — name, description, material, supplier
5. Upload product images, technical drawings, 3D models
6. Configure storage and handling conditions (temperature, humidity, shelf life)
7. Define variants — different sizes, configurations, or packaging of the same device

<strong>Purpose Tab — Intended Use and Safety:</strong>
1. Write the <strong>Intended Use</strong> — the single most important regulatory statement
2. Define the <strong>Intended Function</strong> — how the device achieves its purpose
3. Describe the <strong>Mode of Action</strong> — pharmacological, immunological, metabolic, or other
4. Specify the <strong>Patient Population</strong> — age, conditions, exclusions
5. Define the <strong>Use Environment</strong> — hospital, home, ambulatory
6. Identify the <strong>Intended Users</strong> — healthcare professionals, patients, lay users
7. List <strong>Contraindications, Warnings, Precautions, Side Effects</strong>
8. Document <strong>Training Requirements</strong> and <strong>IFU</strong> (Instructions for Use)

<strong>Identification Tab — UDI and Product Codes:</strong>
1. Enter or generate your <strong>Basic UDI-DI</strong> (family-level identifier)
2. Add <strong>UDI-DI</strong> entries for each specific product configuration
3. Specify the issuing agency (GS1, HIBCC, ICCBBA)
4. Configure product codes for regulatory databases

<strong>Markets Tab:</strong>
1. Add target markets (EU, US, UK, Canada, Japan, Australia, etc.)
2. For each market, the system pre-populates the applicable regulatory framework
3. Configure market-specific requirements and submission types
4. Set target submission dates and track approval status`,
      tips: [
        'Write the device description as if for a regulatory submission — clear, technical, precise',
        'The Intended Use is the most scrutinised statement in any submission — invest time in getting it right',
        'Add all device components early — they link to supplier management and risk analysis later',
        'UDI-DI setup is required for EUDAMED registration — do not skip it'
      ],
      commonMistakes: [
        'Writing marketing copy instead of technical regulatory descriptions',
        'Confusing Intended Use with Intended Function — they are different regulatory concepts',
        'Forgetting to list all device components, especially accessories and packaging',
        'Not setting up UDI-DI before attempting EUDAMED registration',
        'Leaving Contraindications empty — every device has at least some'
      ]
    },
    {
      id: 'classification-regulatory-pathway',
      title: 'Section 10: Classification and Regulatory Pathway',
      content: `<strong>What is this?</strong>

The Classification module contains <strong>guided wizards</strong> that determine your device's regulatory classification and the pathway you must follow for market approval.

<strong>Why does it exist?</strong>

Classification is the <strong>gateway to everything else</strong>. Your device class determines: which conformity assessment procedures apply, how much clinical evidence you need, whether you need a Notified Body, what documentation is required, and how long the approval process takes. Getting classification wrong means building the wrong regulatory strategy.

<strong>Where is it?</strong>

Classification is at the <strong>Device Level</strong> in the sidebar. You must be inside a specific device context to access it.

<strong>What can you do here?</strong>

<strong>EU MDR Classification Wizard:</strong>
1. Select <strong>"EU MDR Classification"</strong>
2. Answer guided questions about your device:
   • Is it invasive? For how long?
   • Does it contact the body? Which tissues?
   • Does it use energy? What type?
   • Is it active? Implantable? Reusable?
3. The wizard applies <strong>Rules 1–22</strong> of Annex VIII to determine your class: I, Is, Im, IIa, IIb, or III
4. Review the result — the system explains which rules applied and why
5. Save — this classification drives your entire EU regulatory strategy

<strong>FDA Classification Wizard:</strong>
1. Select <strong>"FDA Classification"</strong>
2. Search for your device type using product codes or descriptions
3. The wizard determines: <strong>Class I, II, or III</strong>
4. Identifies the regulatory pathway: <strong>510(k), PMA, De Novo, or Exempt</strong>
5. Suggests predicate devices for 510(k) submissions

<strong>Understanding Device Classes:</strong>
• <strong>Class I</strong> — Lowest risk. Often self-declaration (EU) or exempt (FDA). Examples: bandages, tongue depressors
• <strong>Class IIa/II</strong> — Moderate risk. Requires Notified Body (EU) or 510(k) (FDA). Examples: blood pressure monitors, syringes
• <strong>Class IIb</strong> — Higher moderate risk. More stringent assessment. Examples: ventilators, infusion pumps
• <strong>Class III</strong> — Highest risk. Full quality assessment (EU) or PMA (FDA). Examples: heart valves, implantable defibrillators

<strong>Multi-Market Classification:</strong>
• Different markets may classify the same device differently — this is normal
• Run both EU MDR and FDA wizards if targeting both markets
• The system tracks classifications per market and adjusts requirements accordingly`,
      tips: [
        'Run classification as early as possible — it determines your entire regulatory strategy',
        'If your design changes significantly, re-run the classification wizard',
        'Save wizard results — they form part of your audit trail and Technical File',
        'Do not assume the same class applies in all markets — always check per-market'
      ],
      commonMistakes: [
        'Not re-running classification after significant design changes',
        'Assuming EU and FDA classes are equivalent — they use different rules',
        'Skipping classification for accessories — accessories need their own classification',
        'Ignoring the up-classification rule — when multiple rules apply, the highest class wins'
      ]
    },
    {
      id: 'design-risk-controls',
      title: 'Section 11: Design and Risk Controls',
      content: `<strong>What is this?</strong>

The Design and Risk Controls modules are the <strong>engineering heart of XyReg</strong>. This is where you manage requirements, system architecture, risk management (ISO 14971 / FMEA), verification & validation, usability engineering, and the traceability matrix.

<strong>Why does it exist?</strong>

Medical device regulations require <strong>design controls</strong> — a systematic process for translating user needs into design requirements, implementing them, verifying they are met, and validating the device works as intended. Risk management (ISO 14971) is mandatory and must be integrated with design controls. The traceability matrix proves that every requirement is linked to a risk, a design output, a verification test, and clinical evidence.

<strong>Where is it?</strong>

These modules are at the <strong>Device Level</strong> in the sidebar, grouped under Design & Risk.

<strong>What can you do here?</strong>

<strong>Requirements Management:</strong>
• Create and manage design input requirements (user needs, design requirements, performance specifications)
• Categorise requirements: functional, performance, safety, regulatory, usability
• Link requirements to risks, test protocols, and evidence
• Track requirement status: Draft, Approved, Verified, Validated

<strong>System Architecture:</strong>
• Document the system architecture of your device
• Create architecture diagrams and component relationships
• Record architecture decisions with rationale
• Link architecture elements to requirements and risks

<strong>Risk Management (ISO 14971 / FMEA):</strong>
1. Create a new FMEA or use a template
2. Identify hazards — what could go wrong?
3. For each hazard: define cause, effect, severity, probability, detectability
4. Calculate the Risk Priority Number (RPN)
5. Define risk controls for high-priority risks
6. Re-assess residual risk after controls are applied
7. Perform risk-benefit analysis — compare residual risks against clinical benefits

<strong>Verification & Validation (V&V):</strong>
• Create test protocols for verification (does it meet requirements?) and validation (does it work for users?)
• Link test protocols to specific requirements
• Record test results with pass/fail and evidence
• Track V&V completion percentage

<strong>Usability Engineering (IEC 62366):</strong>
• Document use-related risk analysis
• Plan and record formative and summative usability evaluations
• Track use errors and their connection to risk controls

<strong>Traceability Matrix:</strong>
• The system automatically generates a traceability matrix linking:
  User Need → Requirement → Risk → Design Output → Verification → Validation → Evidence
• Gaps in the matrix are highlighted — these are compliance risks
• The matrix is a key deliverable for regulatory submissions`,
      tips: [
        'Start risk management early — it should inform design decisions, not follow them',
        'Use the RPN (Risk Priority Number) to prioritise which risks to address first',
        'Review and update the FMEA whenever the design changes',
        'Check the traceability matrix regularly — gaps mean incomplete design controls',
        'Link every risk control to a verification activity for full traceability'
      ],
      commonMistakes: [
        'Treating risk management as a box-ticking exercise — do it properly or it will fail in audit',
        'Not linking risks to requirements — the traceability matrix will show gaps',
        'Doing verification without linking to specific requirements — "we tested it" is not enough',
        'Ignoring usability engineering — use errors are a major source of device recalls',
        'Not updating the FMEA after design changes — the risk analysis must reflect the current design'
      ]
    },
    {
      id: 'device-compliance-instances',
      title: 'Section 12: Compliance Instances (Device Level)',
      content: `<strong>What is this?</strong>

Device-level compliance modules — <strong>Documents, Gap Analysis, Audits, and Activities</strong> — that are scoped to a single, specific device rather than the entire company.

<strong>Why does it exist?</strong>

While company-level compliance (Section 8) manages your QMS, device-level compliance manages the <strong>Technical File</strong> for a specific device. Each device needs its own set of documents (clinical evaluation, risk management report, IFU), its own gap analysis against applicable standards, and its own audit readiness assessment.

This separation is critical because:
• Different devices have different classifications and therefore different documentation requirements
• A Class I device needs far fewer documents than a Class III device
• Gap analysis results differ per device based on its specific characteristics

<strong>Where is it?</strong>

These modules appear in the sidebar when you are at <strong>Device Level</strong>, under the device's compliance section.

<strong>What can you do here?</strong>

<strong>Device Documents:</strong>
• Upload and manage documents specific to this device's Technical File
• Required document types are driven by the device's classification and target markets
• Link documents to specific device sections (risk management, clinical evaluation, etc.)
• Version control and approval workflows — same infrastructure as company documents

<strong>Device Gap Analysis:</strong>
• Run compliance assessments specific to this device
• The system checks against requirements applicable to this device's class and markets
• For example: a Class IIa device targeting EU MDR will be checked against different requirements than a Class I device targeting FDA
• Each gap shows the specific clause reference, what is missing, and what action is needed

<strong>Device Audits:</strong>
• Schedule and manage audits specific to this device
• Notified Body audit preparation
• Design review audits
• Track audit findings and corrective actions at the device level

<strong>Device Activities:</strong>
• Tasks and actions specific to this device
• Remediation items from gap analysis
• Corrective actions from device-level audits
• Document review and approval tasks`,
      tips: [
        'Run device-level gap analysis after completing Classification and Device Information — the system needs this data to generate accurate gaps',
        'Do not confuse device documents with company documents — they serve different regulatory purposes',
        'Use device-level activities to track Technical File completion tasks',
        'Review device gap analysis results before any Notified Body or FDA interaction'
      ],
      commonMistakes: [
        'Uploading device-specific documents (like clinical evaluations) at company level instead of device level',
        'Running gap analysis before classification is complete — results will be incomplete',
        'Not linking device documents to the specific device sections they support',
        'Treating device-level and company-level compliance as the same thing — they have different scopes'
      ]
    },
    {
      id: 'device-operations-lifecycle',
      title: 'Section 13: Device Operations and Lifecycle',
      content: `<strong>What is this?</strong>

Device-level operational modules that manage the <strong>ongoing lifecycle</strong> of a specific device: Design Review, PMS, CAPA, Change Control, Milestones, Manufacturing, and User Access.

<strong>Why does it exist?</strong>

While company-level operations (Section 9) manage organisation-wide processes, device-level operations are scoped to a single device. A CAPA that only affects one device lives here. A design review for a specific device lives here. Manufacturing records for a specific device live here.

<strong>Where is it?</strong>

These modules appear in the sidebar when you are at <strong>Device Level</strong>, under the device's operations section.

<strong>What can you do here?</strong>

<strong>Design Review:</strong>
• Schedule and record formal design reviews at key lifecycle milestones
• Record participants, agenda, decisions, and action items
• Link to specific requirements, risks, and test results under review
• Required at each design phase gate: Input, Output, Verification, Validation, Transfer

<strong>Device-Level PMS:</strong>
• Post-market surveillance data specific to this device
• Complaint tracking and trend analysis
• Vigilance reporting
• Literature review for this device type
• PSUR and PMS report generation

<strong>Device-Level CAPA:</strong>
• CAPAs that are specific to this device (not company-wide)
• Track from initiation through root cause analysis to verification of effectiveness
• Link to affected requirements, risks, and design changes

<strong>Device-Level Change Control:</strong>
• Changes specific to this device's design, labelling, or manufacturing
• Impact assessment on classification, risk analysis, and clinical evaluation
• Track whether changes require a new regulatory submission

<strong>Milestones:</strong>
• Track device lifecycle milestones: concept, design freeze, verification complete, validation complete, market approval, launch
• Set milestone dates and track progress
• Link milestones to design reviews and regulatory submissions

<strong>Manufacturing:</strong>
• Manufacturing process documentation
• Bill of materials (BOM)
• Production specifications
• Process validation records

<strong>User Access:</strong>
• Control who can view and edit this specific device
• Role-based access: Admin, Editor, Viewer
• Useful when different teams manage different devices in the same company`,
      tips: [
        'Conduct design reviews at every phase gate — they are required by ISO 13485 and FDA design controls',
        'Link PMS findings back to risk management — post-market data must update your risk analysis',
        'Use milestones to create a clear timeline for regulatory submissions and approvals',
        'Set up manufacturing documentation before design transfer — it is a regulatory requirement'
      ],
      commonMistakes: [
        'Skipping design reviews — they are mandatory, not optional',
        'Not feeding PMS data back into risk management — this is a closed-loop requirement',
        'Making design changes without going through device-level Change Control',
        'Not tracking manufacturing process validation — this is a common audit finding'
      ]
    },

    // =========================================================================
    // TIER 4: STRATEGIC AND BUSINESS TOOLS (Sections 15-16)
    // Business case, financial planning, and document creation
    // =========================================================================
    {
      id: 'business-case-genesis',
      title: 'Section 14: Business Case and Genesis',
      content: `<strong>What is this?</strong>

The Business Case and Genesis modules are XyReg's <strong>strategic planning tools</strong>. They help you build an investor-ready business case for your medical device, perform financial analysis, and follow a structured 26-step checklist to ensure commercial viability.

<strong>Why does it exist?</strong>

A technically excellent device that nobody pays for is a failed product. Regulatory strategy must be aligned with commercial strategy. Genesis helps you think through the business fundamentals — market sizing, competitive landscape, reimbursement, pricing, and financial projections — alongside your regulatory planning.

<strong>Where is it?</strong>

Genesis and the Venture Blueprint are accessible from the <strong>Device Level</strong> sidebar under business/strategy modules. The rNPV calculator is part of the business analysis tools.

<strong>What can you do here?</strong>

<strong>Venture Blueprint:</strong>
• A structured business case document that covers market analysis, competitive positioning, IP strategy, and go-to-market planning
• Generates an investor-ready presentation from your input data
• Includes an Investor Preview mode — see what investors will see

<strong>The 26-Step Genesis Checklist:</strong>
A guided pathway through four parts:
1. <strong>Product & Technology Foundation</strong> (Steps 1–7): Device definition, classification, TRL assessment
2. <strong>Market & Stakeholder Analysis</strong> (Steps 8–12): User profiles, market sizing, competitor analysis
3. <strong>Strategy & Evidence</strong> (Steps 13–18): IP strategy, clinical evidence, HEOR, reimbursement, revenue forecast
4. <strong>Operational Execution</strong> (Steps 19–26): Partners, manufacturing, team, project plan, risk assessment, business model canvas, funding

<strong>Market Analysis:</strong>
• TAM (Total Addressable Market), SAM (Serviceable Addressable Market), SOM (Serviceable Obtainable Market)
• Competitive landscape mapping
• Market trend analysis

<strong>Reimbursement Strategy:</strong>
• Coding, coverage, and payment pathway analysis
• Payer landscape assessment
• Health economic modelling (HEOR)

<strong>rNPV (Risk-Adjusted Net Present Value):</strong>
• Financial modelling with risk-adjusted projections
• Development phase costs and timelines
• Revenue forecasting with probability-weighted scenarios
• Sensitivity analysis on key variables

<strong>Pricing Strategy:</strong>
• Cost-based, value-based, and market-based pricing models
• Price sensitivity analysis
• Multi-market pricing considerations`,
      tips: [
        'Complete Genesis steps in order — each step builds on previous ones',
        'Use the Investor Preview to see how your business case looks to external stakeholders',
        'The rNPV model is most useful when you have realistic cost estimates and probability assessments',
        'Align your reimbursement strategy with your clinical evidence strategy — they are interconnected'
      ],
      commonMistakes: [
        'Ignoring Genesis because "we are just doing regulatory" — commercial viability affects regulatory strategy',
        'Using unrealistic market sizing — investors and regulators both see through inflated numbers',
        'Not considering reimbursement early enough — a device without a payment pathway has no market',
        'Skipping the competitive analysis — you must know your competitive landscape for regulatory and commercial strategy'
      ]
    },
    {
      id: 'draft-studio',
      title: 'Section 15: Document Studio — Document Creation Workspace',
      content: `<strong>What is this?</strong>

Document Studio is XyReg's <strong>dedicated document creation environment</strong>. It is where you compose, template, and generate the regulatory documents that make up your Technical File and QMS.

<strong>Why does it exist?</strong>

Medical device companies produce hundreds of documents: SOPs, clinical evaluation reports, risk management files, design history files, IFUs, and more. Document Studio provides a structured, template-driven environment for creating these documents — pulling data directly from your device records so you do not have to copy-paste between systems.

<strong>Where is it?</strong>

Document Studio is a <strong>primary module</strong> accessible from the L1 sidebar bar — it is always available regardless of your current context (company or device level).

<strong>What can you do here?</strong>

<strong>Document Templates:</strong>
• Browse a library of regulatory document templates
• Templates are pre-structured to meet regulatory requirements (EU MDR, FDA, ISO 13485)
• Select a template and the system creates a new document with the correct structure
• Templates include guidance text explaining what each section should contain

<strong>Document Composer:</strong>
• Rich text editor for writing and formatting document content
• Insert data directly from your device records — device description, intended use, classification, risk analysis results
• Auto-generated content sections based on your device data
• Collaborative editing — multiple users can work on the same document

<strong>Data Integration:</strong>
• Document Studio pulls data from your device records — no copy-pasting
• When device data changes, referenced content in Document Studio is flagged for update
• This ensures documents always reflect the current state of your device data

<strong>Export and Distribution:</strong>
• Export documents in multiple formats: PDF, Word, HTML
• Generate formatted, submission-ready documents
• Version control — each save creates a new version
• Send documents for review and approval through the standard workflow

<strong>Common Documents Created in Document Studio:</strong>
• Clinical Evaluation Report (CER)
• Risk Management File / Report
• Design History File (DHF)
• Instructions for Use (IFU)
• Summary of Safety and Clinical Performance (SSCP)
• Declaration of Conformity
• Technical File compilation documents`,
      tips: [
        'Use templates rather than starting from blank — they ensure regulatory-compliant structure',
        'Let Document Studio pull data from device records instead of typing it manually — this reduces errors',
        'Create your document structure early, even if content is incomplete — it helps track what is needed',
        'Use the collaborative features for document review rather than emailing drafts back and forth'
      ],
      commonMistakes: [
        'Creating documents outside Document Studio and then uploading them — you lose the data integration benefit',
        'Not using templates — starting from blank leads to missing sections that regulators expect',
        'Ignoring the "flagged for update" notifications when device data changes — documents become outdated',
        'Not setting up approval workflows — Document Studio documents should go through the same review process as any controlled document'
      ]
    }
  ],

  examples: [
    {
      scenario: 'New User Orientation',
      description: 'A new regulatory affairs specialist joins the company and needs to understand XyReg',
      steps: [
        'Read Sections 1-3 to understand what XyReg is, how it is structured, and how to navigate',
        'Review Section 6 to understand the portfolio and find your assigned devices',
        'Open your device and read Section 10 to understand the device definition structure',
        'Run through Section 11 (Classification) to understand your device\'s regulatory pathway',
        'Review Section 12 (Design & Risk) to see the current state of design controls'
      ],
      expectedOutcome: 'Complete mental model of the platform and ability to navigate independently',
      tips: ['Do not skip the architecture section — it prevents confusion later']
    },
    {
      scenario: 'Consultant Onboarding Multiple Clients',
      description: 'A regulatory consultant needs to set up and manage devices for multiple client companies',
      steps: [
        'Read Sections 1-3 for platform orientation',
        'Focus on Section 0 (Client Compass) for multi-company management',
        'Set up each client company following Section 5',
        'Add devices and run classification (Sections 10-11) for each',
        'Use Mission Control (Section 4) daily to track actions across all clients'
      ],
      expectedOutcome: 'Efficient management of multiple client portfolios from a single platform',
      tips: ['Use Client Compass status indicators to prioritise client attention']
    },
    {
      scenario: 'Preparing for a Notified Body Audit',
      description: 'Your company has a Notified Body audit in 3 months and needs to ensure readiness',
      steps: [
        'Run company-level gap analysis (Section 8) for QMS compliance',
        'Run device-level gap analysis (Section 13) for each device in scope',
        'Review supplier certifications (Section 7) for expiry dates',
        'Check traceability matrix (Section 12) for gaps',
        'Ensure all documents are in Effective status, not Draft (Sections 8 and 13)',
        'Review the Audit Log (Section 9) for completeness'
      ],
      expectedOutcome: 'Clear picture of compliance gaps with remediation plan before the audit',
      tips: ['Start remediation immediately — do not wait until the month before the audit']
    }
  ],

  bestPractices: [
    'Read Sections 1-3 before anything else — they build the mental model you need',
    'Understand the Company vs. Device distinction — it prevents 90% of navigation confusion',
    'Enter data directly in XyReg — do not treat it as a secondary repository',
    'Run classification early — it drives your entire regulatory strategy',
    'Maintain the Digital Thread — link requirements to risks to tests to evidence',
    'Use Mission Control daily — it surfaces what needs your attention',
    'Run gap analysis regularly, not just before audits',
    'Keep documents in version control within XyReg — avoid email-based document workflows',
    'Complete Genesis alongside your regulatory work — commercial and regulatory strategies must align'
  ],

  relatedModules: [
    'mission-control',
    'client-compass',
    'product-management',
    'document-studio',
    'compliance-gap-analysis',
    'design-risk',
    'business-analysis',
    'genesis-guide'
  ],

  quickReference: {
    commonTasks: [
      { task: 'Understand the platform structure', steps: ['Read Section 1 (Welcome) and Section 2 (Architecture)'], estimatedTime: '10 min' },
      { task: 'Learn to navigate XyReg', steps: ['Read Section 3 (Navigation and the Sidebar)'], estimatedTime: '5 min' },
      { task: 'Set up a new company', steps: ['Go to Client Compass', 'Click Create Company', 'Complete profile'], estimatedTime: '10 min' },
      { task: 'Add a new device', steps: ['Go to Portfolio', 'Click Add New Product', 'Set name, framework, phase'], estimatedTime: '5 min' },
      { task: 'Classify your device', steps: ['Enter Device Level', 'Go to Classification', 'Run EU MDR or FDA wizard'], estimatedTime: '15 min' },
      { task: 'Run a compliance gap analysis', steps: ['Go to Gap Analysis (company or device level)', 'Select standards', 'Review gaps'], estimatedTime: '10 min' },
      { task: 'Add a supplier', steps: ['Go to Supplier Management', 'Click Add Supplier', 'Enter details and run evaluation'], estimatedTime: '15 min' },
      { task: 'Create a regulatory document', steps: ['Open Document Studio', 'Choose template', 'Compose content', 'Submit for review'], estimatedTime: '30 min' }
    ]
  }
};
