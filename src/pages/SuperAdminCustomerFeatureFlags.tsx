import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sparkles, Wand2, Lightbulb, MessageCircle, Languages,
  Building2, Cloud, Loader2, Check, Search, Plus, X,
  LayoutGrid, Compass
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Feature {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const FEATURES: Feature[] = [
  {
    key: 'professor-xyreg',
    name: 'Professor Xyreg',
    description: 'Floating AI advisory assistant',
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'ai-auto-fill',
    name: 'AI Auto-Fill',
    description: 'Generate document content with AI',
    icon: <Wand2 className="w-4 h-4" />,
    iconBg: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'ai-inline-suggestions',
    name: 'AI Inline Suggestions',
    description: 'In-editor AI suggestions and rewrites',
    icon: <Lightbulb className="w-4 h-4" />,
    iconBg: 'bg-yellow-100 text-yellow-700',
  },
  {
    key: 'communications-threads',
    name: 'Communications & Threads',
    description: 'Internal messaging between users',
    icon: <MessageCircle className="w-4 h-4" />,
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'multi-language-translation',
    name: 'Multi-Language Translation',
    description: 'Google Translate widget',
    icon: <Languages className="w-4 h-4" />,
    iconBg: 'bg-rose-100 text-rose-700',
  },
  {
    key: 'strategic-blueprint',
    name: 'Strategic Blueprint',
    description: 'Company strategic planning',
    icon: <Compass className="w-4 h-4" />,
    iconBg: 'bg-orange-100 text-orange-700',
  },
  {
    key: 'business-canvas',
    name: 'Business Canvas',
    description: 'Business model canvas tool',
    icon: <LayoutGrid className="w-4 h-4" />,
    iconBg: 'bg-orange-100 text-orange-700',
  },
];

interface CustomerCompany {
  id: string;
  name: string;
}

type FlagRow = { company_id: string; feature_key: string; is_enabled: boolean };

const cellKey = (companyId: string, featureKey: string) => `${companyId}::${featureKey}`;

// Detect "relation does not exist" / "table not in schema cache" errors thrown
// by Supabase before the migration has been applied.
const isTableMissingError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const code = e.code ?? '';
  const msg = (e.message ?? '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    msg.includes("relation \"public.customer_feature_flags\"") ||
    msg.includes('customer_feature_flags') && msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
};

export default function SuperAdminCustomerFeatureFlags() {
  const [allCompanies, setAllCompanies] = useState<CustomerCompany[]>([]);
  const [addedCompanyIds, setAddedCompanyIds] = useState<Set<string>>(new Set());
  const [flagsByCompany, setFlagsByCompany] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        const { data: companyRows, error: companyErr } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_archived', false)
          .order('name', { ascending: true });

        if (companyErr) throw companyErr;
        const found = (companyRows ?? []) as CustomerCompany[];
        setAllCompanies(found);

        const { data: flagRows, error: flagErr } = await (supabase as any)
          .from('customer_feature_flags')
          .select('company_id, feature_key, is_enabled');

        if (!flagErr) {
          const grouped: Record<string, Record<string, boolean>> = {};
          const added = new Set<string>();
          ((flagRows ?? []) as FlagRow[]).forEach(row => {
            added.add(row.company_id);
            if (!grouped[row.company_id]) grouped[row.company_id] = {};
            grouped[row.company_id][row.feature_key] = row.is_enabled;
          });
          setFlagsByCompany(grouped);
          setAddedCompanyIds(added);
        } else if (!isTableMissingError(flagErr)) {
          console.warn('customer_feature_flags load error:', flagErr.message);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flashSaved = useCallback(() => {
    setSaveStatus('saved');
    if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
    saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCompanies
      .filter(c => !addedCompanyIds.has(c.id) && c.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allCompanies, addedCompanyIds, searchQuery]);

  const displayedCompanies = useMemo(() => {
    return allCompanies
      .filter(c => addedCompanyIds.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCompanies, addedCompanyIds]);

  const addCompany = async (company: CustomerCompany) => {
    setSearchQuery('');
    setShowDropdown(false);

    setAddedCompanyIds(prev => new Set([...prev, company.id]));
    setFlagsByCompany(prev => ({
      ...prev,
      [company.id]: Object.fromEntries(FEATURES.map(f => [f.key, true])),
    }));
    setBusyCompanyId(company.id);
    setSaveStatus('saving');

    try {
      const rows = FEATURES.map(f => ({
        company_id: company.id,
        feature_key: f.key,
        is_enabled: true,
      }));
      const { error } = await (supabase as any)
        .from('customer_feature_flags')
        .upsert(rows, { onConflict: 'company_id,feature_key' });
      if (error) throw error;
      flashSaved();
    } catch (err) {
      if (isTableMissingError(err)) {
        setSaveStatus('idle');
      } else {
        console.error('Error adding customer:', err);
        toast.error('Failed to add customer');
        setSaveStatus('error');
        setAddedCompanyIds(prev => {
          const next = new Set(prev);
          next.delete(company.id);
          return next;
        });
        setFlagsByCompany(prev => {
          const next = { ...prev };
          delete next[company.id];
          return next;
        });
      }
    } finally {
      setBusyCompanyId(null);
    }
  };

  const removeCompany = async (companyId: string) => {
    const prevFlags = flagsByCompany[companyId];
    setAddedCompanyIds(prev => {
      const next = new Set(prev);
      next.delete(companyId);
      return next;
    });
    setFlagsByCompany(prev => {
      const next = { ...prev };
      delete next[companyId];
      return next;
    });
    setBusyCompanyId(companyId);
    setSaveStatus('saving');

    try {
      const { error } = await (supabase as any)
        .from('customer_feature_flags')
        .delete()
        .eq('company_id', companyId);
      if (error) throw error;
      flashSaved();
    } catch (err) {
      if (isTableMissingError(err)) {
        setSaveStatus('idle');
      } else {
        console.error('Error removing customer:', err);
        toast.error('Failed to remove customer');
        setSaveStatus('error');
        setAddedCompanyIds(prev => new Set([...prev, companyId]));
        if (prevFlags) {
          setFlagsByCompany(prev => ({ ...prev, [companyId]: prevFlags }));
        }
      }
    } finally {
      setBusyCompanyId(null);
    }
  };

  const toggleFlag = async (companyId: string, featureKey: string, nextValue: boolean) => {
    setFlagsByCompany(prev => ({
      ...prev,
      [companyId]: { ...(prev[companyId] ?? {}), [featureKey]: nextValue },
    }));
    setSavingCell(cellKey(companyId, featureKey));
    setSaveStatus('saving');

    try {
      const { error } = await (supabase as any)
        .from('customer_feature_flags')
        .upsert(
          { company_id: companyId, feature_key: featureKey, is_enabled: nextValue },
          { onConflict: 'company_id,feature_key' }
        );
      if (error) throw error;
      flashSaved();
    } catch (err) {
      if (isTableMissingError(err)) {
        setSaveStatus('idle');
      } else {
        console.error('Error saving feature flag:', err);
        toast.error('Failed to save change');
        setSaveStatus('error');
        setFlagsByCompany(prev => ({
          ...prev,
          [companyId]: { ...(prev[companyId] ?? {}), [featureKey]: !nextValue },
        }));
      }
    } finally {
      setSavingCell(null);
    }
  };

  const isEnabled = (companyId: string, featureKey: string) =>
    (flagsByCompany[companyId]?.[featureKey]) !== false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Loading feature flags...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Feature Flags</h1>
                <p className="text-sm text-muted-foreground">Per-customer feature access overrides</p>
              </div>
            </div>

            <div className="flex-1" />

            <div ref={searchRef} className="w-[360px] relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search and add customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-10 h-10 bg-white"
              />
              {showDropdown && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No matching customers
                    </div>
                  ) : (
                    searchResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => addCompany(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-slate-900">{c.name}</span>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                saveStatus === 'saving' && "bg-blue-50 text-blue-600",
                saveStatus === 'saved' && "bg-green-50 text-green-600",
                (saveStatus === 'idle' || saveStatus === 'error') && "bg-slate-100 text-slate-500"
              )}>
                {saveStatus === 'saving' && (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>)}
                {saveStatus === 'saved' && (<><Check className="w-4 h-4" />Saved</>)}
                {(saveStatus === 'idle' || saveStatus === 'error') && (<><Cloud className="w-4 h-4" />Auto Save</>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {displayedCompanies.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No customers added yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Use the search above to find and add a customer to manage their feature flags.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky left-0 bg-slate-50 text-left px-5 py-4 font-semibold text-sm text-slate-700 border-r border-slate-200 min-w-[260px]">
                      Customer
                    </th>
                    {FEATURES.map(f => (
                      <th key={f.key} className="px-4 py-4 text-center font-semibold text-sm text-slate-700 min-w-[160px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", f.iconBg)}>
                            {f.icon}
                          </div>
                          <div>
                            <div className="text-slate-900">{f.name}</div>
                            <div className="text-xs font-normal text-slate-500 mt-0.5">{f.description}</div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedCompanies.map((company, rowIdx) => {
                    const isBusy = busyCompanyId === company.id;
                    return (
                      <tr
                        key={company.id}
                        className={cn(
                          "border-b border-slate-200 last:border-b-0",
                          rowIdx % 2 === 1 && "bg-slate-50/40"
                        )}
                      >
                        <td className={cn(
                          "sticky left-0 px-5 py-4 border-r border-slate-200 font-medium text-slate-900",
                          rowIdx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="flex-1">{company.name}</span>
                            <button
                              onClick={() => removeCompany(company.id)}
                              disabled={isBusy}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                              title="Remove customer from feature flags"
                            >
                              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                        {FEATURES.map(f => {
                          const enabled = isEnabled(company.id, f.key);
                          const isSavingThis = savingCell === cellKey(company.id, f.key);
                          return (
                            <td key={f.key} className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={enabled}
                                  onCheckedChange={(v) => toggleFlag(company.id, f.key, v)}
                                  disabled={isSavingThis || isBusy}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
