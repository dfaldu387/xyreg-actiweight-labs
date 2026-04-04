import { describe, it, expect } from 'vitest';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';

// ---- resolveFieldValue ----

describe('resolveFieldValue', () => {
  const baseProduct = {
    id: 'prod-001',
    primary_regulatory_type: 'Medical Device (MDR)',
    device_type: null,
    key_technology_characteristics: null,
    trade_name: 'TestDevice',
    device_category: 'Surgical',
    description: 'A test device',
    model_reference: 'Model X',
    intended_purpose_data: null,
    clinical_benefits: null,
    intended_users: null,
    contraindications: null,
    user_instructions: null,
    storage_sterility_handling: null,
    images: null,
    product_platform: null,
    trl_level: null,
  };

  it('resolves top-level columns', () => {
    expect(resolveFieldValue(baseProduct, 'classification_primaryRegulatoryType')).toBe('Medical Device (MDR)');
    expect(resolveFieldValue(baseProduct, 'definition_tradeName')).toBe('TestDevice');
    expect(resolveFieldValue(baseProduct, 'definition_description')).toBe('A test device');
    expect(resolveFieldValue(baseProduct, 'definition_deviceCategory')).toBe('Surgical');
  });

  it('resolves KTC nested fields', () => {
    const product = {
      ...baseProduct,
      key_technology_characteristics: { isActive: true, trlLevel: 7 },
    };
    expect(resolveFieldValue(product, 'classification_isActiveDevice')).toBe(true);
    expect(resolveFieldValue(product, 'technical_trlLevel')).toBe(7);
  });

  it('resolves device_type from JSON string', () => {
    const product = {
      ...baseProduct,
      device_type: JSON.stringify({ invasivenessLevel: 'Invasive' }),
    };
    expect(resolveFieldValue(product, 'classification_coreDeviceNature')).toBe('Invasive');
  });

  it('resolves grouped technical fields as objects', () => {
    const product = {
      ...baseProduct,
      key_technology_characteristics: {
        isSoftwareAsaMedicalDevice: true,
        isSoftwareMobileApp: false,
        noSoftware: false,
      },
    };
    const val = resolveFieldValue(product, 'technical_systemArchitecture');
    expect(val).toEqual({
      isSoftwareAsaMedicalDevice: true,
      isSoftwareMobileApp: false,
      noSoftware: false,
    });
  });

  it('resolves intended_purpose_data sub-keys', () => {
    const product = {
      ...baseProduct,
      intended_purpose_data: {
        clinicalPurpose: 'Monitoring vitals',
        targetPopulation: 'Adults',
      },
    };
    expect(resolveFieldValue(product, 'intendedUse')).toBe('Monitoring vitals');
    expect(resolveFieldValue(product, 'targetPopulation')).toBe('Adults');
  });

  it('returns undefined for unknown field keys', () => {
    expect(resolveFieldValue(baseProduct, 'nonexistent_field')).toBeUndefined();
  });

  it('defaults grouped booleans to false when KTC is null', () => {
    const val = resolveFieldValue(baseProduct, 'technical_sterility');
    expect(val).toEqual({
      isNonSterile: false,
      isDeliveredSterile: false,
      canBeSterilized: false,
    });
  });
});

// ---- normalizeScopeValue ----

describe('normalizeScopeValue', () => {
  describe('regulatory type normalization', () => {
    it.each([
      ['Medical Device', 'Medical Device (MDR)'],
      ['medical device (mdr)', 'Medical Device (MDR)'],
      ['MDR', 'Medical Device (MDR)'],
      ['mdr', 'Medical Device (MDR)'],
      ['', 'Medical Device (MDR)'],
      [null, 'Medical Device (MDR)'],
      [undefined, 'Medical Device (MDR)'],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeScopeValue('classification_primaryRegulatoryType', input)).toBe(expected);
    });

    it.each([
      ['In Vitro Diagnostic', 'In Vitro Diagnostic (IVD)'],
      ['in vitro diagnostic device', 'In Vitro Diagnostic (IVD)'],
      ['IVD', 'In Vitro Diagnostic (IVD)'],
      ['ivd', 'In Vitro Diagnostic (IVD)'],
      ['in vitro diagnostic (ivd)', 'In Vitro Diagnostic (IVD)'],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeScopeValue('classification_primaryRegulatoryType', input)).toBe(expected);
    });
  });

  describe('device nature normalization', () => {
    it.each([
      ['Non-invasive', 'Non-invasive'],
      ['non invasive', 'Non-invasive'],
      ['noninvasive', 'Non-invasive'],
      ['Invasive', 'Invasive'],
      ['Surgically invasive', 'Surgically invasive'],
      ['surgical invasive', 'Surgically invasive'],
      ['Implantable', 'Implantable'],
      ['implant', 'Implantable'],
      ['', 'Non-invasive'],
      [null, 'Non-invasive'],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeScopeValue('classification_coreDeviceNature', input)).toBe(expected);
    });
  });

  describe('boolean field normalization', () => {
    it('converts string "true" to boolean true', () => {
      expect(normalizeScopeValue('classification_isActiveDevice', 'true')).toBe(true);
    });

    it('converts string "false" to boolean false', () => {
      expect(normalizeScopeValue('classification_isActiveDevice', 'false')).toBe(false);
    });

    it('passes through boolean true', () => {
      expect(normalizeScopeValue('classification_systemProcedurePack', true)).toBe(true);
    });
  });

  describe('passthrough for other fields', () => {
    it('returns value as-is for unrecognized field keys', () => {
      expect(normalizeScopeValue('definition_tradeName', 'MyDevice')).toBe('MyDevice');
      expect(normalizeScopeValue('intendedUse', 'Monitor')).toBe('Monitor');
    });
  });
});
