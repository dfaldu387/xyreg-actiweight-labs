
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  activeTemplates: any[];
  type: "company" | "product";
}

export function AuditInstanceDialog({
  open,
  onOpenChange,
  onSubmit,
  activeTemplates,
  type
}: AuditInstanceDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [auditName, setAuditName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setAuditName("");
      setDeadlineDate(undefined);
      setNotes("");
      setResponsiblePerson("");
    }
  }, [open]);

  // Auto-generate audit name when template is selected
  useEffect(() => {
    if (selectedTemplate && !auditName) {
      const today = new Date();
      const dateStr = format(today, "yyyy-MM");
      setAuditName(`${selectedTemplate.audit_templates.template_name} - ${dateStr}`);
    }
  }, [selectedTemplate, auditName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      return;
    }

    const formData = {
      auditName,
      auditType: selectedTemplate.audit_templates.template_name,
      deadlineDate,
      status: "Planned",
      notes,
      responsiblePersonId: responsiblePerson,
      ...(type === "product" && { 
        lifecyclePhase: selectedTemplate.audit_templates.lifecycle_phase 
      })
    };

    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Audit Instance</DialogTitle>
          <DialogDescription>
            Create a new audit based on an active template for this {type}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Select Audit Template</Label>
            {activeTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active audit templates available.</p>
                  <p className="text-sm">Please enable templates first using "Manage Templates".</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {activeTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      selectedTemplate?.id === template.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">
                            {template.audit_templates?.template_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {template.audit_templates?.description}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {template.audit_templates?.lifecycle_phase && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {template.audit_templates.lifecycle_phase}
                              </Badge>
                            )}
                            {template.audit_templates?.suggested_duration && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {template.audit_templates.suggested_duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {selectedTemplate && (
            <>
              {/* Audit Name */}
              <div className="space-y-2">
                <Label htmlFor="auditName">Audit Name</Label>
                <Input
                  id="auditName"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  placeholder="Enter audit name"
                  required
                />
              </div>

              {/* Deadline Date */}
              <div className="space-y-2">
                <Label>Deadline Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadlineDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadlineDate ? format(deadlineDate, "PPP") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate}
                      onSelect={setDeadlineDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Responsible Person */}
              <div className="space-y-2">
                <Label htmlFor="responsiblePerson">Responsible Person (Optional)</Label>
                <Input
                  id="responsiblePerson"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  placeholder="Enter responsible person"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>

              {/* Template Details */}
              {selectedTemplate.audit_templates?.suggested_documents && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Template Guidance</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Suggested Documents:</strong></p>
                      <p className="text-xs bg-muted p-2 rounded">
                        {selectedTemplate.audit_templates.suggested_documents}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTemplate || !auditName}>
              Create Audit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
