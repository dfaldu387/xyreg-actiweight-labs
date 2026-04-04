
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/useTranslation';
import { Info, X, Lightbulb } from "lucide-react";

interface ContextualHelpContent {
  title: string;
  description: string;
  tips: string[];
  videoUrl?: string;
}

const contextualHelpMap: Record<string, ContextualHelpContent> = {
  // Mission Control - Multi-company view (/app/mission-control?all=true)
  '/app/mission-control': {
    title: 'Mission Control Dashboard',
    description: 'Multi-company overview and role management hub',
    tips: [
      'View all companies you have access to in one central location',
      'Switch between different roles and companies efficiently',
      'Monitor activity and compliance across your entire portfolio',
      'Use the company cards to quickly navigate to specific company dashboards'
    ]
  },

  // Mission Control - Single company view (/app/company/:name/mission-control)
  'company-mission-control': {
    title: 'Company Mission Control',
    description: 'Your company command center for devices and compliance',
    tips: [
      'Review your device portfolio health and status at a glance',
      'Track upcoming deadlines and action items requiring your attention',
      'Monitor recent activity across all your products',
      'Navigate to specific devices for detailed management'
    ]
  },

  // Client Management
  '/app/clients': {
    title: 'Client Compass',
    description: 'Manage multiple companies and their regulatory portfolios',
    tips: [
      'Add new companies using the "Add Client" button',
      'Filter companies by status or compliance level',
      'Access company dashboards by clicking on company cards',
      'Use the search function to quickly find specific clients'
    ],
    videoUrl: '/tutorials/client-management.mp4'
  },

  // Company Management
  '/app/company': {
    title: 'Company Dashboard',
    description: 'Complete overview of your company\'s products and compliance status',
    tips: [
      'Toggle between Grid View and Phase Board for different perspectives',
      'Use the status indicators to quickly identify products needing attention',
      'Access bulk operations for managing multiple products simultaneously',
      'Monitor compliance metrics and recent activity in the overview cards',
      'Create new products directly from the dashboard using the Add Product button'
    ],
    videoUrl: '/tutorials/company-dashboard-overview.mp4'
  },

  '/app/company/portfolio': {
    title: 'Product Portfolio Management',
    description: 'Comprehensive view and management of your complete product portfolio',
    tips: [
      'Use filters to segment products by phase, status, or classification',
      'Export portfolio reports for executive reviews and compliance audits',
      'Track portfolio-level metrics and performance indicators',
      'Identify trends and patterns across your product portfolio'
    ]
  },

  '/app/company/audit-log': {
    title: 'Audit Log & Activity Tracking',
    description: 'Complete audit trail of all system activities and changes',
    tips: [
      'Use date filters to focus on specific time periods',
      'Filter by user to track individual team member activities',
      'Export audit logs for compliance and regulatory purposes',
      'Monitor critical changes to products and documents'
    ]
  },

  '/app/company/communications': {
    title: 'Company Communications',
    description: 'Centralized communication hub for team collaboration',
    tips: [
      'Create focused discussion threads for specific topics or products',
      'Use @mentions to notify specific team members',
      'Attach files and documents to communication threads',
      'Archive completed discussions to maintain organization'
    ]
  },

  // Product Management - Updated with Timeline Views
  '/app/product': {
    title: 'Advanced Product Management',
    description: 'Comprehensive product lifecycle management with advanced timeline and dependency features',
    tips: [
      'Use Timeline Manager for high-level project overview and navigation',
      'Switch to Gantt Chart view for interactive timeline editing and dependency management',
      'Access Phase Detail views by clicking on any phase for deep-dive analysis',
      'Monitor compliance intelligence (CI) progress: Documents, Gap Analysis, Activities, and Audits',
      'Track phase dependencies and validate schedule changes in real-time',
      'Navigate between different timeline views based on your current needs'
    ],
    videoUrl: '/tutorials/product-management-advanced.mp4'
  },

  '/app/product/milestones': {
    title: 'Product Milestones & Timeline Integration',
    description: 'Advanced milestone tracking integrated with phase dependencies and timeline views',
    tips: [
      'View milestones in context of phase dependencies and constraints',
      'Use timeline views to understand milestone relationships across phases',
      'Track milestone progress as part of overall phase completion',
      'Set milestone dependencies that integrate with phase scheduling',
      'Monitor critical path milestones that affect project timeline'
    ]
  },

  '/app/product/timeline': {
    title: 'Interactive Timeline Management',
    description: 'Advanced timeline views with dependency management and scheduling',
    tips: [
      'Timeline Manager: High-level overview perfect for status reporting',
      'Gantt Chart: Interactive drag-and-drop timeline editing with dependency validation',
      'Phase Detail View: Deep-dive into individual phase progress and compliance',
      'Use dependency arrows to understand phase relationships (FS, FF, SS, SF)',
      'Validate timeline changes in real-time with automatic conflict detection'
    ],
    videoUrl: '/tutorials/timeline-management.mp4'
  },

  '/app/product/phase': {
    title: 'Phase Detail Management',
    description: 'Comprehensive phase analysis with compliance intelligence breakdown',
    tips: [
      'Monitor Compliance Intelligence (CI) categories: Documents, Gap Analysis, Activities, Audits',
      'Track phase progress with visual indicators and completion percentages',
      'Use phase timeline view to see activities and milestones in context',
      'Navigate between phases using Previous/Next controls or timeline integration',
      'Manage phase status (Open, Closed, N/A) with validation and dependency checks'
    ],
    videoUrl: '/tutorials/phase-detail-views.mp4'
  },

  '/app/product/device-information': {
    title: 'Device Information & Classification',
    description: 'Comprehensive device details and regulatory classification',
    tips: [
      'Complete all required device information for regulatory submissions',
      'Use the classification wizards for accurate regulatory classification',
      'Document intended use and indications for use clearly',
      'Keep device information updated throughout the development lifecycle'
    ]
  },

  '/app/product/documents': {
    title: 'Product Document Management',
    description: 'Manage all product-specific documentation and deliverables',
    tips: [
      'Organize documents by category and lifecycle phase',
      'Track document versions and approval workflows',
      'Use templates to ensure consistent documentation standards',
      'Link documents to specific milestones and requirements'
    ]
  },

  // Document Management
  '/documents': {
    title: 'Document Control System',
    description: 'Central document management with version control and workflows',
    tips: [
      'Use the document hierarchy to organize files by product and category',
      'Track document approval status and version history',
      'Apply templates to standardize document formats',
      'Set up approval workflows for critical documentation',
      'Use bulk operations for managing multiple documents efficiently'
    ],
    videoUrl: '/tutorials/document-management.mp4'
  },

  '/app/templates': {
    title: 'Document Templates',
    description: 'Create and manage reusable document templates',
    tips: [
      'Create master templates for commonly used document types',
      'Use variable fields to automatically populate product information',
      'Organize templates by regulatory framework and document category',
      'Version control templates to track changes and improvements'
    ]
  },

  // Gap Analysis & Compliance
  '/app/gap-analysis': {
    title: 'Gap Analysis & Compliance Assessment',
    description: 'Comprehensive regulatory compliance assessment and gap identification',
    tips: [
      'Select appropriate regulatory frameworks for your assessment',
      'Review automated compliance checks and recommendations',
      'Prioritize gaps based on regulatory impact and implementation effort',
      'Create action plans to address identified compliance gaps',
      'Track progress on gap remediation activities'
    ],
    videoUrl: '/tutorials/gap-analysis.mp4'
  },

  // Archives
  '/app/archives': {
    title: 'Archive Management',
    description: 'Access and manage archived products and historical data',
    tips: [
      'Use search and filtering to locate archived information quickly',
      'Restore archived products when historical access is needed',
      'Maintain audit trails for all archived content',
      'Export archived data for regulatory compliance and audit purposes'
    ]
  },

  // Review Panel
  '/app/review-panel': {
    title: 'Review Panel',
    description: 'Specialized interface for reviewers and consultants',
    tips: [
      'Focus on assigned review tasks and deliverables',
      'Use commenting and annotation features for detailed feedback',
      'Track review progress and completion status',
      'Coordinate with product teams through integrated communication tools'
    ]
  },

  // Communications
  '/app/communications': {
    title: 'Communications & Collaboration',
    description: 'Team communication and collaboration platform',
    tips: [
      'Create threaded discussions for organized conversations',
      'Use file sharing to distribute documents and resources',
      'Set up notifications to stay informed of important updates',
      'Archive completed discussions to maintain a clean workspace'
    ]
  },

  // Settings & Configuration - Updated with Phase Dependencies
  '/settings': {
    title: 'Company Settings & Advanced Configuration',
    description: 'Configure company-specific settings, phase dependencies, and advanced timeline features',
    tips: [
      'Set up custom lifecycle phases for your development processes',
      'Configure phase dependencies using FS, FF, SS, SF relationship types',
      'Create and manage document templates for standardization',
      'Configure automated scheduling and validation rules',
      'Set up company-wide phase templates that can be overridden at product level'
    ]
  },

  '/settings/phases': {
    title: 'Phase Management & Dependencies',
    description: 'Advanced phase configuration with dependency management',
    tips: [
      'Configure company phase templates that apply to all products',
      'Set up phase dependencies: Finish-to-Start (FS), Finish-to-Finish (FF), Start-to-Start (SS), Start-to-Finish (SF)',
      'Use lag days to account for approval cycles and review periods',
      'Test dependency configurations with schedule calculation tools',
      'Monitor phase consistency across your product portfolio'
    ],
    videoUrl: '/tutorials/phase-dependencies-setup.mp4'
  }
};

interface ContextualHelpProps {
  onDismiss?: () => void;
  className?: string;
}

export function ContextualHelp({ onDismiss, className }: ContextualHelpProps) {
  const { lang } = useTranslation();
  const location = useLocation();
  
  // Find matching help content based on current route
  const getHelpContent = (): ContextualHelpContent | null => {
    const path = location.pathname;
    
    // Check for exact matches first
    if (contextualHelpMap[path]) {
      return contextualHelpMap[path];
    }

    // Special case: company-specific mission control (/app/company/:name/mission-control)
    if (path.includes('/app/company/') && path.endsWith('/mission-control')) {
      return contextualHelpMap['company-mission-control'] || null;
    }
    
    // Check for partial matches
    for (const [route, content] of Object.entries(contextualHelpMap)) {
      if (route.startsWith('/') && path.includes(route.replace('/app', ''))) {
        return content;
      }
    }
    
    return null;
  };

  const helpContent = getHelpContent();

  if (!helpContent) return null;

  return (
    <Card className={`${className} border-sidebar-border bg-sidebar/95 backdrop-blur-sm shadow-lg animate-fade-in`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-sm">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-heading font-semibold text-foreground">
                {helpContent.title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {helpContent.description}
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {lang('contextualHelp.quickTips')}
          </p>
          <ul className="space-y-2">
            {helpContent.tips.map((tip, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2 bg-accent/50 p-2 rounded-lg">
                <span className="text-primary font-bold text-sm">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {helpContent.videoUrl && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg font-medium"
            >
              🎥 {lang('contextualHelp.watchTutorial')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
