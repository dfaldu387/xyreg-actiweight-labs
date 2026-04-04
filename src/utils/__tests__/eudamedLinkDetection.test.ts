import { describe, it, expect } from "vitest";
import { createMockProduct } from "@/test/mocks/data";

/**
 * Tests the unified 3-key EUDAMED link detection rule.
 * A product is considered "linked to EUDAMED" if ANY of these exist:
 *   - basic_udi_di
 *   - eudamed_device_name
 *   - eudamed_id_srn
 */
function hasEudamedLink(product: Record<string, any>): boolean {
  return !!product.basic_udi_di || !!product.eudamed_device_name || !!product.eudamed_id_srn;
}

describe("EUDAMED 3-key link detection", () => {
  it("returns false when all three keys are null", () => {
    const product = createMockProduct();
    expect(hasEudamedLink(product)).toBe(false);
  });

  it("returns true when only basic_udi_di is set", () => {
    const product = createMockProduct({ basic_udi_di: "BUDI-123" });
    expect(hasEudamedLink(product)).toBe(true);
  });

  it("returns true when only eudamed_device_name is set", () => {
    const product = createMockProduct({ eudamed_device_name: "My Device" });
    expect(hasEudamedLink(product)).toBe(true);
  });

  it("returns true when only eudamed_id_srn is set", () => {
    const product = createMockProduct({ eudamed_id_srn: "SRN-456" });
    expect(hasEudamedLink(product)).toBe(true);
  });

  it("returns true when all three keys are set", () => {
    const product = createMockProduct({
      basic_udi_di: "BUDI-123",
      eudamed_device_name: "Device X",
      eudamed_id_srn: "SRN-789",
    });
    expect(hasEudamedLink(product)).toBe(true);
  });

  it("returns false after detaching (clearing all link keys)", () => {
    const linked = createMockProduct({
      basic_udi_di: "BUDI-123",
      eudamed_device_name: "Device X",
      eudamed_id_srn: "SRN-789",
    });
    expect(hasEudamedLink(linked)).toBe(true);

    // Simulate detach
    const detached = { ...linked, basic_udi_di: null, eudamed_device_name: null, eudamed_id_srn: null };
    expect(hasEudamedLink(detached)).toBe(false);
  });

  it("ignores eudamed_organization (not a link indicator)", () => {
    const product = createMockProduct({ eudamed_organization: "Some Org" });
    expect(hasEudamedLink(product)).toBe(false);
  });

  it("handles empty strings as falsy (no link)", () => {
    const product = createMockProduct({
      basic_udi_di: "",
      eudamed_device_name: "",
      eudamed_id_srn: "",
    });
    expect(hasEudamedLink(product)).toBe(false);
  });
});
