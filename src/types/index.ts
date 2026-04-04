export * from './client';
export * from './phaseDocuments';
export * from './lifecyclePhases';
export * from './company';
export * from './gapAnalysisTemplate';
export * from './auditLog';

// Import the UserRole type from documentTypes
import { UserRole } from './documentTypes';

// Define MenuItem interface for the sidebar
export interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  subItems?: MenuItem[];
  contextHeader?: 'company' | 'product'; // Added for sidebar context headers
}

// Define company role map type for DevMode
export interface CompanyRoleMap {
  [companyId: string]: UserRole;
}

// Re-export Device3D types for convenience
export type { Device3DModel, Device3DViewerProps, Device3DModelUploadProps } from './device3d';

// Re-export notified body types for convenience
export type { NotifiedBody, NotifiedBodyScope } from './notifiedBody';

// Device 3D Model interface for 3D model uploads and management
export interface Device3DModelData {
  id?: string;
  name?: string;
  file_path?: string;
  url?: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: string;
  metadata?: Record<string, any>;
}
