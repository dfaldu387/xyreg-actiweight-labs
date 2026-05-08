/**
 * Maps DiGA Fast-Track field IDs to product data sources (SSOT).
 * Fields listed here are auto-populated from the Device Definition / Purpose /
 * Identification / Classification and shown read-only with an SSOT badge.
 */
export const DIGA_DERIVED_SSOT_FIELDS: Record<string, { sourceLabel: string }> = {
  product_trade_name: { sourceLabel: 'Device Definition' },
  intended_purpose: { sourceLabel: 'Purpose' },
  patient_population: { sourceLabel: 'Purpose' },
  contraindications: { sourceLabel: 'Purpose' },
  basic_udi_di: { sourceLabel: 'Identification' },
  udi_di: { sourceLabel: 'Identification' },
  mdr_class: { sourceLabel: 'Classification' },
  manufacturer_name: { sourceLabel: 'Company' },
  manufacturer_address: { sourceLabel: 'Company' },
};