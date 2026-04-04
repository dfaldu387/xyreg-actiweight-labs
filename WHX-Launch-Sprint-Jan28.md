# XyReg Launch Sprint - January 28, 2025

## Meeting Summary

**Participants:** Arnar Kristjansson, Denish Faldu, Ravi Sanchala
**Focus:** WHX Dubai Launch Preparation - Final Sprint

---

## Completed Items

| Item | Owner | Status |
|------|-------|--------|
| Deal Flow loading issue | Denish | Done |
| Slack alerts for WHX signups | Denish | Done |
| Tab order (My Portfolio, Invited, Public, All Deals) | Denish | Done |
| Backend optimization for speed | Denish | Done |
| Genesis bug fix (data loss between steps 14-15) | Denish/Ravi | Done |
| Locked modules UI for Genesis plan | Ravi | Done |
| Landing page triple helix design | Arnar | Done |

---

## Tasks by Priority

### P0 - Critical (Must Have Before WHX)

| Task | Owner | Description |
|------|-------|-------------|
| Upgrade Supabase to Micro | Denish | Do tonight when no users online |
| Simplify Genesis Access Form | Denish | Remove email/company fields, keep only Access Code + Activate button |
| Add "Request Access Code" flow | Denish | Opens popup → captures email → sends to info@xyreg.com |
| QR Code for business card | Arnar/Denish | Must link to Genesis page, 100% reliable |
| Short URL: xyreg.com/genesis | Denish | Fallback for people who don't use QR |
| Deploy landing page changes | Denish | Needed ASAP for QR code testing |

### P1 - High Priority

| Task | Owner | Description |
|------|-------|-------------|
| Change Helix OS to "Beta" | Ravi | Add "(Beta)" after "Helix OS" title |
| Change "Upgrade" to "Become Pilot" | Ravi | For Helix OS plan button |
| Change "Most Popular" to "Launching Q1 2026" | Ravi | Badge on Helix OS plan |
| Add "Unlimited Users" to all plans | Ravi | Key selling point - add prominently |
| Contact Sales form for Helix/Enterprise | Ravi | Inline form, no redirect |
| Mark non-Genesis features as beta | Denish | Dim/italic styling for unavailable features |

### P2 - Medium Priority

| Task | Owner | Description |
|------|-------|-------------|
| Add "Best viewed on desktop" banner | Denish | Show on mobile/tablet devices |
| Ask pilot customers for logo permission | Arnar | For "Featured" section on homepage |
| Connect pricing page to backend | Denish/Ravi | Framework exists, needs update for new addons |
| Design business card | Arnar | Front: LinkedIn QR, Back: Genesis 500 QR |

### P3 - Nice to Have

| Task | Owner | Description |
|------|-------|-------------|
| CAPA module draft | Arnar | Creating with Gemini |
| IFU pricing graph | Arnar | For pricing decisions |
| SuperAdmin pricing controls | Denish | Revamp needed for new pricing structure |

---

## Key Decisions Made

### Genesis Access Flow (Simplified)
```
┌─────────────────────────────────────────────┐
│         Activate Your Genesis Account        │
├─────────────────────────────────────────────┤
│  Access Code: [_______________]              │
│                                              │
│  [Activate My Genesis Account]               │
│                                              │
│  Don't have an access code? Request one     │
│  (Opens popup → Email capture → info@xyreg) │
└─────────────────────────────────────────────┘
```

### WHX User Journey
1. User gets business card with QR code at WHX Dubai
2. QR code → xyreg.com/genesis (or short URL)
3. User enters access code "ORIGIN500"
4. Redirects to normal Genesis signup flow
5. No access code? Request one → Arnar reviews → sends code

### Pricing Display Strategy
- **Genesis**: Active, fully available
- **Helix OS**: Show as "Beta" + "Launching Q1 2026" + "Become Pilot"
- **Enterprise**: Contact Sales only
- All locked features: Visible but dimmed/locked with upgrade prompt

### Genesis Locked Modules
Users see all modules but can't interact:
- Compliance Module → Locked
- Change Control → Locked
- Document Control → Locked
- Click "Upgrade" → Shows pricing with "Become Pilot" option

---

## Landing Page Counter Logic

```
if (signups >= 250) {
  show: "Only {500 - signups} spots remaining!"
} else {
  show: "Filling fast"
}
```

Changed copy: "First 500 MedTech Teams" (not "Founders")

---

## Potential Pilot Customers

| Company | Contact | Status |
|---------|---------|--------|
| Donathan Salman | Meeting Friday | Luxembourg pilot |
| iMZero | Meeting today | Wound care device |
| (Need 3rd) | TBD | Target: 3 pilots |

**Action:** Ask pilots for permission to display logos in "Featured" section

---

## QR Code Requirements

- **Primary**: Genesis signup page (xyreg.com/genesis)
- **Secondary**: LinkedIn profile (optional, front of card)
- **Tool**: Free QR generator online (can customize shape/design)
- **Critical**: Must be 100% working before printing

---

## Technical Notes

### Supabase Upgrade Plan
- Current: Nano (512MB)
- Target: Micro (free upgrade)
- Timing: Tonight when no users active
- Why: Handle WHX traffic without downtime

### Mobile Strategy
- Primary: Desktop experience
- Mobile: Show "Best viewed on desktop" banner
- Future: Some modules may have mobile feedback features

---

## Next Steps

1. **Denish**: Deploy landing page + Genesis flow changes
2. **Ravi**: Update pricing cards (Beta, Become Pilot, Q1 2026)
3. **Arnar**: Create QR code once URL is live, design business card
4. **All**: Test full Genesis flow end-to-end

---

## Timeline

| Date | Milestone |
|------|-----------|
| Jan 28 | Deploy landing page changes |
| Jan 28 | Supabase upgrade (tonight) |
| Jan 29 | Business card design review |
| Jan 30 | QR code testing |
| Jan 31 | Final testing |
| Feb 3-5 | WHX Dubai Event |
