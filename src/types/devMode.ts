import { UserRole } from "@/types/documentTypes";
import { Company } from "@/context/DevModeContext";

export interface DevModeScenario {
  id: string;
  name: string;
  description: string;
  category: 'single-company' | 'multi-company' | 'limited-access' | 'role-based';
  config: {
    selectedCompanies: Company[];
    primaryCompany: Company | null;
    globalRole: UserRole;
    companyRoles: { [companyId: string]: UserRole };
    companyInternalStatuses: { [companyId: string]: boolean };
    isInternalUser: boolean;
  };
}

export interface DevModeScenarioCategory {
  id: string;
  name: string;
  description: string;
  scenarios: DevModeScenario[];
}

// Predefined test companies for scenarios
export const TEST_COMPANIES: Company[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "MedTech Innovations Corp" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Global Devices Ltd" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Surgical Systems Inc" },
  { id: "44444444-4444-4444-4444-444444444444", name: "BioMed Solutions GmbH" },
  { id: "55555555-5555-5555-5555-555555555555", name: "Advanced Diagnostics Co" },
];

// Predefined scenarios for common testing scenarios
export const PREDEFINED_SCENARIOS: DevModeScenarioCategory[] = [
  {
    id: 'single-company',
    name: 'Single Company Users',
    description: 'Test scenarios for users with access to only one company',
    scenarios: [
      {
        id: 'single-company-admin',
        name: 'Single Company Admin',
        description: 'Admin user with full access to one company',
        category: 'single-company',
        config: {
          selectedCompanies: [TEST_COMPANIES[0]],
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'admin',
          companyRoles: { [TEST_COMPANIES[0].id]: 'admin' },
          companyInternalStatuses: { [TEST_COMPANIES[0].id]: true },
          isInternalUser: true,
        }
      },
      {
        id: 'single-company-viewer',
        name: 'Single Company Viewer',
        description: 'Read-only user with view access to one company',
        category: 'single-company',
        config: {
          selectedCompanies: [TEST_COMPANIES[0]],
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'viewer',
          companyRoles: { [TEST_COMPANIES[0].id]: 'viewer' },
          companyInternalStatuses: { [TEST_COMPANIES[0].id]: true },
          isInternalUser: true,
        }
      },
      {
        id: 'single-company-external',
        name: 'External Consultant (Single Company)',
        description: 'External user with limited access to one company',
        category: 'single-company',
        config: {
          selectedCompanies: [TEST_COMPANIES[0]],
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'viewer',
          companyRoles: { [TEST_COMPANIES[0].id]: 'viewer' },
          companyInternalStatuses: { [TEST_COMPANIES[0].id]: false },
          isInternalUser: false,
        }
      }
    ]
  },
  {
    id: 'multi-company',
    name: 'Multi-Company Users',
    description: 'Test scenarios for users with access to multiple companies',
    scenarios: [
      {
        id: 'multi-company-admin',
        name: 'Multi-Company Admin',
        description: 'Admin user with full access to multiple companies',
        category: 'multi-company',
        config: {
          selectedCompanies: TEST_COMPANIES.slice(0, 3),
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'admin',
          companyRoles: {
            [TEST_COMPANIES[0].id]: 'admin',
            [TEST_COMPANIES[1].id]: 'admin',
            [TEST_COMPANIES[2].id]: 'admin'
          },
          companyInternalStatuses: {
            [TEST_COMPANIES[0].id]: true,
            [TEST_COMPANIES[1].id]: true,
            [TEST_COMPANIES[2].id]: true
          },
          isInternalUser: true,
        }
      },
      {
        id: 'multi-company-mixed-roles',
        name: 'Multi-Company Mixed Roles',
        description: 'User with different roles across different companies',
        category: 'multi-company',
        config: {
          selectedCompanies: TEST_COMPANIES.slice(0, 4),
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'admin',
          companyRoles: {
            [TEST_COMPANIES[0].id]: 'admin',
            [TEST_COMPANIES[1].id]: 'editor',
            [TEST_COMPANIES[2].id]: 'viewer',
            [TEST_COMPANIES[3].id]: 'viewer'
          },
          companyInternalStatuses: {
            [TEST_COMPANIES[0].id]: true,
            [TEST_COMPANIES[1].id]: true,
            [TEST_COMPANIES[2].id]: false,
            [TEST_COMPANIES[3].id]: false
          },
          isInternalUser: true,
        }
      },
      {
        id: 'multi-company-external-mixed',
        name: 'External User - Mixed Access',
        description: 'External user with varying access levels across companies',
        category: 'multi-company',
        config: {
          selectedCompanies: TEST_COMPANIES.slice(1, 4),
          primaryCompany: TEST_COMPANIES[1],
          globalRole: 'viewer',
          companyRoles: {
            [TEST_COMPANIES[1].id]: 'editor',
            [TEST_COMPANIES[2].id]: 'viewer',
            [TEST_COMPANIES[3].id]: 'viewer'
          },
          companyInternalStatuses: {
            [TEST_COMPANIES[1].id]: false,
            [TEST_COMPANIES[2].id]: false,
            [TEST_COMPANIES[3].id]: false
          },
          isInternalUser: false,
        }
      }
    ]
  },
  {
    id: 'role-based',
    name: 'Role-Based Access',
    description: 'Test scenarios for different user roles and permissions',
    scenarios: [
      {
        id: 'super-admin',
        name: 'Super Admin',
        description: 'Admin with access to all companies and full permissions',
        category: 'role-based',
        config: {
          selectedCompanies: TEST_COMPANIES,
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'admin',
          companyRoles: TEST_COMPANIES.reduce((acc, company) => ({
            ...acc,
            [company.id]: 'admin'
          }), {}),
          companyInternalStatuses: TEST_COMPANIES.reduce((acc, company) => ({
            ...acc,
            [company.id]: true
          }), {}),
          isInternalUser: true,
        }
      },
      {
        id: 'global-viewer',
        name: 'Global Viewer',
        description: 'Read-only access across multiple companies',
        category: 'role-based',
        config: {
          selectedCompanies: TEST_COMPANIES.slice(0, 3),
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'viewer',
          companyRoles: {
            [TEST_COMPANIES[0].id]: 'viewer',
            [TEST_COMPANIES[1].id]: 'viewer',
            [TEST_COMPANIES[2].id]: 'viewer'
          },
          companyInternalStatuses: {
            [TEST_COMPANIES[0].id]: true,
            [TEST_COMPANIES[1].id]: true,
            [TEST_COMPANIES[2].id]: true
          },
          isInternalUser: true,
        }
      }
    ]
  },
  {
    id: 'limited-access',
    name: 'Limited Access Scenarios',
    description: 'Test scenarios for users with restricted or limited access',
    scenarios: [
      {
        id: 'no-companies',
        name: 'No Company Access',
        description: 'User with no company access (for testing empty states)',
        category: 'limited-access',
        config: {
          selectedCompanies: [],
          primaryCompany: null,
          globalRole: 'viewer',
          companyRoles: {},
          companyInternalStatuses: {},
          isInternalUser: true,
        }
      },
      {
        id: 'pending-access',
        name: 'Pending Access',
        description: 'New user waiting for company access approval',
        category: 'limited-access',
        config: {
          selectedCompanies: [TEST_COMPANIES[0]],
          primaryCompany: TEST_COMPANIES[0],
          globalRole: 'viewer',
          companyRoles: { [TEST_COMPANIES[0].id]: 'viewer' },
          companyInternalStatuses: { [TEST_COMPANIES[0].id]: false },
          isInternalUser: false,
        }
      }
    ]
  }
];