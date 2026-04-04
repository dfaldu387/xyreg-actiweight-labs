import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductDocumentCreationDialog } from "./documents/ProductDocumentCreationDialog";

export interface ProductDocumentsProps {
  productId?: string;
  phases?: any[];
  documents?: any[];
  onDocumentAdded?: (document: any) => void;
  className?: string;
  companyId?: string;
  refreshDocuments?: () => void;
}

export function ProductDocuments({ 
  productId, 
  companyId,
  phases = [], 
  documents: initialDocuments = [], 
  onDocumentAdded, 
  className = "",
  refreshDocuments
}: ProductDocumentsProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [documents, setDocuments] = useState<any[]>(initialDocuments);

  // Fetch documents when component mounts or productId/companyId changes
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        let query = supabase.from('documents').select('*');

        if (productId) {
          query = query.eq('product_id', productId);
        } else if (companyId) {
          query = query.eq('company_id', companyId);
        } else if (initialDocuments.length > 0) {
          setDocuments(initialDocuments);
          return;
        }

        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching documents:", error);
          return;
        }
        
        if (data) {
          setDocuments(data);
        }
      } catch (error) {
        console.error("Error in fetchDocuments:", error);
      }
    };

    if (productId || companyId || initialDocuments.length === 0) {
      fetchDocuments();
    }
  }, [productId, companyId, initialDocuments]);

  // Handle when a document is added
  const handleDocumentAdded = (documentId: string) => {
    // If a refresh function is provided from the main hook, use it
    if (refreshDocuments) {
      refreshDocuments();
    } else {
      // Fallback: refresh local documents list
      if (productId || companyId) {
        // Re-fetch documents to get the latest list
        const fetchDocuments = async () => {
          try {
            let query = supabase.from('documents').select('*');
            if (productId) {
              query = query.eq('product_id', productId);
            } else if (companyId) {
              query = query.eq('company_id', companyId);
            }
            const { data } = await query;
            if (data) {
              setDocuments(data);
            }
          } catch (error) {
            console.error("Error refreshing documents:", error);
          }
        };
        fetchDocuments();
      }
    }
    
    if (onDocumentAdded) {
      onDocumentAdded({ id: documentId });
    }
    setOpenAddDialog(false);
  };

  const handleAddButtonClick = () => {
    setOpenAddDialog(true);
  };

  return (
    <div className={className}>
      <Button 
        onClick={handleAddButtonClick}
        variant="outline"
        size="sm"
        className="flex gap-2"
      >
        <Plus className="h-4 w-4" />
        <FileText className="h-4 w-4" />
        Add Document
      </Button>

      {productId ? (
        <ProductDocumentCreationDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          productId={productId}
          companyId={companyId || ''}
          onDocumentCreated={handleDocumentAdded}
        />
      ) : (
        <ProductDocumentCreationDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          productId=""
          companyId={companyId || ''}
          onDocumentCreated={handleDocumentAdded}
        />
      )}
      
      {/* Display the documents */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map((doc: any) => (
            <div key={doc.id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <h4 className="font-medium">{doc.name}</h4>
                {doc.description && (
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {doc.document_type || doc.type || "Standard"}
                </span>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {doc.status || "Draft"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
