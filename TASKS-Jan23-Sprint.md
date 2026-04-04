# XyReg Launch Sprint - Task List (January 23, 2025)

Based on client meeting: https://fathom.video/share/yHRNRMKq1yiKss8Wx-3L1ByVbsXxy-oU

---

## Priority 1 - Critical (Investor Marketplace)

### 1.1 Fix Investor L1/L2 Navigation
- [ ] Simplify investor portal navigation (remove L1/L2 complexity)
- [ ] Deal Flow should be the **first page** investors see (not My Portfolio)
- [ ] Remove duplicate "Browse Deal Flow" button from portfolio page
- [ ] Fine-tune smooth navigation between investor sections

### 1.2 My Portfolio Improvements
- [ ] Add tabs or filters for deal status: **Watching**, **Interested**, **Invested**
- [ ] When investor marks a deal as watching/interested/invested, it appears in My Portfolio
- [ ] Remove "Investor Access Required" message for logged-in investors

### 1.3 Marketplace Share Dialog - Add Funding Requirements
- [ ] Add **Funding Stage** dropdown (Pre-Seed, Seed, Series A, etc.) - same as investor share
- [ ] Add **Funding Amount** input with currency selector (EUR, USD, GBP, CHF)
- [ ] This is how investors filter deals - critical for discovery

### 1.4 Marketplace Preview for Companies
- [ ] Companies should see what they look like in the marketplace BEFORE launching
- [ ] Show their own card in the Deal Flow framework
- [ ] Add "Preview" button in Genesis share section
- [ ] Show "Not Launched" tag if company hasn't published yet
- [ ] Clear indication: Are you online or not? Are you in the marketplace or not?

---

## Priority 2 - Important

### 2.1 Watchtower (Portfolio Monitoring)
- [ ] Rename "Portfolio Monitoring" to **"Watchtower"** (Xyreq Watchtower)
- [ ] This is for viewing company KPIs after getting access
- [ ] Separate from My Portfolio (deal tracking)

### 2.2 Mission Control for Investors
- [ ] Keep Mission Control - important for investor communication
- [ ] Investor view should be similar to consultant view
- [ ] Show companies list with ability to click and go directly to KPIs

### 2.3 Marketplace Visibility Options
- [ ] Option 1: Launch for **investors only** (accredited investors who logged in)
- [ ] Option 2: Launch for **investors + other Xyreq companies**
- [ ] "Show me yours, I'll show you mine" principle - companies must opt-in to see other companies

---

## Priority 3 - In Progress / Completed

### 3.1 Genesis Bugs (Fixed by Denish)
- [x] Step 18: IP Strategy Summary - fixed
- [x] Step 20: Data saving issue - fixed
- [x] Step 23: Ownership notes saving - fixed
- [x] Tablet view responsive testing completed

### 3.2 Other Fixes
- [x] Revenue Forecast page - made responsive for tablet
- [x] Pricing page back button - customers can now go back
- [x] Regulatory info component - now always visible
- [x] Classification rules dropdown - working properly

### 3.3 Tenant & Domain Management (In Progress - Denish)
- [ ] DNS and subdomain handling for tenants
- [ ] Dynamic tenant management
- [ ] Tenants area for managing domains
- [ ] Support for consultants/investors with multiple companies

---

## Priority 4 - Future (After Genesis Complete)

### 4.1 AI Classification Report
- [ ] Generate classification reports automatically (currently costs 10,000+ EUR manually)
- [ ] Use data already in Xyreq to populate report template
- [ ] Include: Device description, indications, classification result, consequences for development
- [ ] Timeline: 2 weeks after Genesis complete

### 4.2 Pricing Integration
- [ ] Link pricing from xyreg.com to app.xyreg.com/pricing
- [ ] Separate landing page (marketing) from app (pricing, onboarding, signup)

---

## Testing Focus (Ravi & Denish)

- [ ] End-to-end testing: Sign-up → Genesis → Upgrade/Downgrade
- [ ] Test access controls for paid vs free customers
- [ ] Test inviting users, reviews workflow
- [ ] Ensure easy to use, intuitive experience
- [ ] Test pricing model business cases and scenarios

---

## Key Decisions from Meeting

1. **Deal Flow first** - Investors should land on Deal Flow, not My Portfolio
2. **Funding info critical** - Investors filter by ticket size, must have in marketplace
3. **Preview before publish** - Companies need to see their card before going live
4. **Watchtower = KPI monitoring** - Separate from deal tracking
5. **Two-tier visibility** - Investors only vs. Investors + Companies (opt-in)

---

## Notes

- Expecting 20+ companies in the next month
- Fund/VC customers could pay 3,000 EUR/month for 10+ companies
- Focus on smooth navigation and ease of use
- Patent filed for Genesis system
