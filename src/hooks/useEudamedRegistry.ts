
import { supabase } from "@/integrations/supabase/client";

/**
 * Result shape expected by OrganizationLookup component.
 */
export type EudamedOrganizationSearchResult = {
  organization: string;
  organization_country?: string;
  organization_id_srn?: string;
  device_count: number;
  email?: string;
  website?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  prrc_first_name?: string;
  prrc_last_name?: string;
  prrc_email?: string;
  prrc_phone?: string;
};

/**
 * Minimal device shape used across various widgets/components.
 * Includes manufacturer fields based on public.devices schema.
 */
export type EudamedDevice = {
  udi_di: string;
  organization?: string; // manufacturer_organization
  id_srn?: string; // manufacturer_id_srn
  address?: string; // manufacturer_address
  postcode?: string; // manufacturer_postcode
  country?: string; // manufacturer_country
  device_name?: string;
  device_model?: string;
  // Common synonyms used around the app
  model?: string;
  organization_country?: string;
  organization_address?: string;
  organization_email?: string;
  organization_website?: string;
  // Organization contact
  email?: string;
  website?: string;
  phone?: string;
  prrc_first_name?: string;
  prrc_last_name?: string;
  // Device meta
  risk_class?: string;
  status?: string;
  issuing_agency?: string;
  placed_on_market?: string | Date | null;
  // Characteristics and booleans (keep loose/optional)
  is_implantable?: boolean;
  is_measuring?: boolean;
  is_reusable?: boolean;
  is_active?: boolean;
  is_single_use?: boolean;
  is_sterile?: boolean;
  implantable?: boolean;
  measuring?: boolean;
  reusable?: boolean;
  active?: boolean;
  sterile?: boolean;
  single_use?: boolean;
  // Extra registry fields used by legacy import
  emdn_code?: string;
  nomenclature_codes?: string;
  basic_udi_di_code?: string;
  reference_number?: string;
  trade_names?: string;
  direct_marking?: string | boolean;
  quantity_of_device?: number | string;
  max_reuses?: number | string;
  sterilization_need?: string | boolean;
  contain_latex?: string | boolean;
  reprocessed?: string | boolean;
  placed_on_the_market?: string | Date | null;
  market_distribution?: string;
  administering_medicine?: string | boolean;
  applicable_legislation?: string;
};

export function useEudamedRegistry() {
  /**
   * Search organizations from EUDAMED using public.devices.
   * Returns one row per organization/country/id_srn with aggregated device_count.
   */
  const searchOrganizations = async (term: string): Promise<EudamedOrganizationSearchResult[]> => {
    const q = term.trim();
    if (q.length < 3) return [];

    

    const { data, error } = await supabase
      .from("devices")
      .select("manufacturer_organization, manufacturer_country, manufacturer_id_srn, manufacturer_email, manufacturer_website, manufacturer_phone, manufacturer_prrc_first_name, manufacturer_prrc_last_name, manufacturer_address, manufacturer_postcode, manufacturer_prrc_email, manufacturer_prrc_phone")
      .ilike("manufacturer_organization", `%${q}%`)
      .not("manufacturer_organization", "is", null)
      .order("manufacturer_organization", { ascending: true });
    
    if (error) {
      console.error("[EUDAMED] Search error:", error);
      throw error;
    }

    // Group by organization and count devices manually
    const organizationMap = new Map<string, EudamedOrganizationSearchResult>();
    
    (data || []).forEach((row: any) => {
      const key = `${row.manufacturer_organization}|${row.manufacturer_country || ''}|${row.manufacturer_id_srn || ''}`;
      if (organizationMap.has(key)) {
        organizationMap.get(key)!.device_count++;
      } else {
        organizationMap.set(key, {
          organization: row.manufacturer_organization,
          organization_country: row.manufacturer_country || undefined,
          organization_id_srn: row.manufacturer_id_srn || undefined,
          device_count: 1,
          email: row.manufacturer_email || undefined,
          website: row.manufacturer_website || undefined,
          phone: row.manufacturer_phone || undefined,
          address: row.manufacturer_address || undefined,
          postcode: row.manufacturer_postcode || undefined,
          prrc_first_name: row.manufacturer_prrc_first_name || undefined,
          prrc_last_name: row.manufacturer_prrc_last_name || undefined,
          prrc_email: row.manufacturer_prrc_email || undefined,
          prrc_phone: row.manufacturer_prrc_phone || undefined,
        });
      }
    });

    // Convert map to array and limit results
    const mapped = Array.from(organizationMap.values())
      .sort((a, b) => a.organization.localeCompare(b.organization))
      .slice(0, 100);

    
    return mapped;
  };

  /**
   * Validate a UDI-DI string (simple sanity check: allowed chars, min length).
   */
  const validateUdiDi = (value: string): boolean => {
    const v = (value || "").trim();
    // Allow typical UDI-DI chars, require at least 8 chars to avoid noisy queries.
    const ok = /^[A-Za-z0-9.\-:]{8,50}$/.test(v);
    
    return ok;
  };

  const mapRowToDevice = (row: any): EudamedDevice => {
    const email = row.manufacturer_email ?? undefined;
    const websiteRaw = row.manufacturer_website ?? undefined;

    const normalizeWebsite = (w?: string) => {
      if (!w || typeof w !== 'string') return undefined;
      let t = w.trim();
      if (!t) return undefined;
      if (!/^https?:\/\//i.test(t)) t = 'https://' + t.replace(/^www\./i, '');
      return t;
    };

    const deriveWebsiteFromEmail = (e?: string) => {
      if (!e || typeof e !== 'string') return undefined;
      const m = e.trim().match(/@([^>\s]+)/);
      if (!m) return undefined;
      return 'https://' + m[1].replace(/^www\./i, '');
    };

    const website = normalizeWebsite(websiteRaw) ?? deriveWebsiteFromEmail(email);

    return {
      udi_di: row.udi_di,
      organization: row.manufacturer_organization ?? undefined,
      id_srn: row.manufacturer_id_srn ?? undefined,
      address: row.manufacturer_address ?? undefined,
      postcode: row.manufacturer_postcode ?? undefined,
      country: row.manufacturer_country ?? undefined,
      device_name: row.device_name ?? undefined,
      device_model: row.device_model ?? undefined,
      // Missing EUDAMED fields that were causing the issue
      trade_names: row.trade_names ?? undefined,
      basic_udi_di_code: row.basic_udi_di_code ?? undefined,
      reference_number: row.reference_number ?? undefined,
      emdn_code: row.emdn_code ?? undefined,
      nomenclature_codes: row.nomenclature_codes ?? undefined,
      model: row.device_model ?? undefined, // Common synonym
      // Common synonyms/extra org fields
      organization_country: row.manufacturer_country ?? undefined,
      organization_address: row.manufacturer_address ?? undefined,
      organization_email: email,
      organization_website: website,
      email,
      website,
      phone: row.manufacturer_phone ?? undefined,
      prrc_first_name: row.manufacturer_prrc_first_name ?? undefined,
      prrc_last_name: row.manufacturer_prrc_last_name ?? undefined,
      // Device meta
      risk_class: row.risk_class ?? undefined,
      status: row.status ?? undefined,
      issuing_agency: row.issuing_agency ?? undefined,
      placed_on_market: row.placed_on_the_market ?? null,
      // Characteristics
      is_implantable: row.implantable ?? undefined,
      is_measuring: row.measuring ?? undefined,
      is_reusable: row.reusable ?? undefined,
      is_active: row.active ?? undefined,
      is_single_use: row.single_use ?? undefined,
      is_sterile: row.sterile ?? undefined,
    };
  };

  /**
   * Lookup a single device by exact UDI-DI.
   */
  const searchByUdiDi = async (udiDi: string): Promise<EudamedDevice | null> => {
    if (!validateUdiDi(udiDi)) return null;

    

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("udi_di", udiDi)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[EUDAMED] searchByUdiDi error:", error);
      throw error;
    }

    if (!data) {
      
      return null;
    }

    const device = mapRowToDevice(data);
    
    return device;
  };

  /**
   * Lookup devices by ID/SRN (partial match).
   * Returns an object with organization (inferred from first result) and devices list.
   */
  const searchBySrn = async (
    srn: string
  ): Promise<{ organization?: EudamedDevice; devices: EudamedDevice[]; totalCount?: number }> => {
    const q = (srn || "").trim();
    if (q.length < 3)
      return { organization: undefined, devices: [], totalCount: 0 };

    

    const columns = "*";

    // Detect exact SRN pattern like DK-MF-000025274
    const isExact = /^[A-Za-z]{2}-[A-Za-z]{2}-\d{9}$/i.test(q);

    if (isExact) {
      const pageSize = 200;
      let from = 0;
      let rows: any[] = [];
      let fetched = 0;

      while (true) {
        const to = from + pageSize - 1;
        const page = await supabase
          .from("devices")
          .select(columns)
          .eq("manufacturer_id_srn", q)
          .range(from, to);

        if (page.error) {
          console.error("[EUDAMED] searchBySrn error (exact page)", page.error);
          throw page.error;
        }

        const data = page.data || [];
        rows = rows.concat(data);
        fetched += data.length;
        if (data.length < pageSize) break; // last page
        from += pageSize;
        if (from > 5000) break; // safety cap
      }

      const devices = (rows || []).map(mapRowToDevice);
      const organization = devices.length > 0
        ? {
            ...devices[0],
            organization_country: devices[0].country,
            organization_address: devices[0].address,
            email: devices[0].email,
            website: devices[0].website,
            phone: devices[0].phone,
          }
        : undefined;

      
      return { organization, devices, totalCount: devices.length };
    } else {
      const resp = await supabase
        .from("devices")
        .select(columns)
        .ilike("manufacturer_id_srn", `%${q}%`)
        .limit(50);

      if (resp.error) {
        console.error("[EUDAMED] searchBySrn error (partial):", resp.error);
        throw resp.error;
      }

      const devices = (resp.data || []).map(mapRowToDevice);
      const organization = devices.length > 0
        ? {
            ...devices[0],
            organization_country: devices[0].country,
            organization_address: devices[0].address,
            email: devices[0].email,
            website: devices[0].website,
            phone: devices[0].phone,
          }
        : undefined;

      
      return { organization, devices };
    }
  };

  return {
    searchOrganizations,
    searchByUdiDi,
    searchBySrn,
    validateUdiDi,
  };
}