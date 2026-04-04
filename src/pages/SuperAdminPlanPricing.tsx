import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Save, DollarSign, Cpu, Package, Sparkles, Check, RefreshCw,
  Building2, Calendar, Edit2, Users, Search, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

// ── Pricing Plan types ──

interface PricingPlan {
  id: string;
  name: string;
  display_name: string;
  subtitle: string | null;
  description: string | null;
  monthly_price: number | null;
  yearly_price: number | null;
  is_free: boolean | null;
  is_active: boolean | null;
  included_devices: number | null;
  included_module_slots: number | null;
  included_ai_credits: number | null;
  extra_device_cost: number | null;
  extra_module_slot_cost: number | null;
  ai_booster_cost: number | null;
  ai_booster_credits: number | null;
  sort_order: number | null;
}

interface PricingField {
  key: keyof PricingPlan;
  label: string;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  type: "currency" | "number";
}

const pricingFields: PricingField[] = [
  { key: "monthly_price", label: "Monthly Price", icon: <DollarSign className="h-4 w-4" />, prefix: "$", suffix: "/mo", type: "currency" },
  { key: "yearly_price", label: "Yearly Price", icon: <DollarSign className="h-4 w-4" />, prefix: "$", suffix: "/yr", type: "currency" },
  { key: "included_devices", label: "Included Devices", icon: <Cpu className="h-4 w-4" />, type: "number" },
  { key: "extra_device_cost", label: "Extra Device Cost", icon: <DollarSign className="h-4 w-4" />, prefix: "$", type: "currency" },
  { key: "included_module_slots", label: "Included Module Slots", icon: <Package className="h-4 w-4" />, type: "number" },
  { key: "extra_module_slot_cost", label: "Extra Module Slot Cost", icon: <DollarSign className="h-4 w-4" />, prefix: "$", type: "currency" },
  { key: "included_ai_credits", label: "Included AI Credits", icon: <Sparkles className="h-4 w-4" />, suffix: "/mo", type: "number" },
  { key: "ai_booster_credits", label: "AI Booster Credits", icon: <Sparkles className="h-4 w-4" />, type: "number" },
  { key: "ai_booster_cost", label: "AI Booster Cost", icon: <DollarSign className="h-4 w-4" />, prefix: "$", type: "currency" },
];

// ── Company Subscription types ──

interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  extra_devices: number | null;
  extra_module_slots: number | null;
  ai_booster_packs: number | null;
  monthly_total: number | null;
  created_at: string | null;
  updated_at: string | null;
  company?: {
    id: string;
    name: string;
    email: string | null;
    contact_person: string | null;
  };
  plan?: {
    id: string;
    name: string;
    display_name: string;
    monthly_price: number | null;
    is_free: boolean | null;
  };
}

// ── Main Component ──

export default function SuperAdminPlanPricing() {
  const [activeTab, setActiveTab] = useState("subscriptions");

  // Pricing plans state
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedPlans, setEditedPlans] = useState<Record<string, Partial<PricingPlan>>>({});
  const [savingPlanIds, setSavingPlanIds] = useState<Set<string>>(new Set());

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<CompanySubscription[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<CompanySubscription | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    started_at: "",
    expires_at: "",
    trial_ends_at: "",
    plan_id: "",
    extra_devices: "",
    extra_module_slots: "",
    ai_booster_packs: "",
  });
  const [isSavingSub, setIsSavingSub] = useState(false);

  // Add company dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [addForm, setAddForm] = useState({ company_id: "", plan_id: "", status: "active" });
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [addCompanySearch, setAddCompanySearch] = useState("");

  // ── Fetch pricing plans ──

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("new_pricing_plans")
        .select("id, name, display_name, subtitle, description, monthly_price, yearly_price, is_free, is_active, included_devices, included_module_slots, included_ai_credits, extra_device_cost, extra_module_slot_cost, ai_booster_cost, ai_booster_credits, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans((data as PricingPlan[]) || []);
      setEditedPlans({});
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load pricing plans");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch company subscriptions ──

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsSubsLoading(true);
      const { data, error } = await supabase
        .from("new_pricing_company_plans")
        .select(`
          *,
          company:companies!inner(id, name, email, contact_person, is_archived),
          plan:new_pricing_plans(id, name, display_name, monthly_price, is_free)
        `)
        .eq("company.is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions((data as CompanySubscription[]) || []);
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load company subscriptions");
    } finally {
      setIsSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [fetchPlans, fetchSubscriptions]);

  // ── Pricing plan handlers ──

  const handleFieldChange = (planId: string, field: keyof PricingPlan, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setEditedPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: numValue,
      },
    }));
  };

  const getFieldValue = (plan: PricingPlan, field: keyof PricingPlan): string => {
    const edited = editedPlans[plan.id];
    if (edited && field in edited) {
      const val = edited[field];
      return val === null || val === undefined ? "" : String(val);
    }
    const val = plan[field];
    return val === null || val === undefined ? "" : String(val);
  };

  const hasChanges = (planId: string): boolean => {
    return !!editedPlans[planId] && Object.keys(editedPlans[planId]).length > 0;
  };

  const handleSave = async (planId: string) => {
    const changes = editedPlans[planId];
    if (!changes || Object.keys(changes).length === 0) return;

    try {
      setSavingPlanIds((prev) => new Set(prev).add(planId));
      const updateData: Record<string, unknown> = { ...changes, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from("new_pricing_plans")
        .update(updateData)
        .eq("id", planId);

      if (error) throw error;

      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, ...changes } : p))
      );
      setEditedPlans((prev) => {
        const updated = { ...prev };
        delete updated[planId];
        return updated;
      });

      toast.success("Pricing updated successfully");
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save pricing changes");
    } finally {
      setSavingPlanIds((prev) => {
        const updated = new Set(prev);
        updated.delete(planId);
        return updated;
      });
    }
  };

  const handleSaveAll = async () => {
    const planIds = Object.keys(editedPlans).filter((id) => hasChanges(id));
    for (const planId of planIds) {
      await handleSave(planId);
    }
  };

  const totalChanges = Object.keys(editedPlans).filter((id) => hasChanges(id)).length;

  // ── Subscription handlers ──

  const openEditDialog = (sub: CompanySubscription) => {
    setEditingSub(sub);
    setEditForm({
      status: sub.status || "active",
      started_at: sub.started_at ? sub.started_at.slice(0, 16) : "",
      expires_at: sub.expires_at ? sub.expires_at.slice(0, 16) : "",
      trial_ends_at: sub.trial_ends_at ? sub.trial_ends_at.slice(0, 16) : "",
      plan_id: sub.plan_id || "",
      extra_devices: sub.extra_devices !== null ? String(sub.extra_devices) : "",
      extra_module_slots: sub.extra_module_slots !== null ? String(sub.extra_module_slots) : "",
      ai_booster_packs: sub.ai_booster_packs !== null ? String(sub.ai_booster_packs) : "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!editingSub) return;

    try {
      setIsSavingSub(true);

      const updateData: Record<string, unknown> = {
        status: editForm.status,
        started_at: editForm.started_at ? new Date(editForm.started_at).toISOString() : null,
        expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
        trial_ends_at: editForm.trial_ends_at ? new Date(editForm.trial_ends_at).toISOString() : null,
        plan_id: editForm.plan_id,
        extra_devices: editForm.extra_devices ? parseInt(editForm.extra_devices) : null,
        extra_module_slots: editForm.extra_module_slots ? parseInt(editForm.extra_module_slots) : null,
        ai_booster_packs: editForm.ai_booster_packs ? parseInt(editForm.ai_booster_packs) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("new_pricing_company_plans")
        .update(updateData)
        .eq("id", editingSub.id);

      if (error) throw error;

      toast.success("Subscription updated successfully");
      setEditDialogOpen(false);
      setEditingSub(null);
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    } finally {
      setIsSavingSub(false);
    }
  };

  // ── Add company handlers ──

  const fetchAllCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_archived", false)
        .order("name", { ascending: true });

      if (error) throw error;
      setAllCompanies(data || []);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const openAddDialog = () => {
    setAddForm({ company_id: "", plan_id: "", status: "active" });
    setAddCompanySearch("");
    fetchAllCompanies();
    setAddDialogOpen(true);
  };

  const handleAddCompanySubscription = async () => {
    if (!addForm.company_id || !addForm.plan_id) {
      toast.error("Please select a company and a plan");
      return;
    }

    try {
      setIsSavingAdd(true);

      const { error } = await supabase
        .from("new_pricing_company_plans")
        .insert({
          company_id: addForm.company_id,
          plan_id: addForm.plan_id,
          status: addForm.status,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Company subscription added successfully");
      setAddDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Error adding subscription:", error);
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.error("This company already has a subscription entry");
      } else {
        toast.error("Failed to add subscription: " + error.message);
      }
    } finally {
      setIsSavingAdd(false);
    }
  };

  // Companies not already in subscriptions
  const availableCompanies = allCompanies.filter(
    (c) => !subscriptions.some((s) => s.company_id === c.id)
  );

  const filteredAddCompanies = availableCompanies.filter(
    (c) => !addCompanySearch || c.name.toLowerCase().includes(addCompanySearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      trial: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      expired: "bg-gray-100 text-gray-800 border-gray-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.company?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading && isSubsLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Loading pricing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Pricing Management
              </h1>
              <p className="text-slate-600">
                Manage pricing, resource limits, and company subscriptions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { fetchPlans(); fetchSubscriptions(); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {totalChanges > 0 && (
              <Button
                onClick={handleSaveAll}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg gap-2"
              >
                <Save className="h-4 w-4" />
                Save All Changes ({totalChanges})
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-[500px] grid-cols-2">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Subscriptions
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Plan Pricing
            </TabsTrigger>
          </TabsList>

          {/* ── Company Subscriptions Tab ── */}
          <TabsContent value="subscriptions" className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-2xl font-bold text-slate-800">{subscriptions.length}</p>
                    </div>
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {subscriptions.filter((s) => s.status === "active").length}
                      </p>
                    </div>
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Trial</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {subscriptions.filter((s) => s.status === "trial").length}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Cancelled</p>
                      <p className="text-2xl font-bold text-red-600">
                        {subscriptions.filter((s) => s.status === "cancelled").length}
                      </p>
                    </div>
                    <Building2 className="h-5 w-5 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search company, email, or plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openAddDialog} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </div>

            {/* Table */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {isSubsLoading ? (
                  <div className="text-center py-12 text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading subscriptions...
                  </div>
                ) : filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No subscriptions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Company ID</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Trial Ends</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {sub.company?.name || "Unknown Company"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {sub.company?.email || sub.company?.contact_person || "—"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded select-all">
                                {sub.company_id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sub.plan?.display_name || "—"}</span>
                                {sub.plan?.is_free && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Free</Badge>
                                )}
                              </div>
                              {sub.plan?.monthly_price !== null && sub.plan?.monthly_price !== undefined && (
                                <p className="text-xs text-slate-500">${sub.plan.monthly_price}/mo</p>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell className="text-sm text-slate-600">{formatDate(sub.started_at)}</TableCell>
                            <TableCell className="text-sm text-slate-600">{formatDate(sub.expires_at)}</TableCell>
                            <TableCell className="text-sm text-slate-600">{formatDate(sub.trial_ends_at)}</TableCell>
                            <TableCell className="text-sm text-slate-500">{formatDate(sub.updated_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(sub)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Plan Pricing Tab ── */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const isSaving = savingPlanIds.has(plan.id);
                const planHasChanges = hasChanges(plan.id);

                return (
                  <Card
                    key={plan.id}
                    className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                      planHasChanges ? "ring-2 ring-emerald-300" : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {plan.name}
                          </Badge>
                          {plan.is_free && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Free
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {planHasChanges && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              Unsaved
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            disabled={!planHasChanges || isSaving}
                            onClick={() => handleSave(plan.id)}
                            className={`gap-1.5 ${
                              planHasChanges
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : ""
                            }`}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : planHasChanges ? (
                              <Save className="h-3.5 w-3.5" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {isSaving ? "Saving..." : planHasChanges ? "Save" : "Saved"}
                          </Button>
                        </div>
                      </div>
                      {plan.subtitle && (
                        <p className="text-sm text-slate-500">{plan.subtitle}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {pricingFields.map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                              {field.icon}
                              {field.label}
                            </Label>
                            <div className="relative">
                              {field.prefix && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                  {field.prefix}
                                </span>
                              )}
                              <Input
                                type="number"
                                step={field.type === "currency" ? "0.01" : "1"}
                                min="0"
                                value={getFieldValue(plan, field.key)}
                                onChange={(e) =>
                                  handleFieldChange(plan.id, field.key, e.target.value)
                                }
                                className={`h-9 text-sm ${field.prefix ? "pl-7" : ""} ${
                                  field.suffix ? "pr-10" : ""
                                }`}
                              />
                              {field.suffix && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                  {field.suffix}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {plans.length === 0 && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No pricing plans found</h3>
                  <p className="text-slate-600">No active plans in the new_pricing_plans table.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Subscription Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Edit Subscription
            </DialogTitle>
            <DialogDescription>
              {editingSub?.company?.name || "Unknown Company"} — Update subscription dates, status, and plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Plan</Label>
              <Select value={editForm.plan_id} onValueChange={(v) => setEditForm((p) => ({ ...p, plan_id: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.display_name} ({plan.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Started At</Label>
                <Input
                  type="datetime-local"
                  value={editForm.started_at}
                  onChange={(e) => setEditForm((p) => ({ ...p, started_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Expires At</Label>
                <Input
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm((p) => ({ ...p, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Trial Ends At</Label>
              <Input
                type="datetime-local"
                value={editForm.trial_ends_at}
                onChange={(e) => setEditForm((p) => ({ ...p, trial_ends_at: e.target.value }))}
              />
            </div>

            {/* Add-ons */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Extra Devices</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.extra_devices}
                  onChange={(e) => setEditForm((p) => ({ ...p, extra_devices: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Extra Module Slots</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.extra_module_slots}
                  onChange={(e) => setEditForm((p) => ({ ...p, extra_module_slots: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">AI Booster Packs</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.ai_booster_packs}
                  onChange={(e) => setEditForm((p) => ({ ...p, ai_booster_packs: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubscription}
              disabled={isSavingSub}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isSavingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSavingSub ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Company Subscription Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Add Company Subscription
            </DialogTitle>
            <DialogDescription>
              Select an existing company and assign a pricing plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Company Search & Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Company</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search companies..."
                  value={addCompanySearch}
                  onChange={(e) => setAddCompanySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isLoadingCompanies ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading companies...
                </div>
              ) : (
                <Select value={addForm.company_id} onValueChange={(v) => setAddForm((p) => ({ ...p, company_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAddCompanies.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">No companies available</div>
                    ) : (
                      filteredAddCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Plan</Label>
              <Select value={addForm.plan_id} onValueChange={(v) => setAddForm((p) => ({ ...p, plan_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.display_name} ({plan.name})
                      {plan.monthly_price !== null ? ` — $${plan.monthly_price}/mo` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={addForm.status} onValueChange={(v) => setAddForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCompanySubscription}
              disabled={isSavingAdd || !addForm.company_id || !addForm.plan_id}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSavingAdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSavingAdd ? "Adding..." : "Add Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
