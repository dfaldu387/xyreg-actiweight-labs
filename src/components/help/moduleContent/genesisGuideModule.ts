import { ModuleContent } from '@/types/onboarding';

export const genesisGuideModule: ModuleContent = {
  id: 'genesis-guide',
  translationKey: 'genesisGuide',
  title: 'Genesis Step-by-Step Guide',
  category: 'Core Platform',
  estimatedTime: 30,
  difficulty: 'beginner',
  roles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],

  overview: {
    description: 'A complete walkthrough of the Genesis 26-step checklist — from defining your device to sharing your business case with investors and the marketplace.',
    whoUsesIt: 'MedTech founders, startup teams, and early-stage product managers use Genesis to build an investor-ready business case for a single medical device.',
    keyBenefits: [
      'Structured 26-step checklist covers every aspect of your business case',
      'Progress tracking shows exactly what is complete and what remains',
      'Share directly with investors via a secure link or list on the Deal Flow Marketplace',
      'Free to use on the Genesis plan (1 device, 1 market)'
    ],
    prerequisites: ['Create an account and sign in', 'Have a medical device concept ready']
  },

  steps: [
    {
      id: 'getting-started',
      title: 'Getting Started with Genesis',
      content: `Learn how to set up your company, create your first device, and navigate to the Genesis home screen.

<strong>Initial Setup:</strong>
1. After signing up, you will be guided to create your <strong>Company</strong> — enter your company name and basic details
2. Next, create your first <strong>Device</strong> — this is the product your business case will be built around
3. Once your device is created, navigate to the <strong>Business Case</strong> section from the sidebar

<strong>The Genesis Home Screen:</strong>
- The left sidebar shows your <strong>26-step checklist</strong> organized into four parts
- Each step has a status indicator: incomplete, in-progress, or complete
- Click any step to jump directly to its input area
- Your overall progress percentage is displayed at the top

<strong>How Steps Work:</strong>
- Click a step in the sidebar to open its input area
- Fill in the required information and save
- The step automatically marks as complete when the required data is saved
- You can revisit and update any step at any time`,
      tips: [
        'You can complete steps in any order, but the numbered sequence is recommended',
        'Use the progress indicator to track what remains',
        'All data auto-saves — you will not lose your work'
      ]
    },
    {
      id: 'part-1-foundation',
      title: 'Part I: Product & Technology Foundation (Steps 1–7)',
      content: `Define your device and its technical foundation.

<strong>Step 1 — Device Name:</strong>
Enter the official name of your medical device. This appears on your investor-facing business case.

<strong>Step 2 — Device Description:</strong>
Write a clear, concise description of what your device does and the problem it solves.

<strong>Step 3 — Upload Device Image:</strong>
Upload a product image, render, or prototype photo. This is displayed prominently in your business case.

<strong>Step 4 — Intended Use & Value Proposition:</strong>
Document the intended purpose of your device and articulate its value proposition — why it matters and what differentiates it.

<strong>Step 5 — Device Type:</strong>
Select the type of device (e.g., new product). Genesis users work with the "New Device" type.

<strong>Step 6 — TRL & System Architecture:</strong>
Set your Technology Readiness Level (TRL 1–9) and document key technology characteristics and system architecture details.

<strong>Step 7 — Classify Device:</strong>
Use the classification wizard to determine your device's regulatory class (e.g., EU MDR Class I/IIa/IIb/III or FDA Class I/II/III).`,
      tips: [
        'Keep descriptions concise but informative — investors scan quickly',
        'A good device image significantly improves first impressions',
        'Be honest about your TRL — investors value transparency'
      ],
      commonMistakes: [
        'Writing overly technical descriptions instead of clear value statements',
        'Skipping the device image upload',
        'Not completing classification early enough'
      ]
    },
    {
      id: 'part-2-market',
      title: 'Part II: Market & Stakeholder Analysis (Steps 8–12)',
      content: `Identify your users, buyers, and market opportunity.

<strong>Step 8 — Profile User:</strong>
Define the primary user of your device (e.g., surgeon, nurse, patient). Include demographics, needs, and pain points.

<strong>Step 9 — Profile Economic Buyer:</strong>
Identify who makes the purchasing decision — this is often different from the end user. Document their priorities and budget considerations.

<strong>Step 10 — Select Target Markets:</strong>
Choose your target geographic market. Genesis allows one market to keep your analysis focused.

<strong>Step 11 — Market Sizing:</strong>
Estimate your Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM).

<strong>Step 12 — Competitor Analysis:</strong>
Map your competitive landscape. Identify direct and indirect competitors, their strengths, weaknesses, and your competitive advantages.`,
      tips: [
        'Investors look for clear user–buyer distinction',
        'Use credible sources for market sizing (published reports, industry data)',
        'Be specific about competitive differentiation — generic claims weaken your case'
      ]
    },
    {
      id: 'part-3-strategy',
      title: 'Part III: Strategy & Evidence (Steps 13–18)',
      content: `Build your strategic and evidence framework.

<strong>Step 13 — IP Strategy & Freedom to Operate:</strong>
Outline your intellectual property strategy — patents filed, planned, or freedom-to-operate analysis.

<strong>Step 14 — Clinical Evidence Strategy:</strong>
Define what clinical evidence you need and your plan to generate it (trials, literature reviews, equivalence).

<strong>Step 15 — Health Economic Model (HEOR):</strong>
Build your health economics and outcomes research model to demonstrate cost-effectiveness.

<strong>Step 16 — Reimbursement & Market Access:</strong>
Document your reimbursement strategy — coding, coverage, and payment pathways for your target market.

<strong>Step 17 — Revenue Forecast:</strong>
Create revenue projections based on your market sizing, pricing strategy, and go-to-market timeline.

<strong>Step 18 — Go-to-Market Strategy:</strong>
Define how you will bring your device to market — distribution channels, sales approach, partnerships, and launch timeline.`,
      tips: [
        'Even early-stage companies should have an IP awareness strategy',
        'Clinical evidence planning shows regulatory maturity to investors',
        'Revenue forecasts should be conservative and well-justified'
      ],
      commonMistakes: [
        'Ignoring reimbursement until too late in the process',
        'Overly optimistic revenue projections without supporting assumptions',
        'Vague go-to-market plans that lack specific milestones'
      ]
    },
    {
      id: 'part-5-execution',
      title: 'Part V: Operational Execution (Steps 19–26)',
      content: `Complete your operational plan and strategic synthesis.

<strong>Step 19 — Strategic Partners:</strong>
Identify key partnerships (distributors, contract manufacturers, clinical sites, regulatory consultants).

<strong>Step 20 — Manufacturing & Supply Chain:</strong>
Outline your manufacturing approach — in-house vs. contract, supply chain considerations, and scalability plans.

<strong>Step 21 — Team Composition:</strong>
Present your team — key members, roles, expertise, and any critical hires needed.

<strong>Step 22 — High-Level Project & Resource Plan:</strong>
Create a project timeline with key milestones, resource requirements, and dependencies.

<strong>Step 23 — Risk Assessment:</strong>
Identify and assess key business, technical, regulatory, and market risks with mitigation strategies.

<strong>Step 24 — Business Model Canvas:</strong>
Complete your Business Model Canvas — this synthesizes your value proposition, customer segments, channels, revenue streams, key activities, resources, partners, and cost structure.

<strong>Step 25 — Strategic Horizon:</strong>
Define your long-term vision — product roadmap, market expansion plans, and strategic milestones over 3–5 years.

<strong>Step 26 — Funding & Use of Proceeds:</strong>
Specify how much funding you are seeking and provide a clear breakdown of how the funds will be used.`,
      tips: [
        'Team slides are among the most scrutinized by investors — highlight relevant experience',
        'The Business Model Canvas should be consistent with all previous steps',
        'Be specific about funding use — investors want to see disciplined capital allocation'
      ]
    },
    {
      id: 'sharing-business-case',
      title: 'Sharing Your Business Case',
      content: `Once your checklist is complete (or sufficiently advanced), you can share your business case with investors in two ways.

<strong>Option 1: Direct Sharing (Investor Share)</strong>
Send a secure link directly to investors you already know.
1. Open the <strong>Share</strong> dialog from the Genesis home screen
2. Select <strong>Direct Sharing</strong>
3. A unique, secure link is generated for your business case
4. Optionally add <strong>password protection</strong> for extra security
5. Set an <strong>expiration date</strong> if you want time-limited access
6. Copy the link and send it to your target investors via email or messaging

<strong>Option 2: Marketplace Discovery</strong>
List your device on the Deal Flow Marketplace so verified investors can discover you.
1. Open the <strong>Share</strong> dialog from the Genesis home screen
2. Select <strong>Marketplace Discovery</strong>
3. Opt-in to list your device on the marketplace
4. Your business case summary becomes visible to verified investors on the platform
5. Interested investors can <strong>request access</strong> to view your full business case
6. You control who gets access — approve or decline requests

<strong>What Investors See:</strong>
- A professional, structured presentation of your 26-step business case
- Device overview with image, description, and classification
- Market analysis, competitive landscape, and financial projections
- Team composition and strategic plans
- All data is presented in a clean, investor-friendly format

<strong>Tips for a Strong Pitch:</strong>
- Complete as many steps as possible — a higher completion percentage signals thoroughness
- Upload a professional device image
- Ensure your financial projections have clear supporting assumptions
- Keep descriptions concise and jargon-free where possible
- Review the Investor Preview before sharing to see exactly what investors will see`,
      tips: [
        'Use the eye icon in the sidebar to preview what investors will see before sharing',
        'Direct sharing gives you more control over who sees your business case',
        'Marketplace listing increases visibility to investors you may not know yet',
        'You can use both sharing methods simultaneously'
      ]
    }
  ],

  examples: [
    {
      scenario: 'Class II device from concept to investor-ready in 2 weeks',
      steps: [
        'Day 1–2: Complete Part I (Device Name through Classification)',
        'Day 3–4: Complete Part II (User Profile through Competitor Analysis)',
        'Day 5–7: Complete Part III (IP Strategy through Go-to-Market)',
        'Day 8–10: Complete Part V Steps 19–23 (Partners through Risk Assessment)',
        'Day 11–12: Complete Steps 24–26 (Canvas, Horizon, Funding)',
        'Day 13: Review using Investor Preview, refine weak areas',
        'Day 14: Share via Direct Link to target investors and enable Marketplace listing'
      ],
      expectedOutcome: 'A complete, investor-ready business case with professional presentation, ready for direct sharing and marketplace discovery.'
    }
  ],

  bestPractices: [
    'Follow the step sequence — each step builds on the previous ones',
    'Use the Investor Preview regularly to see your business case as investors will',
    'Complete all 26 steps for the strongest possible pitch',
    'Keep financial projections conservative and well-supported',
    'Update your business case as your device and strategy evolve',
    'Use Direct Sharing for targeted outreach and Marketplace for broader discovery',
    'Review and refine your device image and descriptions — first impressions matter'
  ],

  relatedModules: [
    'product-management',
    'business-analysis',
    'funding-stages'
  ],

  quickReference: {
    commonTasks: [
      {
        task: 'Complete a checklist step',
        steps: ['Click the step in the sidebar', 'Fill in the required information', 'Save — the step auto-completes'],
        estimatedTime: '5–15 minutes per step'
      },
      {
        task: 'Preview your investor view',
        steps: ['Click the eye icon in the sidebar', 'Review all sections', 'Go back and refine as needed'],
        estimatedTime: '5 minutes'
      },
      {
        task: 'Share with an investor',
        steps: ['Click Share', 'Choose Direct Sharing or Marketplace', 'Configure options and send'],
        estimatedTime: '2 minutes'
      }
    ]
  }
};
