import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type TenantConfigRow = {
  id: string;
  key: string;
  name: string;
  branch_name: string | null;
  url: string | null;
  company_id: string | null;
  stripe_id: string | null;
  allow_company_ids: string[];
  github_base_branch: string | null;
  last_pr_number: number | null;
  last_pr_url: string | null;
  last_pr_created_at: string | null;
  pr_automation_enabled: boolean;
  inserted_at: string;
  updated_at: string;
};

type CompanyRow = { id: string; name: string };

type EditableTenant = {
  id?: string;
  key: string;
  name: string;
  branch_name: string;
  url: string;
  company_id: string | null;
  stripe_id: string;
  allow_company_ids: string[];
  github_base_branch: string;
  pr_automation_enabled: boolean;
};

const emptyTenant = (): EditableTenant => ({
  key: "",
  name: "",
  branch_name: "",
  url: "",
  company_id: null,
  stripe_id: "",
  allow_company_ids: [],
  github_base_branch: "main",
  pr_automation_enabled: false,
});

const tenantTable = () => (supabase as any).from("tenant_configs");

export default function SuperAdminTenantConfigs() {
  const [searchParams] = useSearchParams();
  const isDevMode = searchParams.get("mode") === "dev";

  const [rows, setRows] = useState<TenantConfigRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableTenant | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantConfigRow | null>(null);

  const companyById = useMemo(() => {
    const map = new Map<string, CompanyRow>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  const load = async () => {
    setLoading(true);
    const [tenantsRes, companiesRes] = await Promise.all([
      tenantTable().select("*").order("key", { ascending: true }),
      supabase.from("companies").select("id,name").order("name", { ascending: true }),
    ]);

    if (tenantsRes.error) {
      toast.error("Failed to load tenants: " + tenantsRes.error.message);
    } else {
      setRows(tenantsRes.data ?? []);
    }
    if (companiesRes.error) {
      toast.error("Failed to load companies: " + companiesRes.error.message);
    } else {
      setCompanies((companiesRes.data ?? []) as CompanyRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (row: TenantConfigRow) => {
    setIsNew(false);
    setEditing({
      id: row.id,
      key: row.key,
      name: row.name,
      branch_name: row.branch_name ?? "",
      url: row.url ?? "",
      company_id: row.company_id,
      stripe_id: row.stripe_id ?? "",
      allow_company_ids: row.allow_company_ids ?? [],
      github_base_branch: row.github_base_branch ?? "main",
      pr_automation_enabled: row.pr_automation_enabled,
    });
  };

  const openCreate = () => {
    setIsNew(true);
    setEditing(emptyTenant());
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.key.trim() || !editing.name.trim()) {
      toast.error("Key and name are required");
      return;
    }

    setSaving(true);

    const payload = {
      key: editing.key.trim(),
      name: editing.name.trim(),
      branch_name: editing.branch_name.trim() || null,
      url: editing.url.trim() || null,
      company_id: editing.company_id || null,
      stripe_id: editing.stripe_id.trim() || null,
      allow_company_ids: editing.allow_company_ids,
      github_base_branch: editing.github_base_branch.trim() || "main",
      pr_automation_enabled: editing.pr_automation_enabled,
    };

    const result = isNew
      ? await tenantTable().insert(payload).select().single()
      : await tenantTable().update(payload).eq("id", editing.id).select().single();

    setSaving(false);

    if (result.error) {
      toast.error((isNew ? "Create" : "Update") + " failed: " + result.error.message);
      return;
    }

    toast.success(isNew ? "Tenant created" : "Tenant updated");
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await tenantTable().delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success(`Deleted "${deleteTarget.key}"`);
      setDeleteTarget(null);
      await load();
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* Page Header — compact, matches Users page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenant Configurations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} tenants — one row per deployment.{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_TENANT_KEY</code> selects which row this build uses.
          </p>
        </div>
        <Button variant="outline" className="bg-background" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add tenant
        </Button>
      </div>

      {/* Tenants Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <TooltipProvider delayDuration={150}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead><span className="font-medium">Key</span></TableHead>
              <TableHead><span className="font-medium">Name</span></TableHead>
              <TableHead><span className="font-medium">Branch</span></TableHead>
              <TableHead><span className="font-medium">URL</span></TableHead>
              <TableHead><span className="font-medium">Last Updated</span></TableHead>
              <TableHead><span className="font-medium">Allowed Companies</span></TableHead>
              {isDevMode && (
                <TableHead><span className="font-medium">PR Auto</span></TableHead>
              )}
              <TableHead className="text-center"><span className="font-medium">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={isDevMode ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  No tenants yet{isDevMode ? <>. Click <strong>Add tenant</strong> to create one.</> : "."}
                </TableCell>
              </TableRow>
            )}
            {rows.map(row => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs font-bold">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(row.key);
                      toast.success(`Copied "${row.key}"`);
                    }}
                    className="hover:text-primary transition-colors cursor-pointer"
                    title="Click to copy"
                  >
                    {row.key}
                  </button>
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  {row.branch_name
                    ? <Badge variant="outline" className="font-mono text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors">{row.branch_name}</Badge>
                    : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer"
                      className="text-primary hover:underline text-sm">
                      {row.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {row.last_pr_created_at ? formatDate(row.last_pr_created_at) : "—"}
                </TableCell>
                <TableCell>
                  {row.allow_company_ids?.length > 0 ? (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-default">
                          {row.allow_company_ids.length} allowed
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        <ol className="text-xs leading-5 list-decimal pl-4">
                          {row.allow_company_ids.map(id => (
                            <li key={id}>
                              {companyById.get(id)?.name ?? <span className="opacity-60">Unknown ({id.slice(0, 8)}…)</span>}
                            </li>
                          ))}
                        </ol>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-default">Allow all</Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start">
                        <span className="text-xs">No restriction</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                {isDevMode && (
                  <TableCell>
                    {row.pr_automation_enabled
                      ? <Badge>On</Badge>
                      : <Badge variant="outline">Off</Badge>}
                  </TableCell>
                )}
                <TableCell className="text-center">
                  <div className="inline-flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {isDevMode && (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(row)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>

      <Sheet open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>{isNew ? "Add tenant" : `Edit tenant: ${editing?.key}`}</SheetTitle>
            <SheetDescription>
              {isNew
                ? "Create a new tenant deployment. The key must match the VITE_TENANT_KEY env var on that deployment."
                : "Changes apply on the tenant's next sign-in."}
            </SheetDescription>
          </SheetHeader>

          {editing && (
            <div className="space-y-4 px-6 py-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="key">Key *</Label>
                  <Input
                    id="key"
                    value={editing.key}
                    onChange={e => setEditing({ ...editing, key: e.target.value })}
                    placeholder="davidhealth"
                    disabled={!isNew}
                    className="font-mono"
                  />
                  {!isNew && (
                    <p className="text-xs text-muted-foreground">
                      Key cannot be changed — it is referenced by the deployment.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    placeholder="David Health Solutions"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch_name">Branch</Label>
                <Input
                  id="branch_name"
                  value={editing.branch_name}
                  onChange={e => setEditing({ ...editing, branch_name: e.target.value })}
                  placeholder="client/davidhealth"
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={editing.url}
                  onChange={e => setEditing({ ...editing, url: e.target.value })}
                  placeholder="https://app.example.com/"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary company</Label>
                  <CompanySingleSelect
                    companies={companies}
                    value={editing.company_id}
                    onChange={id => setEditing({ ...editing, company_id: id })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stripe_id">Stripe ID</Label>
                  <Input
                    id="stripe_id"
                    value={editing.stripe_id}
                    placeholder="cus_..."
                    className="font-mono bg-muted/50 cursor-default"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">Read-only — set via Stripe integration.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Allowed companies (login gate)</Label>
                <CompanyMultiSelect
                  companies={companies}
                  value={editing.allow_company_ids}
                  onChange={ids => setEditing({ ...editing, allow_company_ids: ids })}
                />
                <p className="text-xs text-muted-foreground">
                  {editing.allow_company_ids.length === 0
                    ? "Empty = allow any user who has at least one company access row."
                    : `${editing.allow_company_ids.length} compan${editing.allow_company_ids.length === 1 ? "y" : "ies"} selected.`}
                </p>
              </div>

            </div>
          )}

          <SheetFooter className="px-6 py-4 border-t bg-background sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isNew ? "Create" : "Save changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the <strong>{deleteTarget?.key}</strong> tenant config. Any deployment with{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_TENANT_KEY={deleteTarget?.key}</code>{" "}
              will fail closed at sign-in until a new row is created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CompanySingleSelect({
  companies,
  value,
  onChange,
}: {
  companies: CompanyRow[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = companies.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : "— none —"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search companies…" />
          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => { onChange(null); setOpen(false); }}
              >
                <Check className={cn("h-4 w-4 mr-2", value === null ? "opacity-100" : "opacity-0")} />
                <span className="text-muted-foreground italic">— none —</span>
              </CommandItem>
              {companies.map(c => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => { onChange(c.id); setOpen(false); }}
                >
                  <Check className={cn("h-4 w-4 mr-2", value === c.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">{c.id.slice(0, 8)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CompanyMultiSelect({
  companies,
  value,
  onChange,
}: {
  companies: CompanyRow[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Set(value);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">
            {value.length === 0 ? "Allow all (no restriction)" : `${value.length} selected`}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search companies…" />
          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>
            <CommandGroup>
              {companies.map(c => {
                const isSelected = selected.has(c.id);
                return (
                  <CommandItem key={c.id} value={c.name} onSelect={() => toggle(c.id)}>
                    <Check className={cn("h-4 w-4 mr-2", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">{c.id.slice(0, 8)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
