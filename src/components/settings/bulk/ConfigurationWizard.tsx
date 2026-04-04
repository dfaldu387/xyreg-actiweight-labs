import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HierarchicalNode } from "@/services/hierarchicalBulkService";
import { Zap, CheckCircle, Globe, DollarSign, Shield } from 'lucide-react';

interface ConfigurationWizardProps {
  companyId: string;
  hierarchy: HierarchicalNode[];
  onComplete: () => void;
}

export function ConfigurationWizard({ companyId, hierarchy, onComplete }: ConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const wizardSteps = [
    {
      id: 'markets',
      title: 'Set Target Markets',
      description: 'Configure target markets at category level for efficient inheritance',
      icon: Globe,
      action: 'Configure Markets'
    },
    {
      id: 'pricing',
      title: 'Setup Pricing Structure', 
      description: 'Establish pricing rules at platform level for consistency',
      icon: DollarSign,
      action: 'Setup Pricing'
    },
    {
      id: 'regulatory',
      title: 'Regulatory Information',
      description: 'Add regulatory status and FDA codes where applicable',
      icon: Shield,
      action: 'Configure Regulatory'
    }
  ];
  
  const getUnconfiguredCategories = () => {
    return hierarchy.filter(cat => !cat.hasIndividualConfig);
  };
  
  const getUnconfiguredPlatforms = () => {
    const platforms: HierarchicalNode[] = [];
    hierarchy.forEach(cat => {
      if (cat.children) {
        platforms.push(...cat.children.filter(plat => !plat.hasIndividualConfig));
      }
    });
    return platforms;
  };
  
  const handleQuickSetup = async (type: string) => {
    setIsExecuting(true);
    try {
      // Implementation would perform bulk configuration based on type
      console.log('Quick setup for:', type);
      
      // Simulate operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete();
    } catch (error) {
      console.error('Quick setup failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuration Wizard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Quickly configure your large product portfolio using smart defaults and inheritance.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            {wizardSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSetup(step.id)}
                          disabled={isExecuting}
                          className="w-full"
                        >
                          {isExecuting ? 'Setting up...' : step.action}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unconfigured Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUnconfiguredCategories().map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{cat.name}</span>
                  <Badge variant="secondary">
                    {cat.productCount} products
                  </Badge>
                </div>
              ))}
              {getUnconfiguredCategories().length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All categories configured</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unconfigured Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUnconfiguredPlatforms().slice(0, 5).map(plat => (
                <div key={plat.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{plat.name}</span>
                  <Badge variant="secondary">
                    {plat.productCount} products
                  </Badge>
                </div>
              ))}
              {getUnconfiguredPlatforms().length > 5 && (
                <div className="text-sm text-muted-foreground">
                  +{getUnconfiguredPlatforms().length - 5} more platforms
                </div>
              )}
              {getUnconfiguredPlatforms().length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All platforms configured</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}