import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Shield, User, Eye, Edit3, Settings, FileText, BarChart3, Users, Building2, ChevronDown, ChevronRight } from 'lucide-react';

// Static role access data
const roleAccessData = {
  admin: {
    name: 'Admin',
    icon: Shield,
    color: 'bg-red-100 text-red-800',
    permissions: {
      'Product Edit': true,
      'Product Update': true,
      'Product Delete': true,
      'Product Create': true,
      'Compliance Documents': true,
      'Compliance Audit': true,
      'Compliance Activities': true,
      'Compliance Gap Analysis': true,
      'Audit Management': true,
      'User Management': true,
      'Company Settings': true,
      'Document Management': true,
      'Report Generation': true,
      'Review Management': true,
      'Company Overview': true,
    }
  },
  editor: {
    name: 'Editor',
    icon: Edit3,
    color: 'bg-blue-100 text-blue-800',
    permissions: {
      'Product Edit': true,
      'Product Update': true,
      'Product Delete': false,
      'Product Create': true,
      'Compliance Documents': true,
      'Compliance Audit': true,
      'Compliance Activities': true,
      'Compliance Gap Analysis': true,
      'Audit Management': true,
      'User Management': false,
      'Company Settings': false,
      'Document Management': true,
      'Report Generation': true,
      'Review Management': true,
      'Company Overview': true,
    }
  },
  reviewer: {
    name: 'Reviewer',
    icon: FileText,
    color: 'bg-purple-100 text-purple-800',
    permissions: {
      'Product Edit': false,
      'Product Update': false,
      'Product Delete': false,
      'Product Create': false,
      'Compliance Documents': true,
      'Compliance Audit': true,
      'Compliance Activities': false,
      'Compliance Gap Analysis': true,
      'Audit Management': false,
      'User Management': false,
      'Company Settings': false,
      'Document Management': false,
      'Report Generation': true,
      'Review Management': true,
      'Company Overview': true,
    }
  },
  analyst: {
    name: 'Analyst',
    icon: BarChart3,
    color: 'bg-orange-100 text-orange-800',
    permissions: {
      'Product Edit': false,
      'Product Update': false,
      'Product Delete': false,
      'Product Create': false,
      'Compliance Documents': true,
      'Compliance Audit': false,
      'Compliance Activities': false,
      'Compliance Gap Analysis': true,
      'Audit Management': false,
      'User Management': false,
      'Company Settings': false,
      'Document Management': false,
      'Report Generation': true,
      'Review Management': false,
      'Company Overview': true,
    }
  },
  // super_admin: {
  //   name: 'Super Admin',
  //   icon: Settings,
  //   color: 'bg-gray-100 text-gray-800',
  //   permissions: {
  //     'Product Edit': true,
  //     'Product Update': true,
  //     'Product Delete': true,
  //     'Product Create': true,
  //     'Compliance Documents': true,
  //     'Compliance Audit': true,
  //     'Compliance Activities': true,
  //     'Compliance Gap Analysis': true,
  //     'Audit Management': true,
  //     'User Management': true,
  //     'Company Settings': true,
  //     'Document Management': true,
  //     'Report Generation': true,
  //     'Review Management': true,
  //     'Company Overview': true,
  //   }
  // }
};

const functionalityIcons = {
  'Product Edit': Edit3,
  'Product Update': Edit3,
  'Product Delete': XCircle,
  'Product Create': Edit3,
  'Compliance Documents': FileText,
  'Compliance Audit': Shield,
  'Compliance Activities': Users,
  'Compliance Gap Analysis': BarChart3,
  'Audit Management': FileText,
  'User Management': Users,
  'Company Settings': Settings,
  'Document Management': FileText,
  'Report Generation': BarChart3,
  'Review Management': FileText,
  'Company Overview': Building2,
};

export default function RoleAccessControlPage() {
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'product-management': false,
    'compliance-management': false,
    'system-management': false,
    'reporting-management': false,
  });
  
  const roles = Object.keys(roleAccessData);
  
  // Group functionalities into logical sections
  const functionalityGroups = {
    'product-management': {
      title: 'Product Management',
      icon: Edit3,
      color: 'bg-green-50 border-green-200',
      functionalities: ['Product Edit', 'Product Update', 'Product Delete', 'Product Create']
    },
    'compliance-management': {
      title: 'Compliance Management',
      icon: Shield,
      color: 'bg-blue-50 border-blue-200',
      functionalities: ['Compliance Documents', 'Compliance Audit', 'Compliance Activities', 'Compliance Gap Analysis']
    },
    'system-management': {
      title: 'System Management',
      icon: Settings,
      color: 'bg-purple-50 border-purple-200',
      functionalities: ['Audit Management', 'User Management', 'Company Settings', 'Document Management']
    },
    'reporting-management': {
      title: 'Reporting & Overview',
      icon: BarChart3,
      color: 'bg-orange-50 border-orange-200',
      functionalities: ['Report Generation', 'Review Management', 'Company Overview']
    }
  };
  
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
  const toggleAllSections = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    Object.keys(functionalityGroups).forEach(key => {
      newState[key] = collapse;
    });
    setCollapsedSections(newState);
  };
  
  const currentRoleData = roleAccessData[selectedRole as keyof typeof roleAccessData];
  const RoleIcon = currentRoleData.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Access Control</h1>
          <p className="text-muted-foreground">
            Manage and view role-based permissions across the platform
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Shield className="w-4 h-4 mr-2" />
          Access Management
        </Badge>
      </div>

      {/* Role Selection Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Role to View Permissions
          </CardTitle>
          <CardDescription>
            Choose a role to see its specific access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto p-1">
              {roles.map((role) => {
                const roleData = roleAccessData[role as keyof typeof roleAccessData];
                const Icon = roleData.icon;
                const isActive = selectedRole === role;
                return (
                  <TabsTrigger 
                    key={role} 
                    value={role} 
                    className={`flex items-center gap-2 py-3 px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 ${
                      isActive ? 'border-2 border-primary' : 'border-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="hidden sm:inline text-sm font-medium">{roleData.name}</span>
                    <span className="sm:hidden text-xs font-medium">{roleData.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <RoleIcon className="w-5 h-5" />
              <Badge className={currentRoleData.color}>
                {currentRoleData.name}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {Object.values(currentRoleData.permissions).filter(Boolean).length} of {Object.values(functionalityGroups).reduce((total, group) => total + group.functionalities.length, 0)} permissions allowed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {currentRoleData.name} Permissions
              </CardTitle>
              <CardDescription>
                Detailed view of what {currentRoleData.name.toLowerCase()} can and cannot access
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllSections(false)}
                className="flex items-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllSections(true)}
                className="flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Functionality</TableHead>
                  <TableHead className="text-center">Access</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(functionalityGroups).map(([sectionKey, group]) => {
                  const isCollapsed = collapsedSections[sectionKey];
                  const GroupIcon = group.icon;
                  
                  return (
                    <React.Fragment key={sectionKey}>
                      {/* Section Header */}
                      <TableRow>
                        <TableCell colSpan={4} className={`${group.color} border-b-2 cursor-pointer hover:opacity-80 transition-opacity`}>
                          <div 
                            className="flex items-center gap-2 py-3"
                            onClick={() => toggleSection(sectionKey)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                            <GroupIcon className="w-4 h-4 text-gray-700" />
                            <span className="font-semibold text-gray-800">{group.title}</span>
                            <Badge variant="outline" className="ml-auto">
                              {group.functionalities.filter(f => currentRoleData.permissions[f as keyof typeof currentRoleData.permissions]).length}/{group.functionalities.length}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Section Content */}
                      {!isCollapsed && group.functionalities.map((functionality) => {
                        const hasAccess = currentRoleData.permissions[functionality as keyof typeof currentRoleData.permissions];
                        const FunctionIcon = functionalityIcons[functionality as keyof typeof functionalityIcons];
                        
                        return (
                          <TableRow key={functionality} className="bg-muted/20">
                            <TableCell>
                              <FunctionIcon className="w-4 h-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="pl-6 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gray-300 rounded"></div>
                                {functionality}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {hasAccess ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={hasAccess ? "default" : "secondary"}
                                className={hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {hasAccess ? 'Allowed' : 'Denied'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Allowed Permissions</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(currentRoleData.permissions).filter(Boolean).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mt-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Denied Permissions</p>
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(currentRoleData.permissions).filter(p => !p).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Compliance Access</p>
                <p className="text-2xl font-bold text-blue-600">
                  {functionalityGroups['compliance-management'].functionalities.filter(f => currentRoleData.permissions[f as keyof typeof currentRoleData.permissions]).length}/{functionalityGroups['compliance-management'].functionalities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mt-2">
              <Settings className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Functions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.values(functionalityGroups).reduce((total, group) => total + group.functionalities.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks for role management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Role Permissions
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Assign Users to Role
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Permissions Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
