import { ModuleContent } from '@/types/onboarding';

export const documentStudioModule: ModuleContent = {
  id: 'document-studio',
  translationKey: 'documentStudio',
  title: 'Document Studio',
  category: 'Document Control',
  estimatedTime: 20,
  difficulty: 'intermediate',
  roles: ['admin', 'company_admin', 'consultant', 'editor'],
  
  overview: {
    description: 'Document Studio is XYREG\'s comprehensive document management system for creating, organizing, and controlling regulatory documentation across the medical device lifecycle.',
    whoUsesIt: 'All team members creating or reviewing documents - Technical Writers, QA/RA specialists, Engineers, and Managers.',
    keyBenefits: [
      'Centralized document repository with version control',
      'Template-based document generation',
      'Automated document workflows and approvals',
      'Full audit trail for regulatory compliance',
      'Advanced search and filtering capabilities'
    ],
    prerequisites: ['Product created', 'Basic document types understanding']
  },
  
  steps: [
    {
      id: 'upload-documents',
      title: 'Uploading Documents',
      content: `Learn how to upload and organize documents in XYREG.

<strong>Upload Methods:</strong>

<strong>Single Upload:</strong>
1. Navigate to product Documents tab
2. Click "Upload Document" button
3. Select file from computer
4. Choose document type and category
5. Add metadata (version, description, etc.)
6. Save

<strong>Bulk Upload:</strong>
1. Click "Bulk Upload" option
2. Select multiple files
3. System auto-categorizes by filename patterns
4. Review and adjust document types
5. Upload all at once

<strong>Drag & Drop:</strong>
- Drag files directly into document area
- Quick upload for multiple documents
- Auto-detection of document types

<strong>Supported Formats:</strong>
- PDF (preferred for regulatory submissions)
- Word (.docx, .doc)
- Excel (.xlsx, .xls)
- Images (.jpg, .png)
- CAD files
- Various technical formats`,
      tips: [
        'Use consistent file naming conventions',
        'Always add meaningful descriptions',
        'Set correct document type for proper categorization',
        'Upload final versions as PDF for long-term storage'
      ]
    },
    {
      id: 'version-control',
      title: 'Document Version Control',
      content: `Master version control to maintain document history and ensure compliance.

<strong>Version Management:</strong>

<strong>Creating New Versions:</strong>
1. Open existing document
2. Click "Upload New Version"
3. Select updated file
4. Add version notes describing changes
5. System auto-increments version number
6. Previous versions remain accessible

<strong>Version Numbering:</strong>
- Major versions: 1.0, 2.0, 3.0 (significant changes)
- Minor versions: 1.1, 1.2, 1.3 (small updates)
- Automatic or manual numbering options

<strong>Version History:</strong>
- Complete audit trail of all versions
- Who made changes and when
- Change descriptions and rationale
- Downloadable version comparison
- Restore previous versions if needed

<strong>Document Status:</strong>
🔵 <strong>Draft</strong>: Work in progress
🟡 <strong>In Review</strong>: Under review by approvers
🟢 <strong>Approved</strong>: Official approved version
🔴 <strong>Obsolete</strong>: Superseded by newer version
<strong>Best Practices:</strong>
- Always describe changes in version notes
- Use major versions for significant updates
- Archive old versions but keep accessible
- Maintain approved version as "current"`,
      tips: [
        'Document all changes in version notes',
        'Set document status appropriately',
        'Use version compare feature before approving',
        'Never delete old versions - mark as obsolete'
      ],
      commonMistakes: [
        'Uploading without version notes',
        'Deleting old versions',
        'Not updating document status',
        'Inconsistent version numbering'
      ]
    },
    {
      id: 'templates',
      title: 'Using Document Templates',
      content: `Accelerate document creation with templates and automated generation.

<strong>Template Types:</strong>

<strong>Company Templates:</strong>
- Reusable across all products
- Standard formats (DHF, DMR, Technical File)
- Company-specific branding and formats
- Managed by admins

<strong>Product-Specific Templates:</strong>
- Customized for specific products or device types
- Pre-filled with product data
- Regulatory framework-specific

<strong>Creating from Templates:</strong>
1. Navigate to Documents tab
2. Click "Create from Template"
3. Select appropriate template
4. System auto-fills product information
5. Complete variable sections
6. Review and save

<strong>Template Features:</strong>
- Variable placeholders auto-populated
- Consistent formatting and structure
- Required sections highlighted
- Compliance checkpoints included

<strong>Managing Templates:</strong>
- Admin users can create/edit templates
- Version control for templates
- Template approval workflows
- Template library organization`,
      tips: [
        'Use templates for all standard documents',
        'Customize templates to match company standards',
        'Keep template library organized by category',
        'Regular review and update of templates'
      ]
    },
    {
      id: 'organization',
      title: 'Document Organization & Search',
      content: `Efficiently organize and find documents using XYREG's powerful features.

<strong>Organization Methods:</strong>

<strong>By Document Type:</strong>
- Design History File (DHF)
- Device Master Record (DMR)
- Technical Documentation
- Risk Management
- Clinical Evaluation
- Post-Market Surveillance

<strong>By Lifecycle Phase:</strong>
- Concept documents
- Design & Development
- Verification & Validation
- Production & Launch
- Post-Market

<strong>By Regulatory Framework:</strong>
- EU MDR documents
- FDA submission documents
- ISO certifications
- Market-specific requirements

<strong>Advanced Search:</strong>
- Full-text search across all documents
- Filter by type, phase, status, date
- Tag-based organization
- Custom metadata fields
- Saved search queries

<strong>Document Linking:</strong>
- Link related documents
- Cross-reference requirements
- Trace document dependencies
- Impact analysis for changes`,
      tips: [
        'Use consistent tagging for easy retrieval',
        'Set up saved searches for common queries',
        'Link related documents for traceability',
        'Regular cleanup of obsolete documents'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Creating a Design History File (DHF)',
      description: 'Step-by-step process for generating a comprehensive DHF',
      steps: [
        'Navigate to product Documents tab',
        'Click "Create from Template" → Select "DHF Template"',
        'System auto-fills product name, classification, intended use',
        'Complete design input requirements section',
        'Upload supporting documents (specs, drawings, test reports)',
        'Link to risk management documents',
        'Add design review records',
        'Set status to "In Review" and assign reviewers',
        'After review, approve and set to "Approved" status',
        'Generate PDF for regulatory submission'
      ],
      expectedOutcome: 'Complete DHF ready for regulatory submission with full traceability'
    }
  ],
  
  bestPractices: [
    'Use templates for all standard regulatory documents',
    'Maintain strict version control with detailed change notes',
    'Set appropriate document status at each workflow stage',
    'Link related documents for complete traceability',
    'Use consistent naming conventions and tags',
    'Regular document audits to identify gaps',
    'Archive obsolete documents, never delete',
    'Leverage bulk upload for efficiency',
    'Export PDFs for final submissions',
    'Train team on document control procedures'
  ],
  
  relatedModules: [
    'product-management',
    'compliance-gap-analysis',
    'design-risk-management',
    'audit-management'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'D → U', action: 'Upload document' },
      { key: 'D → T', action: 'Create from template' },
      { key: 'Ctrl/Cmd + F', action: 'Search documents' }
    ],
    commonTasks: [
      {
        task: 'Upload single document',
        steps: ['Click "Upload"', 'Select file', 'Set type', 'Save'],
        estimatedTime: '2 minutes'
      },
      {
        task: 'Create new version',
        steps: ['Open document', '"New Version"', 'Upload file', 'Add notes'],
        estimatedTime: '3 minutes'
      },
      {
        task: 'Generate from template',
        steps: ['"Create from Template"', 'Select template', 'Fill sections', 'Save'],
        estimatedTime: '15-30 minutes'
      }
    ],
    cheatSheet: [
      {
        title: 'Document Status',
        description: 'Draft → In Review → Approved → Obsolete'
      },
      {
        title: 'Version Format',
        description: 'Major.Minor (e.g., 2.1) - Major for big changes, Minor for updates'
      },
      {
        title: 'Required Metadata',
        description: 'Type, Category, Version, Description, Status, Owner'
      }
    ]
  }
};
