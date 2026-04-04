import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { TraceabilityItem, TraceabilityLink, TraceabilityMatrix } from '@/services/enhancedTraceabilityService';

export interface TraceabilityNodeData {
  [key: string]: unknown;
  id: string;
  type: string;
  identifier: string;
  name: string;
  status?: string;
  description?: string;
  isOrphan: boolean;
  linkCount: number;
}

export interface TraceabilityEdgeData {
  [key: string]: unknown;
  status: 'not_run' | 'passed' | 'failed' | 'needs_rerun';
  linkType: string;
}

// Column positions for each item type (left to right flow)
const COLUMN_CONFIG: Record<string, { x: number; color: string; label: string }> = {
  bom_item: { x: 0, color: '#78716c', label: 'BOM Items' },
  device_component: { x: 350, color: '#0ea5e9', label: 'Components' },
  feature: { x: 700, color: '#a855f7', label: 'Features' },
  user_need: { x: 1050, color: '#8b5cf6', label: 'User Needs' },
  system_requirement: { x: 1400, color: '#3b82f6', label: 'System Req.' },
  software_requirement: { x: 1750, color: '#06b6d4', label: 'Software Req.' },
  hardware_requirement: { x: 2100, color: '#14b8a6', label: 'Hardware Req.' },
  hazard: { x: 2450, color: '#ef4444', label: 'Hazards' },
  risk_control: { x: 2800, color: '#f59e0b', label: 'Risk Controls' },
  test_case: { x: 3150, color: '#22c55e', label: 'Test Cases' },
};

const NODE_HEIGHT = 110;
const NODE_VERTICAL_GAP = 16;

export function extractLinksFromMatrix(matrix: TraceabilityMatrix): TraceabilityLink[] {
  const links: TraceabilityLink[] = [];
  const seen = new Set<string>();

  Object.entries(matrix).forEach(([sourceId, targetTypes]) => {
    Object.values(targetTypes).forEach(typeLinks => {
      typeLinks.forEach(link => {
        // Skip reverse links to avoid duplicate edges
        if (link.id.startsWith('reverse-') || link.id.startsWith('virtual-reverse-') || link.id.startsWith('transitive-')) return;
        const key = `${link.source_id}-${link.target_id}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push(link);
      });
    });
  });

  return links;
}

export function useTraceabilityGraph(
  sourceItems: TraceabilityItem[],
  targetItems: TraceabilityItem[],
  matrix: TraceabilityMatrix,
  allLinks: TraceabilityLink[]
) {
  return useMemo(() => {
    const nodes: Node<TraceabilityNodeData>[] = [];
    const edges: Edge<TraceabilityEdgeData>[] = [];
    
    // Combine and dedupe all items
    const allItemsMap = new Map<string, TraceabilityItem>();
    [...sourceItems, ...targetItems].forEach(item => {
      allItemsMap.set(item.id, item);
    });
    
    // Group items by type for vertical positioning
    const itemsByType: Record<string, TraceabilityItem[]> = {};
    allItemsMap.forEach(item => {
      if (!itemsByType[item.type]) {
        itemsByType[item.type] = [];
      }
      itemsByType[item.type].push(item);
    });
    
    // Extract all links from matrix (includes virtual links from traces_to, linked_risks, etc.)
    const matrixLinks = extractLinksFromMatrix(matrix);
    
    // Merge explicit links + matrix virtual links (deduplicated)
    const combinedLinksMap = new Map<string, TraceabilityLink>();
    [...allLinks, ...matrixLinks].forEach(link => {
      if (link.id.startsWith('reverse-') || link.id.startsWith('virtual-reverse-') || link.id.startsWith('transitive-')) return;
      const key = `${link.source_id}-${link.target_id}`;
      if (!combinedLinksMap.has(key)) {
        combinedLinksMap.set(key, link);
      }
    });
    const combinedLinks = Array.from(combinedLinksMap.values());
    
    // Build set of linked IDs for orphan detection
    const linkedIds = new Set<string>();
    combinedLinks.forEach(link => {
      linkedIds.add(link.source_id);
      linkedIds.add(link.target_id);
    });
    
    // Create nodes with proper positioning — each type gets its own column
    const columnYOffset: Record<string, number> = {};
    
    // Process types in a deterministic order matching V-model flow
    const typeOrder = ['bom_item', 'device_component', 'feature', 'user_need', 'system_requirement', 'software_requirement', 'hardware_requirement', 'hazard', 'risk_control', 'test_case'];
    
    // First pass: place all nodes top-aligned per column
    typeOrder.forEach(type => {
      const items = itemsByType[type];
      if (!items || items.length === 0) return;
      
      const config = COLUMN_CONFIG[type] || { x: 0, color: '#6b7280', label: type };
      
      items.forEach((item, index) => {
        const linkCount = (matrix[item.id] ? Object.values(matrix[item.id]).flat().length : 0);
        const isOrphan = !linkedIds.has(item.id);
        
        nodes.push({
          id: item.id,
          type: 'traceabilityNode',
          position: {
            x: config.x,
            y: index * (NODE_HEIGHT + NODE_VERTICAL_GAP)
          },
          data: {
            id: item.id,
            type: item.type,
            identifier: item.identifier,
            name: item.name || item.description || '',
            status: item.status,
            description: item.description,
            isOrphan,
            linkCount
          }
        });
      });
      
      columnYOffset[type] = items.length * (NODE_HEIGHT + NODE_VERTICAL_GAP);
    });
    
    // Second pass: vertically center-align columns relative to the tallest
    const maxColumnHeight = Math.max(...Object.values(columnYOffset), 0);
    
    nodes.forEach(node => {
      const nodeType = node.data.type;
      const colHeight = columnYOffset[nodeType] || 0;
      const yShift = (maxColumnHeight - colHeight) / 2;
      node.position.y += yShift;
    });
    
    // Create edges from combined links
    const processedEdges = new Set<string>();
    
    combinedLinks.forEach(link => {
      const edgeId = `${link.source_id}-${link.target_id}`;
      if (processedEdges.has(edgeId)) return;
      
      // Only create edge if both nodes exist
      if (!allItemsMap.has(link.source_id) || !allItemsMap.has(link.target_id)) return;
      
      processedEdges.add(edgeId);
      
      // Determine edge status based on test case status
      let status: TraceabilityEdgeData['status'] = 'not_run';
      const sourceItem = allItemsMap.get(link.source_id);
      const targetItem = allItemsMap.get(link.target_id);
      
      // Check if either end is a test case and get its status
      const testItem = [sourceItem, targetItem].find(i => i?.type === 'test_case');
      if (testItem && testItem.status) {
        const s = testItem.status.toLowerCase();
        if (s === 'passed' || s === 'pass') status = 'passed';
        else if (s === 'failed' || s === 'fail') status = 'failed';
        else if (s === 'blocked') status = 'needs_rerun';
      }
      
      edges.push({
        id: link.id,
        source: link.source_id,
        target: link.target_id,
        type: 'traceabilityEdge',
        data: {
          status,
          linkType: link.link_type
        }
      });
    });
    
    return { nodes, edges };
  }, [sourceItems, targetItems, matrix, allLinks]);
}

/**
 * V-model type hierarchy rank (lower = more upstream).
 * Used to determine traversal direction regardless of link source/target order.
 */
const TYPE_RANK: Record<string, number> = {
  bom_item: -2,
  device_component: -1,
  feature: -0.5,
  user_need: 0,
  system_requirement: 1,
  software_requirement: 2,
  hardware_requirement: 2,
  hazard: 2,
  risk_control: 3,
  test_case: 3,
};

export function getTraceabilityChain(
  nodeId: string,
  allLinks: TraceabilityLink[],
  direction: 'both' | 'upstream' | 'downstream' = 'both',
  allNodes?: Map<string, { type: string }>
): Set<string> {
  const MAX_DEPTH = 3;
  const chain = new Set<string>();
  chain.add(nodeId);

  const nodeTypeMap = new Map<string, string>();
  if (allNodes) {
    allNodes.forEach((v, k) => nodeTypeMap.set(k, v.type));
  }

  // The type of the originally selected node — we never traverse to siblings of the same type
  const originType = nodeTypeMap.get(nodeId);

  const getNeighbor = (link: TraceabilityLink, currentId: string, dir: 'upstream' | 'downstream'): string | null => {
    const otherId = link.source_id === currentId ? link.target_id
                  : link.target_id === currentId ? link.source_id
                  : null;
    if (!otherId) return null;

    const otherType = nodeTypeMap.get(otherId);

    // Block traversal to nodes of the SAME type as the origin (prevents sibling leakage)
    if (otherType && originType && otherType === originType) return null;

    const currentType = nodeTypeMap.get(currentId);
    if (!currentType || !otherType) {
      // Fallback: use link direction when types unknown
      if (dir === 'downstream' && link.source_id === currentId) return link.target_id;
      if (dir === 'upstream' && link.target_id === currentId) return link.source_id;
      return null;
    }

    const currentRank = TYPE_RANK[currentType] ?? 99;
    const otherRank = TYPE_RANK[otherType] ?? 99;

    if (dir === 'upstream' && otherRank <= currentRank) return otherId;
    if (dir === 'downstream' && otherRank >= currentRank) return otherId;
    return null;
  };

  const walk = (dir: 'upstream' | 'downstream') => {
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const { id: currentId, depth } = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      if (depth >= MAX_DEPTH) continue;

      allLinks.forEach(link => {
        if (link.id.startsWith('reverse-')) return;
        const neighbor = getNeighbor(link, currentId, dir);
        if (neighbor && !visited.has(neighbor)) {
          chain.add(neighbor);
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      });
    }
  };

  if (direction !== 'upstream') walk('downstream');
  if (direction !== 'downstream') walk('upstream');

  return chain;
}
