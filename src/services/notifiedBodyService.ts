
import { supabase } from "@/integrations/supabase/client";
import { NotifiedBody, NotifiedBodyScope } from "@/types/notifiedBody";
import { formatNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";

interface NotifiedBodyRow {
  id: string;
  name: string;
  nb_number: number;
  address: string;
  contact_number: string;
  email: string;
  website?: string;
  country: string;
  scope_mdr: boolean;
  scope_ivdr: boolean;
  scope_high_risk_active_implantables: boolean;
  scope_high_risk_implants_non_active: boolean;
  scope_medical_software: boolean;
  scope_sterilization_methods: boolean;
  scope_drug_device_combinations: boolean;
  is_active: boolean;
  data_source?: string;
  created_at: string;
  updated_at: string;
  // Comparison data columns
  category?: string;
  typical_lead_time_months_min?: number;
  typical_lead_time_months_max?: number;
  audit_fee_per_day_min?: number;
  audit_fee_per_day_max?: number;
  scope_depth?: string;
  waitlist_status?: string;
  strengths?: string[];
  notes?: string;
}

function transformNotifiedBodyFromDatabase(row: any): NotifiedBody {
  return {
    id: row.id,
    name: row.name,
    nb_number: row.nb_number,
    address: row.address,
    contactNumber: row.contact_number,
    email: row.email,
    website: row.website,
    country: row.country,
    scope: {
      mdr: row.scope_mdr,
      ivdr: row.scope_ivdr,
      highRiskActiveImplantables: row.scope_high_risk_active_implantables,
      highRiskImplantsNonActive: row.scope_high_risk_implants_non_active,
      medicalSoftware: row.scope_medical_software,
      sterilizationMethods: row.scope_sterilization_methods,
      drugDeviceCombinations: row.scope_drug_device_combinations,
    },
    // Map the new data_source field to the existing source field for backward compatibility
    source: row.data_source === 'manual_entry' ? 'manual' : 'database',
    data_source: row.data_source || 'official_eu_nando',
    // Comparison data
    category: row.category as NotifiedBody['category'],
    typicalLeadTimeMonthsMin: row.typical_lead_time_months_min,
    typicalLeadTimeMonthsMax: row.typical_lead_time_months_max,
    auditFeePerDayMin: row.audit_fee_per_day_min,
    auditFeePerDayMax: row.audit_fee_per_day_max,
    scopeDepth: row.scope_depth as NotifiedBody['scopeDepth'],
    waitlistStatus: row.waitlist_status as NotifiedBody['waitlistStatus'],
    strengths: row.strengths,
    notes: row.notes,
  };
}

export async function fetchNotifiedBodies(): Promise<NotifiedBody[]> {
  const { data, error } = await supabase
    .from('notified_bodies' as any)
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching notified bodies:', error);
    throw new Error('Failed to fetch notified bodies');
  }

  return (data || []).map(transformNotifiedBodyFromDatabase);
}

export async function searchNotifiedBodies(query: string): Promise<NotifiedBody[]> {
  if (!query.trim()) {
    return fetchNotifiedBodies();
  }

  // Handle both formatted (e.g., "0044") and unformatted (e.g., "44") NB number searches
  const numericQuery = parseInt(query.replace(/^0+/, ''), 10);
  const isNumericSearch = !isNaN(numericQuery) && query.match(/^\d+$/);

  let supabaseQuery = supabase
    .from('notified_bodies' as any)
    .select('*')
    .eq('is_active', true);

  if (isNumericSearch) {
    // Search by NB number (supports both "44" and "0044" formats)
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,nb_number.eq.${numericQuery},country.ilike.%${query}%`);
  } else {
    // Text-based search
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,country.ilike.%${query}%`);
  }

  const { data, error } = await supabaseQuery.order('name');

  if (error) {
    console.error('Error searching notified bodies:', error);
    throw new Error('Failed to search notified bodies');
  }

  return (data || []).map(transformNotifiedBodyFromDatabase);
}

export async function getNotifiedBodyById(id: string): Promise<NotifiedBody | null> {
  const { data, error } = await supabase
    .from('notified_bodies' as any)
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching notified body by ID:', error);
    throw new Error('Failed to fetch notified body');
  }

  return transformNotifiedBodyFromDatabase(data);
}

export async function getNotifiedBodiesByCountry(country: string): Promise<NotifiedBody[]> {
  const { data, error } = await supabase
    .from('notified_bodies' as any)
    .select('*')
    .eq('is_active', true)
    .eq('country', country)
    .order('name');

  if (error) {
    console.error('Error fetching notified bodies by country:', error);
    throw new Error('Failed to fetch notified bodies by country');
  }

  return (data || []).map(transformNotifiedBodyFromDatabase);
}

export async function getNotifiedBodiesByScope(scope: Partial<NotifiedBodyScope>): Promise<NotifiedBody[]> {
  let query = supabase
    .from('notified_bodies' as any)
    .select('*')
    .eq('is_active', true);

  // Add scope filters if specified
  if (scope.mdr === true) query = query.eq('scope_mdr', true);
  if (scope.ivdr === true) query = query.eq('scope_ivdr', true);
  if (scope.highRiskActiveImplantables === true) query = query.eq('scope_high_risk_active_implantables', true);
  if (scope.highRiskImplantsNonActive === true) query = query.eq('scope_high_risk_implants_non_active', true);
  if (scope.medicalSoftware === true) query = query.eq('scope_medical_software', true);
  if (scope.sterilizationMethods === true) query = query.eq('scope_sterilization_methods', true);
  if (scope.drugDeviceCombinations === true) query = query.eq('scope_drug_device_combinations', true);

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching notified bodies by scope:', error);
    throw new Error('Failed to fetch notified bodies by scope');
  }

  return (data || []).map(transformNotifiedBodyFromDatabase);
}

// New function to add manual notified body entry
export async function addManualNotifiedBody(notifiedBody: Omit<NotifiedBody, 'id' | 'source' | 'data_source'>): Promise<NotifiedBody> {
  const { data, error } = await supabase
    .from('notified_bodies' as any)
    .insert({
      name: notifiedBody.name,
      nb_number: notifiedBody.nb_number,
      address: notifiedBody.address,
      contact_number: notifiedBody.contactNumber,
      email: notifiedBody.email,
      website: notifiedBody.website,
      country: notifiedBody.country,
      scope_mdr: notifiedBody.scope.mdr,
      scope_ivdr: notifiedBody.scope.ivdr,
      scope_high_risk_active_implantables: notifiedBody.scope.highRiskActiveImplantables,
      scope_high_risk_implants_non_active: notifiedBody.scope.highRiskImplantsNonActive,
      scope_medical_software: notifiedBody.scope.medicalSoftware,
      scope_sterilization_methods: notifiedBody.scope.sterilizationMethods,
      scope_drug_device_combinations: notifiedBody.scope.drugDeviceCombinations,
      is_active: true,
      data_source: 'manual_entry'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding manual notified body:', error);
    throw new Error('Failed to add manual notified body');
  }

  return transformNotifiedBodyFromDatabase(data);
}
