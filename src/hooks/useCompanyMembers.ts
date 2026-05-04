import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyMember {
  id: string;
  name: string;
  email: string | null;
}

export function useCompanyMembers(companyId?: string) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) { setMembers([]); return; }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_company_access")
          .select("user_id, user_profiles!inner(id, email, first_name, last_name)")
          .eq("company_id", companyId);
        if (error) throw error;
        const list: CompanyMember[] = (data ?? [])
          .map((r: any) => {
            const p = r.user_profiles;
            const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || p?.email || "Unknown";
            return { id: p?.id ?? r.user_id, name, email: p?.email ?? null };
          })
          .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setMembers(list);
      } catch (e) {
        console.error("[useCompanyMembers]", e);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  return { members, isLoading };
}