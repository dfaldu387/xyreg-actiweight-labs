import React, { useEffect, useState } from "react";
import { useDevMode, Company, CompanyInternalStatus } from "@/context/DevModeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, CheckCircle, Settings, UserCog, Info, Loader2, Database, Building, User, UserCheck, UserX, ShieldCheck, LogOut, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/documentTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DevModeControls() {
  const { 
    isDevMode, 
    toggleDevMode, 
    selectedRole, 
    setSelectedRole,
    selectedCompanies,
    primaryCompany,
    setPrimaryCompany,
    addCompany,
    removeCompany,
    clearCompanies,
    hasMultipleCompanies,
    isInternalUser,
    setIsInternalUser,
    availableCompanies,
    setAvailableCompanies,
    getCompanyInternalStatus,
    setCompanyInternalStatus,
    companyInternalStatuses,
    getCompanyRole,
    setCompanyRole,
    companyRoles,
    resetDevMode
  } = useDevMode();
  
  const { user, isLoading: authLoading, signOut, clearDevMode } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fix infinite re-render loop by removing setAvailableCompanies from dependencies
  useEffect(() => {
    if (!isDevMode) return;
    
    const fetchCompanies = async () => {
      if (loading) return; // Prevent concurrent fetches
      
      setLoading(true);
      setFetchError(null);
      
      try {
        const { data: testData, error: testError } = await supabase
          .from('companies')
          .select('count')
          .limit(1);
          
        if (testError) {
          console.error("[DevMode] Supabase connectivity test failed:", testError);
          throw new Error(`Supabase connection failed: ${testError.message}`);
        }
        
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_archived', false)
          .order('name');
          
        if (companiesError) {
          console.error("[DevMode] Companies fetch error:", companiesError);
          throw new Error(`Failed to fetch companies: ${companiesError.message}`);
        }
        
        if (companies && companies.length > 0) {
          setAvailableCompanies(companies);
          toast.success(`DevMode: Loaded ${companies.length} companies from database`, {
            description: "Companies are now available for testing"
          });
        } else {
          setFetchError("No companies found in the database. Please add some companies first.");
          setAvailableCompanies([]);
          toast.warning("No companies found in database", {
            description: "You may need to add some companies to test with DevMode"
          });
        }
      } catch (error: any) {
        console.error("[DevMode] Company fetch failed:", error);
        const errorMessage = error.message || "Could not connect to database";
        setFetchError(errorMessage);
        setAvailableCompanies([]);
        
        toast.error("DevMode: Failed to load companies", {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't already have companies or there was an error
    if (availableCompanies.length === 0 && !fetchError) {
      fetchCompanies();
    }
  }, [isDevMode]); // Removed setAvailableCompanies from dependencies to fix infinite loop

  // If not in dev mode, don't render
  if (!isDevMode) {
    return null;
  }

  // Guard against undefined selectedCompanies
  const companiesArray = selectedCompanies || [];

  // Handle adding a company to portfolio
  const handleAddCompany = () => {
    if (!selectedCompanyId) return;
    
    const company = availableCompanies?.find(c => c.id === selectedCompanyId);
    if (company) {
      addCompany(company);
      setSelectedCompanyId('');
      toast.success(`Added ${company.name} to your DevMode portfolio`);
    } else {
      console.error("[DevMode] Company not found for ID:", selectedCompanyId);
      toast.error("Company not found");
    }
  };
  
  // Handle setting a company as primary
  const handleSetPrimary = (company: Company) => {
    setPrimaryCompany(company);
    toast.success(`${company.name} set as primary company`);
  };

  // Handle DevMode logout using the signOut function from auth context
  const handleDevModeLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out of DevMode");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  const refreshCompanies = async () => {
    setLoading(true);
    setFetchError(null);
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');
      
      if (error) {
        console.error("[DevMode] Manual refresh error:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setAvailableCompanies(data);
        toast.success(`DevMode: Refreshed ${data.length} companies from database`);
      } else {
        console.warn("[DevMode] Manual refresh found no companies");
        setFetchError("No companies found in your database");
        toast.warning("No companies found in database");
        setAvailableCompanies([]);
      }
    } catch (error: any) {
      console.error("[DevMode] Manual refresh failed:", error);
      setFetchError(error.message || "Failed to refresh companies");
      toast.error("Failed to refresh companies: " + error.message);
      setAvailableCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle toggling internal/external status for a company
  const handleToggleCompanyInternalStatus = (companyId: string, isInternal: boolean) => {
    setCompanyInternalStatus(companyId, isInternal);
    
    const companyName = selectedCompanies.find(c => c.id === companyId)?.name || "Selected company";
    toast.success(`${companyName} set as ${isInternal ? 'internal' : 'external'} user status`);
    
    // If this is the primary company, also update UI message
    if (primaryCompany && primaryCompany.id === companyId) {
      toast.info(`You are now ${isInternal ? 'an internal' : 'an external'} user for your primary company`);
    }
  };
  
  // Handle changing role for a company
  const handleCompanyRoleChange = (companyId: string, role: UserRole) => {
    setCompanyRole(companyId, role);
    
    const companyName = selectedCompanies.find(c => c.id === companyId)?.name || "Selected company";
    toast.success(`${companyName} role set to ${role}`);
  };
  
  // Handle resetting all DevMode settings
  const handleResetDevMode = () => {
    const confirmed = window.confirm("Are you sure you want to reset all DevMode settings? This will clear all companies, roles, and log you out.");
    if (confirmed) {
      clearDevMode();
    }
  };
  
  // Get display name for role
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case "admin": return "Administrator";
      case "editor": return "Editor";
      case "viewer": return "Viewer";
      default: return "Unknown";
    }
  };

  return (
    <Card className="border-2 border-yellow-500">
      <CardHeader className="bg-yellow-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Development Mode
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Testing Only</Badge>
            </CardTitle>
            <CardDescription>Configure temporary settings for testing different user experiences</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="dev-mode-toggle" 
              checked={isDevMode} 
              onCheckedChange={toggleDevMode} 
            />
            <Label htmlFor="dev-mode-toggle">
              {isDevMode ? "Active" : "Disabled"}
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* DevMode Status and Controls */}
        <Alert variant="default" className="bg-blue-50 border-blue-300">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>DevMode Active - Mock User Session</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>You are logged in as a mock user (dev@example.com). This bypasses real authentication for testing.</p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDevModeLogout}
                className="text-xs"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Logout DevMode
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetDevMode}
                className="text-xs"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset All Settings
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Database connection error */}
        {fetchError && (
          <Alert variant="default" className="bg-red-50 border-red-300">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>Database Issue</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>{fetchError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshCompanies}
                disabled={loading}
                className="mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Retry Connection
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="default" className="bg-yellow-50 border-yellow-300">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Development Testing Only</AlertTitle>
          <AlertDescription className="text-sm">
            These settings override authentication for testing purposes only and will not appear in production.
            You can test multiple companies, different roles, and per-company internal/external user status.
          </AlertDescription>
        </Alert>

        {/* Reset DevMode Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetDevMode}
            className="text-xs"
          >
            <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />
            Reset DevMode
          </Button>
        </div>

        {/* Tabs for better organization of the settings */}
        <Tabs value="companies" onValueChange={() => {}}>
          <TabsList className="w-full">
            <TabsTrigger value="companies" className="flex-1">
              <Building className="h-4 w-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="user" className="flex-1">
              <User className="h-4 w-4 mr-2" />
              User Role
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies" className="pt-4">
            {/* Company Portfolio Management */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Company Portfolio</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshCompanies}
                    disabled={loading}
                    className="text-xs"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      'Refresh Companies'
                    )}
                  </Button>
                  {companiesArray.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearCompanies}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Add new company */}
              <div className="flex space-x-2">
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                  disabled={loading || (availableCompanies && availableCompanies.length === 0)}
                >
                  <SelectTrigger id="company-select" className="flex-1">
                    <SelectValue placeholder={loading ? "Loading..." : "Select company to add"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies && availableCompanies
                      .filter(company => !companiesArray.some(c => c.id === company.id))
                      .map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddCompany} 
                  disabled={!selectedCompanyId || loading}
                >
                  Add
                </Button>
              </div>
              
              {/* Data source indicator */}
              <div className="text-sm text-gray-500">
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" /> 
                    Loading company data from database...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-800">
                      Supabase Database
                    </Badge>
                    <span className="ml-2">
                      {availableCompanies?.length || 0} companies available
                    </span>
                  </div>
                )}
              </div>
              
              {/* Selected Companies List */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">
                  {companiesArray.length === 0 
                    ? "No companies selected" 
                    : `${companiesArray.length} ${companiesArray.length === 1 ? 'company' : 'companies'} in portfolio`}
                </Label>
                
                {companiesArray.length > 0 ? (
                  <ScrollArea className="h-[250px] border rounded-md p-2">
                    <div className="space-y-3">
                      {companiesArray.map(company => {
                        const isInternal = getCompanyInternalStatus(company.id);
                        const companyRole = getCompanyRole(company.id);
                        return (
                          <div 
                            key={company.id} 
                            className={`flex flex-col p-3 rounded ${primaryCompany?.id === company.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                {primaryCompany?.id === company.id && <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />}
                                <span className="font-medium">{company.name}</span>
                                {primaryCompany?.id === company.id && (
                                  <Badge variant="outline" className="text-xs bg-blue-100">Primary</Badge>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                {primaryCompany?.id !== company.id && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 text-xs"
                                    onClick={() => handleSetPrimary(company)}
                                  >
                                    Set as Primary
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-500"
                                  onClick={() => removeCompany(company.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Role selection for this company */}
                            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ShieldCheck className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">Role:</span>
                              </div>
                              <Select
                                value={companyRole}
                                onValueChange={(value) => handleCompanyRoleChange(company.id, value as UserRole)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Internal/External Status Toggle for This Company */}
                            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {isInternal ? (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                  <UserX className="h-4 w-4 text-amber-600" />
                                )}
                                <span className="text-sm">
                                  {isInternal ? "Internal User" : "External User"}
                                </span>
                              </div>
                              <Switch 
                                checked={isInternal}
                                onCheckedChange={(checked) => handleToggleCompanyInternalStatus(company.id, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : loading ? (
                  <div className="h-[100px] border rounded-md p-4 flex items-center justify-center bg-gray-50">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-gray-500">Loading company data...</span>
                  </div>
                ) : (
                  <div className="h-[100px] border rounded-md p-4 flex flex-col items-center justify-center bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">No companies in your portfolio.</p>
                    <p className="text-xs text-gray-400">Select a company from the dropdown above and click "Add".</p>
                  </div>
                )}
                
                {companiesArray.length > 0 && (
                  <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Settings className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-sm font-medium">Multi-Company Mode: {hasMultipleCompanies() ? 'Enabled' : 'Disabled'}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {hasMultipleCompanies()
                        ? "Client Compass dashboard will be accessible with multiple companies."
                        : "Client Compass dashboard will be hidden with only one company."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="user" className="pt-4">
            {/* Role Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-select" className="text-lg font-semibold">Default User Role</Label>
                <Select
                  value={selectedRole || ''}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                >
                  <SelectTrigger id="role-select" className="w-full">
                    <SelectValue placeholder="Select test role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-sm text-gray-500 italic">Default role: <span className="font-medium">{getRoleDisplayName(selectedRole)}</span></p>
                )}
                <p className="text-sm text-amber-600">
                  This is the default role used when no company-specific role is set. Company-specific roles take precedence.
                </p>
              </div>

              {/* Global Internal/External User Type (Legacy) */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  Global User Type
                  <Badge variant="outline" className="bg-gray-100 text-xs">Legacy</Badge>
                </Label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className={!isInternalUser ? "font-medium" : "text-gray-500"}>External User</span>
                  <Switch 
                    id="user-type-toggle" 
                    checked={isInternalUser} 
                    onCheckedChange={setIsInternalUser} 
                  />
                  <span className={isInternalUser ? "font-medium" : "text-gray-500"}>Internal User</span>
                </div>
                <p className="text-xs text-amber-600 italic flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  This setting applies globally and is kept for backward compatibility. 
                  Use the per-company toggles in the Companies tab instead.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t flex flex-col items-start pt-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>Current Testing Configuration:</strong>
        </p>
        <div className="space-y-1 text-xs text-gray-500 w-full">
          <div className="flex justify-between">
            <span>Default Role:</span>
            <span className="font-semibold">{getRoleDisplayName(selectedRole)}</span>
          </div>
          <div className="flex justify-between">
            <span>Companies:</span>
            <span className="font-semibold">{companiesArray.length > 0 ? `${companiesArray.length} selected` : 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span>Primary Company:</span>
            <span className="font-semibold">{primaryCompany?.name || 'Not set'}</span>
          </div>
          {primaryCompany && (
            <>
              <div className="flex justify-between">
                <span>Primary Company Role:</span>
                <span className="font-semibold">
                  {getRoleDisplayName(getCompanyRole(primaryCompany.id))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Primary Company Status:</span>
                <span className="font-semibold">
                  {getCompanyInternalStatus(primaryCompany.id) ? 'Internal' : 'External'}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>Global User Type:</span>
            <span className="font-semibold">{isInternalUser ? 'Internal' : 'External'}</span>
          </div>
          <div className="flex justify-between">
            <span>Auth Status:</span>
            <span className="font-semibold">DevMode (Mock User)</span>
          </div>
          <div className="flex justify-between">
            <span>Data Source:</span>
            <span className="font-semibold">Supabase</span>
          </div>
          <div className="flex justify-between">
            <span>Available Companies:</span>
            <span className="font-semibold">{availableCompanies?.length || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
