/**
 * Maps MDR Annex II checklist field IDs to product data sources (SSOT).
 * Fields listed here are auto-populated from the Device Definition and shown
 * as read-only with an SSOT badge in the gap analysis form.
 */

/** Derived SSOT fields: resolved from product columns in ProductGapItemDetailPage */
export const MDR_ANNEX_II_DERIVED_SSOT_FIELDS: Record<string, { sourceLabel: string }> = {
  product_trade_name: { sourceLabel: 'Device Definition' },
  general_description: { sourceLabel: 'Device Definition' },
  intended_purpose: { sourceLabel: 'Purpose' },
  medical_conditions: { sourceLabel: 'Purpose' },
  intended_users: { sourceLabel: 'Purpose' },
  basic_udi_di: { sourceLabel: 'Identification' },
  patient_population: { sourceLabel: 'Purpose' },
  contraindications: { sourceLabel: 'Purpose' },
  risk_class: { sourceLabel: 'Classification' },
  variants_description: { sourceLabel: 'Device Definition' },
};
