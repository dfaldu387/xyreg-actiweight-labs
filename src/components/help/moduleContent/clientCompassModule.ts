import { ModuleContent } from '@/types/onboarding';

export const clientCompassModule: ModuleContent = {
  id: 'client-compass',
  translationKey: 'clientCompass',
  title: 'Client Compass',
  category: 'Core Platform',
  estimatedTime: 15,
  difficulty: 'beginner',
  roles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
  
  overview: {
    description: 'Client Compass is your central hub for managing multiple clients and companies. It provides a visual overview of all companies you have access to, with status indicators and quick navigation to company-specific dashboards.',
    whoUsesIt: 'All team members who work across multiple companies or clients use Client Compass to quickly navigate between different client projects and monitor their overall status.',
    keyBenefits: [
      'Visual overview of all your companies at a glance',
      'Quick status assessment with color-coded indicators',
      'Fast navigation to company-specific dashboards',
      'Role-based access control for team collaboration',
      'Search and filter capabilities for large portfolios'
    ],
    prerequisites: [
      'Active user account',
      'Access to at least one company'
    ]
  },
  
  steps: [
    {
      id: 'understanding-client-compass',
      title: 'Understanding Client Compass',
      content: `Client Compass displays all companies you have access to in a visual card grid. Each card represents a company and shows:

- Company name and logo
- Status indicator (On Track, At Risk, Needs Attention)
- Number of products
- Country/market information
- Your role in the company

The status indicators use a traffic light system:
- Green: On Track - everything is progressing well
- Yellow: At Risk - requires attention or monitoring
- Red: Needs Attention - immediate action required

Click on any company card to navigate to that company's Mission Control dashboard.`,
      media: {
        screenshot: new URL('@/assets/client-compass-screenshot.png', import.meta.url).href
      },
      tips: [
        'Bookmark Client Compass as your daily starting point',
        'Review status indicators each morning to prioritize your work',
        'Use search to quickly find specific companies in large portfolios'
      ]
    },
    {
      id: 'navigating-companies',
      title: 'Navigating Between Companies',
      content: `Use Client Compass to efficiently switch between different client projects:

1. From any page, click the company selector in the navigation
2. You'll see the Client Compass view with all your companies
3. Use the search bar to filter by company name
4. Click on a company card to switch to that company's workspace

When you select a company, the entire interface switches to that company's context, showing only relevant data, projects, and documents.`,
      tips: [
        'The active company is shown in the top navigation bar',
        'Your recent companies appear at the top for quick access',
        'You can switch companies without losing your work in progress'
      ]
    },
    {
      id: 'status-indicators',
      title: 'Understanding Status Indicators',
      content: `Client Compass uses intelligent status indicators to help you prioritize:

On Track (Green):
- All deliverables are on schedule
- No overdue tasks or critical issues
- Compliance requirements are up to date

At Risk (Yellow):
- Some tasks are approaching deadlines
- Minor compliance gaps identified
- Requires monitoring and attention

Needs Attention (Red):
- Overdue deliverables or tasks
- Critical compliance issues
- Immediate action required

Status is calculated automatically based on:
- Task and milestone deadlines
- Document approval status
- Compliance gap analysis results
- Risk assessment findings`,
      tips: [
        'Red status companies should be your first priority',
        'Set up notifications for status changes',
        'Review yellow status companies weekly to prevent escalation'
      ]
    },
    {
      id: 'search-filter',
      title: 'Search and Filtering',
      content: `For users managing many companies, Client Compass provides powerful search and filtering:

Search by Company Name:
- Type in the search box to filter companies in real-time
- Search works on company name and aliases

Filter by Status:
- Show only companies needing attention
- Focus on at-risk companies
- View all companies on track

Filter by Country/Market:
- Group companies by regulatory region
- Focus on specific markets

Sort Options:
- Alphabetically by company name
- By status priority (red, yellow, green)
- By last accessed date`,
      tips: [
        'Save common filter combinations for quick access',
        'Use status filtering for daily priority reviews',
        'Combine filters to create focused work lists'
      ]
    },
    {
      id: 'role-management',
      title: 'Understanding Your Roles',
      content: `Each company card displays your role, which determines your permissions and responsibilities:

Common Roles:
- Regulatory Manager: Full access to regulatory submissions and compliance
- Quality Manager: QMS and document control focus
- Project Manager: Project planning and timeline management
- Clinical Lead: Clinical trial oversight
- Team Member: View and contribute to assigned tasks

Your role affects:
- Which modules and features you can access
- What data you can view and modify
- Notification settings and alerts
- Approval workflows you participate in

Multiple roles are possible - you may have different roles in different companies.`,
      tips: [
        'Check your role on each company card',
        'Contact your admin if you need additional permissions',
        'Roles are company-specific, not global'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Daily Workflow with Multiple Clients',
      description: 'Start your day effectively using Client Compass',
      steps: [
        'Open Client Compass from the navigation menu',
        'Review status indicators to identify priorities',
        'Click on any red-status companies first',
        'Review action items in each company Mission Control',
        'Switch between companies using the company selector',
        'End day by checking all companies are progressing'
      ],
      expectedOutcome: 'Efficient multi-client management with clear priorities',
      tips: [
        'Spend 5 minutes each morning reviewing all company statuses',
        'Address red-status items immediately',
        'Schedule time blocks for each company'
      ]
    },
    {
      scenario: 'Finding a Specific Company Quickly',
      description: 'Locate and access a company when managing many clients',
      steps: [
        'Open Client Compass',
        'Type company name in the search box',
        'View filtered results in real-time',
        'Click on the company card to access',
        'Mission Control dashboard loads for that company'
      ],
      expectedOutcome: 'Quick navigation to the right company workspace'
    }
  ],
  
  bestPractices: [
    'Review Client Compass daily to stay on top of all your companies',
    'Prioritize red and yellow status companies in your daily workflow',
    'Use search and filters to focus on specific markets or status levels',
    'Set up notifications for status changes across your portfolio',
    'Keep company information up to date for accurate status indicators',
    'Document switching context - complete tasks in one company before moving to the next',
    'Use the status system as a communication tool with your team'
  ],
  
  relatedModules: [
    'mission-control',
    'product-management',
    'compliance-gap-analysis'
  ]
};
