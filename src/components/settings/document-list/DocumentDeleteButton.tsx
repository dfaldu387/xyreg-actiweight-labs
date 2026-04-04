
import React, { useState, useEffect } from "react";
import { Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface DocumentDeleteButtonProps {
  documentId: string;
  onDelete: () => void;
  onConfirm?: () => Promise<void>;
  id?: string;
  name?: string;
  isLoading?: boolean;
  phaseContext?: string;
  isPredefinedCore?: boolean;
  isProtected?: boolean; // New prop for document protection
  companyId?: string;
  isDocumentInProtectedGroup?: () => Promise<boolean>;
}

export function DocumentDeleteButton({ 
  documentId, 
  onDelete,
  onConfirm,
  id,
  name,
  isLoading,
  phaseContext,
  isPredefinedCore = false,
  isProtected = false, // New prop with default value
  companyId,
  isDocumentInProtectedGroup
}: DocumentDeleteButtonProps) {
  const [isProtectedDocument, setIsProtectedDocument] = useState(isProtected);
  const [isCheckingProtection, setIsCheckingProtection] = useState(false);

  // Check protection status when component mounts
  useEffect(() => {
    const checkProtection = async () => {
      if (isDocumentInProtectedGroup && !isProtected) {
        setIsCheckingProtection(true);
        try {
          const result = await isDocumentInProtectedGroup();
          setIsProtectedDocument(result || isProtected);
        } catch (error) {
          console.error('Error checking document protection:', error);
          setIsProtectedDocument(isProtected);
        } finally {
          setIsCheckingProtection(false);
        }
      } else {
        setIsProtectedDocument(isProtected);
      }
    };
    
    checkProtection();
  }, [isDocumentInProtectedGroup, isProtected]);

  const handleDelete = async () => {
    console.log(`[DocumentDeleteButton] Delete triggered for document ${name || documentId}, phaseContext: ${phaseContext}`);
    
    if (onDelete) {
      onDelete();
    } else if (onConfirm) {
      await onConfirm();
    }
  };

  const actualDocumentId = documentId || id;
  const isCompleteDelete = !phaseContext;
  
  // Don't show delete button for protected documents
  if (isProtectedDocument) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground cursor-not-allowed"
        disabled={true}
        title="Protected document cannot be deleted"
      >
        <Shield className="h-4 w-4" />
        <span className="sr-only">Protected document - cannot delete</span>
      </Button>
    );
  }

  // Show loading state while checking protection
  if (isCheckingProtection) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground"
        disabled={true}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Checking permissions...</span>
      </Button>
    );
  }

  let deleteActionText: string;
  let deleteDescription: string;

  if (isCompleteDelete) {
    deleteActionText = "Delete document permanently";
    deleteDescription = `Are you sure you want to permanently delete ${name ? `"${name}"` : 'this document'}? This action cannot be undone.`;
  } else {
    deleteActionText = `Permanently delete document`;
    deleteDescription = `Are you sure you want to permanently delete ${name ? `"${name}"` : 'this document'}? This action cannot be undone.`;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:text-destructive"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{deleteActionText} {name ? name : 'document'}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{deleteActionText}</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Permanently Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
