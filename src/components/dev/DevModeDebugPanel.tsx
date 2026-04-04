import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDevMode } from '@/context/DevModeContext';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { 
  Bug, 
  Database, 
  User, 
  Building, 
  Shield,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export function DevModeDebugPanel() {
  const { 
    isDevMode, 
    selectedCompanies, 
    primaryCompany, 
    selectedRole, 
    isInternalUser,
    companyRoles,
    companyInternalStatuses
  } = useDevMode();
  
  const { user, session } = useAuth();
  const { activeCompanyId, companyRoles: authCompanyRoles } = useCompanyRole();

  if (!isDevMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Information
          </CardTitle>
          <CardDescription className="text-xs">
            Enable DevMode to see debug information
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasActiveCompany = !!activeCompanyId;
  const hasSelectedCompanies = selectedCompanies.length > 0;
  const hasPrimaryCompany = !!primaryCompany;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            DevMode Debug Information
          </CardTitle>
          <CardDescription className="text-xs">
            Current state and effective permissions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">DevMode Active:</span>
            <Badge variant={isDevMode ? "default" : "secondary"} className="text-xs">
              {isDevMode ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">User Authenticated:</span>
            <Badge variant={user ? "default" : "destructive"} className="text-xs">
              {user ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Session Active:</span>
            <Badge variant={session ? "default" : "destructive"} className="text-xs">
              {session ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Company:</span>
            <Badge variant={hasActiveCompany ? "default" : "outline"} className="text-xs">
              {hasActiveCompany ? "Set" : "None"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* User Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            User Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Global Role:</span>
            <Badge variant="outline" className="text-xs">
              {selectedRole}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">User Type:</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${isInternalUser ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
            >
              {isInternalUser ? 'Internal' : 'External'}
            </Badge>
          </div>
          {user && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">User ID:</span>
              <span className="text-xs font-mono truncate max-w-24">{user.id}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Selected Companies:</span>
            <Badge variant="outline" className="text-xs">
              {selectedCompanies.length}
            </Badge>
          </div>
          
          {selectedCompanies.length > 0 ? (
            <div className="space-y-2">
              {selectedCompanies.map((company, index) => {
                const role = companyRoles[company.id] || selectedRole;
                const isInternal = companyInternalStatuses[company.id] ?? isInternalUser;
                const isPrimary = primaryCompany?.id === company.id;
                const isActive = activeCompanyId === company.id;
                
                return (
                  <div key={company.id} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{company.name}</span>
                      <div className="flex gap-1">
                        {isPrimary && <Badge variant="default" className="text-xs px-1">Primary</Badge>}
                        {isActive && <Badge variant="secondary" className="text-xs px-1">Active</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline" className="text-xs">{role}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isInternal ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                      >
                        {isInternal ? 'Internal' : 'External'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-xs">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              <span className="text-yellow-800">No companies selected</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Visibility Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Data Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Should Load Companies:</span>
            <div className="flex items-center gap-1">
              {hasSelectedCompanies ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              )}
              <Badge variant={hasSelectedCompanies ? "default" : "destructive"} className="text-xs">
                {hasSelectedCompanies ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Should Load Products:</span>
            <div className="flex items-center gap-1">
              {hasActiveCompany || hasPrimaryCompany ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              )}
              <Badge variant={hasActiveCompany || hasPrimaryCompany ? "default" : "destructive"} className="text-xs">
                {hasActiveCompany || hasPrimaryCompany ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Dashboard Loading State:</span>
            <Badge variant={hasSelectedCompanies ? "default" : "destructive"} className="text-xs">
              {hasSelectedCompanies ? "Should Complete" : "May Hang"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Auth Company Roles */}
      {authCompanyRoles && Object.keys(authCompanyRoles).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Auth System Company Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(authCompanyRoles).map(([companyId, role]) => (
                <div key={companyId} className="flex items-center justify-between text-xs">
                  <span className="font-mono truncate max-w-32">{companyId}</span>
                  <Badge variant="outline" className="text-xs">{role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}