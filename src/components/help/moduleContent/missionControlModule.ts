import { ModuleContent } from '@/types/onboarding';

export const missionControlModule: ModuleContent = {
  id: 'mission-control',
  translationKey: 'missionControl',
  title: 'Mission Control',
  category: 'Core Platform',
  estimatedTime: 10,
  difficulty: 'beginner',
  roles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
  
  overview: {
    description: 'Mission Control is your personal command center. It shows what needs your attention, what changed recently, your training compliance status, and who is trying to reach you — all on a single page scoped to your company.',
    whoUsesIt: 'All team members use Mission Control as their daily starting point for monitoring tasks, reviewing activity, and communicating with colleagues.',
    keyBenefits: [
      'Personal action items with approvals and deadline tracking',
      'Chronological activity stream of recent company changes',
      'Training compliance radar showing completed vs. pending modules',
      'Integrated communication hub with unread counts and quick compose'
    ],
    prerequisites: [
      'Active user account',
      'Access to at least one company via Client Compass'
    ]
  },
  
  steps: [
    {
      id: 'my-action-items',
      title: 'My Action Items',
      content: `Your personal task list organized into two tabs:

Approvals: Items waiting for your sign-off — document approvals, activity confirmations, and quality reviews. Each card shows the item name, product, and how long it has been waiting.

Deadlines: Overdue documents (past due date, shown in red) and upcoming audits (within 30 days, shown in amber). Click any item to jump directly to it.`,
      tips: [
        'Review action items first thing each morning',
        'Approvals blocking other team members should take priority',
        'Overdue items appear at the top automatically'
      ]
    },
    {
      id: 'activity-stream',
      title: 'Activity Stream',
      content: `A chronological feed of the most recent changes across your company — product updates, document uploads, task completions, and status changes.

Each entry shows what changed, which product it belongs to, and when it happened. The stream displays the last 15 events.`,
      tips: [
        'Use the Activity Stream to stay informed without checking each module individually',
        'Click through to view full context of any change'
      ]
    },
    {
      id: 'competency-radar',
      title: 'My Competency Radar',
      content: `Your personal training compliance tracker. It pulls from the company training records to show which SOPs, training modules, and competency requirements you have completed versus what is still pending.

Items are sorted by urgency — overdue trainings appear first.`,
      tips: [
        'Keeping your competency radar green is important for audit readiness',
        'Overdue trainings can flag compliance gaps during inspections'
      ]
    },
    {
      id: 'communication-hub',
      title: 'Communication Hub',
      content: `Internal messaging scoped to your company:

Unread Messages & Priority Threads: Messages you haven't read yet appear at the top with a count badge. High-priority threads are highlighted.

Quick Message Composer: Send a message to any team member without leaving Mission Control. Select a recipient, type your message, and send.`,
      tips: [
        'Check the Communication Hub at the start and end of each day',
        'Use priority threads for urgent regulatory or quality discussions'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Morning Check-in',
      description: 'Start your work day with Mission Control',
      steps: [
        'Open Mission Control from your company',
        'Review Approvals tab — sign off anything blocking colleagues',
        'Check Deadlines tab for overdue documents or upcoming audits',
        'Scan Activity Stream for overnight changes',
        'Reply to unread messages in Communication Hub',
        'Check Competency Radar for any overdue trainings'
      ],
      expectedOutcome: 'Clear picture of priorities and no missed items',
      tips: [
        'Spend 5-10 minutes each morning on this routine'
      ]
    }
  ],
  
  bestPractices: [
    'Make Mission Control your daily starting point after selecting a company',
    'Address approvals promptly to avoid blocking team members',
    'Keep your competency radar up to date for audit readiness',
    'Use the Activity Stream to prepare for team meetings'
  ],
  
  relatedModules: [
    'client-compass',
    'product-management',
    'document-studio'
  ]
};
