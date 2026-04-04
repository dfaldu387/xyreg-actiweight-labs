export interface HelpTopic {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
  videoUrl?: string;
  relatedTopics?: string[];
  searchKeywords?: string[];
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Essential first steps and basic navigation',
    icon: 'Play',
    order: 1
  },
  {
    id: 'advanced-phase-management',
    name: 'Advanced Phase Management',
    description: 'Phase dependencies, scheduling, and timeline management',
    icon: 'GitBranch',
    order: 2
  },
  {
    id: 'timeline-scheduling',
    name: 'Timeline & Scheduling',
    description: 'Timeline views, Gantt charts, and dependency visualization',
    icon: 'Clock',
    order: 3
  },
  {
    id: 'dependencies-constraints',
    name: 'Dependencies & Constraints',
    description: 'Phase relationships, validation, and constraint management',
    icon: 'Link',
    order: 4
  },
  {
    id: 'product-management',
    name: 'Product Management',
    description: 'Creating and managing product lifecycles',
    icon: 'Package',
    order: 5
  },
  {
    id: 'company-management',
    name: 'Company Management',
    description: 'Company settings, team management, and configuration',
    icon: 'Building',
    order: 6
  },
  {
    id: 'document-control',
    name: 'Document Control',
    description: 'Document management, templates, and workflows',
    icon: 'FileText',
    order: 7
  },
  {
    id: 'compliance-tracking',
    name: 'Compliance & Gap Analysis',
    description: 'Regulatory compliance and gap analysis tools',
    icon: 'Shield',
    order: 8
  }
];

export const helpTopics: HelpTopic[] = [
  // Critical Updates - Phase Dependencies
  {
    id: 'phase-dependencies-guide',
    title: 'Phase Dependencies: Complete Guide',
    category: 'advanced-phase-management',
    tags: ['dependencies', 'phases', 'FS', 'FF', 'SS', 'SF', 'critical'],
    content: `# Understanding Phase Dependencies

Phase dependencies define the relationships between development phases, ensuring proper sequencing and timeline management.

## Dependency Types

### Finish-to-Start (FS) 
**Most Common Dependency**
- Phase B cannot start until Phase A finishes
- Example: Design phase cannot start until Concept phase completes
- **Use Case**: Sequential workflow where output of one phase is required for the next

### Finish-to-Finish (FF)
**Parallel Completion**
- Phase B cannot finish until Phase A finishes
- Example: Documentation cannot be completed until Development is finished
- **Use Case**: Phases that run in parallel but must complete together

### Start-to-Start (SS)
**Synchronized Start**
- Phase B cannot start until Phase A starts
- Example: Quality planning starts when development planning begins
- **Use Case**: Parallel activities that must begin together

### Start-to-Finish (SF)
**Rare but Critical**
- Phase B cannot finish until Phase A starts
- Example: Old system support cannot end until new system goes live
- **Use Case**: Handover scenarios and system transitions

## Setting Up Dependencies

### Company-Level Dependencies (Templates)
1. Navigate to **Company Settings > Phase Management**
2. Select **Phase Dependencies** tab
3. Choose source and target phases
4. Select dependency type (FS, FF, SS, SF)
5. Set lag days (delay between dependency completion and dependent phase start)

### Product-Level Dependencies (Overrides)
1. Open product timeline view
2. Click **Manage Dependencies** 
3. Add product-specific dependencies that override company defaults
4. Use for unique project requirements or exceptions

## Lag Days and Lead Time

**Lag Days**: Delay between dependency completion and dependent phase start
- Positive lag: Wait period (e.g., 5 days for approvals)
- Negative lag: Overlap period (e.g., -2 days for early start)

**Examples**:
- Design → Prototyping (FS + 3 days lag for design review)
- Testing → Documentation (FF + 0 days for simultaneous completion)

## Dependency Validation

The system automatically validates dependencies to prevent:
- **Circular Dependencies**: Phase A depends on Phase B, which depends on Phase A
- **Schedule Conflicts**: Dependencies that create impossible timelines
- **Missing Prerequisites**: Phases that depend on non-existent phases

### Validation Messages
- ⚠️ **Warning**: Potential scheduling conflict detected
- ❌ **Error**: Circular dependency prevents schedule calculation
- ✅ **Valid**: All dependencies are properly configured

## Automated Scheduling

When dependencies are configured, the system can:
1. **Calculate Schedule**: Automatically determine phase start/end dates
2. **Validate Changes**: Check if phase moves violate dependencies
3. **Propagate Updates**: Update dependent phases when a phase changes

### Using Schedule Calculator
1. Open company or product timeline
2. Click **Calculate Schedule**
3. Review proposed dates
4. Click **Apply Schedule** to update all phases

## Best Practices

### 1. Start with Company Templates
- Set up common dependency patterns at company level
- Use product-level overrides only when necessary
- Maintain consistency across similar products

### 2. Keep Dependencies Simple
- Use Finish-to-Start (FS) for most sequential workflows
- Minimize complex dependency chains
- Document unusual dependency patterns

### 3. Plan for Iterations
- Medical device development often requires iteration
- Use lag days to account for review and approval cycles
- Consider parallel workstreams where possible

### 4. Regular Validation
- Review dependencies quarterly
- Update based on actual project experience
- Remove obsolete or unnecessary dependencies

## Common Patterns

### Linear Development
\`\`\`
Concept (FS+5) → Design (FS+3) → Development (FS+7) → Testing (FS+14) → Approval
\`\`\`

### Parallel with Gates
\`\`\`
Design Planning (SS) → Hardware Development
Design Planning (SS) → Software Development
Hardware Dev (FF) → Integration Testing
Software Dev (FF) → Integration Testing
\`\`\`

### Regulatory Overlap
\`\`\`
Development (FS-30) → Regulatory Prep (parallel start 30 days before dev completion)
Testing (FF) → Submission Prep (must finish together)
\`\`\`

## Troubleshooting

### Schedule Won't Calculate
1. Check for circular dependencies
2. Verify all referenced phases exist
3. Ensure realistic lag times
4. Review constraint violations

### Unexpected Timeline
1. Review lag day settings
2. Check for parallel vs sequential patterns
3. Validate dependency directions (FS vs FF)
4. Consider weekends and holidays in calculations

### Performance Issues
1. Limit dependency chains to 10-15 levels
2. Avoid excessive cross-product dependencies
3. Use company templates instead of duplicate product dependencies

For additional support, see related topics on Timeline Views and Schedule Management.`,
    lastUpdated: '2024-01-15',
    priority: 'high',
    videoUrl: '/tutorials/phase-dependencies.mp4',
    relatedTopics: ['timeline-views-overview', 'automated-scheduling', 'dependency-validation'],
    searchKeywords: ['FS', 'FF', 'SS', 'SF', 'dependencies', 'scheduling', 'lag days', 'prerequisites']
  },

  // Timeline Views Overview
  {
    id: 'timeline-views-overview',
    title: 'Timeline Views: Navigation Guide',
    category: 'timeline-scheduling',
    tags: ['timeline', 'gantt', 'views', 'navigation', 'critical'],
    content: `# Timeline Views Overview

Multiple timeline viewing options provide different perspectives on your product development progress.

## Available Timeline Views

### 1. Enhanced Gantt Chart
**Best for**: Project management and dependency visualization

**Features**:
- Interactive drag-and-drop timeline adjustment
- Real-time dependency validation
- Phase progress indicators
- Resource allocation view
- Critical path highlighting

**When to Use**:
- Managing complex projects with multiple dependencies
- Adjusting timelines based on resource availability
- Identifying schedule bottlenecks and critical paths

### 2. Phase Detail View
**Best for**: Detailed phase analysis and CI management

**Features**:
- Compliance Intelligence (CI) breakdown per phase
- Document, activity, and audit progress bars
- Phase-specific milestone tracking
- Status indicators and progress metrics

**When to Use**:
- Deep-diving into specific phase requirements
- Tracking document completion and compliance activities
- Managing phase-specific deliverables

### 3. Timeline Manager
**Best for**: High-level project overview and navigation

**Features**:
- Simplified phase visualization
- Quick navigation between phases
- Progress summary and key metrics
- Status at-a-glance indicators

**When to Use**:
- Executive reporting and status updates
- Quick project health assessment
- Navigation hub for detailed views

### 4. Milestones View
**Best for**: Milestone and deliverable tracking

**Features**:
- Milestone organization by phase
- Due date tracking and alerts
- Deliverable status management
- Cross-phase milestone dependencies

**When to Use**:
- Tracking key project deliverables
- Managing milestone dependencies
- Monitoring critical deadlines

## Navigation Between Views

### From Product Dashboard
1. **Timeline Tab**: Access Timeline Manager (overview)
2. **Milestones Tab**: Open Milestones View
3. **Phase Cards**: Click any phase to enter Phase Detail View

### Within Timeline Views
- **Expand Phase**: Click phase name to enter detailed view
- **Gantt Mode**: Use "Gantt View" toggle for interactive timeline
- **Back to Overview**: Breadcrumb navigation or "Timeline" button

### View-Specific Navigation
- **Gantt Chart**: Zoom controls (day/week/month view)
- **Phase Detail**: Previous/Next phase navigation
- **Milestones**: Filter by phase or due date

## View Selection Guide

### Project Planning Stage
**Use Gantt Chart** for:
- Setting up initial phase schedules
- Configuring dependencies
- Resource planning and allocation

### Active Development
**Use Phase Detail View** for:
- Daily progress tracking
- Document completion monitoring
- Activity and audit management

### Status Reporting
**Use Timeline Manager** for:
- Executive dashboards
- Client status updates
- High-level progress summaries

### Milestone Management
**Use Milestones View** for:
- Deliverable tracking
- Due date management
- Cross-functional coordination

## Interactive Features

### Drag and Drop (Gantt Chart)
- **Phase Bars**: Drag to adjust start/end dates
- **Dependencies**: Drag from phase to phase to create relationships
- **Milestones**: Drag milestone markers to adjust due dates

### Click Actions
- **Phase Names**: Open detailed phase view
- **Progress Bars**: Show completion details
- **Status Indicators**: Display status change options

### Keyboard Shortcuts
- **Arrow Keys**: Navigate between phases
- **Enter**: Open selected phase details
- **Escape**: Return to overview
- **Space**: Toggle phase expansion

## Mobile and Responsive Design

### Mobile Optimizations
- **Vertical Timeline**: Stacked phase layout for mobile
- **Touch Gestures**: Swipe navigation between phases
- **Simplified Controls**: Essential actions only

### Tablet View
- **Hybrid Layout**: Combines overview with detail panel
- **Touch-Friendly**: Larger interaction targets
- **Context Menus**: Long-press for additional options

## Customization Options

### Display Preferences
- **Date Format**: Choose date display format
- **Time Scale**: Daily, weekly, or monthly view
- **Color Coding**: Phase status or category colors

### Layout Options
- **Compact View**: Reduced spacing for more phases
- **Expanded View**: More detail per phase
- **Split View**: Multiple timeline views simultaneously

## Performance Considerations

### Large Projects
- **Lazy Loading**: Phases load as needed
- **Virtualization**: Smooth scrolling with many phases
- **Caching**: Recently viewed phases cached for speed

### Real-Time Updates
- **Live Sync**: Changes reflect immediately across views
- **Conflict Resolution**: Handles multiple user edits
- **Version Control**: Track timeline change history

## Integration Points

### With Other Modules
- **Documents**: Timeline shows document completion status
- **Activities**: Phase progress reflects activity completion
- **Audits**: Audit schedule integrated with phase timeline
- **Milestones**: Cross-referenced in all timeline views

### External Systems
- **Calendar Integration**: Export key dates to external calendars
- **Project Management**: Sync with external PM tools
- **Reporting Tools**: Export timeline data for reports

For specific view tutorials, see Phase Detail Navigation and Gantt Chart Management guides.`,
    lastUpdated: '2024-01-15',
    priority: 'high',
    videoUrl: '/tutorials/timeline-navigation.mp4',
    relatedTopics: ['phase-detail-navigation', 'gantt-chart-management', 'phase-dependencies-guide'],
    searchKeywords: ['timeline', 'gantt', 'views', 'navigation', 'phases', 'milestones', 'drag drop']
  },

  // Phase Detail Navigation
  {
    id: 'phase-detail-navigation',
    title: 'Phase Detail Views: Deep Dive Guide',
    category: 'timeline-scheduling',
    tags: ['phase detail', 'navigation', 'CI', 'progress', 'critical'],
    content: `# Phase Detail Views: Deep Dive

Phase detail views provide comprehensive insights into individual phase progress, compliance activities, and deliverable tracking.

## Accessing Phase Detail Views

### From Timeline Manager
1. Click on any phase name or progress bar
2. Use "View Details" button on phase cards
3. Navigate via breadcrumb links

### From Gantt Chart
1. Double-click on phase bar
2. Right-click and select "Phase Details"
3. Use phase expansion controls

### Direct Navigation
- URL pattern: \`/app/product/{productId}/phase/{phaseId}\`
- Bookmark frequently accessed phases
- Use browser back/forward for navigation history

## Phase Detail Components

### Header Section
**Phase Information**:
- Phase name and description
- Current status (Open, Closed, N/A)
- Start and end dates (actual vs planned)
- Overall progress percentage

**Quick Actions**:
- Status change controls
- Phase settings access
- Timeline integration toggle

### Compliance Intelligence (CI) Breakdown

#### Documents Section
**Progress Tracking**:
- Total documents vs completed
- Visual progress bar with percentage
- Document status indicators (draft, review, approved)
- Missing document alerts

**Actions**:
- Quick document creation
- Bulk status updates
- Template application
- Document linking and organization

#### Gap Analysis Section
**Compliance Monitoring**:
- Regulatory gaps identified
- Risk assessment scores
- Compliance percentage by framework
- Action item tracking

**Management**:
- Gap remediation planning
- Priority assignment
- Due date tracking
- Resolution status updates

#### Activities Section
**Task Management**:
- Phase-specific activities
- Completion tracking
- Assignment and responsibility
- Timeline integration

**Workflow**:
- Activity dependencies
- Approval workflows
- Status progression
- Notification management

#### Audits Section
**Quality Assurance**:
- Scheduled audits for the phase
- Audit completion status
- Finding and corrective action tracking
- Compliance verification

### Interactive Timeline

#### Phase-Focused View
- **Current Phase Highlight**: Emphasizes the selected phase
- **Related Activities**: Shows CI activities on timeline
- **Milestone Integration**: Phase milestones and deliverables
- **Dependency Visualization**: Upstream and downstream connections

#### Navigation Controls
- **Zoom**: Day, week, month granularity
- **Pan**: Scroll through timeline
- **Phase Switching**: Quick navigation to other phases
- **Milestone Filtering**: Show/hide different milestone types

## Progress Tracking

### Completion Metrics

#### Document Progress
- **Calculation**: (Completed Documents / Total Required) × 100
- **Weighting**: Critical documents may have higher weight
- **Status Tracking**: Draft → Review → Approved progression

#### Activity Progress
- **Task Completion**: Binary completion tracking
- **Effort Tracking**: Hours/days spent vs estimated
- **Quality Metrics**: Review and approval cycles

#### Gap Analysis Progress
- **Resolution Rate**: Closed gaps / Total identified gaps
- **Risk Reduction**: High-risk gaps prioritized
- **Compliance Score**: Overall regulatory compliance percentage

### Visual Indicators

#### Progress Bars
- **Color Coding**: Green (complete), Yellow (in-progress), Red (overdue)
- **Segmented Bars**: Show different CI categories
- **Animation**: Real-time updates with smooth transitions

#### Status Icons
- ✅ **Complete**: All requirements met
- 🔄 **In Progress**: Active work ongoing
- ⚠️ **At Risk**: Behind schedule or missing requirements
- ❌ **Blocked**: Cannot proceed due to dependencies

## Phase Status Management

### Status Options

#### Open
- **Definition**: Phase is active and work is ongoing
- **Characteristics**: Can be edited, activities can be added/completed
- **Transitions**: Can move to Closed or N/A

#### Closed
- **Definition**: Phase work is complete and verified
- **Validation**: System checks for completion requirements
- **Restrictions**: Limited editing, requires reopening for changes

#### N/A (Not Applicable)
- **Definition**: Phase doesn't apply to this product type
- **Use Cases**: Product-specific phase exclusions
- **Impact**: Excluded from timeline and dependency calculations

### Status Change Process
1. **Validation Check**: System verifies completion requirements
2. **Dependency Verification**: Ensures prerequisites are met
3. **User Confirmation**: Confirms intent to change status
4. **Audit Trail**: Records status change with timestamp and user

## Advanced Features

### Phase Comparison
- **Multi-Phase View**: Compare progress across phases
- **Benchmark Analysis**: Compare to similar products
- **Timeline Overlay**: Show multiple phases simultaneously

### Export and Reporting
- **Phase Reports**: Detailed progress reports
- **Timeline Export**: Calendar integration
- **Data Export**: CSV/Excel for external analysis

### Collaboration Tools
- **Comments**: Phase-specific discussion threads
- **@Mentions**: Notify team members
- **File Sharing**: Phase-related document sharing
- **Activity Feed**: Real-time updates and changes

## Mobile Optimization

### Touch Interface
- **Swipe Navigation**: Move between phases
- **Tap Interactions**: Quick status updates
- **Pinch Zoom**: Timeline manipulation

### Responsive Layout
- **Stacked Components**: Vertical layout for mobile
- **Collapsible Sections**: Expand/collapse for focus
- **Priority Information**: Most important data prioritized

## Integration Points

### With Other Views
- **Timeline Manager**: Seamless return to overview
- **Gantt Chart**: Direct access to interactive timeline
- **Milestones**: Phase-specific milestone management

### With CI Systems
- **Document Management**: Direct document access and editing
- **Activity Management**: Task creation and completion
- **Audit System**: Audit scheduling and tracking

## Troubleshooting

### Performance Issues
- **Large Phases**: Pagination for phases with many CIs
- **Real-Time Updates**: Optimize refresh frequency
- **Browser Cache**: Clear cache for latest data

### Navigation Problems
- **Breadcrumb Links**: Always available for navigation
- **Browser Back**: Properly configured navigation history
- **Bookmark Support**: Direct links to specific phase details

### Data Synchronization
- **Auto-Save**: Changes saved automatically
- **Conflict Resolution**: Handle concurrent edits
- **Offline Support**: Basic functionality when offline

For more information, see Timeline Views Overview and Gantt Chart Management guides.`,
    lastUpdated: '2024-01-15',
    priority: 'high',
    videoUrl: '/tutorials/phase-detail-views.mp4',
    relatedTopics: ['timeline-views-overview', 'phase-dependencies-guide', 'gantt-chart-management'],
    searchKeywords: ['phase detail', 'CI', 'compliance intelligence', 'documents', 'activities', 'audits', 'progress']
  },

  // Gantt Chart Management
  {
    id: 'gantt-chart-management',
    title: 'Interactive Gantt Chart Guide',
    category: 'timeline-scheduling',
    tags: ['gantt', 'interactive', 'drag drop', 'timeline', 'advanced'],
    content: `# Interactive Gantt Chart Management

The Enhanced Gantt Chart provides powerful project management capabilities with drag-and-drop timeline editing and real-time dependency validation.

## Getting Started

### Accessing Gantt Chart
1. **From Product Timeline**: Click "Gantt View" toggle
2. **From Dashboard**: Select "Timeline" then "Gantt Chart"
3. **Direct Link**: Navigate to timeline and enable Gantt mode

### Interface Overview
- **Timeline Header**: Date scale with zoom controls
- **Phase Bars**: Horizontal bars representing phase duration
- **Dependency Lines**: Arrows showing phase relationships
- **Progress Indicators**: Completion percentage overlays

## Interactive Features

### Drag and Drop Timeline Editing

#### Moving Phase Start/End Dates
1. **Hover** over phase bar edges until cursor changes to resize
2. **Drag** left or right to adjust start or end date
3. **Real-time validation** shows dependency conflicts
4. **Release** to apply changes or ESC to cancel

#### Moving Entire Phases
1. **Click and hold** anywhere on phase bar
2. **Drag** horizontally to move entire phase
3. **Dependency arrows** update automatically
4. **Validation** prevents invalid moves

#### Timeline Constraints
- **Minimum Duration**: Phases cannot be shorter than 1 day
- **Dependency Validation**: Moves that violate dependencies are blocked
- **Working Days**: Automatically adjusts for weekends and holidays

### Zoom and Navigation Controls

#### Zoom Levels
- **Day View**: Detailed daily timeline (1-30 day range)
- **Week View**: Weekly granularity (1-12 month range)
- **Month View**: Monthly overview (1-3 year range)
- **Auto Zoom**: Automatically fits project timeline

#### Navigation
- **Scroll**: Use mouse wheel or trackpad to pan timeline
- **Zoom Controls**: Plus/minus buttons or keyboard shortcuts
- **Mini-map**: Overview navigator for large projects
- **Today Marker**: Vertical line showing current date

### Dependency Management

#### Creating Dependencies
1. **Hover** over source phase until connection point appears
2. **Click and drag** to target phase
3. **Select dependency type** from popup (FS, FF, SS, SF)
4. **Set lag days** if needed
5. **Confirm** to create dependency

#### Editing Dependencies
- **Click dependency line** to select
- **Right-click** for context menu with edit/delete options
- **Properties panel** shows dependency details
- **Validation warnings** appear for conflicts

#### Dependency Visualization
- **Arrow Types**: Different styles for FS, FF, SS, SF
- **Color Coding**: Green (valid), Red (conflict), Yellow (warning)
- **Critical Path**: Bold arrows for critical dependencies
- **Lag Indicators**: Numbers show lag days on arrows

## Advanced Timeline Features

### Phase Status Visualization

#### Status Colors
- **Green**: Completed phases
- **Blue**: Current/active phases  
- **Gray**: Future phases
- **Red**: Overdue phases
- **Orange**: At-risk phases

#### Progress Overlays
- **Completion Bars**: Show percentage complete within phase bars
- **Milestone Markers**: Key deliverables marked on timeline
- **Today Line**: Vertical indicator of current date
- **Baseline Comparison**: Original vs current timeline overlay

### Resource and Capacity Planning

#### Resource Allocation
- **Team Assignment**: Assign team members to phases
- **Capacity Indicators**: Show resource over/under allocation
- **Workload Distribution**: Visual workload across timeline
- **Skill Matching**: Match required skills to team capabilities

#### Capacity Management
- **Resource Conflicts**: Highlight over-allocated resources
- **Load Balancing**: Suggestions for better resource distribution
- **Availability Calendar**: Team member availability integration
- **External Resources**: Track consultant and vendor involvement

### Critical Path Analysis

#### Critical Path Identification
- **Longest Path**: Automatically calculated critical path
- **Critical Activities**: Phases that affect project end date
- **Slack Time**: Available buffer time for non-critical phases
- **Path Visualization**: Highlighted critical path on timeline

#### Impact Analysis
- **What-If Scenarios**: Test impact of schedule changes
- **Delay Propagation**: See how delays affect downstream phases
- **Recovery Options**: Suggestions for schedule recovery
- **Risk Assessment**: Identify phases most likely to cause delays

## Timeline Validation and Constraints

### Automatic Validation

#### Dependency Conflicts
- **Circular Dependencies**: Automatic detection and prevention
- **Impossible Schedules**: Validation of realistic timelines
- **Resource Conflicts**: Over-allocation warnings
- **Constraint Violations**: Business rule enforcement

#### Real-Time Feedback
- **Visual Warnings**: Red highlights for conflicts
- **Error Messages**: Specific constraint violation details
- **Suggestion Engine**: Recommendations for conflict resolution
- **Undo/Redo**: Easy reversal of problematic changes

### Manual Validation Tools
- **Schedule Check**: On-demand validation of entire timeline
- **Dependency Audit**: Review all dependencies for accuracy
- **Resource Analysis**: Check resource allocation and conflicts
- **Baseline Comparison**: Compare current vs planned schedule

## Data Export and Integration

### Export Options
- **PDF Timeline**: High-quality timeline charts for presentations
- **Excel/CSV**: Detailed schedule data for external analysis
- **Project Files**: Export to MS Project, Primavera, etc.
- **Calendar Integration**: Sync key dates with external calendars

### Real-Time Collaboration
- **Multi-User Editing**: See other users' changes in real-time
- **Change Notifications**: Alerts when others modify timeline
- **Conflict Resolution**: Handle simultaneous edits gracefully
- **Comment System**: Discussion threads on timeline elements

## Mobile and Touch Support

### Touch Gestures
- **Pinch Zoom**: Zoom in/out on timeline
- **Pan**: Swipe to navigate timeline
- **Tap**: Select phases and dependencies
- **Long Press**: Context menus and detailed information

### Mobile Optimizations
- **Responsive Layout**: Adapts to screen size
- **Touch Targets**: Larger interaction areas
- **Simplified Interface**: Essential features prioritized
- **Offline Support**: Basic functionality without connection

## Customization and Preferences

### Display Options
- **Date Formats**: Choose preferred date display
- **Time Zones**: Multi-timezone project support
- **Color Themes**: Light/dark mode and custom colors
- **Layout Density**: Compact or expanded view options

### User Preferences
- **Default Zoom**: Preferred initial zoom level
- **Auto-Save**: Frequency of automatic saves
- **Notification Settings**: Types of alerts and warnings
- **Keyboard Shortcuts**: Customizable hotkey assignments

## Performance Optimization

### Large Project Handling
- **Lazy Loading**: Load phases as needed
- **Virtualization**: Smooth scrolling with many phases
- **Data Paging**: Manage large datasets efficiently
- **Caching Strategy**: Optimize for frequent access patterns

### Browser Compatibility
- **Modern Browsers**: Full feature support in Chrome, Firefox, Safari, Edge
- **Fallback Options**: Basic functionality in older browsers
- **Performance Monitoring**: Automatic performance optimization
- **Memory Management**: Efficient handling of large timelines

## Troubleshooting

### Common Issues
- **Slow Performance**: Reduce visible date range or phase count
- **Drag Issues**: Ensure browser allows drag/drop, check browser settings
- **Save Problems**: Check network connection and permissions
- **Display Problems**: Clear browser cache, update browser

### Error Recovery
- **Auto-Save Recovery**: Restore unsaved changes after crashes
- **Version History**: Access previous timeline versions
- **Backup System**: Automatic backups of timeline data
- **Support Tools**: Diagnostic information for support requests

For more advanced features, see Phase Dependencies Guide and Automated Scheduling documentation.`,
    lastUpdated: '2024-01-15',
    priority: 'high',
    videoUrl: '/tutorials/gantt-chart-interactive.mp4',
    relatedTopics: ['phase-dependencies-guide', 'timeline-views-overview', 'automated-scheduling'],
    searchKeywords: ['gantt', 'interactive', 'drag drop', 'timeline', 'dependencies', 'critical path', 'resource management']
  },

  // Updated Product Lifecycle Management
  {
    id: 'product-lifecycle',
    title: 'Product Lifecycle Management',
    category: 'product-management',
    tags: ['product', 'lifecycle', 'phases', 'management', 'updated'],
    content: `# Product Lifecycle Management

Comprehensive guide to managing product development from concept to post-market surveillance using XYREG's advanced phase management system.

## Overview

Product lifecycle management in XYREG provides:
- **Multi-Level Phase Configuration**: Company templates with product-specific overrides
- **Advanced Timeline Views**: Multiple visualization options for different needs
- **Dependency Management**: Complex phase relationships with validation
- **Progress Tracking**: Real-time progress across all compliance activities

## Lifecycle Phases Structure

### Company-Level Phase Templates
**Purpose**: Standardized phase templates applied across all company products

**Standard Phases**:
1. **Concept & Feasibility** - Initial idea validation and market research
2. **Design & Development** - Detailed design and prototyping
3. **Verification & Validation** - Testing and performance verification
4. **Clinical Validation** - Clinical studies and user testing
5. **Regulatory Submission** - Regulatory approval process
6. **Design Transfer & Launch** - Manufacturing setup and market launch
7. **Post-Market Surveillance** - Ongoing monitoring and compliance

### Product-Level Customization
**Purpose**: Product-specific adaptations while maintaining company standards

**Customization Options**:
- Phase inclusion/exclusion based on product type
- Modified duration and resource requirements
- Product-specific dependencies and constraints
- Custom milestones and deliverables

## Advanced Phase Management

### Phase Dependencies System

#### Company Template Dependencies
Set up standard dependency patterns that apply to all products:

**Common Patterns**:
- **Sequential Development**: Concept → Design → Development → Testing → Approval
- **Parallel Activities**: Design Planning triggers both Hardware and Software development
- **Regulatory Overlap**: Regulatory preparation starts before development completion

#### Product Dependency Overrides
Override company templates for specific product requirements:

**Override Scenarios**:
- Software-only products skip hardware validation phases
- Class III devices require additional clinical phases
- Combination products need parallel approval pathways

### Timeline Management

#### Enhanced Gantt Chart
**Features**:
- Drag-and-drop timeline adjustment
- Real-time dependency validation
- Critical path identification
- Resource allocation visualization

**Use Cases**:
- Project planning and resource allocation
- Schedule optimization and conflict resolution
- What-if scenario analysis

#### Phase Detail Views
**Compliance Intelligence Breakdown**:
- **Documents**: Track document completion by phase
- **Gap Analysis**: Monitor regulatory compliance gaps
- **Activities**: Manage phase-specific tasks and deliverables
- **Audits**: Schedule and track quality audits

**Progress Tracking**:
- Visual progress bars for each CI category
- Completion percentages and status indicators
- Risk identification and mitigation tracking

#### Timeline Manager
**High-Level Overview**:
- Executive dashboard view
- Key milestone tracking
- Cross-phase progress summary
- Status at-a-glance indicators

### Progress Tracking and Metrics

#### Phase Completion Criteria
**Document Completion**:
- Required documents for phase closure
- Approval workflows and sign-offs
- Template compliance verification

**Activity Completion**:
- Phase-specific task completion
- Quality gates and checkpoints
- Stakeholder approval requirements

**Compliance Verification**:
- Regulatory requirement fulfillment
- Gap analysis completion
- Audit findings resolution

#### Real-Time Progress Updates
- Automatic progress calculation based on CI completion
- Visual indicators for at-risk phases
- Notification system for milestone achievements
- Dashboard updates across all views

## Phase Status Management

### Status Types

#### Open
- Active development phase
- All activities and documents can be modified
- Progress tracking actively updated
- Team collaboration and communication enabled

#### Closed
- Phase work completed and verified
- Limited editing capabilities
- Formal closure documentation
- Triggers dependent phase start (if applicable)

#### N/A (Not Applicable)
- Phase excluded for specific product type
- Removed from timeline calculations
- No compliance requirements
- Automatic dependency resolution

### Status Change Validation
**Prerequisites Check**:
- All required documents completed and approved
- Critical activities finished
- Dependencies satisfied
- Quality gates passed

**Impact Analysis**:
- Effect on dependent phases
- Timeline implications
- Resource reallocation needs
- Risk assessment updates

## Multi-Product Portfolio Management

### Company Portfolio View
**Portfolio Metrics**:
- Products by lifecycle phase distribution
- Overall portfolio health indicators
- Resource allocation across products
- Timeline conflict identification

**Bulk Operations**:
- Apply company template updates across products
- Standardize phase configurations
- Update dependency patterns globally
- Sync regulatory requirement changes

### Product Comparison and Benchmarking
**Comparative Analysis**:
- Phase duration comparisons
- Resource utilization patterns
- Timeline efficiency metrics
- Success factor identification

**Best Practice Identification**:
- High-performing product patterns
- Optimal phase sequencing
- Resource allocation models
- Risk mitigation strategies

## Integration with Compliance Systems

### Document Management Integration
- Phase-specific document requirements
- Template application and compliance
- Version control and approval workflows
- Document linking and organization

### Gap Analysis Integration
- Regulatory framework mapping to phases
- Automated compliance checking
- Gap remediation tracking
- Risk assessment and mitigation

### Activity and Task Management
- Phase-specific activity templates
- Task assignment and tracking
- Workflow automation
- Progress reporting and escalation

### Audit and Quality Management
- Phase-based audit scheduling
- Finding tracking and resolution
- Corrective action implementation
- Quality metrics and reporting

## Advanced Features

### Automated Scheduling
**Schedule Calculation**:
- Dependency-based timeline generation
- Resource availability consideration
- Risk factor adjustments
- Optimization algorithms

**Schedule Validation**:
- Conflict detection and resolution
- Feasibility assessment
- Resource constraint checking
- Timeline risk analysis

### Scenario Planning
**What-If Analysis**:
- Timeline scenario testing
- Resource allocation alternatives
- Risk mitigation option evaluation
- Decision support modeling

### Reporting and Analytics
**Standard Reports**:
- Phase progress reports
- Timeline variance analysis
- Resource utilization reports
- Risk and issue summaries

**Custom Analytics**:
- KPI dashboard creation
- Trend analysis and forecasting
- Performance benchmarking
- Predictive modeling

## Best Practices

### Phase Setup
1. **Start with Company Templates**: Establish consistent patterns
2. **Customize Thoughtfully**: Only override when necessary
3. **Document Rationale**: Explain customization decisions
4. **Regular Review**: Update templates based on experience

### Timeline Management
1. **Realistic Estimates**: Use historical data for duration estimates
2. **Buffer Planning**: Include contingency time for critical phases
3. **Regular Updates**: Keep timelines current with actual progress
4. **Stakeholder Communication**: Share timeline changes promptly

### Progress Tracking
1. **Consistent Updates**: Regular progress reporting cadence
2. **Quality Focus**: Emphasize completion quality over speed
3. **Risk Monitoring**: Proactive identification and mitigation
4. **Continuous Improvement**: Learn from completed phases

For detailed information on specific features, see Phase Dependencies Guide, Timeline Views Overview, and Gantt Chart Management.`,
    lastUpdated: '2024-01-15',
    priority: 'high',
    videoUrl: '/tutorials/product-lifecycle-advanced.mp4',
    relatedTopics: ['phase-dependencies-guide', 'timeline-views-overview', 'gantt-chart-management', 'automated-scheduling'],
    searchKeywords: ['product lifecycle', 'phases', 'timeline', 'dependencies', 'progress tracking', 'compliance']
  },

  // Continue with other critical help topics...
  {
    id: 'automated-scheduling',
    title: 'Automated Scheduling & Validation',
    category: 'dependencies-constraints',
    tags: ['scheduling', 'automation', 'validation', 'dependencies'],
    content: `# Automated Scheduling & Validation

XYREG's automated scheduling engine calculates optimal timelines based on phase dependencies, resource constraints, and business rules.

## Schedule Calculation Engine

### How It Works
The scheduling engine:
1. **Analyzes Dependencies**: Processes all FS, FF, SS, SF relationships
2. **Calculates Critical Path**: Identifies phases that affect project end date
3. **Applies Constraints**: Considers resource availability and business rules
4. **Optimizes Timeline**: Finds optimal schedule within constraints

### Input Parameters
- **Phase Durations**: Estimated or historical duration data
- **Dependencies**: All configured phase relationships
- **Lag Times**: Delays between dependent phases
- **Resource Constraints**: Team availability and capacity
- **Business Rules**: Working days, holidays, blackout periods

## Using Schedule Calculator

### Company-Level Scheduling
1. Navigate to **Company Settings > Phase Management**
2. Click **Calculate Schedule** button
3. Review proposed timeline in preview
4. Adjust parameters if needed
5. Click **Apply to All Products** to update company template

### Product-Level Scheduling
1. Open product timeline view
2. Click **Calculate Schedule** button
3. Review impact on current timeline
4. Accept, modify, or reject proposed changes
5. Apply changes to update product timeline

### Bulk Scheduling
- **Portfolio Scheduling**: Calculate schedules for multiple products
- **Template Updates**: Apply schedule changes to product templates
- **Batch Processing**: Handle large numbers of products efficiently

## Validation Engine

### Dependency Validation

#### Circular Dependency Detection
**What it Checks**:
- Direct circular references (A → B → A)
- Indirect circular chains (A → B → C → A)
- Cross-product circular dependencies

**Resolution**:
- Identifies specific dependency causing cycle
- Suggests alternative dependency configurations
- Prevents schedule calculation until resolved

#### Constraint Validation
**Timeline Constraints**:
- Minimum/maximum phase durations
- Required sequence validation
- Deadline compliance checking

**Resource Constraints**:
- Team member availability
- Skill requirement matching
- Capacity limit validation

### Real-Time Validation

#### During Timeline Editing
- **Immediate Feedback**: Visual warnings for constraint violations
- **Suggestion Engine**: Proposed solutions for conflicts
- **Undo Support**: Easy reversal of problematic changes

#### Schedule Impact Analysis
- **Downstream Effects**: How changes affect dependent phases
- **Critical Path Impact**: Changes to project end date
- **Resource Reallocation**: Required resource adjustments

## Advanced Scheduling Features

### Resource-Aware Scheduling

#### Team Capacity Planning
- **Availability Calendar**: Integration with team schedules
- **Skill Matching**: Assign appropriate expertise to phases
- **Workload Balancing**: Prevent resource over-allocation
- **External Resources**: Include consultants and vendors

#### Capacity Optimization
- **Load Leveling**: Smooth resource utilization over time
- **Peak Shaving**: Identify and resolve resource conflicts
- **Efficiency Maximization**: Optimal resource allocation

### Risk-Adjusted Scheduling

#### Risk Factor Integration
- **Historical Variability**: Account for past schedule variance
- **Risk Assessment**: Weight phases by implementation risk
- **Buffer Allocation**: Automatic contingency time inclusion
- **Probability Modeling**: Monte Carlo simulation for timelines

#### Scenario Planning
- **Best Case**: Optimistic timeline scenarios
- **Worst Case**: Conservative timeline with maximum buffers
- **Most Likely**: Realistic timeline based on historical data
- **Custom Scenarios**: User-defined constraint sets

## Schedule Optimization

### Optimization Algorithms

#### Critical Path Method (CPM)
- **Longest Path**: Identifies schedule-limiting phase sequence
- **Float Calculation**: Available slack time for non-critical phases
- **Compression Analysis**: Options for schedule acceleration

#### Resource Constrained Scheduling
- **Resource Leveling**: Smooth resource demand over time
- **Resource Allocation**: Optimal assignment of limited resources
- **Constraint Resolution**: Balance schedule vs resource trade-offs

### Performance Metrics
- **Schedule Efficiency**: Timeline optimization vs constraints
- **Resource Utilization**: Percentage of available capacity used
- **Risk Mitigation**: Buffer effectiveness and risk coverage
- **Flexibility Index**: Ability to accommodate changes

## Validation Rules and Constraints

### Business Rules

#### Working Calendar
- **Business Days**: Exclude weekends from calculations
- **Holiday Calendar**: Company and regional holiday exclusions
- **Blackout Periods**: No-work periods (vacations, shutdowns)
- **Seasonal Adjustments**: Different rules for different times of year

#### Phase Constraints
- **Minimum Durations**: Phases cannot be shorter than specified minimums
- **Maximum Durations**: Upper limits on phase length
- **Sequence Requirements**: Mandatory phase ordering rules
- **Parallel Limitations**: Maximum number of concurrent phases

### Regulatory Constraints
- **Compliance Deadlines**: Regulatory submission windows
- **Approval Timelines**: Expected regulatory review periods
- **Clinical Requirements**: Minimum study durations and follow-up
- **Quality Standards**: Required review and approval cycles

## Error Handling and Resolution

### Common Validation Errors

#### "Circular Dependency Detected"
**Cause**: Phase A depends on Phase B which depends on Phase A
**Resolution**: 
1. Review dependency chain to identify cycle
2. Remove or modify one dependency to break cycle
3. Consider alternative dependency types (FS vs FF)

#### "Impossible Schedule"
**Cause**: Dependencies create timeline that cannot be satisfied
**Resolution**:
1. Increase phase durations
2. Reduce dependency lag times
3. Allow parallel activities where possible
4. Adjust project scope or constraints

#### "Resource Over-Allocation"
**Cause**: More work assigned than team capacity allows
**Resolution**:
1. Extend timeline to reduce resource demand
2. Add team members or external resources
3. Reprioritize activities within phases
4. Implement resource sharing across phases

### Automatic Resolution
- **Suggestion Engine**: Automated recommendations for fixing issues
- **One-Click Fixes**: Simple resolution for common problems
- **Guided Workflows**: Step-by-step issue resolution
- **Impact Preview**: See effects of proposed changes before applying

## Integration and APIs

### External System Integration
- **Calendar Systems**: Sync with Outlook, Google Calendar, etc.
- **Project Management**: Import/export to MS Project, Primavera
- **Resource Management**: Integration with HR and capacity planning systems
- **ERP Systems**: Connect with enterprise resource planning

### API Access
- **Schedule Calculation API**: Programmatic access to scheduling engine
- **Validation API**: Automated validation for external systems
- **Webhook Integration**: Real-time notifications of schedule changes
- **Data Export API**: Extract schedule data for reporting and analysis

## Troubleshooting

### Performance Issues
- **Large Projects**: Use hierarchical scheduling for complex projects
- **Frequent Recalculation**: Optimize dependency chains
- **Resource Complexity**: Simplify resource allocation models

### Accuracy Issues
- **Historical Data**: Improve estimates with actual duration tracking
- **Dependency Accuracy**: Regular review and refinement of dependencies
- **Constraint Modeling**: Better representation of real-world constraints

For additional guidance, see Phase Dependencies Guide and Timeline Views Overview.`,
    lastUpdated: '2024-01-15',
    priority: 'medium',
    videoUrl: '/tutorials/automated-scheduling.mp4',
    relatedTopics: ['phase-dependencies-guide', 'dependency-validation', 'timeline-views-overview'],
    searchKeywords: ['automated scheduling', 'validation', 'critical path', 'resource planning', 'constraints']
  }
];

// Additional utility functions for help system
export function getHelpTopicsByCategory(categoryId: string): HelpTopic[] {
  return helpTopics.filter(topic => topic.category === categoryId);
}

export function searchHelpTopics(query: string): HelpTopic[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return helpTopics.filter(topic => {
    const searchableContent = [
      topic.title,
      topic.content,
      ...topic.tags,
      ...(topic.searchKeywords || [])
    ].join(' ').toLowerCase();
    
    return searchTerms.some(term => searchableContent.includes(term));
  }).sort((a, b) => {
    // Prioritize by relevance and priority
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });
}

export function getRelatedTopics(topicId: string): HelpTopic[] {
  const topic = helpTopics.find(t => t.id === topicId);
  if (!topic?.relatedTopics) return [];
  
  return helpTopics.filter(t => topic.relatedTopics!.includes(t.id));
}