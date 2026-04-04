import { ModuleContent } from '@/types/onboarding';

export const businessAnalysisModule: ModuleContent = {
  id: 'business-analysis',
  translationKey: 'businessAnalysis',
  title: 'Business Analysis & NPV',
  category: 'Business & Analysis',
  estimatedTime: 30,
  difficulty: 'advanced',
  roles: ['admin', 'company_admin', 'consultant'],
  
  overview: {
    description: 'Business Analysis tools help you evaluate the financial viability of medical device projects through NPV calculations, market analysis, and regulatory cost modeling.',
    whoUsesIt: 'Business Development, Product Managers, Finance teams, and Executives making go/no-go decisions on medical device projects.',
    keyBenefits: [
      'NPV and IRR calculations for project evaluation',
      'Multi-market cost and revenue modeling',
      'Regulatory cost intelligence by market',
      'Scenario planning (conservative, typical, aggressive)',
      'Break-even analysis and sensitivity testing'
    ],
    prerequisites: ['Product created', 'Market strategy defined', 'Basic financial analysis knowledge']
  },
  
  steps: [
    {
      id: 'npv-basics',
      title: 'Understanding NPV Analysis',
      content: `Net Present Value (NPV) analysis helps determine if a medical device project is financially viable.

<strong>NPV Formula:</strong>
NPV = Sum of (Cash Flow / (1 + Discount Rate)^Year) - Initial Investment

<strong>Key Components:</strong>

<strong>Revenue Streams:</strong>
- Unit sales projections by market
- Pricing strategy
- Market penetration assumptions
- Reimbursement considerations
- Service and maintenance revenue

<strong>Cost Categories:</strong>
- Development costs (R&D, design, testing)
- Regulatory costs (submissions, fees, consultants)
- Clinical trial expenses
- Manufacturing setup and COGS
- Marketing and sales
- Post-market surveillance

<strong>Time Value Considerations:</strong>
- Discount rate (typically 8-15% for med devices)
- Project timeline (typically 5-10 years)
- Cash flow timing
- Regulatory approval delays

<strong>Decision Criteria:</strong>
- NPV > 0: Project adds value, proceed
- NPV < 0: Project destroys value, reconsider
- NPV = 0: Breakeven, marginal project

<strong>Internal Rate of Return (IRR):</strong>
- Discount rate where NPV = 0
- Higher IRR = more attractive project
- Compare to company's hurdle rate
- Typical med device IRR: 15-30%`,
      tips: [
        'Use conservative revenue estimates to avoid over-optimism',
        'Include all hidden costs (regulatory consultants, clinical trials)',
        'Model multiple scenarios (best/likely/worst case)',
        'Update NPV regularly as project progresses'
      ],
      commonMistakes: [
        'Underestimating regulatory costs and timelines',
        'Over-optimistic market penetration rates',
        'Forgetting post-market surveillance costs',
        'Not factoring in competitive responses'
      ]
    },
    {
      id: 'smart-cost-intelligence',
      title: 'Smart Cost Intelligence System',
      content: `AI-powered cost estimation for accurate regulatory cost modeling by market.

<strong>How It Works:</strong>

<strong>1. Market Selection</strong>
- Choose target markets (US, EU, Japan, etc.)
- System loads market-specific cost templates
- Real-time currency conversion
- Regulatory framework requirements

<strong>2. Device Complexity Analysis</strong>
- Classification determines cost multipliers:
  - Class I: 1.0x baseline
  - Class II: 1.2-1.5x baseline
  - Class III: 1.8-2.5x baseline
  - IVD: 1.1-2.0x (risk-based)
  - SaMD: 1.0-1.8x (risk-based)

<strong>3. Cost Categories:</strong>

<strong>Regulatory Submission</strong>
- Application fees (fixed per market)
- Consultant fees (if needed)
- Translation costs
- Technical file preparation

<strong>Clinical Evidence</strong>
- Literature review
- Clinical investigation design
- Study conduct costs
- CRO fees
- Site management

<strong>Certification & Compliance</strong>
- Notified Body fees (EU)
- Annual surveillance fees
- QMS certification
- Testing and validation

<strong>4. Scenario Planning</strong>
- Conservative: +15-25% buffer
- Typical: Market standard costs
- Aggressive: -10-20% optimized

<strong>5. Smart Adjustments</strong>
- Inflation modeling over timeline
- Currency risk factors
- Market-specific economic factors
- Historical data validation`,
      tips: [
        'Start with typical scenario, then model conservative',
        'Use market-specific data rather than converted costs',
        'Factor in multi-year inflation for long timelines',
        'Validate estimates with actual market data when possible'
      ]
    },
    {
      id: 'scenario-modeling',
      title: 'Multi-Scenario Planning',
      content: `Model different business scenarios to understand risks and opportunities.

<strong>Scenario Types:</strong>

<strong>Base Case (Typical)</strong>
- Most likely outcome
- Standard market assumptions
- Normal regulatory timeline
- Expected competitive landscape

<strong>Optimistic Case (Aggressive)</strong>
- Best possible outcome
- Faster regulatory approval
- Higher market penetration
- Lower competitive pressure
- Uses: Stretch targets, maximum opportunity

<strong>Pessimistic Case (Conservative)</strong>
- Challenging outcome
- Regulatory delays
- Lower adoption rates
- Higher competition
- Uses: Risk assessment, minimum viable return

<strong>Sensitivity Analysis:</strong>
Test impact of changing key variables:
- ±20% in unit sales
- ±6 months in regulatory timeline
- ±15% in pricing
- ±25% in development costs
- ±2% in discount rate

<strong>Break-Even Analysis:</strong>
- Units to sell to recover investment
- Time to profitability
- Critical success factors
- Decision trees for go/no-go

<strong>Portfolio Analysis:</strong>
- Compare multiple projects
- Resource allocation decisions
- Risk-return optimization
- Strategic prioritization`,
      tips: [
        'Always model at least 3 scenarios',
        'Weight scenarios by probability for expected value',
        'Update scenarios as market data emerges',
        'Use sensitivity analysis to identify critical assumptions'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'EU & US Market Launch NPV Analysis',
      description: 'Class II device with 5-year market life',
      steps: [
        'Define project: Class II infusion pump, EU + US markets',
        'Input costs: €800K EU MDR, $650K FDA 510(k)',
        'Clinical costs: €400K EU study, $300K US additional data',
        'Manufacturing: €2M setup, €120 COGS per unit',
        'Revenue: 10,000 units/year, €750 price, 30% gross margin',
        'Timeline: Year 1-2 development, Year 3-7 sales',
        'Discount rate: 12%',
        'Results: NPV €2.1M, IRR 24%, Payback 3.5 years',
        'Sensitivity: NPV ranges €800K-€3.8M across scenarios',
        'Decision: Proceed with project'
      ],
      expectedOutcome: 'Data-driven go/no-go decision with clear financial case'
    }
  ],
  
  bestPractices: [
    'Model costs and revenues separately by market',
    'Use Smart Cost Intelligence for regulatory cost accuracy',
    'Always include multiple scenarios (at least 3)',
    'Update NPV quarterly as project progresses',
    'Factor in time value of money with appropriate discount rate',
    'Include all costs: R&D, regulatory, clinical, manufacturing, marketing',
    'Be conservative with revenue projections',
    'Model regulatory timeline delays (add 6-12 month buffer)',
    'Perform sensitivity analysis on key assumptions',
    'Compare IRR to company hurdle rate before proceeding',
    'Document all assumptions for audit trail',
    'Use NPV for go/no-go gates at key milestones'
  ],
  
  relatedModules: [
    'product-management',
    'compliance-gap-analysis',
    'clinical-trials',
    'portfolio-management'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'B → N', action: 'New NPV analysis', context: 'From business tab' },
      { key: 'B → S', action: 'Run scenario comparison' }
    ],
    commonTasks: [
      {
        task: 'Create NPV analysis',
        steps: ['Business tab', 'New Analysis', 'Input costs & revenue', 'Set timeline', 'Calculate NPV'],
        estimatedTime: '30-60 minutes'
      }
    ],
    cheatSheet: [
      {
        title: 'NPV Decision',
        description: 'NPV > 0 = Proceed | NPV < 0 = Reconsider | IRR > Hurdle = Attractive'
      },
      {
        title: 'Typical Discount Rates',
        description: 'Established company: 8-12% | Startup: 15-25% | High risk: 20-30%'
      }
    ]
  }
};
