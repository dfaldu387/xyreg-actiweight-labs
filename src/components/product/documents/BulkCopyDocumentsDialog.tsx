import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Stepper } from '@/components/ui/stepper';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Copy, CheckCircle2, Loader2, Users, UserMinus } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanyProducts } from '@/hooks/useCompanyProducts';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  status?: string;
  document_type?: string;
  phase_name?: string;
  authors_ids?: string[];
}

interface BulkCopyDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  companyId: string;
  currentProductId: string;
  onCopyComplete?: () => void;
}

export function BulkCopyDocumentsDialog({
  open,
  onOpenChange,
  documents,
  companyId,
  currentProductId,
  onCopyComplete
}: BulkCopyDocumentsDialogProps) {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('copy');
  
  // Bulk Copy Documents state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [documentSearch, setDocumentSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState(0);
  const [copyResults, setCopyResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Bulk Authors state
  const [authorMode, setAuthorMode] = useState<'add' | 'remove'>('add');
  const [activeStepForAuthors, setActiveStepForAuthors] = useState(0);
  const [selectedDocsForAuthors, setSelectedDocsForAuthors] = useState<Set<string>>(new Set());
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<Set<string>>(new Set());
  const [documentSearchForAuthors, setDocumentSearchForAuthors] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [isUpdatingAuthors, setIsUpdatingAuthors] = useState(false);
  const [authorUpdateProgress, setAuthorUpdateProgress] = useState(0);
  const [authorUpdateResults, setAuthorUpdateResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Bulk Author Removal state
  const [selectedAuthorsToRemove, setSelectedAuthorsToRemove] = useState<Set<string>>(new Set());
  const [authorSearchForRemoval, setAuthorSearchForRemoval] = useState('');
  const [isRemovingAuthors, setIsRemovingAuthors] = useState(false);
  const [removalProgress, setRemovalProgress] = useState(0);
  const [removalResults, setRemovalResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Current user ID for "You" badge
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  // Fetch company products
  const { products, isLoading: isLoadingProducts } = useCompanyProducts(companyId);

  // Fetch authors
  const { authors, allAuthorsMap, isLoading: isLoadingAuthors, getAuthorById } = useDocumentAuthors(companyId);

  // Filter out current product from the list
  const availableProducts = useMemo(() => {
    return products.filter(p => p.id !== currentProductId);
  }, [products, currentProductId]);

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    if (!documentSearch.trim()) return documents;
    const search = documentSearch.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(search) ||
      doc.document_type?.toLowerCase().includes(search) ||
      doc.phase_name?.toLowerCase().includes(search)
    );
  }, [documents, documentSearch]);

  // Filter documents for authors tab
  const filteredDocumentsForAuthors = useMemo(() => {
    if (!documentSearchForAuthors.trim()) return documents;
    const search = documentSearchForAuthors.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(search) ||
      doc.document_type?.toLowerCase().includes(search) ||
      doc.phase_name?.toLowerCase().includes(search)
    );
  }, [documents, documentSearchForAuthors]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const search = productSearch.toLowerCase();
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.phase?.toLowerCase().includes(search)
    );
  }, [availableProducts, productSearch]);

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return authors;
    const search = authorSearch.toLowerCase();
    return authors.filter(author =>
      author.name.toLowerCase().includes(search) ||
      author.email?.toLowerCase().includes(search)
    );
  }, [authors, authorSearch]);

  // Filter authors for removal mode
  const filteredAuthorsForRemoval = useMemo(() => {
    if (!authorSearchForRemoval.trim()) return authors;
    const search = authorSearchForRemoval.toLowerCase();
    return authors.filter(author =>
      author.name.toLowerCase().includes(search) ||
      author.email?.toLowerCase().includes(search)
    );
  }, [authors, authorSearchForRemoval]);

  // Calculate document count for each author (for removal mode)
  const authorDocumentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach(doc => {
      const docAuthorIds = Array.isArray(doc.authors_ids)
        ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
        : [];
      docAuthorIds.forEach(authorId => {
        counts.set(authorId, (counts.get(authorId) || 0) + 1);
      });
    });
    return counts;
  }, [documents]);

  // Get documents that have selected authors (for removal preview)
  const documentsWithSelectedAuthors = useMemo(() => {
    if (authorMode !== 'remove' || selectedAuthorsToRemove.size === 0) return [];
    return documents.filter(doc => {
      const docAuthorIds = Array.isArray(doc.authors_ids) 
        ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
        : [];
      return Array.from(selectedAuthorsToRemove).some(authorId => docAuthorIds.includes(authorId));
    });
  }, [documents, selectedAuthorsToRemove, authorMode]);

  const steps = [lang('document.bulk.selectDocuments'), lang('document.bulk.selectDevices'), lang('document.bulk.confirmAndCopy')];
  const authorSteps = useMemo(() => {
    return authorMode === 'remove'
      ? [lang('document.bulk.selectAuthors'), lang('document.bulk.previewDocuments'), lang('document.bulk.confirmAndRemove')]
      : [lang('document.bulk.selectDocuments'), lang('document.bulk.selectAuthors'), lang('document.bulk.confirmAndUpdate')];
  }, [authorMode, lang]);

  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleSelectAllDocuments = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCopy = async () => {
    if (selectedDocuments.size === 0 || selectedProducts.size === 0) return;

    setIsCopying(true);
    setCopyProgress(0);
    setCopyResults({ success: 0, failed: 0 });

    const totalOperations = selectedDocuments.size * selectedProducts.size;
    let completed = 0;
    let successCount = 0;
    let failedCount = 0;

    const selectedDocs = documents.filter(d => selectedDocuments.has(d.id));
    const targetProducts = Array.from(selectedProducts);

    for (const doc of selectedDocs) {
      for (const productId of targetProducts) {
        try {
          // Fetch the full document data
          const { data: sourceDoc, error: fetchError } = await (supabase as any)
            .from('phase_assigned_document_template')
            .select('*')
            .eq('id', doc.id)
            .single();

          if (fetchError || !sourceDoc) {
            // Try documents table as fallback
            const { data: fallbackDoc, error: fallbackError } = await (supabase as any)
              .from('documents')
              .select('*')
              .eq('id', doc.id)
              .single();

            if (fallbackError || !fallbackDoc) {
              failedCount++;
              completed++;
              setCopyProgress(Math.round((completed / totalOperations) * 100));
              continue;
            }

            // Copy from documents table
            const { error: insertError } = await (supabase as any)
              .from('documents')
              .insert({
                ...fallbackDoc,
                id: undefined,
                product_id: productId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'Not Started',
                file_path: null,
                file_name: null,
                uploaded_at: null
              });

            if (insertError) {
              failedCount++;
            } else {
              successCount++;
            }
          } else {
            // Copy from phase_assigned_document_template table
            const { error: insertError } = await (supabase as any)
              .from('phase_assigned_document_template')
              .insert({
                ...sourceDoc,
                id: undefined,
                product_id: productId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'Not Started',
                file_path: null,
                file_name: null,
                uploaded_at: null,
                approval_date: null
              });

            if (insertError) {
              failedCount++;
            } else {
              successCount++;
            }
          }
        } catch (error) {
          console.error('Error copying document:', error);
          failedCount++;
        }

        completed++;
        setCopyProgress(Math.round((completed / totalOperations) * 100));
        setCopyResults({ success: successCount, failed: failedCount });
      }
    }

    setIsCopying(false);

    if (successCount > 0) {
      toast.success(`Successfully copied ${successCount} document(s) to ${selectedProducts.size} device(s)`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to copy ${failedCount} document(s)`);
    }

    // Move to confirmation step
    setActiveStep(3);
    onCopyComplete?.();
  };

  const handleClose = () => {
    setActiveTab('copy');
    setActiveStep(0);
    setSelectedDocuments(new Set());
    setSelectedProducts(new Set());
    setDocumentSearch('');
    setProductSearch('');
    setCopyProgress(0);
    setCopyResults({ success: 0, failed: 0 });
    // Reset bulk authors state
    setAuthorMode('add');
    setActiveStepForAuthors(0);
    setSelectedDocsForAuthors(new Set());
    setSelectedAuthorIds(new Set());
    setDocumentSearchForAuthors('');
    setAuthorSearch('');
    setAuthorUpdateProgress(0);
    setAuthorUpdateResults({ success: 0, failed: 0 });
    // Reset removal state
    setSelectedAuthorsToRemove(new Set());
    setAuthorSearchForRemoval('');
    setIsRemovingAuthors(false);
    setRemovalProgress(0);
    setRemovalResults({ success: 0, failed: 0 });
  };

  // Handle mode change - reset state when switching between add/remove
  const handleAuthorModeChange = (mode: 'add' | 'remove') => {
    setAuthorMode(mode);
    setActiveStepForAuthors(0);
    setSelectedDocsForAuthors(new Set());
    setSelectedAuthorIds(new Set());
    setSelectedAuthorsToRemove(new Set());
    setDocumentSearchForAuthors('');
    setAuthorSearch('');
    setAuthorSearchForRemoval('');
    setAuthorUpdateProgress(0);
    setAuthorUpdateResults({ success: 0, failed: 0 });
    setRemovalProgress(0);
    setRemovalResults({ success: 0, failed: 0 });
  };

  // Bulk Authors handlers
  const handleDocumentForAuthorsToggle = (docId: string) => {
    setSelectedDocsForAuthors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleSelectAllDocumentsForAuthors = () => {
    if (selectedDocsForAuthors.size === filteredDocumentsForAuthors.length) {
      setSelectedDocsForAuthors(new Set());
    } else {
      setSelectedDocsForAuthors(new Set(filteredDocumentsForAuthors.map(d => d.id)));
    }
  };

  const handleNextForAuthors = () => {
    setActiveStepForAuthors(prev => prev + 1);
  };

  const handleBackForAuthors = () => {
    setActiveStepForAuthors(prev => prev - 1);
  };

  const handleAuthorToggle = (authorId: string) => {
    setSelectedAuthorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(authorId)) {
        newSet.delete(authorId);
      } else {
        newSet.add(authorId);
      }
      return newSet;
    });
  };

  const handleSelectAllAuthors = () => {
    if (selectedAuthorIds.size === filteredAuthors.length) {
      setSelectedAuthorIds(new Set());
    } else {
      setSelectedAuthorIds(new Set(filteredAuthors.map(a => a.id)));
    }
  };

  // Removal mode handlers
  const handleAuthorToRemoveToggle = (authorId: string) => {
    setSelectedAuthorsToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(authorId)) {
        newSet.delete(authorId);
      } else {
        newSet.add(authorId);
      }
      return newSet;
    });
  };

  const handleSelectAllAuthorsToRemove = () => {
    if (selectedAuthorsToRemove.size === filteredAuthorsForRemoval.length) {
      setSelectedAuthorsToRemove(new Set());
    } else {
      setSelectedAuthorsToRemove(new Set(filteredAuthorsForRemoval.map(a => a.id)));
    }
  };

  const handleBulkUpdateAuthors = async () => {
    if (selectedDocsForAuthors.size === 0 || selectedAuthorIds.size === 0) {
      toast.error('Please select at least one document and one author');
      return;
    }

    setIsUpdatingAuthors(true);
    setAuthorUpdateProgress(0);
    setAuthorUpdateResults({ success: 0, failed: 0 });

    const selectedDocIds = Array.from(selectedDocsForAuthors);
    const authorIdsArray = Array.from(selectedAuthorIds);
    const totalDocs = selectedDocIds.length;
    let completed = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const docId of selectedDocIds) {
      // Strip "template-" prefix if present
      const cleanDocId = docId.replace(/^template-/, '');

      try {
        // Fetch existing authors and merge with new ones (skip duplicates)
        let finalAuthorIds = authorIdsArray;
        let foundInTable: 'template' | 'documents' | null = null;

        // Try to get existing authors from phase_assigned_document_template first
        const { data: templateDoc } = await supabase
          .from('phase_assigned_document_template')
          .select('authors_ids')
          .eq('id', cleanDocId)
          .maybeSingle();

        if (templateDoc) {
          foundInTable = 'template';
          const existingAuthors = Array.isArray(templateDoc.authors_ids)
            ? templateDoc.authors_ids.filter((id): id is string => typeof id === 'string')
            : [];
          finalAuthorIds = [...new Set([...existingAuthors, ...authorIdsArray])];
        } else {
          // Try documents table
          const { data: doc } = await supabase
            .from('documents')
            .select('authors_ids')
            .eq('id', cleanDocId)
            .maybeSingle();

          if (doc) {
            foundInTable = 'documents';
            const existingAuthors = Array.isArray(doc.authors_ids)
              ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
              : [];
            finalAuthorIds = [...new Set([...existingAuthors, ...authorIdsArray])];
          }
        }

        // Update based on where we found the document
        if (foundInTable === 'template') {
          const { error: updateError } = await supabase
            .from('phase_assigned_document_template')
            .update({ authors_ids: finalAuthorIds })
            .eq('id', cleanDocId);

          if (updateError) {
            console.error('Error updating authors:', cleanDocId, updateError);
            failedCount++;
          } else {
            successCount++;
          }
        } else if (foundInTable === 'documents') {
          const { error: updateError } = await supabase
            .from('documents')
            .update({ authors_ids: finalAuthorIds })
            .eq('id', cleanDocId);

          if (updateError) {
            console.error('Error updating authors:', cleanDocId, updateError);
            failedCount++;
          } else {
            successCount++;
          }
        } else {
          console.error('Document not found in any table:', cleanDocId);
          failedCount++;
        }
      } catch (error) {
        console.error('Error updating authors for document:', cleanDocId, error);
        failedCount++;
      }

      completed++;
      setAuthorUpdateProgress(Math.round((completed / totalDocs) * 100));
      setAuthorUpdateResults({ success: successCount, failed: failedCount });
    }

    setIsUpdatingAuthors(false);

    if (successCount > 0) {
      toast.success(`Successfully assigned authors to ${successCount} document(s)`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to update authors for ${failedCount} document(s)`);
    }

    // Move to completion step
    setActiveStepForAuthors(3);
    onCopyComplete?.();
  };

  const handleBulkRemoveAuthors = async () => {
    if (selectedAuthorsToRemove.size === 0) {
      toast.error('Please select at least one author to remove');
      return;
    }

    setIsRemovingAuthors(true);
    setRemovalProgress(0);
    setRemovalResults({ success: 0, failed: 0 });

    const authorIdsToRemove = Array.from(selectedAuthorsToRemove);
    const affectedDocs = documentsWithSelectedAuthors;
    const totalDocs = affectedDocs.length;
    let completed = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const doc of affectedDocs) {
      const cleanDocId = doc.id.replace(/^template-/, '');
      
      try {
        // Get existing authors
        let existingAuthors: string[] = [];
        let foundInTable: 'template' | 'documents' | null = null;

        const { data: templateDoc } = await supabase
          .from('phase_assigned_document_template')
          .select('authors_ids')
          .eq('id', cleanDocId)
          .maybeSingle();

        if (templateDoc) {
          foundInTable = 'template';
          existingAuthors = Array.isArray(templateDoc.authors_ids)
            ? templateDoc.authors_ids.filter((id): id is string => typeof id === 'string')
            : [];
        } else {
          const { data: doc } = await supabase
            .from('documents')
            .select('authors_ids')
            .eq('id', cleanDocId)
            .maybeSingle();

          if (doc) {
            foundInTable = 'documents';
            existingAuthors = Array.isArray(doc.authors_ids)
              ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
              : [];
          }
        }

        // Remove selected authors
        const updatedAuthors = existingAuthors.filter(id => !authorIdsToRemove.includes(id));

        // Update database
        if (foundInTable === 'template') {
          const { error } = await supabase
            .from('phase_assigned_document_template')
            .update({ authors_ids: updatedAuthors })
            .eq('id', cleanDocId);
          if (error) throw error;
        } else if (foundInTable === 'documents') {
          const { error } = await supabase
            .from('documents')
            .update({ authors_ids: updatedAuthors })
            .eq('id', cleanDocId);
          if (error) throw error;
        } else {
          throw new Error('Document not found');
        }

        successCount++;
      } catch (error) {
        console.error('Error removing authors:', error);
        failedCount++;
      }

      completed++;
      setRemovalProgress(Math.round((completed / totalDocs) * 100));
      setRemovalResults({ success: successCount, failed: failedCount });
    }

    setIsRemovingAuthors(false);
    if (successCount > 0) {
      toast.success(`Successfully removed authors from ${successCount} document(s)`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to remove authors from ${failedCount} document(s)`);
    }
    
    setActiveStepForAuthors(3);
    onCopyComplete?.();
  };

  const canProceedFromAuthorStep = (step: number) => {
    if (authorMode === 'remove') {
      switch (step) {
        case 0:
          return selectedAuthorsToRemove.size > 0;
        case 1:
          return documentsWithSelectedAuthors.length > 0;
        case 2:
          return !isRemovingAuthors;
        default:
          return true;
      }
    } else {
      switch (step) {
        case 0:
          return selectedDocsForAuthors.size > 0;
        case 1:
          return selectedAuthorIds.size > 0;
        case 2:
          return !isUpdatingAuthors;
        default:
          return true;
      }
    }
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 0:
        return selectedDocuments.size > 0;
      case 1:
        return selectedProducts.size > 0;
      case 2:
        return !isCopying;
      default:
        return true;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {lang('document.bulk.bulkOperations')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="copy">
                <Copy className="h-4 w-4 mr-2" />
                {lang('document.bulk.bulkCopyDocuments')}
              </TabsTrigger>
              <TabsTrigger value="authors">
                <Users className="h-4 w-4 mr-2" />
                {lang('document.bulk.bulkAuthors')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="copy" className="mt-4">
          <div className="mb-6">
            <Stepper className='max-w-3xl mx-auto' steps={steps} currentStep={activeStep + 1} />
          </div>

          {/* Step 1: Select Documents */}
          {activeStep === 0 && (
            <div className="space-y-4 p-1">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={lang('document.bulk.searchDocuments')}
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSelectAllDocuments}
                  variant="outline"
                >
                  {selectedDocuments.size === filteredDocuments.length ? lang('document.bulk.deselectAll') : lang('document.bulk.selectAll')}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {lang('document.bulk.documentsSelected', { selected: selectedDocuments.size, total: documents.length })}
              </p>

              <ScrollArea className="h-[350px] border rounded-md">
                <div className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleDocumentToggle(doc.id)}
                    >
                      <Checkbox
                        checked={selectedDocuments.has(doc.id)}
                        onCheckedChange={() => handleDocumentToggle(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {doc.document_type && (
                            <Badge variant="outline" className="text-xs">
                              {doc.document_type}
                            </Badge>
                          )}
                          {doc.phase_name && (
                            <Badge variant="outline" className="text-xs">
                              {doc.phase_name}
                            </Badge>
                          )}
                          {doc.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                doc.status === 'Approved' && "border-green-500 text-green-700 dark:text-green-400"
                              )}
                            >
                              {doc.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">{lang('document.bulk.noDocumentsFound')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 2: Select Products/Devices */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={lang('document.bulk.searchDevices')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSelectAllProducts}
                  variant="outline"
                >
                  {selectedProducts.size === filteredProducts.length ? lang('document.bulk.deselectAll') : lang('document.bulk.selectAll')}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {lang('document.bulk.devicesSelected', { selected: selectedProducts.size, total: availableProducts.length })}
              </p>

              {isLoadingProducts ? (
                <div className="flex justify-center items-center p-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <ScrollArea className="h-[350px] border rounded-md">
                  <div className="divide-y">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleProductToggle(product.id)}
                      >
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{product.name}</p>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {product.phase && (
                              <Badge variant="outline" className="text-xs">
                                {product.phase}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                product.status === 'On Track' && "border-green-500 text-green-700 dark:text-green-400",
                                product.status === 'At Risk' && "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                                product.status !== 'On Track' && product.status !== 'At Risk' && "border-red-500 text-red-700 dark:text-red-400"
                              )}
                            >
                              {product.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          {availableProducts.length === 0 ? lang('document.bulk.noOtherDevicesAvailable') : lang('document.bulk.noDevicesFound')}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Step 3: Confirm & Copy */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {lang('document.bulk.copyConfirmation', {
                    docCount: selectedDocuments.size,
                    deviceCount: selectedProducts.size,
                    totalCount: selectedDocuments.size * selectedProducts.size
                  })}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{lang('document.bulk.selectedDocuments')}:</p>
                  <ScrollArea className="h-[200px] border rounded-md p-3">
                    <div className="space-y-2">
                      {documents.filter(d => selectedDocuments.has(d.id)).map(doc => (
                        <Card key={doc.id}>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{doc.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{lang('document.bulk.targetDevices')}:</p>
                  <ScrollArea className="h-[200px] border rounded-md p-3">
                    <div className="space-y-2">
                      {availableProducts.filter(p => selectedProducts.has(p.id)).map(product => (
                        <Card key={product.id}>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{product.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {isCopying && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm">
                    {lang('document.bulk.copyingDocuments', { progress: copyProgress })}
                  </p>
                  <Progress value={copyProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {lang('document.bulk.successFailed', { success: copyResults.success, failed: copyResults.failed })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {activeStep === 3 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">{lang('document.bulk.copyComplete')}</h3>
              <p className="text-sm text-muted-foreground">
                {lang('document.bulk.successfullyCopied', { count: copyResults.success })}
                {copyResults.failed > 0 && ` (${lang('document.bulk.failedCount', { count: copyResults.failed })})`}
              </p>
              <Button onClick={() => {
                handleClose();
                onOpenChange(false);
              }}>
                {lang('common.close')}
              </Button>
            </div>
          )}
            </TabsContent>

            <TabsContent value="authors" className="mt-4">
              <div className="space-y-4 p-1">
                {/* Mode Toggle */}
                <div className="flex items-center justify-center mb-4">
                  <ToggleGroup
                    type="single"
                    value={authorMode}
                    onValueChange={(value) => {
                      if (value === 'add' || value === 'remove') {
                        handleAuthorModeChange(value);
                      }
                    }}
                    className="border rounded-md p-1"
                  >
                    <ToggleGroupItem value="add" aria-label={lang('document.bulk.addAuthors')} className="px-4">
                      <Users className="h-4 w-4 mr-2" />
                      {lang('document.bulk.addAuthors')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="remove" aria-label={lang('document.bulk.removeAuthors')} className="px-4">
                      <UserMinus className="h-4 w-4 mr-2" />
                      {lang('document.bulk.removeAuthors')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="mb-6">
                  <Stepper className='max-w-3xl mx-auto' steps={authorSteps} currentStep={activeStepForAuthors + 1} />
                </div>

                {/* Add Mode: Step 1: Select Documents */}
                {authorMode === 'add' && activeStepForAuthors === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={lang('document.bulk.searchDocuments')}
                          value={documentSearchForAuthors}
                          onChange={(e) => setDocumentSearchForAuthors(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSelectAllDocumentsForAuthors}
                        variant="outline"
                      >
                        {selectedDocsForAuthors.size === filteredDocumentsForAuthors.length ? lang('document.bulk.deselectAll') : lang('document.bulk.selectAll')}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {lang('document.bulk.documentsSelected', { selected: selectedDocsForAuthors.size, total: documents.length })}
                    </p>

                    <ScrollArea className="h-[280px] border rounded-md">
                      <div className="divide-y">
                        {filteredDocumentsForAuthors.map((doc) => {
                          // Get current author names for this document
                          const authorsIdsArray = Array.isArray(doc.authors_ids)
                            ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
                            : [];
                          const currentAuthors = authorsIdsArray
                            .map(id => getAuthorById(id)?.name)
                            .filter(Boolean) as string[];

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => handleDocumentForAuthorsToggle(doc.id)}
                            >
                              <Checkbox
                                checked={selectedDocsForAuthors.has(doc.id)}
                                onCheckedChange={() => handleDocumentForAuthorsToggle(doc.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{doc.name}</p>
                                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                  {doc.document_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {doc.document_type}
                                    </Badge>
                                  )}
                                  {doc.phase_name && (
                                    <Badge variant="outline" className="text-xs">
                                      {doc.phase_name}
                                    </Badge>
                                  )}
                                  {doc.status && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        doc.status === 'Approved' && "border-green-500 text-green-700 dark:text-green-400"
                                      )}
                                    >
                                      {doc.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {/* Current Authors */}
                              <div className="flex-shrink-0 max-w-[200px]">
                                {currentAuthors.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {currentAuthors.slice(0, 2).map((name, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                        {name}
                                      </Badge>
                                    ))}
                                    {currentAuthors.length > 2 && (
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                        +{currentAuthors.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{lang('document.bulk.noAuthors')}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {filteredDocumentsForAuthors.length === 0 && (
                          <div className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">{lang('document.bulk.noDocumentsFound')}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Add Mode: Step 2: Select Authors */}
                {authorMode === 'add' && activeStepForAuthors === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={lang('document.bulk.searchAuthors')}
                          value={authorSearch}
                          onChange={(e) => setAuthorSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSelectAllAuthors}
                        variant="outline"
                        disabled={isLoadingAuthors}
                      >
                        {selectedAuthorIds.size === filteredAuthors.length ? lang('document.bulk.deselectAll') : lang('document.bulk.selectAll')}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {lang('document.bulk.authorsSelected', { selected: selectedAuthorIds.size, total: authors.length })}
                    </p>

                    {isLoadingAuthors ? (
                      <div className="flex justify-center items-center p-8">
                        <Spinner size="md" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[280px] border rounded-md">
                        <div className="divide-y">
                          {filteredAuthors.map((author) => (
                            <div
                              key={author.id}
                              className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => handleAuthorToggle(author.id)}
                            >
                              <Checkbox
                                checked={selectedAuthorIds.has(author.id)}
                                onCheckedChange={() => handleAuthorToggle(author.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{author.name}</p>
                                {author.email && (
                                  <p className="text-xs text-muted-foreground">{author.email}</p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  author.type === 'pending' && "border-yellow-500 text-yellow-700",
                                  author.type === 'custom' && "border-blue-500 text-blue-700",
                                  author.type === 'user' && author.id === currentUserId && "border-green-500 text-green-700 bg-green-50"
                                )}
                              >
                                {author.type === 'pending' ? lang('document.bulk.authorPending') : author.type === 'custom' ? lang('document.bulk.authorCustom') : author.id === currentUserId ? lang('document.bulk.authorYou') : lang('document.bulk.authorUser')}
                              </Badge>
                            </div>
                          ))}
                          {filteredAuthors.length === 0 && (
                            <div className="p-6 text-center">
                              <p className="text-sm text-muted-foreground">{lang('document.bulk.noAuthorsFound')}</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Add Mode: Step 3: Confirm & Update */}
                {authorMode === 'add' && activeStepForAuthors === 2 && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        {lang('document.bulk.assignAuthorsConfirmation', { authorCount: selectedAuthorIds.size, docCount: selectedDocsForAuthors.size })}
                        <span className="block mt-1 text-muted-foreground">
                          {lang('document.bulk.existingAuthorsPreserved')}
                        </span>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{lang('document.bulk.selectedDocuments')}:</p>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          <div className="space-y-2">
                            {documents.filter(d => selectedDocsForAuthors.has(d.id)).map(doc => (
                              <Card key={doc.id}>
                                <CardContent className="p-3">
                                  <p className="text-sm font-medium">{doc.name}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{lang('document.bulk.selectedAuthors')}:</p>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          <div className="space-y-2">
                            {authors.filter(a => selectedAuthorIds.has(a.id)).map(author => (
                              <Card key={author.id}>
                                <CardContent className="p-3">
                                  <p className="text-sm font-medium">{author.name}</p>
                                  {author.email && (
                                    <p className="text-xs text-muted-foreground">{author.email}</p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {isUpdatingAuthors && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm">
                          {lang('document.bulk.updatingAuthors', { progress: authorUpdateProgress })}
                        </p>
                        <Progress value={authorUpdateProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {lang('document.bulk.successFailed', { success: authorUpdateResults.success, failed: authorUpdateResults.failed })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Remove Mode: Step 1: Select Authors to Remove */}
                {authorMode === 'remove' && activeStepForAuthors === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={lang('document.bulk.searchAuthors')}
                          value={authorSearchForRemoval}
                          onChange={(e) => setAuthorSearchForRemoval(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSelectAllAuthorsToRemove}
                        variant="outline"
                        disabled={isLoadingAuthors}
                      >
                        {selectedAuthorsToRemove.size === filteredAuthorsForRemoval.length ? lang('document.bulk.deselectAll') : lang('document.bulk.selectAll')}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {lang('document.bulk.authorsSelected', { selected: selectedAuthorsToRemove.size, total: authors.length })}
                    </p>

                    {isLoadingAuthors ? (
                      <div className="flex justify-center items-center p-8">
                        <Spinner size="md" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[280px] border rounded-md">
                        <div className="divide-y">
                          {filteredAuthorsForRemoval.map((author) => {
                            const docCount = authorDocumentCounts.get(author.id) || 0;
                            return (
                              <div
                                key={author.id}
                                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => handleAuthorToRemoveToggle(author.id)}
                              >
                                <Checkbox
                                  checked={selectedAuthorsToRemove.has(author.id)}
                                  onCheckedChange={() => handleAuthorToRemoveToggle(author.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{author.name}</p>
                                  {author.email && (
                                    <p className="text-xs text-muted-foreground">{author.email}</p>
                                  )}
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:text-blue-800"
                                >
                                  {docCount} {docCount === 1 ? lang('document.bulk.doc') : lang('document.bulk.docs')}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    author.type === 'pending' && "border-yellow-500 text-yellow-700",
                                    author.type === 'custom' && "border-blue-500 text-blue-700",
                                    author.type === 'user' && author.id === currentUserId && "border-green-500 text-green-700 bg-green-50"
                                  )}
                                >
                                  {author.type === 'pending' ? lang('document.bulk.authorPending') : author.type === 'custom' ? lang('document.bulk.authorCustom') : author.id === currentUserId ? lang('document.bulk.authorYou') : lang('document.bulk.authorUser')}
                                </Badge>
                              </div>
                            );
                          })}
                          {filteredAuthorsForRemoval.length === 0 && (
                            <div className="p-6 text-center">
                              <p className="text-sm text-muted-foreground">{lang('document.bulk.noAuthorsFound')}</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Remove Mode: Step 2: Preview Documents */}
                {authorMode === 'remove' && activeStepForAuthors === 1 && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        {lang('document.bulk.documentsWithAuthorsPreview', { count: documentsWithSelectedAuthors.length })}
                      </AlertDescription>
                    </Alert>

                    <ScrollArea className="h-[280px] border rounded-md">
                      <div className="divide-y p-2">
                        {documentsWithSelectedAuthors.map((doc) => {
                          const docAuthorIds = Array.isArray(doc.authors_ids)
                            ? doc.authors_ids.filter((id): id is string => typeof id === 'string')
                            : [];
                          const authorsToRemove = Array.from(selectedAuthorsToRemove)
                            .filter(id => docAuthorIds.includes(id))
                            .map(id => getAuthorById(id)?.name)
                            .filter(Boolean) as string[];
                          const remainingAuthors = docAuthorIds
                            .filter(id => !selectedAuthorsToRemove.has(id))
                            .map(id => getAuthorById(id)?.name)
                            .filter(Boolean) as string[];

                          return (
                            <Card key={doc.id} className="mb-2">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-semibold">{doc.name}</p>
                                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                      {doc.document_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {doc.document_type}
                                        </Badge>
                                      )}
                                      {doc.phase_name && (
                                        <Badge variant="outline" className="text-xs">
                                          {doc.phase_name}
                                        </Badge>
                                      )}
                                      {doc.status && (
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-xs",
                                            doc.status === 'Approved' && "border-green-500 text-green-700 dark:text-green-400"
                                          )}
                                        >
                                          {doc.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {authorsToRemove.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-red-600 mb-1">{lang('document.bulk.authorsToRemove')}:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {authorsToRemove.map((name, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                                              {name}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {remainingAuthors.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{lang('document.bulk.remainingAuthors')}:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {remainingAuthors.map((name, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                              {name}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {remainingAuthors.length === 0 && (
                                      <p className="text-xs text-muted-foreground italic">{lang('document.bulk.noAuthorsWillRemain')}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {documentsWithSelectedAuthors.length === 0 && (
                          <div className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                              {lang('document.bulk.noDocumentsWithSelectedAuthors')}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Remove Mode: Step 3: Confirm & Remove */}
                {authorMode === 'remove' && activeStepForAuthors === 2 && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        {lang('document.bulk.removeAuthorsConfirmation', { authorCount: selectedAuthorsToRemove.size, docCount: documentsWithSelectedAuthors.length })}
                        <span className="block mt-1 text-muted-foreground">
                          {lang('document.bulk.authorsWillBeRemoved')}
                        </span>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{lang('document.bulk.authorsToRemove')}:</p>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          <div className="space-y-2">
                            {authors.filter(a => selectedAuthorsToRemove.has(a.id)).map(author => (
                              <Card key={author.id}>
                                <CardContent className="p-3">
                                  <p className="text-sm font-medium">{author.name}</p>
                                  {author.email && (
                                    <p className="text-xs text-muted-foreground">{author.email}</p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{lang('document.bulk.affectedDocuments')}:</p>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          <div className="space-y-2">
                            {documentsWithSelectedAuthors.map(doc => (
                              <Card key={doc.id}>
                                <CardContent className="p-3">
                                  <p className="text-sm font-medium">{doc.name}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {isRemovingAuthors && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm">
                          {lang('document.bulk.removingAuthors', { progress: removalProgress })}
                        </p>
                        <Progress value={removalProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {lang('document.bulk.successFailed', { success: removalResults.success, failed: removalResults.failed })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Complete (for both modes) */}
                {activeStepForAuthors === 3 && (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <h3 className="text-lg font-semibold">
                      {authorMode === 'remove' ? lang('document.bulk.removalComplete') : lang('document.bulk.updateComplete')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {authorMode === 'remove'
                        ? lang('document.bulk.successfullyRemovedAuthors', { count: removalResults.success }) + (removalResults.failed > 0 ? ` (${lang('document.bulk.failedCount', { count: removalResults.failed })})` : '')
                        : lang('document.bulk.successfullyUpdatedAuthors', { count: authorUpdateResults.success }) + (authorUpdateResults.failed > 0 ? ` (${lang('document.bulk.failedCount', { count: authorUpdateResults.failed })})` : '')
                      }
                    </p>
                    <Button onClick={() => {
                      handleClose();
                      onOpenChange(false);
                    }}>
                      {lang('common.close')}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button onClick={() => {
            handleClose();
            onOpenChange(false);
          }} variant="ghost" disabled={isCopying || isUpdatingAuthors || isRemovingAuthors}>
            {lang('common.cancel')}
          </Button>
          <div className="flex-1" />
          {activeTab === 'copy' && activeStep < 3 && (
            <>
              {activeStep > 0 && (
                <Button onClick={handleBack} variant="outline" disabled={isCopying}>
                  {lang('common.back')}
                </Button>
              )}
              {activeStep < 2 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedFromStep(activeStep)}
                >
                  {lang('common.next')}
                </Button>
              )}
              {activeStep === 2 && (
                <Button
                  onClick={handleCopy}
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {lang('document.bulk.copying')}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {lang('document.bulk.copyDocuments')}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          {activeTab === 'authors' && activeStepForAuthors < 3 && (
            <>
              {activeStepForAuthors > 0 && (
                <Button
                  onClick={handleBackForAuthors}
                  variant="outline"
                  disabled={isUpdatingAuthors || isRemovingAuthors}
                >
                  {lang('common.back')}
                </Button>
              )}
              {activeStepForAuthors < 2 && (
                <Button
                  onClick={handleNextForAuthors}
                  disabled={!canProceedFromAuthorStep(activeStepForAuthors)}
                >
                  {lang('common.next')}
                </Button>
              )}
              {activeStepForAuthors === 2 && authorMode === 'add' && (
                <Button
                  onClick={handleBulkUpdateAuthors}
                  disabled={isUpdatingAuthors}
                >
                  {isUpdatingAuthors ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {lang('document.bulk.updating')}
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      {lang('document.bulk.updateAuthors')}
                    </>
                  )}
                </Button>
              )}
              {activeStepForAuthors === 2 && authorMode === 'remove' && (
                <Button
                  onClick={handleBulkRemoveAuthors}
                  disabled={isRemovingAuthors}
                  variant="destructive"
                >
                  {isRemovingAuthors ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {lang('document.bulk.removing')}
                    </>
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      {lang('document.bulk.removeAuthors')}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
