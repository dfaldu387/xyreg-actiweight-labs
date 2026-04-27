import { supabase } from '@/integrations/supabase/client';
import {
  ACME_SEED_ID,
  ACME_DEVICES,
  ACME_SUPPLIERS,
  ACME_BOM,
  ACME_HAZARDS,
  ACME_NOTIFICATIONS,
} from './acmeFixtures';
import { seedTierASopsForCompany } from '@/services/sopAutoSeedService';

export type ProgressCb = (msg: string, current: number, total: number) => void;

export interface SeederSummary {
  devices: number;
  suppliers: number;
  bomRevisions: number;
  bomItems: number;
  hazards: number;
  notifications: number;
  foundationSops: number;
}

async function track(seedId: string, companyId: string, table: string, rowId: string, userId: string | null) {
  await supabase.from('demo_seed_registry' as any).insert({
    seed_id: seedId,
    company_id: companyId,
    table_name: table,
    row_id: rowId,
    created_by: userId,
  });
}

export async function isAlreadySeeded(companyId: string, seedId = ACME_SEED_ID): Promise<boolean> {
  const { count, error } = await supabase
    .from('demo_seed_registry' as any)
    .select('id', { count: 'exact', head: true })
    .eq('seed_id', seedId)
    .eq('company_id', companyId);
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function getSeedSummary(companyId: string, seedId = ACME_SEED_ID) {
  const { data, error } = await supabase
    .from('demo_seed_registry' as any)
    .select('table_name, created_at, created_by')
    .eq('seed_id', seedId)
    .eq('company_id', companyId);
  if (error || !data) return null;
  const counts: Record<string, number> = {};
  let lastAt: string | null = null;
  let lastBy: string | null = null;
  for (const row of data as any[]) {
    counts[row.table_name] = (counts[row.table_name] || 0) + 1;
    if (!lastAt || row.created_at > lastAt) {
      lastAt = row.created_at;
      lastBy = row.created_by;
    }
  }
  return { counts, lastAt, lastBy, total: (data as any[]).length };
}

export async function seedAcmeDemo(
  companyId: string,
  onProgress: ProgressCb = () => {},
): Promise<SeederSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const summary: SeederSummary = {
    devices: 0,
    suppliers: 0,
    bomRevisions: 0,
    bomItems: 0,
    hazards: 0,
    notifications: 0,
    foundationSops: 0,
  };

  const totalSteps =
    1 + ACME_SUPPLIERS.length + ACME_DEVICES.length * 2 + ACME_NOTIFICATIONS.length + 1;
  let step = 0;
  const tick = (label: string) => onProgress(label, ++step, totalSteps);

  // ── 0. Foundation (Tier A) SOPs — auto-seed before anything else.
  //      Tracks newly-created CI + Studio draft rows so reset can clean them up.
  tick('Seeding foundation (Tier A) SOPs');
  const sopCompanyName = 'Acme ltd';
  // Snapshot existing SOP CI ids so we only register the ones we actually create.
  const { data: priorCis } = await supabase
    .from('phase_assigned_document_template')
    .select('id')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');
  const priorCiIds = new Set((priorCis ?? []).map((r: any) => r.id));

  const sopResult = await seedTierASopsForCompany(companyId, sopCompanyName);
  summary.foundationSops = sopResult.inserted;

  if (sopResult.inserted > 0) {
    const { data: postCis } = await supabase
      .from('phase_assigned_document_template')
      .select('id')
      .eq('company_id', companyId)
      .eq('document_type', 'SOP');
    const newCiIds = (postCis ?? [])
      .map((r: any) => r.id)
      .filter((id: string) => !priorCiIds.has(id));
    for (const ciId of newCiIds) {
      await track(ACME_SEED_ID, companyId, 'phase_assigned_document_template', ciId, userId);
    }
    // Track the Studio drafts that were created against those CIs
    if (newCiIds.length > 0) {
      const { data: studioRows } = await supabase
        .from('document_studio_templates')
        .select('id')
        .in('template_id', newCiIds);
      for (const r of studioRows ?? []) {
        await track(ACME_SEED_ID, companyId, 'document_studio_templates', (r as any).id, userId);
      }
    }
  }

  // ── 1. Suppliers (we need their ids for BOM lookup) ──
  const supplierKeyToId: Record<string, string> = {};
  for (const s of ACME_SUPPLIERS) {
    tick(`Creating supplier: ${s.name}`);
    const nextAudit = new Date();
    nextAudit.setMonth(nextAudit.getMonth() + s.next_audit_months_out);
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company_id: companyId,
        name: s.name,
        status: s.status,
        criticality: s.criticality,
        supplier_type: s.supplier_type,
        scope_of_supply: s.scope_of_supply,
        contact_info: { email: s.email, phone: s.phone, address: s.address, contact_person: s.contact_person },
        next_scheduled_audit: nextAudit.toISOString().split('T')[0],
        audit_interval: s.audit_interval,
      })
      .select('id')
      .single();
    if (error) throw new Error(`Supplier "${s.name}": ${error.message}`);
    supplierKeyToId[s.key] = data.id;
    await track(ACME_SEED_ID, companyId, 'suppliers', data.id, userId);
    summary.suppliers++;
  }

  // ── 2. Devices (products) ──
  const deviceKeyToId: Record<string, string> = {};
  for (const d of ACME_DEVICES) {
    tick(`Creating device: ${d.name}`);
    const { data, error } = await supabase
      .from('products')
      .insert({
        company_id: companyId,
        name: d.name,
        description: d.description,
        intended_use: d.intended_use,
        device_summary: d.device_summary,
        device_type: d.device_type,
        device_category: d.device_category,
        class: d.class,
        status: d.status,
        manufacturer: d.manufacturer,
        basic_udi_di: d.basic_udi_di,
        current_lifecycle_phase: d.current_lifecycle_phase,
        is_line_extension: d.is_line_extension,
        parent_product_id: d.parent_key ? deviceKeyToId[d.parent_key] : null,
        product_market: d.product_market,
        project_types: d.project_types,
        version: '1.0',
        conformity_route: d.conformity_route,
        product_platform: d.product_platform,
        project_start_date: new Date().toISOString().split('T')[0],
      } as any)
      .select('id')
      .single();
    if (error) throw new Error(`Device "${d.name}": ${error.message}`);
    deviceKeyToId[d.key] = data.id;
    await track(ACME_SEED_ID, companyId, 'products', data.id, userId);
    summary.devices++;
  }

  // ── 3. BOM revisions + items ──
  for (const d of ACME_DEVICES) {
    tick(`Creating BOM for ${d.name}`);
    const items = ACME_BOM[d.key] || [];
    if (items.length === 0) continue;
    const productId = deviceKeyToId[d.key];

    const { data: rev, error: revErr } = await supabase
      .from('bom_revisions')
      .insert({
        product_id: productId,
        company_id: companyId,
        revision: 'A',
        status: 'active',
        description: `Initial BOM for ${d.name} — seeded demo data.`,
        currency: 'EUR',
        created_by: userId,
      })
      .select('id')
      .single();
    if (revErr) throw new Error(`BOM revision ${d.name}: ${revErr.message}`);
    await track(ACME_SEED_ID, companyId, 'bom_revisions', rev.id, userId);
    summary.bomRevisions++;

    const itemRows = items.map((it, idx) => ({
      bom_revision_id: rev.id,
      item_number: `${String(idx + 1).padStart(3, '0')}`,
      description: it.description,
      quantity: it.quantity,
      unit_of_measure: it.unit_of_measure,
      unit_cost: it.unit_cost,
      supplier_id: it.supplier_key ? supplierKeyToId[it.supplier_key] : null,
      supplier_part_number: it.supplier_part_number,
      lead_time_days: it.lead_time_days,
      is_critical: it.is_critical,
      sort_order: idx,
      category: it.category,
      patient_contact: it.patient_contact,
      notes: it.notes,
    }));
    const { data: insertedItems, error: itemErr } = await supabase
      .from('bom_items')
      .insert(itemRows)
      .select('id');
    if (itemErr) throw new Error(`BOM items ${d.name}: ${itemErr.message}`);
    for (const item of insertedItems || []) {
      await track(ACME_SEED_ID, companyId, 'bom_items', item.id, userId);
    }
    summary.bomItems += insertedItems?.length || 0;
  }

  // ── 4. Hazards ──
  for (const d of ACME_DEVICES) {
    const hazards = ACME_HAZARDS[d.key] || [];
    if (hazards.length === 0) continue;
    const productId = deviceKeyToId[d.key];
    tick(`Creating ${hazards.length} hazards for ${d.name}`);

    const rows = hazards.map((h, i) => {
      const score = h.initial_severity * h.initial_probability;
      const initialRisk = score <= 4 ? 'Low' : score <= 9 ? 'Medium' : 'High';
      const rScore = h.residual_severity * h.residual_probability;
      const residualRisk = rScore <= 4 ? 'Low' : rScore <= 9 ? 'Medium' : 'High';
      return {
        hazard_id: `GEN-${d.key.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        product_id: productId,
        company_id: companyId,
        description: h.description,
        category: h.category,
        foreseeable_sequence_events: h.foreseeable_sequence_events,
        hazardous_situation: h.hazardous_situation,
        potential_harm: h.potential_harm,
        initial_severity: h.initial_severity,
        initial_probability: h.initial_probability,
        initial_risk: initialRisk,
        risk_control_measure: h.risk_control_measure,
        risk_control_type: h.risk_control_type,
        mitigation_measure: h.risk_control_measure,
        mitigation_type: h.risk_control_type,
        residual_severity: h.residual_severity,
        residual_probability: h.residual_probability,
        residual_risk: residualRisk,
        created_by: userId,
      };
    });

    const { data: insertedHazards, error: hazErr } = await supabase
      .from('hazards')
      .insert(rows as any)
      .select('id');
    if (hazErr) throw new Error(`Hazards ${d.name}: ${hazErr.message}`);
    for (const h of insertedHazards || []) {
      await track(ACME_SEED_ID, companyId, 'hazards', h.id, userId);
    }
    summary.hazards += insertedHazards?.length || 0;
  }

  // ── 5. Notifications (Mission Control activity feed) ──
  if (userId) {
    tick('Creating activity feed notifications');
    const notifRows = ACME_NOTIFICATIONS.map((n) => {
      const created = new Date();
      created.setDate(created.getDate() - n.days_ago);
      return {
        user_id: userId,
        company_id: companyId,
        title: n.title,
        message: n.message,
        category: n.category,
        action: n.action,
        priority: n.priority,
        entity_type: n.entity_type,
        is_read: n.days_ago > 7,
        created_at: created.toISOString(),
        metadata: { demo_seed_id: ACME_SEED_ID },
      };
    });
    const { data: insertedNotifs, error: notifErr } = await supabase
      .from('app_notifications')
      .insert(notifRows)
      .select('id');
    if (notifErr) {
      // Non-fatal: notifications are decorative
      console.warn('[demo-seeder] notification insert failed:', notifErr.message);
    } else {
      for (const n of insertedNotifs || []) {
        await track(ACME_SEED_ID, companyId, 'app_notifications', n.id, userId);
      }
      summary.notifications += insertedNotifs?.length || 0;
    }
  }

  return summary;
}

/**
 * Reset: deletes every row tracked under (seedId, companyId).
 * Order matters — children first.
 */
export async function resetAcmeDemo(companyId: string, seedId = ACME_SEED_ID): Promise<number> {
  const { data: rows, error } = await supabase
    .from('demo_seed_registry' as any)
    .select('table_name, row_id')
    .eq('seed_id', seedId)
    .eq('company_id', companyId);
  if (error) throw new Error(`Reset failed: ${error.message}`);
  if (!rows || rows.length === 0) return 0;

  // Delete order — most-dependent first
  const order = [
    'app_notifications',
    'hazards',
    'bom_items',
    'bom_revisions',
    'products',
    'suppliers',
    'document_studio_templates',
    'phase_assigned_document_template',
  ];
  const grouped: Record<string, string[]> = {};
  for (const r of rows as any[]) {
    grouped[r.table_name] = grouped[r.table_name] || [];
    grouped[r.table_name].push(r.row_id);
  }

  let deleted = 0;
  for (const table of order) {
    const ids = grouped[table];
    if (!ids?.length) continue;
    const { error: delErr } = await supabase.from(table as any).delete().in('id', ids);
    if (delErr) {
      console.warn(`[demo-seeder] delete ${table} failed:`, delErr.message);
      continue;
    }
    deleted += ids.length;
  }

  // Clear registry
  await supabase
    .from('demo_seed_registry' as any)
    .delete()
    .eq('seed_id', seedId)
    .eq('company_id', companyId);

  return deleted;
}
