import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, MoreHorizontal, Pencil, Trash2, Handshake, Stethoscope, FileCheck, Building2 } from 'lucide-react';
import { MarketPartnerEntry, PartnerCategory } from "@/utils/enhancedMarketRiskClassMapping";
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { nanoid } from 'nanoid';

const PARTNER_STATUS_OPTIONS = [
  { value: 'Identified', label: 'Identified' },
  { value: 'In Discussion', label: 'In Discussion' },
  { value: 'Contracted', label: 'Contracted' },
] as const;

// Export so UnifiedMarketCard can use it directly
export const PARTNER_CATEGORIES: {
  key: PartnerCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  placeholder: string;
}[] = [
  {
    key: 'distribution',
    label: 'Distribution Partners',
    icon: Handshake,
    description: 'Regional distributors, sales agents, authorized dealers',
    placeholder: 'e.g., Medline GmbH'
  },
  {
    key: 'clinical',
    label: 'Clinical Partners',
    icon: Stethoscope,
    description: 'CROs, KOLs, clinical trial sites, testing labs',
    placeholder: 'e.g., NAMSA'
  },
  {
    key: 'regulatory',
    label: 'Regulatory Partners',
    icon: FileCheck,
    description: 'RA consultants, submission support, compliance advisors',
    placeholder: 'e.g., Emergo by UL'
  }
];

const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'Contracted':
      return 'default';
    case 'In Discussion':
      return 'secondary';
    default:
      return 'outline';
  }
};

interface PartnerEditDialogProps {
  partner: MarketPartnerEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (partner: MarketPartnerEntry) => void;
  placeholder?: string;
  categoryLabel?: string;
}

function PartnerEditDialog({ partner, open, onOpenChange, onSave, placeholder, categoryLabel }: PartnerEditDialogProps) {
  const [localPartner, setLocalPartner] = useState<MarketPartnerEntry>(partner);
  
  useEffect(() => {
    setLocalPartner(partner);
  }, [partner, open]);
  
  const handleSave = () => {
    onSave(localPartner);
    onOpenChange(false);
  };
  
  // Convert "Distribution Partners" -> "Distribution Partner"
  const singularLabel = categoryLabel?.replace(/s$/, '') || 'Partner';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{singularLabel}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Partner Name *</Label>
              <Input
                value={localPartner.name}
                onChange={(e) => setLocalPartner({ ...localPartner, name: e.target.value })}
                placeholder={placeholder}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={localPartner.status}
                onValueChange={(value) => setLocalPartner({ ...localPartner, status: value as MarketPartnerEntry['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                value={localPartner.contactPerson || ''}
                onChange={(e) => setLocalPartner({ ...localPartner, contactPerson: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={localPartner.email || ''}
                onChange={(e) => setLocalPartner({ ...localPartner, email: e.target.value })}
                placeholder="e.g., john@partner.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={localPartner.phone || ''}
                onChange={(e) => setLocalPartner({ ...localPartner, phone: e.target.value })}
                placeholder="e.g., +1 555-0123"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={localPartner.notes || ''}
              onChange={(e) => setLocalPartner({ ...localPartner, notes: e.target.value })}
              placeholder="Additional details about this partnership..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!localPartner.name.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PartnerEntryFormProps {
  partner: MarketPartnerEntry;
  onChange: (partner: MarketPartnerEntry) => void;
  onRemove: () => void;
  isLoading?: boolean;
  placeholder?: string;
  categoryLabel?: string;
}

function PartnerEntryForm({ partner, onChange, onRemove, isLoading, placeholder, categoryLabel }: PartnerEntryFormProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleEdit = () => {
    // Close dropdown first, then open dialog
    setDropdownOpen(false);
    // Small delay to ensure dropdown closes before dialog opens
    setTimeout(() => {
      setEditDialogOpen(true);
    }, 0);
  };

  const handleDelete = () => {
    // Close dropdown first
    setDropdownOpen(false);
    // Small delay to ensure dropdown closes before confirm dialog
    setTimeout(() => {
      if (window.confirm('Are you sure you want to remove this partner?')) {
        onRemove();
      }
    }, 0);
  };

  // Single-line display with three-dot menu
  return (
    <>
      <div className="flex items-center justify-between py-2 px-3 border rounded-md bg-background hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-medium text-sm truncate">
            {partner.name || <span className="italic text-muted-foreground">New Partner</span>}
          </span>
          {partner.status && (
            <Badge variant={getStatusVariant(partner.status)} className="text-xs shrink-0">
              {partner.status}
            </Badge>
          )}
          {partner.contactPerson && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {partner.contactPerson}
            </span>
          )}
        </div>

        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleDelete}
              className="text-destructive"
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PartnerEditDialog
        partner={partner}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={onChange}
        placeholder={placeholder}
        categoryLabel={categoryLabel}
      />
    </>
  );
}

interface PartnerCategoryFormProps {
  category: typeof PARTNER_CATEGORIES[number];
  partners: MarketPartnerEntry[];
  onChange: (partners: MarketPartnerEntry[]) => void;
  isLoading?: boolean;
}

// Export so UnifiedMarketCard can use it directly
export function PartnerCategoryForm({ category, partners, onChange, isLoading }: PartnerCategoryFormProps) {
  const Icon = category.icon;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPartner, setNewPartner] = useState<MarketPartnerEntry>({
    id: '',
    name: '',
    status: 'Identified'
  });

  const handleOpenAddDialog = () => {
    // Reset new partner form with fresh ID
    setNewPartner({
      id: nanoid(),
      name: '',
      status: 'Identified'
    });
    setAddDialogOpen(true);
  };

  const handleSaveNewPartner = (partner: MarketPartnerEntry) => {
    // Only add if name is provided
    if (partner.name.trim()) {
      onChange([...partners, partner]);
    }
    setAddDialogOpen(false);
  };

  const handleUpdate = (index: number, updatedPartner: MarketPartnerEntry) => {
    const updated = [...partners];
    updated[index] = updatedPartner;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(partners.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{category.label}</span>
          {partners.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {partners.length}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenAddDialog}
          disabled={isLoading}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {category.description}
        </p>
      ) : (
        <div className="space-y-3">
          {partners.map((partner, index) => (
            <PartnerEntryForm
              key={partner.id}
              partner={partner}
              onChange={(updated) => handleUpdate(index, updated)}
              onRemove={() => handleRemove(index)}
              isLoading={isLoading}
              placeholder={category.placeholder}
              categoryLabel={category.label}
            />
          ))}
        </div>
      )}

      {/* Add New Partner Dialog */}
      <PartnerEditDialog
        partner={newPartner}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveNewPartner}
        placeholder={category.placeholder}
        categoryLabel={category.label}
      />
    </div>
  );
}

interface MarketPartnerFormProps {
  distributionPartners?: MarketPartnerEntry[];
  clinicalPartners?: MarketPartnerEntry[];
  regulatoryPartners?: MarketPartnerEntry[];
  onDistributionChange: (partners: MarketPartnerEntry[]) => void;
  onClinicalChange: (partners: MarketPartnerEntry[]) => void;
  onRegulatoryChange: (partners: MarketPartnerEntry[]) => void;
  isLoading?: boolean;
  marketName: string;
}

export function MarketPartnerForm({
  distributionPartners = [],
  clinicalPartners = [],
  regulatoryPartners = [],
  onDistributionChange,
  onClinicalChange,
  onRegulatoryChange,
  isLoading,
  marketName
}: MarketPartnerFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalPartners = distributionPartners.length + clinicalPartners.length + regulatoryPartners.length;
  
  const partnerData: Record<PartnerCategory, { 
    partners: MarketPartnerEntry[]; 
    onChange: (partners: MarketPartnerEntry[]) => void 
  }> = {
    distribution: { partners: distributionPartners, onChange: onDistributionChange },
    clinical: { partners: clinicalPartners, onChange: onClinicalChange },
    regulatory: { partners: regulatoryPartners, onChange: onRegulatoryChange }
  };
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Strategic Partners</CardTitle>
                <InvestorVisibleBadge />
                {totalPartners > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {totalPartners} partner{totalPartners !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Market-specific partners for {marketName}. Feeds into Value Map → Key Partners.
            </p>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {PARTNER_CATEGORIES.map((category) => (
              <PartnerCategoryForm
                key={category.key}
                category={category}
                partners={partnerData[category.key].partners}
                onChange={partnerData[category.key].onChange}
                isLoading={isLoading}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
