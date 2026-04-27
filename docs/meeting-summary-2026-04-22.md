# Impromptu Google Meet — April 22, 2026

**Recording:** https://fathom.video/share/z_GvA5Xtdc8z-qfBst_CztxqaTqCVKG3
**Participants:** Arnar Kristjansson, Denish Faldu, Ravi Sanchala, Jatin (QA candidate — first ~20 mins)
**Context:** Unscheduled meeting with a QA candidate interview up front, followed by team working session on architecture, document editor, project-mgmt UI, subscription page, and business development.

---

## Key Discussion Points

### [1:53–5:35] Cyreq Platform Overview & Compliance Requirements
- Cyreq = platform helping medical-device companies navigate regulatory paperwork, accelerate time-to-market
- Certifications needed for customer credibility: **SOC 2**, **ISO 27001**, **NIS-2** (European — kicks in once XyReg reaches SME size, a few years out)
- Need someone to manage **data security compliance** + implement **version control validation** under the **TR 80002-2** technical report
- TR 80002-2 requires providing **validation packages** documenting testing + functionality for each update

### [5:35–11:41] Jatin's QA Background
- 9–10 years Senior QA experience
- Manual testing, automated testing, load testing, performance (GTmetrix, Google Insights)
- Currently on UK construction SaaS: uses **DHTMLX Gantt** (paid) with custom team enhancements
- Replaced customer's Google-Sheets-based project mgmt for construction task/dependency/parallel workflows
- Day-to-day: test cases, manual testing, docs w/ screenshots + videos confirming features meet requirements

### [11:41–15:40] Testing Methodologies & Release Validation
- **Major releases (multi-module):** prefer automated testing — catches ripple effects
- **Minor changes:** manual testing sufficient
- Release cycle Thu/Fri/Sun: prep change list by **Saturday** → validate (auto/manual by scope) → confirm before publish
- **Denish probed:** CI/CD-based testing + regression / smoke testing
- Jatin confirmed he can implement these to verify deployments + business-requirement coverage before release

### [15:40–18:08] AI-Assisted Test Case Generation & Pen Testing
- **Denish's question:** how to create comprehensive test cases for Cyreq (large, complex, no existing test docs)
- **Jatin's recommendation:** write a **detailed MD file** listing all modules + features, then feed to **ChatGPT/Claude** to generate test cases
  - Often surfaces edge cases devs/QAs miss
- Pen testing: Jatin has experience; uses 3rd-party tools (Google Insights, GTmetrix) rather than custom pen-testing

### [18:08–21:07] Homework & ISO 27001
- **Arnar → Jatin homework:** review TR 80002-2, return with brief description of how to implement its structure inside Cyreq
- **Ravi** will share the TR 80002-2 doc with Jatin
- **Also:** explore ISO 27001 certification — a "quality manual for security" covering mgmt practices, continuous security focus, breach handling
- Jatin: has some exposure, can explore further

### [21:07–23:45] Hiring Decision & Trial Period
- Ravi knows Jatin personally but emphasized: **project comes first, not relationships** — wanted Arnar to assess directly
- Arnar: Jatin seems capable; **Denish will work more closely with him than Arnar will**
- Decision: **trial week, 15–20 hours**, to evaluate thinking process + approach
- If trial goes well, joins the following week
- Arnar planning to **move away from Upwork** to free budget for additional team members

### [23:45–26:33] Laurie's Feedback & Architecture Strategy
- Laurie pushed a **backend-focused** architecture
- Arnar's counter: Cyreq's model is **platform-first — customers do 90% themselves**, with optional consultancy support
- **Valid Laurie suggestion:** use **feature flags** instead of managing separate repositories per customer
- With 3 pilot customers, per-customer repos are already burdensome
- Rethink toward **master repo + feature flags** as the system scales

### [26:33–34:20] Gap Analysis & Design History
- AI-assisted gap analysis + exclusion rules being built
- Comprehensive lists (e.g., **GSPR in Annex 1**) = many questions
- **Device definitions** let companies skip irrelevant ones — major time saver
- Goal: **single source of truth** connecting all gap-analysis lists so requirements trace across the system
- **Design history** (audit trail: who did what, when) is critical for regulatory compliance per Laurie — Arnar still researching the specifics

### [34:20–42:02] Document Editor with AI & Reference Linking
- **Denish demoed** new document editor w/ three workflows:
  1. Write manually
  2. Use prebuilt SOPs (copy/paste templates + company-specific customization)
  3. AI autofill
- AI content gen **intelligently copies sections based on selection** rather than regenerating everything
- Users can **link documents + tag people** inline (similar to Qualio)
- **Arnar's feedback:** references need to look more professional in the final document; suggests a **dedicated references section** where users add linked docs
- Agreed to refine visual presentation + workflow before finalizing

### [42:02–46:00] Project Management UI & Document Access
- **Ravi demoed** direct document access from the document list (no longer routing through a separate technical-document section)
- **However:** the "Edit Document" button is now **redundant** because Denish's new embedded editor has replaced that flow
- Ravi agreed to **remove the button** to avoid confusion
- API mgmt + token usage tracking discussed — users see AI tokens consumed; admins monitor across companies to prevent over-consumption

### [46:00–52:26] Plans & Subscription UI Improvements
- Current Plans/Subscription page shows **"Start trial"** even for users who already have a plan → confusing
- Arnar's proposed restructure: show (1) **current plan status**, (2) **AI tokens used / plan limit**, (3) **upgrade / downgrade / cancel** options
- **"Plants"** label → rename to **"Current Plan"**
- Remove **"Add code"** and **"Start trial"** options for existing customers
- **Ravi** to implement these three fixes

### [52:26–end] Future Growth & InnoCosmetical
- Arnar focused on securing additional **Professional Resource Consultant (PRC)** contracts for revenue + team expansion
- Today's focus: **InnoCosmetical** — contract manufacturer + developer w/ ~100 customers
- Different pattern: InnoCosmetical will **manage client contracts + administer accounts** — introduces scope creep
- **Proposed revenue-share model:** customers pay for Cyreq directly, consultants get a cut — incentivizes adoption
- Team at capacity; 1–2 more PRCs necessary + achievable
- **Billing features: deferred 6+ months** (see `docs/voice-note-2026-04-22.md`)

---

## Denish's Tasks

| # | Task | Source |
|---|---|---|
| D1 | **Manage Jatin's trial week** (15–20 hours) — work closely with him to evaluate thinking process before confirming the hire | Hiring Decision @ 21:07 |
| D2 | **Refine document-editor reference UI** — make linked doc/tag references look more professional in the final document; explore adding a dedicated "References" section where users add linked docs | Document Editor @ 34:20 |
| D3 | **Rethink repo strategy** — move away from per-customer repositories toward a single master repo with feature flags (Laurie's suggestion); evaluate as system scales past the 3 pilot customers | Feedback from Laurie @ 23:45 |
| D4 | **Produce a modules+features MD spec** for Cyreq — so AI (ChatGPT/Claude) can generate comprehensive test cases from it. Jatin suggested this pattern; Denish owns it since he knows the system | AI-Assisted Test Cases @ 15:40 |
| D5 | **Coordinate CI/CD + regression/smoke testing** setup with Jatin once the hire is confirmed | Testing Methodologies @ 11:41 |

---

## Ravi's Tasks

| # | Task | Source |
|---|---|---|
| R1 | **Share the TR 80002-2 technical report** with Jatin (homework doc) | Homework Assignment @ 18:08 |
| R2 | **Remove the "Edit Document" button** from the project-management document list — it's now redundant with Denish's embedded editor | Project Management UI @ 42:02 |
| R3a | **Rename "Plants" → "Current Plan"** on the subscription page | Plans/Subscription UI @ 46:00 |
| R3b | **Remove "Add code" and "Start trial"** options for users who already have a plan | Plans/Subscription UI @ 46:00 |
| R3c | **Restructure the Plans page** to show: (1) current plan status, (2) AI tokens used / plan limit, (3) upgrade / downgrade / cancel actions | Plans/Subscription UI @ 46:00 |

---

## Arnar's Tasks (for cross-reference)

- Review Jatin's homework responses on TR 80002-2 + ISO 27001
- Research **design history** implementation specifics (audit trail)
- Drive **InnoCosmetical PRC contract** + 1–2 additional PRC contracts
- Plan migration off Upwork
- Finalize the **revenue-share model** for the consultant-resold path (see consultant-features roadmap)

---

## Jatin's Homework (if hired)

- Review **TR 80002-2** → write brief on how to implement its structure in Cyreq
- Explore **ISO 27001** → describe what's needed for certification (mgmt practices, continuous security, breach handling)
- Come back to trial week prepared to discuss CI/CD + regression/smoke testing approach

---

## Key Decisions

1. **Hire Jatin on a paid trial week (15–20h).** Full hire contingent on how the week goes; Denish owns the eval.
2. **Kill per-customer repos. Move to feature flags.** Not scoped yet but agreed as direction.
3. **Document editor references get a UI refresh** + a dedicated references section before the feature is considered done.
4. **Plans/Subscription page ships 3 UI fixes this cycle** (Ravi).
5. **Billing feature deferred 6+ months.** Revenue-share model is discussion-only for now.
6. **Shift off Upwork** for hiring to free up headcount budget.

---

## Important Notes

- ⚠️ **Scope creep flag on InnoCosmetical:** they'll want client-contract mgmt + account administration on behalf of their ~100 customers. Validate with client before building — see `docs/voice-note-2026-04-22.md` for the full context + open questions.
- 🔐 **Compliance runway is long:** SOC 2 + ISO 27001 + NIS-2 are multi-quarter efforts. Jatin's role includes owning this stream if he joins.
- 📝 **TR 80002-2 validation packages** become a per-release deliverable — shapes how CI/CD + release docs need to work.
- 🧪 **Test-case doc gap** is real — no existing test documentation for a system this size. MD-first + AI-generate is the agreed unblock.
- 💰 **Norwegian client** (from prior meeting) still pays 3× Finnish rate — keep that context when prioritizing bug fixes / attention.
