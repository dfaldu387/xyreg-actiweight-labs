import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings } from 'lucide-react';
import { CompanyDataUpdateService } from '@/services/companyDataUpdateService';
import { toast } from 'sonner';

interface DepartmentRoleSelectorProps {
  companyId: string;
  templateRole: string;
  selectedRole?: string;
  onRoleSelected: (role: string) => void;
  className?: string;
}

export function DepartmentRoleSelector({
  companyId,
  templateRole,
  selectedRole,
  onRoleSelected,
  className = ""
}: DepartmentRoleSelectorProps) {
  const [companyRoles, setCompanyRoles] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing company roles
  useEffect(() => {
    const loadCompanyRoles = async () => {
      try {
        const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
        if (orgData.departments && Array.isArray(orgData.departments)) {
          const roles = orgData.departments.flatMap((dept: any) => 
            (dept.roles || []) as string[]
          );
          setCompanyRoles([...new Set(roles)] as string[]); // Remove duplicates
        }
      } catch (error) {
        console.error('Error loading company roles:', error);
      }
    };

    if (companyId) {
      loadCompanyRoles();
    }
  }, [companyId]);

  const addNewRole = async () => {
    if (!newRole.trim()) return;

    setIsLoading(true);
    try {
      // Get current organizational data
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      // Add role to general departments if no specific department structure exists
      let departments = orgData.departments || [];
      if (departments.length === 0) {
        departments = [
          { name: 'Quality Assurance', roles: [] },
          { name: 'Research & Development', roles: [] },
          { name: 'Manufacturing', roles: [] },
          { name: 'Regulatory Affairs', roles: [] }
        ];
      }

      // Add role to Quality Assurance department by default
      const qaIndex = departments.findIndex(dept => dept.name.toLowerCase().includes('quality'));
      if (qaIndex >= 0) {
        if (!departments[qaIndex].roles) departments[qaIndex].roles = [];
        departments[qaIndex].roles.push(newRole.trim());
      } else {
        // If no QA department, add to first department
        if (departments[0] && !departments[0].roles) departments[0].roles = [];
        departments[0]?.roles?.push(newRole.trim());
      }

      // Save updated departments
      await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'department_structure',
        data: departments
      });

      // Update local state
      setCompanyRoles(prev => [...prev, newRole.trim()]);
      onRoleSelected(newRole.trim());
      
      setNewRole('');
      setIsAddDialogOpen(false);
      toast.success('New role added successfully');
    } catch (error) {
      console.error('Error adding new role:', error);
      toast.error('Failed to add new role');
    } finally {
      setIsLoading(false);
    }
  };

  const openCompanySettings = () => {
    const currentUrl = new URL(window.location.href);
    const companyName = currentUrl.pathname.split('/')[3];
    window.open(`/app/company/${companyName}/settings?tab=general`, '_blank');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Clear Template Role Display */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-primary">
            Template Suggests: "{templateRole}"
          </Label>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onRoleSelected(templateRole)}
            className="h-7 text-xs"
          >
            ✓ Keep This Role
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          You can keep this role or choose/add a different one from your company structure
        </p>
      </div>

      {/* Alternative Options */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Or Choose Different Role:</Label>
        
        <div className="flex gap-2">
          <Select value={selectedRole === templateRole ? "" : selectedRole} onValueChange={onRoleSelected}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select from company roles..." />
            </SelectTrigger>
            <SelectContent>
              {companyRoles.length > 0 ? (
                companyRoles.map((role, index) => (
                  <SelectItem key={index} value={role}>
                    <div className="flex items-center gap-2">
                      <span>{role}</span>
                      <span className="text-xs text-muted-foreground">(Company)</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  No company roles defined yet
                </div>
              )}
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Company Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role Name</Label>
                  <Input
                    id="new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Enter role name (e.g., Quality Manager)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addNewRole();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    This role will be saved to your Company Settings for future use
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={openCompanySettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage in Settings
                  </Button>
                  <Button onClick={addNewRole} disabled={isLoading || !newRole.trim()}>
                    {isLoading ? 'Adding...' : 'Add & Use Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selection Status */}
      {selectedRole && (
        <div className={`text-xs p-2 rounded ${
          selectedRole === templateRole 
            ? 'bg-primary/10 text-primary' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {selectedRole === templateRole ? (
            <>✓ Using template role: <span className="font-medium">{selectedRole}</span></>
          ) : (
            <>✓ Using company role: <span className="font-medium">{selectedRole}</span> (saved to Company Settings)</>
          )}
        </div>
      )}
    </div>
  );
}