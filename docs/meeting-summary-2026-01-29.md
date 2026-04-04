# Meeting Summary: XyReg Genesis 500 Launch Sprint

**Date:** January 29, 2026
**Duration:** 39 minutes
**Focus:** Genesis 500 launch preparation (target: tomorrow, 11 days before Feb 9th conference)

---

## CRITICAL TASKS (Launch Blockers)

| Timestamp | Task | Owner | Notes |
|-----------|------|-------|-------|
| 26:00 | Launch homepage tomorrow - DNS settings | Ravi | Final DNS configuration needed |
| 29:20 | Create fully populated demo account | Team | For presentations/demos |

---

## HIGH PRIORITY BUGS

| Timestamp | Task | Owner | Notes |
|-----------|------|-------|-------|
| 6:19 | Bug #1740 - System jumps out unexpectedly | Team | Reproducibility issue |
| 7:36 | File upload not saving (intermediate value error) | Team | TypeError on upload |
| 10:09 | Gap analysis not trickling down to documents | Team | Documents not inheriting gap analysis |
| 12:06 | EUDAMED data issue | Denish | Lardal should show 6 devices; DB should have 1.1M records |
| 16:39 | "No Phase" appearing incorrectly | Team | Remove "No Phase" option entirely |

---

## HIGH PRIORITY FEATURES

| Timestamp | Task | Owner | Notes |
|-----------|------|-------|-------|
| 4:55 | Add floating "Return to Genesis" button | Team | For Genesis users navigating outside Genesis |
| 34:19 | Add author assignment in Gantt chart | Ravi | Same UI pattern as document creation dialog |

---

## MEDIUM PRIORITY

| Timestamp | Task | Owner | Notes |
|-----------|------|-------|-------|
| 1:34 | Change signup text | Denish | "Why do you need CyREG" → "What makes you a CyREG Genesis candidate" |
| 9:27 | Add training tutorials for gap analysis | Arnar | Standards training content |
| 15:14 | Fix dialog closing unexpectedly | Team | When ordering/reordering phases |
| 27:16 | Add multi-language features to login | Ravi | Language selector on auth pages |
| 36:37 | Fix Gantt chart date dragging | Ravi | Dates snap to wrong positions |

---

## LOW PRIORITY / UI POLISH

| Timestamp | Task | Owner | Notes |
|-----------|------|-------|-------|
| 33:10 | Move due date higher in documents UI | Team | Better visibility |
| 37:47 | Reduce space between nav and header | Denish | Homepage layout adjustment |

---

## KEY DECISIONS MADE

| Timestamp | Decision |
|-----------|----------|
| 5:38 | Genesis users get floating "Return to Genesis" button instead of hiding phases |
| 24:51 | Free account lost if not used for 6 weeks |
| 28:13 | Cortex NOT needed for Genesis (no document uploads required) |
| 28:45 | AI booster IS included in Genesis for requirements |
| 26:00 | Launch target: Tomorrow |

---

## FUTURE ITEMS (Post-Launch)

| Timestamp | Feature | Notes |
|-----------|---------|-------|
| 13:30 | Monthly report generation | Automated compliance reports |
| 19:35-23:24 | Compliance instance suggestions with AI | Smart suggestions based on device type |
| 36:37 | Double-click Gantt item to navigate | Opens associated document |

---

## GENESIS 500 RESTRICTIONS (Confirmed)

- **1 device only** (enforced)
- **1 market only** (enforced)
- **Only "New Device" type** (variants, upgrades locked)
- **Free tier** - no payment required
- **6 week inactivity** = account lost

---

## ACTION ITEMS BY OWNER

### Ravi
- DNS settings for homepage launch
- Multi-language login features
- Gantt chart author assignment
- Gantt chart date dragging fix

### Denish
- EUDAMED data fix (1.1M records)
- Signup text change
- Homepage spacing adjustment

### Arnar
- Gap analysis training tutorials

### Team (Unassigned)
- Bug #1740 investigation
- File upload error fix
- Gap analysis trickling
- "No Phase" removal
- Dialog closing bug
- Demo account creation
- "Return to Genesis" floating button
