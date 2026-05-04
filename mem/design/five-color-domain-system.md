---
name: Five-color domain system
description: Canonical XyReg color system mapping every module/cluster to one of 5 buckets (Gold/Blue/Teal/Green/Purple) with explicit rationale.
type: design
---
## Five buckets (canonical)

| Bucket | Color | Tailwind | Examples | Why |
|---|---|---|---|---|
| Business / Strategy | Gold/Amber | `amber-500` | Business Case, Commercial Intelligence, Portfolio Mgmt, IP | The "Value" bucket — investment, runway, valuation |
| Operations / Execution | Blue | `blue-500` | Operations, Supply Chain (SC), Manufacturing (MF), Production, Enterprise Roadmap, HR, Development Lifecycle (Milestones) | The "Doing" bucket — physical/timeline execution, the factory and sourcing |
| Design & Risk / Science | **Teal** | `teal-500` | Design & Development (DE), Software (SW), Risk Mgmt (RM), V&V, Usability, BOM, Device Definition, Architecture | The "Thinking" bucket — validated design; teal = blue+green so safety is baked in |
| Quality / Guardrail | Green/Emerald | `emerald-500` | Quality Governance, QA cluster, Customer Service, PMS, Audit Log | The "State of Control" bucket — QMS governance |
| Clinical & Regulatory / Evidence | Purple | `purple-500` | Clinical Trials, Regulatory Affairs, Enterprise Compliance, Regulatory Submissions, Compliance Instances | The "Evidence" bucket — human data + external regulatory bodies |

## Hard rules

- **Supply Chain = Operations Blue**, NOT Strategy Gold. SC is execution (sourcing, logistics), not valuation.
- **Risk Management = Teal**, NOT Purple. Safety lives inside the engineering process; teal signals "safety baked into design."
- **Development Lifecycle (phase tracking) = Blue**. It's execution timeline, not the design itself.
- **BOM = Teal**. BOM is the engineered material definition (Design output), not Operations sourcing.
- Source of truth: `src/config/domainColors.ts` (DOMAIN_TOKENS map).

## Surfaces using this system

- Sidebar groups (`SidebarContextualMenu.tsx` left-border stripes + group icon tints)
- Document grouped view clusters (`functionalClusters.ts`)
- Mission Control rings / journey strips (when updated)
