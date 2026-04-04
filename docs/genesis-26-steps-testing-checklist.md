# Genesis Steps - End-to-End Testing Checklist
**Tester:** Denish Faldu
**Date Started:** January 22, 2025
**Target:** Complete all 25 Genesis steps testing

---

## Testing Instructions

For each step, verify:
1. **UI Loads** - Step renders without errors
2. **Input Works** - All form fields accept input correctly
3. **Data Saves** - Changes persist after navigating away and back
4. **Validation** - Required fields show proper validation messages
5. **Data Flows** - Data entered appears correctly in business case/investor view
6. **Responsive** - Works on iPad/tablet view (especially check scrolling)

---

## PHASE 1: Opportunity & Definition (Steps 1-12)

### Step 1: Device Name
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Device name field displays correctly | | |
| [ ] Name saves to database | | |
| [ ] Name shows in sidebar/header | | |
| [ ] Special characters handled properly | | |

### Step 2: Technical Readiness Level (TRL)
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] TRL dropdown/slider shows all levels (TRL 3-8) | | |
| [ ] TRL description displays for selected level | | |
| [ ] TRL saves correctly | | |
| [ ] TRL shows in viability scorecard | | |

### Step 3: System Architecture
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Options display: Pure Hardware, SiMD, SaMD | | |
| [ ] Selection saves correctly | | |
| [ ] Architecture affects classification options | | |
| [ ] Visual indicator shows selected type | | |

### Step 4: Intended Use
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Text area loads with existing data | | |
| [ ] Rich text editing works (if applicable) | | |
| [ ] Character limit works (if any) | | |
| [ ] Intended use saves properly | | |
| [ ] Shows in investor view/business case | | |

### Step 5: Device Description
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Description text area works | | |
| [ ] Existing description loads | | |
| [ ] Auto-save or manual save works | | |
| [ ] Description appears in business case | | |

### Step 6: Upload Device Image
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Image upload button works | | |
| [ ] Supported formats accepted (PNG, JPG, etc.) | | |
| [ ] Image preview displays | | |
| [ ] Multiple images can be uploaded | | |
| [ ] Images save to storage | | |
| [ ] Images display in investor view | | |
| [ ] Delete image works | | |

### Step 7: Target Markets
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Market checkboxes display (US, EU, UK, etc.) | | |
| [ ] Multiple markets can be selected | | |
| [ ] Markets save correctly | | |
| [ ] Selected markets affect other steps (classification, reimbursement) | | |

### Step 8: Device Classification
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Classification options show per market | | |
| [ ] EU classes display (I, IIa, IIb, III) | | |
| [ ] FDA classes display (I, II, III) | | |
| [ ] Classification saves per market | | |
| [ ] Blue classification box shows correctly | | |
| [ ] **Highest classification shows** (if multiple components) | | |
| [ ] "Add Component" button works | | |
| [ ] "Read More" expands details | | |

### Step 9: Market Sizing (TAM/SAM/SOM)
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] TAM input field works | | |
| [ ] SAM input field works | | |
| [ ] SOM input field works | | |
| [ ] Currency formatting works | | |
| [ ] Values save correctly | | |
| [ ] Market sizing shows in business case | | |
| [ ] Calculations are correct (if auto-calculated) | | |

### Step 10: Competitor Analysis
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Competitor name field works | | |
| [ ] Add competitor button works | | |
| [ ] Multiple competitors can be added | | |
| [ ] Competitor details save | | |
| [ ] Differentiation notes save | | |
| [ ] Competitors show in investor view | | |
| [ ] Delete competitor works | | |

### Step 11: Profile User
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Patient population field works | | |
| [ ] Intended operators selection works | | |
| [ ] Environment field works | | |
| [ ] Duration/triggers fields work | | |
| [ ] All data saves correctly | | |
| [ ] User profile shows in business case | | |

### Step 12: Profile Economic Buyer
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Economic buyer fields display | | |
| [ ] Market-specific characteristics save | | |
| [ ] Budget ownership info saves | | |
| [ ] Data shows in business case | | |

---

## PHASE 2: Feasibility & Planning (Steps 13-22)

### Step 13: Value Proposition
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Value proposition input works | | |
| [ ] Multiple value points can be added | | |
| [ ] Quantified improvements save | | |
| [ ] **Value props show in viability scorecard** | | |
| [ ] Data flows to investor view | | |

### Step 14: Health Economic Model (HEOR)
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Cost savings input works | | |
| [ ] QALY gains input works | | |
| [ ] Budget impact fields work | | |
| [ ] ROI calculations display correctly | | |
| [ ] HEOR data saves | | |
| [ ] Shows in business case | | |

### Step 15: Reimbursement & Market Access
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Reimbursement strategy fields work | | |
| [ ] Coding pathway selection works | | |
| [ ] Payer engagement plan saves | | |
| [ ] Per-market data shows correctly | | |
| [ ] Data appears in investor view | | |

### Step 16: Risk Assessment
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Hazard identification works | | |
| [ ] Risk matrix/scoring works | | |
| [ ] Multiple risks can be added | | |
| [ ] Mitigation strategies save | | |
| [ ] ISO 14971 alignment noted | | |
| [ ] Risk summary in business case | | |

### Step 17: Clinical Evidence Strategy
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Clinical validation plan fields work | | |
| [ ] Study design selection works | | |
| [ ] Evidence requirements save | | |
| [ ] Timeline inputs work | | |
| [ ] Data shows in investor view | | |

### Step 18: IP Strategy & Freedom to Operate
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Patent fields work | | |
| [ ] FTO risk assessment works | | |
| [ ] Defensive moat description saves | | |
| [ ] IP summary in business case | | |

### Step 19: Project & Resource Plan
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Phase inputs work | | |
| [ ] Budget estimate fields work | | |
| [ ] Team size input works | | |
| [ ] Timeline inputs work | | |
| [ ] **iPad scrolling works properly** | | |
| [ ] Data saves correctly | | |
| [ ] Shows in business case | | |

### Step 20: Funding & Use of Proceeds
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Capital requirements input works | | |
| [ ] Fund allocation sections work | | |
| [ ] Pie chart/visualization displays | | |
| [ ] Amounts calculate correctly | | |
| [ ] Data saves | | |
| [ ] Shows in investor presentation | | |

### Step 21: Revenue Forecast
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Sales projection inputs work | | |
| [ ] Pricing input works | | |
| [ ] 5-year NPV calculates correctly | | |
| [ ] Revenue chart displays | | |
| [ ] **iPad scrolling works** (P0 bug) | | |
| [ ] Data saves correctly | | |
| [ ] Shows in business case / investor view | | |

### Step 22: Team Composition
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Key roles input works | | |
| [ ] Team member fields work | | |
| [ ] Add team member works | | |
| [ ] Hiring priorities section works | | |
| [ ] Team data saves | | |
| [ ] Team shows in business case | | |

---

## PHASE 5: Market Readiness (Steps 23-25)

### Step 23: Go-to-Market Strategy
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Pricing strategy input works | | |
| [ ] Sales channels selection works | | |
| [ ] Marketing materials section works | | |
| [ ] Customer support plan saves | | |
| [ ] Data shows in business case | | |

### Step 24: Manufacturing & Supply Chain
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Supplier selection fields work | | |
| [ ] Production strategy input works | | |
| [ ] Supply chain logistics save | | |
| [ ] Data shows in business case | | |

### Step 25: Exit Strategy & Valuations
| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Potential acquirers input works | | |
| [ ] Comparable M&A fields work | | |
| [ ] Valuation inputs work | | |
| [ ] Exit path description saves | | |
| [ ] Data shows in investor view | | |

---

## Cross-Step Data Flow Tests

| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Value proposition (Step 13) → Viability Scorecard shows points (not 0) | | |
| [ ] Classification (Step 8) → Shows in all relevant views | | |
| [ ] Market selection (Step 7) → Affects classification & reimbursement options | | |
| [ ] Revenue forecast → NPV shows in business case summary | | |
| [ ] All steps → Investor share view displays correctly | | |
| [ ] All steps → Marketplace listing shows correct data | | |

---

## Responsive/iPad Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| [ ] Step 19 (Project Plan) - iPad scrolling | | |
| [ ] Step 21 (Revenue Forecast) - iPad scrolling | | |
| [ ] All steps - Sidebar navigation works on tablet | | |
| [ ] All steps - Forms usable on tablet | | |
| [ ] Business case layout - Clean on tablet | | |

---

## Bug Report Template

```
### Bug Title: [Brief description]

**Step:** [Step number and name]
**Severity:** Critical / High / Medium / Low
**Device:** Desktop / iPad / Mobile

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**

**Actual Result:**

**Screenshot:** [If applicable]
```

---

## Testing Progress Summary

| Phase | Steps | Tested | Passed | Failed |
|-------|-------|--------|--------|--------|
| Phase 1 (Opportunity) | 12 | 0 | 0 | 0 |
| Phase 2 (Feasibility) | 10 | 0 | 0 | 0 |
| Phase 5 (Market Ready) | 3 | 0 | 0 | 0 |
| **TOTAL** | **25** | **0** | **0** | **0** |

---

## Notes

- Focus on **P0 bugs first**: Business case layout, data flow (value prop → scorecard), iPad scrolling
- Arnar feedback: Layout looks "chaotic" - note any UI improvements needed
- Test with real data when possible
- Check both **save** and **load** for each field

---

**Last Updated:** [Date]
**Testing Completed:** [ ] Yes / [x] No
