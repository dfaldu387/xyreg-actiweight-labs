import { describe, it, expect } from "vitest";
import {
  roleToPermissionLevel,
  hasRequiredPermissionLevel,
} from "../permissionUtils";

describe("roleToPermissionLevel", () => {
  it("maps admin to A", () => {
    expect(roleToPermissionLevel("admin")).toBe("A");
  });
  it("maps editor to E", () => {
    expect(roleToPermissionLevel("editor")).toBe("E");
  });
  it("maps viewer to V", () => {
    expect(roleToPermissionLevel("viewer")).toBe("V");
  });
  it("maps consultant to A", () => {
    expect(roleToPermissionLevel("consultant")).toBe("A");
  });
  it("maps author to V", () => {
    expect(roleToPermissionLevel("author")).toBe("V");
  });
});

describe("hasRequiredPermissionLevel", () => {
  it("A can access everything", () => {
    expect(hasRequiredPermissionLevel("A", "A")).toBe(true);
    expect(hasRequiredPermissionLevel("A", "E")).toBe(true);
    expect(hasRequiredPermissionLevel("A", "V")).toBe(true);
  });
  it("E can access E and V but not A", () => {
    expect(hasRequiredPermissionLevel("E", "A")).toBe(false);
    expect(hasRequiredPermissionLevel("E", "E")).toBe(true);
    expect(hasRequiredPermissionLevel("E", "V")).toBe(true);
  });
  it("V can only access V", () => {
    expect(hasRequiredPermissionLevel("V", "V")).toBe(true);
    expect(hasRequiredPermissionLevel("V", "E")).toBe(false);
    expect(hasRequiredPermissionLevel("V", "A")).toBe(false);
  });
});
