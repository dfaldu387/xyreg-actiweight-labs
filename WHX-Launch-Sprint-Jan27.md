# XyReg Launch Sprint - January 27, 2025

## Meeting Summary

**Participants:** Arnar Kristjansson, Denish Faldu, Ravi Sanchala
**Duration:** 29 mins
**Focus:** WHX Trade Fair Launch Preparation

---

## Key Updates

### Marketing & Landing Page (Arnar)
- Triple helix design added to landing page
- "Request access code" feature for Genesis Success
- Debug mode with lightbox/coordinates for calibration
- Drag & drop functionality for field positioning

### Deal Flow Marketplace (Denish)
- New tab order implemented: My Portfolio → Invited → Public → All Deals
- Filters moved to sidebar (cleaner UI)
- Added badges (Interesting, etc.)
- Ticket size & "Recently Added" filters added
- Investor marketplace: "My Listings" & "View Other Listings" tabs
- Full width layout optimization

### Genesis Flow (Ravi)
- Fixed re-bouncing issue on step 6
- Collapsible sections with slide-down animation
- Working on eye-catch visibility for steps 11-13
- Backend changes for Genesis plan

### Infrastructure Readiness (Denish)
| Service | Current Status | Action Needed |
|---------|---------------|---------------|
| Resend (Email) | Free (3,000 emails) | Consider Pro if high traffic |
| Supabase | Pro - Nano (512MB) | **Upgrade to Micro (FREE)** |
| Vercel | Paid | Ready |
| Digital Ocean | Fine tuned | Ready |

---

## Tasks by Priority

### P0 - Critical (Before WHX)

| Task | Owner | Status |
|------|-------|--------|
| Upgrade Supabase to Micro compute | Denish | Pending |
| Fix re-bouncing issue on Genesis step 6 | Ravi | Done |
| Backend stability & testing for WHX | Denish | In Progress |
| Make collapsible sections more obvious (cursor change) | Ravi | Pending |
| Eye-catch visibility for steps 11-13 | Ravi | In Progress |

### P1 - High Priority

| Task | Owner | Status |
|------|-------|--------|
| Move "My Portfolio" tab to far left position | Denish | Pending |
| Tab order: My Portfolio → Invited → Public → All Deals | Denish | Pending |
| Add login button to landing page (like Pipedrive) | Denish | Pending |
| Dynamic remaining spots counter integration | Denish | Pending |
| Pricing page updates | Denish | Pending |
| Landing page triple helix calibration | Arnar | In Progress |

### P2 - Medium Priority

| Task | Owner | Status |
|------|-------|--------|
| Change "founders" to "medtech companies" in Genesis copy | Arnar | Pending |
| Add "Contact Sales" option to landing page | Arnar/Denish | Pending |
| Show "Filling Fast" instead of exact remaining count | Arnar | Pending |
| Consider Resend Pro upgrade before WHX | Denish | Monitor |

### P3 - Post-Launch / Nice to Have

| Task | Owner | Status |
|------|-------|--------|
| AI features gating (SERP API, etc.) for paid subscriptions | TBD | Backlog |
| Apollo.io integration for lead generation | TBD | Backlog |

---

## Access Code Strategy

- **Code:** `Origin 500` (first 500 users)
- Will be printed on business cards for WHX
- Users can request code via landing page form
- Display: "Filling Fast" or "Few seats left" (not exact numbers)

---

## Services & APIs to Monitor

- **SERP API (serpapi.com):** Image search for Get Media feature - tied to AI subscription
- **Resend:** Email service - 3,000 free limit
- **Supabase:** Database - upgrade to micro before high traffic
- **Udamed Database:** 30,000 MedTech companies available

---

## Next Steps

1. **Denish:** Focus on backend stability, Supabase upgrade, tab order fixes
2. **Ravi:** Continue Genesis flow improvements, collapsible UX, eye-catch visibility
3. **Arnar:** Landing page calibration, copy updates, marketing coordination

---

## Notes

- Free trade agreement between India and EU mentioned
- Apollo.io suggested for finding CEO/CFO leads (paid service)
- Udamed database has quality people emails, but need decision-maker contacts
