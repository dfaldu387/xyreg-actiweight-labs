/**
 * Maps IEC 60601-1 checklist field IDs to DeviceCharacteristics keys (SSOT).
 * If a field ID appears here, the checklist form will read/write from the 
 * product's key_technology_characteristics instead of form_responses.
 */
export const IEC_60601_SSOT_FIELD_MAP: Record<string, string> = {
  // §1.1
  energy_transfer: 'energyTransferDirection',
  energy_type: 'energyTransferType',
  // §4.4
  service_life: 'expectedServiceLife',
  // §4.10
  transport_temp_range: 'transportTempRange',
  transport_humidity: 'transportHumidity',
  transport_pressure: 'transportPressure',
  operating_temp_range: 'operatingTempRange',
  operating_humidity: 'operatingHumidity',
  operating_pressure: 'operatingPressure',
  // §4.11
  rated_voltage: 'ratedVoltage',
  rated_frequency: 'ratedFrequency',
  rated_current_power: 'ratedCurrentPower',
  // §6.1
  protection_class: 'protectionClass',
  // §6.2
  applied_part_type: 'appliedPartType',
  // §6.3
  ip_water_rating: 'ipWaterRating',
  // §6.5
  operation_mode: 'operationMode',
  duty_cycle: 'dutyCycle',
  // §6.6
  portability_class: 'portabilityClass',
};

/**
 * Maps field IDs to derived SSOT values (not stored in key_technology_characteristics
 * but derived from other product columns).
 */
export const IEC_60601_DERIVED_SSOT_FIELDS: Record<string, { sourceLabel: string }> = {
  ivd_exclusion: { sourceLabel: 'Classification' },
  device_description_ref: { sourceLabel: 'Device Definition' },
};

/**
 * Fields sourced from intended_purpose_data (array-type SSOT).
 * ep_features renders as a read-only list from intended_purpose_data.essentialPerformance.
 */
export const IEC_60601_PURPOSE_SSOT_FIELDS: Record<string, { sourceKey: string; sourceLabel: string }> = {
  ep_features: { sourceKey: 'essentialPerformance', sourceLabel: 'Purpose' },
};
