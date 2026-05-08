/**
 * Genesis Section Config — investor-narrative grouping (5 sections).
 *
 * Mirrors the Gap Analysis pattern: each *Section* renders as a card on the
 * landing list (image 4) and drills into a *Sub-step* detail view (image 3)
 * with an inline Requirement → YOUR RESPONSE form, an AI Fill action, and a
 * sub-step right-rail.
 *
 * Sub-steps reuse the SSOT bindings already declared on `StepConfig.ssotField`
 * in `blueprintStepMapping.ts`. Tier C complex flows (Target Markets, BOM,
 * IP Strategy, Team, rNPV) reference an `openModuleRoute` so the detail view
 * can render an inline summary + "Open full editor" CTA instead of a form.
 */

import {
  Lightbulb,
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import type { StepConfig } from '@/components/product/business-case/blueprintStepMapping';

/** Where the substep's data lives — used for the inline editor or summary. */
export type SsotBinding =
  | {
      kind: 'product-column';
      column: string;
      inputType: 'text' | 'textarea' | 'number';
      placeholder?: string;
      helpText?: string;
      min?: number;
      max?: number;
    }
  | {
      kind: 'product-jsonb';
      column: 'intended_purpose_data' | 'key_technology_characteristics';
      key: string;
      inputType: 'text' | 'textarea';
      placeholder?: string;
      helpText?: string;
    }
  | {
      /** Tier C — no inline form. Render a summary card + CTA. */
      kind: 'open-module';
    };

export interface GenesisSubStepConfig {
  /** Stable ID, e.g. "device-name". Used in URL `?substep=`. */
  id: string;
  title: string;
  /** Short requirement statement shown in the Requirement card. */
  requirement: string;
  /** Bound to existing StepConfig so completion logic stays in one place. */
  completionKey: string;
  /** Where the data lives. */
  binding: SsotBinding;
  /** Always present — used as fallback "Open full editor" link. */
  fallbackRoute: string;
  /** Tier C summary label, e.g. "Markets selected". */
  summaryLabel?: string;
}

export interface GenesisSectionConfig {
  /** Stable ID, e.g. "opportunity". Used in URL `?section=`. */
  id: string;
  /** Display number, e.g. "§1". */
  number: string;
  title: string;
  /** Short tagline shown under the card title. */
  tagline: string;
  icon: LucideIcon;
  subSteps: GenesisSubStepConfig[];
}

/**
 * Helper to find the matching legacy `StepConfig` so we can reuse its
 * `ssotField` definition without duplicating placeholder/helpText strings.
 */
function fromStep(step: StepConfig | undefined): {
  fallbackRoute: string;
  binding?: SsotBinding;
  completionKey: string;
} {
  if (!step) {
    return { fallbackRoute: '', completionKey: '' };
  }
  let binding: SsotBinding | undefined;
  if (step.ssotField) {
    binding = {
      kind: 'product-column',
      column: step.ssotField.column,
      inputType: step.ssotField.inputType,
      placeholder: step.ssotField.placeholder,
      helpText: step.ssotField.helpText,
      min: step.ssotField.min,
      max: step.ssotField.max,
    };
  }
  return {
    fallbackRoute: step.route,
    binding,
    completionKey: step.completionKey,
  };
}

import {
  PHASE_1_STEPS,
  PHASE_2_STEPS,
} from '@/components/product/business-case/blueprintStepMapping';

const findStep = (id: string): StepConfig | undefined =>
  [...PHASE_1_STEPS, ...PHASE_2_STEPS].find((s) => s.id === id);

/**
 * 5-section investor narrative.
 * Phases 3-6 (Design, V&V, Market Submission, Post-Market) are out of scope
 * for Genesis — they live in their respective product modules.
 */
export const GENESIS_SECTIONS: GenesisSectionConfig[] = [
  {
    id: 'opportunity',
    number: '§1',
    title: 'Opportunity & Definition',
    tagline: 'WHAT the device is, WHY it exists, WHO it serves.',
    icon: Lightbulb,
    subSteps: [
      {
        id: 'device-name',
        title: 'Device Name',
        requirement: 'Set your device\'s official commercial name.',
        ...fromStep(findStep('1')),
        binding: {
          kind: 'product-column',
          column: 'name',
          inputType: 'text',
          placeholder: 'e.g. Ankle Trainer',
          helpText: 'Your device\'s official commercial name.',
        },
      } as GenesisSubStepConfig,
      {
        id: 'trl',
        title: 'Technical Readiness Level',
        requirement:
          'Assess your technology maturity from proof of concept (TRL 3) to market-ready (TRL 8).',
        ...fromStep(findStep('2')),
        binding: {
          kind: 'product-column',
          column: 'trl_level',
          inputType: 'number',
          min: 1,
          max: 9,
          placeholder: '3-8',
          helpText: 'TRL 3 = proof of concept. TRL 8 = market-ready.',
        },
      } as GenesisSubStepConfig,
      {
        id: 'description',
        title: 'Device Description',
        requirement:
          'Describe WHAT the device is — physical form, key components, and the core technology that enables it.',
        ...fromStep(findStep('6')),
        binding: {
          kind: 'product-column',
          column: 'description',
          inputType: 'textarea',
          placeholder:
            'A wearable rehabilitation device that uses AI-driven motion sensing to…',
          helpText: 'Aim for 2–4 sentences a non-clinical investor can follow.',
        },
      } as GenesisSubStepConfig,
      {
        id: 'intended-use',
        title: 'Intended Use',
        requirement:
          'State the unmet clinical need and the specific use the device is intended for.',
        ...fromStep(findStep('4')),
        binding: {
          kind: 'product-jsonb',
          column: 'intended_purpose_data',
          key: 'clinicalPurpose',
          inputType: 'textarea',
          placeholder:
            'For adult patients recovering from ankle injury, the device…',
          helpText: 'Single sentence. Who, what, why, where.',
        },
      },
      {
        id: 'value-proposition',
        title: 'Value Proposition',
        requirement:
          'State the measurable benefit — outcome improvement, time saved, or cost reduced.',
        completionKey: 'value_proposition',
        fallbackRoute: 'device-information?tab=purpose&subtab=statement',
        binding: {
          kind: 'product-jsonb',
          column: 'intended_purpose_data',
          key: 'valueProposition',
          inputType: 'textarea',
          placeholder:
            'Reduces rehabilitation time by 30% versus standard physiotherapy…',
          helpText: 'Quantify when you can. Investors weight measurable claims heavily.',
        },
      },
    ],
  },
  {
    id: 'market',
    number: '§2',
    title: 'Market & Stakeholders',
    tagline: 'The opportunity size and who pays, prescribes, and uses it.',
    icon: Users,
    subSteps: [
      {
        id: 'target-markets',
        title: 'Target Markets',
        requirement: 'Choose the geographic markets you plan to launch in.',
        ...fromStep(findStep('8')),
        binding: { kind: 'open-module' },
        summaryLabel: 'markets selected',
      } as GenesisSubStepConfig,
      {
        id: 'user-profile',
        title: 'User Profile',
        requirement:
          'Define the target patient population and the use environment.',
        ...fromStep(findStep('12')),
        binding: { kind: 'open-module' },
        summaryLabel: 'population & environment defined',
      } as GenesisSubStepConfig,
      {
        id: 'economic-buyer',
        title: 'Economic Buyer',
        requirement: 'Identify who controls the budget and the procurement path.',
        ...fromStep(findStep('13')),
        binding: { kind: 'open-module' },
        summaryLabel: 'buyer profile complete',
      } as GenesisSubStepConfig,
      {
        id: 'market-sizing',
        title: 'Market Sizing (TAM / SAM / SOM)',
        requirement: 'Define the addressable, serviceable, and obtainable market.',
        ...fromStep(findStep('10')),
        binding: { kind: 'open-module' },
        summaryLabel: 'TAM / SAM / SOM',
      } as GenesisSubStepConfig,
      {
        id: 'competitor-analysis',
        title: 'Competitor Analysis',
        requirement: 'Map current solutions and what makes your approach different.',
        ...fromStep(findStep('11')),
        binding: { kind: 'open-module' },
        summaryLabel: 'competitors mapped',
      } as GenesisSubStepConfig,
    ],
  },
  {
    id: 'business-model',
    number: '§3',
    title: 'Business Model',
    tagline: 'How the device becomes revenue.',
    icon: TrendingUp,
    subSteps: [
      {
        id: 'strategic-partners',
        title: 'Strategic Partners',
        requirement:
          'Identify distribution, clinical, and regulatory partners per market.',
        ...fromStep(findStep('14')),
        binding: { kind: 'open-module' },
        summaryLabel: 'partners identified',
      } as GenesisSubStepConfig,
      {
        id: 'reimbursement',
        title: 'Reimbursement & Market Access',
        requirement: 'Reimbursement strategy, coding pathway, and payer plan.',
        ...fromStep(findStep('16')),
        binding: { kind: 'open-module' },
        summaryLabel: 'reimbursement plan',
      } as GenesisSubStepConfig,
      {
        id: 'health-economics',
        title: 'Health Economic Model (HEOR)',
        requirement: 'Cost savings, QALY gains, or budget impact for the buyer.',
        ...fromStep(findStep('15')),
        binding: { kind: 'open-module' },
        summaryLabel: 'HEOR model',
      } as GenesisSubStepConfig,
    ],
  },
  {
    id: 'financials',
    number: '§4',
    title: 'Financials',
    tagline: 'Capital required, allocation, and projected return.',
    icon: DollarSign,
    subSteps: [
      {
        id: 'use-of-proceeds',
        title: 'Use of Proceeds',
        requirement:
          'Capital required and allocation across R&D, regulatory, team, and commercial.',
        ...fromStep(findStep('21')),
        binding: { kind: 'open-module' },
        summaryLabel: 'budget allocated',
      } as GenesisSubStepConfig,
      {
        id: 'revenue-forecast',
        title: 'Revenue Forecast (rNPV)',
        requirement: 'Projected sales, pricing, and 5-year risk-adjusted NPV.',
        ...fromStep(findStep('22')),
        binding: { kind: 'open-module' },
        summaryLabel: 'rNPV model built',
      } as GenesisSubStepConfig,
      {
        id: 'team-composition',
        title: 'Team Composition',
        requirement: 'Key roles, current team, and hiring priorities.',
        ...fromStep(findStep('23')),
        binding: { kind: 'open-module' },
        summaryLabel: 'team members listed',
      } as GenesisSubStepConfig,
    ],
  },
  {
    id: 'strategy-ip',
    number: '§5',
    title: 'Strategy & IP',
    tagline: 'Defensibility, regulatory pathway, and risk posture.',
    icon: Shield,
    subSteps: [
      {
        id: 'system-architecture',
        title: 'System Architecture',
        requirement:
          'Pure Hardware, Hardware + Software (SiMD), or Software as a Medical Device (SaMD).',
        ...fromStep(findStep('3')),
        binding: { kind: 'open-module' },
        summaryLabel: 'architecture defined',
      } as GenesisSubStepConfig,
      {
        id: 'device-type',
        title: 'Device Classification Inputs',
        requirement:
          'Invasiveness, active status, anatomical location, and contact duration.',
        ...fromStep(findStep('5')),
        binding: { kind: 'open-module' },
        summaryLabel: 'characteristics set',
      } as GenesisSubStepConfig,
      {
        id: 'regulatory-pathway',
        title: 'Regulatory Pathway',
        requirement: 'Device class per market (EU MDR, FDA).',
        ...fromStep(findStep('9')),
        binding: { kind: 'open-module' },
        summaryLabel: 'classification complete',
      } as GenesisSubStepConfig,
      {
        id: 'ip-strategy',
        title: 'IP & Freedom to Operate',
        requirement: 'Patents, trade secrets, ownership, and FTO assessment.',
        ...fromStep(findStep('19')),
        binding: { kind: 'open-module' },
        summaryLabel: 'IP strategy in place',
      } as GenesisSubStepConfig,
      {
        id: 'risk-assessment',
        title: 'Preliminary Risk Assessment',
        requirement: 'Top hazards per ISO 14971 and intended controls.',
        ...fromStep(findStep('17')),
        binding: { kind: 'open-module' },
        summaryLabel: 'risks identified',
      } as GenesisSubStepConfig,
      {
        id: 'clinical-evidence',
        title: 'Clinical Evidence Strategy',
        requirement: 'Validation plan, study design, and evidence requirements.',
        ...fromStep(findStep('18')),
        binding: { kind: 'open-module' },
        summaryLabel: 'evidence plan drafted',
      } as GenesisSubStepConfig,
    ],
  },
];

export const GENESIS_SECTION_BY_ID: Record<string, GenesisSectionConfig> =
  Object.fromEntries(GENESIS_SECTIONS.map((s) => [s.id, s]));