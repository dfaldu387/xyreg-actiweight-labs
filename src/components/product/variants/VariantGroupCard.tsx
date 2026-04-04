import { useState, useEffect } from "react";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2, Plus, X } from "lucide-react";
import { ProductVariantGroup, DistributionPattern } from "@/types/variantGroup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DistributionPatternSelector } from "./DistributionPatternSelector";
import {
  calculateEvenDistribution,
  calculateGaussianDistribution,
} from "@/utils/distributionCalculators";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  group: ProductVariantGroup;
  variants: Array<{ id: string; name: string; percentage: number }>;
  availableVariants: Array<{ id: string; name: string }>;
  onUpdate: (data: { distribution_pattern?: DistributionPattern; total_percentage?: number }) => void;
  onDelete: () => void;
  onUpdateVariantPercentage: (variantId: string, percentage: number) => void;
  onAddVariantToGroup: (variantId: string, groupId: string) => void;
  onRemoveVariantFromGroup: (variantId: string) => void;
}

export function VariantGroupCard({
  group,
  variants,
  availableVariants,
  onUpdate,
  onDelete,
  onUpdateVariantPercentage,
  onAddVariantToGroup,
  onRemoveVariantFromGroup,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [showAddVariants, setShowAddVariants] = useState(false);

  // Reset selections when variants change
  useEffect(() => {
    setSelectedVariantIds([]);
  }, [availableVariants]);

  const handlePatternChange = (pattern: DistributionPattern) => {
    onUpdate({ distribution_pattern: pattern });

    // Auto-calculate percentages based on pattern
    if (pattern === 'even') {
      const percentages = calculateEvenDistribution(group.total_percentage, variants.length);
      percentages.forEach((pct, idx) => {
        onUpdateVariantPercentage(variants[idx].id, pct);
      });
    } else if (pattern === 'gaussian_curve') {
      const percentages = calculateGaussianDistribution(group.total_percentage, variants.length);
      percentages.forEach((pct, idx) => {
        onUpdateVariantPercentage(variants[idx].id, pct);
      });
    }
  };

  const handleTotalPercentageChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onUpdate({ total_percentage: num });
      
      // Recalculate variant percentages if not empirical
      if (group.distribution_pattern === 'even') {
        const percentages = calculateEvenDistribution(num, variants.length);
        percentages.forEach((pct, idx) => {
          onUpdateVariantPercentage(variants[idx].id, pct);
        });
      } else if (group.distribution_pattern === 'gaussian_curve') {
        const percentages = calculateGaussianDistribution(num, variants.length);
        percentages.forEach((pct, idx) => {
          onUpdateVariantPercentage(variants[idx].id, pct);
        });
      }
    }
  };

  const handleToggleVariant = (variantId: string) => {
    setSelectedVariantIds(prev => 
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  const handleAddSelectedVariants = () => {
    selectedVariantIds.forEach(variantId => {
      onAddVariantToGroup(variantId, group.id);
    });
    setSelectedVariantIds([]);
    setShowAddVariants(false);
  };

  const actualTotal = variants.reduce((sum, v) => sum + v.percentage, 0);
  const isValid = Math.abs(actualTotal - group.total_percentage) < 0.01;

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-1" />
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{group.name}</h3>
                <span className={`text-sm px-2 py-1 rounded ${
                  isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {actualTotal.toFixed(2)}% / {group.total_percentage}%
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Total Group %</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={group.total_percentage}
                    onChange={(e) => handleTotalPercentageChange(e.target.value)}
                  />
                </div>
                <DistributionPatternSelector
                  value={group.distribution_pattern}
                  onChange={handlePatternChange}
                />
              </div>
            )}

            <CollapsibleContent>
              <div className="space-y-3 mt-4">
                {/* Add Variants to Group */}
                {availableVariants.length > 0 && (
                  <div className="space-y-3 pb-3 border-b">
                    {!showAddVariants ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddVariants(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variants to Group
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Select variants to add:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowAddVariants(false);
                              setSelectedVariantIds([]);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
                          {availableVariants.map((variant) => (
                            <div key={variant.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`variant-${variant.id}`}
                                checked={selectedVariantIds.includes(variant.id)}
                                onCheckedChange={() => handleToggleVariant(variant.id)}
                              />
                              <Label
                                htmlFor={`variant-${variant.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {variant.name}
                              </Label>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddSelectedVariants}
                            disabled={selectedVariantIds.length === 0}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add {selectedVariantIds.length > 0 && `(${selectedVariantIds.length})`} Selected
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Variants in Group */}
                {variants.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No variants in this group yet. Add variants above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                        <span className="flex-1 text-sm">{variant.name}</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={variant.percentage}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              onUpdateVariantPercentage(variant.id, val);
                            }
                          }}
                          disabled={group.distribution_pattern !== 'empirical_data'}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground w-8">%</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemoveVariantFromGroup(variant.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </div>
      </Collapsible>
    </Card>
  );
}
