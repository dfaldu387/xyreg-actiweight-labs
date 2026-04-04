import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { CITemplateService } from "@/services/ciTemplateService";
import { CITemplateDialog } from "./CITemplateDialog";
import { toast } from "sonner";

interface CITemplate {
  id: string;
  title: string;
  type: string;
  priority: string;
  description?: string;
  is_active: boolean;
  template_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CITemplateManagerProps {
  companyId: string;
}

export function CITemplateManager({ companyId }: CITemplateManagerProps) {
  const [templates, setTemplates] = useState<CITemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CITemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, typeFilter, statusFilter]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await CITemplateService.getCompanyTemplates(companyId);
      setTemplates(data);
    } catch (error) {
      console.error("Error loading CI templates:", error);
      toast.error("Failed to load CI templates");
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(template => template.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(template => template.is_active === isActive);
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: CITemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this CI template?")) return;

    try {
      await CITemplateService.deleteTemplate(templateId);
      toast.success("CI template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting CI template:", error);
      toast.error("Failed to delete CI template");
    }
  };

  const handleTemplateSuccess = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "destructive";
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
          <p className="text-sm text-muted-foreground">Loading CI templates...</p>
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
              <CardTitle>CI Templates</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage company-wide CI templates that can be inherited by products
              </p>
            </div>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                {templates.length === 0
                  ? "No CI templates created yet"
                  : "No templates match the current filters"}
              </p>
              {templates.length === 0 && (
                <Button onClick={handleCreateTemplate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
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
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.title}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {template.description.length > 50
                                ? `${template.description.substring(0, 50)}...`
                                : template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(template.type)}>
                          {template.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(template.priority)}>
                          {template.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
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

      <CITemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        template={editingTemplate}
        onSuccess={handleTemplateSuccess}
      />
    </>
  );
}