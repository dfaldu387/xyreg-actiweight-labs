import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVariationDimensions } from "@/hooks/useVariationDimensions";
import { updateProductVariantTags } from "@/services/productFamilyService";
import { toast } from "sonner";
import { Tag, Save, Sparkles } from "lucide-react";

interface Props {
  productId: string;
  companyId: string;
  productName: string;
  currentTags: Record<string, string> | null;
  onUpdate?: () => void;
}

/**
 * Auto-detect variant tags from product name
 * Looks for patterns like "(10)" or "Medium" in product names
 */
function autoDetectTags(
  productName: string,
  dimensions: any[],
  optionsByDimension: Record<string, any[]>
): Record<string, string> {
  const detectedTags: Record<string, string> = {};
  
  dimensions.forEach(dimension => {
    const options = optionsByDimension[dimension.id] || [];
    
    // Look for exact option matches in product name
    options.forEach(option => {
      if (option.is_active && productName.includes(option.name)) {
        detectedTags[dimension.name] = option.name;
      }
    });
  });
  
  return detectedTags;
}

export function VariantTagEditor({ productId, companyId, productName, currentTags, onUpdate }: Props) {
  const { dimensions, optionsByDimension, loading } = useVariationDimensions(companyId);
  const [tags, setTags] = useState<Record<string, string>>(currentTags || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoDetected, setAutoDetected] = useState<Record<string, string>>({});

  useEffect(() => {
    setTags(currentTags || {});
    setHasChanges(false);
  }, [currentTags]);

  useEffect(() => {
    if (!loading && dimensions.length > 0) {
      const detected = autoDetectTags(productName, dimensions, optionsByDimension);
      setAutoDetected(detected);
      
      // Auto-apply detected tags if no current tags exist
      if (!currentTags || Object.keys(currentTags).length === 0) {
        if (Object.keys(detected).length > 0) {
          setTags(detected);
          setHasChanges(true);
        }
      }
    }
  }, [loading, dimensions, optionsByDimension, productName, currentTags]);

  const handleTagChange = (dimensionName: string, optionName: string) => {
    setTags(prev => ({
      ...prev,
      [dimensionName]: optionName
    }));
    setHasChanges(true);
  };

  const handleRemoveTag = (dimensionName: string) => {
    setTags(prev => {
      const newTags = { ...prev };
      delete newTags[dimensionName];
      return newTags;
    });
    setHasChanges(true);
  };

  const handleAutoApply = () => {
    setTags(autoDetected);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProductVariantTags(productId, tags);
      toast.success("Variant tags updated successfully");
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error saving variant tags:", error);
      toast.error("Failed to update variant tags");
    } finally {
      setIsSaving(false);
    }
  };

  const activeDimensions = dimensions.filter(d => d.is_active);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading dimensions...</div>;
  }

  if (activeDimensions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No variant dimensions defined. Add dimensions in Settings → Product Portfolio Structure.
      </div>
    );
  }

  const hasAutoDetected = Object.keys(autoDetected).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Label className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Product Variant Tags
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Tag this product within its family to enable grouping in portfolio view
          </p>
        </div>
        <div className="flex gap-2">
          {hasAutoDetected && !hasChanges && (
            <Button onClick={handleAutoApply} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Auto-Detected
            </Button>
          )}
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Tags
            </Button>
          )}
        </div>
      </div>

      {hasAutoDetected && (
        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Auto-detected from product name:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(autoDetected).map(([dimName, optionValue]) => (
                  <Badge key={dimName} variant="secondary">
                    {dimName}: {optionValue}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {activeDimensions.map(dimension => {
          const options = optionsByDimension[dimension.id] || [];
          const activeOptions = options.filter(o => o.is_active);
          const currentValue = tags[dimension.name];

          return (
            <div key={dimension.id} className="grid gap-2">
              <Label htmlFor={`tag-${dimension.id}`}>{dimension.name}</Label>
              <Select
                value={currentValue || ""}
                onValueChange={(value) => {
                  if (value === "__none__") {
                    handleRemoveTag(dimension.name);
                  } else {
                    const option = activeOptions.find(o => o.name === value);
                    if (option) {
                      handleTagChange(dimension.name, option.name);
                    }
                  }
                }}
              >
                <SelectTrigger id={`tag-${dimension.id}`}>
                  <SelectValue placeholder={`Select ${dimension.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">Not specified</span>
                  </SelectItem>
                  {activeOptions.map(option => (
                    <SelectItem key={option.id} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {Object.keys(tags).length > 0 && (
        <div className="pt-2">
          <Label className="text-sm">Current Tags:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(tags).map(([dimName, optionValue]) => (
              <Badge key={dimName} variant="secondary">
                {dimName}: {optionValue}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
