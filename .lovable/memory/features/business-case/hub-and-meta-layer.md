---
name: Business Case Hub & Venture Blueprint Meta-Layer
description: Business Case landing uses a hub (?tab=overview) with Venture Blueprint hero strip + Portfolio-style specialist cards; specialist tabs show a "Part of Venture Blueprint" badge
type: feature
---

Business Case (`/app/product/:productId/business-case`) IA:

- **`?tab=overview`** = landing hub. Renders `BusinessCaseHub` (gold Venture Blueprint hero + Portfolio-style card grid for the 10 specialist areas).
- **`?tab=venture-blueprint`** = the guided wizard (existing `VentureBlueprint` component). It is the meta-layer — fields it edits write to the same SSOT as the specialist tabs.
- **`?tab=<specialist>`** = direct deep-link to rNPV, Reimbursement, Team, Market Analysis, Use of Proceeds, IP Strategy, Business Canvas, Strategic Horizon, GTM, Pricing. Each tab still renders its original page; a `BlueprintStepBadge` is mounted at the top to communicate that the tab is one step of the blueprint.
- **XyReg Genesis is phased out**: `?tab=genesis` and `?tab=xyreg-genesis` redirect (replace) to `?tab=venture-blueprint`. The "XyReg Genesis" sidebar entry is removed; replaced by an "Overview" entry.
- Hero strip shows two progress counters: investor-essentials (derived from `INVESTOR_ESSENTIAL_TOTAL`) and full plan (full readiness checklist), plus a track toggle that writes `?track=investor|full` (URL SSOT).

Files:
- `src/components/product/business-case/BusinessCaseHub.tsx` — hub layout + `HUB_CARD_DEFS` defaults
- `src/components/product/business-case/BlueprintStepBadge.tsx` — the "Part of Venture Blueprint" pill
- `src/pages/BusinessCasePage.tsx` — wires the hub to `?tab=overview`, mounts badges in each specialist `TabsContent`, redirects legacy genesis tabs
- `src/components/layout/sidebar/BusinessCaseGroup.tsx` — sidebar landing now points at overview, Genesis entry removed

Cards are color-coded by the 5-color domain system (Gold = Business/Strategy, Blue = Operations, Teal = Design/Risk).
