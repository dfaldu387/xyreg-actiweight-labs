
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useInvitations } from "@/hooks/useInvitations";
import { usePendingUsers } from "@/hooks/usePendingUsers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MultiDepartmentSelector, type DepartmentAssignment, type MultiDepartmentSelectorRef } from "./MultiDepartmentSelector";
import { DeviceAccessSelector } from "./DeviceAccessSelector";
import { DocumentPermissionSelector } from "./DocumentPermissionSelector";
import { useTranslation } from "@/hooks/useTranslation";
import { ALL_COMPANY_MODULES, MODULE_DISPLAY_NAMES } from "@/types/userCompanyModuleAccess";

interface AddCompanyUserDialogProps {
  onUserInvited?: () => void;
  onUserAdded?: () => void;
  onAddUser?: () => void; // Legacy support
  companyId: string;
}

export function AddCompanyUserDialog({ onUserInvited, onUserAdded, onAddUser, companyId }: AddCompanyUserDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    access_level: "editor" as "viewer" | "editor" | "admin" | "consultant",
    user_type: "internal" as "internal" | "external",
    functional_area: "none" as string,
    internal_role: "none" as string,
    external_role: "consultant" as string
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("invitation");
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<DepartmentAssignment[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [hasModuleRestriction, setHasModuleRestriction] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [tempSelectedModuleIds, setTempSelectedModuleIds] = useState<string[]>([]);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const deptSelectorRef = useRef<MultiDepartmentSelectorRef>(null);

  const { sendInvitation } = useInvitations(companyId);
  const { createPendingUser } = usePendingUsers(companyId);

  // Fetch company departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('department_structure')
          .eq('id', companyId)
          .single();

        if (error) throw error;

        const departmentStructure = companyData?.department_structure;
        if (departmentStructure && Array.isArray(departmentStructure)) {
          // Filter to only enabled departments
          const enabledDepts = departmentStructure
            .filter((dept: any) => dept.isEnabled !== false)
            .map((dept: any) => dept.name)
            .filter(Boolean);
          setDepartments(enabledDepts);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, [companyId]);

  const saveInvitationDeviceAccess = async (invitationId: string, productIds: string[]) => {
    // Always clear old records first (handles re-invite case)
    await supabase
      .from('invitation_device_access')
      .delete()
      .eq('invitation_id', invitationId);

    if (productIds.length === 0) return;

    const { error } = await supabase
      .from('invitation_device_access')
      .insert({
        invitation_id: invitationId,
        company_id: companyId,
        product_ids: productIds,
      });

    if (error) {
      console.error('Error saving invitation device access:', error);
      toast.error('Failed to save device access');
    }
  };

  const saveInvitationDocumentAccess = async (invitationId: string, documentIds: string[]) => {
    // Always clear old records first (handles re-invite case)
    await supabase
      .from('invitation_document_access')
      .delete()
      .eq('invitation_id', invitationId);

    if (documentIds.length === 0) return;

    const { error } = await supabase
      .from('invitation_document_access')
      .insert({
        invitation_id: invitationId,
        company_id: companyId,
        document_ids: documentIds,
      });

    if (error) {
      console.error('Error saving invitation document access:', error);
      toast.error('Failed to save document permissions');
    }
  };

  const saveInvitationModuleAccess = async (invitationId: string, moduleIds: string[]) => {
    // Always clear old records first (handles re-invite case)
    await (supabase as any)
      .from('invitation_module_access')
      .delete()
      .eq('invitation_id', invitationId);

    if (moduleIds.length === 0) return;

    const { error } = await (supabase as any)
      .from('invitation_module_access')
      .insert({
        invitation_id: invitationId,
        company_id: companyId,
        module_ids: moduleIds,
      });

    if (error) {
      console.error('Error saving invitation module access:', error);
      toast.error('Failed to save company access');
    }
  };

  const saveInvitationDepartmentAssignments = async (invitationId: string, assignments: DepartmentAssignment[]) => {
    // Always clear old assignments first (handles re-invite case)
    await supabase
      .from('invitation_department_assignments')
      .delete()
      .eq('invitation_id', invitationId);

    if (assignments.length === 0) return;

    const rows = assignments.map(a => ({
      invitation_id: invitationId,
      company_id: companyId,
      department_name: a.department_name,
      fte_allocation: a.fte_allocation,
      role: a.role && a.role.length > 0 ? a.role : null,
    }));

    const { error } = await supabase
      .from('invitation_department_assignments')
      .insert(rows);

    if (error) {
      console.error('Error saving invitation department assignments:', error);
      toast.error('Failed to save department assignments');
    }
  };

  const handleInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error(lang('companySettings.addUser.fillEmailAddress'));
      return;
    }

    // Commit any pending department assignment before submit
    let finalAssignments = departmentAssignments;
    if (formData.user_type === "internal" && deptSelectorRef.current) {
      const committed = deptSelectorRef.current.commitPendingAssignment();
      if (committed) {
        finalAssignments = committed;
      }
    }

    setIsSubmitting(true);

    try {
      const isInternal = formData.user_type === "internal";
      const hasMultiDeptAssignments = isInternal && finalAssignments.length > 0;

      const result = await sendInvitation({
        email: formData.email.trim(),
        access_level: formData.access_level,
        is_internal: isInternal,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // When using multi-department, set functional_area and department_role to null
        functional_area: hasMultiDeptAssignments ? null : (isInternal && formData.functional_area && formData.functional_area !== "none" ? formData.functional_area : null),
        external_role: !isInternal ? formData.external_role : null,
        department_role: hasMultiDeptAssignments ? null : (isInternal && formData.internal_role && formData.internal_role !== "none" ? [formData.internal_role] : null),
      });

      if (result.success && result.invitationId) {
        // Save department assignments to the new table
        if (hasMultiDeptAssignments) {
          await saveInvitationDepartmentAssignments(result.invitationId, finalAssignments);
        }

        // Save device access selections
        if (selectedProductIds.length > 0) {
          await saveInvitationDeviceAccess(result.invitationId, selectedProductIds);
        }

        // Save document permission selections
        if (selectedDocumentIds.length > 0) {
          await saveInvitationDocumentAccess(result.invitationId, selectedDocumentIds);
        }

        // Save module access selections
        if (hasModuleRestriction && selectedModuleIds.length > 0) {
          await saveInvitationModuleAccess(result.invitationId, selectedModuleIds);
        }

        toast.success(`Invitation sent to ${formData.email}`);
        onUserInvited?.();
        onAddUser?.(); // Legacy support

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          name: "",
          email: "",
          access_level: "editor",
          user_type: "internal",
          functional_area: "none",
          internal_role: "none",
          external_role: "consultant"
        });
        setDepartmentAssignments([]);
        setSelectedProductIds([]);
        setSelectedDocumentIds([]);
        setHasModuleRestriction(false);
        setSelectedModuleIds([]);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(lang('companySettings.addUser.failedToSendInvitation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePendingUserCreation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error(lang('companySettings.addUser.fillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createPendingUser({
        email: formData.email.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        access_level: formData.access_level,
        is_internal: formData.user_type === "internal",
        functional_area: formData.user_type === "internal" && formData.functional_area && formData.functional_area !== "none" ? formData.functional_area as any : undefined,
        external_role: formData.user_type === "external" ? formData.external_role as any : undefined
      });

      if (success) {
        toast.success(`Pending user ${formData.name} created successfully`);
        onUserAdded?.();
        onAddUser?.(); // Legacy support

        // Reset form
        setFormData({
          name: "",
          email: "",
          access_level: "editor",
          user_type: "internal",
          functional_area: "none",
          internal_role: "none",
          external_role: "consultant",
          firstName: "",
          lastName: "",
        });
        setDepartmentAssignments([]);
        setSelectedProductIds([]);
        setSelectedDocumentIds([]);
        setHasModuleRestriction(false);
        setSelectedModuleIds([]);
      }
    } catch (error) {
      console.error('Error creating pending user:', error);
      toast.error(lang('companySettings.addUser.failedToCreatePendingUser'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{lang('companySettings.addUser.title')}</DialogTitle>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitation">{lang('companySettings.addUser.sendInvitation')}</TabsTrigger>
          <TabsTrigger value="pending">{lang('companySettings.addUser.createPendingUser')}</TabsTrigger>
        </TabsList>

        <TabsContent value="invitation" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lang('companySettings.addUser.invitationDescription')}
          </p>

          <form onSubmit={handleInvitation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invitation-firstName">{lang('companySettings.addUser.firstName')}</Label>
                <Input
                  id="invitation-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={lang('companySettings.addUser.firstNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitation-lastName">{lang('companySettings.addUser.lastName')}</Label>
                <Input
                  id="invitation-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={lang('companySettings.addUser.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitation-email">{lang('companySettings.addUser.emailAddress')} *</Label>
              <Input
                id="invitation-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={lang('companySettings.addUser.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitation-access_level">{lang('companySettings.addUser.accessLevel')}</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value: "viewer" | "editor" | "admin" | "consultant") =>
                  setFormData(prev => ({ ...prev, access_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{lang('companySettings.addUser.accessLevels.viewer')}</SelectItem>
                  <SelectItem value="editor">{lang('companySettings.addUser.accessLevels.editor')}</SelectItem>
                  <SelectItem value="admin">{lang('companySettings.addUser.accessLevels.admin')}</SelectItem>
                  <SelectItem value="consultant">{lang('companySettings.addUser.accessLevels.consultant')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{lang('companySettings.addUser.userType')}</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value: "internal" | "external") =>
                  setFormData(prev => ({ ...prev, user_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{lang('companySettings.addUser.internalUser')}</SelectItem>
                  <SelectItem value="external">{lang('companySettings.addUser.externalUser')}</SelectItem>
                </SelectContent>
                  </Select>
                </div>

                {/* For internal users: MultiDepartmentSelector */}
                {formData.user_type === 'internal' && (
                  <MultiDepartmentSelector
                    ref={deptSelectorRef}
                    companyId={companyId}
                    userId=""
                    currentAssignments={departmentAssignments}
                    onChange={setDepartmentAssignments}
                  />
                )}

                {/* External role selector */}
                {formData.user_type === 'external' && (
                   <div>
                     <Label htmlFor="external_role">{lang('companySettings.addUser.role')}</Label>
                     <Select
                       value={formData.external_role}
                       onValueChange={(value) => setFormData(prev => ({ ...prev, external_role: value }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={lang('companySettings.addUser.selectRole')} />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="consultant">{lang('companySettings.addUser.roles.consultant')}</SelectItem>
                         <SelectItem value="auditor">{lang('companySettings.addUser.roles.auditor')}</SelectItem>
                         <SelectItem value="contract_manufacturer">{lang('companySettings.addUser.roles.contractor')}</SelectItem>
                         <SelectItem value="distributor">{lang('companySettings.addUser.roles.distributor')}</SelectItem>
                         <SelectItem value="key_opinion_leader">{lang('companySettings.addUser.roles.kol')}</SelectItem>
                         <SelectItem value="other_external">{lang('companySettings.addUser.roles.other')}</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 )}

                {/* Permission & Access Section */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Permission & Access</h4>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-3">
                    <Label>Company Modules</Label>
                    <Switch
                      checked={hasModuleRestriction}
                      onCheckedChange={(checked) => {
                        setHasModuleRestriction(checked);
                        if (checked && selectedModuleIds.length === 0) {
                          setTempSelectedModuleIds([]);
                          setIsModuleDialogOpen(true);
                        }
                        if (!checked) {
                          setSelectedModuleIds([]);
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {hasModuleRestriction ? `${selectedModuleIds.length} selected` : 'All Modules'}
                    </span>

                    <DeviceAccessSelector
                      companyId={companyId}
                      selectedProductIds={selectedProductIds}
                      onChange={(ids) => { setSelectedProductIds(ids); setSelectedDocumentIds([]); }}
                      label="Devices"
                      inline
                    />

                    <DocumentPermissionSelector
                      companyId={companyId}
                      selectedProductIds={selectedProductIds}
                      selectedDocumentIds={selectedDocumentIds}
                      onChange={setSelectedDocumentIds}
                      label="Documents"
                      inline
                    />
                  </div>
                </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? lang('companySettings.addUser.sendingInvitation') : lang('companySettings.addUser.sendInvitation')}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lang('companySettings.addUser.pendingDescription')}
          </p>

          <form onSubmit={handlePendingUserCreation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pending-firstName">{lang('companySettings.addUser.firstName')} *</Label>
                <Input
                  id="pending-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={lang('companySettings.addUser.firstNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pending-lastName">{lang('companySettings.addUser.lastName')} *</Label>
                <Input
                  id="pending-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={lang('companySettings.addUser.lastNamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitation-email">{lang('companySettings.addUser.emailAddress')} *</Label>
              <Input
                id="pending-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={lang('companySettings.addUser.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pending-access_level">{lang('companySettings.addUser.accessLevel')}</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value: "viewer" | "editor" | "admin" | "consultant") =>
                  setFormData(prev => ({ ...prev, access_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{lang('companySettings.addUser.accessLevels.viewer')}</SelectItem>
                  <SelectItem value="editor">{lang('companySettings.addUser.accessLevels.editor')}</SelectItem>
                  <SelectItem value="admin">{lang('companySettings.addUser.accessLevels.admin')}</SelectItem>
                  <SelectItem value="consultant">{lang('companySettings.addUser.accessLevels.consultant')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{lang('companySettings.addUser.userType')}</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value: "internal" | "external") =>
                  setFormData(prev => ({ ...prev, user_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{lang('companySettings.addUser.internalUser')}</SelectItem>
                  <SelectItem value="external">{lang('companySettings.addUser.externalUser')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.user_type === "internal" && (
              <MultiDepartmentSelector
                ref={deptSelectorRef}
                companyId={companyId}
                userId=""
                currentAssignments={departmentAssignments}
                onChange={setDepartmentAssignments}
              />
            )}

            {formData.user_type === "external" && (
              <div className="space-y-2">
                <Label>{lang('companySettings.addUser.role')}</Label>
                <Select
                  value={formData.external_role}
                  onValueChange={(value: string) =>
                    setFormData(prev => ({ ...prev, external_role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultant">{lang('companySettings.addUser.roles.consultant')}</SelectItem>
                    <SelectItem value="auditor">{lang('companySettings.addUser.roles.auditor')}</SelectItem>
                    <SelectItem value="contract_manufacturer">{lang('companySettings.addUser.roles.contractManufacturer')}</SelectItem>
                    <SelectItem value="distributor">{lang('companySettings.addUser.roles.distributor')}</SelectItem>
                    <SelectItem value="key_opinion_leader">{lang('companySettings.addUser.roles.kol')}</SelectItem>
                    <SelectItem value="other_external">{lang('companySettings.addUser.roles.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Permission & Access Section */}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Permission & Access</h4>
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-3">
                <Label>Company Modules</Label>
                <Switch
                  checked={hasModuleRestriction}
                  onCheckedChange={(checked) => {
                    setHasModuleRestriction(checked);
                    if (checked && selectedModuleIds.length === 0) {
                      setTempSelectedModuleIds([]);
                      setIsModuleDialogOpen(true);
                    }
                    if (!checked) {
                      setSelectedModuleIds([]);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {hasModuleRestriction ? `${selectedModuleIds.length} selected` : 'All Modules'}
                </span>

                <DeviceAccessSelector
                  companyId={companyId}
                  selectedProductIds={selectedProductIds}
                  onChange={setSelectedProductIds}
                  label="Devices"
                  inline
                />

                <DocumentPermissionSelector
                  companyId={companyId}
                  selectedProductIds={selectedProductIds}
                  selectedDocumentIds={selectedDocumentIds}
                  onChange={setSelectedDocumentIds}
                  label="Documents"
                  inline
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? lang('companySettings.addUser.creatingPendingUser') : lang('companySettings.addUser.createPendingUser')}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Module Selection Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Dashboard Modules</DialogTitle>
            <DialogDescription>
              Choose which dashboard modules this user can access. When no modules are selected, user can access all modules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {tempSelectedModuleIds.length} of {ALL_COMPANY_MODULES.length} modules selected
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (tempSelectedModuleIds.length === ALL_COMPANY_MODULES.length) {
                    setTempSelectedModuleIds([]);
                  } else {
                    setTempSelectedModuleIds([...ALL_COMPANY_MODULES]);
                  }
                }}
              >
                {tempSelectedModuleIds.length === ALL_COMPANY_MODULES.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <Separator />

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {ALL_COMPANY_MODULES.map((moduleId) => (
                  <div
                    key={moduleId}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`invite-module-${moduleId}`}
                      checked={tempSelectedModuleIds.includes(moduleId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempSelectedModuleIds(prev => [...prev, moduleId]);
                        } else {
                          setTempSelectedModuleIds(prev => prev.filter(id => id !== moduleId));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`invite-module-${moduleId}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {MODULE_DISPLAY_NAMES[moduleId] || moduleId}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTempSelectedModuleIds([...selectedModuleIds]);
                  if (selectedModuleIds.length === 0) {
                    setHasModuleRestriction(false);
                  }
                  setIsModuleDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedModuleIds([...tempSelectedModuleIds]);
                  if (tempSelectedModuleIds.length === 0) {
                    setHasModuleRestriction(false);
                  }
                  setIsModuleDialogOpen(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DialogContent>
  );
}
