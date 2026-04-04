
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Book, FileText, Users, Settings, Activity, Calendar, BarChart3, Shield, Download, Play, ChevronRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from '@/hooks/useTranslation';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  subsections: ManualSubsection[];
  userRoles: string[];
}

interface ManualSubsection {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  downloadable?: boolean;
}

const userManualSections: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Play,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'system-requirements',
        title: 'System Requirements',
        content: `
          ## System Requirements
          - **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)
          - **Internet**: Stable internet connection required
          - **JavaScript**: Must be enabled
          - **Cookies**: Required for authentication
          - **Local Storage**: Used for user preferences
          
          ## First-Time Access
          1. Access XYREG through your provided URL
          2. Choose authentication method:
             - **Login**: Use existing credentials
             - **Register**: Create new account (Company, Consultant, or Expert)
             - **Developer Mode**: For testing purposes
        `
      },
      {
        id: 'developer-mode',
        title: 'Developer Mode (Testing)',
        content: `
          ## Developer Mode Features
          - Test without real authentication
          - Configure mock user roles
          - Select primary company access
          - Multiple company access simulation
          - Useful for demonstrations and workflow testing
          
          ## How to Enable
          1. Click "Enable Developer Mode" on login page
          2. Configure mock user settings
          3. Select test companies
          4. Begin testing workflows
        `
      }
    ]
  },
  {
    id: 'user-authentication',
    title: 'User Authentication & Roles',
    icon: Users,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'user-types',
        title: 'User Types & Roles',
        content: `
          ## User Types
          
          ### Company User
          Internal employees managing their company's products and regulatory compliance.
          
          ### Consultant
          External advisors working with multiple companies, providing regulatory expertise.
          
          ### Expert/Reviewer
          Specialists providing review and validation services for documents and compliance.
          
          ## Permission Levels
          - **Admin**: Full company access and configuration
          - **Manager**: Product and team management
          - **User**: Standard product access
          - **Reviewer**: Review and approval permissions
          - **Read-Only**: View-only access
        `
      },
      {
        id: 'login-process',
        title: 'Login & Registration',
        content: `
          ## Login Process
          1. Enter email and password
          2. Optional "Remember me for 30 days"
          3. Automatic redirection based on user role:
             - Company users → Company dashboard
             - Consultants → Client overview
             - Experts → Review panel
          
          ## Registration
          1. Select user type during registration
          2. Complete email verification
          3. Role-specific dashboard access after approval
          4. Initial setup wizard for new accounts
        `
      }
    ]
  },
  {
    id: 'navigation',
    title: 'Navigation & Interface',
    icon: Activity,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'navigation-structure',
        title: 'Navigation Structure',
        content: `
          ## Main Navigation Structure
          **Clients → Company → Products → Documents/Lifecycle/Activities**
          
          ## Header Components
          - **Breadcrumb Navigation**: Shows current location in hierarchy
          - **Company Role Switcher**: Switch between different company access levels
          - **User Menu**: Profile, settings, logout options
          
          ## Sidebar Navigation
          - **Contextual Menu**: Changes based on current company/product selection
          - **Quick Access**: Frequently used features and recent items
          - **Company Selector**: Switch between accessible companies
          
          ## Responsive Design
          - Mobile-optimized interface
          - Collapsible sidebar on smaller screens
          - Touch-friendly buttons and interactions
        `
      }
    ]
  },
  {
    id: 'company-management',
    title: 'Company Management',
    icon: Settings,
    userRoles: ['admin', 'company_admin', 'consultant'],
    subsections: [
      {
        id: 'company-dashboard',
        title: 'Company Dashboard',
        content: `
          ## Company Dashboard Location
          \`/app/company/{companyName}\`
          
          ## Key Features
          
          ### Overview Section
          - Company statistics and metrics
          - Active products summary
          - Recent activity feed
          - Compliance status overview
          
          ### Product Grid View
          - Visual cards for each product
          - Product status indicators
          - Quick access to product details
          - Filter and search capabilities
          
          ### Phase Board View
          - Kanban-style lifecycle phase columns
          - Drag-and-drop product movement
          - Phase-specific product counts
          - Visual workflow management
        `
      },
      {
        id: 'creating-company',
        title: 'Creating a New Company',
        content: `
          ## Step-by-Step Process
          1. Navigate to client overview
          2. Click "Add Client" button
          3. Fill in company details:
             - Company name
             - Industry type
             - Contact information
             - Initial settings
          4. Configure initial phases and templates
          5. Set up user permissions
        `
      },
      {
        id: 'company-settings',
        title: 'Company Settings',
        content: `
          ## Company Settings Location
          \`/app/company/{companyName}/settings\`
          
          ## Configuration Tabs
          - **Phases**: Lifecycle phase configuration
          - **Documents**: Document templates and control
          - **Activities**: Activity templates and scheduling
          - **Audits**: Audit template configuration
          - **Gap Analysis**: Compliance framework setup
          - **Users**: User permissions and roles
          - **General**: Basic company information
        `
      }
    ]
  },
  {
    id: 'product-management',
    title: 'Product Management',
    icon: FileText,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'product-creation',
        title: 'Product Creation',
        content: `
          ## Access Point
          Company dashboard → "Add Product" button
          
          ## Product Types
          - **New Product**: Create from scratch
          - **Line Extension**: Based on existing product
          - **Platform Product**: Multi-market base product
          
          ## Required Information
          - Product name and description
          - Product type and category
          - Target markets
          - Device classification
          - Initial lifecycle phase
        `
      },
      {
        id: 'product-dashboard',
        title: 'Product Dashboard',
        content: `
          ## Product Dashboard Location
          \`/app/product/{productId}\`
          
          ## Main Sections
          
          ### Overview
          - Product summary and key metrics
          - Current status and phase
          - Recent activity and updates
          - Priority actions
          
          ### Device Information
          - Technical specifications
          - Intended use and users
          - Regulatory classification
          - Market-specific details
          
          ### Quick Navigation
          - Direct access to documents
          - Lifecycle phase view
          - Activities and tasks
          - Audit information
        `
      },
      {
        id: 'product-lifecycle',
        title: 'Product Lifecycle Management',
        content: `
          ## Lifecycle Management Location
          \`/app/product/{productId}/lifecycle\`
          
          ## Features
          - **Phase Visualization**: Timeline view of product journey
          - **Phase Transitions**: Move products between lifecycle phases
          - **Milestone Tracking**: Key deliverables and deadlines
          - **Timeline Management**: Phase duration and scheduling
        `
      }
    ]
  },
  {
    id: 'document-management',
    title: 'Document Management',
    icon: FileText,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'document-hierarchy',
        title: 'Document Hierarchy',
        content: `
          ## Document Types
          - **Company Templates**: Reusable document templates
          - **Product Documents**: Product-specific documentation
          - **Phase Documents**: Phase-assigned document instances
          
          ## Document Status Workflow
          \`Draft → Under Review → Reviewed → Approved\`
          \`                ↓\`
          \`             Rejected → Back to Draft\`
          
          ## Supported File Formats
          - PDF, DOC, DOCX
          - XLS, XLSX
          - Images (PNG, JPG, etc.)
        `
      },
      {
        id: 'product-documents',
        title: 'Product Documents',
        content: `
          ## Product Documents Location
          \`/app/product/{productId}/documents\`
          
          ## Document Views
          - **Current Phase Documents**: Active phase requirements
          - **All Phase Documents**: Complete document portfolio
          - **Product-Specific Documents**: Custom product documentation
          
          ## Document Operations
          - **Add Document**: Create new or upload existing
          - **Sync Templates**: Apply company templates to product
          - **Status Management**: Track document progress
          - **Review Assignment**: Assign reviewers and due dates
        `
      },
      {
        id: 'file-management',
        title: 'File Upload & Management',
        content: `
          ## File Operations
          - **Upload**: Drag-and-drop or browse to upload
          - **Version Control**: Track document revisions
          - **Preview**: View documents without downloading
          - **Download**: Access files offline
          
          ## Security Features
          - Secure cloud storage
          - Access control based on user permissions
          - File encryption in transit and at rest
          - Audit trail for all file operations
        `
      }
    ]
  },
  {
    id: 'gap-analysis',
    title: 'Gap Analysis & Compliance',
    icon: BarChart3,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    subsections: [
      {
        id: 'gap-analysis-framework',
        title: 'Gap Analysis Framework',
        content: `
          ## Gap Analysis Location
          Product → Gap Analysis tab
          
          ## Supported Frameworks
          - **MDR (Medical Device Regulation)**: European regulation
          - **FDA 510(k)**: US regulatory pathway
          - **ISO 13485**: Quality management system
          - **Custom Frameworks**: Company-specific requirements
          
          ## Gap Analysis Process
          1. **Framework Selection**: Choose applicable regulations
          2. **Requirement Review**: Assess compliance requirements
          3. **Evidence Upload**: Provide supporting documentation
          4. **Gap Identification**: Identify missing elements
          5. **Action Planning**: Define remediation steps
        `
      },
      {
        id: 'gap-item-management',
        title: 'Gap Item Management',
        content: `
          ## Status Tracking
          - **Compliant**: Requirement fully met
          - **Non-Compliant**: Requirement not met
          - **Partial**: Partially compliant
          - **Under Review**: Being evaluated
          
          ## Evidence Management
          - Link supporting documents
          - Upload evidence files
          - Track document approvals
          - Maintain compliance history
          
          ## Due Date Tracking
          - Monitor compliance deadlines
          - Automated reminders
          - Escalation procedures
          - Reviewer assignment
        `
      }
    ]
  },
  {
    id: 'audit-management',
    title: 'Audit Management',
    icon: Shield,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    subsections: [
      {
        id: 'audit-types',
        title: 'Audit Types & Workflow',
        content: `
          ## Audit Types
          - **Internal Audits**: Company self-assessments
          - **External Audits**: Third-party evaluations
          - **Regulatory Audits**: Authority inspections
          - **Supplier Audits**: Vendor assessments
          
          ## Audit Workflow
          1. **Audit Planning**: Define scope and schedule
          2. **Template Selection**: Choose audit framework
          3. **Auditor Assignment**: Assign audit team
          4. **Execution**: Conduct audit activities
          5. **Reporting**: Generate audit findings
          6. **Follow-up**: Track corrective actions
        `
      },
      {
        id: 'audit-templates',
        title: 'Audit Templates',
        content: `
          ## Template Management Location
          Company Settings → Audits tab
          
          ## Features
          - **Standard Templates**: Industry-standard audit frameworks
          - **Custom Templates**: Company-specific audit criteria
          - **Template Library**: Shared template repository
          - **Configuration**: Customize audit parameters
          
          ## Template Configuration
          - Define audit scope
          - Set evaluation criteria
          - Configure scoring methods
          - Assign default auditors
        `
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: Settings,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    subsections: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        content: `
          ## Authentication Problems
          - **Login Failures**: Check credentials and network connection
          - **Permission Denied**: Verify user role and company access
          - **Session Timeout**: Re-authenticate after inactivity
          
          ## Document Upload Issues
          - **File Size Limits**: Check maximum file size restrictions
          - **Format Support**: Ensure file format is supported
          - **Network Errors**: Retry upload with stable connection
          
          ## Performance Issues
          - **Slow Loading**: Clear browser cache and cookies
          - **Memory Issues**: Close unnecessary browser tabs
          - **Network Latency**: Check internet connection speed
        `
      },
      {
        id: 'support-resources',
        title: 'Support Resources',
        content: `
          ## Getting Help
          - **Help Documentation**: In-app help system
          - **User Training**: Video tutorials and guides
          - **Technical Support**: Contact system administrators
          - **System Status**: Check platform status page
          
          ## Browser Compatibility
          - **Recommended Browsers**: Chrome, Firefox, Safari, Edge
          - **JavaScript**: Must be enabled
          - **Cookies**: Required for authentication
          - **Local Storage**: Used for user preferences
        `
      }
    ]
  }
];

interface UserManualSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserManualSystem({ isOpen, onClose }: UserManualSystemProps) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('getting-started');
  const [selectedSubsection, setSelectedSubsection] = useState<string>('system-requirements');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const { userRole } = useAuth();

  const filteredSections = useMemo(() => {
    return userManualSections.filter(section => 
      section.userRoles.includes(userRole || 'viewer')
    );
  }, [userRole]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: Array<{section: ManualSection, subsection: ManualSubsection, score: number}> = [];
    
    filteredSections.forEach(section => {
      section.subsections.forEach(subsection => {
        const query = searchQuery.toLowerCase();
        let score = 0;
        
        if (subsection.title.toLowerCase().includes(query)) score += 10;
        if (section.title.toLowerCase().includes(query)) score += 5;
        if (subsection.content.toLowerCase().includes(query)) score += 1;
        
        if (score > 0) {
          results.push({ section, subsection, score });
        }
      });
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [searchQuery, filteredSections]);

  const currentSection = filteredSections.find(s => s.id === selectedSection);
  const currentSubsection = currentSection?.subsections.find(s => s.id === selectedSubsection);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const selectSubsection = (sectionId: string, subsectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedSubsection(subsectionId);
    setSearchQuery(''); // Clear search when selecting
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Book className="h-5 w-5" />
                {lang('userManual.title')}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={lang('userManual.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {searchQuery ? (
              // Search Results
              <div className="p-4">
                <h3 className="text-sm font-medium mb-3">{lang('userManual.searchResults', { count: searchResults.length })}</h3>
                <div className="space-y-2">
                  {searchResults.map(({ section, subsection }, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => selectSubsection(section.id, subsection.id)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{subsection.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {lang('userManual.inSection', { section: section.title })}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Manual Navigation
              <div className="p-4">
                {filteredSections.map((section) => (
                  <div key={section.id} className="mb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <section.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                    </Button>
                    
                    {expandedSections.has(section.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <Button
                            key={subsection.id}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-xs ${
                              selectedSection === section.id && selectedSubsection === subsection.id
                                ? 'bg-accent'
                                : ''
                            }`}
                            onClick={() => selectSubsection(section.id, subsection.id)}
                          >
                            {subsection.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {currentSubsection ? (
            <>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{currentSubsection.title}</h1>
                    <p className="text-muted-foreground">{lang('userManual.inSection', { section: currentSection?.title })}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentSubsection.videoUrl && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        {lang('userManual.watchVideo')}
                      </Button>
                    )}
                    {currentSubsection.downloadable && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {lang('userManual.downloadPdf')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="prose prose-sm max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: currentSubsection.content
                        .replace(/\n/g, '<br>')
                        .replace(/#{3}\s(.+)/g, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
                        .replace(/#{2}\s(.+)/g, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
                        .replace(/#{1}\s(.+)/g, '<h1 class="text-2xl font-bold mt-10 mb-5">$1</h1>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                        .replace(/- (.+)/g, '<li class="ml-4">$1</li>')
                        .replace(/(\d+)\. (.+)/g, '<li class="ml-4 list-decimal">$2</li>')
                    }} 
                  />
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">{lang('userManual.selectTopic')}</h3>
                <p className="text-muted-foreground">
                  {lang('userManual.selectTopicDescription')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
