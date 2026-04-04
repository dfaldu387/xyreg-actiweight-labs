import { supabase } from '@/integrations/supabase/client';

// ---------- Types ----------

export type DiscoverySource = 'temporal' | 'state' | 'traceability';

export interface ManifestEntry {
  object_type: string;
  object_id: string;
  display_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  discovered_via: DiscoverySource;
}

export interface RiskDeltaEntry extends ManifestEntry {
  previous_risk_level: string;
  current_risk_level: string;
  previous_rpn: number;
  current_rpn: number;
}

export interface ComplianceGapEntry {
  object_type: string;
  object_id: string;
  display_id: string;
  title: string;
  missing_link_type: string;
  gap_description: string;
}

export interface ReviewManifest {
  new_evidence: ManifestEntry[];
  modified_objects: ManifestEntry[];
  risk_delta: RiskDeltaEntry[];
  compliance_gaps: ComplianceGapEntry[];
  generated_at: string;
}

// ---------- Phase-to-Module Scope Mapping ----------

const PHASE_SCOPE: Record<string, string[]> = {
  concept: ['user_needs'],
  design_input: ['user_needs', 'system_requirements', 'hazards'],
  design_output: ['system_requirements', 'requirement_specifications', 'hazards'],
  verification: ['test_cases', 'requirement_specifications'],
  validation: ['test_cases', 'hazards'],
  transfer: ['user_needs', 'system_requirements', 'requirement_specifications', 'hazards', 'test_cases'],
};

const ALL_TABLES = ['user_needs', 'system_requirements', 'requirement_specifications', 'hazards', 'test_cases'];

// ---------- Table metadata ----------

interface TableMeta {
  table: string;
  idField: string;
  titleField: string;
  objectType: string;
  statusField?: string;
}

const TABLE_META: TableMeta[] = [
  { table: 'user_needs', idField: 'need_id', titleField: 'description', objectType: 'user_need', statusField: 'status' },
  { table: 'system_requirements', idField: 'requirement_id', titleField: 'description', objectType: 'system_requirement', statusField: 'status' },
  { table: 'requirement_specifications', idField: 'requirement_id', titleField: 'description', objectType: 'requirement_specification', statusField: 'status' },
  { table: 'hazards', idField: 'hazard_id', titleField: 'hazardous_situation', objectType: 'hazard', statusField: 'assessment_status' },
  { table: 'test_cases', idField: 'test_id', titleField: 'title', objectType: 'test_case', statusField: 'status' },
];

function getTableMeta(tableName: string): TableMeta | undefined {
  return TABLE_META.find(t => t.table === tableName);
}

// ---------- Helpers ----------

async function getBaselineTimestamp(productId: string, currentReviewId: string): Promise<string> {
  const { data } = await supabase
    .from('design_reviews' as any)
    .select('completed_at')
    .eq('product_id', productId)
    .eq('status', 'completed')
    .neq('id', currentReviewId)
    .order('completed_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0 && (data[0] as any).completed_at) {
    return (data[0] as any).completed_at;
  }
  return '1970-01-01T00:00:00Z';
}

function rowToEntry(row: any, meta: TableMeta, source: DiscoverySource): ManifestEntry {
  return {
    object_type: meta.objectType,
    object_id: row.id,
    display_id: row[meta.idField] || row.id.slice(0, 8),
    title: row[meta.titleField] || '—',
    created_at: row.created_at || row.updated_at,
    updated_at: row.updated_at,
    discovered_via: source,
  };
}

// ---------- Layer 1: Temporal Scan ----------

async function temporalScan(productId: string, since: string): Promise<ManifestEntry[]> {
  const results: ManifestEntry[] = [];

  await Promise.all(ALL_TABLES.map(async (tableName) => {
    const meta = getTableMeta(tableName);
    if (!meta) return;

    const { data } = await supabase
      .from(tableName as any)
      .select(`id, ${meta.idField}, ${meta.titleField}, created_at, updated_at`)
      .eq('product_id', productId)
      .gt('updated_at', since);

    for (const row of (data || []) as any[]) {
      results.push(rowToEntry(row, meta, 'temporal'));
    }
  }));

  return results;
}

// ---------- Layer 2: State Inclusion ----------

async function stateInclusion(productId: string, phaseName: string | null, existingIds: Set<string>): Promise<ManifestEntry[]> {
  if (!phaseName) return [];
  const tables = PHASE_SCOPE[phaseName] || [];
  const results: ManifestEntry[] = [];

  await Promise.all(tables.map(async (tableName) => {
    const meta = getTableMeta(tableName);
    if (!meta || !meta.statusField) return;

    const { data } = await supabase
      .from(tableName as any)
      .select(`id, ${meta.idField}, ${meta.titleField}, created_at, updated_at, ${meta.statusField}`)
      .eq('product_id', productId)
      .eq(meta.statusField, 'draft');

    for (const row of (data || []) as any[]) {
      if (!existingIds.has(row.id)) {
        results.push(rowToEntry(row, meta, 'state'));
        existingIds.add(row.id);
      }
    }
  }));

  return results;
}

// ---------- Layer 3: Traceability Crawl ----------

async function traceabilityCrawl(productId: string, existingIds: Set<string>): Promise<ManifestEntry[]> {
  if (existingIds.size === 0) return [];

  // Get all traceability links for this product
  const { data: links } = await supabase
    .from('traceability_links')
    .select('source_type, source_id, target_type, target_id')
    .eq('product_id', productId);

  if (!links || links.length === 0) return [];

  // Find connected IDs not already in the set
  const connectedIds = new Set<string>();
  for (const link of links as any[]) {
    if (existingIds.has(link.source_id) && !existingIds.has(link.target_id)) {
      connectedIds.add(link.target_id);
    }
    if (existingIds.has(link.target_id) && !existingIds.has(link.source_id)) {
      connectedIds.add(link.source_id);
    }
  }

  if (connectedIds.size === 0) return [];

  // Fetch the connected objects
  const results: ManifestEntry[] = [];
  const idsArray = Array.from(connectedIds);

  await Promise.all(ALL_TABLES.map(async (tableName) => {
    const meta = getTableMeta(tableName);
    if (!meta) return;

    const { data } = await supabase
      .from(tableName as any)
      .select(`id, ${meta.idField}, ${meta.titleField}, created_at, updated_at`)
      .eq('product_id', productId)
      .in('id', idsArray);

    for (const row of (data || []) as any[]) {
      results.push(rowToEntry(row, meta, 'traceability'));
    }
  }));

  return results;
}

// ---------- Risk Delta Detection ----------

async function detectRiskDelta(productId: string, since: string): Promise<RiskDeltaEntry[]> {
  const { data: hazards } = await supabase
    .from('hazards' as any)
    .select('id, hazard_id, hazardous_situation, severity, probability, risk_level, created_at, updated_at')
    .eq('product_id', productId)
    .gt('updated_at', since);

  if (!hazards || hazards.length === 0) return [];

  const results: RiskDeltaEntry[] = [];
  for (const h of hazards as any[]) {
    const sev = h.severity ?? 0;
    const prob = h.probability ?? 0;
    const currentRpn = sev * prob;
    // Without historical snapshots, we flag any hazard updated since baseline
    // as a risk delta with current values (previous defaults to 0/unknown)
    results.push({
      object_type: 'hazard',
      object_id: h.id,
      display_id: h.hazard_id || h.id.slice(0, 8),
      title: h.hazardous_situation || '—',
      created_at: h.created_at || h.updated_at,
      updated_at: h.updated_at,
      discovered_via: 'temporal',
      previous_risk_level: 'unknown',
      current_risk_level: h.risk_level || 'unknown',
      previous_rpn: 0,
      current_rpn: currentRpn,
    });
  }
  return results;
}

// ---------- Compliance Gap Detection ----------

async function detectComplianceGaps(productId: string): Promise<ComplianceGapEntry[]> {
  const gaps: ComplianceGapEntry[] = [];

  // Get all traceability links for this product
  const { data: links } = await supabase
    .from('traceability_links')
    .select('source_type, source_id, target_type, target_id')
    .eq('product_id', productId);

  const linkSet = new Set<string>();
  for (const l of (links || []) as any[]) {
    linkSet.add(`${l.source_type}:${l.source_id}`);
    linkSet.add(`${l.target_type}:${l.target_id}`);
  }

  // Helper to check if an object has any link
  const hasLink = (type: string, id: string) => linkSet.has(`${type}:${id}`);

  // Also build directional maps for specific checks
  const sourceToTargets = new Map<string, Set<string>>();
  const targetToSources = new Map<string, Set<string>>();
  for (const l of (links || []) as any[]) {
    const sk = `${l.source_type}:${l.source_id}`;
    const tk = `${l.target_type}:${l.target_id}`;
    if (!sourceToTargets.has(sk)) sourceToTargets.set(sk, new Set());
    sourceToTargets.get(sk)!.add(l.target_type);
    if (!targetToSources.has(tk)) targetToSources.set(tk, new Set());
    targetToSources.get(tk)!.add(l.source_type);
  }

  // 1. User Needs without system requirements
  const { data: userNeeds } = await supabase
    .from('user_needs' as any)
    .select('id, need_id, description')
    .eq('product_id', productId);

  for (const un of (userNeeds || []) as any[]) {
    const key = `user_need:${un.id}`;
    const linkedTypes = new Set([
      ...(sourceToTargets.get(key) || []),
      ...(targetToSources.get(key) || []),
    ]);
    if (!linkedTypes.has('system_requirement')) {
      gaps.push({
        object_type: 'user_need',
        object_id: un.id,
        display_id: un.need_id || un.id.slice(0, 8),
        title: un.description || '—',
        missing_link_type: 'parent_requirement',
        gap_description: 'No system requirement linked',
      });
    }
  }

  // 2. System Requirements without test cases
  const { data: sysReqs } = await supabase
    .from('system_requirements')
    .select('id, requirement_id, description')
    .eq('product_id', productId);

  for (const sr of (sysReqs || []) as any[]) {
    const key = `system_requirement:${sr.id}`;
    const linkedTypes = new Set([
      ...(sourceToTargets.get(key) || []),
      ...(targetToSources.get(key) || []),
    ]);
    if (!linkedTypes.has('test_case')) {
      gaps.push({
        object_type: 'system_requirement',
        object_id: sr.id,
        display_id: sr.requirement_id || sr.id.slice(0, 8),
        title: sr.description || '—',
        missing_link_type: 'verification_test',
        gap_description: 'No test case linked',
      });
    }
  }

  // 3. Hazards without risk control measure or verification
  const { data: hazards } = await supabase
    .from('hazards' as any)
    .select('id, hazard_id, hazardous_situation, risk_control_measure')
    .eq('product_id', productId);

  for (const h of (hazards || []) as any[]) {
    if (!h.risk_control_measure || h.risk_control_measure.trim() === '') {
      gaps.push({
        object_type: 'hazard',
        object_id: h.id,
        display_id: h.hazard_id || h.id.slice(0, 8),
        title: h.hazardous_situation || '—',
        missing_link_type: 'risk_control',
        gap_description: 'No risk control measure defined',
      });
    } else {
      // Check for verifies_control link to test case
      const key = `hazard:${h.id}`;
      const linkedTypes = new Set([
        ...(sourceToTargets.get(key) || []),
        ...(targetToSources.get(key) || []),
      ]);
      if (!linkedTypes.has('test_case')) {
        gaps.push({
          object_type: 'hazard',
          object_id: h.id,
          display_id: h.hazard_id || h.id.slice(0, 8),
          title: h.hazardous_situation || '—',
          missing_link_type: 'verification_test',
          gap_description: 'Risk control not verified by test case',
        });
      }
    }
  }

  // 4. Test Cases without any requirement or hazard link
  const { data: testCases } = await supabase
    .from('test_cases' as any)
    .select('id, test_id, title')
    .eq('product_id', productId);

  for (const tc of (testCases || []) as any[]) {
    const key = `test_case:${tc.id}`;
    const linkedTypes = new Set([
      ...(sourceToTargets.get(key) || []),
      ...(targetToSources.get(key) || []),
    ]);
    const hasReqOrHazard = linkedTypes.has('system_requirement') ||
      linkedTypes.has('requirement_specification') ||
      linkedTypes.has('user_need') ||
      linkedTypes.has('hazard');
    if (!hasReqOrHazard) {
      gaps.push({
        object_type: 'test_case',
        object_id: tc.id,
        display_id: tc.test_id || tc.id.slice(0, 8),
        title: tc.title || '—',
        missing_link_type: 'parent_requirement',
        gap_description: 'No requirement or hazard linked',
      });
    }
  }

  return gaps;
}

// ---------- Main Discovery Function ----------

export async function discoverManifest(
  productId: string,
  reviewId: string,
  phaseName: string | null,
  _baselineLabel: string | null
): Promise<ReviewManifest> {
  const since = await getBaselineTimestamp(productId, reviewId);

  // Layer 1: Temporal scan
  const temporalEntries = await temporalScan(productId, since);

  // Split into new evidence vs modified
  const newEvidence: ManifestEntry[] = [];
  const modifiedObjects: ManifestEntry[] = [];
  const seenIds = new Set<string>();

  for (const entry of temporalEntries) {
    seenIds.add(entry.object_id);
    if (entry.created_at > since) {
      newEvidence.push(entry);
    } else {
      modifiedObjects.push(entry);
    }
  }

  // Layer 2: State inclusion
  const stateEntries = await stateInclusion(productId, phaseName, seenIds);
  // State-included items go to modified (they're draft/stale in scope)
  modifiedObjects.push(...stateEntries);

  // Layer 3: Traceability crawl
  const traceEntries = await traceabilityCrawl(productId, seenIds);
  modifiedObjects.push(...traceEntries);

  // Risk delta
  const riskDelta = await detectRiskDelta(productId, since);

  // Compliance gaps
  const complianceGaps = await detectComplianceGaps(productId);

  return {
    new_evidence: newEvidence,
    modified_objects: modifiedObjects,
    risk_delta: riskDelta,
    compliance_gaps: complianceGaps,
    generated_at: new Date().toISOString(),
  };
}

// ---------- Hard-Gate Blockers ----------

export function getBlockers(manifest: ReviewManifest): string[] {
  const blockers: string[] = [];

  // Unassessed hazards in risk delta
  for (const rd of manifest.risk_delta) {
    if (rd.current_risk_level === 'unknown') {
      blockers.push(`Hazard ${rd.display_id} has not been assessed`);
    }
  }

  // Compliance gaps
  if (manifest.compliance_gaps.length > 0) {
    const gapCount = manifest.compliance_gaps.length;
    blockers.push(`${gapCount} compliance gap(s) require resolution`);
  }

  return blockers;
}
