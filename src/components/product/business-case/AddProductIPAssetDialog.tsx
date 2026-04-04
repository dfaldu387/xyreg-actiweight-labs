import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIPAssets, IPAsset } from '@/hooks/useIPAssets';
import { useCreateAndLinkIPAsset, useLinkIPAsset, ProductIPAsset } from '@/hooks/useProductIPAssets';
import { Loader2, Plus, Link2 } from 'lucide-react';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

const IP_TYPES = [
  { value: 'patent' as const, label: 'Patent' },
  { value: 'trademark' as const, label: 'Trademark' },
  { value: 'trade_secret' as const, label: 'Trade Secret' },
  { value: 'design_right' as const, label: 'Design Right' },
  { value: 'copyright' as const, label: 'Copyright' },
];

// Status options vary by IP type with descriptions
const STATUS_OPTIONS_BY_TYPE: Record<IPType, { value: IPStatus; label: string; description: string }[]> = {
  patent: [
    { value: 'idea', label: 'Idea / Concept', description: 'Initial innovation concept, not yet documented formally' },
    { value: 'disclosure', label: 'Disclosure', description: 'Invention disclosure filed internally for evaluation' },
    { value: 'filing_prep', label: 'Filing Prep', description: 'Patent application being drafted with attorney' },
    { value: 'pending', label: 'Provisional Filed', description: 'Provisional patent application filed (12-month priority window)' },
    { value: 'granted', label: 'Full Application / Granted', description: 'Full application filed or patent issued' },
    { value: 'expired', label: 'Expired / Abandoned', description: 'Patent term has ended, lapsed, or abandoned' },
  ],
  trademark: [
    { value: 'idea', label: 'Idea / Concept', description: 'Brand name or logo concept identified' },
    { value: 'filing_prep', label: 'Filing Prep', description: 'Clearance search complete, preparing application' },
    { value: 'pending', label: 'Pending', description: 'Application filed, in examination' },
    { value: 'granted', label: 'Registered', description: 'Trademark registered and protected' },
    { value: 'expired', label: 'Expired', description: 'Registration lapsed or not renewed' },
  ],
  trade_secret: [
    { value: 'idea', label: 'Idea / Concept', description: 'Valuable information identified but not yet protected' },
    { value: 'disclosure', label: 'Documented', description: 'Secret formally documented with access controls' },
    { value: 'granted', label: 'Active / Protected', description: 'Confidentiality measures in place, actively maintained' },
    { value: 'abandoned', label: 'Disclosed / Lost', description: 'Secret became public or protection was lost' },
  ],
  design_right: [
    { value: 'idea', label: 'Idea / Concept', description: 'Design concept under consideration' },
    { value: 'filing_prep', label: 'Filing Prep', description: 'Design drawings being prepared for filing' },
    { value: 'pending', label: 'Pending', description: 'Design application under examination' },
    { value: 'granted', label: 'Registered', description: 'Design right granted and enforceable' },
    { value: 'expired', label: 'Expired', description: 'Design protection has lapsed' },
  ],
  copyright: [
    { value: 'idea', label: 'Idea / Concept', description: 'Creative work planned but not yet created' },
    { value: 'disclosure', label: 'Created', description: 'Work created, copyright exists automatically' },
    { value: 'pending', label: 'Registration Pending', description: 'Formal registration application filed' },
    { value: 'granted', label: 'Registered / Active', description: 'Formally registered for enhanced protection' },
  ],
};

type IPType = 'patent' | 'trademark' | 'trade_secret' | 'design_right' | 'copyright';
type IPStatus = 'idea' | 'pending' | 'disclosure' | 'filing_prep' | 'granted' | 'abandoned' | 'expired';

// Get valid statuses for the current IP type
const getStatusOptionsForType = (type: IPType) => STATUS_OPTIONS_BY_TYPE[type] || STATUS_OPTIONS_BY_TYPE.patent;

interface AddProductIPAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId: string;
  linkedAssetIds: string[];
  /** If provided, filters the Type dropdown to only show selected protection types */
  protectionTypesFilter?: string[];
}

export function AddProductIPAssetDialog({
  open,
  onOpenChange,
  companyId,
  productId,
  linkedAssetIds,
  protectionTypesFilter,
}: AddProductIPAssetDialogProps) {
  // Filter IP types based on selected protection types (if any)
  const filteredIPTypes = protectionTypesFilter && protectionTypesFilter.length > 0
    ? IP_TYPES.filter(t => protectionTypesFilter.includes(t.value))
    : IP_TYPES;
  
  // Default to first filtered type
  const defaultIPType = filteredIPTypes.length > 0 ? filteredIPTypes[0].value : 'patent';
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  
  // Create new form state
  const [title, setTitle] = useState('');
  const [ipType, setIpType] = useState<IPType>(defaultIPType);
  const [status, setStatus] = useState<IPStatus>('idea');
  const [internalReference, setInternalReference] = useState('');
  const [description, setDescription] = useState('');
  
  // Link existing state
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  const { data: companyAssets, isLoading: assetsLoading } = useIPAssets(companyId);
  const createAndLinkMutation = useCreateAndLinkIPAsset(companyId);
  const linkMutation = useLinkIPAsset();

  // Filter out already linked assets
  const availableAssets = (companyAssets || []).filter(
    asset => !linkedAssetIds.includes(asset.id)
  );

  const resetForm = () => {
    setTitle('');
    setIpType(defaultIPType);
    setStatus('idea');
    setInternalReference('');
    setDescription('');
    setSelectedAssetIds([]);
  };

  const handleCreateNew = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      await createAndLinkMutation.mutateAsync({
        productId,
        asset: {
          title: title.trim(),
          ip_type: ipType,
          status,
          internal_reference: internalReference.trim() || null,
          description: description.trim() || null,
        },
      });

      toast({ title: 'IP asset created and linked' });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: 'Failed to create IP asset', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
  };

  const handleLinkExisting = async () => {
    if (selectedAssetIds.length === 0) {
      toast({ title: 'Select at least one asset to link', variant: 'destructive' });
      return;
    }

    try {
      await Promise.all(
        selectedAssetIds.map(assetId =>
          linkMutation.mutateAsync({ assetId, productId })
        )
      );

      toast({ title: `Linked ${selectedAssetIds.length} IP asset(s)` });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: 'Failed to link assets', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add IP Asset</DialogTitle>
          <DialogDescription>
            Create a new IP asset or link an existing one from your company portfolio
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="h-4 w-4" />
              Link Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Novel catheter steering mechanism"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={ipType} onValueChange={(v) => {
                  const newType = v as IPType;
                  setIpType(newType);
                  // Reset status to first valid option for new type
                  const validStatuses = getStatusOptionsForType(newType);
                  if (!validStatuses.some(s => s.value === status)) {
                    setStatus(validStatuses[0].value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover" position="popper" sideOffset={4}>
                    {filteredIPTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>Status</Label>
                  <HelpTooltip content="Status options vary by IP type. Each status reflects where this asset is in its protection lifecycle." />
                </div>
              <Select value={status} onValueChange={(v) => setStatus(v as IPStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover"  position="popper" sideOffset={4}>
                    {getStatusOptionsForType(ipType).map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2 w-full">
                          <span>{s.label}</span>
                          <HelpTooltip content={s.description} className="h-3 w-3 ml-auto" />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalReference">Internal Reference</Label>
              <Input
                id="internalReference"
                placeholder="e.g., IP-2024-001"
                value={internalReference}
                onChange={(e) => setInternalReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the IP asset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateNew}
              disabled={createAndLinkMutation.isPending}
              className="w-full"
            >
              {createAndLinkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Asset
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 pt-4">
            {assetsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No unlinked IP assets available</p>
                <p className="text-sm mt-1">Create a new one instead</p>
              </div>
            ) : (
              <>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableAssets.map(asset => (
                    <label
                      key={asset.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
                    >
                      <Checkbox
                        checked={selectedAssetIds.includes(asset.id)}
                        onCheckedChange={() => toggleAssetSelection(asset.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{asset.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {asset.ip_type?.replace('_', ' ')} • {asset.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleLinkExisting}
                  disabled={linkMutation.isPending || selectedAssetIds.length === 0}
                  className="w-full"
                >
                  {linkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link {selectedAssetIds.length} Asset{selectedAssetIds.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
