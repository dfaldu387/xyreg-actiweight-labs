import { vi } from "vitest";

/**
 * Creates a chainable mock query builder that mirrors Supabase's API.
 * Use `mockResolvedData` to set what `.single()` / `.maybeSingle()` / the terminal call returns.
 */
export function createMockQueryBuilder(resolvedData: any = null, error: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedData, error }),
    then: vi.fn((resolve: any) => resolve({ data: Array.isArray(resolvedData) ? resolvedData : resolvedData ? [resolvedData] : [], error })),
  };
  return builder;
}

export function createMockSupabaseClient(overrides: Record<string, any> = {}) {
  return {
    from: vi.fn((table: string) => {
      if (overrides[table]) return overrides[table];
      return createMockQueryBuilder();
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
    ...overrides,
  };
}
