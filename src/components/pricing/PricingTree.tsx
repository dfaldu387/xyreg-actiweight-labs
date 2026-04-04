import React, { useState } from "react";
import { ChevronDown, ChevronRight, DollarSign, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductHierarchyNode } from "@/services/hierarchyService";
import { formatCurrency } from "@/utils/marketCurrencyUtils";
import { useTranslation } from "@/hooks/useTranslation";

interface PricingTreeProps {
  hierarchy: ProductHierarchyNode[];
  effectivePricing: any[];
  pricingRules: any[];
  selectedMarket: string;
  onEditRule: (productId: string, rule?: any) => void;
  onCreateRule: (productId: string) => void;
  disabled?: boolean;
}

interface TreeNodeProps {
  node: ProductHierarchyNode;
  effectivePricing: any[];
  pricingRules: any[];
  selectedMarket: string;
  onEditRule: (productId: string, rule?: any) => void;
  onCreateRule: (productId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  disabled?: boolean;
  lang: (key: string) => string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  effectivePricing,
  pricingRules,
  selectedMarket,
  onEditRule,
  onCreateRule,
  isExpanded,
  onToggleExpand,
  disabled = false,
  lang,
}) => {
  const hasChildren = node.children.length > 0;
  const indentLevel = node.level;
  
  // Find effective pricing for this product
  const effectivePrice = effectivePricing.find(
    p => p.product_id === node.id && p.market_code === selectedMarket
  );
  
  // Find pricing rules for this product
  const productRules = pricingRules.filter(
    r => r.product_id === node.id && r.market_code === selectedMarket
  );
  
  const hasDirectRule = productRules.length > 0;
  const isInherited = effectivePrice && !hasDirectRule;

  return (
    <div className="border-l border-border/50">
      <div
        className={cn(
          "flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors",
          "border-b border-border/30"
        )}
        style={{ paddingLeft: `${indentLevel * 24 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.name}</span>
            {node.model_reference && (
              <Badge variant="outline" className="text-xs">
                {node.model_reference}
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Info */}
        <div className="flex items-center gap-2">
          {effectivePrice ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">
                {formatCurrency(effectivePrice.effective_price, selectedMarket)}
              </span>
              {isInherited && (
                <Badge variant="secondary" className="text-xs">
                  {lang('commercial.pricingStrategy.tree.inherited')}
                </Badge>
              )}
              {hasDirectRule && (
                <Badge variant="default" className="text-xs">
                  {lang('commercial.pricingStrategy.tree.directRule')}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">{lang('commercial.pricingStrategy.tree.noPrice')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1">
            {hasDirectRule ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => onEditRule(node.id, productRules[0])}
                disabled={disabled}
              >
                <Edit className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => onCreateRule(node.id)}
                disabled={disabled}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <ExpandableTreeNode
              key={child.id}
              node={child}
              effectivePricing={effectivePricing}
              pricingRules={pricingRules}
              selectedMarket={selectedMarket}
              onEditRule={onEditRule}
              onCreateRule={onCreateRule}
              disabled={disabled}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ExpandableTreeNode: React.FC<Omit<TreeNodeProps, 'isExpanded' | 'onToggleExpand'>> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TreeNode
      {...props}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      disabled={props.disabled}
      lang={props.lang}
    />
  );
};

export const PricingTree: React.FC<PricingTreeProps> = ({
  hierarchy,
  effectivePricing,
  pricingRules,
  selectedMarket,
  onEditRule,
  onCreateRule,
  disabled = false,
}) => {
  const { lang } = useTranslation();

  if (hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{lang('commercial.pricingStrategy.tree.noProductsFound')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {lang('commercial.pricingStrategy.tree.hierarchyTitle')} - {selectedMarket}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {hierarchy.map((node) => (
            <ExpandableTreeNode
              key={node.id}
              node={node}
              effectivePricing={effectivePricing}
              pricingRules={pricingRules}
              selectedMarket={selectedMarket}
              onEditRule={onEditRule}
              onCreateRule={onCreateRule}
              disabled={disabled}
              lang={lang}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};