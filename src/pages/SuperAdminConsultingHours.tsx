import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  GraduationCap,
  Building2,
  Clock,
  DollarSign,
  Download,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
  Check,
  ChevronsUpDown,
  Pencil,
  Package as PackageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

// --- Types ---

interface ConsultingLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  type: "purchase" | "usage";
  hours: number;
  description: string | null;
  stripe_session_id: string | null;
  amount_paid: number | null;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface CompanyInfo {
  id: string;
  name: string;
}

interface CompanySummary {
  companyId: string;
  companyName: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  totalSpent: number;
  transactions: number;
  lastActivity: string | null;
}

interface ConsultingPackageInfo {
  id: string;
  product_key: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  hours_per_pack: number;
}

// --- Helpers ---

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const BAR_COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#047857", "#065f46", "#064e3b", "#022c22"];

// --- Component ---

export default function SuperAdminConsultingHours() {
  const [logs, setLogs] = useState<ConsultingLogEntry[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [planBalances, setPlanBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Date range
  const now = new Date();
  const firstOfYear = new Date(now.getFullYear(), 0, 1);
  const [dateFrom, setDateFrom] = useState(formatDate(firstOfYear));
  const [dateTo, setDateTo] = useState(formatDate(now));

  // Add/Deduct dialog
  const [addHoursOpen, setAddHoursOpen] = useState(false);
  const [addHoursType, setAddHoursType] = useState<"add" | "deduct">("add");
  const [addHoursCompanyId, setAddHoursCompanyId] = useState("");
  const [addHoursAmount, setAddHoursAmount] = useState(8);
  const [addMinutesAmount, setAddMinutesAmount] = useState(0);
  const [addHoursNote, setAddHoursNote] = useState("");
  const [addHoursSubmitting, setAddHoursSubmitting] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);

  // Detail dialog
  const [detailCompany, setDetailCompany] = useState<CompanySummary | null>(null);

  // Consulting package settings
  const [pkg, setPkg] = useState<ConsultingPackageInfo | null>(null);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgEditOpen, setPkgEditOpen] = useState(false);
  const [pkgEditName, setPkgEditName] = useState("");
  const [pkgEditDescription, setPkgEditDescription] = useState("");
  const [pkgEditPrice, setPkgEditPrice] = useState("");
  const [pkgEditHours, setPkgEditHours] = useState("");
  const [pkgEditSubmitting, setPkgEditSubmitting] = useState(false);

  const loadConsultingPackage = async () => {
    setPkgLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-dynamic-products", {
        body: { product_key: "consulting_hours" },
      });
      if (error) {
        console.error("Failed to load consulting package:", error);
        return;
      }
      const first = data?.products?.[0];
      if (!first) {
        setPkg(null);
        return;
      }
      setPkg({
        id: first.id,
        product_key: first.product_key,
        stripe_product_id: first.stripe_product_id,
        stripe_price_id: first.stripe_price_id,
        name: first.name,
        description: first.description ?? null,
        price_cents: first.price_cents,
        currency: first.currency,
        hours_per_pack: Number(first.metadata?.hours_per_pack ?? 0),
      });
    } catch (err) {
      console.error("Failed to load consulting package:", err);
    } finally {
      setPkgLoading(false);
    }
  };

  const openPackageEdit = () => {
    if (!pkg) return;
    setPkgEditName(pkg.name);
    setPkgEditDescription(pkg.description ?? "");
    setPkgEditPrice((pkg.price_cents / 100).toString());
    setPkgEditHours(String(pkg.hours_per_pack));
    setPkgEditOpen(true);
  };

  const submitPackageEdit = async () => {
    if (!pkg) return;
    const newPriceUnits = parseFloat(pkgEditPrice);
    const newHours = parseInt(pkgEditHours, 10);
    if (!Number.isFinite(newPriceUnits) || newPriceUnits <= 0) {
      toast.error("Price must be a positive number");
      return;
    }
    if (!Number.isInteger(newHours) || newHours <= 0) {
      toast.error("Hours per pack must be a positive integer");
      return;
    }

    const payload: Record<string, unknown> = { id: pkg.id };
    if (pkgEditName.trim() && pkgEditName.trim() !== pkg.name) {
      payload.name = pkgEditName.trim();
    }
    if ((pkgEditDescription ?? "") !== (pkg.description ?? "")) {
      payload.description = pkgEditDescription;
    }
    const newPriceCents = Math.round(newPriceUnits * 100);
    if (newPriceCents !== pkg.price_cents) {
      payload.price_cents = newPriceCents;
    }
    if (newHours !== pkg.hours_per_pack) {
      payload.hours_per_pack = newHours;
    }
    if (Object.keys(payload).length === 1) {
      toast.info("No changes to save");
      return;
    }

    setPkgEditSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-dynamic-product", {
        body: payload,
      });
      if (error) {
        throw new Error(error.message ?? "Update failed");
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      toast.success("Consulting package updated");
      setPkgEditOpen(false);
      await loadConsultingPackage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      console.error("Package update failed:", err);
      toast.error(msg);
    } finally {
      setPkgEditSubmitting(false);
    }
  };

  // --- Fetch ---
  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadConsultingPackage();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logRes, companyRes, planRes] = await Promise.all([
        (supabase as any)
          .from("consulting_hours_log")
          .select("*")
          .gte("created_at", `${dateFrom}T00:00:00Z`)
          .lte("created_at", `${dateTo}T23:59:59Z`)
          .order("created_at", { ascending: false }),
        supabase
          .from("companies")
          .select("id, name")
          .or("is_archived.eq.false,is_archived.is.null")
          .not("name", "is", null)
          .neq("name", "")
          .order("name"),
        (supabase as any)
          .from("new_pricing_company_plans")
          .select("company_id, consulting_hours"),
      ]);

      setLogs((logRes.data ?? []) as ConsultingLogEntry[]);
      setCompanies((companyRes.data ?? []) as CompanyInfo[]);

      const balances: Record<string, number> = {};
      (planRes.data ?? []).forEach((p: any) => {
        balances[p.company_id] = p.consulting_hours ?? 0;
      });
      setPlanBalances(balances);
    } catch (err) {
      console.error("Error loading consulting hours:", err);
      toast.error("Failed to load consulting hours data");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Derived ---
  const companyMap = useMemo(() => {
    const m = new Map<string, string>();
    companies.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [companies]);

  const companySummaries = useMemo(() => {
    const map = new Map<string, CompanySummary>();
    logs.forEach((l) => {
      let s = map.get(l.company_id);
      if (!s) {
        s = {
          companyId: l.company_id,
          companyName: companyMap.get(l.company_id) || "Unknown",
          balance: planBalances[l.company_id] ?? 0,
          totalPurchased: 0,
          totalUsed: 0,
          totalSpent: 0,
          transactions: 0,
          lastActivity: null,
        };
        map.set(l.company_id, s);
      }
      s.transactions += 1;
      if (l.type === "purchase") {
        s.totalPurchased += l.hours;
        s.totalSpent += l.amount_paid || 0;
      } else {
        s.totalUsed += l.hours;
      }
      if (!s.lastActivity || l.created_at > s.lastActivity) {
        s.lastActivity = l.created_at;
      }
    });
    // Also include companies with balance but no logs in the date range
    Object.entries(planBalances).forEach(([companyId, balance]) => {
      if (!map.has(companyId) && balance > 0) {
        map.set(companyId, {
          companyId,
          companyName: companyMap.get(companyId) || "Unknown",
          balance,
          totalPurchased: 0,
          totalUsed: 0,
          totalSpent: 0,
          transactions: 0,
          lastActivity: null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalPurchased - a.totalPurchased);
  }, [logs, companyMap, planBalances]);

  const totals = useMemo(() => {
    let purchased = 0, used = 0, revenue = 0, transactions = 0;
    logs.forEach((l) => {
      transactions += 1;
      if (l.type === "purchase") {
        purchased += l.hours;
        revenue += l.amount_paid || 0;
      } else {
        used += l.hours;
      }
    });
    const totalBalance = Object.values(planBalances).reduce((sum, h) => sum + h, 0);
    return { purchased, used, revenue, transactions, totalBalance };
  }, [logs, planBalances]);

  // Companies eligible for the Add/Deduct dialog —
  // only those that have actually purchased consulting hours (balance > 0 OR has transactions)
  const eligibleCompanies = useMemo(() => {
    return companySummaries
      .filter((s) => s.balance > 0 || s.totalPurchased > 0 || s.transactions > 0)
      .map((s) => ({ id: s.companyId, name: s.companyName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companySummaries]);

  // Chart data — top 10 companies by hours purchased
  const chartData = useMemo(() => {
    return companySummaries
      .filter((s) => s.totalPurchased > 0)
      .slice(0, 10)
      .map((s) => ({
        name: s.companyName.length > 12 ? s.companyName.substring(0, 12) + "..." : s.companyName,
        hours: s.totalPurchased,
      }));
  }, [companySummaries]);

  // --- Export CSV ---
  const handleExportCSV = () => {
    const header = "Company,Type,Hours,Amount,Description,Date\n";
    const csvRows = logs.map((l) => {
      const name = (companyMap.get(l.company_id) || "Unknown").replace(/,/g, " ");
      return `${name},${l.type},${l.hours},${l.amount_paid ? (l.amount_paid / 100).toFixed(2) : "0"},${(l.description || "").replace(/,/g, " ")},${l.created_at}`;
    });
    const blob = new Blob([header + csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xyreg-consulting-hours-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // --- Add/Deduct handler ---
  const openAddDialog = (type: "add" | "deduct", companyId?: string) => {
    setAddHoursType(type);
    setAddHoursCompanyId(companyId || "");
    setAddHoursAmount(8);
    setAddMinutesAmount(0);
    setAddHoursNote("");
    setAddHoursOpen(true);
  };

  // Total in decimal hours (e.g. 1h 30m → 1.5)
  const addTotalHours = useMemo(() => {
    return Math.round((addHoursAmount + addMinutesAmount / 60) * 100) / 100;
  }, [addHoursAmount, addMinutesAmount]);

  const formatHM = (h: number, m: number) => {
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return "0h";
  };

  const handleAddHoursSubmit = async () => {
    if (!addHoursCompanyId) {
      toast.error("Please select a company");
      return;
    }
    if (addTotalHours <= 0) {
      toast.error("Enter at least 1 minute");
      return;
    }

    setAddHoursSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: plan, error: planError } = await (supabase as any)
        .from("new_pricing_company_plans")
        .select("id, consulting_hours")
        .eq("company_id", addHoursCompanyId)
        .maybeSingle();

      if (planError) throw new Error(planError.message);
      if (!plan) {
        toast.error("No plan found for this company. The company must have an active plan first.");
        return;
      }

      const currentHours = plan.consulting_hours ?? 0;
      const newHours = addHoursType === "add"
        ? Math.round((currentHours + addTotalHours) * 100) / 100
        : Math.max(0, Math.round((currentHours - addTotalHours) * 100) / 100);

      const { error: updateError } = await (supabase as any)
        .from("new_pricing_company_plans")
        .update({ consulting_hours: newHours, updated_at: new Date().toISOString() })
        .eq("id", plan.id);

      if (updateError) throw new Error(updateError.message);

      const label = formatHM(addHoursAmount, addMinutesAmount);

      const { error: logError } = await (supabase as any)
        .from("consulting_hours_log")
        .insert({
          company_id: addHoursCompanyId,
          user_id: user.id,
          type: addHoursType === "add" ? "purchase" : "usage",
          hours: addTotalHours,
          description: addHoursNote || (addHoursType === "add"
            ? `Manual credit: +${label} by super admin`
            : `Manual deduction: -${label} by super admin`),
          metadata: {
            source: "super_admin_manual",
            hours_part: addHoursAmount,
            minutes_part: addMinutesAmount,
            previous_balance: currentHours,
            new_balance: newHours,
            admin_user_id: user.id,
          },
        });

      if (logError) {
        console.error("Failed to write consulting_hours_log:", logError);
        toast.warning(`Balance updated, but log entry failed: ${logError.message}`);
      }

      toast.success(
        addHoursType === "add"
          ? `Added ${label} → balance: ${newHours}h`
          : `Deducted ${label} → balance: ${newHours}h`
      );

      setAddHoursOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Error updating consulting hours:", err);
      toast.error(err.message || "Failed to update hours");
    } finally {
      setAddHoursSubmitting(false);
    }
  };

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consulting Hours</h1>
          <p className="text-sm text-muted-foreground mt-1">Track consulting hours across all companies</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[155px] text-sm"
            />
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[155px] text-sm"
            />
          </div>
          <Button size="sm" variant="default" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Consulting Package Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-[260px]">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <PackageIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold">Consulting Package</h2>
                {pkgLoading ? (
                  <p className="text-sm text-muted-foreground mt-1">Loading…</p>
                ) : !pkg ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    No active consulting package configured.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                      <p className="font-medium truncate">{pkg.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Price</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: pkg.currency.toUpperCase(),
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }).format(pkg.price_cents / 100)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Hours / pack</p>
                      <p className="font-medium">{pkg.hours_per_pack}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Currency</p>
                      <p className="font-medium uppercase">{pkg.currency}</p>
                    </div>
                    {pkg.description && (
                      <div className="col-span-full">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                        <p className="text-sm">{pkg.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={openPackageEdit}
              disabled={!pkg || pkgLoading}
              className="gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Clock className="w-5 h-5 text-emerald-600" />}
          label="TOTAL HOURS SOLD"
          value={`${totals.purchased}h`}
          sub={`${totals.transactions} transactions`}
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          label="TOTAL REVENUE"
          value={`$${(totals.revenue / 100).toLocaleString()}`}
          sub="USD"
        />
        <SummaryCard
          icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
          label="HOURS USED"
          value={`${totals.used}h`}
          sub={`${totals.purchased - totals.used}h remaining total`}
        />
        <SummaryCard
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
          label="TOTAL BALANCE"
          value={`${totals.totalBalance}h`}
          sub={`${companySummaries.filter((s) => s.balance > 0).length} companies`}
        />
      </div>

      {/* Hours by Type + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Breakdown */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Hours by Type</h2>
            </div>
            <div className="space-y-4">
              {/* Purchased */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">Purchased</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold">{totals.purchased}h</span>
                  <span className="text-sm text-muted-foreground">
                    {totals.purchased > 0 ? Math.round((totals.purchased / (totals.purchased + totals.used || 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${totals.purchased > 0 ? Math.round((totals.purchased / (totals.purchased + totals.used || 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
              {/* Used */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">Used / Deducted</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold">{totals.used}h</span>
                  <span className="text-sm text-muted-foreground">
                    {totals.used > 0 ? Math.round((totals.used / (totals.purchased + totals.used || 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${totals.used > 0 ? Math.round((totals.used / (totals.purchased + totals.used || 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
              {/* Revenue */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. per hour</span>
                  <span className="text-sm font-semibold">
                    ${totals.purchased > 0 ? ((totals.revenue / 100) / totals.purchased).toFixed(0) : "0"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Company Hours</h2>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(value: number) => [`${value}h`, "Hours"]} />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                No consulting hours data in selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Table */}
      <Card>
        <CardContent className="pt-5 pb-2 px-5">
          <h2 className="text-base font-semibold mb-3">Usage by Company</h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Company Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Balance</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Purchased</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Used</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Revenue</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companySummaries.map((s) => (
                  <TableRow key={s.companyId} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-sm">{s.companyName}</TableCell>
                    <TableCell className="text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.balance > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {s.balance}h
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-emerald-600 font-medium">{s.totalPurchased}h</TableCell>
                    <TableCell className="text-sm text-blue-600 font-medium">{s.totalUsed}h</TableCell>
                    <TableCell className="text-sm font-medium">${(s.totalSpent / 100).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50"
                          onClick={() => openAddDialog("add", s.companyId)}
                        >
                          Add
                        </button>
                        <span className="text-muted-foreground">·</span>
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          onClick={() => openAddDialog("deduct", s.companyId)}
                        >
                          Deduct
                        </button>
                        <span className="text-muted-foreground">·</span>
                        <button
                          className="text-xs text-primary underline hover:text-primary/80"
                          onClick={() => setDetailCompany(s)}
                        >
                          View
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {companySummaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                      No consulting hours data in this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailCompany} onOpenChange={() => setDetailCompany(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{detailCompany?.companyName} — Consulting Hours</DialogTitle>
          </DialogHeader>
          {detailCompany && (
            <div className="space-y-4 max-h-[calc(85vh-80px)] flex flex-col overflow-hidden">
              {/* Summary chips */}
              <div className="flex gap-3 overflow-x-auto pb-2 shrink-0">
                <div className="rounded-lg border p-3 min-w-[140px] shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Balance</p>
                  <p className="text-xl font-bold text-emerald-600">{detailCompany.balance}h</p>
                </div>
                <div className="rounded-lg border p-3 min-w-[140px] shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Purchased</p>
                  <p className="text-xl font-bold">{detailCompany.totalPurchased}h</p>
                </div>
                <div className="rounded-lg border p-3 min-w-[140px] shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Used</p>
                  <p className="text-xl font-bold text-blue-600">{detailCompany.totalUsed}h</p>
                </div>
                <div className="rounded-lg border p-3 min-w-[140px] shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                  <p className="text-xl font-bold">${(detailCompany.totalSpent / 100).toLocaleString()}</p>
                </div>
              </div>

              {/* Transaction log */}
              <div className="border rounded-lg overflow-y-auto flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-xs uppercase">Date</TableHead>
                      <TableHead className="text-xs uppercase">Type</TableHead>
                      <TableHead className="text-xs uppercase">Hours</TableHead>
                      <TableHead className="text-xs uppercase">Amount</TableHead>
                      <TableHead className="text-xs uppercase">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs
                      .filter((l) => l.company_id === detailCompany.companyId)
                      .map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${l.type === "purchase" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                              {l.type === "purchase" ? "Purchase" : "Usage"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            <span className={l.type === "purchase" ? "text-emerald-600" : "text-blue-600"}>
                              {l.type === "purchase" ? "+" : "−"}{l.hours}h
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{l.amount_paid ? `$${(l.amount_paid / 100).toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{l.description || "—"}</TableCell>
                        </TableRow>
                      ))}
                    {logs.filter((l) => l.company_id === detailCompany.companyId).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                          No transactions in selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Deduct Dialog */}
      <Dialog open={addHoursOpen} onOpenChange={setAddHoursOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {addHoursType === "add" ? (
                <><Plus className="h-5 w-5 text-emerald-600" /> Add Consulting Hours</>
              ) : (
                <><Minus className="h-5 w-5 text-blue-600" /> Deduct Consulting Hours</>
              )}
            </DialogTitle>
            <DialogDescription>
              {addHoursType === "add"
                ? "Credit consulting hours to a company after purchase."
                : "Deduct hours after consulting sessions are delivered."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {addHoursCompanyId
                      ? eligibleCompanies.find((c) => c.id === addHoursCompanyId)?.name
                      : "Search for a company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No company has purchased consulting hours yet.</CommandEmpty>
                      <CommandGroup className="max-h-[250px] overflow-y-auto">
                        {eligibleCompanies.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setAddHoursCompanyId(c.id);
                              setCompanyPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", addHoursCompanyId === c.id ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Hours */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setAddHoursAmount((h) => Math.max(0, h - 1))}
                      disabled={addHoursAmount <= 0}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={addHoursAmount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setAddHoursAmount(Number.isFinite(v) && v >= 0 ? v : 0);
                        }}
                        className="h-9 pr-8 text-base font-semibold text-center"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        h
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setAddHoursAmount((h) => h + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Hours</p>
                </div>
                {/* Minutes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setAddMinutesAmount((m) => Math.max(0, m - 5))}
                      disabled={addMinutesAmount <= 0}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        step={1}
                        value={addMinutesAmount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isFinite(v) || v < 0) {
                            setAddMinutesAmount(0);
                          } else if (v > 59) {
                            // Roll over into hours
                            setAddHoursAmount((h) => h + Math.floor(v / 60));
                            setAddMinutesAmount(v % 60);
                          } else {
                            setAddMinutesAmount(v);
                          }
                        }}
                        className="h-9 pr-9 text-base font-semibold text-center"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() =>
                        setAddMinutesAmount((m) => {
                          const next = m + 5;
                          if (next >= 60) {
                            setAddHoursAmount((h) => h + 1);
                            return next - 60;
                          }
                          return next;
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Minutes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { h: 0, m: 30, label: "30m" },
                  { h: 1, m: 0, label: "1h" },
                  { h: 1, m: 30, label: "1h 30m" },
                  { h: 2, m: 0, label: "2h" },
                  { h: 4, m: 0, label: "4h" },
                  { h: 8, m: 0, label: "8h" },
                ].map((preset) => {
                  const active = addHoursAmount === preset.h && addMinutesAmount === preset.m;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setAddHoursAmount(preset.h);
                        setAddMinutesAmount(preset.m);
                      }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border transition-colors",
                        active
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {formatHM(addHoursAmount, addMinutesAmount)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({addTotalHours}h)
                  </span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder={addHoursType === "add"
                  ? "e.g. Stripe payment confirmed, invoice #INV-001"
                  : "e.g. 2h regulatory strategy call on May 2"}
                value={addHoursNote}
                onChange={(e) => setAddHoursNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHoursOpen(false)} disabled={addHoursSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddHoursSubmit}
              disabled={addHoursSubmitting || !addHoursCompanyId || addTotalHours <= 0}
              className={addHoursType === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {addHoursSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : addHoursType === "add" ? (
                <><Plus className="h-4 w-4 mr-2" /> Add {formatHM(addHoursAmount, addMinutesAmount)}</>
              ) : (
                <><Minus className="h-4 w-4 mr-2" /> Deduct {formatHM(addHoursAmount, addMinutesAmount)}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit consulting package dialog */}
      <Dialog open={pkgEditOpen} onOpenChange={setPkgEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Consulting Package</DialogTitle>
            <DialogDescription>
              Name, description, and price write to Stripe. Price changes create a new
              Stripe Price and set it as the Product default; the previous Price is archived.
              Hours per pack is stored locally.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="pkg-name">Name</Label>
              <Input
                id="pkg-name"
                value={pkgEditName}
                onChange={(e) => setPkgEditName(e.target.value)}
                disabled={pkgEditSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="pkg-desc">Description</Label>
              <Textarea
                id="pkg-desc"
                value={pkgEditDescription}
                onChange={(e) => setPkgEditDescription(e.target.value)}
                disabled={pkgEditSubmitting}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pkg-price">
                  Price ({pkg?.currency.toUpperCase() ?? "EUR"})
                </Label>
                <Input
                  id="pkg-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pkgEditPrice}
                  onChange={(e) => setPkgEditPrice(e.target.value)}
                  disabled={pkgEditSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="pkg-hours">Hours per pack</Label>
                <Input
                  id="pkg-hours"
                  type="number"
                  step="1"
                  min="1"
                  value={pkgEditHours}
                  onChange={(e) => setPkgEditHours(e.target.value)}
                  disabled={pkgEditSubmitting}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPkgEditOpen(false)}
              disabled={pkgEditSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitPackageEdit} disabled={pkgEditSubmitting}>
              {pkgEditSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <>Save changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Summary Card (matches AI Token Usage style) ---

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
