# Xyreg Pricing & AI Credits - Technical Specification

> This document outlines the AI credits system, referral program, module definitions, and API key architecture decisions for the new pricing module.

---

## Table of Contents

1. [AI Credits System](#1-ai-credits-system)
2. [Referral Program](#2-referral-program)
3. [Module Definitions](#3-module-definitions)
4. [API Key vs AI Credits Architecture](#4-api-key-vs-ai-credits-architecture)
5. [Implementation Recommendations](#5-implementation-recommendations)

---

## 1. AI Credits System

### Overview

AI credits are the currency for AI-powered features in Xyreg. Credits are consumed based on the **intensity** of the AI action performed.

### Credit Consumption Tiers

| Intensity | Credits per Action | Category | Examples |
|-----------|-------------------|----------|----------|
| **High** | ~50 credits | Full Document Generation | Risk Analysis (FMEA), Requirements Spec, Clinical Eval Draft, Patent FTO Analysis |
| **Standard** | ~15 credits | AI-Assisted Actions | Label Generation, IFU Section, Change Impact Analysis, Supplier Scoring |
| **Low** | ~5 credits | Smart Suggestions | BOM Validation, Training Quiz, Template Auto-fill, Task Recommendations |

### Credits by Pricing Tier

| Tier | Monthly Included | Booster Pack | Booster Cost |
|------|------------------|--------------|--------------|
| **Genesis** | 0 credits | 500 credits | €49 (one-time) |
| **Core OS** | 500 credits | 1,000 credits | €50 (one-time) |
| **Enterprise** | Custom | Custom | Negotiated |

### Credit Usage Examples

With **500 credits** (Core OS monthly allocation), users can perform approximately:

| Action Type | Approximate Count |
|-------------|-------------------|
| Full document generations (High AI) | ~10 documents |
| AI-assisted actions (Standard) | ~33 actions |
| Smart suggestions (Low AI) | ~100 suggestions |

### Credit Expiry Rules

| Tier | Expiry Policy |
|------|---------------|
| Genesis (purchased) | 60 days from purchase |
| Genesis (referral earned) | 60 days from earning |
| Core OS (monthly) | End of billing cycle (no rollover) |
| Core OS (booster) | No expiry while subscription active |
| Enterprise | Custom terms |

---

## 2. Referral Program

### Overview

The referral program allows **Genesis tier users** to earn AI credits by inviting other founders to the platform.

### Program Parameters

```javascript
const REFERRAL_CONFIG = {
  creditsPerReferral: 150,    // Credits earned per qualified referral
  expiryDays: 60,             // Referral credits expire in 60 days
  maxReferrals: 10,           // Maximum referrals per user
  maxEarnableCredits: 1500,   // 10 referrals × 150 credits
};
```

### Referral Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Genesis User   │────>│  Sends Invite   │────>│  New User Signs │
│  (Referrer)     │     │  Link/Email     │     │  Up & Qualifies │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Credits Added  │<────│  System Awards  │<────│  Qualification  │
│  to Referrer    │     │  150 Credits    │     │  Check Passed   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Qualification Criteria (Suggested)

A referral is "qualified" when the new user:
- Creates an account
- Verifies email
- Completes at least one Venture Blueprint section
- OR upgrades to a paid tier

### UI Placement

The referral program should be visible in:
1. Genesis tier configuration panel
2. User dashboard/profile
3. When AI credits run low (prompt to invite friends)

---

## 3. Module Definitions

### Module Catalog Overview

Modules are organized into three **buckets**:

| Bucket | Focus Area | Color Theme |
|--------|------------|-------------|
| **Builder** | R&D & Engineering | Cyan |
| **Guardian** | QA & Regulatory | Emerald |
| **Strategist** | Business & IP | Amber |

### Builder Modules (R&D & Engineering)

| Module | Description | AI Intensity | Features |
|--------|-------------|--------------|----------|
| AI Requirements Engineer | Text-to-Spec generation | High | User Needs Generation, Requirement Specs, Traceability Matrix |
| AI Risk Manager | Hazard Analysis & FMEA | High | Hazard Identification, Risk Estimation, Mitigation Suggestions |
| Product Management | BOM, Versions, UDI | Low | Bill of Materials, Version Control, DMR Management |
| Predicate Finder | Competitor 510(k) scraping | High | FDA Database Search, Similarity Analysis, Predicate Reports |
| Clinical Eval Writer | Literature review drafting | High | Literature Search, CER Drafting, Clinical Data Analysis |
| Labeling & IFU Gen | Draft manuals and labels | Standard | Label Generation, IFU Drafting, Symbol Library |
| Software Lifecycle | IEC 62304 for SaMD | Standard | Unit Testing, Bug Tracking, Software BOM |
| Usability Engineering | IEC 62366 protocols | Standard | Formative Testing, Summative Testing, Use Error Analysis |

### Guardian Modules (QA & Regulatory)

| Module | Description | AI Intensity | Features |
|--------|-------------|--------------|----------|
| Supplier Management | Audits, scoring, certificates | Standard | Vendor Qualification, Performance Scoring, Certificate Tracking |
| PMS & Vigilance | Auto-scan FDA/EUDAMED | High | Complaint Monitoring, Adverse Event Tracking, Database Scanning |
| CAPA & NCR | Root cause workflows | Standard | Root Cause Analysis, CAPA Tracking, Effectiveness Review |
| Training Tracker | Employee competency matrix | Low | Training Records, Quiz Generation, Competency Tracking |
| Audit Management | Internal/External audit planning | Low | Audit Scheduling, Finding Tracking, Audit Reports |
| **Change Control** | Impact analysis wizards | Standard | Change Requests, Impact Analysis, Approval Workflows |

### Strategist Modules (Business & IP)

| Module | Description | AI Intensity | Features |
|--------|-------------|--------------|----------|
| IP & Patent Management | Freedom to Operate analysis | High | Patent Portfolio, Filing Deadlines, FTO Analysis |
| Pricing & Reimbursement | CPT/DRG code analyzer | Standard | Code Analysis, ASP Modeling, Coverage Decisions |
| Market Access & Strategy | Competitor analysis updates | Standard | Market Sizing, Competitor Tracking, Strategy Reports |

### Change Control Module - Deep Dive

**Purpose:** Manage product and process changes with regulatory compliance and automated impact analysis.

**Key Workflows:**

1. **Change Request Initiation**
   - User submits change request (design, material, process, supplier)
   - System captures change description, rationale, affected items

2. **Impact Analysis (AI-Assisted)**
   - AI analyzes affected documents, requirements, risks
   - Identifies regulatory submissions that may need updating
   - Suggests approval workflow based on change severity
   - **Consumes ~15 AI credits per analysis**

3. **Approval Workflow**
   - Routes to appropriate stakeholders based on change type
   - Tracks approval status and signatures
   - Maintains audit trail for compliance

4. **Implementation & Verification**
   - Tracks implementation tasks
   - Links to updated documents
   - Closes change with effectiveness review

---

## 4. API Key vs AI Credits Architecture

### Current State

Users can currently add their own API key for AI features (BYOK - Bring Your Own Key).

### Architecture Options

#### Option A: AI Credits Only (Platform-Managed)

```
┌──────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   User   │────>│  Xyreg Platform  │────>│  Platform API   │────>│ LLM Provider│
└──────────┘     └──────────────────┘     │  Key (Shared)   │     │ (OpenAI,    │
                         │                └─────────────────┘     │  Anthropic) │
                         v                                        └─────────────┘
                 ┌──────────────────┐
                 │ Deduct Credits   │
                 │ from User Balance│
                 └──────────────────┘
```

**Pros:**
- Simpler user experience (no API key management)
- Predictable revenue stream (credit packs)
- Better cost control and margin management
- Can offer free tiers with usage limits
- Unified analytics on AI usage

**Cons:**
- Xyreg pays LLM costs upfront
- Need robust credit balance system
- Risk of abuse/overuse

---

#### Option B: User's Own API Key (BYOK)

```
┌──────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   User   │────>│  Xyreg Platform  │────>│  User's Own     │────>│ LLM Provider│
│          │     │                  │     │  API Key        │     │             │
└──────────┘     └──────────────────┘     └─────────────────┘     └─────────────┘
     │                                            │
     │                                            v
     │                                    ┌─────────────────┐
     └───────────────────────────────────>│ User Pays       │
                                          │ Provider Direct │
                                          └─────────────────┘
```

**Pros:**
- No LLM cost to Xyreg
- Power users prefer control over their keys
- No credit limits or tracking needed
- Users see and control their own costs

**Cons:**
- Complex UX (key management, validation, security)
- No recurring revenue from AI usage
- Users exposed to raw API costs (may seem expensive)
- Harder to provide consistent experience

---

#### Option C: Hybrid Model (Recommended)

| Tier | Primary AI Access | Secondary Option |
|------|-------------------|------------------|
| **Genesis** | Credits only (purchase or referral) | None |
| **Core OS** | 500 credits/month included | BYOK available as toggle |
| **Enterprise** | Custom allocation | BYOK, unlimited, or hybrid |

```
┌──────────────────────────────────────────────────────────────┐
│                        AI Request                            │
└──────────────────────────────────────────────────────────────┘
                              │
                              v
                    ┌─────────────────┐
                    │  Check User Tier │
                    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          v                   v                   v
    ┌───────────┐      ┌───────────┐      ┌───────────────┐
    │  Genesis  │      │  Core OS  │      │  Enterprise   │
    └───────────┘      └───────────┘      └───────────────┘
          │                   │                   │
          v                   v                   v
    ┌───────────┐      ┌───────────┐      ┌───────────────┐
    │  Credits  │      │ Has BYOK? │      │ Custom Config │
    │   Only    │      │           │      │               │
    └───────────┘      └───────────┘      └───────────────┘
                              │
                    ┌─────────┴─────────┐
                    v                   v
              ┌───────────┐      ┌───────────┐
              │ Use BYOK  │      │Use Credits│
              │ (no deduct)│      │ (deduct)  │
              └───────────┘      └───────────┘
```

### Implementation Pseudocode

```typescript
interface AIAccessConfig {
  tier: 'genesis' | 'core' | 'enterprise';
  creditsBalance: number;
  hasOwnApiKey: boolean;
  preferOwnKey: boolean;  // User preference toggle
  ownApiKey?: string;
}

async function executeAIAction(
  user: AIAccessConfig,
  action: AIAction
): Promise<AIResult> {

  const creditCost = getActionCreditCost(action);

  // Genesis: Credits only
  if (user.tier === 'genesis') {
    if (user.creditsBalance < creditCost) {
      throw new InsufficientCreditsError();
    }
    await deductCredits(user, creditCost);
    return executeWithPlatformKey(action);
  }

  // Core/Enterprise: Check BYOK preference
  if (user.hasOwnApiKey && user.preferOwnKey) {
    // Use their key - no credit deduction
    return executeWithUserKey(user.ownApiKey, action);
  }

  // Default: Use platform credits
  if (user.creditsBalance < creditCost) {
    // Prompt to buy more or switch to BYOK
    throw new InsufficientCreditsError({
      canUseBYOK: user.tier !== 'genesis'
    });
  }

  await deductCredits(user, creditCost);
  return executeWithPlatformKey(action);
}
```

---

## 5. Implementation Recommendations

### Phase 1: Core Infrastructure

1. **Credit Balance System**
   - Add `ai_credits_balance` to user/company table
   - Create `ai_credit_transactions` table for audit trail
   - Implement credit deduction on AI actions

2. **Action Credit Mapping**
   - Define credit costs for each AI action in config
   - Create middleware to check/deduct credits

3. **UI Updates**
   - Show credit balance in header/dashboard
   - Add low-balance warnings
   - Create credit purchase flow

### Phase 2: Hybrid Model

4. **BYOK Toggle for Core/Enterprise**
   - Add "Use my own API key" toggle in settings
   - Store preference in user profile
   - Route AI requests based on preference

5. **Credit Purchase Integration**
   - Integrate Stripe for booster pack purchases
   - Handle one-time purchases vs subscriptions

### Phase 3: Referral Program

6. **Referral System**
   - Generate unique referral codes/links
   - Track referral conversions
   - Auto-award credits on qualification
   - Handle expiry of referral credits

### Database Schema Additions

```sql
-- Credit balance tracking
ALTER TABLE companies ADD COLUMN ai_credits_balance INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN ai_credits_monthly_allocation INTEGER DEFAULT 0;

-- Credit transaction log
CREATE TABLE ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,  -- positive = add, negative = deduct
  balance_after INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,  -- 'monthly_allocation', 'booster_purchase', 'referral_bonus', 'action_deduction'
  action_type VARCHAR(100),  -- 'fmea_generation', 'label_generation', etc.
  description TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_email VARCHAR(255) NOT NULL,
  referred_user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'signed_up', 'qualified', 'credited'
  credits_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  qualified_at TIMESTAMP,
  credited_at TIMESTAMP
);

-- BYOK settings
ALTER TABLE companies ADD COLUMN byok_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN byok_api_key_encrypted TEXT;
ALTER TABLE companies ADD COLUMN prefer_byok BOOLEAN DEFAULT FALSE;
```

---

## 6. UI Integration Points

### Where to Show AI Credits

| Location | What to Show |
|----------|--------------|
| Header/Navbar | Credit balance badge (e.g., "523 credits") |
| Dashboard | Credit usage chart, remaining credits |
| Before AI Action | "This will use ~15 credits" confirmation |
| After AI Action | "Used 15 credits. 508 remaining" toast |
| Settings Page | Credit history, purchase boosters, BYOK toggle |
| Low Balance | Warning modal with options: Buy more / Use BYOK / Invite friends |

### Settings Page - AI Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  AI Settings                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Balance: 523 credits                               │
│  [████████████░░░░░░] 52% of monthly allocation used        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AI Access Mode                                       │   │
│  │                                                      │   │
│  │ ( ) Use Platform Credits (recommended)               │   │
│  │     500 credits/month included. Buy more as needed.  │   │
│  │                                                      │   │
│  │ ( ) Use My Own API Key                               │   │
│  │     No credit limits. You pay provider directly.     │   │
│  │     [Enter API Key] [Validate]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Purchase Booster Pack - €50 for 1,000 credits]           │
│                                                             │
│  Transaction History                                        │
│  ─────────────────────────────────────────────────────────  │
│  Today      FMEA Generation         -50 credits    523     │
│  Today      Label Generation        -15 credits    573     │
│  Yesterday  Monthly Allocation     +500 credits    588     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Decision Matrix

| Factor | Credits Only | BYOK Only | Hybrid (Recommended) |
|--------|--------------|-----------|----------------------|
| User Experience | Simple | Complex | Flexible |
| Revenue from AI | High | None | Medium |
| LLM Cost to Xyreg | High | None | Medium |
| Power User Appeal | Low | High | High |
| Implementation Effort | Medium | Low | High |
| Genesis Tier Fit | Perfect | N/A | Perfect |
| Enterprise Fit | Limited | Good | Perfect |

---

## 8. Open Questions for Discussion

1. **Credit Rollover:** Should unused monthly credits roll over to next month?
2. **Team vs Individual:** Are credits per-company or per-user?
3. **Rate Limiting:** Should BYOK users have any rate limits?
4. **Model Selection:** Can BYOK users choose different models (GPT-4, Claude, etc.)?
5. **Audit Requirements:** What credit transaction details need 21 CFR Part 11 compliance?

---

## 9. Next Steps Checklist

- [ ] Confirm hybrid model approach with stakeholders
- [ ] Design credit balance UI components
- [ ] Implement database schema changes
- [ ] Build credit deduction middleware
- [ ] Create booster pack purchase flow (Stripe)
- [ ] Implement referral system (Genesis)
- [ ] Add BYOK toggle for Core/Enterprise
- [ ] Create credit usage analytics dashboard
- [ ] Testing and QA
- [ ] Documentation for users

---

*Document Version: 2.0*
*Last Updated: December 2024*
*Status: Draft for Review*
