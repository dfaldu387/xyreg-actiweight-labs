import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Info, Trash2, Loader2, Globe } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BasicUDIDI {
  id: string;
  basic_udi_di: string;
  internal_reference: string;
  created_at: string;
  issuing_agency: string;
  company_prefix: string;
  check_character: string;
  risk_class?: string;
  intended_purpose?: string;
  essential_characteristics?: string;
  display_as_merged?: boolean;
  company_id: string;
}

interface BasicUDIEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basicUDI: BasicUDIDI;
}

interface MarketData {
  code: string;
  name: string;
  selected: boolean;
  riskClass?: string;
  riskClasses?: Array<{ value: string; label: string }>;
}

export function BasicUDIEditDialog({ open, onOpenChange, basicUDI }: BasicUDIEditDialogProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [marketRiskClasses, setMarketRiskClasses] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    internal_reference: basicUDI.internal_reference || '',
    intended_purpose: basicUDI.intended_purpose || '',
    essential_characteristics: basicUDI.essential_characteristics || '',
    display_as_merged: basicUDI.display_as_merged || false,
  });

  // Fetch linked products with their markets data
  const { data: linkedProducts } = useQuery({
    queryKey: ['linked-products-with-markets', basicUDI.basic_udi_di],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, markets')
        .eq('basic_udi_di', basicUDI.basic_udi_di);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get all unique selected markets across all linked products
  const getSelectedMarkets = (): MarketData[] => {
    if (!linkedProducts || linkedProducts.length === 0) return [];
    
    const marketsMap = new Map<string, MarketData>();
    
    linkedProducts.forEach(product => {
      const markets = (product.markets as MarketData[]) || [];
      markets.forEach(market => {
        if (market.selected && !marketsMap.has(market.code)) {
          marketsMap.set(market.code, market);
        }
      });
    });
    
    return Array.from(marketsMap.values());
  };

  const selectedMarkets = getSelectedMarkets();

  // Initialize market risk classes from linked products
  useEffect(() => {
    if (linkedProducts && linkedProducts.length > 0) {
      const initialRiskClasses: Record<string, string> = {};
      linkedProducts.forEach(product => {
        const markets = (product.markets as MarketData[]) || [];
        markets.forEach(market => {
          if (market.selected && market.riskClass && !initialRiskClasses[market.code]) {
            initialRiskClasses[market.code] = market.riskClass;
          }
        });
      });
      setMarketRiskClasses(initialRiskClasses);
    }
  }, [linkedProducts]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Update the basic_udi_di_groups record
      const { error } = await supabase
        .from('basic_udi_di_groups')
        .update({
          internal_reference: data.internal_reference,
          intended_purpose: data.intended_purpose || null,
          essential_characteristics: data.essential_characteristics || null,
          display_as_merged: data.display_as_merged,
          updated_at: new Date().toISOString(),
        })
        .eq('id', basicUDI.id);

      if (error) throw error;

      // Update each linked product's markets array with new risk classes
      if (linkedProducts && linkedProducts.length > 0) {
        for (const product of linkedProducts) {
          const markets = (product.markets as MarketData[]) || [];
          const updatedMarkets = markets.map(m => {
            if (m.selected && marketRiskClasses[m.code]) {
              return { ...m, riskClass: marketRiskClasses[m.code] };
            }
            return m;
          });
          
          const { error: productError } = await supabase
            .from('products')
            .update({ markets: updatedMarkets })
            .eq('id', product.id);
          
          if (productError) throw productError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-udi-di'] });
      queryClient.invalidateQueries({ queryKey: ['company-basic-udi-groups'] });
      queryClient.invalidateQueries({ queryKey: ['linked-products-with-markets'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Basic UDI-DI updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update Basic UDI-DI', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First unlink any products
      if (linkedProducts && linkedProducts.length > 0) {
        const { error: unlinkError } = await supabase
          .from('products')
          .update({ basic_udi_di: null })
          .eq('basic_udi_di', basicUDI.basic_udi_di);
        
        if (unlinkError) throw unlinkError;
      }

      // Then delete the Basic UDI-DI group
      const { error } = await supabase
        .from('basic_udi_di_groups')
        .delete()
        .eq('id', basicUDI.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-udi-di'] });
      queryClient.invalidateQueries({ queryKey: ['company-basic-udi-groups'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Basic UDI-DI deleted successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to delete Basic UDI-DI', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Basic UDI-DI</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-only Basic UDI-DI Info */}
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Basic UDI-DI:</span>
                      <p className="font-mono font-medium">{basicUDI.basic_udi_di}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issuing Agency:</span>
                      <p className="font-medium">{basicUDI.issuing_agency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company Prefix:</span>
                      <p className="font-mono">{basicUDI.company_prefix}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p>{new Date(basicUDI.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Linked Products Info */}
            {linkedProducts && linkedProducts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Linked Products</Label>
                <div className="flex flex-wrap gap-2">
                  {linkedProducts.map(product => (
                    <Badge key={product.id} variant="secondary">
                      {product.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="internal_reference">Internal Reference (Product Family Name)</Label>
                <Input
                  id="internal_reference"
                  value={formData.internal_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_reference: e.target.value }))}
                  placeholder="e.g., Sleep Diagnostic Device Family"
                />
              </div>

              {/* Per-Market Risk Classification */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Risk Classification by Market
                </Label>
                
                {selectedMarkets.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMarkets.map(market => (
                      <div key={market.code} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                        <span className="w-40 font-medium text-sm">{market.name}</span>
                        <Select
                          value={marketRiskClasses[market.code] || ''}
                          onValueChange={(value) => setMarketRiskClasses(prev => ({ ...prev, [market.code]: value }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select risk class" />
                          </SelectTrigger>
                          <SelectContent>
                            {market.riskClasses && market.riskClasses.length > 0 ? (
                              market.riskClasses.map(rc => (
                                <SelectItem key={rc.value} value={rc.value}>
                                  {rc.label}
                                </SelectItem>
                              ))
                            ) : (
                              // Fallback if riskClasses not defined
                              <>
                                <SelectItem value="Class I">Class I</SelectItem>
                                <SelectItem value="Class IIa">Class IIa</SelectItem>
                                <SelectItem value="Class IIb">Class IIb</SelectItem>
                                <SelectItem value="Class III">Class III</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No target markets selected. Go to Device Definition → Target Markets to select markets for this device.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intended_purpose">Intended Purpose</Label>
                <Textarea
                  id="intended_purpose"
                  value={formData.intended_purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, intended_purpose: e.target.value }))}
                  placeholder="Describe the intended purpose of this device family"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="essential_characteristics">Essential Design Characteristics</Label>
                <Textarea
                  id="essential_characteristics"
                  value={formData.essential_characteristics}
                  onChange={(e) => setFormData(prev => ({ ...prev, essential_characteristics: e.target.value }))}
                  placeholder="List essential design characteristics that define this device family"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="display_as_merged">Display as Merged</Label>
                  <p className="text-xs text-muted-foreground">
                    Show all products in this family as a single merged card
                  </p>
                </div>
                <Switch
                  id="display_as_merged"
                  checked={formData.display_as_merged}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, display_as_merged: checked }))}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Basic UDI-DI?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this Basic UDI-DI?</p>
              <p className="font-mono text-sm">{basicUDI.basic_udi_di}</p>
              {linkedProducts && linkedProducts.length > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will unlink {linkedProducts.length} product(s) from this Basic UDI-DI:
                    <ul className="list-disc list-inside mt-1">
                      {linkedProducts.slice(0, 5).map(p => (
                        <li key={p.id} className="text-sm">{p.name}</li>
                      ))}
                      {linkedProducts.length > 5 && (
                        <li className="text-sm">...and {linkedProducts.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
