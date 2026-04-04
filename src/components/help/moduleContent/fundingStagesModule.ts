import { ModuleContent } from '@/types/onboarding';

export const fundingStagesModule: ModuleContent = {
  id: 'funding-stages',
  translationKey: 'fundingStages',
  title: 'MedTech Funding Stages Guide',
  category: 'Business & Analysis',
  estimatedTime: 25,
  difficulty: 'beginner',
  roles: ['Founder', 'CEO', 'CFO', 'Business Development'],
  overview: {
    description: 'Comprehensive guide to startup funding stages with MedTech-specific context, investor expectations, and regulatory milestone alignment.',
    whoUsesIt: 'Founders, executives, and business development professionals seeking investment for medical device ventures.',
    keyBenefits: [
      'Understand funding stage expectations',
      'Align regulatory milestones with fundraising',
      'Know typical amounts and dilution at each stage',
      'Identify appropriate investor types'
    ],
    prerequisites: ['Basic understanding of startup equity']
  },
  steps: [
    {
      id: 'overview',
      title: 'Understanding Funding Stages',
      content: `Medical device startups progress through funding stages aligned with regulatory milestones. Unlike software, MedTech has regulatory gates, clinical evidence requirements, and longer timelines (3-7 years). Key stages: Pre-Seed (€50K-500K) for proof of concept, Seed (€500K-3M) for design freeze, Series A (€3M-15M) for clinical trials, Series B (€15M-50M) for commercial launch. Non-dilutive options include grants (Horizon Europe, SBIR), venture debt, and strategic partnerships.`,
      tips: ['Align funding with regulatory milestones', 'Consider non-dilutive before dilutive', 'Higher device class = more capital needed']
    },
    {
      id: 'early-stage',
      title: 'Pre-Seed & Seed Funding',
      content: `Pre-Seed (€50K-500K): Earliest capital for technical feasibility, IP protection, team building, and market validation. Investors: Friends & family, angels, accelerators. Seed (€500K-3M): First institutional round for design development, bench testing, regulatory strategy, and team expansion. Investors: Seed VCs, strategic angels, corporate venture arms. At seed, investors want: proof of concept, regulatory pathway, IP strategy, clinical advisors. Class-specific needs: Class I (€500K-1M), Class II 510k (€1-2M), Class III (€2-3M).`,
      tips: ['Pre-seed proves viability with minimal capital', 'Clinical advisors are critical at seed', 'Higher class = larger seed round']
    },
    {
      id: 'growth-stage',
      title: 'Series A & Series B',
      content: `Series A (€3M-15M): Major growth round funding clinical trials, regulatory submissions, manufacturing scale-up, and commercial preparation. Investors evaluate clinical data, regulatory de-risking, commercial opportunity, team, and IP moat. Series B (€15M-50M): Expansion after regulatory clearance for commercial launch, sales team, international expansion, and reimbursement. By Series B, investors want regulatory approval, commercial proof points, unit economics, and clear exit path.`,
      tips: ['Series A funds trials and submission', 'Series B requires commercial traction', 'Strategic investors often enter as M&A precursor']
    },
    {
      id: 'bridge-alternative',
      title: 'Bridge & Alternative Funding',
      content: `Bridge Rounds (€500K-5M): Short-term financing between rounds via convertible notes or SAFEs. Use when awaiting regulatory decision or clinical readout. Non-Dilutive Options: Government grants (Horizon Europe €2-5M, EIC up to €2.5M grant, NIH SBIR), venture debt (after Series A, 10-15% interest), and strategic partnerships (R&D, distribution, licensing). Benefits: no dilution, investor validation. Challenges: long timelines, reporting requirements.`,
      tips: ['Bridge needs clear milestone purpose', 'Grants extend runway without dilution', 'Venture debt works post-Series A']
    },
    {
      id: 'investor-expectations',
      title: 'What Investors Expect',
      content: `Pre-Seed: Compelling team, unmet clinical need, proof of concept, initial IP. Seed: Working prototype, design freeze, regulatory pathway, clinical advisors. Series A: Complete preclinical package, pre-submission feedback, clinical trial design, manufacturing partner. Series B: Regulatory approval, commercial sales, reimbursement wins, scalable model. Red flags at any stage: unclear regulatory pathway, unprotected IP, team conflicts, unrealistic timelines.`,
      tips: ['Expectations escalate each round', 'Regulatory de-risking is key', 'Team gaps must be acknowledged']
    },
    {
      id: 'determining-needs',
      title: 'Determining Your Funding Need',
      content: `Golden rule: Raise enough to reach a value-inflecting milestone. Steps: (1) Identify next major milestone, (2) Build bottom-up budget (R&D 30-40%, Clinical/Reg 20-30%, Manufacturing 10-20%, G&A 15-25%), (3) Add 30-50% buffer for delays, (4) Validate against benchmarks. Most VCs want 18-24 months runway. Class I: Pre-Seed €100-300K, Seed €500K-1M. Class II: Pre-Seed €200-400K, Seed €1-2M, Series A €5-10M. Class III: Pre-Seed €300-500K, Seed €2-3M, Series A €10-20M, Series B €30-50M.`,
      tips: ['Raise to value-inflecting milestone', '18-24 months is standard runway', 'Add 30-50% buffer for MedTech delays']
    }
  ],
  examples: [
    {
      scenario: 'Class II Orthopedic Device Journey',
      description: 'Surgical instrument from concept to acquisition in 4 years.',
      steps: ['Pre-Seed €250K: Concept validation, patent, prototype', 'Seed €1.5M: Design freeze, biocompat, 510(k) submission', 'Series A €6M: FDA clearance, manufacturing, sales team', 'Result: Acquired for €45M']
    },
    {
      scenario: 'Class III Cardiac Device with PMA',
      description: 'Heart valve requiring pivotal clinical trial.',
      steps: ['Pre-Seed €400K: University spinout + angels', 'Seed €3M: Design and preclinical', 'Series A €18M: Pivotal trial (180 patients)', 'Bridge €5M: Extended enrollment', 'Series B €40M: Approval + launch']
    },
    {
      scenario: 'Grant-Funded Diagnostics Path',
      description: 'Point-of-care diagnostic using non-dilutive funding.',
      steps: ['Pre-Seed: Innovate UK £150K grant', 'Seed: Horizon Europe EIC €2.1M grant', 'Series A: Only €4M equity needed', 'Result: 80% founder ownership at Series A']
    }
  ],
  bestPractices: [
    'Match funding stage to regulatory phase for maximum valuation impact',
    'Build 18-24 month runway - standard VC expectation',
    'Factor in regulatory delays (510k: 6-12mo, CE MDR: 12-18mo)',
    'Consider non-dilutive before dilutive options',
    'Know your target investor\'s typical check size',
    'Plan for class-appropriate capital from the start'
  ],
  relatedModules: ['business-analysis', 'viability-scorecard']
};
