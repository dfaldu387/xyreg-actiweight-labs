import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2, X, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useNavigate, useParams } from "react-router-dom";
import type { Supplier } from "@/types/supplier";
import { useTranslation } from "@/hooks/useTranslation";

interface CMOPartner {
  supplier_id: string;
  name: string;
  status: string;
  notes?: string;
}

interface CMOPartnerSelectorProps {
  companyId: string;
  selectedPartners: CMOPartner[];
  onPartnersChange: (partners: CMOPartner[]) => void;
  disabled?: boolean;
}

export function CMOPartnerSelector({
  companyId,
  selectedPartners,
  onPartnersChange,
  disabled = false,
}: CMOPartnerSelectorProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { companyName } = useParams();
  const { data: allSuppliers = [], isLoading } = useSuppliers(companyId);
  const { lang } = useTranslation();

  // Filter to CMO/CDMO suppliers only and exclude already selected
  const cmoSuppliers = allSuppliers.filter(
    (s) => s.supplier_type === "CMO / CDMO"
  );
  
  const availableSuppliers = cmoSuppliers.filter(
    (s) => !selectedPartners.some((p) => p.supplier_id === s.id)
  );

  const handleNavigateToSuppliers = () => {
    navigate(`/app/company/${companyName}/suppliers`);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    const newPartner: CMOPartner = {
      supplier_id: supplier.id,
      name: supplier.name,
      status: supplier.status === "Approved" ? "contracted" : "in_discussion",
      notes: "",
    };
    onPartnersChange([...selectedPartners, newPartner]);
    setOpen(false);
  };

  const handleRemovePartner = (supplierId: string) => {
    onPartnersChange(selectedPartners.filter((p) => p.supplier_id !== supplierId));
  };

  const handleStatusChange = (supplierId: string, newStatus: string) => {
    onPartnersChange(
      selectedPartners.map((p) =>
        p.supplier_id === supplierId ? { ...p, status: newStatus } : p
      )
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "contracted":
        return "default";
      case "in_discussion":
        return "secondary";
      case "identified":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSupplierStatusBadge = (supplier: Supplier) => {
    switch (supplier.status) {
      case "Approved":
        return <Badge variant="default" className="text-xs bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30">{lang('manufacturing.cmoPartners.supplierStatus.approved')}</Badge>;
      case "Probationary":
        return <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 hover:bg-amber-500/30">{lang('manufacturing.cmoPartners.supplierStatus.probationary')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Partners List */}
      {selectedPartners.length > 0 && (
        <div className="space-y-2">
          {selectedPartners.map((partner) => (
            <div
              key={partner.supplier_id}
              className="flex items-center gap-2 p-2 bg-background rounded-md border"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium flex-1">{partner.name}</span>
              <select
                value={partner.status}
                onChange={(e) => handleStatusChange(partner.supplier_id, e.target.value)}
                className="text-xs px-2 py-1 rounded bg-secondary border-none"
                disabled={disabled}
              >
                <option value="identified">{lang('manufacturing.cmoPartners.status.identified')}</option>
                <option value="in_discussion">{lang('manufacturing.cmoPartners.status.inDiscussion')}</option>
                <option value="contracted">{lang('manufacturing.cmoPartners.status.contracted')}</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePartner(partner.supplier_id)}
                disabled={disabled}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Partner Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {lang('manufacturing.cmoPartners.addButton')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder={lang('manufacturing.cmoPartners.searchPlaceholder')} />
            <CommandList>
              <CommandEmpty>
                {cmoSuppliers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>{lang('manufacturing.cmoPartners.noCmoFound')}</p>
                    <p className="mt-1">{lang('manufacturing.cmoPartners.addCmoHint')}</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {lang('manufacturing.cmoPartners.allAdded')}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {availableSuppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.name}
                    onSelect={() => handleSelectSupplier(supplier)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSupplierStatusBadge(supplier)}
                      {supplier.contact_info?.address && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.contact_info.address.split(',').pop()?.trim()}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {cmoSuppliers.length === 0 && !isLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-400">{lang('manufacturing.cmoPartners.noPartnersTitle')}</p>
              <p className="text-sm text-amber-700 dark:text-amber-500">{lang('manufacturing.cmoPartners.noPartnersDescription')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigateToSuppliers}
            className="w-full border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {lang('manufacturing.cmoPartners.goToSuppliers')}
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
