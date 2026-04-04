import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Filter, Copy } from "lucide-react";
import { CIInstanceService } from "@/services/ciInstanceService";
import { CIInheritanceService } from "@/services/ciInheritanceService";
import { CIInstanceDialog } from "./CIInstanceDialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface CIInstance {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  product_id?: string;
  template_id: string;
  instance_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CIInstanceManagerProps {
  companyId: string;
  productId?: string;
}

export function CIInstanceManager({ companyId, productId }: CIInstanceManagerProps) {
  const { user } = useAuth();
  const [instances, setInstances] = useState<CIInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<CIInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<CIInstance | null>(null);

  useEffect(() => {
    loadInstances();
  }, [companyId, productId]);

  useEffect(() => {
    filterInstances();
  }, [instances, searchTerm, typeFilter, statusFilter]);

  const loadInstances = async () => {
    try {
      setIsLoading(true);
      const data = productId 
        ? await CIInstanceService.getProductInstances(productId)
        : await CIInstanceService.getCompanyInstances(companyId);
      setInstances(data);
    } catch (error) {
      console.error("Error loading CI instances:", error);
      toast.error("Failed to load CI instances");
    } finally {
      setIsLoading(false);
    }
  };

  const filterInstances = () => {
    let filtered = instances;

    if (searchTerm) {
      filtered = filtered.filter(instance =>
        instance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(instance => instance.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    setFilteredInstances(filtered);
  };

  const handleCreateFromTemplate = async () => {
    setEditingInstance(null);
    setDialogOpen(true);
  };

  const handleEditInstance = (instance: CIInstance) => {
    setEditingInstance(instance);
    setDialogOpen(true);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm("Are you sure you want to delete this CI instance?")) return;

    try {
      await CIInstanceService.deleteInstance(instanceId);
      toast.success("CI instance deleted successfully");
      loadInstances();
    } catch (error) {
      console.error("Error deleting CI instance:", error);
      toast.error("Failed to delete CI instance");
    }
  };

  const handleInheritAll = async () => {
    if (!user?.id || !productId) {
      toast.error("Missing required information to inherit templates");
      return;
    }

    try {
      const instances = await CIInstanceService.inheritTemplatesForProduct(companyId, productId, user.id);
      if (instances.length > 0) {
        toast.success(`Inherited ${instances.length} CI templates`);
        loadInstances();
      } else {
        toast.info("No new templates to inherit");
      }
    } catch (error) {
      console.error("Error inheriting templates:", error);
      toast.error("Failed to inherit CI templates");
    }
  };

  const handleInstanceSuccess = () => {
    setDialogOpen(false);
    setEditingInstance(null);
    loadInstances();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      case "blocked":
        return "destructive";
      case "cancelled":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "audit":
        return "bg-blue-100 text-blue-800";
      case "gap":
        return "bg-green-100 text-green-800";
      case "document":
        return "bg-purple-100 text-purple-800";
      case "activity":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading CI instances...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {productId ? "Product CI Instances" : "Company CI Instances"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {productId 
                  ? "Manage CI instances specific to this product"
                  : "Manage CI instances across all company products"}
              </p>
            </div>
            <div className="flex gap-2">
              {productId && (
                <Button variant="outline" onClick={handleInheritAll}>
                  <Plus className="h-4 w-4 mr-2" />
                  Inherit All Templates
                </Button>
              )}
              <Button onClick={handleCreateFromTemplate}>
                <Copy className="h-4 w-4 mr-2" />
                Inherit from Template
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search instances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="gap">Gap Analysis</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredInstances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                {instances.length === 0
                  ? "No CI instances created yet"
                  : "No instances match the current filters"}
              </p>
              {instances.length === 0 && (
                <Button onClick={handleCreateFromTemplate} className="mt-4">
                  <Copy className="h-4 w-4 mr-2" />
                  Create Your First Instance
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{instance.title}</div>
                          {instance.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {instance.description.length > 50
                                ? `${instance.description.substring(0, 50)}...`
                                : instance.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(instance.type)}>
                          {instance.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(instance.priority)}>
                          {instance.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(instance.status)}>
                          {instance.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {instance.due_date 
                          ? new Date(instance.due_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {instance.assigned_to ? "Assigned" : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditInstance(instance)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInstance(instance.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CIInstanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        productId={productId}
        instance={editingInstance}
        onSuccess={handleInstanceSuccess}
      />
    </>
  );
}