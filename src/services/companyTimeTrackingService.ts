import { supabase } from "@/integrations/supabase/client";

// Table not yet in generated types — use untyped access
const db = supabase as any;

class CompanyTimeTrackingService {
  private currentEntryId: string | null = null;
  private currentCompanyId: string | null = null;

  async startSession(companyId: string): Promise<void> {
    if (this.currentCompanyId === companyId && this.currentEntryId) return;
    await this.endSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await db
      .from('user_company_time_entries')
      .insert({
        user_id: user.id,
        company_id: companyId,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!error && data) {
      this.currentEntryId = data.id;
      this.currentCompanyId = companyId;
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentEntryId) return;

    const entryId = this.currentEntryId;
    this.currentEntryId = null;
    this.currentCompanyId = null;

    const now = new Date().toISOString();

    const { data: entry } = await db
      .from('user_company_time_entries')
      .select('started_at')
      .eq('id', entryId)
      .single();

    if (entry) {
      const started = new Date(entry.started_at).getTime();
      const ended = new Date(now).getTime();
      const durationSeconds = Math.min(Math.round((ended - started) / 1000), 7200);

      await db
        .from('user_company_time_entries')
        .update({ ended_at: now, duration_seconds: durationSeconds })
        .eq('id', entryId);
    }
  }

  async getTotalTime(companyId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await db
      .from('user_company_time_entries')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .not('duration_seconds', 'is', null);

    if (error || !data) return 0;
    return (data as any[]).reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);
  }

  async getWeeklyTime(companyId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await db
      .from('user_company_time_entries')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .not('duration_seconds', 'is', null)
      .gte('started_at', weekStart.toISOString());

    if (error || !data) return 0;
    return (data as any[]).reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);
  }

  isTracking(): boolean {
    return this.currentEntryId !== null;
  }

  getCurrentCompanyId(): string | null {
    return this.currentCompanyId;
  }
}

export const companyTimeTrackingService = new CompanyTimeTrackingService();
