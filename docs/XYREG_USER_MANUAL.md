# XyReg User Manual
## Medical Device Regulatory Management Platform

**Version 1.0**  
**Last Updated: December 2024**

---

# Table of Contents

1. [Part 1: Introduction & Getting Started](#part-1-introduction--getting-started)
2. [Part 2: Company-Level Management](#part-2-company-level-management)
3. [Part 3: Product Management](#part-3-product-management)
4. [Part 4: Regulatory & Compliance](#part-4-regulatory--compliance)
5. [Part 5: Design & Risk Controls](#part-5-design--risk-controls)
6. [Part 6: Business Case & Strategy](#part-6-business-case--strategy)
7. [Part 7: Document Management](#part-7-document-management)
8. [Part 8: Advanced Features](#part-8-advanced-features)
9. [Appendix A: Glossary of Terms](#appendix-a-glossary-of-terms)
10. [Appendix B: Regulatory Framework Reference](#appendix-b-regulatory-framework-reference)
11. [Appendix C: Quick Reference Cards](#appendix-c-quick-reference-cards)

---

# Part 1: Introduction & Getting Started

## Chapter 1.1: What is XyReg?

### Overview

XyReg is a comprehensive **Medical Device Regulatory Management Platform** designed specifically for medical technology companies navigating the complex landscape of global regulatory requirements. The platform provides end-to-end support for the entire product lifecycle, from initial concept through market authorization and post-market surveillance.

### Purpose and Vision

The medical device industry faces unprecedented regulatory complexity. With regulations like the EU MDR (Medical Device Regulation 2017/745), FDA 21 CFR Part 820, and emerging requirements in markets like China (NMPA), India (CDSCO), and others, companies need a unified platform to:

- **Manage regulatory submissions** across multiple global markets
- **Maintain compliance** with ISO 13485 Quality Management System requirements
- **Track product development** through structured lifecycle phases
- **Document risk management** per ISO 14971 standards
- **Generate and manage** UDI (Unique Device Identification) data
- **Coordinate teams** across regulatory, quality, R&D, and commercial functions

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Unified Platform** | Single source of truth for all regulatory documentation and compliance data |
| **Multi-Market Support** | Pre-configured templates for EU MDR, FDA, UKCA, China NMPA, India CDSCO, Australia TGA, Japan PMDA, and more |
| **Lifecycle Management** | Structured phases from concept to end-of-life with milestone tracking |
| **Risk-Based Approach** | Integrated risk management aligned with ISO 14971 |
| **Traceability** | Complete requirements traceability from user needs to verification |
| **Collaboration** | Team coordination with role-based access and workflow approvals |
| **AI-Assisted** | Intelligent assistants for classification, UDI generation, and hazard identification |

### Target Users

XyReg is designed for multiple stakeholder groups within medical device organizations:

#### Regulatory Affairs Professionals
- Manage multi-market regulatory strategies
- Track submission timelines and status
- Maintain GSPR (General Safety and Performance Requirements) compliance
- Generate regulatory documentation

#### Quality Assurance Teams
- Maintain QMS compliance with ISO 13485
- Manage audits (internal, external, notified body)
- Track CAPAs (Corrective and Preventive Actions)
- Oversee supplier qualification

#### Research & Development
- Document design history files
- Manage requirements specifications
- Track verification and validation activities
- Maintain system architecture documentation

#### Product Management
- Oversee product portfolio health
- Track development milestones
- Manage business case and market analysis
- Coordinate cross-functional activities

#### Executive Leadership
- Portfolio-level dashboards
- Risk and compliance visibility
- Resource allocation insights
- Strategic planning support

---

## Chapter 1.2: Platform Architecture

### System Overview

XyReg is built on a modern, cloud-based architecture that provides:

- **Web-Based Access**: Access from any modern browser without software installation
- **Real-Time Collaboration**: Multiple users can work simultaneously with live updates
- **Secure Data Storage**: Enterprise-grade security with encryption at rest and in transit
- **Scalable Infrastructure**: Handles growing product portfolios and team sizes

### Hierarchical Data Model

XyReg organizes data in a logical hierarchy:

```
Company (Organization Level)
├── Products (Device Families)
│   ├── Variants (Device Configurations)
│   ├── Lifecycle Phases
│   ├── Regulatory Submissions
│   ├── Design History
│   └── Risk Management Files
├── Quality Management System
│   ├── Processes
│   ├── Audits
│   └── CAPAs
├── Documents
│   ├── Templates
│   └── Controlled Documents
└── Team
    ├── Users
    ├── Roles
    └── Training Records
```

### Navigation Structure

The platform uses a consistent navigation pattern:

1. **Global Navigation** (Left Sidebar)
   - Company Dashboard
   - Product Portfolio
   - QMS Dashboard
   - Document Hub
   - Team Management
   - Settings

2. **Product Navigation** (When in Product Context)
   - Product Dashboard
   - Device Information
   - Lifecycle & Phases
   - Regulatory Markets
   - Design Controls
   - Risk Management
   - Business Case

3. **Contextual Actions** (Top Bar)
   - Search
   - Notifications
   - Help
   - User Profile

---

## Chapter 1.3: Getting Started

### First-Time Login

1. Navigate to your organization's XyReg instance URL
2. Enter your email address and password
3. Complete two-factor authentication if enabled
4. Accept the terms of service (first login only)

### Initial Setup Checklist

After your administrator has set up your organization, complete these steps:

#### For Administrators
- [ ] Configure company information (name, address, SRN)
- [ ] Set up department structure
- [ ] Create user accounts and assign roles
- [ ] Configure default markets for products
- [ ] Upload company logo
- [ ] Set up Notified Body information (if applicable)

#### For All Users
- [ ] Complete profile information
- [ ] Set notification preferences
- [ ] Review assigned training requirements
- [ ] Familiarize yourself with the dashboard

### Understanding the Dashboard

Upon login, you'll see the **Company Dashboard** which provides:

#### Portfolio Health Overview
- Total number of active products
- Products by lifecycle phase
- Compliance status indicators
- Upcoming deadlines and milestones

#### Quick Actions
- Create new product
- Access recent documents
- View pending tasks
- Check notifications

#### Activity Feed
- Recent changes across the portfolio
- Team member activities
- System notifications

---

## Chapter 1.4: User Roles and Permissions

### Role-Based Access Control

XyReg implements a comprehensive role-based access control (RBAC) system to ensure appropriate data access and action permissions.

### Standard Roles

#### Administrator
**Access Level**: Full system access

**Capabilities**:
- Create and manage user accounts
- Configure company settings
- Manage department structure
- Access all products and documents
- Configure system integrations
- Manage templates and workflows

#### Regulatory Manager
**Access Level**: Full regulatory and product access

**Capabilities**:
- Create and manage products
- Configure regulatory strategies
- Manage submissions and approvals
- Access all regulatory documentation
- Generate reports and exports

#### Quality Manager
**Access Level**: Full QMS and quality access

**Capabilities**:
- Manage QMS processes and documentation
- Create and manage audits
- Handle CAPAs and deviations
- Manage supplier qualification
- Access training records

#### Product Owner
**Access Level**: Assigned product(s) full access

**Capabilities**:
- Full access to assigned products
- Manage product lifecycle
- Create and edit design documentation
- Coordinate team activities
- Generate product reports

#### Team Member
**Access Level**: Assigned tasks and documents

**Capabilities**:
- View assigned products
- Complete assigned tasks
- Edit documents as permitted
- Update personal information
- View relevant dashboards

#### Viewer
**Access Level**: Read-only access

**Capabilities**:
- View dashboards and reports
- Read documentation
- No edit capabilities

### Custom Roles

Administrators can create custom roles by combining specific permissions:

- Product Management permissions
- Document Management permissions
- QMS permissions
- User Management permissions
- Financial/Business Case permissions
- Audit permissions

---

## Chapter 1.5: System Navigation

### Main Navigation Elements

#### Left Sidebar
The primary navigation panel provides access to major modules:

| Icon | Module | Description |
|------|--------|-------------|
| 🏠 | Dashboard | Company-level overview and portfolio health |
| 📦 | Products | Product portfolio management |
| 📋 | QMS | Quality Management System dashboard |
| 📄 | Documents | Document hub and template management |
| 👥 | Team | User and department management |
| ⚙️ | Settings | System configuration |

#### Breadcrumb Navigation
Shows your current location in the hierarchy:
```
Company > Products > [Product Name] > Regulatory > EU MDR
```

Click any level to navigate back.

#### Context Switcher
Quickly switch between products without returning to the portfolio view.

#### Search
Global search across:
- Products and variants
- Documents
- Users
- Regulatory submissions
- Requirements
- Risks

#### Notifications Bell
Displays:
- Task assignments
- Document reviews
- Approval requests
- System alerts
- Deadline reminders

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open global search |
| `Ctrl/Cmd + N` | Create new item |
| `Ctrl/Cmd + S` | Save current form |
| `Esc` | Close modal/dialog |
| `?` | Open keyboard shortcuts help |

---

# Part 2: Company-Level Management

## Chapter 2.1: Company Dashboard

### Overview

The Company Dashboard serves as the central hub for organizational oversight, providing executives and managers with a comprehensive view of portfolio health, compliance status, and team activities.

### Dashboard Components

#### Portfolio Health Score

A composite metric (0-100) calculated from:
- **Regulatory Compliance** (30%): GSPR completion, submission status
- **Quality Metrics** (25%): Audit findings, CAPA closure rates
- **Timeline Adherence** (25%): Milestone completion, deadline management
- **Documentation Status** (20%): Document currency, approval status

The score is color-coded:
- 🟢 Green (80-100): Healthy
- 🟡 Yellow (60-79): Attention needed
- 🔴 Red (0-59): Critical issues

#### Product Portfolio Summary

Visual representation of products by:
- **Lifecycle Phase**: Concept, Development, Verification, Market, End-of-Life
- **Device Class**: Class I, IIa, IIb, III (EU MDR) or Class I, II, III (FDA)
- **Market Status**: Active markets, pending submissions, planned entries

#### Compliance Overview

Quick-view panels showing:
- ISO 13485 certification status
- Notified Body audit schedule
- GSPR compliance percentages
- UDI/EUDAMED registration status

#### Activity Timeline

Chronological feed of:
- Recent product updates
- Document approvals
- Team activities
- System events

### Customizing the Dashboard

Users can personalize their dashboard view:

1. Click the **Customize** button (gear icon)
2. Drag and drop widgets to rearrange
3. Toggle widget visibility
4. Set widget size (small, medium, large)
5. Configure refresh intervals

### Export and Reporting

Generate dashboard reports:
- **PDF Export**: Static snapshot of current dashboard
- **Excel Export**: Underlying data for further analysis
- **Scheduled Reports**: Automatic email delivery (daily, weekly, monthly)

---

## Chapter 2.2: Company Information & Settings

### Basic Company Information

Navigate to **Settings > Company Profile** to manage:

#### Organization Details
- **Company Name**: Legal entity name
- **Trading Name**: Commercial name if different
- **Registration Number**: Business registration
- **VAT/Tax ID**: Tax identification number

#### Contact Information
- **Address**: Street, City, Postal Code, Country
- **Phone**: Main contact number
- **Email**: General contact email
- **Website**: Company website URL

#### Regulatory Identity
- **SRN (Single Registration Number)**: EU registration identifier
- **DUNS Number**: Dun & Bradstreet identifier
- **FDA Establishment Registration**: If applicable

### Authorized Representative (AR) Configuration

For non-EU manufacturers, configure your EU Authorized Representative:

- **AR Name**: Legal name of the representative
- **AR Address**: Full EU address
- **AR Contact**: Contact person details
- **AR SRN**: Representative's SRN

### Production Site Information

If manufacturing occurs at a different location:

- **Site Name**: Facility identifier
- **Site Address**: Full address
- **Site Contact**: Facility manager contact

### Importer Configuration

For products imported into specific markets:

Add importers with:
- Country/Market
- Importer name and address
- Contact information
- Products covered

### Notified Body Selection

Configure your Notified Body relationship:

1. Select from the pre-populated list of EU Notified Bodies
2. Enter your certificate number
3. Set certificate validity dates
4. Upload certificate documents

---

## Chapter 2.3: Department Structure

### Understanding Departments

XyReg uses a department structure to:
- Organize users by function
- Assign responsibilities for processes
- Route approvals and workflows
- Generate departmental reports

### Default Department Template

XyReg provides a default structure based on typical medical device company organization:

```
Executive Management
├── Regulatory Affairs
├── Quality Assurance
│   ├── Quality Control
│   └── Supplier Quality
├── Research & Development
│   ├── Hardware Engineering
│   ├── Software Engineering
│   └── Systems Engineering
├── Clinical Affairs
├── Manufacturing/Operations
├── Commercial/Sales
└── Finance
```

### Creating Custom Departments

1. Navigate to **Settings > Organization > Departments**
2. Click **Add Department**
3. Enter:
   - Department name
   - Abbreviation/code
   - Parent department (if nested)
   - Department head (optional)
   - Description

4. Click **Save**

### Assigning Users to Departments

1. Go to **Team > Users**
2. Select a user
3. Edit their profile
4. Select **Primary Department**
5. Add **Secondary Departments** if applicable

### Department-Based Workflows

Configure department involvement in key processes:

| Process | Department Assignment |
|---------|----------------------|
| Document Review | By document type |
| Risk Assessment | R&D + Quality |
| CAPA Investigation | Quality + affected department |
| Audit Participation | Quality + audited department |

---

## Chapter 2.4: Team Management

### User Administration

#### Creating New Users

1. Navigate to **Team > Users**
2. Click **Add User**
3. Complete the form:
   - Email address (used for login)
   - First and last name
   - Job title
   - Department assignment
   - Role assignment
4. Click **Create User**
5. System sends invitation email automatically

#### User Profile Management

Each user profile contains:

**Personal Information**
- Name, title, contact details
- Profile photo
- Time zone setting
- Language preference

**Organization Details**
- Department assignment
- Reporting manager
- Start date
- Employee ID (optional)

**System Access**
- Role assignments
- Product access permissions
- Special permissions

**Training & Qualifications**
- Training records
- Certifications
- Competency assessments

### Managing User Status

Users can be:
- **Active**: Full access per assigned role
- **Inactive**: Account disabled, historical data preserved
- **Pending**: Invitation sent, not yet activated

### Bulk User Operations

For large teams:
1. Click **Import Users**
2. Download the CSV template
3. Fill in user details
4. Upload completed CSV
5. Review and confirm import

---

## Chapter 2.5: Training Matrix

### Purpose

The Training Matrix ensures team competency by:
- Defining required training by role
- Tracking completion status
- Alerting on expired or upcoming training
- Generating training compliance reports

### Training Categories

#### Regulatory Training
- EU MDR fundamentals
- FDA 21 CFR Part 820
- ISO 13485 requirements
- Market-specific regulations

#### Technical Training
- Product-specific training
- Software tools training
- Process training
- Equipment operation

#### Quality Training
- Quality system procedures
- CAPA management
- Audit participation
- Deviation handling

#### Safety Training
- Laboratory safety
- Product safety
- Data protection
- Cybersecurity awareness

### Creating Training Requirements

1. Navigate to **Team > Training Matrix**
2. Click **Add Training Requirement**
3. Enter:
   - Training name
   - Category
   - Description
   - Duration (if e-learning)
   - Validity period (e.g., annual renewal)
   - Applicable roles/departments
4. Upload training materials if available
5. Click **Save**

### Assigning Training

Training can be assigned:
- **Automatically**: Based on role/department rules
- **Manually**: Individual assignment by manager
- **Event-triggered**: New product assignment, role change

### Tracking Completion

For each training record:
- **Assigned**: Training pending
- **In Progress**: Partially completed
- **Completed**: Finished with documentation
- **Expired**: Validity period exceeded

### Training Documentation

Upload completion evidence:
- Certificates
- Test results
- Attendance records
- Trainer signatures

### Compliance Reporting

Generate reports showing:
- Training completion by department
- Overdue training alerts
- Expiring training (next 30/60/90 days)
- Training history by user

---

## Chapter 2.6: Supplier Management

### Overview

Medical device manufacturers must maintain qualified suppliers per ISO 13485 requirements. XyReg's Supplier Management module helps:

- Maintain approved supplier list
- Document qualification activities
- Track supplier performance
- Manage supplier audits

### Supplier Types

| Type | Description | Examples |
|------|-------------|----------|
| Critical | Directly impacts product quality/safety | Component manufacturers, sterilization services |
| Major | Significant quality impact | Packaging suppliers, calibration services |
| Minor | Limited quality impact | Office supplies, general services |

### Adding a New Supplier

1. Navigate to **Company > Suppliers**
2. Click **Add Supplier**
3. Complete supplier profile:

**Basic Information**
- Company name
- Supplier type
- Categories (materials, services, etc.)
- Contact information

**Qualification Details**
- Qualification method
- Initial qualification date
- Re-qualification frequency
- Quality certifications (ISO 13485, ISO 9001, etc.)

**Products/Services**
- List of supplied items
- Applicable products using this supplier

4. Upload supporting documents:
   - Quality agreements
   - Certificates
   - Audit reports
   - Capability assessments

5. Set approval status

### Supplier Qualification Process

Standard qualification workflow:

1. **Request**: Identify need for new supplier
2. **Assessment**: Evaluate supplier capabilities
3. **Questionnaire**: Send and review supplier questionnaire
4. **Audit** (if required): On-site or remote audit
5. **Approval**: Quality approval with conditions if needed
6. **Monitoring**: Ongoing performance tracking

### Performance Monitoring

Track supplier metrics:
- Delivery performance (on-time %)
- Quality performance (acceptance rate)
- Responsiveness (communication)
- Documentation compliance

### Supplier Audits

Schedule and document supplier audits:
- Plan audit scope and agenda
- Assign audit team
- Document findings
- Track corrective actions
- Record audit completion

---

## Chapter 2.7: QMS Dashboard

### ISO 13485 Compliance Overview

The QMS Dashboard provides real-time visibility into Quality Management System status:

#### Compliance Score
Overall ISO 13485 compliance percentage based on:
- Process documentation status
- Procedure currency
- Audit closure status
- CAPA effectiveness
- Training compliance

#### Key Performance Indicators

| KPI | Target | Description |
|-----|--------|-------------|
| CAPA Closure Rate | >90% | CAPAs closed within target timeframe |
| Audit Finding Closure | >95% | Audit findings addressed on time |
| Document Currency | 100% | Documents reviewed within validity period |
| Training Compliance | 100% | Required training completed |
| Supplier Qualification | 100% | Suppliers qualified per schedule |

### Process Map

Visual representation of QMS processes:

```
Management Processes
├── Management Review
├── Policy & Objectives
└── Resource Management

Core Processes
├── Design & Development
├── Purchasing
├── Production
├── Service Delivery
└── Product Realization

Support Processes
├── Document Control
├── Records Management
├── Training
├── Infrastructure
├── Monitoring & Measurement
└── Nonconformance & CAPA
```

### Document Control Status

Overview of controlled documents:
- Total controlled documents
- Documents due for review
- Pending approvals
- Recently updated documents

### Upcoming Activities

Timeline of QMS activities:
- Scheduled audits
- Management reviews
- Procedure reviews
- Training expirations
- Supplier re-qualifications

---

## Chapter 2.8: Company-Level Audits

### Audit Types

XyReg supports multiple audit categories:

#### Internal Audits
- Scheduled per annual audit program
- Covers all QMS processes
- Conducted by trained internal auditors
- Identifies improvement opportunities

#### Notified Body Audits
- Initial certification audits
- Surveillance audits (annual)
- Re-certification audits (3-5 year cycle)
- Unannounced audits
- Technical documentation reviews

#### Regulatory Authority Inspections
- FDA inspections
- National competent authority visits
- Market surveillance activities

#### Supplier Audits
- Qualification audits
- Periodic re-qualification
- For-cause audits

### Managing Audits

#### Creating an Audit

1. Navigate to **Company > Audits**
2. Click **Schedule Audit**
3. Enter audit details:
   - Audit type
   - Scope/areas to be audited
   - Scheduled dates
   - Lead auditor
   - Audit team
   - Auditee contacts

4. Link relevant documents
5. Set status to "Planned"

#### During the Audit

Update audit record with:
- Actual dates
- Attendees
- Areas reviewed
- Documents examined

#### Recording Findings

For each finding:
- Finding type (Observation, Minor NC, Major NC, Critical)
- Description
- Affected process/area
- Evidence reference
- Root cause (initial assessment)
- Responsible person

#### Post-Audit Actions

1. Generate audit report
2. Create CAPAs for findings
3. Track corrective action implementation
4. Verify effectiveness
5. Close audit

### Audit Program Management

Plan the annual audit schedule:

1. Navigate to **Company > Audits > Audit Program**
2. Create annual program:
   - Select year
   - Define audit frequency by process
   - Assign tentative dates
   - Allocate auditor resources

3. Generate audit calendar
4. Track completion against plan

---

## Chapter 2.9: Post-Market Surveillance (Company Level)

### PMS/PMCF Overview

Post-Market Surveillance activities at the company level include:

- Aggregate analysis across products
- Trend identification
- Periodic Safety Update Reports (PSUR)
- Field Safety Corrective Actions (FSCA) coordination
- Vigilance reporting

### Complaint Management

#### Complaint Intake

All product complaints flow through a centralized intake:

1. Record complaint source (customer, distributor, field)
2. Capture complaint details
3. Assign to product owner
4. Initiate investigation

#### Investigation Workflow

1. **Triage**: Initial severity assessment
2. **Investigation**: Root cause analysis
3. **Reportability Assessment**: Determine if reportable event
4. **Corrective Action**: Define and implement actions
5. **Closure**: Document resolution

### Vigilance Management

#### Reportable Events

Track incidents requiring regulatory reporting:
- Serious injuries
- Deaths
- Significant performance degradation
- Near-misses with safety implications

#### Reporting Timelines

| Event Type | EU MDR Timeline | FDA Timeline |
|------------|----------------|--------------|
| Death/Serious Injury | 10 days | 30 days (MDR) |
| Serious Public Health Threat | 2 days | 5 days |
| Other Serious Incidents | 15 days | 30 days |

### Trend Analysis

Company-level trend monitoring:
- Complaint rates by product
- Incident categories
- Geographic distribution
- Temporal patterns

### PSUR Generation

Periodic Safety Update Reports (per EU MDR):
- Class III: Annual
- Class IIb implantables: Annual
- Class IIa/IIb: Every 2 years
- Class I: Upon request

---

# Part 3: Product Management

## Chapter 3.1: Product Portfolio

### Portfolio Overview

The Product Portfolio view displays all products within your organization:

#### List View
Tabular display with sortable columns:
- Product name
- Product code/reference
- Device class
- Lifecycle phase
- Active markets
- Compliance status

#### Card View
Visual cards showing:
- Product image
- Key identifiers
- Status indicators
- Quick actions

#### Kanban View
Products organized by lifecycle phase:
- Concept
- Development
- Verification
- Market Authorization
- Post-Market
- End of Life

### Portfolio Filtering

Filter products by:
- Lifecycle phase
- Device class
- Market status
- Product family/category
- Assigned team member
- Compliance status

### Product Families and Grouping

Organize related products:

#### Product Families
Group products sharing common:
- Technology platform
- Therapeutic area
- Target indication

#### Basic UDI-DI Groups
Products sharing the same Basic UDI-DI:
- Same manufacturer
- Same intended purpose
- Same essential characteristics

---

## Chapter 3.2: Creating a New Product

### Product Creation Wizard

1. Navigate to **Products > Add Product**
2. Complete the creation wizard:

#### Step 1: Basic Information
- **Product Name**: Commercial product name
- **Product Code**: Internal reference number
- **Product Family**: Select or create family
- **Description**: Brief product description

#### Step 2: Device Classification
- **Primary Market**: EU, US, or other
- **Device Type**: Active, Non-Active, In-Vitro Diagnostic, Software
- **Intended Purpose**: Structured description
- **Classification**: Use built-in classification assistant or manual entry

#### Step 3: Regulatory Strategy
- **Target Markets**: Select all applicable markets
- **Conformity Route**: Self-certification, Notified Body, etc.
- **Priority Market**: Primary market focus

#### Step 4: Team Assignment
- **Product Owner**: Primary responsible person
- **Regulatory Lead**: Regulatory affairs contact
- **Quality Lead**: Quality assurance contact
- **Technical Lead**: R&D contact

#### Step 5: Timeline
- **Target Launch Date**: Planned market entry
- **Key Milestones**: Initial milestone dates

3. Review and confirm
4. Product is created with initial setup complete

### Post-Creation Setup

After product creation, complete additional configuration:

- [ ] Upload product images
- [ ] Complete device definition
- [ ] Configure variants (if applicable)
- [ ] Set up regulatory market details
- [ ] Initialize design history file
- [ ] Create initial risk management file

---

## Chapter 3.3: Product Dashboard

### Overview

Each product has a dedicated dashboard providing:

#### Compliance Summary
- Overall compliance score
- GSPR status (for EU MDR products)
- Essential requirements status
- Documentation completeness

#### Lifecycle Status
- Current phase
- Phase completion percentage
- Upcoming phase transition criteria
- Recent phase activities

#### Market Status
Visual map showing:
- Active markets (green)
- Pending submissions (yellow)
- Planned markets (blue)
- Not planned (gray)

#### Timeline View
Gantt-style visualization:
- Major milestones
- Phase durations
- Critical path items
- Delays and risks

#### Team Activity
Recent activities by team members:
- Document updates
- Task completions
- Comments and discussions
- Approval actions

### Dashboard Actions

Quick actions available:
- **Edit Product**: Modify basic information
- **Generate Report**: Create product summary
- **Share**: Send dashboard link
- **Export**: Download data

---

## Chapter 3.4: Device Definition

### Intended Purpose

The Intended Purpose is a critical regulatory element defining:

#### Structured Fields
- **Medical Purpose**: What the device does medically
- **Target Population**: Who uses the device/patients
- **Target Body Part**: Anatomical location (if applicable)
- **Clinical Context**: Healthcare setting
- **User Profile**: Intended operators

#### Intended Purpose Statement
Generated from structured fields:

> "[Product Name] is intended for [medical purpose] in [target population] for use on/in [target body part] by [user profile] in [clinical context]."

### Device Classification

#### EU MDR Classification
Based on Annex VIII rules:
- Duration (transient, short-term, long-term)
- Invasiveness (non-invasive, invasive, surgically invasive)
- Active/Non-active
- Specific rules (measuring, IVD, etc.)

Classification result: Class I, IIa, IIb, or III

#### FDA Classification
Based on 21 CFR Parts 862-892:
- Product code search
- Regulation number
- Classification (I, II, III)
- Submission type (510(k), De Novo, PMA)

#### Other Market Classifications
- **UKCA**: Follows EU MDR rules
- **China NMPA**: Class I, II, III
- **Australia TGA**: Class I, IIa, IIb, III, AIMD
- **Japan PMDA**: Class I, II, III, IV
- **India CDSCO**: Class A, B, C, D

### Technical Specifications

Document key technical characteristics:

#### Physical Characteristics
- Dimensions and weight
- Materials
- Packaging configuration

#### Performance Specifications
- Key performance parameters
- Measurement ranges
- Accuracy/precision

#### Electrical Characteristics (if applicable)
- Power requirements
- Safety classifications (IEC 60601)
- EMC considerations

#### Software Characteristics (if applicable)
- Safety classification (IEC 62304)
- Cybersecurity considerations
- Interoperability requirements

### Variants Configuration

Define product variants within the same Basic UDI-DI group:

| Variant | Description | Size | Configuration |
|---------|-------------|------|---------------|
| Model A | Standard version | Small | Basic |
| Model B | Standard version | Medium | Basic |
| Model C | Advanced version | Small | Enhanced |

Each variant has:
- Unique UDI-DI
- Specific GMDN/EMDN codes
- Distinct labeling configuration

---

## Chapter 3.5: Lifecycle Management

### Lifecycle Phases

XyReg uses a structured lifecycle model aligned with regulatory expectations:

#### Phase 1: Concept
**Purpose**: Define product concept and initial requirements

**Key Activities**:
- Market need identification
- Preliminary intended purpose
- Initial regulatory strategy
- Feasibility assessment
- Business case development

**Phase Gate Criteria**:
- Business case approved
- Preliminary requirements documented
- Regulatory pathway identified

#### Phase 2: Planning
**Purpose**: Detailed planning for development

**Key Activities**:
- Development plan creation
- Resource allocation
- Risk management planning
- Regulatory submission timeline
- Clinical strategy (if needed)

**Phase Gate Criteria**:
- Development plan approved
- Team assigned
- Budget allocated

#### Phase 3: Design & Development
**Purpose**: Design, develop, and document the device

**Key Activities**:
- Design inputs documented
- Design outputs generated
- Prototype development
- Design reviews
- Risk analysis (FMEA, etc.)

**Phase Gate Criteria**:
- Design freeze achieved
- Risk acceptability demonstrated
- Design review completed

#### Phase 4: Verification & Validation
**Purpose**: Confirm design meets requirements

**Key Activities**:
- Verification testing
- Validation testing
- Clinical evaluation/investigation
- Usability studies
- Process validation

**Phase Gate Criteria**:
- All verification complete
- Validation demonstrates fitness for purpose
- Clinical evidence sufficient

#### Phase 5: Market Authorization
**Purpose**: Achieve regulatory clearance/approval

**Key Activities**:
- Technical documentation compilation
- Submission preparation
- Regulatory authority interaction
- Certificate/clearance receipt
- Launch preparation

**Phase Gate Criteria**:
- Regulatory authorization received
- Manufacturing release approved
- Launch readiness confirmed

#### Phase 6: Post-Market
**Purpose**: Maintain product in market

**Key Activities**:
- PMS/PMCF activities
- Complaint handling
- Vigilance reporting
- Periodic updates
- Continuous improvement

**Ongoing Requirements**:
- PMS plan execution
- PSUR generation
- Certificate maintenance

#### Phase 7: End of Life
**Purpose**: Orderly product discontinuation

**Key Activities**:
- Discontinuation planning
- Customer notification
- Service/support continuation
- Archive documentation

**Completion Criteria**:
- Last product sold/serviced
- Documentation archived
- Regulatory notifications complete

### Managing Phase Transitions

To transition between phases:

1. Navigate to **Product > Lifecycle**
2. Select current phase
3. Review phase gate criteria
4. Check all criteria are met
5. Click **Request Phase Transition**
6. Complete transition approval workflow
7. Phase updates upon approval

### Milestone Management

Within each phase, track specific milestones:

#### Creating Milestones
1. Go to **Product > Lifecycle > Milestones**
2. Click **Add Milestone**
3. Enter:
   - Milestone name
   - Target date
   - Description
   - Dependencies
   - Responsible person

#### Milestone Status
- **Not Started**: Future milestone
- **In Progress**: Work ongoing
- **Completed**: Milestone achieved
- **Delayed**: Past target date
- **At Risk**: Potential delay identified

### Gantt Chart Visualization

The lifecycle Gantt chart shows:
- Phase durations
- Milestone dates
- Task dependencies
- Critical path
- Current date indicator
- Delay highlighting

Interactive features:
- Drag to reschedule
- Click for details
- Zoom in/out
- Filter by phase/resource

---

## Chapter 3.6: Basic UDI-DI Management

### Understanding UDI

The Unique Device Identification system requires:

#### UDI-DI (Device Identifier)
- Fixed portion identifying device model/version
- Issued by accredited agency (GS1, HIBCC, ICCBBA)
- Linked to device labeler and description

#### UDI-PI (Production Identifier)
- Variable portion identifying production instance
- Includes: Lot/batch, serial number, expiry date, manufacturing date

#### Basic UDI-DI (EU MDR specific)
- Identifier for device family sharing core characteristics
- Links to EUDAMED registration
- Groups variants with same intended purpose

### Configuring UDI

1. Navigate to **Product > UDI Management**
2. Select issuing agency:
   - GS1 (most common)
   - HIBCC
   - ICCBBA

3. Enter company prefix
4. Configure:
   - Basic UDI-DI format
   - UDI-DI numbering scheme
   - UDI-PI components

### Generating UDI Identifiers

For each variant:
1. Click **Generate UDI-DI**
2. Review generated identifier
3. Generate check digit
4. Confirm and save

For Basic UDI-DI:
1. Click **Generate Basic UDI-DI**
2. Link associated UDI-DIs
3. Save configuration

### UDI Label Generation

Generate compliant UDI labels:

1. Select barcode format:
   - GS1-128
   - GS1 DataMatrix
   - GS1 QR Code

2. Configure UDI-PI components:
   - Lot/batch number
   - Serial number (if applicable)
   - Expiry date format
   - Manufacturing date

3. Preview label
4. Export for printing

---

# Part 4: Regulatory & Compliance

## Chapter 4.1: Multi-Market Regulatory Framework

### Supported Markets

XyReg provides pre-configured regulatory frameworks for:

| Market | Regulation | Authority |
|--------|------------|-----------|
| European Union | MDR 2017/745, IVDR 2017/746 | Competent Authorities, Notified Bodies |
| United States | 21 CFR Parts 800-1299 | FDA |
| United Kingdom | UK MDR 2002/618 | MHRA |
| China | Regulations Order 739 | NMPA |
| India | MDR 2017 | CDSCO |
| Australia | TG Act 1989 | TGA |
| Japan | PMD Act | PMDA |
| Canada | MDR SOR/98-282 | Health Canada |
| Brazil | RDC 185/2001 | ANVISA |
| South Korea | Medical Devices Act | MFDS |

### Market Configuration

For each target market, configure:

#### Market Priority
- **Primary**: Main market focus
- **Secondary**: Additional market
- **Future**: Planned expansion

#### Submission Strategy
- Direct submission
- Through authorized representative
- Via local distributor

#### Timeline
- Target submission date
- Expected review duration
- Target approval date

#### Responsible Contacts
- Internal regulatory lead
- External consultant (if applicable)
- Local representative

---

## Chapter 4.2: EU MDR Compliance

### GSPR (General Safety and Performance Requirements)

The core compliance requirement under EU MDR Annex I:

#### Structure
**Chapter I: General Requirements**
- Safety and performance
- Risk management
- Benefit-risk determination

**Chapter II: Design and Manufacturing**
- Chemical, physical, biological properties
- Infection and microbial contamination
- Manufacturing and environmental properties
- Devices with measuring function
- Radiation protection
- Active devices and connected devices
- Mechanical and thermal risks
- Protection against other risks

**Chapter III: Information Requirements**
- Labels
- Instructions for Use
- Unique Device Identification

### Managing GSPR Compliance

1. Navigate to **Product > Regulatory > EU MDR > GSPR**
2. For each applicable requirement:
   - Mark applicability (Applicable/Not Applicable)
   - Document justification if N/A
   - Link supporting evidence
   - Set compliance status

#### Compliance Status Options
- **Compliant**: Full evidence documented
- **Partially Compliant**: Gap exists, action planned
- **Non-Compliant**: Significant gap, requires action
- **Not Assessed**: Pending review

### Technical Documentation Structure

EU MDR Annex II/III documentation:

#### Device Description and Specification
- Intended purpose
- Classification justification
- Variants and accessories
- Functional elements
- Raw materials
- Technical specifications

#### Information Supplied by Manufacturer
- Labels and IFU
- Packaging
- Promotional materials

#### Design and Manufacturing Information
- Design stages
- Manufacturing processes
- Suppliers and subcontractors

#### General Safety and Performance Requirements
- Compliance demonstration
- Solutions adopted
- Test results

#### Benefit-Risk Analysis
- Benefits identification
- Risk analysis
- Benefit-risk conclusion

#### Product Verification and Validation
- Pre-clinical studies
- Clinical evaluation
- Software lifecycle documentation

### CE Marking Process

Steps to CE marking:

1. Complete classification
2. Apply relevant conformity route
3. Compile technical documentation
4. Implement QMS (ISO 13485)
5. Notified Body involvement (if required)
6. Obtain EC Certificate
7. Prepare DoC (Declaration of Conformity)
8. Affix CE mark

---

## Chapter 4.3: FDA Compliance

### Submission Types

#### 510(k) Premarket Notification
For Class II devices with predicate:
- Traditional 510(k)
- Special 510(k)
- Abbreviated 510(k)

#### De Novo Classification
For novel Class I/II devices without predicate

#### Premarket Approval (PMA)
For Class III devices requiring clinical evidence

### FDA Compliance Module

1. Navigate to **Product > Regulatory > FDA**
2. Configure:
   - Product code
   - Regulation number
   - Submission type
   - Predicate device(s)

### 510(k) Submission Management

Track submission components:

#### Administrative
- Cover letter
- Fee payment
- eCopy requirements
- User fee exemption (if applicable)

#### Device Description
- Intended use
- Technological characteristics
- Substantial equivalence discussion

#### Non-Clinical Testing
- Performance testing
- Biocompatibility
- Electrical safety
- Software documentation

#### Clinical Information
- Clinical studies (if required)
- Literature review
- Predicate clinical data

#### Labeling
- Draft labeling
- IFU
- Warnings and precautions

---

## Chapter 4.4: Classification Assistants

### EU MDR Classification Assistant

The built-in classification wizard guides through Annex VIII:

#### Step 1: Device Type
- Active device
- Non-active device
- In-vitro diagnostic
- Software

#### Step 2: Duration of Use
- Transient (< 60 minutes)
- Short-term (≤ 30 days)
- Long-term (> 30 days)

#### Step 3: Invasiveness
- Non-invasive
- Invasive via body orifice
- Surgically invasive
- Implantable

#### Step 4: Specific Characteristics
Questions based on rules 1-22:
- Contact with body fluids
- Administers substances
- Active therapeutic function
- Diagnostic function
- Etc.

#### Result
Classification determination with:
- Applicable rules
- Class assignment
- Conformity route requirement
- Documentation requirements

### FDA Classification Assistant

Search and determine FDA classification:

1. Enter device description
2. Search product codes
3. Review matching classifications
4. Select appropriate code
5. System determines:
   - Device class
   - Regulation citation
   - Submission pathway

---

## Chapter 4.5: Gap Analysis

### Purpose

Gap analysis identifies differences between:
- Current documentation status
- Regulatory requirements
- Needed actions to close gaps

### Conducting Gap Analysis

1. Navigate to **Product > Regulatory > Gap Analysis**
2. Select target regulation (EU MDR, FDA, etc.)
3. System generates requirement checklist
4. For each requirement:
   - Review current status
   - Identify gaps
   - Define actions
   - Assign responsibility
   - Set target dates

### Gap Categories

| Category | Description |
|----------|-------------|
| Documentation | Missing or incomplete documents |
| Testing | Additional testing required |
| Clinical | Clinical evidence gaps |
| Process | Manufacturing/QMS improvements needed |
| Labeling | Label/IFU updates required |

### Gap Tracking Dashboard

Visual tracking of:
- Total gaps identified
- Gaps by category
- Gaps by severity
- Closure progress
- Overdue actions

---

## Chapter 4.6: EUDAMED Integration

### Overview

EUDAMED is the European database on medical devices:
- Actor registration
- UDI/device registration
- Certificate and notified body data
- Clinical investigations
- Vigilance reporting
- Market surveillance

### Actor Registration

Configure EUDAMED actor data:
- SRN (Single Registration Number)
- Actor type (Manufacturer, AR, Importer)
- Contact information

### Device Registration

Export device data for EUDAMED registration:

1. Navigate to **Product > UDI Management > EUDAMED**
2. Review Basic UDI-DI information
3. Generate EUDAMED-compatible export
4. Download XML file
5. Upload to EUDAMED portal

### Certificate Tracking

Track EU certificates:
- Certificate number
- Notified Body
- Issue date
- Expiry date
- Scope
- Certificate type (QMS, Type Exam, etc.)

---

## Chapter 4.7: Regulatory Submissions

### Submission Tracking

Track regulatory submissions across all markets:

#### Submission Record
- Submission type
- Market/authority
- Submission date
- Submission number
- Current status
- Target decision date

#### Submission Status
- **Draft**: In preparation
- **Internal Review**: Under internal approval
- **Submitted**: Sent to authority
- **Under Review**: Authority reviewing
- **Additional Info Requested**: Questions received
- **Approved**: Authorization granted
- **Rejected**: Authorization denied

### Managing Questions

Track authority questions/RFIs:

1. Log incoming question
2. Assign to team member
3. Draft response
4. Internal review
5. Submit response
6. Track authority feedback

### Approval Management

Upon authorization:
1. Record approval details
2. Upload authorization document
3. Link to product record
4. Update market status
5. Plan launch activities

---

# Part 5: Design & Risk Controls

## Chapter 5.1: Requirements Management

### Requirements Types

XyReg supports structured requirements hierarchy:

#### User Needs
High-level needs from users/stakeholders:
- Patient needs
- Healthcare provider needs
- Other stakeholder needs

#### Design Input Requirements
Translated user needs into measurable requirements:
- Functional requirements
- Performance requirements
- Safety requirements
- Usability requirements
- Regulatory requirements

#### System Requirements
System-level specifications:
- Hardware requirements
- Software requirements
- Interface requirements
- Environmental requirements

#### Component Requirements
Detailed specifications for:
- Hardware components
- Software modules
- Subsystems

### Creating Requirements

1. Navigate to **Product > Design Controls > Requirements**
2. Select requirements type
3. Click **Add Requirement**
4. Enter:
   - Requirement ID (auto-generated or manual)
   - Title
   - Description
   - Priority (Essential, Desirable, Optional)
   - Source (User need link, standard, etc.)
   - Verification method

5. Save and link to parent requirements

### Requirements Attributes

Each requirement has:
- **ID**: Unique identifier
- **Title**: Brief name
- **Description**: Full specification
- **Rationale**: Why this requirement exists
- **Priority**: Importance level
- **Source**: Origin of requirement
- **Status**: Draft, Approved, Obsolete
- **Verification Method**: Test, Analysis, Inspection, Demonstration
- **Traceability Links**: Connected requirements, tests, risks

### Requirements Review

Formal review process:
1. Submit requirements for review
2. Assign reviewers
3. Collect feedback
4. Address comments
5. Approve requirements baseline

---

## Chapter 5.2: System Architecture

### Architecture Documentation

Document system architecture per IEC 62304 (for software) and general engineering practice:

#### System Overview
- High-level block diagram
- Key components
- Interfaces
- Operating environment

#### Architecture Views
- Functional view
- Physical view
- Software architecture
- Hardware architecture

### Architecture Diagrams

Create and manage diagrams:

1. Navigate to **Product > Architecture**
2. Create new diagram or edit existing
3. Use built-in diagram editor:
   - Drag components from library
   - Connect with interfaces
   - Add labels and descriptions
4. Save and version

### Architecture Patterns

Pre-built patterns for common configurations:
- Sensor-processor-actuator
- Data acquisition systems
- Networked devices
- Software as Medical Device

### Architecture Decision Records

Document key decisions:
- Decision ID
- Title
- Context
- Options considered
- Decision made
- Rationale
- Consequences

---

## Chapter 5.3: Risk Management

### ISO 14971 Framework

XyReg implements the ISO 14971 risk management process:

1. Risk management planning
2. Hazard identification
3. Risk estimation
4. Risk evaluation
5. Risk control
6. Residual risk evaluation
7. Risk management review
8. Production and post-production

### Risk Management File

Navigate to **Product > Risk Management** to access:

#### Risk Management Plan
- Scope
- Risk acceptance criteria
- Verification activities
- Responsibilities

#### Hazard Analysis
Systematic hazard identification:
- Preliminary hazard analysis (PHA)
- Failure mode analysis
- Fault tree analysis

#### Risk Assessment
- Severity estimation
- Probability estimation
- Risk level determination

#### Risk Control
- Control measures
- Verification of effectiveness
- Residual risk

### FMEA Module

Failure Mode and Effects Analysis:

1. Navigate to **Product > Risk Management > FMEA**
2. Select FMEA type:
   - Design FMEA (DFMEA)
   - Process FMEA (PFMEA)
   - Use/Misuse FMEA

3. For each component/process step:
   - Identify potential failure modes
   - Determine effects
   - Identify causes
   - Assess severity (S)
   - Assess occurrence (O)
   - Assess detection (D)
   - Calculate RPN (S × O × D)
   - Define actions if RPN exceeds threshold

### Risk Matrix Configuration

Configure organization-specific risk matrix:

#### Severity Levels (example)
| Level | Description | Criteria |
|-------|-------------|----------|
| 1 | Negligible | No injury |
| 2 | Minor | Minor injury, no intervention |
| 3 | Moderate | Intervention required |
| 4 | Serious | Permanent impairment |
| 5 | Critical | Death or life-threatening |

#### Probability Levels (example)
| Level | Description | Frequency |
|-------|-------------|-----------|
| 1 | Rare | < 1 in 1,000,000 |
| 2 | Unlikely | 1 in 100,000 to 1,000,000 |
| 3 | Occasional | 1 in 10,000 to 100,000 |
| 4 | Probable | 1 in 1,000 to 10,000 |
| 5 | Frequent | > 1 in 1,000 |

#### Risk Acceptability
- Green (Acceptable): Low probability × Low severity
- Yellow (ALARP): Reduce as low as reasonably practicable
- Red (Unacceptable): Must be reduced

### Hazard Management

Track individual hazards:

1. **Hazard ID**: Unique identifier
2. **Hazard Description**: The dangerous situation
3. **Harm(s)**: Potential injuries
4. **Severity**: Estimated severity level
5. **Probability (initial)**: Before controls
6. **Risk Level (initial)**: Initial risk assessment
7. **Control Measures**: Implemented controls
8. **Probability (residual)**: After controls
9. **Risk Level (residual)**: Final risk assessment
10. **Status**: Open, Controlled, Accepted

### AI-Assisted Hazard Identification

Use AI to suggest potential hazards:

1. Click **AI Hazard Suggestions**
2. System analyzes:
   - Intended purpose
   - Device type
   - Similar device hazards
   - Standard hazard categories

3. Review suggestions
4. Accept relevant hazards
5. Add to hazard register

---

## Chapter 5.4: Verification & Validation

### Verification Management

Verification confirms design outputs meet design inputs:

#### Test Protocol Management
1. Navigate to **Product > V&V > Verification**
2. Create test protocol:
   - Protocol ID
   - Title
   - Objective
   - Test setup
   - Procedure steps
   - Acceptance criteria
   - Linked requirements

3. Link to requirements being verified
4. Submit for approval

#### Test Execution
1. Assign test to executor
2. Execute per protocol
3. Record results
4. Document deviations
5. Conclude pass/fail

#### Test Report
Generate verification report:
- Summary of testing
- Results overview
- Deviations and disposition
- Conclusion
- Approvals

### Validation Management

Validation confirms device meets user needs:

#### Validation Planning
- Intended use scenarios
- Representative user groups
- Use environment simulation
- Success criteria

#### Types of Validation
- Functional validation
- Usability validation
- Clinical validation
- Software validation

#### Validation Execution
- Conduct validation activities
- Document results
- Analyze data
- Report findings

---

## Chapter 5.5: Traceability

### Requirements Traceability Matrix (RTM)

The RTM provides complete traceability:

```
User Need → Design Input → Design Output → Verification → Validation
                ↓
              Risk ← Control Measure
```

### Viewing Traceability

1. Navigate to **Product > Design Controls > Traceability**
2. Select traceability view:
   - Forward (User needs → Tests)
   - Backward (Tests → User needs)
   - Full matrix

3. Filter by:
   - Requirement type
   - Status
   - Verification status

### Traceability Gaps

System identifies:
- Requirements without tests
- Tests without requirements
- Risks without controls
- Incomplete links

### Traceability Reports

Generate:
- Complete RTM document
- Gap analysis report
- Coverage summary
- Verification status

---

# Part 6: Business Case & Strategy

## Chapter 6.1: Venture Blueprint

### Overview

The Venture Blueprint is a guided strategic journey for medical device ventures, covering all aspects from concept to commercialization.

### Blueprint Steps

#### Step 1: Product Vision
Define the high-level product vision:
- Problem being solved
- Solution overview
- Target outcome

#### Step 2: Market Analysis
Research and document market:
- Market size and growth
- Target segments
- Unmet needs

#### Step 3: Competitive Landscape
Analyze competition:
- Direct competitors
- Indirect alternatives
- Competitive advantages

#### Step 4: Value Proposition
Define customer value:
- Key benefits
- Differentiation
- Unique selling points

#### Step 5: Customer Segmentation
Identify customer groups:
- Primary customers
- Decision makers
- Influencers

#### Step 6: Regulatory Strategy
Plan regulatory pathway:
- Market prioritization
- Classification
- Submission timeline

#### Step 7: Clinical Strategy
Plan clinical evidence:
- Clinical data needs
- Study design
- Literature evidence

#### Step 8: Team & Resources
Define resource needs:
- Core team
- External resources
- Budget requirements

#### Steps 9-18: Detailed Planning
Continue through:
- IP strategy
- Manufacturing
- Quality systems
- Go-to-market
- Pricing
- Reimbursement
- Launch planning
- Post-market

### Using Venture Blueprint

1. Navigate to **Product > Business Case > Venture Blueprint**
2. Start at Step 1 or continue from last position
3. Complete each step:
   - Answer guided questions
   - Document decisions
   - Link supporting documents
4. Review progress dashboard
5. Generate Blueprint summary report

---

## Chapter 6.2: Business Canvas

### Business Model Canvas

Visual business model framework:

#### Customer Segments
- Who are the customers?
- What are their characteristics?
- How are they segmented?

#### Value Propositions
- What value do we deliver?
- What problem do we solve?
- What needs do we satisfy?

#### Channels
- How do we reach customers?
- How do we deliver value?
- What works best?

#### Customer Relationships
- What type of relationship?
- How do we maintain it?
- What does it cost?

#### Revenue Streams
- What will customers pay for?
- How will they pay?
- How much will they pay?

#### Key Resources
- What resources are required?
- Physical, intellectual, human, financial?
- What is critical?

#### Key Activities
- What activities are required?
- Production, problem-solving, platform?
- What is core?

#### Key Partnerships
- Who are key partners?
- What do they provide?
- What are the arrangements?

#### Cost Structure
- What are major costs?
- Fixed vs. variable?
- Economies of scale?

### Creating Business Canvas

1. Navigate to **Product > Business Case > Business Canvas**
2. Complete each section
3. Add multiple items per section
4. Link to supporting analysis
5. Generate visual canvas export

### AI-Generated Canvas

Use AI to generate initial canvas:
1. Click **AI Generate**
2. System analyzes product information
3. Review generated content
4. Edit and refine
5. Save canvas

---

## Chapter 6.3: Market Analysis

### Market Research

Document market analysis:

#### Market Size
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)

#### Market Segments
- Segment definitions
- Segment sizes
- Growth rates

#### Market Trends
- Technology trends
- Regulatory trends
- Reimbursement trends
- Competitive trends

#### Geographic Analysis
- Key markets
- Regional differences
- Market access barriers

### Competitive Intelligence

Track competitors:

1. Navigate to **Product > Business Case > Market Analysis**
2. Add competitors
3. For each competitor:
   - Company information
   - Product portfolio
   - Strengths/weaknesses
   - Market position
   - Recent activities

### SWOT Analysis

Document:
- Strengths
- Weaknesses
- Opportunities
- Threats

---

## Chapter 6.4: Go-To-Market Strategy

### GTM Planning

Define market entry strategy:

#### Channel Strategy
- Direct sales
- Distributor network
- Hybrid approach

#### Geographic Rollout
- Launch markets
- Expansion plan
- Timeline

#### Customer Acquisition
- Target accounts
- Sales approach
- Marketing channels

#### Pricing Strategy
- Pricing model
- Price points
- Discount policies

### Key Account Planning

For priority accounts:
- Account profile
- Stakeholder mapping
- Value proposition
- Action plan

### Launch Planning

Pre-launch checklist:
- [ ] Regulatory approvals obtained
- [ ] Manufacturing ready
- [ ] Sales team trained
- [ ] Marketing materials ready
- [ ] Distribution agreements signed
- [ ] Customer support ready
- [ ] Inventory positioned

---

## Chapter 6.5: rNPV Analysis

### Risk-Adjusted Net Present Value

Financial analysis incorporating development risk:

#### Input Parameters

**Revenue Projections**
- Unit sales forecast
- Pricing assumptions
- Growth rates

**Cost Projections**
- Development costs by phase
- Manufacturing costs
- Commercial costs

**Risk Factors**
- Technical success probability
- Regulatory success probability
- Commercial success probability

**Financial Parameters**
- Discount rate
- Projection period
- Terminal value assumptions

#### Calculation

rNPV = Σ (CFt × Pt) / (1 + r)^t

Where:
- CFt = Cash flow at time t
- Pt = Cumulative probability of success at time t
- r = Discount rate
- t = Time period

### Using rNPV Calculator

1. Navigate to **Product > Business Case > rNPV**
2. Enter revenue projections
3. Enter cost projections
4. Set risk probabilities
5. Configure discount rate
6. Calculate rNPV
7. View sensitivity analysis
8. Generate report

### Scenario Analysis

Compare scenarios:
- Base case
- Optimistic case
- Pessimistic case
- Different market assumptions

---

## Chapter 6.6: Reimbursement Strategy

### Reimbursement Planning

Medical device reimbursement analysis:

#### Coverage Pathways
- Private insurance
- Public healthcare (Medicare, NHS, etc.)
- Out-of-pocket

#### Coding Requirements
- CPT/HCPCS codes
- ICD-10 diagnosis codes
- DRG implications

#### Payment Levels
- Hospital inpatient
- Hospital outpatient
- Ambulatory surgery center
- Physician office

### Health Economics

Document value story:

#### Clinical Evidence
- Efficacy data
- Safety data
- Comparative effectiveness

#### Economic Analysis
- Cost-effectiveness analysis
- Budget impact analysis
- Value dossier

#### Payer Engagement
- Key payer targets
- Engagement strategy
- Coverage milestones

---

# Part 7: Document Management

## Chapter 7.1: Document Hub

### Document Organization

XyReg organizes documents by:

#### Document Categories
- Regulatory submissions
- Technical documentation
- Quality system documents
- Design history files
- Risk management files
- Clinical documentation
- Manufacturing documents

#### Document Types
- Templates
- Controlled documents
- Working documents
- External documents
- Records

### Document Browser

Navigate documents:
1. Go to **Documents > Document Hub**
2. Browse by:
   - Category
   - Product
   - Document type
   - Status
3. Use search to find specific documents
4. Preview or download documents

### Document Properties

Each document has:
- Document ID
- Title
- Version
- Author
- Status (Draft, In Review, Approved, Obsolete)
- Effective date
- Review date
- Classification (Confidential, Internal, Public)
- Associated product(s)

---

## Chapter 7.2: Document Composer

### Creating Documents

The Document Composer enables structured document creation:

#### Starting a Document
1. Navigate to **Documents > Document Composer**
2. Select template or start blank
3. Configure document properties
4. Begin content creation

#### Content Sections
- Add/remove sections
- Reorder sections
- Import from other documents
- Link to database content

#### Dynamic Content
Insert dynamic elements:
- Product information
- Requirement lists
- Risk summaries
- Test results
- Signatures

### Collaborative Editing

Multiple users can:
- Edit simultaneously
- Leave comments
- Track changes
- Resolve conflicts

### Version Control

- Automatic versioning
- Version comparison
- Rollback capability
- Version history

---

## Chapter 7.3: Template Management

### Template Library

Pre-built templates for:

#### Regulatory Templates
- Declaration of Conformity
- Technical Documentation
- GSPR Checklist
- Clinical Evaluation Report
- 510(k) Summary

#### Quality Templates
- Quality Manual
- Procedures (SOPs)
- Work Instructions
- Forms and records

#### Design Templates
- Design History File
- Requirements Specifications
- Verification Protocols
- Validation Reports

### Creating Templates

1. Navigate to **Documents > Templates**
2. Click **Create Template**
3. Define template structure
4. Add placeholder fields
5. Configure metadata
6. Set permissions
7. Publish template

### Template Customization

Modify templates for organization:
- Add company branding
- Customize sections
- Add organization-specific content
- Create variants for different products

---

## Chapter 7.4: Document Workflows

### Approval Workflows

Configure document approval processes:

#### Workflow Steps
1. Draft: Author creates content
2. Review: Reviewers provide feedback
3. Revision: Author addresses comments
4. Approval: Approvers sign off
5. Effective: Document becomes active

#### Parallel vs. Sequential
- Parallel: Multiple reviewers simultaneously
- Sequential: Reviews in defined order

### Configuring Workflows

1. Navigate to **Settings > Workflows**
2. Create or edit workflow
3. Define stages
4. Assign roles/users to each stage
5. Set timeouts and escalations
6. Activate workflow

### Electronic Signatures

21 CFR Part 11 / EU Annex 11 compliant:
- User authentication required
- Signature meaning recorded
- Timestamp captured
- Audit trail maintained

---

# Part 8: Advanced Features

## Chapter 8.1: AI Assistants

### Available AI Features

XyReg includes AI-powered assistants:

#### Classification Assistant
- Answers classification questions
- Suggests applicable rules
- Explains rationale

#### UDI Generator
- Generates compliant UDI strings
- Validates check digits
- Formats for labeling

#### Hazard Identifier
- Suggests potential hazards
- Based on device type
- References similar devices

#### Document Summarizer
- Summarizes long documents
- Extracts key points
- Generates executive summaries

#### Compliance Checker
- Reviews documentation
- Identifies gaps
- Suggests improvements

### Using AI Assistants

1. Look for the AI icon (✨) throughout the platform
2. Click to activate assistant
3. Review AI suggestions
4. Accept, modify, or reject
5. AI learns from feedback

---

## Chapter 8.2: Communication Center

### Notifications

Manage notifications:
- Email notifications
- In-app notifications
- Notification preferences

### Internal Messaging

Team communication:
- Direct messages
- Group discussions
- Product-specific channels

### External Communication

Track external communications:
- Regulatory authority correspondence
- Notified Body communications
- Customer communications

---

## Chapter 8.3: Help System

### Contextual Help

Access help throughout the platform:
- **?** icon for page-specific help
- Tooltips on form fields
- Embedded guidance

### Documentation

- User manual (this document)
- Video tutorials
- Quick reference guides
- FAQ

### Support

- In-app support tickets
- Email support
- Knowledge base

---

## Chapter 8.4: Administration

### System Settings

Administrators can configure:

#### General Settings
- Organization information
- Branding (logo, colors)
- Regional settings

#### Security Settings
- Password policies
- Session timeouts
- Two-factor authentication
- IP restrictions

#### Integration Settings
- API configuration
- External system connections
- EUDAMED integration

#### Backup and Recovery
- Data backup schedule
- Retention policies
- Recovery procedures

---

# Appendix A: Glossary of Terms

| Term | Definition |
|------|------------|
| **AR** | Authorized Representative - Entity in the EU representing non-EU manufacturers |
| **CAPA** | Corrective and Preventive Action |
| **CE Mark** | Conformité Européenne - European conformity marking |
| **CFR** | Code of Federal Regulations (US) |
| **CDSCO** | Central Drugs Standard Control Organization (India) |
| **DoC** | Declaration of Conformity |
| **DHF** | Design History File |
| **EUDAMED** | European Database on Medical Devices |
| **FDA** | Food and Drug Administration (US) |
| **FMEA** | Failure Mode and Effects Analysis |
| **GSPR** | General Safety and Performance Requirements (EU MDR) |
| **IFU** | Instructions for Use |
| **ISO** | International Organization for Standardization |
| **IVD** | In Vitro Diagnostic |
| **MDR** | Medical Device Regulation (EU) or Medical Device Report (FDA) |
| **MHRA** | Medicines and Healthcare products Regulatory Agency (UK) |
| **NB** | Notified Body |
| **NMPA** | National Medical Products Administration (China) |
| **PMA** | Premarket Approval |
| **PMDA** | Pharmaceuticals and Medical Devices Agency (Japan) |
| **PMS** | Post-Market Surveillance |
| **PMCF** | Post-Market Clinical Follow-up |
| **PSUR** | Periodic Safety Update Report |
| **QMS** | Quality Management System |
| **RPN** | Risk Priority Number |
| **RTM** | Requirements Traceability Matrix |
| **SaMD** | Software as a Medical Device |
| **SRN** | Single Registration Number (EU) |
| **TGA** | Therapeutic Goods Administration (Australia) |
| **UDI** | Unique Device Identification |
| **UDI-DI** | UDI Device Identifier |
| **UDI-PI** | UDI Production Identifier |
| **V&V** | Verification and Validation |

---

# Appendix B: Regulatory Framework Reference

## EU MDR 2017/745

### Key Dates
- Entered into force: May 25, 2017
- Date of Application: May 26, 2021
- Transition provisions extended to 2027-2028

### Classification Rules
| Rule | Applicable Devices |
|------|-------------------|
| Rule 1-4 | Non-invasive devices |
| Rule 5-8 | Invasive devices |
| Rule 9-13 | Active devices |
| Rule 14-22 | Special rules |

### Conformity Assessment Routes
| Class | Route |
|-------|-------|
| Class I | Self-declaration |
| Class I (sterile, measuring, reusable surgical) | NB involvement (specific aspects) |
| Class IIa | NB involvement |
| Class IIb | Full NB QMS or Type Examination |
| Class III | Full NB QMS + Design Examination or Type Examination + Verification |

## FDA 21 CFR

### Key Regulations
- Part 807: Establishment Registration and Device Listing
- Part 812: Investigational Device Exemptions
- Part 814: Premarket Approval
- Part 820: Quality System Regulation
- Part 830: Unique Device Identification

### Submission Types
| Submission | Requirement |
|------------|-------------|
| 510(k) | Substantial equivalence to predicate |
| De Novo | Novel low-moderate risk device |
| PMA | Premarket approval with clinical data |

---

# Appendix C: Quick Reference Cards

## Document Approval Workflow

```
1. Author creates document
2. Author submits for review
3. Reviewers comment (parallel or sequential)
4. Author addresses comments
5. Author resubmits if needed
6. Approvers approve with electronic signature
7. Document becomes effective
8. System notifies stakeholders
```

## Risk Assessment Process

```
1. Identify hazards
2. Estimate severity of harm
3. Estimate probability of occurrence
4. Determine risk level (matrix)
5. If unacceptable, implement controls
6. Verify control effectiveness
7. Re-assess residual risk
8. Document in risk management file
```

## Product Creation Checklist

```
□ Basic information entered
□ Classification determined
□ Regulatory markets configured
□ Team assigned
□ Initial timeline set
□ Device definition completed
□ Variants configured (if applicable)
□ Risk management file initiated
□ Design history file started
```

## GSPR Compliance Checklist

```
□ All requirements assessed for applicability
□ Applicable requirements have evidence linked
□ N/A justifications documented
□ Gaps identified and actions assigned
□ Compliance status reviewed by RA
□ Summary table complete
□ Linked to technical documentation
```

---

# Document Information

**Document Title**: XyReg User Manual  
**Document Number**: DOC-UM-001  
**Version**: 1.0  
**Effective Date**: December 2024  
**Author**: XyReg Documentation Team  
**Classification**: Public  

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | Dec 2024 | Documentation Team | Initial release |

---

*© 2024 XyReg. All rights reserved.*

*This document is provided for informational purposes. Regulatory requirements may change. Always consult current regulations and seek professional advice for specific compliance questions.*
