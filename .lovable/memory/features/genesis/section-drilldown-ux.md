---
name: Genesis Section Drilldown UX
description: Genesis uses Gap-Analysis-style section cards + detail drilldown, not a flat phase list
type: feature
---
Genesis (Venture Blueprint) renders as **5 investor-narrative section cards** (Opportunity & Definition, Market & Stakeholders, Business Model, Financials, Strategy & IP), modeled visually on the Gap Analysis section list.

Clicking a card drills into a detail view (URL: `?genesisSection=<id>&genesisSubstep=<id>`) with:
- Requirement card (top)
- YOUR RESPONSE card with inline SSOT editor (text/textarea/number) writing directly to `products.*` columns or `intended_purpose_data` / `key_technology_characteristics` JSONB keys
- AI Fill button (placeholder for now)
- Right-rail with sub-step list + completion ticks
- Bottom step navigator (prev/next pill)

Tier C complex steps (Target Markets, BOM, IP Strategy, Team, rNPV, Reimbursement, etc.) use `binding.kind = 'open-module'` — render a status badge + "Open full editor" CTA that navigates to the dedicated module with `returnTo=venture-blueprint`.

SSOT: `src/config/genesisSections.ts`. Detail view: `src/components/product/business-case/genesis/GenesisSectionDetail.tsx`. Editor: `GenesisSsotEditor.tsx` (handles both plain columns and JSONB keys).
