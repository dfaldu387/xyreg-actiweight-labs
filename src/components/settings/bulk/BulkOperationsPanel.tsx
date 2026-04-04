import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HierarchicalNode, HierarchicalBulkService } from "@/services/hierarchicalBulkService";
import { BulkMarketConfiguration } from './operations/BulkMarketConfiguration';
import { BulkPricingConfiguration } from './operations/BulkPricingConfiguration';
import { BulkRegulatoryConfiguration } from './operations/BulkRegulatoryConfiguration';
import { BulkHierarchyConfiguration } from './operations/BulkHierarchyConfiguration';
import { BulkOperationStatusTracker } from './BulkOperationStatusTracker';
import { useBulkOperationProgress } from '@/hooks/useBulkOperationProgress';
import { Globe, DollarSign, Shield, AlertCircle, Layers3 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsPanelProps {
  selectedNodes: HierarchicalNode[];
  onOperationComplete: () => void;
  companyId: string;
}

export function BulkOperationsPanel({ selectedNodes, onOperationComplete, companyId }: BulkOperationsPanelProps) {
  const [activeOperation, setActiveOperation] = useState<string>('hierarchy');
  const [isExecuting, setIsExecuting] = useState(false);
  const { progress, startOperation, completeOperation, getProgressCallback } = useBulkOperationProgress();
  
  const getAffectedProductCount = () => {
    // Avoid double counting when parent and child nodes are selected
    // Remove child nodes if their parent is also selected
    const filteredNodes = selectedNodes.filter(node => {
      return !selectedNodes.some(otherNode => 
        otherNode !== node && 
        node.parentId === otherNode.id
      );
    });
    
    return filteredNodes.reduce((total, node) => total + node.productCount, 0);
  };
  
  const getNodeTypeBreakdown = () => {
    const breakdown = {
      categories: selectedNodes.filter(n => n.type === 'category').length,
      platforms: selectedNodes.filter(n => n.type === 'platform').length,
      models: selectedNodes.filter(n => n.type === 'model').length,
      products: selectedNodes.filter(n => n.type === 'product').length,
    };
    return breakdown;
  };

  const getOperationDetails = () => {
    const breakdown = getNodeTypeBreakdown();
    const productCount = getAffectedProductCount();
    
    const operationDescriptions = {
      hierarchy: `Restructuring hierarchy for ${productCount} products across ${breakdown.categories} categories, ${breakdown.platforms} platforms, and ${breakdown.models} models`,
      markets: `Configuring market settings for ${productCount} products to update target markets and regulatory compliance`,
      pricing: `Applying pricing rules and configurations to ${productCount} products across multiple hierarchy levels`,
      regulatory: `Updating regulatory status, lifecycle phases, and compliance information for ${productCount} products`,
      regulatory_status: `Updating regulatory status, lifecycle phases, and compliance information for ${productCount} products`
    };
    
    return operationDescriptions[activeOperation as keyof typeof operationDescriptions] || 
           `Processing ${productCount} products with bulk operation`;
  };
  
  const handleBulkOperation = async (type: string, payload: any) => {
    if (selectedNodes.length === 0) {
      toast.error('No items selected');
      return;
    }
    
    const totalProducts = getAffectedProductCount();
    
    try {
      setIsExecuting(true);
      startOperation(totalProducts);
      
      const progressCallback = getProgressCallback();
      
      await HierarchicalBulkService.executeBulkOperation({
        type: type as any,
        nodes: selectedNodes,
        payload
      }, progressCallback);
      
      completeOperation();
      toast.success(`Successfully processed ${totalProducts} products`);
      onOperationComplete();
      
    } catch (error) {
      console.error('Bulk operation failed:', error);
      completeOperation();
      toast.error('Failed to execute bulk operation');
    } finally {
      setIsExecuting(false);
    }
  };
  
  if (selectedNodes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Items Selected</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Select categories, platforms, models, or products from the hierarchy tree to perform bulk operations.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const breakdown = getNodeTypeBreakdown();
  
  return (
    <div className="space-y-6">
      {/* Status Tracker */}
      <BulkOperationStatusTracker 
        progress={progress} 
        operationType={activeOperation}
        operationDetails={getOperationDetails()}
      />
      
      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">{getAffectedProductCount()}</div>
              <div className="text-muted-foreground">products will be affected</div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {breakdown.categories > 0 && (
                <Badge variant="outline">
                  {breakdown.categories} {breakdown.categories === 1 ? 'Category' : 'Categories'}
                </Badge>
              )}
              {breakdown.platforms > 0 && (
                <Badge variant="outline">
                  {breakdown.platforms} {breakdown.platforms === 1 ? 'Platform' : 'Platforms'}
                </Badge>
              )}
              {breakdown.models > 0 && (
                <Badge variant="outline">
                  {breakdown.models} {breakdown.models === 1 ? 'Model' : 'Models'}
                </Badge>
              )}
              {breakdown.products > 0 && (
                <Badge variant="outline">
                  {breakdown.products} Individual {breakdown.products === 1 ? 'Product' : 'Products'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeOperation} onValueChange={setActiveOperation}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="markets" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Markets
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="regulatory" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Regulatory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-4">
              <BulkHierarchyConfiguration
                selectedNodes={selectedNodes}
                onExecute={(payload) => handleBulkOperation('hierarchy', payload)}
                isExecuting={isExecuting}
                companyId={companyId}
              />
            </TabsContent>

            <TabsContent value="markets" className="space-y-4">
              <BulkMarketConfiguration
                selectedNodes={selectedNodes}
                onExecute={(payload) => handleBulkOperation('markets', payload)}
                isExecuting={isExecuting}
                companyId={companyId}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <BulkPricingConfiguration
                selectedNodes={selectedNodes}
                onExecute={(payload) => handleBulkOperation('pricing', payload)}
                isExecuting={isExecuting}
                companyId={companyId}
              />
            </TabsContent>

            <TabsContent value="regulatory" className="space-y-4">
              <BulkRegulatoryConfiguration
                selectedNodes={selectedNodes}
                onExecute={(payload) => handleBulkOperation('regulatory_status', payload)}
                isExecuting={isExecuting}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}