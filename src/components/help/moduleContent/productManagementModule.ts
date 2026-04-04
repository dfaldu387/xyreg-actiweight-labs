import { ModuleContent } from '@/types/onboarding';

export const productManagementModule: ModuleContent = {
  id: 'product-management',
  translationKey: 'productManagement',
  title: 'Product Management',
  category: 'Product Management',
  estimatedTime: 25,
  difficulty: 'intermediate',
  roles: ['admin', 'company_admin', 'consultant', 'editor'],
  
  overview: {
    description: 'Product Management in XYREG enables comprehensive lifecycle management of medical devices from concept through post-market surveillance.',
    whoUsesIt: 'Product Managers, Regulatory Affairs, and R&D teams use this module to track device development, classification, and regulatory submissions.',
    keyBenefits: [
      'Complete device lifecycle tracking',
      'Automated classification wizards (EU MDR, FDA, IVDR, SaMD)',
      'Milestone management and progress tracking',
      'Document association and organization',
      'Multi-market regulatory planning'
    ],
    prerequisites: ['Company setup complete', 'Basic XYREG navigation']
  },
  
  steps: [
    {
      id: 'create-product',
      title: 'Creating Your First Product',
      content: `Learn how to create and configure a new medical device product in XYREG.

<strong>Steps to Create:</strong>
1. Navigate to Company Dashboard
2. Click "Add New Product" button
3. Enter basic product information:
   - Product Name
   - Trade Name (optional)
   - Description
   - Regulatory Framework(s)
4. Select initial lifecycle phase
5. Configure product team members
6. Save and continue to classification

<strong>Required Information:</strong>
- Product Name (unique within company)
- Primary Regulatory Framework (EU MDR, FDA, ISO 13485, etc.)
- Initial Lifecycle Phase (usually Concept or Design)

<strong>Optional but Recommended:</strong>
- Trade Name for commercial products
- Detailed description for team clarity
- Upload product images for visual identification
- Assign product owner and team members`,
      tips: [
        'Use clear, descriptive product names',
        'Add trade name if different from regulatory name',
        'Select all applicable regulatory frameworks upfront'
      ]
    },
    {
      id: 'classification',
      title: 'Device Classification',
      content: `Use XYREG's intelligent classification wizards to determine your device's regulatory pathway.

<strong>Available Wizards:</strong>

<strong>EU MDR Classification</strong>
- Rule-based classification (Rules 1-22)
- Medical Device vs. IVD determination
- Class I, IIa, IIb, or III assignment
- Automatic Annex requirements

<strong>FDA Classification</strong>
- Product code lookup
- 510(k), PMA, or De Novo pathway determination
- Class I, II, or III assignment
- Predicate device identification

<strong>IVDR Classification</strong>
- IVD-specific rules (Rules 1-7)
- Class A, B, C, or D assignment
- Performance study requirements

<strong>SaMD Classification</strong>
- Software risk categorization
- IMDRF framework alignment
- Clinical evaluation requirements

<strong>How to Run Classification:</strong>
1. Open product page
2. Click "Classification" tab
3. Select wizard type
4. Answer guided questions
5. Review results and save
6. System auto-configures required documentation`,
      tips: [
        'Run classification early in product development',
        'Save wizard results for audit trail',
        'Update classification if device changes significantly',
        'Use multiple wizards if selling in multiple markets'
      ],
      commonMistakes: [
        'Not updating classification after design changes',
        'Skipping classification for "simple" devices',
        'Ignoring combination device considerations'
      ]
    },
    {
      id: 'milestones',
      title: 'Milestone Management',
      content: `Track product development progress with intelligent milestone management.

<strong>Milestone Types:</strong>
- Phase Gates: Required deliverables for phase progression
- Regulatory Submissions: Submission deadlines and approvals
- Design Reviews: Design freeze, verification, validation
- Market Launch: CE marking, FDA clearance, commercial release
- Post-Market: PMS, vigilance, CAPA activities

<strong>Milestone Configuration:</strong>
1. Navigate to product Milestones tab
2. Add milestones manually or use templates
3. Set due dates and assign owners
4. Link related documents
5. Track completion status
6. View timeline and Gantt charts

<strong>Automatic Milestone Generation:</strong>
- Based on selected regulatory framework
- Aligned with lifecycle phases
- Customizable templates per company

<strong>Status Tracking:</strong>
🔵 Not Started
🟡 In Progress
🟢 Completed
🔴 Overdue`,
      tips: [
        'Set realistic milestone dates with buffer time',
        'Assign clear owners for accountability',
        'Link required documents to milestones',
        'Review milestone timeline weekly'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Launching a Class II Medical Device in EU and US',
      steps: [
        'Create product in XYREG with name "Smart Insulin Pump"',
        'Run EU MDR classification wizard → Result: Class IIb',
        'Run FDA classification wizard → Result: Class II, 510(k) required',
        'System generates required documentation per framework',
        'Set up milestones for both regulatory pathways',
        'Assign team members to documentation tasks',
        'Track progress through dashboard views'
      ],
      expectedOutcome: 'Comprehensive product setup with dual regulatory pathway management'
    }
  ],
  
  bestPractices: [
    'Complete classification before significant design work',
    'Update product information as development progresses',
    'Maintain consistent naming conventions across products',
    'Regularly review and update milestones',
    'Link all relevant documents to product records',
    'Use product variants for similar devices',
    'Set up notifications for milestone deadlines',
    'Archive obsolete products rather than deleting'
  ],
  
  relatedModules: [
    'document-studio',
    'compliance-gap-analysis',
    'design-risk-management',
    'business-analysis'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'P → N', action: 'Create new product', context: 'From company dashboard' },
      { key: 'P → C', action: 'Open classification wizard' },
      { key: 'P → M', action: 'View milestones' }
    ],
    commonTasks: [
      {
        task: 'Add new product',
        steps: ['Click "Add Product"', 'Fill basic info', 'Save'],
        estimatedTime: '5 minutes'
      },
      {
        task: 'Run classification',
        steps: ['Open product', 'Classification tab', 'Select wizard', 'Complete'],
        estimatedTime: '10-15 minutes'
      }
    ]
  }
};
