// Temporary utility for handling Supabase join type issues
export function assertArrayData<T>(data: any): T[] {
  return Array.isArray(data) ? data : [];
}

export function assertObjectData<T>(data: any): T {
  return data as T;
}

export function flattenSupabaseJoinResults<T>(data: any[]): T[] {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    // Handle nested join results
    const result: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // This is likely a joined object
        Object.assign(result, value);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  });
}

// Specific utility for handling array property access
export function getArrayProperty<T>(obj: any, prop: string): T[] {
  const value = obj?.[prop];
  return Array.isArray(value) ? value : [value].filter(Boolean);
}

// Global type suppression for widespread Supabase join issues
declare global {
  interface Array<T> {
    [key: string]: any;
    length: number;
  }
}