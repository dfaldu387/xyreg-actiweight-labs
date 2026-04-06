# Launch Sprint Call Summary - April 3, 2026

**Recording:** https://fathom.video/share/SCSoQbusuLBJGG4iuiVzxmU6CWfAf_VB
**Duration:** 62 mins
**Participants:** Arnar Kristjansson, Denish Faldu, Ravi Sanchala

---

## Key Discussion Points

### [0:14-1:51] Gantt Chart Bug
- Gantt chart cannot scroll/zoom below "D" level — known library bug
- Ravi: fixed in Lovable code, library (gantt-chart) had breaking update
- **Action:** Ravi to share documentation on the library issue

### [2:12-3:51] Release Notes & Change Tracking
- All changes must now be documented in the release notes document
- Team to continue sending daily summaries of work done
- Discussed potentially auto-generating change lists from the system
- This document becomes the version that ships

### [3:51-5:48] ElevenLabs TTS Integration for Professor Cyreg
- Advisory board AI assistant ("Professor Cyreg") currently uses browser voice — sounds horrible
- Arnar purchased ElevenLabs API key and added it to super admin settings, but TTS not connecting
- Ravi to integrate ElevenLabs TTS — can configure voice tones (calm, teaching, etc.)
- **Action:** Arnar to give Ravi ElevenLabs access; Ravi to integrate TTS

### [5:48-8:10] Device Selector & AI Improvements (Arnar)
- Device selector now shows non-family (individual) devices in top-right corner
- AI suggestions improved: comparison view showing current vs. AI suggestion with accept/reject
- Fixed bug where AI was calling SIMD device "SAMD"
- AI sparkle icons needed on device description and other fields
- Layout issue: AI comparison should be horizontal, not vertical

### [8:10-9:56] Scope Popover for Individual Devices
- Discussed adding scope popover to individual (non-family) devices, not just families
- Use case: David Health has old devices + new one, may want to share docs across
- **Decision:** Arnar to think more before committing — parked for now
- "Select entire device family" checkbox confirmed as good addition

### [10:45-15:00] Essential Performance Duplication
- Essential Performance shows in both its own section and under Features — should only be in Features
- **Action:** Remove Essential Performance duplication

### [15:00-16:39] Ravi's Update — Bug Fixes & UI Improvements
- Found ~10 bugs while testing as end user; resolved 8 so far
- Document-side issues were primary
- Feedback icon overlapping with Professor Cyreg floating button
- **Action:** Floating buttons must never overlap — enforce programmatic spacing

### [16:39-19:35] Column Customization & Sort/Filter Unification
- List view now supports column show/hide with preferences saved to database
- Persists across sessions — user's column choices remembered
- Working on unifying filter/sort across all document views
- AI buttons should be sparkle icons only (not full buttons) — less is more

### [19:35-22:20] Ravi's Next Priorities
- **P1:** Release notes & upgrade flow — admin gets notification of new version, chooses to upgrade
- **P2:** Language/i18n catch-up — new modules/terminology missing from language JSON files
- Plan: use LLM to identify unconverted menu items and generate JSON translations
- Release notes to live under Help > Version History

### [22:20-28:41] Versioning & Upgrade Strategy
- Subscriber A upgrades to v2, Subscriber B skips — when B upgrades to v3, they get v2+v3 (cumulative)
- Each version builds on previous; skipping just means deferring validation effort
- Long-term goal: make validation so fast (15-20 min) that skipping versions becomes unnecessary
- Cross-validation approach: Denish tests Ravi's work, Ravi tests Denish's — third-party perspective
- Continue using feedback button for screenshots + descriptions of changes

### [28:42-32:57] Denish's Update — Document Approval Flow
- Added approver selection alongside reviewer in send-for-review flow
- Due date field for approver — discussed auto-calculating reviewer due date (approver date minus 3-7 days)
- "Awaiting my review" should show "due in 3 days", "overdue", etc.
- Reviewer selector revamp needed: groups on top (spine, shoulder), then individuals below (alphabetical: internal first, then external), with checkboxes
- Reviewer can add comments; close button should say "Done" instead of "X"

### [33:29-35:37] Document Flow Stepper & Properties Cleanup
- New stepper added: Draft → Review → Approval → E-Signature → Completed
- Status field in Properties panel should be removed — status is now driven by the process/stepper, not manual selection
- **Action:** Remove Status from CI Properties in draft studio sidebar

### [35:38-42:30] Section, Phase & Version History (Design History File)
- Section field without phase context is confusing — remove Section from Properties panel
- Section/phase changes should happen in the CI box edit, not in the draft studio
- **Key concept — Design History File (DHF):**
  - Same DocCI can exist across multiple phases
  - Phase 1: version 1 (approved) → Phase 2: still version 1 → Phase 3: version 2 (updated)
  - Old versions get "superseded" tag but remain visible in their original phase
  - Auditors need to see full version history across phases

### [42:33-43:50] Review Drafts Cleanup
- Reference Documents section under Review Drafts is redundant (already in sidebar) — remove it
- "Latest" tag confirmed as good — shows which version is current
- Goal: author can see reviewer comments and make changes in-place without jumping between views

### [44:25-51:58] UI Consistency Standards
- **AI Sparkle:** Standardize color — no more yellow/purple mix, use one consistent color
- **Edit icon:** Pen-on-page icon = opens draft studio sidebar. Must be consistent everywhere (DocCI boxes, gap analysis, all editable areas)
- **"Done" labels:** Replace all "X" close buttons with "Done" where user completes an action
- **Draft/Review indicators:** Black = never started; Yellow = draft started or in review/approval
- **Floating buttons:** Must never overlap — enforce spacing programmatically
- Save as DocCI button should become the edit icon — same behavior, consistent entry point

### [51:58-52:15] Release Plan
- Deploy stable build tonight (Friday)
- Saturday: validate/test on staging
- Sunday: release new version
- **Action:** Team working through the weekend for this release

### [52:15-52:45] Release Notes Location
- Confirmed: release notes go under Help > Version History
- Not in Mission Control or Settings

### [57:28-58:28] Advisory Board Cleanup
- Remove "Advisory board" from Help menu — old feature, not functional (agents don't talk together)
- Professor Cyreg stays as single AI assistant

### [58:28-1:00:28] OneLogin / Multi-tenant Customer Setup
- Arnar needs single login (arnar.kristjansson@sybel.com) to access multiple customer accounts (David Health, XyReg, Activate)
- Denish working on database-level account linking — manually attaching companies to Arnar's account
- Arnar wants Activate account ready by Tuesday for kickoff
- **Action:** Denish to send OneLogin status update; Arnar to set up Activate

### [1:00:28-1:00:56] ISO 27001 Consulting
- Denish connected with 4C Consulting (from previous company) for ISO 27001 certification
- They will send a quote form — team needs to fill out who we are and what we need
- **Action:** Denish to send 4C Consulting link to Arnar

### [1:00:56-1:02:11] Business Traction Update
- David Health CEO: "This is going to be really good" after 1-hour demo
- Luxembourg networker showed strong interest
- Lux Innovation wants to help with various initiatives
- Hive (networking platform) may look at using XyReg

---

## Action Items

| # | Owner | Task | Priority |
|---|-------|------|----------|
| 1 | Ravi | Integrate ElevenLabs TTS for Professor Cyreg (Arnar to provide access) | Medium |
| 2 | Arnar | Add AI Sparkle to device description and other missing fields | Medium |
| 3 | Arnar | Remove Essential Performance duplication from Features | Low |
| 4 | Denish | Add reviewer due dates (auto-calc from approver date); show in "Awaiting my review" | High |
| 5 | Denish | Revamp reviewer selector: groups first, then internal/external alphabetical with checkboxes | High |
| 6 | Denish | Remove Status from Properties panel in draft studio | High |
| 7 | Denish | Remove Section from Properties; move to CI box edit | High |
| 8 | Denish | Remove Reference Documents section from Review Drafts | Medium |
| 9 | All | Standardize AI Sparkle color (one color everywhere) | Medium |
| 10 | All | Standardize edit icon (pen-on-page) for all DocCI entry points | Medium |
| 11 | All | Replace "X" with "Done" labels where user completes actions | Medium |
| 12 | All | Draft/Review color indicators: black=never started, yellow=in progress | Medium |
| 13 | All | Floating buttons must not overlap — enforce spacing | Low |
| 14 | All | Deploy stable build tonight, validate Saturday, release Sunday | Critical |
| 15 | Ravi | Implement release notes/upgrade flow under Help > Version History | High |
| 16 | Ravi | Catch up i18n language JSON files for new modules/terminology | Medium |
| 17 | Arnar | Remove "Advisory board" from Help menu | Low |
| 18 | Denish | Send OneLogin status to Arnar; Arnar to set up Activate account | High |
| 19 | Denish | Send 4C Consulting ISO 27001 quote form link to Arnar | Medium |

---

## Key Decisions
- Version upgrades are cumulative — skipping versions means getting all intermediate updates at once
- Cross-validation: Denish tests Ravi's work, Ravi tests Denish's (third-party perspective)
- Status field removed from Properties — process stepper (Draft → Review → Approval → E-Signature → Completed) drives status
- Section/phase editing belongs in CI box edit, not draft studio Properties
- Design History File (DHF): versions are phase-specific, old versions get "superseded" tag
- Release notes location: Help > Version History
- Validation goal: reduce from industry-standard 40+ hours to ~20 minutes per upgrade
- UI consistency: one edit icon, one AI sparkle color, "Done" instead of "X", color-coded draft/review states
