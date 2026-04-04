import { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TemplateDetailsDialog } from "./TemplateDetailsDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TemplateManagementTableProps {
  companyId: string;
  templates: any[];
  isLoading: boolean;
  onEdit: (template: any) => void;
  onRefresh: () => void;
}

export function TemplateManagementTable({
  companyId,
  templates,
  isLoading,
  onEdit,
  onRefresh
}: TemplateManagementTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleToggleEnabled = async (templateId: string, currentEnabled: boolean) => {
    setUpdatingStatus(prev => new Set(prev).add(templateId));
    
    try {
      const { error } = await supabase
        .from('company_audit_templates')
        .update({ is_enabled: !currentEnabled })
        .eq('company_id', companyId)
        .eq('audit_template_id', templateId);

      if (error) {
        console.error('Error updating template status:', error);
        toast.error('Failed to update template status');
        return;
      }

      toast.success(`Template ${!currentEnabled ? 'enabled' : 'disabled'}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      const { error } = await supabase
        .from('company_audit_templates')
        .delete()
        .eq('company_id', companyId)
        .eq('audit_template_id', templateToDelete.audit_templates.id);

      if (error) {
        console.error('Error removing template:', error);
        toast.error('Failed to remove template');
        return;
      }

      toast.success('Template removed from company');
      onRefresh();
    } catch (error) {
      console.error('Error removing template:', error);
      toast.error('Failed to remove template');
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleViewDetails = (template: any) => {
    setSelectedTemplate(template.audit_templates);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="mb-4">No audit templates configured yet</p>
        <p className="text-sm">Add templates from the standard library or create custom ones</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applicability</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{template.audit_templates.template_name}</div>
                    {template.audit_templates.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {template.audit_templates.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={template.audit_templates.source === 'standard' ? 'default' : 'secondary'}>
                    {template.audit_templates.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {template.audit_templates.applicability}
                  </Badge>
                </TableCell>
                <TableCell>
                  {template.audit_templates.audit_type_category || 'N/A'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={template.is_enabled}
                    onCheckedChange={() => handleToggleEnabled(template.audit_template_id, template.is_enabled)}
                    disabled={updatingStatus.has(template.audit_template_id)}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {template.audit_templates.source === 'custom' && (
                        <DropdownMenuItem onClick={() => onEdit(template.audit_templates)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => {
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove from Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TemplateDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        template={selectedTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this template from your company? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remove Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
