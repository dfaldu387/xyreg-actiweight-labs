# Gantt Chart Phase Document Integration

This implementation adds the ability to click on **sub-tasks** in the Gantt chart to view all phase-assigned documents **inline below the chart**.

## Features

- **Smart Click Detection**: Only shows documents when clicking on sub-tasks (Document, Gap Analysis, Activities, Audit)
- **Main Phase Clearing**: Clicking on main phase tasks clears the document list
- **Inline Document Display**: Shows all documents assigned to the selected phase below the chart
- **Document Status Tracking**: Displays completion status, progress, and document details
- **No Popups**: Everything displays in the same view for better user experience
- **Responsive UI**: Beautiful inline cards with Material-UI components

## Components

### 1. WxGanttChart (Enhanced)
- **Location**: `src/components/product/timeline/WxGanttChart.tsx`
- **New Props**:
  - `companyId?: string` - Required for fetching phase documents
  - `productId?: string` - Optional, for product-specific documents
- **Enhanced Click Handler**: Detects sub-tasks and loads documents inline

### 2. Inline Document Display
- **Location**: Built into `WxGanttChart.tsx`
- **Purpose**: Displays all documents assigned to a specific phase below the chart
- **Features**:
  - Document cards with status indicators
  - Completion progress bar
  - Document details (due dates, file sizes, etc.)
  - Loading states and error handling
  - No popup dialogs - everything inline

### 3. GanttPhaseDocumentService
- **Location**: `src/services/ganttPhaseDocumentService.ts`
- **Purpose**: Service to fetch phase-assigned documents from the database
- **Methods**:
  - `getPhaseDocuments()` - Get documents for a specific phase
  - `getPhaseDocumentSummary()` - Get summary with completion stats
  - `getMultiplePhaseDocuments()` - Get documents for multiple phases
  - `getAllCompanyPhaseDocuments()` - Get all company phase documents

## Usage

### Basic Usage

```tsx
import { WxGanttChart } from './components/product/timeline/WxGanttChart';

function MyComponent() {
  const tasks = [
    {
      id: 1,
      text: "Design Control Phase",
      start: new Date(2024, 5, 11),
      end: new Date(2024, 6, 12),
      type: "summary",
      phase_id: "design-control-phase-id", // Real phase ID from database
      parent: 0,
    },
    // ... more tasks
  ];

  return (
    <WxGanttChart
      tasks={tasks}
      companyId="your-company-id"
      productId="your-product-id" // optional
      onTaskClick={(task) => console.log('Task clicked:', task)}
    />
  );
}
```

### Task Structure for Document Display

The component shows documents when clicking on sub-tasks based on:

1. **Sub-Task Detection**: Task has a parent (`task.parent && task.parent !== 0`)
2. **Task Text Keywords**: Contains "document", "gap analysis", "activities", "audit", "milestone", "deliverable"
3. **Phase ID**: Uses the parent phase ID to fetch documents
4. **Main Phase Clearing**: Clicking main phases (parent === 0) clears the document list

### Example Task Structure

```tsx
// Main Phase Task - Clicking clears documents
const mainPhaseTask = {
  id: 1,
  text: "Design Control Phase",
  start: new Date(2024, 5, 11),
  end: new Date(2024, 6, 12),
  type: "summary",
  phase_id: "design-control-phase-id",
  parent: 0, // No parent = main phase
};

// Sub-Task - Clicking shows documents
const subTask = {
  id: 2,
  text: "Document", // or "Gap Analysis", "Activities", "Audit"
  start: new Date(2024, 5, 12),
  end: new Date(2024, 5, 20),
  parent: 1, // Has parent = sub-task
  type: "task",
  phase_id: "design-control-phase-id", // Uses parent phase ID
};
```

## Database Integration

The service integrates with the following database tables:

- `phase_assigned_document_template` - Phase document templates
- `documents` - Product-specific documents
- `company_phases` - Company phase definitions

## Styling

The components use Material-UI with custom styling:
- Clean inline card layout below the chart
- Progress bars for completion tracking
- Status chips with color coding
- Hover effects and animations
- Responsive design
- No popup overlays - everything in the main view

## Error Handling

- Graceful fallback when no documents are found
- Error messages for failed database queries
- Loading states during data fetching
- Console logging for debugging

## Future Enhancements

Potential improvements:
- Document upload/editing from the dialog
- Drag-and-drop document reordering
- Document status updates
- Integration with document review workflows
- Export functionality for phase documents
