/**
 * Centralized ISO 13485 tooltip data for all sidebar menu items.
 * Keyed by item title (must match SidebarConfig.tsx `name` fields exactly).
 */
export const isoTooltips: Record<string, { role: string; reference?: string }> = {
  // ═══════════════════════════════════════════════════
  // ENTERPRISE (Company) SIDEBAR
  // ═══════════════════════════════════════════════════

  // ── Gold: Strategy & Portfolio ──
  "Dashboard": {
    role: "Executive overview of company-wide compliance, portfolio health, and key metrics."
  },
  "Commercial Intelligence": {
    role: "Strategic commercial analysis — market positioning, business models, and growth planning."
  },
  "Strategic Blueprint": {
    role: "High-level strategic roadmap aligning product development with business objectives."
  },
  "Business Canvas": {
    role: "Business Model Canvas for structured value proposition and go-to-market analysis."
  },
  "Portfolio Business Cases": {
    role: "Feasibility studies and business case analyses across the product portfolio."
  },
  "Market Analysis": {
    role: "Competitive landscape, market sizing, and opportunity assessment."
  },
  "Commercial Performance": {
    role: "Revenue tracking, sales metrics, and commercial KPI dashboards."
  },
  "Pricing Strategy": {
    role: "Pricing models, margin analysis, and pricing optimization for medical devices."
  },
  "Global Reimbursement Strategy": {
    role: "Reimbursement pathway planning across markets and payer systems."
  },
  "Global Market Access": {
    role: "Market access strategy for regulatory and commercial entry across geographies."
  },
  "Portfolio Management": {
    role: "Centralized portfolio oversight — budget, variance, risk, and investment tracking."
  },
  "Portfolio Views": {
    role: "Visual portfolio dashboards — pipeline, lifecycle stage, and resource allocation views."
  },
  "Budget Dashboard": {
    role: "Financial overview of portfolio spending, allocations, and budget health."
  },
  "Variance Analysis": {
    role: "Comparison of planned vs. actual portfolio performance across projects."
  },
  "Investors": {
    role: "Investor relations, funding rounds, and stakeholder reporting."
  },
  "Portfolio Risk Map": {
    role: "Visual risk assessment across the entire product portfolio."
  },

  // ── Blue: Operations & Planning ──
  "Enterprise Roadmap": {
    role: "The Forest: How the company's resources, compliance, and products move together. Tracks global audits, facility openings, multi-product launches, investor rounds, and training weeks."
  },
  "Development Lifecycle": {
    role: "The Tree: The specific regulatory and engineering phases of one device. Tracks design inputs, V&V testing, clinical trials, technical file submission, and batch release.",
    reference: "ISO 13485 §7.3"
  },
  "Operations": {
    role: "Company-wide operational management — suppliers, infrastructure, and calibration.",
    reference: "ISO 13485 §6.3 / §7.4 / §7.6"
  },
  "Suppliers": {
    role: "The Approved Supplier List (ASL). Master list of vetted and approved vendors.",
    reference: "ISO 13485 §7.4 (Purchasing)"
  },
  "Supplier Registry": {
    role: "The Approved Supplier List (ASL). Master list of vetted and approved vendors.",
    reference: "ISO 13485 §7.4 (Purchasing)"
  },
  "Infrastructure": {
    role: "Records for facilities, cleanroom maintenance, and validated IT/Cloud systems.",
    reference: "ISO 13485 §6.3 (Infrastructure)"
  },
  "Calibration Schedule": {
    role: "Master register for all measurement and monitoring equipment requiring periodic calibration.",
    reference: "ISO 13485 §7.6 (Control of Monitoring & Measuring Equipment)"
  },
  "Human Resources": {
    role: "Personnel competency, training records, and organizational qualification management.",
    reference: "ISO 13485 §6.2 (Human Resources)"
  },
  "Training Management": {
    role: "Training plans, records, and effectiveness verification for QMS competency.",
    reference: "ISO 13485 §6.2 (Human Resources — Competence, Training, Awareness)"
  },
  "Competency Matrix": {
    role: "Skills and qualification matrix mapping personnel to required competencies.",
    reference: "ISO 13485 §6.2 (Human Resources — Competence)"
  },

  // ── Green: Quality & Governance ──
  "Quality Governance": {
    role: "Quality management system governance — reviews, CAPAs, nonconformities, and change control.",
    reference: "ISO 13485 §5.6 / §8.3 / §8.5"
  },
  "Management Review": {
    role: "Periodic top-management evaluation of the QMS for suitability, adequacy, and effectiveness.",
    reference: "ISO 13485 §5.6 (Management Review)"
  },
  "NC Trends": {
    role: "Enterprise-level nonconformity trends and analysis across all products.",
    reference: "ISO 13485 §8.3 (Control of Nonconforming Product)"
  },
  "Nonconformity": {
    role: "Register and disposition of products or processes that do not meet specified requirements.",
    reference: "ISO 13485 §8.3 (Control of Nonconforming Product)"
  },
  "CAPA Trends": {
    role: "Enterprise-level CAPA trend analysis — systemic patterns across products.",
    reference: "ISO 13485 §8.5.2 / §8.5.3 (Corrective & Preventive Action)"
  },
  "CAPA": {
    role: "Systematic investigation, root-cause analysis, and corrective/preventive actions for quality events.",
    reference: "ISO 13485 §8.5.2 / §8.5.3 (Corrective & Preventive Action)"
  },
  "Global Change Control": {
    role: "Enterprise-level change control management across all products and processes.",
    reference: "ISO 13485 §7.3.9 (Design & Development Changes)"
  },
  "Change Control": {
    role: "Formal evaluation and approval of design, process, or document changes before implementation.",
    reference: "ISO 13485 §7.3.9 (Design & Development Changes)"
  },
  "Design Review": {
    role: "Structured cross-functional evaluation of design outputs at planned stages.",
    reference: "ISO 13485 §7.3.5 (Design & Development Review)"
  },
  "Global Vigilance & PMS": {
    role: "Enterprise-wide post-market surveillance, vigilance reporting, and safety signal monitoring.",
    reference: "ISO 13485 §8.2.1 (Feedback) / MDR Art. 83-86"
  },
  "Audit Log": {
    role: "Chronological record of all system activities, changes, and user actions for traceability.",
    reference: "ISO 13485 §4.2.5 (Control of Records)"
  },

  // ── Purple: Regulatory & Compliance ──
  "Enterprise Compliance": {
    role: "Centralized regulatory compliance management — quality manual, documents, gap analysis, and audits.",
    reference: "ISO 13485 §4.1 / §4.2"
  },
  "Global Quality Manual": {
    role: "The top-level QMS document describing scope, processes, and policy framework.",
    reference: "ISO 13485 §4.2.2 (Quality Manual)"
  },
  "QMS Document Control": {
    role: "Controlled document repository — creation, review, approval, and distribution of QMS records.",
    reference: "ISO 13485 §4.2.4 (Control of Documents)"
  },
  "Documents": {
    role: "Controlled document repository — creation, review, approval, and distribution of QMS records.",
    reference: "ISO 13485 §4.2.4 (Control of Documents)"
  },
  "QMS Gap Analysis": {
    role: "Assessment of the QMS against applicable standards to identify compliance gaps.",
    reference: "ISO 13485 §4.2.1 (QMS General Requirements)"
  },
  "Gap Analysis": {
    role: "Assessment of the QMS against applicable standards to identify compliance gaps.",
    reference: "ISO 13485 §4.2.1 (QMS General Requirements)"
  },
  "Compliance Activities": {
    role: "Planned quality and product realization activities tracked to completion.",
    reference: "ISO 13485 §7.1 (Planning of Product Realization)"
  },
  "Activities": {
    role: "Planned quality and product realization activities tracked to completion.",
    reference: "ISO 13485 §7.1 (Planning of Product Realization)"
  },
  "Audits": {
    role: "Internal and external audit scheduling, execution, findings, and follow-up.",
    reference: "ISO 13485 §8.2.2 (Internal Audit)"
  },
  "IP Management": {
    role: "Manage patents, trademarks, copyrights, and other intellectual property assets."
  },

  // ── Utility ──
  "Communication": {
    role: "Communication threads with team members, stakeholders, and regulatory experts."
  },

  // ═══════════════════════════════════════════════════
  // DEVICE (Product) SIDEBAR
  // ═══════════════════════════════════════════════════

  // ── Gold: Business Case ──
  "Device Dashboard": {
    role: "Real-time overview of device regulatory compliance status and key milestones.",
    reference: "ISO 13485 §7.3.2 (Design & Development Planning)"
  },
  "Business Case": {
    role: "Strategic and financial analysis supporting device development investment decisions."
  },
  "XyReg Genesis": {
    role: "AI-powered device concept generation and regulatory pathway analysis."
  },
  "Venture Blueprint": {
    role: "Strategic development roadmap and go-to-market planning for the device."
  },
  "Reimbursement": {
    role: "Device-specific reimbursement pathway, coding, and payer strategy analysis."
  },
  "rNPV Analysis": {
    role: "Risk-adjusted Net Present Value analysis for device investment decisions."
  },

  // ── Blue: Device Definition ──
  "Device Definition": {
    role: "Core device specification — purpose, classification, identification, and regulatory scope.",
    reference: "ISO 13485 §7.3.2 / §7.3.3"
  },
  "Overview": {
    role: "High-level design planning summary — scope, team, timeline, and deliverables.",
    reference: "ISO 13485 §7.3.2 (Design & Development Planning)"
  },
  "General": {
    role: "Core device attributes — classification, description, and basic design inputs.",
    reference: "ISO 13485 §7.3.3 (Design & Development Inputs)"
  },
  "Intended Purpose": {
    role: "Formal statement of the device's medical purpose, target population, and conditions of use.",
    reference: "ISO 13485 §7.3.3 (Design & Development Inputs)"
  },
  "Identification": {
    role: "Unique Device Identification (UDI), model numbers, and labeling identifiers.",
    reference: "ISO 13485 §7.5.8 (Identification)"
  },
  "Market & Regulatory": {
    role: "Target markets, applicable regulations, and customer-related requirements.",
    reference: "ISO 13485 §7.2 (Customer-Related Processes)"
  },
  "Markets & Regulatory": {
    role: "Target markets, applicable regulations, and customer-related requirements.",
    reference: "ISO 13485 §7.2 (Customer-Related Processes)"
  },
  "Bundles": {
    role: "Product bundles, kits, and accessory groupings for production and distribution.",
    reference: "ISO 13485 §7.5.1 (Production & Service Provision)"
  },

  // ── Blue: Bill of Materials ──
  "Bill of Materials": {
    role: "Versioned BOMs with cost rollups, supplier tracking, and component traceability.",
    reference: "ISO 13485 §7.5.1 (Production & Service Provision)"
  },

  // ── Blue: Design & Risk Controls ──
  "Design & Risk Controls": {
    role: "Integrated design controls and risk management activities throughout development.",
    reference: "ISO 13485 §7.3 / ISO 14971"
  },
  "Requirements": {
    role: "Design and development input specifications — functional, performance, safety, and regulatory.",
    reference: "ISO 13485 §7.3.3 (Design & Development Inputs)"
  },
  "Architecture": {
    role: "System-level decomposition — hardware, software, mechanical subsystems and interfaces.",
    reference: "ISO 13485 §7.3.3 (Design Inputs)"
  },
  "Risk Management": {
    role: "Identification, evaluation, and control of risks throughout the product lifecycle.",
    reference: "ISO 14971 (referenced by ISO 13485 §7.1)"
  },
  "Verification & Validation": {
    role: "Objective evidence that design outputs meet inputs (verification) and user needs (validation).",
    reference: "ISO 13485 §7.3.6 / §7.3.7 (Verification & Validation)"
  },
  "Usability Engineering": {
    role: "User-centered design process to minimize use errors and optimize the user interface.",
    reference: "IEC 62366-1 (referenced by ISO 13485 §7.3.3)"
  },
  "Traceability": {
    role: "End-to-end linkage from user needs through requirements, risks, V&V, and production.",
    reference: "ISO 13485 §7.5.9 (Traceability)"
  },

  // ── Blue: Device Operations ──
  "Supply Chain": {
    role: "Supplier selection, qualification, and ongoing monitoring for purchased components.",
    reference: "ISO 13485 §7.4 (Purchasing)"
  },
  "Incoming Inspection": {
    role: "Verification of purchased products and materials against acceptance criteria.",
    reference: "ISO 13485 §7.4.3 (Verification of Purchased Product)"
  },
  "Manufacturing": {
    role: "Manufacturing process design, work instructions, and production controls.",
    reference: "ISO 13485 §7.5.1 (Production & Service Provision)"
  },
  "Production": {
    role: "Production planning, batch records, and in-process controls.",
    reference: "ISO 13485 §7.5.1 (Production & Service Provision)"
  },
  "Sterilization & Cleanliness": {
    role: "Sterilization validation, bioburden control, and cleanliness requirements.",
    reference: "ISO 13485 §7.5.2 / §7.5.5 / §7.5.7"
  },
  "Preservation & Handling": {
    role: "Packaging, storage, handling, and distribution controls to maintain product conformity.",
    reference: "ISO 13485 §7.5.11 (Preservation of Product)"
  },
  "Installation & Servicing": {
    role: "Installation requirements, field service procedures, and servicing records.",
    reference: "ISO 13485 §7.5.3 / §7.5.4"
  },
  "Customer Property": {
    role: "Control and safeguarding of customer-owned materials, samples, or data.",
    reference: "ISO 13485 §7.5.10 (Customer Property)"
  },

  // ── Blue: Clinical & Milestones ──
  "Clinical Trials": {
    role: "Planning, execution, and evidence from clinical investigations and design validation studies.",
    reference: "ISO 13485 §7.3.7 (Design Validation)"
  },

  // ── Green: Device Quality Governance ──
  // (Nonconformity, CAPA, Change Control, Design Review, Audits, Activities already defined above)

  // ── Purple: Regulatory & Submissions ──
  "Regulatory & Submissions": {
    role: "Device-level regulatory documentation, gap analysis, and market approval tracking.",
    reference: "ISO 13485 §4.2 / MDR Annex II-III"
  },
  "Technical Documentation": {
    role: "Complete technical file / design dossier for regulatory submissions.",
    reference: "ISO 13485 §4.2.4 (Control of Documents) / MDR Annex II"
  },
  "Technical File": {
    role: "Auditor-ready view of your complete technical dossier, organized by MDR Annex II/III structure, with market approval status and certificates.",
    reference: "ISO 13485 §4.2.4 / MDR Annex II-III"
  },

  // ── Green: Post-Market ──
  "Post-Market Surveillance": {
    role: "Systematic monitoring of device safety and performance after market release, including vigilance reporting.",
    reference: "ISO 13485 §8.2.1 (Feedback) / MDR Art. 83-86"
  },

  // ── Mission Control & Utility ──
  "Mission Control": {
    role: "Centralized task management and cross-functional coordination hub."
  },
  "Client Compass": {
    role: "Customer and client relationship management across the portfolio."
  },
  "Investor Marketplace": {
    role: "Investment opportunity showcase and investor engagement platform."
  },
  "User Access": {
    role: "Control team permissions and manage user roles for competency and access.",
    reference: "ISO 13485 §6.2 (Human Resources)"
  }
};
