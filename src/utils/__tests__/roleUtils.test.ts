import { describe, it, expect } from "vitest";
import {
  hasAdminPrivileges,
  hasEditorPrivileges,
  hasViewerPrivileges,
  mapLegacyRoleToStandard,
  validateRole,
  getRoleDisplayName,
  getUserRoleFromCompanyAccess,
} from "../roleUtils";

describe("hasAdminPrivileges", () => {
  it("grants admin access to super_admin", () => {
    expect(hasAdminPrivileges("super_admin")).toBe(true);
  });
  it("grants admin access to admin", () => {
    expect(hasAdminPrivileges("admin")).toBe(true);
  });
  it("grants admin access to consultant", () => {
    expect(hasAdminPrivileges("consultant")).toBe(true);
  });
  it("grants admin access to business (legacy)", () => {
    expect(hasAdminPrivileges("business")).toBe(true);
  });
  it("denies admin access to editor", () => {
    expect(hasAdminPrivileges("editor")).toBe(false);
  });
  it("denies admin access to viewer", () => {
    expect(hasAdminPrivileges("viewer")).toBe(false);
  });
  it("denies admin access to reviewer", () => {
    expect(hasAdminPrivileges("reviewer")).toBe(false);
  });
});

describe("hasEditorPrivileges", () => {
  it("grants editor access to super_admin", () => {
    expect(hasEditorPrivileges("super_admin")).toBe(true);
  });
  it("grants editor access to admin", () => {
    expect(hasEditorPrivileges("admin")).toBe(true);
  });
  it("grants editor access to editor", () => {
    expect(hasEditorPrivileges("editor")).toBe(true);
  });
  it("grants editor access to consultant", () => {
    expect(hasEditorPrivileges("consultant")).toBe(true);
  });
  it("denies editor access to viewer", () => {
    expect(hasEditorPrivileges("viewer")).toBe(false);
  });
  it("denies editor access to reviewer", () => {
    expect(hasEditorPrivileges("reviewer")).toBe(false);
  });
});

describe("hasViewerPrivileges", () => {
  it("grants viewer access to all roles", () => {
    expect(hasViewerPrivileges("admin")).toBe(true);
    expect(hasViewerPrivileges("viewer")).toBe(true);
    expect(hasViewerPrivileges("reviewer")).toBe(true);
  });
});

describe("mapLegacyRoleToStandard", () => {
  it("maps company_admin to admin", () => {
    expect(mapLegacyRoleToStandard("company_admin")).toBe("admin");
  });
  it("maps business to admin", () => {
    expect(mapLegacyRoleToStandard("business")).toBe("admin");
  });
  it("maps expert to viewer", () => {
    expect(mapLegacyRoleToStandard("expert")).toBe("viewer");
  });
  it("maps company_user to viewer", () => {
    expect(mapLegacyRoleToStandard("company_user")).toBe("viewer");
  });
  it("maps unknown role to viewer", () => {
    expect(mapLegacyRoleToStandard("xyz_unknown")).toBe("viewer");
  });
  it("handles case-insensitive input", () => {
    expect(mapLegacyRoleToStandard("ADMIN")).toBe("admin");
    expect(mapLegacyRoleToStandard("Consultant")).toBe("consultant");
  });
});

describe("validateRole", () => {
  it("returns valid standard roles unchanged", () => {
    expect(validateRole("admin")).toBe("admin");
    expect(validateRole("editor")).toBe("editor");
    expect(validateRole("super_admin")).toBe("super_admin");
  });
  it("maps legacy roles", () => {
    expect(validateRole("company_admin")).toBe("admin");
  });
  it("returns viewer for undefined", () => {
    expect(validateRole(undefined)).toBe("viewer");
  });
});

describe("getRoleDisplayName", () => {
  it("returns correct display names", () => {
    expect(getRoleDisplayName("admin")).toBe("Administrator");
    expect(getRoleDisplayName("super_admin")).toBe("Super Administrator");
    expect(getRoleDisplayName("reviewer")).toBe("Reviewer");
  });
});

describe("getUserRoleFromCompanyAccess", () => {
  it("maps access levels correctly", () => {
    expect(getUserRoleFromCompanyAccess("admin")).toBe("admin");
    expect(getUserRoleFromCompanyAccess("business")).toBe("admin");
    expect(getUserRoleFromCompanyAccess("editor")).toBe("editor");
    expect(getUserRoleFromCompanyAccess("viewer")).toBe("viewer");
    expect(getUserRoleFromCompanyAccess("unknown")).toBe("viewer");
  });
});
