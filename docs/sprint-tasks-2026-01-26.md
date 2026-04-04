# XyReg Launch Sprint - January 26, 2026
## Meeting Summary & Task Breakdown

---

## Key Decision: Dubai WHX Launch (Feb 9-12)
**Genesis is the PRIMARY focus for the Dubai launch.** All other modules are secondary.

---

## HIGH PRIORITY Tasks (Before Dubai - Feb 9)

### 1. Investor Deal Flow Enhancements
**Assignee:** Denish
**Priority:** HIGH

| Task | Description | Status |
|------|-------------|--------|
| Add funding amount to cards | Display ticket size/dollar amount on deal flow cards | Pending |
| Add status tags on cards | Show "Watching", "Interested", "Invested", "Not Interested" tags visible on each card | Pending |
| Filter by status | Add filter in deal flow to show/hide deals by status | Pending |
| Filter "Not Interested" | Allow filtering out deals marked as "not interested" | Pending |
| "New Deals" filter | Filter to show deals from last week/10 days | Pending |

### 2. My Portfolio Page
**Assignee:** Denish
**Priority:** HIGH

| Task | Description | Status |
|------|-------------|--------|
| Show only marked deals | Portfolio should ONLY show deals marked as Interested/Watching/Invested | Done |
| Consider as Deal Flow tab | Evaluate if My Portfolio should be a tab within Deal Flow instead of separate page | To Discuss |

### 3. Genesis Validation Bug Fixes
**Assignee:** Ravi
**Priority:** HIGH

| Task | Description | Status |
|------|-------------|--------|
| Fix yellow validation | When removing content from fields, yellow validation indicator wasn't appearing | Fixed (local) |
| Test all form fields | 4-5 places had this validation issue - need thorough testing | In Progress |
| Push fixes to production | Deploy Genesis fixes | Pending |

### 4. Demo Devices for Dubai
**Assignee:** Arnar + Team
**Priority:** HIGH

| Task | Description | Status |
|------|-------------|--------|
| Create 5 manual devices | Arnar to manually create 5 devices to test full UX flow | Pending |
| Generate 20-30 demo devices | Use AI to generate additional demo devices after manual testing | Pending |
| Verify all Genesis steps work | End-to-end testing of device creation flow | Pending |

---

## MEDIUM PRIORITY Tasks

### 5. Mission Control Updates
**Assignee:** Denish
**Priority:** MEDIUM

| Task | Description | Status |
|------|-------------|--------|
| Show deal communications | Display messages/comments sent to companies in Mission Control | Pending |
| Consider L1 merge | Evaluate merging Mission Control with Deal Flow in L1 navigation | To Discuss |

### 6. Marketplace Preview Enhancements
**Assignee:** Denish
**Priority:** MEDIUM

| Task | Description | Status |
|------|-------------|--------|
| "View Other Listings" toggle | Add option for company admins to see all marketplace listings | Pending |
| Require sharing to view others | If user wants to view other listings, they must share their own devices first | Pending |

### 7. Website/Landing Page Updates
**Assignee:** Team
**Priority:** MEDIUM

| Task | Description | Status |
|------|-------------|--------|
| Update pricing page | Sync with new pricing strategy (free for 500 vs $49/month) | Pending |
| Add Vimeo video | Embed product video on landing page | Pending |
| Fix top navigation | Make navigation more prominent/converting | Pending |
| Dubai special landing page | Create separate pricing page for WHX attendees (optional) | To Decide |
| Newsletter signup | Add email capture for interest gathering | Pending |

---

## LOW PRIORITY / Post-Dubai Tasks

### 8. Build Pack & Other Modules
**Priority:** LOW (Post-Dubai)

| Module | Status | Target |
|--------|--------|--------|
| AI Requirements Engineering | Exists | Q1 |
| Risk Management | Exists | Q1 |
| Usability Engineering | Has model | Q1 |
| Labeling & IFU | Not ready | Q2+ |
| Software Lifecycle | Gap analysis only | Q2+ |
| Post-Market Surveillance | Not built | Q3+ |

**Decision:** Lock modules that aren't ready. Users should only see Genesis features.

### 9. Pricing Strategy Decisions
**Owner:** Arnar
**Status:** To be decided by tomorrow

Options being considered:
1. **Free forever** (first 500 users) - loses urgency
2. **$49/month** with Dubai code for free founding members
3. **$29/month** lower barrier to entry

Requirements for founding members:
- Must sign up before Feb 28
- Must log in at least once per month to keep free status

### 10. Referral System
**Priority:** LOW (for later)

- "No budget? Invite founders, earn 150 credits each"
- Too complex for initial launch
- Revisit after Genesis is stable

### 11. Community Guidelines
**Priority:** LOW (for later)

- Needed to prevent abuse (fake products to view competitors)
- Standard community guidelines like Facebook/Reddit

---

## Architecture/Backend Work Completed

**Ravi completed:**
- Database structure for pricing plans
- Add-on plans in Stripe
- Backend logic for menu visibility based on plan
- Pricing plan sync infrastructure

---

## Key Dates

| Date | Event |
|------|-------|
| Feb 9-12 | WHX Dubai Conference |
| Feb 28 | Deadline for founding member signup |
| Q1 2026 | Genesis full launch |
| Q2 2026 | Build Pack modules |

---

## Action Items for Tomorrow

1. **Arnar:** Finalize pricing strategy decision
2. **Denish:** Implement deal flow status tags and filters
3. **Ravi:** Push Genesis validation fixes, continue testing
4. **Team:** Prepare for Genesis-focused sprint

---

## Notes from Discussion

- Triple Helix concept (Business + Regulatory + Engineering) for marketing
- LinkedIn post already live promoting WHX Dubai presence
- Focus on "selling, selling, selling" at the conference
- Need 20-30 devices visible in marketplace for demo purposes
- Consider AI-generated demo devices after manual validation
