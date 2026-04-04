/**
 * Ambient type declarations for packages with missing or broken type definitions.
 * This file must NOT contain `export {}` — it provides ambient module declarations.
 */

// ─── @mui/icons-material ────────────────────────────────────────────────────
declare module '@mui/icons-material' {
  import React from 'react';
  const _default: React.FC<any>;
  // Named exports for all used icons
  export const Google: React.FC<any>;
  export const Close: React.FC<any>;
  export const Search: React.FC<any>;
  export const Add: React.FC<any>;
  export const Delete: React.FC<any>;
  export const Edit: React.FC<any>;
  export const Check: React.FC<any>;
  export const Warning: React.FC<any>;
  export const Info: React.FC<any>;
  export const Error: React.FC<any>;
  export const ArrowBack: React.FC<any>;
  export const ArrowForward: React.FC<any>;
  export const MoreVert: React.FC<any>;
  export const Menu: React.FC<any>;
  export const Visibility: React.FC<any>;
  export const VisibilityOff: React.FC<any>;
  export const Person: React.FC<any>;
  export const PersonAdd: React.FC<any>;
  export const HourglassEmpty: React.FC<any>;
  export const Clear: React.FC<any>;
  export const ExpandMore: React.FC<any>;
  export const ExpandLess: React.FC<any>;
  export const Inventory: React.FC<any>;
  export const FilterList: React.FC<any>;
  export const Sort: React.FC<any>;
  export const Settings: React.FC<any>;
  export const Dashboard: React.FC<any>;
  export const Assessment: React.FC<any>;
  export const CloudUpload: React.FC<any>;
  export const CloudDownload: React.FC<any>;
  export const Download: React.FC<any>;
  export const Upload: React.FC<any>;
  export const Refresh: React.FC<any>;
  export const ContentCopy: React.FC<any>;
  export const OpenInNew: React.FC<any>;
  export const BarChart: React.FC<any>;
  export const Description: React.FC<any>;
  export const CheckCircle: React.FC<any>;
  export const Pending: React.FC<any>;
  export const InsertDriveFile: React.FC<any>;
  export const Schedule: React.FC<any>;
  export const CalendarToday: React.FC<any>;
  export const ErrorOutline: React.FC<any>;
  export const FolderOpen: React.FC<any>;
  export const Assignment: React.FC<any>;
  export const ChevronRight: React.FC<any>;
  export const ChevronLeft: React.FC<any>;
  // Any other icon accessed via named export
  export { _default as default };
}

// ─── @mui/icons-material/* subpath imports ──────────────────────────────────
declare module '@mui/icons-material/*' {
  import React from 'react';
  const Icon: React.FC<any>;
  export default Icon;
}

// ─── lodash ─────────────────────────────────────────────────────────────────
declare module 'lodash' {
  export function debounce<T extends (...args: any[]) => any>(func: T, wait?: number, options?: any): T & { cancel(): void; flush(): void };
  export function throttle<T extends (...args: any[]) => any>(func: T, wait?: number, options?: any): T & { cancel(): void; flush(): void };
  export function cloneDeep<T>(value: T): T;
  export function isEqual(value: any, other: any): boolean;
  export function get(object: any, path: string | string[], defaultValue?: any): any;
  export function set(object: any, path: string | string[], value: any): any;
  export function omit<T extends object>(object: T, ...paths: string[]): Partial<T>;
  export function pick<T extends object>(object: T, ...paths: string[]): Partial<T>;
  export function merge<T>(object: T, ...sources: any[]): T;
  export function uniq<T>(array: T[]): T[];
  export function groupBy<T>(array: T[], iteratee: any): Record<string, T[]>;
  export function sortBy<T>(array: T[], iteratees: any): T[];
}
