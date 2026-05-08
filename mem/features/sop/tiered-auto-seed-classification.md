---
name: SOP Tiered Auto-Seed Classification
description: 31 Tier A SOPs (incl. SOP-015 RM, SOP-019 ID/Trace/UDI, SOP-045 UDI Mgmt) auto-created at company onboarding; Tier B/C manual
type: feature
---
Three-tier division of the 51 Xyreg SOPs in `src/constants/sopAutoSeedTiers.ts`.

- **Tier A (31)** — Universal QMS boilerplate, auto-seeded at onboarding. Includes SOP-001/002/003/004/005-009/011/012/**015**/016/**019**/021/022/023/024/025/028/030/031/032/033/034/035/037/038/042/**045**/050.
- **Tier B (12)** — Pathway-conditional, surfaced via "Seed Tier B" button when triggers fire (manufacturing, eu_mdr, eu_clinical, physical_product).
- **Tier C (8)** — Device-specific, never auto-seeded.

SOP-015 (Risk Mgmt), SOP-019 (ID/Trace/UDI), SOP-045 (UDI Mgmt) were promoted from Tier B `'always'` triggers to Tier A on 2026-05-07 because they are mandatory for all medical devices regardless of pathway.
