import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FileText, Plus, Minus, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvailableDocumentsSectionProps {
  productId: string;
  onDocumentToggled: () => void;
}

interface CompanyDocument {
  id: string;
  name: string;
  status?: string;
  phase_name?: string;
  document_type?: string;
}

interface DocumentsByPhase {
  [phaseName: string]: CompanyDocument[];
}

export function AvailableDocumentsSection({ productId, onDocumentToggled }: AvailableDocumentsSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentsByPhase>({});
  const [includedDocNames, setIncludedDocNames] = useState<string[]>([]);
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  
  // Fetch all company documents and currently included documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);

        // First, get the company ID from the product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();
          
        if (productError) {
          throw productError;
        }
        
        const companyId = product.company_id;
        if (!companyId) {
          throw new Error("No company ID associated with this product");
        }

        // Get company's chosen phases with their details - FIXED: Use company_phases
        const { data: chosenPhases, error: chosenPhasesError } = await supabase
          .from('company_chosen_phases')
          .select(`
            position,
            company_phases!inner(id, name, description)
          `)
          .eq('company_id', companyId)
          .order('position');
        
        if (chosenPhasesError) {
          throw chosenPhasesError;
        }

        console.log("Company chosen phases:", chosenPhases);

        // Fetch documents for each phase from phase_assigned_documents
        const documentsByPhase: DocumentsByPhase = {};
        
        // Initialize document storage by phase
        if (chosenPhases && chosenPhases.length > 0) {
          // Create an array of phase IDs to fetch documents for
          const phaseIds = chosenPhases.map(cp => cp.company_phases.id);

          // Fetch all documents for these phases at once
          const { data: phaseDocuments, error: phaseDocError } = await supabase
            .from('phase_assigned_documents')
            .select('*')
            .in('phase_id', phaseIds);
            
          if (phaseDocError) {
            throw phaseDocError;
          }

          console.log("Phase documents:", phaseDocuments);

          // Create mapping between phase IDs and phase names
          const phaseNameMap = new Map<string, string>();
          chosenPhases.forEach(cp => {
            if (cp.company_phases && cp.company_phases.name) {
              phaseNameMap.set(cp.company_phases.id, cp.company_phases.name);
            }
          });

          // Initialize phase document containers
          chosenPhases.forEach(cp => {
            const phaseName = cp.company_phases?.name || "Unknown Phase";
            documentsByPhase[phaseName] = [];
          });

          // Sort documents into phases
          if (phaseDocuments && phaseDocuments.length > 0) {
            phaseDocuments.forEach(doc => {
              const phaseId = doc.phase_id;
              const phaseName = phaseNameMap.get(phaseId) || "Unknown Phase";
              
              if (!documentsByPhase[phaseName]) {
                documentsByPhase[phaseName] = [];
              }
              
              documentsByPhase[phaseName].push({
                id: doc.id,
                name: doc.name,
                status: doc.status,
                phase_name: phaseName,
                document_type: doc.document_type
              });
            });
          }
        }
        
        // Fetch all documents currently included for this product
        const { data: productDocs, error: prodDocsError } = await supabase
          .from('documents')
          .select('name')
          .eq('product_id', productId);
          
        if (prodDocsError) {
          throw prodDocsError;
        }
        
        // Set state
        setAvailableDocuments(documentsByPhase);
        setIncludedDocNames(productDocs?.map(doc => doc.name) || []);

        // Auto-include company documents if they're not already included
        if (Object.keys(documentsByPhase).length > 0) {
          await autoIncludeCompanyDocuments(documentsByPhase, productDocs || [], productId);
          
          // Refresh the included document names after auto-including
          const { data: updatedProductDocs, error: updatedDocsError } = await supabase
            .from('documents')
            .select('name')
            .eq('product_id', productId);
            
          if (!updatedDocsError && updatedProductDocs) {
            setIncludedDocNames(updatedProductDocs.map(doc => doc.name) || []);
          }
          
          // Auto-expand the first phase if available
          setExpandedPhases([Object.keys(documentsByPhase)[0]]);
        }
        
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load available documents");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, [productId]);
  
  // New function to auto-include company documents for the product
  const autoIncludeCompanyDocuments = async (
    documentsByPhase: DocumentsByPhase, 
    existingDocs: any[], 
    productId: string
  ) => {
    try {
      // Create a set of existing document names for quick lookup
      const existingDocSet = new Set(existingDocs.map(doc => doc.name));
      
      // Collect all documents from all phases
      const allDocuments: CompanyDocument[] = [];
      Object.values(documentsByPhase).forEach(docs => {
        allDocuments.push(...docs);
      });
      
      console.log(`Found ${allDocuments.length} company documents to auto-include`);
      
      // For each document that doesn't exist in the product yet, add it
      const docsToAdd = allDocuments.filter(doc => !existingDocSet.has(doc.name));
      
      if (docsToAdd.length > 0) {
        console.log(`Auto-including ${docsToAdd.length} documents to product`);
        
        // Prepare documents for insertion
        const documentsToInsert = docsToAdd.map(doc => ({
          name: doc.name,
          status: 'Pending',
          product_id: productId,
          phase_id: null // We'll set this later when needed
        }));
        
        // Insert all documents in one batch
        const { data, error } = await supabase
          .from('documents')
          .insert(documentsToInsert)
          .select();
          
        if (error) {
          console.error("Error auto-including documents:", error);
          return false;
        }
        
        console.log(`Successfully auto-included ${data?.length || 0} documents`);
        
        // Notify parent to refresh document list
        onDocumentToggled();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in autoIncludeCompanyDocuments:", error);
      return false;
    }
  };

  // Function to check if a document is included in the product
  const isDocumentIncluded = (documentName: string): boolean => {
    return includedDocNames.includes(documentName);
  };

  // Function to toggle document inclusion/exclusion
  const handleToggleDocument = async (doc: CompanyDocument, include: boolean) => {
    try {
      // Set loading state for this document
      setToggleLoading(prev => ({ ...prev, [doc.id]: true }));
      
      if (include) {
        // Add document to product
        const { error } = await supabase
          .from('documents')
          .insert({
            name: doc.name,
            status: 'Pending',
            product_id: productId
          });
          
        if (error) {
          console.error("Error including document:", error);
          toast.error("Failed to include document");
          return;
        }
        
        // Update local state
        setIncludedDocNames([...includedDocNames, doc.name]);
        toast.success("Document included successfully");
      } else {
        // Remove document from product
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('name', doc.name)
          .eq('product_id', productId);
          
        if (error) {
          console.error("Error excluding document:", error);
          toast.error("Failed to exclude document");
          return;
        }
        
        // Update local state
        setIncludedDocNames(includedDocNames.filter(name => name !== doc.name));
        toast.success("Document excluded successfully");
      }
      
      // Notify parent component that document inclusion has changed
      onDocumentToggled();
      
    } catch (error) {
      console.error("Error toggling document:", error);
      toast.error("An error occurred when updating the document");
    } finally {
      // Clear loading state
      setToggleLoading(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  // Toggle phase expansion
  const togglePhase = (phaseName: string) => {
    setExpandedPhases(prev => 
      prev.includes(phaseName) 
        ? prev.filter(p => p !== phaseName) 
        : [...prev, phaseName]
    );
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Available Company Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : Object.keys(availableDocuments).length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No company documents available to include
          </div>
        ) : (
          <Accordion 
            type="multiple" 
            className="w-full"
            value={expandedPhases}
            onValueChange={setExpandedPhases}
          >
            {Object.entries(availableDocuments).map(([phaseName, docs]) => (
              docs.length > 0 && (
                <AccordionItem key={phaseName} value={phaseName}>
                  <AccordionTrigger className="px-3 py-2 hover:bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>{phaseName}</span>
                      <Badge variant="outline" className="ml-2">{docs.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-2 mt-2">
                      {docs.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex justify-between items-center p-2 hover:bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.name}</span>
                            {doc.document_type && (
                              <Badge variant="outline" className="ml-2">{doc.document_type}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {isDocumentIncluded(doc.name) ? "Included" : "Not included"}
                            </span>
                            
                            {isDocumentIncluded(doc.name) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleToggleDocument(doc, false)}
                                disabled={toggleLoading[doc.id]}
                              >
                                {toggleLoading[doc.id] ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full mr-1"></div>
                                ) : (
                                  <Minus className="h-4 w-4 mr-1" />
                                )}
                                <span>Exclude</span>
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleToggleDocument(doc, true)}
                                disabled={toggleLoading[doc.id]}
                              >
                                {toggleLoading[doc.id] ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full mr-1"></div>
                                ) : (
                                  <Plus className="h-4 w-4 mr-1" />
                                )}
                                <span>Include</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
