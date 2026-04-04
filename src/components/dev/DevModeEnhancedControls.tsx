import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useDevMode } from '@/context/DevModeContext';
import { UserRole } from '@/types/documentTypes';
import { getRoleDisplayName } from '@/utils/roleUtils';
import { DevModeScenarioPanel } from './DevModeScenarioPanel';
import { DevModeDebugPanel } from './DevModeDebugPanel';
import { DevModeControls } from './DevModeControls'; // Original controls for advanced users
import { 
  Settings, 
  Zap, 
  Bug, 
  RotateCcw,
  Play,
  ChevronDown,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export function DevModeEnhancedControls() {
  const { 
    isDevMode, 
    toggleDevMode, 
    resetDevMode,
    selectedCompanies,
    selectedRole,
    setSelectedRole,
    isInternalUser,
    availableCompanies,
    addCompany,
    removeCompany,
    primaryCompany,
    setPrimaryCompany
  } = useDevMode();
  
  const [activeTab, setActiveTab] = useState('scenarios');

  const handleToggleDevMode = () => {
    toggleDevMode();
    if (!isDevMode) {
      toast.success("DevMode enabled! Select a scenario to get started.", {
        description: "Use the Scenarios tab to quickly configure test data"
      });
    }
  };

  const handleResetDevMode = () => {
    resetDevMode();
    toast.success("DevMode settings have been reset", {
      description: "All configurations have been cleared"
    });
  };

  return (
    <div className="space-y-6">
      {/* Main DevMode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Developer Mode
              </CardTitle>
              <CardDescription>
                Enhanced testing tools with predefined scenarios for rapid development
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isDevMode}
                onCheckedChange={handleToggleDevMode}
                id="devmode-toggle"
              />
              <Badge variant={isDevMode ? "default" : "secondary"}>
                {isDevMode ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {isDevMode && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Role Selector Dropdown */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Role</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                      {getRoleDisplayName(selectedRole)}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {(["admin", "editor", "viewer", "reviewer"] as UserRole[]).map((role) => (
                      <DropdownMenuItem 
                        key={role} 
                        onClick={() => setSelectedRole(role)}
                        className={selectedRole === role ? "bg-muted" : ""}
                      >
                        {getRoleDisplayName(role)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Company Selector Dropdown */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Companies</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedCompanies.length === 0 ? "None" : 
                         selectedCompanies.length === 1 ? selectedCompanies[0].name : 
                         `${selectedCompanies.length} companies`}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    {availableCompanies.map((company) => {
                      const isSelected = selectedCompanies.some(c => c.id === company.id);
                      const isPrimary = primaryCompany?.id === company.id;
                      return (
                        <DropdownMenuItem 
                          key={company.id} 
                          onClick={() => {
                            if (isSelected) {
                              removeCompany(company.id);
                            } else {
                              addCompany(company);
                            }
                          }}
                          className="flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground'}`} />
                            {company.name}
                          </span>
                          {isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                        </DropdownMenuItem>
                      );
                    })}
                    {availableCompanies.length === 0 && (
                      <DropdownMenuItem disabled>No companies available</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reset Button */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Actions</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetDevMode}
                  className="w-full text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset All
                </Button>
              </div>
            </div>

            {/* Compact Status Display */}
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
              {selectedCompanies.length} companies • {selectedRole} role • {isInternalUser ? 'Internal' : 'External'} user
            </div>
          </CardContent>
        )}
      </Card>

      {/* Enhanced Controls when DevMode is active */}
      {isDevMode && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenarios" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="debug" className="text-xs">
              <Bug className="h-3 w-3 mr-1" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="mt-4">
            <DevModeScenarioPanel />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Advanced Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Manual configuration for custom test scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DevModeControls />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="mt-4">
            <DevModeDebugPanel />
          </TabsContent>
        </Tabs>
      )}

      {/* Help text when DevMode is inactive */}
      {!isDevMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Enable Developer Mode to access:
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground ml-4">
              <li>• Pre-configured user scenarios for testing</li>
              <li>• Single and multi-company access simulation</li>
              <li>• Different user roles and permission levels</li>
              <li>• Internal vs external user testing</li>
              <li>• Debug information and state monitoring</li>
            </ul>
            <Button 
              onClick={handleToggleDevMode}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Enable Developer Mode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}