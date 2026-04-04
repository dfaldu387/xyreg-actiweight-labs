# Client Call Summary - February 22, 2026

**Recording:** https://fathom.video/share/efRf9DvafVsaPsELAK2jzYArdtGJyJex
**Duration:** 33 mins
**Participants:** Arnar Kristjansson, Denish Faldu

---

## Key Discussion Points

### [1:00] Coupon Code Input Disappeared
- Arnar reports the PILOT1000 coupon code input window has disappeared from the pricing page
- **Action:** Restore the coupon code input field on the pricing page

### [1:56] PILOT1000 Subscription Should Be Unlimited
- When PILOT1000 coupon is applied, it should automatically include unlimited devices, unlimited everything
- **Action:** When coupon code is active, remove device/module limits

### [3:17-5:00] Udamed Device Import During Onboarding
- During registration flow, after company setup, user should be able to import devices from Udamed
- Arnar has been working on Udamed integration in Lovable — filling in missing fields (trade name, model, UDI, European class, launch date = today minus 3 years)
- **Action:** Ensure Udamed device import step is part of onboarding flow

### [5:19] Udamed Data Population
- Arnar added missing fields from Udamed: identification, UDI codes, technical characteristics
- Single source of truth: changes in one place reflect everywhere (e.g., launch date)
- Export for Udamed feature added (draft)
- UDI codes auto-populated from Udamed data

### [9:50-10:50] Single Source of Truth
- When Udamed data is uploaded, technical characteristics are auto-filled (sterile, implantable, measuring, etc.)
- Override warning system: if user changes a value that differs from Udamed, system warns "overwrite?"
- Changes propagate automatically back to overview

### [16:47] Remove 33-Day Free Trial Text
- Stripe checkout shows "33-day free trial" — needs to be removed
- **Action:** Remove free trial period from Stripe checkout, or change to 7-day trial

### [17:48] Test Real Payment
- Successfully tested real payment (1 EUR) through Stripe with Arnar's card
- Payment authentication worked (bank ID / SMS)
- Coupon code TEST10 applied successfully on Stripe checkout

### [21:00-21:50] Cancel Subscription Bug
- After payment, cancel subscription flow is broken:
  - Shows "Switch to a different plan. You'll be downgraded to free Genesis. Subscription ending."
  - Cancel button should simply cancel — "Are you sure you want to cancel?" confirmation
  - **Action:** Fix cancel subscription flow — cancel means cancel, not downgrade

### [22:00] Plan Switching Strategy (Future)
- Users should be able to switch between plans (e.g., full package to ops-only)
- Punishment for frequent switching: changes take effect at next billing period
- **Not urgent for tomorrow** — future feature

### [24:25-25:46] Onboarding Flow — Auto Import Products
- During signup, after company creation, auto-import products from Udamed
- Step should use existing Udamed import module (no reinvention needed)
- Option to skip import (continue without devices)
- "Continue" button should NOT be grayed out when no devices selected

### [25:48] 7-Day Free Trial
- Default: 7-day free trial for all new signups
- User enters credit card but payment starts after 7 days
- Can cancel within 7 days with no charge
- **Action:** Configure 7-day trial period in Stripe

### [28:20] Post-Onboarding Redirect
- After onboarding, redirect directly to the company dashboard (e.g., /app/company/airnova)
- Arnar changed this in Lovable already

### [30:15-31:48] David Healthcare Demo Setup
- Arnar promised David Health a link to test their system by tomorrow
- Plan: Set up account with their Udamed products pre-loaded, give login credentials
- Client may be hesitant to enter credit card — so manual setup preferred for demo
- Proposal sent: 1000 EUR/month + 8 hours/month of Arnar's consulting

---

## Action Items (Priority Order)

| # | Task | Priority | Timestamp |
|---|------|----------|-----------|
| 1 | Restore coupon code input on pricing page | HIGH | [1:00] |
| 2 | Fix cancel subscription flow — cancel should just cancel | HIGH | [21:00] |
| 3 | Remove "33-day free trial" from Stripe checkout | HIGH | [16:47] |
| 4 | Configure 7-day free trial in Stripe | HIGH | [25:48] |
| 5 | PILOT1000 coupon = unlimited devices/modules | MEDIUM | [1:56] |
| 6 | Udamed device import in onboarding flow | MEDIUM | [3:17] |
| 7 | "Continue" button not grayed out when no devices selected | MEDIUM | [28:01] |
| 8 | Plan switching at next billing period (future) | LOW | [22:00] |
