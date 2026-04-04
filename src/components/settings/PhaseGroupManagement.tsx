
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhaseGroup } from "@/types/client";
import { PhaseGroupList } from "./PhaseGroupList";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PhaseGroupManagement() {
  const [groups, setGroups] = useState<PhaseGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PhaseGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const COMPANY_ID = "00000000-0000-0000-0000-000000000001";

  // Load phase groups on component mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('phase_groups')
        .select('*')
        .eq('company_id', COMPANY_ID)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching phase groups:", error);
      toast.error("Failed to load phase groups");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('phase_groups')
          .update({ name: newGroupName })
          .eq('id', editingGroup.id);

        if (error) throw error;
        
        setGroups(prev => 
          prev.map(g => g.id === editingGroup.id ? { ...g, name: newGroupName } : g)
        );
        toast.success("Group updated successfully");
      } else {
        const { data, error } = await supabase
          .from('phase_groups')
          .insert({
            name: newGroupName,
            position: groups.length,
            company_id: COMPANY_ID
          })
          .select()
          .single();

        if (error) throw error;
        
        setGroups(prev => [...prev, data]);
        toast.success("Group created successfully");
      }
      setIsDialogOpen(false);
      setNewGroupName("");
      setEditingGroup(null);
    } catch (error) {
      console.error("Error saving group:", error);
      toast.error("Failed to save group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('phase_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  const handleReorderGroups = async (reorderedGroups: PhaseGroup[]) => {
    try {
      // Create array of updates with all required fields
      const updates = reorderedGroups.map((group, index) => ({
        id: group.id,
        name: group.name,
        company_id: group.company_id || COMPANY_ID,
        position: index,
        is_default: group.is_default || false,
        is_deletable: group.is_deletable !== false
      }));

      // Use upsert to update the records
      const { error } = await supabase
        .from('phase_groups')
        .upsert(updates);

      if (error) throw error;
      
      setGroups(reorderedGroups);
      toast.success("Groups reordered successfully");
    } catch (error) {
      console.error("Error reordering groups:", error);
      toast.error("Failed to reorder groups");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Phase Groups</h3>
        <Button onClick={() => {
          setEditingGroup(null);
          setNewGroupName("");
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No phase groups defined yet.</p>
        </div>
      ) : (
        <PhaseGroupList
          groups={groups}
          onReorder={handleReorderGroups}
          onEdit={(group) => {
            setEditingGroup(group);
            setNewGroupName(group.name);
            setIsDialogOpen(true);
          }}
          onDelete={handleDeleteGroup}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Add New Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? "Edit the group name below."
                : "Enter a name for the new phase group."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingGroup(null);
                setNewGroupName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={!newGroupName.trim()}>
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
