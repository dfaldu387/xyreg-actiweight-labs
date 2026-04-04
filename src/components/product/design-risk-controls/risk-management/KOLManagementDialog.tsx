import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { kolService, KOLGroup, HazardCategory, KOLAssignment } from "@/services/kolService";
import { UserSelector } from "@/components/common/UserSelector";

interface KOLManagementDialogProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KOLManagementDialog({ productId, open, onOpenChange }: KOLManagementDialogProps) {
  const { companyId } = useCompany();

  const [kolGroups, setKOLGroups] = useState<KOLGroup[]>([]);
  const [categories, setCategories] = useState<HazardCategory[]>([]);
  const [assignments, setAssignments] = useState<KOLAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    expertise_area: ''
  });

  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    kol_group_id: '',
    hazard_category_id: '',
    deadline: ''
  });

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<string>('');

  useEffect(() => {
    if (open && companyId) {
      fetchData();
    }
  }, [open, companyId]);

  const fetchData = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const [groupsData, categoriesData, assignmentsData] = await Promise.all([
        kolService.getKOLGroups(companyId),
        kolService.getHazardCategories(),
        kolService.getKOLAssignments(companyId, productId)
      ]);

      setKOLGroups(groupsData);
      setCategories(categoriesData);
      setAssignments(assignmentsData);
    } catch (error) {
      toast.error("Failed to load KOL data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!companyId || !newGroupForm.name.trim()) return;

    try {
      const newGroup = await kolService.createKOLGroup({
        ...newGroupForm,
        company_id: companyId,
      });

      setKOLGroups([...kolGroups, newGroup]);
      setNewGroupForm({ name: '', description: '', expertise_area: '' });
      
      toast.success("KOL group created successfully");
    } catch (error) {
      toast.error("Failed to create KOL group");
    }
  };

  const handleCreateAssignment = async () => {
    if (!companyId || !newAssignmentForm.title.trim() || !newAssignmentForm.kol_group_id || !newAssignmentForm.hazard_category_id) {
      return;
    }

    try {
      const newAssignment = await kolService.createKOLAssignment({
        ...newAssignmentForm,
        company_id: companyId,
        product_id: productId,
        deadline: newAssignmentForm.deadline || undefined,
      });

      setAssignments([...assignments, newAssignment]);
      setNewAssignmentForm({
        title: '',
        description: '',
        kol_group_id: '',
        hazard_category_id: '',
        deadline: ''
      });
      
      toast.success("KOL assignment created successfully");
    } catch (error) {
      toast.error("Failed to create KOL assignment");
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroupForMember || !selectedUserId) return;

    try {
      await kolService.addKOLGroupMember(selectedGroupForMember, selectedUserId, {
        role: 'member',
        is_lead: false,
      });

      await fetchData(); // Refresh data
      setSelectedUserId('');
      setSelectedGroupForMember('');
      
      toast.success("Member added to KOL group");
    } catch (error) {
      toast.error("Failed to add member to KOL group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await kolService.deleteKOLGroup(groupId);
      setKOLGroups(kolGroups.filter(g => g.id !== groupId));
      
      toast.success("KOL group deleted successfully");
    } catch (error) {
      toast.error("Failed to delete KOL group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            KOL Collaboration Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups">KOL Groups</TabsTrigger>
            <TabsTrigger value="assignments">Category Assignments</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create New Group */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Create New KOL Group</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      value={newGroupForm.name}
                      onChange={(e) => setNewGroupForm({...newGroupForm, name: e.target.value})}
                      placeholder="e.g., Human Factors Experts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expertise-area">Expertise Area</Label>
                    <Input
                      id="expertise-area"
                      value={newGroupForm.expertise_area}
                      onChange={(e) => setNewGroupForm({...newGroupForm, expertise_area: e.target.value})}
                      placeholder="e.g., Human Factors, Electronics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      value={newGroupForm.description}
                      onChange={(e) => setNewGroupForm({...newGroupForm, description: e.target.value})}
                      placeholder="Brief description of the group's expertise..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              </Card>

              {/* Add Member to Group */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Add Member to Group</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Select Group</Label>
                    <Select value={selectedGroupForMember} onValueChange={setSelectedGroupForMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a KOL group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kolGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select User</Label>
                    <UserSelector
                      companyId={companyId || ''}
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                      placeholder="Choose a user..."
                    />
                  </div>
                  <Button onClick={handleAddMember} className="w-full" disabled={!selectedGroupForMember || !selectedUserId}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </Card>
            </div>

            {/* Existing Groups */}
            <div className="space-y-4">
              <h3 className="font-medium">Existing KOL Groups</h3>
              {kolGroups.length === 0 ? (
                <Card className="p-6 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No KOL groups created yet.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kolGroups.map((group) => (
                    <Card key={group.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          {group.expertise_area && (
                            <Badge variant="outline" className="mt-1">
                              {group.expertise_area}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Members:</span> {group.members?.length || 0}
                        {group.members && group.members.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {group.members.map((member) => (
                              <div key={member.id} className="flex items-center text-xs text-gray-600">
                                {member.is_lead && <Crown className="h-3 w-3 mr-1 text-yellow-500" />}
                                User {member.user_id.slice(0, 8)}...
                                {member.role && ` (${member.role})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Create Category Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="assignment-title">Assignment Title</Label>
                    <Input
                      id="assignment-title"
                      value={newAssignmentForm.title}
                      onChange={(e) => setNewAssignmentForm({...newAssignmentForm, title: e.target.value})}
                      placeholder="e.g., Human Factors Risk Assessment"
                    />
                  </div>
                  <div>
                    <Label>KOL Group</Label>
                    <Select value={newAssignmentForm.kol_group_id} onValueChange={(value) => setNewAssignmentForm({...newAssignmentForm, kol_group_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select KOL group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kolGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} {group.expertise_area && `(${group.expertise_area})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hazard Category</Label>
                    <Select value={newAssignmentForm.hazard_category_id} onValueChange={(value) => setNewAssignmentForm({...newAssignmentForm, hazard_category_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="assignment-deadline">Deadline (Optional)</Label>
                    <Input
                      id="assignment-deadline"
                      type="date"
                      value={newAssignmentForm.deadline}
                      onChange={(e) => setNewAssignmentForm({...newAssignmentForm, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignment-description">Description</Label>
                    <Textarea
                      id="assignment-description"
                      value={newAssignmentForm.description}
                      onChange={(e) => setNewAssignmentForm({...newAssignmentForm, description: e.target.value})}
                      placeholder="Detailed description of the assessment requirements..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateAssignment} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </div>
            </Card>

            {/* Existing Assignments */}
            <div className="space-y-4">
              <h3 className="font-medium">Active Assignments</h3>
              {assignments.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-500">No category assignments created yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {categories.find(c => c.id === assignment.hazard_category_id)?.name}
                            </Badge>
                            <Badge className={assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-gray-100 text-gray-800'}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {assignment.deadline && (
                            <p className="text-sm text-gray-600 mt-1">
                              Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mt-2">{assignment.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <Users className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{kolGroups.length}</div>
                <div className="text-sm text-gray-600">KOL Groups</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="mx-auto h-8 w-8 text-green-500 mb-2">📋</div>
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-gray-600">Hazard Categories</div>
              </Card>
              <Card className="p-4 text-center">
                <Crown className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">{assignments.length}</div>
                <div className="text-sm text-gray-600">Active Assignments</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-medium mb-4">Assessment Status by Category</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const assignment = assignments.find(a => a.hazard_category_id === category.id);
                  return (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{category.name}</span>
                      <Badge className={assignment ? 
                        (assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') : 
                        'bg-gray-100 text-gray-800'}>
                        {assignment ? assignment.status.replace('_', ' ') : 'Not Assigned'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
