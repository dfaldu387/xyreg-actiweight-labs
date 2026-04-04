
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HybridUserManagement } from "@/components/permissions/HybridUserManagement";
import { RoleManager } from "./RoleManager";
import { DepartmentStructureView } from "./DepartmentStructureView";
import { DepartmentRoleConfiguration } from "./DepartmentRoleConfiguration";
import { Users, Shield, Building, Key, Settings } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface UserManagementProps {
  companyId: string;
}

export function UserManagement({ companyId }: UserManagementProps) {
  const { lang } = useTranslation();
  const [showDeptConfig, setShowDeptConfig] = useState(false);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lang('companySettings.users.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('companySettings.users.description')}
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {lang('companySettings.users.tabs.usersAccess')}
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {lang('companySettings.users.tabs.departmentStructure')}
          </TabsTrigger>
          {/* <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {lang('companySettings.users.tabs.permissionLevels')}
          </TabsTrigger> */}
        </TabsList>
        
        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showDeptConfig} onOpenChange={setShowDeptConfig}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {lang('settings.companyProfile.departmentsRoles.title')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {lang('settings.companyProfile.departmentsRoles.title')}
                  </DialogTitle>
                </DialogHeader>
                <DepartmentRoleConfiguration companyId={companyId} />
              </DialogContent>
            </Dialog>
          </div>
          <DepartmentStructureView companyId={companyId} />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <HybridUserManagement companyId={companyId} />
        </TabsContent>

        {/* <TabsContent value="roles" className="space-y-6">
          <DynamicRoleAccessControl companyId={companyId} />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
