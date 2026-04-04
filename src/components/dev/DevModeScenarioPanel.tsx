import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useDevModeScenarios } from '@/hooks/useDevModeScenarios';
import { DevModeScenario } from '@/types/devMode';
import { 
  Users, 
  User, 
  Shield, 
  Building, 
  ChevronDown, 
  ChevronRight,
  Play,
  Star,
  AlertCircle
} from 'lucide-react';

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'single-company':
      return <Building className="h-4 w-4" />;
    case 'multi-company':
      return <Users className="h-4 w-4" />;
    case 'role-based':
      return <Shield className="h-4 w-4" />;
    case 'limited-access':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getScenarioRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'editor':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'viewer':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface ScenarioCardProps {
  scenario: DevModeScenario;
  isActive: boolean;
  onApply: (scenario: DevModeScenario) => void;
}

function ScenarioCard({ scenario, isActive, onApply }: ScenarioCardProps) {
  const companiesCount = scenario.config.selectedCompanies.length;
  const hasMultipleRoles = Object.values(scenario.config.companyRoles).length > 1 &&
    new Set(Object.values(scenario.config.companyRoles)).size > 1;

  return (
    <Card className={`transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm font-medium">{scenario.name}</CardTitle>
            {isActive && <Star className="h-4 w-4 text-primary fill-current" />}
          </div>
          <Button 
            size="sm" 
            variant={isActive ? "default" : "outline"}
            onClick={() => onApply(scenario)}
            className="h-7 px-2 text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            {isActive ? 'Active' : 'Apply'}
          </Button>
        </div>
        <CardDescription className="text-xs">{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs px-1">
            {companiesCount} {companiesCount === 1 ? 'Company' : 'Companies'}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs px-1 ${getScenarioRoleColor(scenario.config.globalRole)}`}
          >
            {scenario.config.globalRole}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs px-1 ${scenario.config.isInternalUser ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}
          >
            {scenario.config.isInternalUser ? 'Internal' : 'External'}
          </Badge>
          {hasMultipleRoles && (
            <Badge variant="outline" className="text-xs px-1 bg-purple-100 text-purple-800 border-purple-200">
              Mixed Roles
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DevModeScenarioPanel() {
  const { 
    applyScenario, 
    getScenarioCategories, 
    getCurrentScenarioInfo,
    currentScenario,
    isDevMode
  } = useDevModeScenarios();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['single-company', 'multi-company']) // Expand common categories by default
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const categories = getScenarioCategories();
  const currentScenarioInfo = getCurrentScenarioInfo();

  if (!isDevMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">DevMode Scenarios</CardTitle>
          <CardDescription className="text-xs">
            Enable DevMode to access testing scenarios
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DevMode Testing Scenarios
          </CardTitle>
          <CardDescription className="text-xs">
            Quick scenarios for testing different user access patterns
          </CardDescription>
        </CardHeader>
      </Card>

      {currentScenarioInfo && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-primary fill-current" />
              Current Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{currentScenarioInfo.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{currentScenarioInfo.description}</div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <Collapsible 
              key={category.id} 
              open={isExpanded}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.id)}
                        <CardTitle className="text-sm">{category.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {category.scenarios.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-2 mt-2 ml-4">
                  {category.scenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isActive={currentScenario === scenario.id}
                      onApply={applyScenario}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => applyScenario(categories[0].scenarios[0])}
              className="text-xs"
            >
              Single Admin
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => applyScenario(categories[1].scenarios[0])}
              className="text-xs"
            >
              Multi Admin
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => applyScenario(categories[0].scenarios[2])}
              className="text-xs"
            >
              External User
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => applyScenario(categories[3].scenarios[0])}
              className="text-xs"
            >
              No Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}