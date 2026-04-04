import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Zap } from 'lucide-react';
import { TemplateRoleReplacementService } from '@/services/TemplateRoleReplacementService';
import { RoleMappingDialog } from './RoleMappingDialog';
import { toast } from 'sonner';

interface RoleMapping {
  templateRole: string;
  companyRole: string;
  department: string;
}

interface MindmapDepartmentRoleManagerProps {
  companyId: string;
  templateContent: string;
  onRolesUpdated: (mappings: RoleMapping[]) => void;
  className?: string;
}

export function MindmapDepartmentRoleManager({
  companyId,
  templateContent,
  onRolesUpdated,
  className = ""
}: MindmapDepartmentRoleManagerProps) {
  const [isRoleMappingOpen, setIsRoleMappingOpen] = useState(false);
  const [templateRoles, setTemplateRoles] = useState<string[]>([]);

  React.useEffect(() => {
    if (templateContent) {
      const roles = TemplateRoleReplacementService.extractTemplateRoles(templateContent);
      setTemplateRoles(roles.map(r => r.role));
    }
  }, [templateContent]);

  const handleMappingComplete = (mappings: RoleMapping[]) => {
    onRolesUpdated(mappings);
    toast.success(`${mappings.length} role mappings completed`);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-primary" />
            Smart Role Mapping
            <Badge variant="secondary" className="ml-auto">
              {templateRoles.length} template roles
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatically map document roles to your company structure
          </p>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="w-full h-16 flex items-center gap-3"
            onClick={() => setIsRoleMappingOpen(true)}
            disabled={templateRoles.length === 0}
          >
            <Zap className="w-6 h-6" />
            <div className="text-left">
              <div className="font-medium">Fill Roles</div>
              <div className="text-sm opacity-90">
                Map {templateRoles.length} template roles to company structure
              </div>
            </div>
          </Button>
          
          {templateRoles.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              No template roles detected in document
            </p>
          )}
        </CardContent>
      </Card>

      <RoleMappingDialog
        isOpen={isRoleMappingOpen}
        onClose={() => setIsRoleMappingOpen(false)}
        companyId={companyId}
        templateContent={templateContent}
        onMappingComplete={handleMappingComplete}
      />
    </>
  );
}