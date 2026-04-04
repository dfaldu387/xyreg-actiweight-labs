/**
 * Gantt Chart Utility Functions
 * 
 * Reusable utility functions for Gantt chart operations.
 * Pure functions with no side effects for easy testing.
 */

import { GanttLink, CascadingUpdate, ProductPhase, GanttTask } from '@/types/ganttChart';

/**
 * Calculate duration in days between two dates
 * Uses Math.ceil to include partial days
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
}

/**
 * Calculate duration in days (excluding end date)
 * Use this when you want business days calculation
 */
export function calculateBusinessDuration(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
}

/**
 * Format date to ISO string without time
 */
export function formatDateForDisplay(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse phase ID from Gantt task ID
 * Gantt tasks use format: "phase-{uuid}"
 */
export function parsePhaseIdFromTaskId(taskId: string | number): string | null {
  if (typeof taskId !== 'string' || !taskId.startsWith('phase-')) {
    return null;
  }
  return taskId.replace('phase-', '');
}

/**
 * Parse document ID from Gantt task ID
 * Document tasks use format: "doc-{uuid}"
 */
export function parseDocumentIdFromTaskId(taskId: string): string | null {
  if (typeof taskId !== 'string' || !taskId.startsWith('doc-')) {
    return null;
  }
  return taskId.replace('doc-', '');
}

/**
 * Check if task ID represents a document task
 */
export function isDocumentTask(taskId: string | number): boolean {
  return typeof taskId === 'string' && taskId.startsWith('doc-');
}

/**
 * Check if task ID represents a phase
 */
export function isPhaseTask(taskId: string | number): boolean {
  return typeof taskId === 'string' && taskId.startsWith('phase-');
}

/**
 * Detect if operation is a resize (duration changed) or move (position changed)
 */
export function detectOperationType(
  originalDuration: number,
  newDuration: number
): 'resize' | 'move' {
  return originalDuration !== newDuration ? 'resize' : 'move';
}

/**
 * Generate success message based on operation type
 */
export function generateSuccessMessage(
  phaseName: string,
  operationType: 'resize' | 'move',
  duration?: number
): string {
  if (operationType === 'resize' && duration !== undefined) {
    return `Updated ${phaseName}: ${duration} days`;
  }
  return `Updated ${phaseName}`;
}

/**
 * Calculate new end date based on start date and duration
 */
export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Check if two dates are the same (ignoring time)
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Validate if date is within reasonable range
 */
export function isDateInReasonableRange(date: Date): boolean {
  const now = new Date();
  const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
  const tenYearsAhead = new Date(now.getFullYear() + 10, 11, 31);
  return date >= tenYearsAgo && date <= tenYearsAhead;
}

/**
 * Parse due date string to Date object with validation
 * Handles various date formats and invalid dates gracefully
 */
export function parseDueDate(dueDateString?: string): Date | null {
  if (!dueDateString || dueDateString.trim() === '') {
    return null;
  }

  try {
    const parsedDate = new Date(dueDateString);
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    // Check if date is within reasonable range
    if (!isDateInReasonableRange(parsedDate)) {
      return null;
    }

    return parsedDate;
  } catch {
    return null;
  }
}

/**
 * Calculate document end date based on due_date or fallback to phase dates
 * @param dueDateString - Due date from phase_assigned_document_template
 * @param phaseStartDate - Phase start date
 * @param phaseEndDate - Phase end date
 * @param fallbackDuration - Default duration in days if no due date
 * @returns Calculated end date
 */
export function calculateDocumentEndDate(
  dueDateString?: string,
  phaseStartDate?: Date,
  phaseEndDate?: Date,
  fallbackDuration: number = 5
): Date {
  // Try to use due_date first
  const dueDate = parseDueDate(dueDateString);
  if (dueDate) {
    // Ensure due date is within phase boundaries
    if (phaseStartDate && dueDate < phaseStartDate) {
      return calculateEndDate(phaseStartDate, fallbackDuration);
    }
    
    if (phaseEndDate && dueDate > phaseEndDate) {
      return phaseEndDate;
    }
    
    return dueDate;
  }

  // Fallback to phase start + duration
  if (phaseStartDate) {
    const calculatedEndDate = calculateEndDate(phaseStartDate, fallbackDuration);
    
    // Ensure calculated end date doesn't exceed phase end
    if (phaseEndDate && calculatedEndDate > phaseEndDate) {
      return phaseEndDate;
    }
    
    return calculatedEndDate;
  }

  // Last resort: use current date + duration
  return calculateEndDate(new Date(), fallbackDuration);
}

/**
 * Calculate the maximum duration needed for Documents summary task
 * @param individualDocuments - Array of individual documents with due dates
 * @param phaseStartDate - Phase start date
 * @param phaseEndDate - Phase end date
 * @param fallbackDuration - Default duration if no documents
 * @returns Object with maxDuration and maxEndDate
 */
export function calculateDocumentsSummaryDuration(
  individualDocuments: Array<{ due_date?: string }>,
  phaseStartDate: Date,
  phaseEndDate: Date,
  fallbackDuration: number = 5
): { maxDuration: number; maxEndDate: Date } {
  if (!individualDocuments || individualDocuments.length === 0) {
    const endDate = calculateEndDate(phaseStartDate, fallbackDuration);
    return {
      maxDuration: fallbackDuration,
      maxEndDate: endDate > phaseEndDate ? phaseEndDate : endDate
    };
  }

  let maxDuration = fallbackDuration;
  let maxEndDate = calculateEndDate(phaseStartDate, fallbackDuration);

  // Calculate end date for each document and find the maximum
  individualDocuments.forEach(doc => {
    const docEndDate = calculateDocumentEndDate(
      doc.due_date,
      phaseStartDate,
      phaseEndDate,
      fallbackDuration
    );

    // Update max end date if this document ends later
    if (docEndDate > maxEndDate) {
      maxEndDate = docEndDate;
    }
  });

  // Calculate duration from phase start to max end date
  maxDuration = calculateDuration(phaseStartDate, maxEndDate);

  // NOTE: DO NOT clamp to phase end date - allow documents to extend beyond phase
  // This allows the Documents summary to extend beyond the phase, which will trigger
  // phase extension logic in handleDocumentUpdate
  // If maxEndDate exceeds phaseEndDate, the phase will be extended to accommodate all documents

  return { maxDuration, maxEndDate };
}

/**
 * Calculate document start date based on start_date or fallback to summary start
 * Ensures the returned date is always within phase boundaries
 * @param startDateString - Start date from phase_assigned_document_template
 * @param summaryStartDate - Parent summary task start date
 * @param phaseStartDate - Phase start date (boundary check)
 * @param phaseEndDate - Phase end date (boundary check)
 * @returns Calculated start date clamped to phase boundaries
 */
export function calculateDocumentStartDate(
  startDateString?: string,
  summaryStartDate?: Date,
  phaseStartDate?: Date,
  phaseEndDate?: Date
): Date {
  // Determine the effective phase start date for clamping
  const effectivePhaseStart = phaseStartDate || summaryStartDate || new Date();

  // Try to use start_date first
  const startDate = parseDueDate(startDateString);
  if (startDate) {
    // Clamp start date to phase boundaries
    if (phaseStartDate && startDate < phaseStartDate) {
      return phaseStartDate; // Clamp to phase start
    }
    if (phaseEndDate && startDate > phaseEndDate) {
      return phaseStartDate || summaryStartDate || new Date(); // Reset to phase start if beyond end
    }
    return startDate;
  }

  // Fallback to phase start date (ensures alignment with parent)
  return effectivePhaseStart;
}

/**
 * Create phase task ID for Gantt
 */
export function createPhaseTaskId(phaseId: string): string {
  return `phase-${phaseId}`;
}

/**
 * Debounce utility for frequent operations
 */
export function createDebouncer<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): {
  execute: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    execute: (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        callback(...args);
        timeoutId = null;
      }, delay);
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * Create a debouncer specifically for document updates
 */
export function createDocumentUpdateDebouncer(
  callback: (dates: { startDate?: Date; dueDate?: Date }) => Promise<void>,
  delay: number = 500
): {
  execute: (dates: { startDate?: Date; dueDate?: Date }) => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    execute: (dates: { startDate?: Date; dueDate?: Date }) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        callback(dates);
        timeoutId = null;
      }, delay);
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

// ============================================================================
// DEPENDENCY TYPE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert database dependency type to Gantt link type
 */
export function convertDependencyTypeToGantt(
  dbType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
): 'e2s' | 's2s' | 'e2e' | 's2e' {
  const typeMap: Record<string, 'e2s' | 's2s' | 'e2e' | 's2e'> = {
    'finish_to_start': 'e2s',  // FS: End-to-Start
    'start_to_start': 's2s',   // SS: Start-to-Start
    'finish_to_finish': 'e2e', // FF: End-to-End
    'start_to_finish': 's2e',  // SF: Start-to-End
  };
  
  return typeMap[dbType] || 'e2s';
}

/**
 * Convert Gantt link type to database dependency type
 */
export function convertGanttTypeToDependency(
  ganttType: 'e2s' | 's2s' | 'e2e'
): 'finish_to_start' | 'start_to_start' | 'finish_to_finish' {
  const typeMap: Record<'e2s' | 's2s' | 'e2e', 'finish_to_start' | 'start_to_start' | 'finish_to_finish'> = {
    'e2s': 'finish_to_start',
    's2s': 'start_to_start',
    'e2e': 'finish_to_finish',
  };
  
  return typeMap[ganttType];
}

/**
 * Map company-level dependencies to product phase instances
 * This bridges the gap between company_phases.id and lifecycle_phases.id
 */
export function mapCompanyDependenciesToProduct(
  companyDependencies: Array<{
    source_phase_id: string;  // company_phases.id
    target_phase_id: string;  // company_phases.id  
    dependency_type: string;
    lag_days: number;
  }>,
  productPhases: Array<{
    id: string;               // lifecycle_phases.id
    phase_id?: string;        // company_phases.id
  }>
): GanttLink[] {
  const links: GanttLink[] = [];
  
  for (const companyDep of companyDependencies) {
    // Find product phase instances that match the company phase templates
    const sourceProductPhase = productPhases.find(
      p => p.phase_id === companyDep.source_phase_id
    );
    
    const targetProductPhase = productPhases.find(
      p => p.phase_id === companyDep.target_phase_id
    );
    
    if (sourceProductPhase && targetProductPhase) {
      const ganttType = convertDependencyTypeToGantt(
       companyDep.dependency_type as 'finish_to_start' | 'start_to_start' | 'finish_to_finish'
      );
      
      links.push({
        id: `company-link-${sourceProductPhase.id}-${targetProductPhase.id}`,
        source: `phase-${sourceProductPhase.id}`,
        target: `phase-${targetProductPhase.id}`,
        type: ganttType,
      });
      
    } else {
      // Could not map company dependency
    }
  }
  
  return links;
}

/**
 * Map product-specific dependency overrides directly to product phase instances
 * These override company-level dependencies for specific products
 */
export function mapProductDependenciesToPhases(
  productDependencies: Array<{
    source_phase_id: string;  // lifecycle_phases.id
    target_phase_id: string;  // lifecycle_phases.id
    dependency_type: string;
    lag_days: number;
  }>,
  productPhases: Array<{
    id: string;               // lifecycle_phases.id
  }>
): GanttLink[] {
  const links: GanttLink[] = [];
   
  for (const productDep of productDependencies) {
    // Verify that both phases exist in the current product
    const sourcePhase = productPhases.find(p => p.id === productDep.source_phase_id);
    const targetPhase = productPhases.find(p => p.id === productDep.target_phase_id);
    
    if (sourcePhase && targetPhase) {
      const ganttType = convertDependencyTypeToGantt(
        productDep.dependency_type as 'finish_to_start' | 'start_to_start' | 'finish_to_finish'
      );
      
      links.push({
        id: `product-link-${sourcePhase.id}-${targetPhase.id}`,
        source: `phase-${sourcePhase.id}`,
        target: `phase-${targetPhase.id}`,
        type: ganttType,
      });
      
    } else {
      // Could not map product dependency
    }
  }
  
  return links;
}

// ============================================================================
// CASCADING UPDATE FUNCTIONS
// ============================================================================

/**
 * Find all phases that directly depend on the changed phase
 * @param changedPhaseId The ID of the phase that was changed
 * @param links Array of Gantt links (dependencies)
 * @param phases Array of all phases
 * @returns Array of dependent phases
 */
export function findDependentPhases(
  changedPhaseId: string,
  links: GanttLink[],
  phases: ProductPhase[]
): ProductPhase[] {
  const sourceTaskId = `phase-${changedPhaseId}`;
  
  // Find all links where changed phase is the source
  const dependentLinks = links.filter(link => link.source === sourceTaskId);
  
  // Get the actual phase objects
  const dependentPhases = dependentLinks
    .map(link => {
      const targetPhaseId = parsePhaseIdFromTaskId(link.target);
      return phases.find(p => p.id === targetPhaseId);
    })
    .filter(Boolean) as ProductPhase[];
  
  return dependentPhases;
}

/**
 * Calculate new dates for all dependent phases based on link types
 * Uses recursive algorithm with circular dependency prevention
 * 
 * @param changedPhase The phase that was changed
 * @param changedStartDate New start date of the changed phase
 * @param changedEndDate New end date of the changed phase
 * @param links Array of all Gantt links
 * @param phases Array of all phases
 * @returns Array of cascading updates to apply
 */
export function calculateCascadingUpdates(
  changedPhase: ProductPhase,
  changedStartDate: Date,
  changedEndDate: Date,
  links: GanttLink[],
  phases: ProductPhase[]
): CascadingUpdate[] {
  const updates: CascadingUpdate[] = [];
  const processed = new Set<string>(); // Prevent circular dependencies and infinite loops
  const maxDepth = 50; // Safety limit to prevent excessive recursion
  
  /**
   * Recursive function to process a phase and its dependents
   * @param sourcePhase The source phase
   * @param sourceStart The source phase's start date
   * @param sourceEnd The source phase's end date
   * @param depth Current recursion depth
   */
  function processPhase(
    sourcePhase: ProductPhase,
    sourceStart: Date,
    sourceEnd: Date,
    depth: number = 0
  ): void {
    // Safety checks to prevent infinite loops
    if (depth >= maxDepth) {
      // console.warn('[calculateCascadingUpdates] Max recursion depth reached, stopping cascade');
      return;
    }
    
    if (processed.has(sourcePhase.id)) {
      // console.warn(`[calculateCascadingUpdates] Circular dependency detected for phase ${sourcePhase.id}, skipping`);
      return;
    }
    
    processed.add(sourcePhase.id);
    
    const sourceTaskId = `phase-${sourcePhase.id}`;
    const dependentLinks = links.filter(link => link.source === sourceTaskId);
    
    for (const link of dependentLinks) {
      const targetPhaseId = parsePhaseIdFromTaskId(link.target);
      const targetPhase = phases.find(p => p.id === targetPhaseId);
      
      if (!targetPhase) {
        // console.warn(`[calculateCascadingUpdates] Target phase ${targetPhaseId} not found for link ${link.id}`);
        continue;
      }
      
      // Skip if already processed (circular dependency protection)
      if (processed.has(targetPhase.id)) {
        // console.warn(`[calculateCascadingUpdates] Phase ${targetPhase.id} already processed, skipping to prevent loop`);
        continue;
      }
      
      // Calculate original duration to maintain it
      const duration = targetPhase.start_date && targetPhase.end_date
        ? calculateDuration(new Date(targetPhase.start_date), new Date(targetPhase.end_date))
        : targetPhase.duration_days || 30;
      
      let newStart: Date;
      let newEnd: Date;
      
      switch (link.type) {
        case 'e2s': // End-to-Start (Finish-to-Start)
          // Target starts on source end date (no extra +1 day)
          // Because end date is already calculated as start + duration (day after last working day)
          newStart = new Date(sourceEnd);
          newEnd = calculateEndDate(newStart, duration);
          break;
          
        case 's2s': // Start-to-Start
          // Target starts when source starts
          newStart = new Date(sourceStart);
          newEnd = calculateEndDate(newStart, duration);
          break;
          
        case 'e2e': // End-to-End (Finish-to-Finish)
          // Target ends when source ends
          newEnd = new Date(sourceEnd);
          newStart = new Date(newEnd);
          newStart.setDate(newStart.getDate() - duration + 1);
          break;
          
        case 's2e': // Start-to-End (Start-to-Finish)
          // Target ends when source starts
          newEnd = new Date(sourceStart);
          newEnd.setDate(newEnd.getDate() - 1);
          newStart = new Date(newEnd);
          newStart.setDate(newStart.getDate() - duration + 1);
          break;
          
        default:
          continue;
      }
      
      // Add update to the list
      updates.push({
        phaseId: targetPhase.id,
        phaseName: targetPhase.name || 'Unknown Phase',
        newStartDate: newStart,
        newEndDate: newEnd,
        linkType: link.type,
      });
      
      // Recursively process dependent phases (depth + 1)
      processPhase(targetPhase, newStart, newEnd, depth + 1);
    }
  }
  
  processPhase(changedPhase, changedStartDate, changedEndDate, 0);
  
  return updates;
}

// TASK TYPE CALCULATION FUNCTIONS
export function calculateTaskTypeFromDates(
  start: Date,
  end: Date,
  currentType: string
): GanttTask['type'] {
  const statusTypes = ['not-started', 'running', 'overdue', 'on-time'];
  
  // Only recalculate if current type is a status-based type
  if (!statusTypes.includes(currentType)) {
    return currentType as GanttTask['type']; // Keep original type for non-status types
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time for date comparison
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  // Determine status based on dates
  if (startDate > now) {
    // Task hasn't started yet
    return 'not-started';
  } else if (endDate < now) {
    // Task end date is in the past - overdue
    return 'overdue';
  } else if (startDate <= now && now <= endDate) {
    // Task is currently running
    return 'running';
  } else {
    // Task is on time (started but not overdue)
    return 'on-time';
  }
}

