/**
 * Gantt Link Utilities
 *
 * Helper functions for Gantt chart links/dependencies
 * - Circular dependency detection
 * - Link type formatting
 * - Task name extraction
 */

import { GanttLink } from '@/types/ganttChart';

/**
 * Detect if adding a new link would create a circular or transitive/redundant dependency
 *
 * Uses Depth-First Search (DFS) with recursion stack to detect cycles
 * Handles both direct (A→B, B→A) and indirect (A→B→C→A) circular dependencies
 * Also detects transitive/redundant dependencies (A→B, B→C exists, trying A→C)
 *
 * Examples:
 * 1. Circular dependency:
 *    - Existing: Concept → Project Initiation, Project Initiation → Requirements
 *    - Trying to add: Requirements → Concept
 *    - Result: TRUE (creates cycle)
 *
 * 2. Transitive/Redundant dependency:
 *    - Existing: Project Initiation → Requirements, Requirements → Design
 *    - Trying to add: Project Initiation → Design
 *    - Result: TRUE (redundant, path already exists)
 *
 * @param proposedSource - Source task ID of the proposed link
 * @param proposedTarget - Target task ID of the proposed link
 * @param existingLinks - Array of existing links
 * @returns true if the proposed link would create a cycle or is redundant, false otherwise
 */
export const detectCircularDependency = (
    proposedSource: string | number,
    proposedTarget: string | number,
    existingLinks: GanttLink[]
): boolean => {
    // Normalize IDs to strings for consistent comparison
    const normalizeId = (id: string | number) => String(id);
    const source = normalizeId(proposedSource);
    const target = normalizeId(proposedTarget);

    // Self-reference check
    if (source === target) {
        console.warn('[DependencyValidation] Self-reference detected:', source);
        return true;
    }

    // Build adjacency list from existing links (WITHOUT proposed link first)
    const graph = new Map<string, string[]>();

    // Add existing links to graph
    existingLinks.forEach((link) => {
        const src = normalizeId(link.source);
        const tgt = normalizeId(link.target);
        if (!graph.has(src)) {
            graph.set(src, []);
        }
        graph.get(src)!.push(tgt);
    });

    // CHECK 1: Transitive dependency (check BEFORE adding proposed link)
    // If source can already reach target through existing paths, it's redundant
    const findPath = (from: string, to: string, visited = new Set<string>()): string[] | null => {
        if (from === to) return [from];
        if (visited.has(from)) return null;

        visited.add(from);
        const neighbors = graph.get(from) || [];

        for (const neighbor of neighbors) {
            const path = findPath(neighbor, to, new Set(visited));
            if (path) {
                return [from, ...path];
            }
        }

        return null;
    };

    const existingPath = findPath(source, target);
    if (existingPath) {
        console.warn('[DependencyValidation] Transitive dependency detected. Path already exists:', existingPath.join(' → '));
        return true;
    }

    // CHECK 2: Circular dependency (check AFTER adding proposed link)
    // Add proposed link to graph
    if (!graph.has(source)) {
        graph.set(source, []);
    }
    graph.get(source)!.push(target);

    // DFS to detect cycle with proper backtracking
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
        // If node is in recursion stack, we found a cycle
        if (recursionStack.has(node)) {
            const cycleStartIndex = path.indexOf(node);
            const cyclePath = [...path.slice(cycleStartIndex), node];
            console.warn('[DependencyValidation] Cycle detected:', cyclePath.join(' → '));
            return true;
        }

        // If already visited and not in recursion stack, no cycle from this node
        if (visited.has(node)) {
            return false;
        }

        // Mark node as visited and add to recursion stack
        visited.add(node);
        recursionStack.add(node);
        path.push(node);

        // Check all neighbors
        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (dfs(neighbor)) {
                return true; // Cycle found
            }
        }

        // Backtrack: remove from recursion stack and path
        recursionStack.delete(node);
        path.pop();
        return false;
    };

    // Check for cycles starting from any node in the graph
    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            if (dfs(node)) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Get readable task name from Gantt API
 */
export const getTaskName = (taskId: string | number, ganttApi: any): string => {
    try {
        const task = ganttApi.getTask(taskId);
        return task?.text || String(taskId);
    } catch {
        return String(taskId);
    }
};

/**
 * Format link type to readable text
 */
export const getLinkTypeText = (linkType: string): string => {
    const typeMap: Record<string, string> = {
        'e2s': 'end to start',
        's2s': 'start to start',
        'e2e': 'end to end',
        's2e': 'start to end',
    };
    return typeMap[linkType] || linkType;
};

/**
 * Check if a task ID is a phase (no prefix)
 */
export const isPhaseId = (taskId: string | number): boolean => {
    const idStr = String(taskId);
    return !idStr.match(/^(doc|gap|activity|audit)[-_]/);
};

/**
 * Check if a task ID is a document
 */
export const isDocumentId = (taskId: string | number): boolean => {
    const idStr = String(taskId);
    return idStr.match(/^doc[-_]/) !== null;
};

/**
 * Check if a task ID is a gap analysis task
 */
export const isGapAnalysisId = (taskId: string | number): boolean => {
    const idStr = String(taskId);
    return idStr.match(/^gap[-_]/) !== null;
};

/**
 * Check if a task ID is an activity
 */
export const isActivityId = (taskId: string | number): boolean => {
    const idStr = String(taskId);
    return idStr.match(/^activity[-_]/) !== null;
};

/**
 * Check if a task ID is an audit
 */
export const isAuditId = (taskId: string | number): boolean => {
    const idStr = String(taskId);
    return idStr.match(/^audit[-_]/) !== null;
};

/**
 * Get task type from task ID
 */
export const getTaskType = (taskId: string | number): string => {
    if (isDocumentId(taskId)) return 'document';
    if (isGapAnalysisId(taskId)) return 'gap analysis';
    if (isActivityId(taskId)) return 'activity';
    if (isAuditId(taskId)) return 'audit';
    if (isPhaseId(taskId)) return 'phase';
    return 'unknown';
};

// Export all utilities as default
const GanttLinkUtils = {
    detectCircularDependency,
    getTaskName,
    getLinkTypeText,
    isPhaseId,
    isDocumentId,
    isGapAnalysisId,
    isActivityId,
    isAuditId,
    getTaskType,
};

export default GanttLinkUtils;
