import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User, Building2, FileText, Shield, Clock, Settings, Users, ChevronDown, ChevronRight, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentPersonnelIntegrationService, ExistingUserOption } from '@/services/documentPersonnelIntegrationService';
import { DepartmentRoleSelector } from './DepartmentRoleSelector';

interface MissingDataPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  missingDataType: string;
  onDataSaved: (data: any) => void;
}

interface Person {
  name: string;
  role: string;
  email: string;
  department: string;
}

interface Department {
  id: string;
  name: string;
  head?: string;
  responsibilities?: string | string[];
  roles: string[];
}

export function MissingDataPromptDialog({ 
  isOpen, 
  onClose, 
  companyId,
  missingDataType,
  onDataSaved 
}: MissingDataPromptDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Personnel integration states
  const [existingUsers, setExistingUsers] = useState<ExistingUserOption[]>([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState<string>('');
  const [showNewUserForm, setShowNewUserForm] = useState(true);
  
  // Form states for different data types
  const [headOfQA, setHeadOfQA] = useState({ name: '', email: '', phone: '', department: 'Quality Assurance' });
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'qa', name: 'Quality Assurance', head: '', responsibilities: 'Document Control, Quality Management, Training', roles: ['Head of Quality Assurance', 'Quality Manager', 'Quality Engineer'] },
    { id: 'ra', name: 'Regulatory Affairs', head: '', responsibilities: 'Regulatory Submissions, Compliance', roles: ['Regulatory Manager', 'Regulatory Specialist'] },
    { id: 'rd', name: 'R&D', head: '', responsibilities: 'Product Development, Design Controls', roles: ['R&D Manager', 'Design Engineer', 'Product Manager'] }
  ]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set(['qa', 'ra', 'rd']));
  const [documentSystem, setDocumentSystem] = useState({
    prefix: 'SOP',
    numberFormat: 'XXX',
    startingNumber: '001',
    versionFormat: 'V1.0'
  });
  const [retentionPeriods, setRetentionPeriods] = useState({
    sops: '7 years',
    qualityRecords: '10 years',
    designFiles: 'Lifetime + 15 years',
    clinicalData: '25 years'
  });
  const [edmSystem, setEdmSystem] = useState({
    platform: 'SharePoint',
    validationStatus: 'Validated',
    accessControls: 'Role-based',
    backupSchedule: 'Daily',
    auditTrail: 'Enabled',
    electronicSignatures: 'Enabled',
    integrations: ''
  });
  const [approvalWorkflow, setApprovalWorkflow] = useState([
    { role: 'Document Author', action: 'Create/Revise', order: 1 },
    { role: 'Department Head', action: 'Technical Review', order: 2 },
    { role: 'Quality Manager', action: 'Quality Review', order: 3 },
    { role: 'Head of QA', action: 'Final Approval', order: 4 }
  ]);

  // Load existing users when dialog opens and data type is personnel-related
  useEffect(() => {
    if (isOpen && companyId) {
      const roleType = DocumentPersonnelIntegrationService.getRoleTypeFromMissingDataType(missingDataType);
      if (roleType) {
        loadExistingUsers(roleType);
      }
    }
  }, [isOpen, companyId, missingDataType]);

  const loadExistingUsers = async (roleType: 'quality_assurance' | 'regulatory_affairs' | 'management') => {
    try {
      const users = await DocumentPersonnelIntegrationService.findExistingUsersForRole(companyId, roleType);
      setExistingUsers(users);
      setShowNewUserForm(users.length === 0);
    } catch (error) {
      console.error('Error loading existing users:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let dataToSave: any = {};
      
      switch (missingDataType) {
        case 'head_of_qa':
          // Handle personnel integration for Head of QA
          if (selectedExistingUser && !showNewUserForm) {
            // Update existing user
            const result = await DocumentPersonnelIntegrationService.savePersonnelToCompany(
              companyId,
              headOfQA,
              'head_of_qa',
              selectedExistingUser
            );
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to update existing user');
            }
            
            dataToSave = { 
              type: 'head_of_qa', 
              data: { ...headOfQA, userId: selectedExistingUser, isExistingUser: true }
            };
          } else if (showNewUserForm && headOfQA.name && headOfQA.email) {
            // Create new user
            const result = await DocumentPersonnelIntegrationService.savePersonnelToCompany(
              companyId,
              headOfQA,
              'head_of_qa'
            );
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to create new user');
            }
            
            dataToSave = { 
              type: 'head_of_qa', 
              data: { ...headOfQA, userId: result.userId, isNewUser: true }
            };
          } else {
            dataToSave = { type: 'head_of_qa', data: headOfQA };
          }
          break;
        case 'department_structure':
          dataToSave = { type: 'department_structure', data: departments };
          break;
        case 'document_numbering':
          dataToSave = { type: 'document_numbering', data: documentSystem };
          break;
        case 'retention_periods':
          dataToSave = { type: 'retention_periods', data: retentionPeriods };
          break;
        case 'edm_system':
          dataToSave = { type: 'edm_system', data: edmSystem };
          break;
        case 'approval_workflow':
          dataToSave = { type: 'approval_workflow', data: approvalWorkflow };
          break;
      }

      // Save to company data service
      const { CompanyDataUpdateService } = await import('@/services/companyDataUpdateService');
      const result = await CompanyDataUpdateService.saveCompanyData(companyId, dataToSave);
      
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to save company data');
      }
      
      await onDataSaved(dataToSave);
      
      toast({
        title: "Information Saved",
        description: "Company information has been updated and will be used in future documents.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  };

  const getDialogContent = () => {
    switch (missingDataType) {
      case 'head_of_qa':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Head of Quality Assurance</h3>
              <Badge variant="destructive">Critical</Badge>
            </div>

            {/* Existing Users Section */}
            {existingUsers.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Existing Quality Assurance Personnel
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Found {existingUsers.length} existing user(s) in Quality Assurance. You can assign this role to an existing user or create a new one.
                  </p>
                  
                  <div className="space-y-2">
                    <Label>Select Existing User</Label>
                    <Select 
                      value={selectedExistingUser} 
                      onValueChange={(value) => {
                        setSelectedExistingUser(value);
                        setShowNewUserForm(value === '');
                        
                        // Pre-fill form with selected user data
                        if (value) {
                          const user = existingUsers.find(u => u.id === value);
                          if (user) {
                            setHeadOfQA(prev => ({
                              ...prev,
                              name: user.name,
                              email: user.email,
                              department: 'Quality Assurance'
                            }));
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose existing user or create new..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">+ Create New User</SelectItem>
                        {existingUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email} • {user.functional_area}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New User Form */}
            {showNewUserForm && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium">
                    {existingUsers.length > 0 ? 'Create New User' : 'User Information'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qa-name">Full Name *</Label>
                    <Input
                      id="qa-name"
                      value={headOfQA.name}
                      onChange={(e) => setHeadOfQA({...headOfQA, name: e.target.value})}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="qa-email">Email *</Label>
                    <Input
                      id="qa-email"
                      type="email"
                      value={headOfQA.email}
                      onChange={(e) => setHeadOfQA({...headOfQA, email: e.target.value})}
                      placeholder="jane.smith@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="qa-phone">Phone</Label>
                    <Input
                      id="qa-phone"
                      value={headOfQA.phone}
                      onChange={(e) => setHeadOfQA({...headOfQA, phone: e.target.value})}
                      placeholder="+49 123 456 7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qa-dept">Department</Label>
                    <Input
                      id="qa-dept"
                      value={headOfQA.department}
                      onChange={(e) => setHeadOfQA({...headOfQA, department: e.target.value})}
                      readOnly
                    />
                  </div>
                </div>

                {existingUsers.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> This information will be saved to your company's user management system. 
                      The person will be added as a user with Quality Assurance permissions and can access relevant documents and systems.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Update existing user note */}
            {selectedExistingUser && !showNewUserForm && (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Note:</strong> This will update the selected user's role to include Head of Quality Assurance responsibilities.
                  Their access permissions will be updated accordingly.
                </p>
              </div>
            )}
          </div>
        );

      case 'department_structure':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Department Structure</h3>
              <Badge variant="destructive">Critical</Badge>
            </div>
            
            <div className="bg-blue-50/30 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Organizational structure required for quality manual.</strong> Review and confirm your company's department structure. 
                Click on departments to expand and view roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {departments.map((department) => {
                const isExpanded = expandedDepartments.has(department.id);
                
                return (
                  <Card key={department.id} className="h-fit">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleDepartment(department.id)}
                    >
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {department.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {department.roles.length} roles
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </CardTitle>
                      {department.head && (
                        <p className="text-sm text-muted-foreground">
                          Head: {department.head}
                        </p>
                      )}
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        {department.responsibilities && (
                          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              {department.responsibilities}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Roles:
                          </h4>
                          {department.roles.map((role, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/20 rounded text-sm"
                            >
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span>{role}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'document_numbering':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Document Numbering System</h3>
              <Badge variant="destructive">Critical</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Prefix</Label>
                <Input
                  value={documentSystem.prefix}
                  onChange={(e) => setDocumentSystem({...documentSystem, prefix: e.target.value})}
                  placeholder="SOP"
                />
              </div>
              <div>
                <Label>Number Format</Label>
                <Select value={documentSystem.numberFormat} onValueChange={(value) => setDocumentSystem({...documentSystem, numberFormat: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XXX">XXX (3 digits)</SelectItem>
                    <SelectItem value="XXXX">XXXX (4 digits)</SelectItem>
                    <SelectItem value="XX-XX">XX-XX (2-2 format)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Starting Number</Label>
                <Input
                  value={documentSystem.startingNumber}
                  onChange={(e) => setDocumentSystem({...documentSystem, startingNumber: e.target.value})}
                  placeholder="001"
                />
              </div>
              <div>
                <Label>Version Format</Label>
                <Select value={documentSystem.versionFormat} onValueChange={(value) => setDocumentSystem({...documentSystem, versionFormat: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V1.0">V1.0 (V Major.Minor)</SelectItem>
                    <SelectItem value="Rev A">Rev A (Revision Letter)</SelectItem>
                    <SelectItem value="01">01 (Sequential Number)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Preview: <span className="font-mono font-medium">{documentSystem.prefix}-{documentSystem.startingNumber} {documentSystem.versionFormat}</span>
              </p>
            </div>
          </div>
        );

      case 'retention_periods':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Document Retention Periods</h3>
              <Badge variant="destructive">Important</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="sops-retention">Standard Operating Procedures (SOPs)</Label>
                <Select value={retentionPeriods.sops} onValueChange={(value) => setRetentionPeriods({...retentionPeriods, sops: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5 years">5 years</SelectItem>
                    <SelectItem value="7 years">7 years (Recommended)</SelectItem>
                    <SelectItem value="10 years">10 years</SelectItem>
                    <SelectItem value="15 years">15 years</SelectItem>
                    <SelectItem value="Lifetime">Product lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quality-records-retention">Quality Records</Label>
                <Select value={retentionPeriods.qualityRecords} onValueChange={(value) => setRetentionPeriods({...retentionPeriods, qualityRecords: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7 years">7 years</SelectItem>
                    <SelectItem value="10 years">10 years (Recommended)</SelectItem>
                    <SelectItem value="15 years">15 years</SelectItem>
                    <SelectItem value="Lifetime + 5 years">Product lifetime + 5 years</SelectItem>
                    <SelectItem value="Lifetime + 10 years">Product lifetime + 10 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="design-files-retention">Design and Development Files</Label>
                <Select value={retentionPeriods.designFiles} onValueChange={(value) => setRetentionPeriods({...retentionPeriods, designFiles: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10 years">10 years</SelectItem>
                    <SelectItem value="15 years">15 years</SelectItem>
                    <SelectItem value="Lifetime + 10 years">Product lifetime + 10 years</SelectItem>
                    <SelectItem value="Lifetime + 15 years">Product lifetime + 15 years (Recommended)</SelectItem>
                    <SelectItem value="Lifetime + 20 years">Product lifetime + 20 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="clinical-data-retention">Clinical Data and Studies</Label>
                <Select value={retentionPeriods.clinicalData} onValueChange={(value) => setRetentionPeriods({...retentionPeriods, clinicalData: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 years">15 years</SelectItem>
                    <SelectItem value="20 years">20 years</SelectItem>
                    <SelectItem value="25 years">25 years (Recommended)</SelectItem>
                    <SelectItem value="30 years">30 years</SelectItem>
                    <SelectItem value="Permanent">Permanent retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Regulatory Context</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• EU MDR Article 10.8: Economic operators must keep technical documentation available</li>
                <li>• FDA 21 CFR 820.180: Records must be maintained for the life of the device</li>
                <li>• ISO 13485: Quality management system records retention requirements</li>
                <li>• Consider local regulatory requirements for your target markets</li>
              </ul>
            </div>
          </div>
        );

      case 'edm_system':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Electronic Document Management System</h3>
              <Badge variant="destructive">Critical</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>eDMS Platform/Software</Label>
                <Select value={edmSystem.platform} onValueChange={(value) => setEdmSystem({...edmSystem, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SharePoint">Microsoft SharePoint</SelectItem>
                    <SelectItem value="Documentum">OpenText Documentum</SelectItem>
                    <SelectItem value="Veeva Vault">Veeva Vault QualityDocs</SelectItem>
                    <SelectItem value="MasterControl">MasterControl</SelectItem>
                    <SelectItem value="Ennov Doc">Ennov Doc</SelectItem>
                    <SelectItem value="TrackWise">TrackWise Digital</SelectItem>
                    <SelectItem value="Custom">Custom/In-house System</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>21 CFR Part 11 Validation Status</Label>
                <Select value={edmSystem.validationStatus} onValueChange={(value) => setEdmSystem({...edmSystem, validationStatus: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Validated">Fully Validated</SelectItem>
                    <SelectItem value="In Progress">Validation in Progress</SelectItem>
                    <SelectItem value="Planned">Validation Planned</SelectItem>
                    <SelectItem value="Not Required">Not Required (Non-FDA)</SelectItem>
                    <SelectItem value="Legacy">Legacy System (Pre-validation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Access Control Method</Label>
                <Select value={edmSystem.accessControls} onValueChange={(value) => setEdmSystem({...edmSystem, accessControls: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Role-based">Role-based Access Control (RBAC)</SelectItem>
                    <SelectItem value="User-based">User-based Permissions</SelectItem>
                    <SelectItem value="Department-based">Department-based Access</SelectItem>
                    <SelectItem value="Hybrid">Hybrid Approach</SelectItem>
                    <SelectItem value="Matrix">Permission Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Backup Schedule</Label>
                <Select value={edmSystem.backupSchedule} onValueChange={(value) => setEdmSystem({...edmSystem, backupSchedule: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real-time">Real-time/Continuous</SelectItem>
                    <SelectItem value="Hourly">Every Hour</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="On-demand">On-demand Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audit Trail Capabilities</Label>
                <Select value={edmSystem.auditTrail} onValueChange={(value) => setEdmSystem({...edmSystem, auditTrail: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enabled">Fully Enabled</SelectItem>
                    <SelectItem value="Partial">Partially Enabled</SelectItem>
                    <SelectItem value="Manual">Manual Logging</SelectItem>
                    <SelectItem value="Disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Electronic Signatures</Label>
                <Select value={edmSystem.electronicSignatures} onValueChange={(value) => setEdmSystem({...edmSystem, electronicSignatures: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enabled">Enabled (21 CFR Part 11)</SelectItem>
                    <SelectItem value="Basic">Basic Digital Signatures</SelectItem>
                    <SelectItem value="Planned">Planned Implementation</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>System Integrations</Label>
              <Textarea
                value={edmSystem.integrations}
                onChange={(e) => setEdmSystem({...edmSystem, integrations: e.target.value})}
                placeholder="Describe integrations with ERP, QMS, LIMS, or other systems..."
                rows={3}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">21 CFR Part 11 Requirements</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Electronic records must be authenticated, accurate, and readily retrievable</li>
                <li>• System must maintain audit trails of operator entries and actions</li>
                <li>• Electronic signatures must be unique to one individual and not reused</li>
                <li>• Systems must ensure data integrity and prevent unauthorized access</li>
                <li>• Regular validation and documentation of system compliance is required</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Form for {missingDataType} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={missingDataType === 'department_structure' ? "max-w-6xl max-h-[80vh] overflow-y-auto" : "max-w-4xl max-h-[80vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Complete Company Information
          </DialogTitle>
          <DialogDescription>
            This information is required for regulatory compliance and will be saved for future documents.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {getDialogContent()}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Information'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}