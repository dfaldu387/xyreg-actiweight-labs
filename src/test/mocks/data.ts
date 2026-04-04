/**
 * Factory functions for test data
 */

export function createMockProduct(overrides: Record<string, any> = {}) {
  return {
    id: "prod-001",
    name: "Test Device G140",
    company_id: "comp-001",
    basic_udi_di: null,
    eudamed_device_name: null,
    eudamed_id_srn: null,
    eudamed_organization: null,
    device_class: "IIa",
    description: "A test medical device",
    intended_use: "Testing purposes",
    ...overrides,
  };
}

export function createMockCompany(overrides: Record<string, any> = {}) {
  return {
    id: "comp-001",
    name: "Test MedTech Corp",
    ...overrides,
  };
}

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: "user-001",
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  };
}

export function createMockCompanyRole(overrides: Record<string, any> = {}) {
  return {
    companyId: "comp-001",
    companyName: "Test MedTech Corp",
    role: "admin" as const,
    isActive: true,
    isPrimary: true,
    isInternal: false,
    ...overrides,
  };
}

export function createMockDeviceCharacteristics(overrides: Record<string, any> = {}) {
  return {
    basic_udi_di_code: "BUDI-001",
    device_name: "Test Device",
    manufacturer_id_srn: "SRN-001",
    trade_name: "TradeTest",
    model: "Model X",
    udi_di: "UDI-001",
    risk_class: "IIa",
    mf_name: "Test Manufacturer",
    is_implantable: false,
    ...overrides,
  };
}
