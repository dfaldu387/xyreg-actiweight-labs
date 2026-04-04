import { supabase } from '@/integrations/supabase/client';

export interface PasswordPolicy {
  enabled: boolean;
  expirationDays: number;
}

export interface PasswordExpirationStatus {
  isExpired: boolean;
  daysUntilExpiry: number | null;
  lastChanged: string | null;
  policyDays: number | null;
}

const DEFAULT_POLICY: PasswordPolicy = { enabled: false, expirationDays: 90 };

export class PasswordExpirationService {
  /**
   * Record a password change event
   */
  static async recordPasswordChange(userId: string, source: 'manual' | 'forgot_password' | 'expiry_forced' | 'initial_seed' = 'manual'): Promise<void> {
    const { error } = await supabase
      .from('password_change_log')
      .insert({ user_id: userId, changed_at: new Date().toISOString(), change_source: source });

    if (error) {
      console.error('Failed to record password change:', error);
      throw new Error(`Failed to record password change: ${error.message}`);
    }
  }

  /**
   * Get the most recent password change timestamp for a user
   */
  static async getLastPasswordChange(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('password_change_log')
      .select('changed_at')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('No password change record found:', error.message);
      return null;
    }

    return data?.changed_at ?? null;
  }

  /**
   * Get the password policy for a specific company from its description JSON
   */
  static async getCompanyPasswordPolicy(companyId: string): Promise<PasswordPolicy> {
    const { data, error } = await supabase
      .from('companies')
      .select('description')
      .eq('id', companyId)
      .single();

    if (error || !data?.description) {
      return DEFAULT_POLICY;
    }

    try {
      const parsed = JSON.parse(data.description);
      if (parsed.passwordPolicy && typeof parsed.passwordPolicy === 'object') {
        return {
          enabled: parsed.passwordPolicy.enabled === true,
          expirationDays: parsed.passwordPolicy.expirationDays || 90,
        };
      }
    } catch {
      // Invalid JSON, return default
    }

    return DEFAULT_POLICY;
  }

  /**
   * Get the effective (strictest) password policy across all companies a user belongs to
   */
  static async getEffectivePasswordPolicy(userId: string): Promise<PasswordPolicy> {
    const { data: accessRecords, error } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', userId);

    if (error || !accessRecords || accessRecords.length === 0) {
      return DEFAULT_POLICY;
    }

    const companyIds = accessRecords.map(r => r.company_id);

    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('description')
      .in('id', companyIds);

    if (compError || !companies) {
      return DEFAULT_POLICY;
    }

    let strictestPolicy: PasswordPolicy = DEFAULT_POLICY;
    let hasEnabledPolicy = false;

    for (const company of companies) {
      if (!company.description) continue;
      try {
        const parsed = JSON.parse(company.description);
        if (parsed.passwordPolicy?.enabled === true) {
          const days = parsed.passwordPolicy.expirationDays || 90;
          if (!hasEnabledPolicy || days < strictestPolicy.expirationDays) {
            strictestPolicy = { enabled: true, expirationDays: days };
            hasEnabledPolicy = true;
          }
        }
      } catch {
        // Skip companies with invalid JSON
      }
    }

    return strictestPolicy;
  }

  /**
   * Check if a user's password is expired based on the effective policy
   */
  static async isPasswordExpired(userId: string): Promise<PasswordExpirationStatus> {
    const policy = await this.getEffectivePasswordPolicy(userId);

    if (!policy.enabled) {
      return { isExpired: false, daysUntilExpiry: null, lastChanged: null, policyDays: null };
    }

    let lastChanged = await this.getLastPasswordChange(userId);

    if (!lastChanged) {
      // No password_change_log record — fall back to user's account creation date
      // This handles invited users who never had an initial_seed entry
      const { data: { user } } = await supabase.auth.getUser();
      const createdAt = user?.created_at;

      if (createdAt) {
        // Auto-seed the log so this fallback only runs once
        try {
          await this.recordPasswordChange(userId, 'initial_seed');
        } catch {
          // Ignore if seeding fails (e.g. RLS) — still use createdAt for this check
        }
        lastChanged = createdAt;
      } else {
        // No user creation date available — treat as not expired to avoid blocking
        return { isExpired: false, daysUntilExpiry: policy.expirationDays, lastChanged: null, policyDays: policy.expirationDays };
      }
    }

    const lastChangedDate = new Date(lastChanged);
    const now = new Date();
    const diffMs = now.getTime() - lastChangedDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const daysUntilExpiry = Math.ceil(policy.expirationDays - diffDays);

    return {
      isExpired: diffDays >= policy.expirationDays,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      lastChanged,
      policyDays: policy.expirationDays,
    };
  }
}
