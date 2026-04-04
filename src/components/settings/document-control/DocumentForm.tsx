
import React, { useState } from "react";
import { DocumentItem } from "@/types/client";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { documentFormSchema } from "./schemas/DocumentFormSchema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedMultiSelectPhases } from "./EnhancedMultiSelectPhases";
import { DocumentTechApplicability } from "@/types/documentTypes";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";

interface DocumentFormProps {
  document?: DocumentItem;
  availablePhases: string[];
  onSubmit: (document: DocumentItem) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isSubmitting?: boolean;
  isDialog?: boolean;
  phaseOrder?: string[];
}

export function DocumentForm({
  document,
  availablePhases,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  isDialog = false,
  phaseOrder = []
}: DocumentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>(document?.file_path);

  const form = useForm({
    defaultValues: {
      name: document?.name || "",
      type: (document?.type as "Standard" | "Regulatory" | "Clinical" | "Technical" | "Quality" | "Design") || "Standard",
      phases: document?.phases || [],
      // Use techApplicability directly without conversion
      techApplicability: document?.techApplicability || "All device types",
      description: document?.description || "",
    }
  });

  const handleFileChange = (file: File | null, uploadPath?: string) => {
    setSelectedFile(file);
    if (uploadPath) {
      setFilePath(uploadPath);
    } else if (file === null) {
      setFilePath(undefined);
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormError(null);
    setIsSubmittingLocal(true);
    
    try {
      console.log("DocumentForm: Form submitted with values:", values);
      
      // Create a complete DocumentItem using values directly
      const documentItem: DocumentItem = {
        id: document?.id || `doc-${Date.now()}`,
        name: values.name,
        type: values.type,
        phases: values.phases,
        // Use techApplicability directly without conversion
        techApplicability: values.techApplicability,
        description: values.description,
        reviewers: document?.reviewers || [],
        status: document?.status || "Not Started",
        version: document?.version || "1.0",
        lastUpdated: new Date().toISOString(),
        // Include file information if available
        file_path: filePath,
        file_name: selectedFile?.name || document?.file_name,
        file_size: selectedFile?.size || document?.file_size,
        file_type: selectedFile?.type || document?.file_type,
        uploaded_at: selectedFile ? new Date().toISOString() : document?.uploaded_at,
        uploaded_by: selectedFile ? 'current-user' : document?.uploaded_by // This should be the actual user ID
      };
      
      console.log("DocumentForm: Submitting document item:", documentItem);
      
      // Call the onSubmit function and wait for it to complete
      await onSubmit(documentItem);
      
      console.log("DocumentForm: Document submitted successfully");
      // Form will be closed by the parent component after successful submission
    } catch (error) {
      console.error("DocumentForm: Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while submitting the form";
      setFormError(errorMessage);
      // Don't close form on error - let user try again
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isFormSubmitting = isSubmitting || isSubmittingLocal;

  // Prepare current file data for the upload component
  const currentFile = document && (document.file_path || document.file_name) ? {
    name: document.file_name || 'Unknown file',
    path: document.file_path || '',
    size: document.file_size,
    type: document.file_type,
    uploadedAt: document.uploaded_at
  } : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="Document Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Regulatory">Regulatory</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Clinical">Clinical</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="techApplicability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technical Applicability</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technical applicability" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All device types">All device types</SelectItem>
                  <SelectItem value="Software devices">Software devices</SelectItem>
                  <SelectItem value="Hardware devices">Hardware devices</SelectItem>
                  <SelectItem value="Combination devices">Combination devices</SelectItem>
                  <SelectItem value="Implantable devices">Implantable devices</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Document description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Section */}
        <DocumentFileUpload
          currentFile={currentFile}
          onFileChange={handleFileChange}
          disabled={isFormSubmitting}
        />

        <FormField
          control={form.control}
          name="phases"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phases</FormLabel>
              <FormDescription>
                Select the phases this document applies to.
              </FormDescription>
              <FormControl>
                <EnhancedMultiSelectPhases
                  availablePhases={availablePhases}
                  selectedPhases={field.value}
                  onChange={(newPhases) => {
                    console.log("DocumentForm: Phase selection changed:", newPhases);
                    field.onChange(newPhases);
                  }}
                  phaseOrder={phaseOrder}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center">
          {/* Delete button on the left */}
          {onDelete && document && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  type="button"
                  disabled={isFormSubmitting || isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{document.name}"? This action cannot be undone and will remove the document from all phases.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Cancel and Save buttons on the right */}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={onCancel} 
              disabled={isFormSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isFormSubmitting || isDeleting}
            >
              {isFormSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
