import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Package, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  description?: string;
  product_count: number;
  document_count: number;
  latest_version?: string;
}

interface PlatformSelectorProps {
  companyId: string;
  selectedPlatform?: string;
  onPlatformSelect: (platformName: string) => void;
  onCreateFromScratch: () => void;
  hideCreationMethod?: boolean;
}

export function PlatformSelector({
  companyId,
  selectedPlatform,
  onPlatformSelect,
  onCreateFromScratch,
  hideCreationMethod = false
}: PlatformSelectorProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlatforms();
  }, [companyId]);

  const loadPlatforms = async () => {
    try {
      setIsLoading(true);
      
      // Get platforms with aggregated data
      const { data: platformData, error } = await supabase
        .from('products')
        .select(`
          product_platform,
          id,
          description,
          version,
          inserted_at
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .not('product_platform', 'is', null);

      if (error) {
        console.error('Error loading platforms:', error);
        toast.error('Failed to load platforms');
        return;
      }

      // Aggregate platform data
      const platformMap = new Map<string, Platform>();
      
      for (const product of platformData || []) {
        const platformName = product.product_platform;
        if (!platformName) continue;

        if (!platformMap.has(platformName)) {
          platformMap.set(platformName, {
            id: platformName,
            name: platformName,
            description: product.description || undefined,
            product_count: 0,
            document_count: 0,
            latest_version: product.version
          });
        }

        const platform = platformMap.get(platformName)!;
        platform.product_count++;
        
        // Update latest version if this product is newer
        if (product.inserted_at && (!platform.latest_version || product.version > platform.latest_version)) {
          platform.latest_version = product.version;
        }
      }

      // Get document counts for each platform
      for (const [platformName, platform] of platformMap) {
        const { count: docCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('document_type', ['Platform Core', 'Architecture', 'Risk Management Platform']);

        platform.document_count = docCount || 0;
      }

      setPlatforms(Array.from(platformMap.values()));
    } catch (error) {
      console.error('Error loading platforms:', error);
      toast.error('Failed to load platforms');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading platforms...</div>;
  }

  // If creation method is hidden, automatically select platform-based creation
  if (hideCreationMethod) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Select Platform</Label>
        </div>

        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Platform-Based Creation</CardTitle>
            </div>
            <CardDescription>
              Inherit documents and data from an existing platform
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Select value={selectedPlatform || ""} onValueChange={onPlatformSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.name}>
                    <div className="flex items-center gap-2">
                      <span>{platform.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        v{platform.latest_version}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                {platforms.length === 0 && (
                  <SelectItem value="none" disabled>
                    No platforms available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedPlatform && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{platforms.find(p => p.name === selectedPlatform)?.product_count || 0} products</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{platforms.find(p => p.name === selectedPlatform)?.document_count || 0} platform docs</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {platforms.length > 0 && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <strong>Platform Benefits:</strong> Automatic inheritance of core documents, risk assessments, 
              architectural designs, and compliance data. Changes to platform documents can be propagated 
              to all derived products with impact assessment workflows.
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Choose Creation Method</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create from Scratch Option */}
        <Card className={`cursor-pointer transition-all hover:border-primary ${!selectedPlatform ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Create from Scratch</CardTitle>
            </div>
            <CardDescription>
              Start with a blank product and build everything from the ground up
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant={!selectedPlatform ? "default" : "outline"}
              className="w-full"
              onClick={onCreateFromScratch}
            >
              Start Fresh
            </Button>
          </CardContent>
        </Card>

        {/* Platform-based Creation */}
        <Card className={`cursor-pointer transition-all hover:border-primary ${selectedPlatform ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Base on Platform</CardTitle>
            </div>
            <CardDescription>
              Inherit documents and data from an existing platform to save time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Select value={selectedPlatform || ""} onValueChange={onPlatformSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.name}>
                    <div className="flex items-center gap-2">
                      <span>{platform.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        v{platform.latest_version}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                {platforms.length === 0 && (
                  <SelectItem value="none" disabled>
                    No platforms available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedPlatform && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{platforms.find(p => p.name === selectedPlatform)?.product_count || 0} products</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{platforms.find(p => p.name === selectedPlatform)?.document_count || 0} platform docs</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {platforms.length > 0 && (
        <>
          <Separator />
          <div className="text-sm text-muted-foreground">
            <strong>Platform Benefits:</strong> Automatic inheritance of core documents, risk assessments, 
            architectural designs, and compliance data. Changes to platform documents can be propagated 
            to all derived products with impact assessment workflows.
          </div>
        </>
      )}
    </div>
  );
}