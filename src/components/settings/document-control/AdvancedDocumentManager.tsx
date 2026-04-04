import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Plus, FileText, Building2, Download, Search, X, ChevronDown, ChevronRight, Tag, Edit, Trash, Filter, FileDown, Package, Brain, FolderOpen } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDocumentAssignmentPhases } from '@/hooks/useDocumentAssignmentPhases';
import { DocumentLibraryPanel } from './DocumentLibraryPanel';
import { EnhancedPhaseDropZones } from './EnhancedPhaseDropZones';
import { SmartAppendCsvImport } from '../SmartAppendCsvImport';
import { AddPhaseDocumentTemplateDialog } from './AddPhaseDocumentTemplateDialog';
// AITemplateImporterDialog moved to Templates tab
import { DocumentItem } from '@/types/client';
import { DocumentTechApplicability } from '@/types/documentTypes';
import { updateDocumentPhases, removeDocumentAssignmentByPhaseName, changeAssignedPhase } from './utils/documentOperations';
import { useComplianceSections } from '@/hooks/useComplianceSections';
import { toast } from 'sonner';
import { DocumentImportDialog } from '../DocumentImportDailog';
// TanStack Table imports
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, createColumnHelper, flexRender, SortingState, ColumnDef, Row } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DocumentCreationService } from '@/services/documentCreationService';

// Add custom CSS for line-clamp utility
const customStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
interface PhaseData {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
    document_type: string;
    status: string;
    tech_applicability?: string; // Make optional to match DocumentAssignmentPhase
    created_at?: string; // Make optional to match DocumentAssignmentPhase
  }>;
}
interface DocumentRow {
  id: string;
  name: string;
  description: string;
  documentType: string;
  techApplicability: string;
  markets: string[];
  classesByMarket: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
  isModified?: boolean;
}
interface Product {
  id: string;
  name: string;
  description?: string;
  article_number?: string;
}
interface HierarchicalRow {
  id: string;
  type: 'phase' | 'document' | 'product';
  phaseName: string;
  documentName?: string;
  documentDescription?: string;
  documentType?: string;
  techApplicability?: string;
  status?: string;
  documentCount?: number;
  assignedCount?: number;
  unassignedCount?: number;
  parentId?: string;
  level: number;
  expanded?: boolean;
  documentId?: string;
  isSystemPhase?: boolean;
  phaseId?: string;
  productId?: string;
  productName?: string;
  documentScope?: 'company_template' | 'product_document' | 'company_document';
  documentReference?: string | null;
}
interface AdvancedDocumentManagerProps {
  companyId: string;
  onDocumentUpdated: (document: DocumentItem) => void;
}

// Product Document Form Component
interface ProductDocumentFormProps {
  products: Product[];
  isLoadingProducts: boolean;
  onSubmit: (formData: {
    name: string;
    description: string;
    documentType: string;
    techApplicability: string;
    productId: string;
  }) => void;
  onCancel: () => void;
}

// Document Data Table Component
interface DocumentDataTableProps {
  data: HierarchicalRow[];
  phases: any[];
  onDeleteDocument: (row: HierarchicalRow) => void;
  onPhaseChange: (documentId: string, newPhaseId: string) => Promise<void>;
  onTogglePhaseExpansion: (phaseId: string) => void;
}
function DocumentDataTable({
  data,
  phases,
  onDeleteDocument,
  onPhaseChange,
  onTogglePhaseExpansion
}: DocumentDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnHelper = createColumnHelper<HierarchicalRow>();
  const columns = useMemo<ColumnDef<HierarchicalRow>[]>(() => [
  // Phase/Document Name Column
  columnHelper.display({
    id: "name",
    header: "Phase / Document",
    cell: ({
      row
    }) => {
      const data = row.original;
      if (data.type === 'phase' || data.type === 'product') {
        const phaseId = data.phaseId || data.id.replace('phase_', '').replace('product_', '');
        return <div className="flex items-center gap-2">
              <button onClick={e => {
            e.stopPropagation();
            onTogglePhaseExpansion(phaseId);
          }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                {data.expanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
              </button>
              <span className="font-semibold text-gray-900">{data.phaseName}</span>
              <Badge variant="outline" className="text-xs">
                {data.documentCount || 0} docs
              </Badge>
            </div>;
      }
      if (data.type === 'document') {
        return <div className="flex flex-col gap-1 pl-6">
              <div className="font-medium text-gray-900">{data.documentName}</div>
              {data.documentDescription && <div className="text-sm text-gray-500 line-clamp-2">
                  {data.documentDescription}
                </div>}
            </div>;
      }
      return null;
    }
  }),
  // Document Type Column
  columnHelper.display({
    id: "documentType",
    header: "Document Type",
    cell: ({
      row
    }) => {
      const data = row.original;
      if (data.type === 'phase' || data.type === 'product') return null;
      if (data.type === 'document') {
        const getTypeConfig = (type: string) => {
          switch (type?.toLowerCase()) {
            case 'template':
              return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
            case 'document':
              return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
            case 'form':
              return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
            default:
              return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
          }
        };
        return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeConfig(data.documentType || '')}`}>
              {data.documentType || 'Unknown'}
            </span>;
      }
      return null;
    }
  }),
  // Tech Applicability Column
  columnHelper.display({
    id: "techApplicability",
    header: "Tech Applicability",
    cell: ({
      row
    }) => {
      const data = row.original;
      if (data.type === 'phase' || data.type === 'product') return null;
      if (data.type === 'document') {
        const getBadgeStyle = (techType: string) => {
          switch (techType?.toLowerCase()) {
            case 'class i':
              return 'bg-green-100 text-green-700 ring-1 ring-green-600/20';
            case 'class ii':
              return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20';
            case 'class iii':
              return 'bg-red-100 text-red-700 ring-1 ring-red-600/20';
            default:
              return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
          }
        };
        return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getBadgeStyle(data.techApplicability || '')}`}>
              {data.techApplicability || 'Not specified'}
            </span>;
      }
      return null;
    }
  }),
  // Phase Assignment Column
  columnHelper.display({
    id: "phaseAssignment",
    header: "Phase Assignment",
    cell: ({
      row
    }) => {
      const data = row.original;
      if (data.type === 'phase' || data.type === 'product') return null;
      if (data.type === 'document') {
        // Determine the current phase assignment
        const currentPhaseId = data.phaseId;
        const currentPhase = currentPhaseId && currentPhaseId !== 'unassigned' ? phases.find(phase => phase.id === currentPhaseId) : null;
        const selectValue = currentPhaseId === 'unassigned' || !currentPhaseId ? 'unassigned' : currentPhaseId;
        return <div className="flex items-center gap-2">
              <Select value={selectValue} onValueChange={value => onPhaseChange(data.documentId || '', value === 'unassigned' ? '' : value)}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {phases.map(phase => <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>;
      }
      return null;
    }
  }),
  // Actions Column
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({
      row
    }) => {
      const data = row.original;
      if (data.type === 'phase' || data.type === 'product') return null;
      if (data.type === 'document') {
        return <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onDeleteDocument(data)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash className="h-3 w-3" />
              </Button>
            </div>;
      }
      return null;
    }
  })], [phases, onDeleteDocument, onPhaseChange, onTogglePhaseExpansion]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });
  return <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>)}
            </TableRow>)}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? table.getRowModel().rows.map(row => <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={row.original.type === 'phase' ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'}>
                {row.getVisibleCells().map(cell => <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>)}
              </TableRow>) : <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No documents found.
              </TableCell>
            </TableRow>}
        </TableBody>
      </Table>
    </div>;
}
function ProductDocumentForm({
  products,
  isLoadingProducts,
  onSubmit,
  onCancel
}: ProductDocumentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'Standard',
    techApplicability: 'All device types',
    productId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData.name.trim() || !formData.productId) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        documentType: 'Standard',
        techApplicability: 'All device types',
        productId: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const documentTypes = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP', 'User Manual', 'Risk Assessment', 'Clinical Evaluation', 'Technical File'];
  const techApplicabilityOptions = ['All device types', 'Software devices', 'Hardware devices', 'Combination devices', 'Implantable devices'];
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Product *</label>
        <Select value={formData.productId} onValueChange={value => setFormData(prev => ({
        ...prev,
        productId: value
      }))} disabled={isLoadingProducts}>
          <SelectTrigger>
            <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => <SelectItem key={product.id} value={product.id}>
                {product.name}
                {product.article_number && ` (${product.article_number})`}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Document Name *</label>
        <Input value={formData.name} onChange={e => setFormData(prev => ({
        ...prev,
        name: e.target.value
      }))} placeholder="Enter document name" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Document Type</label>
        <Select value={formData.documentType} onValueChange={value => setFormData(prev => ({
        ...prev,
        documentType: value
      }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tech Applicability</label>
        <Select value={formData.techApplicability} onValueChange={value => setFormData(prev => ({
        ...prev,
        techApplicability: value
      }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {techApplicabilityOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea value={formData.description} onChange={e => setFormData(prev => ({
        ...prev,
        description: e.target.value
      }))} placeholder="Enter document description (optional)" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.name.trim() || !formData.productId} className="bg-green-600 hover:bg-green-700">
          {isSubmitting ? 'Creating...' : 'Create Product Document'}
        </Button>
      </div>
    </form>;
}
export function AdvancedDocumentManager({
  companyId,
  onDocumentUpdated
}: AdvancedDocumentManagerProps) {
  const { lang } = useTranslation();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  // Removed AI template dialog - now in Templates tab
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAgGridDialog, setShowAgGridDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showMoveConfirmDialog, setShowMoveConfirmDialog] = useState(false);
  const [showRefreshConfirmDialog, setShowRefreshConfirmDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProductDocumentDialog, setShowProductDocumentDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<HierarchicalRow | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'company' | 'product'>('company');
  const [products, setProducts] = useState<Product[]>([]);
  const [productDocuments, setProductDocuments] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const {
    phases,
    isLoading,
    error,
    refreshPhases,
    refreshPhasesSilent,
    allDocumentTemplates,
    fetchAllDocuments,
    updatePhaseDocumentData,
    deletePhaseDocumentData,
    updateProductDocumentData
  } = useDocumentAssignmentPhases(companyId);
  // Find the "No Phase" phase ID — used for Core Device Documents
  const noPhaseId = useMemo(() => {
    const noPhase = phases.find(p => p.name.toLowerCase() === 'no phase');
    return noPhase?.id || null;
  }, [phases]);
  const { sections: complianceSections } = useComplianceSections(companyId);
  // const { canAddPhases } = usePlanPermissions();
  // AG Grid state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [gridApi, setGridApi] = React.useState<any>(null);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [expandedPhases, setExpandedPhases] = React.useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = React.useState(false);
  const [companySpecificDocuments, setCompanySpecificDocuments] = React.useState<DocumentItem[]>([]);
  const [coreProductDocuments, setCoreProductDocuments] = React.useState<DocumentItem[]>([]);
  const [phaseToKeepOpen, setPhaseToKeepOpen] = React.useState<string | null>(null);
  // Track open state of collapsible sections to prevent auto-closing during drag
  const [openSections, setOpenSections] = React.useState<Set<string>>(new Set());
  const [coreOpen, setCoreOpen] = React.useState(false);
  // const companyId = useCompanyId();
  // Function to fetch products for the company
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('id, name, description, article_number').eq('company_id', companyId).eq('is_archived', false).order('name');
      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
        return;
      }
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Function to fetch product-specific documents
  const fetchProductDocuments = async (productId?: string) => {
    try {
      let query = supabase.from('documents').select('*').eq('company_id', companyId).eq('document_scope', 'product_document');
      if (productId && productId !== 'all') {
        query = query.eq('product_id', productId);
      }
      const {
        data,
        error
      } = await query.order('name');
      if (error) {
        console.error('Error fetching product documents:', error);
        toast.error('Failed to load product documents');
        return;
      }
      setProductDocuments(data || []);
    } catch (error) {
      console.error('Error fetching product documents:', error);
      toast.error('Failed to load product documents');
    }
  };

  // Function to handle view change (company vs product)
  const handleViewChange = (view: 'company' | 'product') => {
    setSelectedView(view);
    if (view === 'company') {
      setSelectedProduct('all');
    }
  };

  // Function to handle product selection
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    if (productId !== 'all') {
      setSelectedView('product');
    }
  };

  // Function to fetch company-specific documents from phase_assigned_document_template
  // Company docs = docs with document_scope='company_document' and phase_id=noPhaseId
  const fetchCompanySpecificDocuments = async () => {
    if (!noPhaseId) {
      setCompanySpecificDocuments([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('*')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .eq('phase_id', noPhaseId)
        .eq('is_excluded', false)
        .or('document_reference.is.null,document_reference.not.like.DS-%')
        .order('name');

      if (error) {
        console.error('Error fetching company-specific documents:', error);
        toast.error('Failed to load company-specific documents');
        return;
      }

      // Convert to DocumentItem format
      const companyDocs: DocumentItem[] = (data || []).map(doc => ({
        id: doc.id,
        name: doc.name || '',
        type: doc.document_type || 'Standard',
        techApplicability: doc.tech_applicability || 'All device types',
        description: doc.description || '',
        status: doc.status || 'Not Started',
        phases: [],
        created_at: doc.created_at || new Date().toISOString(),
        reviewers: [],
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        file_type: doc.file_type,
        public_url: doc.public_url,
      }));

      setCompanySpecificDocuments(companyDocs);
    } catch (error) {
      console.error('Error fetching company-specific documents:', error);
      toast.error('Failed to load company-specific documents');
    }
  };

  // Function to save company-specific document (drag-and-drop) to phase_assigned_document_template
  // using the "No Phase" phase ID with document_scope='company_document'
  const saveCompanySpecificDocument = async (document: DocumentItem) => {
    if (!noPhaseId) {
      console.error('No "No Phase" entry found — cannot save company-specific document');
      throw new Error('No Phase entry not found');
    }
    try {
      // First check if document already exists with company_document scope
      const { data: existingDoc } = await supabase
        .from('phase_assigned_document_template')
        .select('id, is_excluded')
        .eq('name', document.name)
        .eq('phase_id', noPhaseId)
        .eq('document_scope', 'company_document')
        .maybeSingle();

      if (existingDoc) {
        // If it was soft-deleted, re-enable it
        if (existingDoc.is_excluded) {
          await supabase
            .from('phase_assigned_document_template')
            .update({ is_excluded: false })
            .eq('id', existingDoc.id);
        }
        return true;
      }

      const { data: inserted, error } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          name: document.name,
          description: document.description,
          document_type: document.type,
          document_scope: 'company_document',
          company_id: companyId,
          phase_id: noPhaseId,
          tech_applicability: document.techApplicability,
          status: document.status || 'Not Started',
          file_name: document.file_name,
          file_path: document.file_path,
          file_size: document.file_size,
          file_type: document.file_type,
          public_url: document.public_url,
          is_excluded: false,
        })
        .select();

      if (error) {
        console.error('Error saving company-specific document:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error saving company-specific document:', error);
      throw error;
    }
  };

  // Function to remove company-specific document from phase_assigned_document_template (soft delete)
  const removeCompanySpecificDocumentFromDB = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update({ is_excluded: true })
        .eq('id', documentId)
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document');

      if (error) {
        console.error('Error removing company-specific document:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing company-specific document:', error);
      throw error;
    }
  };

  // Function to fetch core product documents from phase_assigned_document_template
  // Core docs = docs assigned to the "No Phase" phase
  const fetchCoreProductDocuments = async () => {
    if (!noPhaseId) {
      setCoreProductDocuments([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('*')
        .eq('phase_id', noPhaseId)
        .eq('document_scope', 'company_template')
        .eq('is_excluded', false)
        .order('name');

      if (error) {
        console.error('Error fetching core product documents:', error);
        toast.error('Failed to load core product documents');
        return;
      }

      const coreDocs: DocumentItem[] = (data || []).map(doc => ({
        id: doc.id,
        name: doc.name || '',
        type: doc.document_type || 'Standard',
        techApplicability: doc.tech_applicability || 'All device types',
        description: doc.description || '',
        status: doc.status || 'Not Started',
        phases: [],
        created_at: doc.created_at || new Date().toISOString(),
        reviewers: [],
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        file_type: doc.file_type,
        public_url: doc.public_url,
      }));

      setCoreProductDocuments(coreDocs);
    } catch (error) {
      console.error('Error fetching core product documents:', error);
      toast.error('Failed to load core product documents');
    }
  };

  // Function to save core product document (drag-and-drop) to phase_assigned_document_template
  // using the "No Phase" phase ID
  const saveCoreProductDocument = async (document: DocumentItem) => {
    if (!noPhaseId) {
      console.error('No "No Phase" entry found — cannot save core device document');
      throw new Error('No Phase entry not found');
    }
    try {
      // Check if already exists
      const { data: existingDoc } = await supabase
        .from('phase_assigned_document_template')
        .select('id, is_excluded')
        .eq('name', document.name)
        .eq('phase_id', noPhaseId)
        .eq('document_scope', 'company_template')
        .maybeSingle();

      if (existingDoc) {
        // If it was soft-deleted, re-enable it
        if (existingDoc.is_excluded) {
          await supabase
            .from('phase_assigned_document_template')
            .update({ is_excluded: false })
            .eq('id', existingDoc.id);
        }
        return true;
      }

      const { error } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          name: document.name,
          description: document.description,
          document_type: document.type,
          document_scope: 'company_template',
          company_id: companyId,
          phase_id: noPhaseId,
          tech_applicability: document.techApplicability,
          status: document.status || 'Not Started',
          file_name: document.file_name,
          file_path: document.file_path,
          file_size: document.file_size,
          file_type: document.file_type,
          public_url: document.public_url,
          is_excluded: false,
        });

      if (error) {
        console.error('Error saving core product document:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving core product document:', error);
      throw error;
    }
  };

  // Function to remove core product document from phase_assigned_document_template
  const removeCoreProductDocumentFromDB = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update({ is_excluded: true })
        .eq('id', documentId);

      if (error) {
        console.error('Error removing core product document:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing core product document:', error);
      throw error;
    }
  };

  // Function to refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([refreshPhases(), fetchAllDocuments(), fetchProducts(), fetchProductDocuments(selectedProduct), fetchCompanySpecificDocuments(), fetchCoreProductDocuments()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Function to refresh all data silently (without loading state)
  const refreshAllDataSilent = async () => {
    try {
      await Promise.all([refreshPhasesSilent(), fetchAllDocuments(), fetchProducts(), fetchProductDocuments(selectedProduct), fetchCompanySpecificDocuments(), fetchCoreProductDocuments()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Function to move document from assigned phase to unassigned
  const moveDocumentToUnassigned = async (documentName: string, phaseName: string, companyId: string, documentId: string) => {
    try {
      // Find the phase by name for this company
      const phase = phases?.find(p => p.name === phaseName);
      if (!phase) {
        throw new Error(`Phase "${phaseName}" not found`);
      }

      // First, get the document record to find its ID
      const {
        data: documentRecord,
        error: fetchError
      } = await supabase.from('phase_assigned_document_template').select('id').eq('id', documentId)
      // .eq('phase_id', phase.id)
      .maybeSingle();
      if (fetchError) {
        console.error("Error fetching document record:", fetchError);
        throw new Error("Error finding document record");
      }
      if (!documentRecord) {
        throw new Error("Document record not found");
      }

      // Before deleting, nullify any references in the documents table
      const {
        error: docUpdateError
      } = await supabase.from('documents').update({
        template_source_id: null
      }).eq('template_source_id', documentRecord.id);
      if (docUpdateError) {
        console.error("Error updating document references:", docUpdateError);
        // Continue anyway - this might not be critical
      }

      // Now delete the specific assignment record for this document and phase
      const {
        error: deleteError
      } = await supabase.from('phase_assigned_document_template').delete().eq('id', documentId);
      if (deleteError) {
        console.error("Error deleting phase assignment:", deleteError);
        throw new Error("Error removing document from phase");
      }

      // Check if this document has any remaining phase assignments for this company
      const {
        data: remainingAssignments,
        error: checkError
      } = await supabase.from('phase_assigned_document_template').select(`
          id,
          company_phases!inner(name, company_id)
        `).eq('name', documentName).eq('company_phases.company_id', companyId).not('phase_id', 'is', null);
      if (checkError) {
        console.error("Error checking remaining assignments:", checkError);
      }
      // If no remaining assignments, create an unassigned record
      // if (!remainingAssignments || remainingAssignments.length === 0) {
      const {
        data: unassignedRecord,
        error: insertError
      } = await supabase.from('company_document_templates').select('*').eq('name', documentName).eq('company_id', companyId).maybeSingle();
      if (!unassignedRecord) {
        const {
          data: unassignedRecord,
          error: insertError
        } = await supabase.from('company_document_templates').insert({
          name: documentName,
          document_type: 'Standard',
          company_id: companyId
        }).select().single();
      }
      // if (insertError) {
      //   console.error("Error creating unassigned record:", insertError);
      //   throw new Error("Error creating unassigned document record");
      // }({
      //     name: documentName,
      //     // phase_id: null,
      //     // status: 'Not Started',
      //     document_type: 'Standard',
      //     company_id: companyId
      //   });
      //   const { error: insertError } = await supabase
      //     .from('company_document_templates')
      //     .insert({
      //       name: documentName,
      //       // phase_id: null,
      //       // status: 'Not Started',
      //       document_type: 'Standard',
      //       company_id: companyId
      //     });

      //   if (insertError) {
      //     console.error("Error creating unassigned record:", insertError);
      //     throw new Error("Error creating unassigned document record");
      //   }

      //   console.log(`Successfully created unassigned record for "${documentName}"`);
      // // }  

      return true;
    } catch (error) {
      console.error('Error moving document to unassigned:', error);
      throw error;
    }
  };

  // Handle dialog open events to refresh data
  const handleImportDialogOpen = async (open: boolean) => {
    setImportDialogOpen(open);
    if (open) {
      await refreshAllData();
    }
  };
  const handleAddTemplateDialogOpen = async (open: boolean) => {
    setAddTemplateDialogOpen(open);
    if (open) {
      await refreshAllData();
    }
  };

  // Special handler for adding document from AG Grid dialog
  const handleAddDocumentFromGrid = async () => {
    // Close the AG Grid dialog first
    setShowAgGridDialog(false);
    // Wait a bit for the dialog to close, then open the add document dialog
    setTimeout(() => {
      setAddTemplateDialogOpen(true);
    }, 100);
  };

  // // Special handler for importing document from AG Grid dialog
  // const handleImportDocumentFromGrid = async () => {
  //   // Close the AG Grid dialog first
  //   setShowAgGridDialog(false);
  //   // Wait a bit for the dialog to close, then open the import document dialog
  //   setTimeout(() => {
  //     setShowImportDialog(true);
  //   }, 100);
  // };

  // Handler for creating product-specific document
  const handleCreateProductDocument = async (formData: {
    name: string;
    description: string;
    documentType: string;
    techApplicability: string;
    productId: string;
  }) => {
    try {
      const documentId = await DocumentCreationService.createDocument({
        name: formData.name,
        description: formData.description,
        documentType: formData.documentType,
        scope: 'product_document',
        companyId,
        productId: formData.productId,
        techApplicability: formData.techApplicability
      });
      if (documentId) {
        toast.success(`Device document "${formData.name}" created successfully`);
        await refreshAllData();
        setShowProductDocumentDialog(false);
      }
    } catch (error) {
      console.error('Error creating product document:', error);
      toast.error('Failed to create product document');
    }
  };
  const handleShowImportDialogOpen = async (open: boolean) => {
    setShowImportDialog(open);
    if (open) {
      await refreshAllData();
    }
  };
  const handleAgGridDialogOpen = async (open: boolean) => {
    setShowAgGridDialog(open);
    if (open) {
      await refreshAllData();
    } else {
      // Collapse all documents when dialog closes
      setExpandedPhases(new Set());
    }
  };
  const {
    documentsByPhase,
    phaseNames,
    allDocuments
  } = useMemo(() => {
    const docsByPhase: Record<string, DocumentItem[]> = {};
    const names: {
      id?: string;
      name: string;
      is_continuous_process: boolean;
      compliance_section_ids?: string[];
    }[] = [];
    const allDocs: DocumentItem[] = [];
    const seenDocuments = new Set<string>();

    // First, process documents from phases (filter out "No Phase")
    phases
      .filter(phase => phase.name.toLowerCase() !== 'no phase')
      .forEach(phase => {
      names.push({
        id: (phase as any).id,
        name: phase.name,
        is_continuous_process: (phase as any).is_continuous_process,
        compliance_section_ids: (phase as any).compliance_section_ids || []
      });
      docsByPhase[phase.name] = phase.documents.map(doc => {
        const validTechApplicability: DocumentTechApplicability = doc.tech_applicability && ["All device types", "Software devices", "Hardware devices", "Combination devices", "Implantable devices"].includes(doc.tech_applicability) ? doc.tech_applicability as DocumentTechApplicability : "All device types";
        // Resolve section names for this phase (via phase_id on sections + legacy fallback)
        const phaseId = (phase as any).id;
        const phaseSectionsViaPhaseId = complianceSections?.filter(s => (s as any).phase_id === phaseId) || [];
        const phaseSectionIds: string[] = (phase as any).compliance_section_ids || [];
        const legacySectionNames = phaseSectionIds
          .map((id: string) => complianceSections?.find(s => s.id === id)?.name)
          .filter((name: string | undefined): name is string => !!name);
        const phaseSectionNames = phaseSectionsViaPhaseId.length > 0
          ? phaseSectionsViaPhaseId.map(s => s.name)
          : legacySectionNames;

        const documentItem: DocumentItem = {
          id: doc.id,
          name: doc.name,
          type: doc.document_type || 'Standard',
          techApplicability: validTechApplicability,
          description: '',
          status: doc.status || 'Not Started',
          phases: [phase.name],
          created_at: doc.created_at || new Date().toISOString(),
          reviewers: [],
          file_name: doc.file_name,
          file_path: doc.file_path,
          file_size: doc.file_size,
          file_type: doc.file_type,
          public_url: doc.public_url,

        };
        // Carry section data through
        (documentItem as any).sub_section = (doc as any).sub_section || null;
        (documentItem as any).section_ids = (doc as any).section_ids || null;
        (documentItem as any).sectionNames = [...phaseSectionNames];

        // Add to all documents if not already seen, merge section data and phase names if duplicate
        if (!seenDocuments.has(doc.name)) {
          seenDocuments.add(doc.name);
          allDocs.push(documentItem);
        } else {
          const existing = allDocs.find(d => d.name === doc.name);
          if (existing) {
            // Add this phase name if not already present
            if (!existing.phases.includes(phase.name)) {
              existing.phases.push(phase.name);
            }
            // Merge section names from this phase
            const existingSections: string[] = (existing as any).sectionNames || [];
            phaseSectionNames.forEach((name: string) => {
              if (!existingSections.includes(name)) {
                existingSections.push(name);
              }
            });
            (existing as any).sectionNames = existingSections;
            if (!(existing as any).sub_section && (doc as any).sub_section) {
              (existing as any).sub_section = (doc as any).sub_section;
              (existing as any).section_ids = (doc as any).section_ids;
            }
          }
        }
        return documentItem;
      });
    });

    // Now, push allDocumentTemplates into allDocs
    if (allDocumentTemplates) {
      allDocumentTemplates.forEach(template => {
        const techApplicability = (template as any).tech_applicability || 'All device types';
        // console.log('template 123123', techApplicability);
        const documentItem: DocumentItem = {
          id: template.id,
          name: template.name,
          type: (template as any).document_type || template.type || 'Standard',
          techApplicability: techApplicability,
          description: template.description || '',
          status: template.status || 'Not Started',
          phases: [],
          // Document templates might not have any assigned phases initially
          created_at: template.created_at || new Date().toISOString(),
          reviewers: [],
          // Include file properties from template
          file_name: (template as any).file_name,
          file_path: (template as any).file_path,
          file_size: (template as any).file_size,
          file_type: (template as any).file_type,
          public_url: (template as any).public_url,
        };
        // Carry section data through
        (documentItem as any).sub_section = (template as any).sub_section || null;
        (documentItem as any).section_ids = (template as any).section_ids || null;

        // Add to allDocs if not already seen, merge section data if duplicate
        if (!seenDocuments.has(template.name)) {
          seenDocuments.add(template.name);
          allDocs.push(documentItem);
        } else {
          const existing = allDocs.find(d => d.name === template.name);
          if (existing && !(existing as any).sub_section && (template as any).sub_section) {
            (existing as any).sub_section = (template as any).sub_section;
            (existing as any).section_ids = (template as any).section_ids;
          }
        }
      });
    }
    return {
      documentsByPhase: docsByPhase,
      phaseNames: names,
      allDocuments: allDocs
    };
  }, [phases, allDocumentTemplates, complianceSections]);
  useEffect(() => {
    fetchAllDocuments();
    fetchProducts();
    fetchCompanySpecificDocuments();
    fetchCoreProductDocuments();
  }, [noPhaseId]);
  useEffect(() => {
    if (selectedProduct) {
      fetchProductDocuments(selectedProduct);
    }
  }, [selectedProduct]);

  // Create hierarchical data structure for AG Grid
  const hierarchicalData = React.useMemo(() => {
    const result: HierarchicalRow[] = [];
    const phaseMap = new Map<string, HierarchicalRow>();

    // Show company documents only when in company view
    if (selectedView === 'company') {
      // First, create phase summary rows
      if (phases && Array.isArray(phases)) {
        phases.forEach(phase => {
          const phaseDocuments = phase.documents || [];
          const assignedCount = phaseDocuments.length;
          const unassignedCount = 0; // We'll calculate this from allDocumentTemplates

          const phaseRow: HierarchicalRow = {
            id: `phase_${phase.id}`,
            type: 'phase',
            phaseName: phase.name || 'Unknown Phase',
            documentCount: phaseDocuments.length,
            assignedCount,
            unassignedCount,
            level: 0,
            expanded: expandedPhases.has(phase.id),
            isSystemPhase: false,
            // You can set this based on your phase data
            phaseId: phase.id
          };
          phaseMap.set(phase.id, phaseRow);
          result.push(phaseRow);

          // Add document rows if phase is expanded
          if (expandedPhases.has(phase.id)) {
            phaseDocuments.forEach(doc => {
              // console.log('doc 87897897', doc);
              const documentRow: HierarchicalRow = {
                id: `document_${doc.id}`,
                type: 'document',
                phaseName: phase.name || 'Unknown Phase',
                documentName: doc.name || 'Unknown Document',
                documentDescription: '',
                // Add description if available
                documentType: doc.document_type || 'Standard',
                techApplicability: doc.tech_applicability || 'All device types',
                status: doc.status || 'Not Started',
                parentId: `phase_${phase.id}`,
                level: 1,
                documentId: doc.id,
                phaseId: phase.id,
                documentScope: 'company_template',
                documentReference: (doc as any).document_reference || null
                // docTest:doc
              };
              result.push(documentRow);
            });
          }
        });
      }

      // Add unassigned documents as a separate phase
      if (allDocumentTemplates && Array.isArray(allDocumentTemplates)) {
        const unassignedDocs = allDocumentTemplates.filter(template => {
          // Check if this template is not assigned to any phase
          return !phases.some(phase => phase.documents.some(doc => doc.name === template.name));
        });
        if (unassignedDocs.length > 0) {
          const unassignedPhaseRow: HierarchicalRow = {
            id: 'phase_unassigned',
            type: 'phase',
            phaseName: 'Unassigned Documents',
            documentCount: unassignedDocs.length,
            assignedCount: 0,
            unassignedCount: unassignedDocs.length,
            level: 0,
            expanded: expandedPhases.has('unassigned'),
            isSystemPhase: false,
            phaseId: 'unassigned'
          };
          result.push(unassignedPhaseRow);

          // Add unassigned document rows if expanded
          if (expandedPhases.has('unassigned')) {
            unassignedDocs.forEach(doc => {
              const documentRow: HierarchicalRow = {
                id: `document_${doc.id}`,
                type: 'document',
                phaseName: 'Unassigned Documents',
                documentName: doc.name || 'Unknown Document',
                documentDescription: doc.description || '',
                documentType: (doc as any).document_type || 'Standard',
                techApplicability: (doc as any).tech_applicability || 'All device types',
                status: doc.status || 'Not Started',
                parentId: 'phase_unassigned',
                level: 1,
                documentId: doc.id,
                documentScope: 'company_document',
                documentReference: (doc as any).document_reference || null
              };
              result.push(documentRow);
            });
          }
        }
      }
    }

    // Show product documents only when in product view
    if (selectedView === 'product' && productDocuments && Array.isArray(productDocuments)) {
      // Group documents by product
      const documentsByProduct = new Map<string, any[]>();
      productDocuments.forEach(doc => {
        const productId = doc.product_id || 'unknown';
        if (!documentsByProduct.has(productId)) {
          documentsByProduct.set(productId, []);
        }
        documentsByProduct.get(productId)!.push(doc);
      });

      // Create product sections - filter by selected product if specified
      documentsByProduct.forEach((docs, productId) => {
        // If a specific product is selected, only show that product
        if (selectedProduct !== 'all' && productId !== selectedProduct) {
          return;
        }
        const product = products.find(p => p.id === productId);
        const productName = product?.name || 'Unknown Product';
        const productRow: HierarchicalRow = {
          id: `product_${productId}`,
          type: 'product',
          phaseName: `Product: ${productName}`,
          documentCount: docs.length,
          assignedCount: docs.length,
          unassignedCount: 0,
          level: 0,
          expanded: expandedPhases.has(`product_${productId}`),
          isSystemPhase: false,
          productId: productId,
          productName: productName,
          phaseId: `product_${productId}`
        };
        result.push(productRow);

        // Add product document rows if expanded
        if (expandedPhases.has(`product_${productId}`)) {
          docs.forEach(doc => {
            const documentRow: HierarchicalRow = {
              id: `document_${doc.id}`,
              type: 'document',
              phaseName: `Product: ${productName}`,
              documentName: doc.name || 'Unknown Document',
              documentDescription: doc.description || '',
              documentType: doc.document_type || 'Standard',
              techApplicability: doc.tech_applicability || 'All device types',
              status: doc.status || 'Not Started',
              parentId: `product_${productId}`,
              level: 1,
              documentId: doc.id,
              productId: productId,
              productName: productName,
              documentScope: 'product_document'
            };
            result.push(documentRow);
          });
        }
      });
    }

    // Apply search filter if present
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return result.filter(row => {
        if (row.type === 'phase' || row.type === 'product') {
          return row.phaseName.toLowerCase().includes(searchLower);
        } else {
          return row.documentName?.toLowerCase().includes(searchLower) || row.documentDescription?.toLowerCase().includes(searchLower) || row.phaseName.toLowerCase().includes(searchLower) || row.documentType?.toLowerCase().includes(searchLower) || row.productName?.toLowerCase().includes(searchLower);
        }
      });
    }
    return result;
  }, [phases, allDocumentTemplates, expandedPhases, searchTerm, selectedView, selectedProduct, productDocuments, products]);

  // Toggle phase expansion
  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // AG Grid event handlers - removed since AG Grid is no longer used
  const onDragStarted = (event: any) => {
    // const row = (event as any).node?.data as HierarchicalRow;
    // if (row?.type === 'document') {
    //   console.log('Started dragging document:', row.documentName);
    // }
    // document.body.style.cursor = 'grabbing';
  };
  const onDragStopped = (event: any) => {
    // document.body.style.cursor = 'default';
    // console.log('Stopped dragging');
  };
  const onRowDragEnd = (event: any) => {
    // const draggedRow = event.node?.data as HierarchicalRow;
    // const overRow = event.overNode?.data as HierarchicalRow;
    // Handle drag and drop logic here
  };
  const onCellEditingStopped = async (event: any) => {
    // console.log('onCellEditingStopped', event);
    // const row = event.data as HierarchicalRow;
    // console.log('onCellEditingStopped', row);
  };

  // Custom cell renderers for hierarchical display
  const PhaseNameCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'phase') {
      return <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => togglePhaseExpansion(row.phaseId || row.id)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              {row.expanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
            </button>
            <span className="font-semibold text-gray-900">{row.phaseName}</span>
          </div>
        </div>;
    }
    return null;
  };
  const DocumentInfoCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'phase') {
      return <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {row.documentCount || 0} document{row.documentCount !== 1 ? 's' : ''}
          </span>
        </div>;
    }
    if (row.type === 'document') {
      return <div className="flex flex-col gap-1">
          <div className="font-medium text-gray-900">{row.documentName}</div>
          {row.documentDescription && <div className="text-sm text-gray-500 line-clamp-2">
              {row.documentDescription}
            </div>}
        </div>;
    }
    return null;
  };
  const TypeCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'phase') {
      return null;
    }
    if (row.type === 'document') {
      const getTypeConfig = (type: string) => {
        switch (type?.toLowerCase()) {
          case 'template':
            return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
          case 'document':
            return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
          case 'form':
            return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
          default:
            return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
        }
      };
      return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeConfig(row.documentType || '')}`}>
          {row.documentType || 'Unknown'}
        </span>;
    }
    return null;
  };
  const TechApplicabilityCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'phase') {
      return null;
    }
    if (row.type === 'document') {
      const getBadgeStyle = (techType: string) => {
        switch (techType?.toLowerCase()) {
          case 'class i':
            return 'bg-green-100 text-green-700 ring-1 ring-green-600/20';
          case 'class ii':
            return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20';
          case 'class iii':
            return 'bg-red-100 text-red-700 ring-1 ring-red-600/20';
          default:
            return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
        }
      };
      return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getBadgeStyle(row.techApplicability || '')}`}>
          {row.techApplicability || 'Not specified'}
        </span>;
    }
    return null;
  };
  const PhaseAssignmentCellRenderer = (props: any) => {
    // console.log("Props PhaseAssignmentCellRenderer",props);
    const row = props.data as HierarchicalRow;
    if (row.type === 'phase') {
      return null;
    }
    if (row.type === 'document') {
      const handlePhaseChange = async (newPhaseId: string) => {
        if (!row.documentId) return;
        try {
          // const result = await changeAssignedPhase(
          //   row.documentId,
          //   newPhaseId,
          //   companyId
          // );

          // if (result.success) {
          //   toast.success('Document phase updated successfully');
          //   refreshAllData();
          // } else {
          //   toast.error(result.error || 'Failed to update document phase');
          // }
          toast.success('Document phase updated successfully');
        } catch (error) {
          console.error('Error updating document phase:', error);
          toast.error('Failed to update document phase');
        }
      };
      const getDisplayValue = () => {
        if (row.phaseId && row.phaseId !== 'unassigned') {
          const phase = phases.find(p => p.id === row.phaseId);
          return phase ? phase.name : 'Unknown Phase';
        }
        return 'Unassigned';
      };
      return <div className="flex items-center gap-2">
          <Select value={row.phaseId === 'unassigned' || !row.phaseId ? 'unassigned' : row.phaseId} onValueChange={value => handlePhaseChange(value === 'unassigned' ? '' : value)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {phases.map(phase => <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>;
    }
    return null;
  };
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const {
      destination,
      source,
      draggableId
    } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Handle drag from library to company-specific documents
    if (source.droppableId === 'document-library' && destination.droppableId === 'company-specific-docs') {
      const documentName = draggableId.replace('doc-', '');
      const document = allDocuments.find(doc => doc.name === documentName);
      if (!document) return;

      // Check if already in company-specific documents
      if (companySpecificDocuments.some(doc => doc.name === documentName)) {
        toast.info(`Document "${documentName}" is already in company-specific documents`);
        return;
      }


      try {
        // Save to database first
        await saveCompanySpecificDocument(document);

        // Refresh from database to ensure consistency
        await fetchCompanySpecificDocuments();

        toast.success(`Document "${documentName}" added to company-specific documents`);
      } catch (error) {
        console.error('Error adding document to company-specific:', error);
        toast.error('Failed to add document to company-specific documents');
      }
    }
    // Handle drag from library to core product documents
    else if (source.droppableId === 'document-library' && destination.droppableId === 'core-product-docs') {
      const documentName = draggableId.replace('doc-', '');
      const document = allDocuments.find(doc => doc.name === documentName);
      if (!document) return;


      // Check if already in core product documents (check both original name and "Core: " prefixed name)
      const coreDocumentName = `Core: ${documentName}`;
      if (coreProductDocuments.some(doc => doc.name === documentName) || 
          coreProductDocuments.some(doc => doc.name === coreDocumentName)) {
        toast.info(`Document "${documentName}" is already in core product documents`);
        return;
      }

      try {
        // Save to database first
        await saveCoreProductDocument(document);
        
        // Add to core product documents state (with original name for display)
        const updatedCoreDocs = [...coreProductDocuments, document];
        setCoreProductDocuments(updatedCoreDocs);
        
        toast.success(`Document "${documentName}" added to core product documents`);
      } catch (error) {
        console.error('Error adding document to core product:', error);
        toast.error('Failed to add document to core product documents');
      }
    }
    // Handle drag from library to phase (or section within a phase)
    else if (source.droppableId === 'document-library' && destination.droppableId.startsWith('phase-')) {
      // Parse section from droppable ID if present: "phase-{name}__sectionid-{id}"
      let rawPhaseName: string;
      let dropSectionId: string | null = null;
      let dropSectionName: string | null = null;

      if (destination.droppableId.includes('__sectionid-')) {
        const [phasePart, sectionIdPart] = destination.droppableId.split('__sectionid-');
        rawPhaseName = phasePart.replace('phase-', '');
        dropSectionId = sectionIdPart;
        // Resolve section name from ID
        const matchedSection = complianceSections?.find(s => s.id === dropSectionId);
        dropSectionName = matchedSection?.name || null;
      } else if (destination.droppableId.includes('__section-')) {
        // Legacy format fallback
        const [phasePart, sectionPart] = destination.droppableId.split('__section-');
        rawPhaseName = phasePart.replace('phase-', '');
        dropSectionName = sectionPart;
        const matchedSection = complianceSections?.find(s => s.name === dropSectionName);
        dropSectionId = matchedSection?.id || null;
      } else {
        rawPhaseName = destination.droppableId.replace('phase-', '').replace('phase-header-', '');
      }

      // Clean the phase name to remove number prefixes like "(01)"
      const phaseName = rawPhaseName.replace(/^\(0*\d+\)\s*/, '').trim();
      const documentName = draggableId.replace('doc-', '');
      const document = allDocuments.find(doc => doc.name === documentName);
      if (!document) return;

      // Check if already assigned to this phase
      if (document.phases?.includes(phaseName)) {
        // If dropped onto a section, update the section_ids on the existing assignment
        if (dropSectionId) {
          try {
            const phaseData = phases.find(p => p.name === phaseName);
            if (phaseData) {
              const { error } = await supabase
                .from('phase_assigned_document_template')
                .update({
                  sub_section: dropSectionName,
                  section_ids: [dropSectionId]
                })
                .eq('phase_id', phaseData.id)
                .eq('name', documentName);

              if (!error) {
                toast.success(`Document moved to section "${dropSectionName}"`);
                setPhaseToKeepOpen(phaseName);
                refreshPhasesSilent();
                fetchAllDocuments();
              } else {
                toast.error('Failed to move document to section');
              }
            }
          } catch (err) {
            console.error('Error updating document section:', err);
            toast.error('Failed to move document to section');
          }
        } else {
          toast.info(`Document "${documentName}" is already assigned to ${phaseName}`);
        }
        return;
      }
      const newPhases = [...(document.phases || []), phaseName];

      // Extract document properties from the document object
      const documentProperties = {
        document_type: document.type || 'Standard',
        file_path: (document as any).file_path || '',
        file_name: (document as any).file_name || '',
        file_size: (document as any).file_size || 0,
        file_type: (document as any).file_type || '',
        public_url: (document as any).public_url || null,
        sub_section: dropSectionName || (document as any).sub_section || null,
        section_ids: dropSectionId ? [dropSectionId] : ((document as any).section_ids || null),
      };

      try {
        // Set the phase to keep open BEFORE the assignment so it opens immediately
        setPhaseToKeepOpen(phaseName);

        const success = await updateDocumentPhases(documentName, newPhases, documentProperties);
        if (success) {
          toast.success(`Document assigned to ${phaseName}`);
          
          // Keep the phase open after refresh
          setPhaseToKeepOpen(phaseName);
          
          // Refresh both phases and documents silently (without loading state)
          Promise.all([
            refreshPhasesSilent(),
            fetchAllDocuments()
          ]).then(() => {
            // After refresh completes, ensure phase stays open
            setTimeout(() => {
              setPhaseToKeepOpen(phaseName);
            }, 100);
          }).catch(error => {
            console.error('Error refreshing data:', error);
          });
          
          // Clear phaseToKeepOpen after a delay to allow the component to process it
          // The EnhancedPhaseDropZones will handle keeping it open via phasesToKeepOpenRef
          setTimeout(() => {
            setPhaseToKeepOpen(null);
          }, 1500);
        }
      } catch (error) {
        console.error('Error assigning document:', error);
        toast.error('Failed to assign document to phase');
        // Clear phaseToKeepOpen on error
        setPhaseToKeepOpen(null);
      }
    }
  };
  const handleRemoveDocument = async (document: DocumentItem, phaseName: string) => {
    try {
      // Clean the phase name to remove number prefixes like "(01)"
      const cleanPhaseName = phaseName.replace(/^\(0*\d+\)\s*/, '').trim();
      await removeDocumentAssignmentByPhaseName(cleanPhaseName, document.name, companyId);
      toast.success(`Document removed from ${cleanPhaseName}`);
      // Refresh silently without loading state
      refreshPhasesSilent();
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Error removing document from phase');
    }
  };

  const handleRemoveCompanyDocument = async (document: DocumentItem) => {
    try {
      // Remove from database first
      await removeCompanySpecificDocumentFromDB(document.id);
      
      // Remove from state
      setCompanySpecificDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      toast.success(`Document "${document.name}" removed from company-specific documents`);
    } catch (error) {
      console.error('Error removing company-specific document:', error);
      toast.error('Failed to remove document from company-specific documents');
    }
  };

  const handleRemoveCoreProductDocument = async (document: DocumentItem) => {
    try {
      // Remove from database first
      await removeCoreProductDocumentFromDB(document.id);
      
      // Remove from state
      setCoreProductDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      toast.success(`Document "${document.name}" removed from core product documents`);
    } catch (error) {
      console.error('Error removing core product document:', error);
      toast.error('Failed to remove document from core product documents');
    }
  };
  const handleDeleteDocument = async (row: HierarchicalRow) => {
    if (!row.documentId || !row.documentName) {
      toast.error('Cannot delete document: Missing document information');
      return;
    }
    // Safety guard: prevent deletion of enterprise content documents (Document Studio)
    if (row.documentReference?.startsWith('DS-')) {
      toast.error('This is an enterprise content document managed from Document Studio. It cannot be deleted from Settings.');
      return;
    }
    setDocumentToDelete(row);
    if (row.phaseName === 'Unassigned Documents') {
      // Step 2: Permanently delete from unassigned documents
      setShowDeleteConfirmDialog(true);
    } else {
      // Step 1: Move document from assigned phase to unassigned
      setShowMoveConfirmDialog(true);
    }
  };
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      await deletePhaseDocumentData(documentToDelete.documentId);
      toast.success(`Document "${documentToDelete.documentName}" permanently deleted`);
      // Refresh silently without loading state
      refreshAllDataSilent();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setShowDeleteConfirmDialog(false);
      setDocumentToDelete(null);
    }
  };
  const handleConfirmMove = async () => {
    if (!documentToDelete) return;
    try {
      await moveDocumentToUnassigned(documentToDelete.documentName, documentToDelete.phaseName, companyId, documentToDelete.documentId);
      toast.success(`Document "${documentToDelete.documentName}" moved to unassigned documents`);
      // Refresh silently without loading state
      refreshAllDataSilent();
    } catch (error) {
      console.error('Error moving document:', error);
      toast.error('Failed to move document');
    } finally {
      setShowMoveConfirmDialog(false);
      setDocumentToDelete(null);
    }
  };
  // Column definitions for hierarchical grid
  const columnDefs: any[] = [{
    headerName: "",
    field: "phaseName",
    width: 300,
    cellRenderer: PhaseNameCellRenderer,
    rowDrag: (params: any) => {
      const row = params.data as HierarchicalRow;
      return row.type === 'document'; // Only allow dragging for document rows, not phase rows
    }
  }, {
    headerName: "Document Information",
    field: "documentDescription",
    width: 350,
    cellRenderer: (props: any) => {
      const row = props.data as HierarchicalRow;
      if (row.type === 'phase') return null;
      if (row.type === 'document') {
        return <div className="flex flex-col gap-1">
              <div className="font-medium text-gray-900">{row.documentName}</div>
              {row.documentDescription && <div className="text-sm text-gray-500 line-clamp-2">
                  {row.documentDescription}
                </div>}
            </div>;
      }
      return null;
    }
  }, {
    headerName: "Phase Assignment",
    field: "phaseAssignment",
    width: 200,
    cellRenderer: (props: any) => {
      const row = props.data as HierarchicalRow;
      if (row.type === 'phase') return null;
      if (row.type === 'document') {
        const handlePhaseChange = async (newPhaseId: string) => {
          if (!row.documentId) return;
          try {
            // const result = await changeAssignedPhase(
            //   row.documentId,
            //   newPhaseId,
            //   companyId
            // );

            // if (result.success) {
            //   toast.success('Document phase updated successfully');
            //   refreshAllData();
            // } else {
            //   toast.error(result.error || 'Failed to update document phase');
            // }
            toast.success('Document phase updated successfully');
          } catch (error) {
            console.error('Error updating document phase:', error);
            toast.error('Failed to update document phase');
          }
        };
        return <div className="flex items-center gap-2">
              <Select value={row.phaseId === 'unassigned' || !row.phaseId ? 'unassigned' : row.phaseId} onValueChange={value => handlePhaseChange(value === 'unassigned' ? '' : value)}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {phases.map(phase => <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>;
      }
      return null;
    }
  }, {
    headerName: "Tech Applicability",
    field: "techApplicability",
    width: 190,
    cellRenderer: (props: any) => {
      const row = props.data as HierarchicalRow;
      if (row.type === 'phase') return null;
      if (row.type === 'document') {
        const getBadgeStyle = (techType: string) => {
          switch (techType?.toLowerCase()) {
            case 'class i':
              return 'bg-green-100 text-green-700 ring-1 ring-green-600/20';
            case 'class ii':
              return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20';
            case 'class iii':
              return 'bg-red-100 text-red-700 ring-1 ring-red-600/20';
            default:
              return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
          }
        };
        return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getBadgeStyle(row.techApplicability || '')}`}>
              {row.techApplicability || 'Not specified'}
            </span>;
      }
      return null;
    }
  }, {
    headerName: "Document Type",
    field: "documentType",
    width: 150,
    cellRenderer: (props: any) => {
      const row = props.data as HierarchicalRow;
      if (row.type === 'phase') return null;
      if (row.type === 'document') {
        const getTypeConfig = (type: string) => {
          switch (type?.toLowerCase()) {
            case 'template':
              return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
            case 'document':
              return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
            case 'form':
              return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
            default:
              return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
          }
        };
        return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeConfig(row.documentType || '')}`}>
              {row.documentType || 'Unknown'}
            </span>;
      }
      return null;
    }
  }, {
    headerName: "Actions",
    field: "actions",
    width: 100,
    cellRenderer: (props: any) => {
      const row = props.data as HierarchicalRow;
      if (row.type === 'phase' || row.type === 'product') return null;
      if (row.type === 'document') {
        return <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(row)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash className="h-3 w-3" />
              </Button>
            </div>;
      }
      return null;
    }
  }];
  const defaultColDef: any = {
    resizable: true,
    minWidth: 100,
    sortable: true,
    filter: true,
    floatingFilter: true
  };
  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
    setGridApi(params.api);
  };

  // Filter functions
  const clearFilters = () => {
    setIsFiltering(true);
    setSearchTerm("");
    setTimeout(() => setIsFiltering(false), 100);
  };
  const handleSearchChange = (value: string) => {
    setIsFiltering(true);
    setSearchTerm(value);
    setTimeout(() => setIsFiltering(false), 100);
  };

  // Expand/Collapse all phases
  const expandAllPhases = () => {
    const allPhaseIds = new Set<string>();
    if (phases && Array.isArray(phases)) {
      phases.forEach(phase => allPhaseIds.add(phase.id));
    }
    // Add unassigned phase
    allPhaseIds.add('unassigned');
    setExpandedPhases(allPhaseIds);
  };
  const collapseAllPhases = () => {
    setExpandedPhases(new Set());
  };
  const totalDocuments = selectedView === 'company' ? allDocuments?.length || 0 : productDocuments?.length || 0;

  // Add state for product document search
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Only show loading in main component if AG Grid dialog is not open
  if (isLoading && !showAgGridDialog) {
    return <Card>
        <CardContent className="pt-6 text-center h-[500px] flex items-center justify-center flex-col">
          <LoadingSpinner className="mr-2" />
          Loading document management...
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              Error loading documents: {error}
              <Button variant="outline" size="sm" onClick={refreshPhases} className="ml-2">
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  return <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Inject custom styles */}
        <style dangerouslySetInnerHTML={{
        __html: customStyles
      }} />

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {lang('companySettings.documentCIs.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{lang('companySettings.documentCIs.subtitle')}</p>
              </div>
              <div className="flex gap-2">
                {/* View Selection Controls */}
                {/* <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm font-medium text-gray-600">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={selectedView === 'company' ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewChange('company')}
                      className={`text-xs ${selectedView === 'company' ? 'bg-gray-200 shadow-sm' : 'text-gray-600'}`}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      Company
                    </Button>
                    <Button
                      variant={selectedView === 'product' ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewChange('product')}
                      className={`text-xs ${selectedView === 'product' ? 'bg-gray-200 shadow-sm' : 'text-gray-600'}`}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Products
                    </Button>
                  </div>
                 </div> */}

                {/* Product Selection (only show when in product view) */}


                {/* Action Buttons */}
                {/* Smart Template moved to Templates tab */}

                <Button onClick={() => setAddTemplateDialogOpen(true)} variant="outline" size="sm"
              // disabled={isLoading || totalDocuments === 0}
              style={{
                whiteSpace: 'nowrap'
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('companySettings.documentCIs.addEditButton')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowRefreshConfirmDialog(true)} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Syncing...' : lang('companySettings.documentCIs.syncButton')}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>


        {/* Main Content */}
        {selectedView === 'company' ? <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column with Company Wide Documents and Lifecycle Phases */}
              <div className="space-y-6">
                {/* Company Specific Documents Container */}
                <Collapsible 
                  open={openSections.has('company-specific')}
                  onOpenChange={(open) => {
                    if (!isDragging) {
                      setOpenSections(prev => {
                        const newSet = new Set(prev);
                        if (open) {
                          newSet.add('company-specific');
                        } else {
                          newSet.delete('company-specific');
                        }
                        return newSet;
                      });
                    }
                  }}
                >
                  <Card className="border border-blue-200 bg-blue-50/30">
                    <CollapsibleTrigger asChild disabled={isDragging}>
                      <CardHeader className={`pb-4 transition-colors ${isDragging ? 'cursor-default' : 'cursor-pointer hover:bg-blue-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-blue-900">{lang('companySettings.documentCIs.companySpecificDocs')}</CardTitle>
                              <p className="text-sm text-blue-700 mt-1">
                                {lang('companySettings.documentCIs.companySpecificDocsDesc')} ({companySpecificDocuments.length})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                              {companySpecificDocuments.length} {lang('companySettings.documentCIs.docs')}
                            </Badge>
                            <ChevronDown className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-0">
                        <Droppable droppableId="company-specific-docs">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[120px] p-4 transition-colors ${
                                snapshot.isDraggingOver
                                  ? "bg-blue-100 border-blue-300"
                                  : "bg-white"
                              }`}
                            >
                              {companySpecificDocuments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">{lang('companySettings.documentCIs.dropToAdd')}</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {companySpecificDocuments.map((document, index) => (
                                    <Draggable
                                      key={`company-doc-${document.id}`}
                                      draggableId={`company-doc-${document.id}`}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`flex items-start justify-between p-3 bg-white border border-blue-200 rounded-md hover:shadow-sm transition-shadow min-h-[60px] ${
                                            snapshot.isDragging && "shadow-lg"
                                          }`}
                                        >
                                          <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <FileText className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-xs font-medium leading-tight break-words block text-blue-900">
                                                {document.name}
                                              </span>
                                              <div className="flex items-center gap-1 mt-1">
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                  {document.type}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveCompanyDocument(document)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
                
                {/* Product Specific Documents */}
                <Collapsible 
                  open={openSections.has('device-specific')}
                  onOpenChange={(open) => {
                    if (!isDragging) {
                      setOpenSections(prev => {
                        const newSet = new Set(prev);
                        if (open) {
                          newSet.add('device-specific');
                        } else {
                          newSet.delete('device-specific');
                        }
                        return newSet;
                      });
                    }
                  }}
                >
                  <Card>
                    <CollapsibleTrigger asChild disabled={isDragging}>
                      <CardHeader className={`transition-colors ${isDragging ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-green-900">{lang('companySettings.documentCIs.deviceSpecificDocs')}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {lang('companySettings.documentCIs.deviceSpecificDocsDesc')}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {/* Core Product Documents */}
                        <Collapsible open={coreOpen} onOpenChange={setCoreOpen}>
                          <div className="border rounded-lg bg-gray-50">
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-3 rounded-t-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                  {coreOpen ? (
                                    <ChevronDown className="h-4 w-4 transition-transform" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 transition-transform" />
                                  )}
                                  <span className="font-medium text-sm">
                                    {lang('companySettings.documentCIs.coreDeviceDocs')}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {coreProductDocuments.length} {lang('companySettings.documentCIs.docs')}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <Droppable droppableId="core-product-docs">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[80px] p-3 rounded-lg border transition-colors ${
                                      snapshot.isDraggingOver
                                        ? "bg-green-100 border-green-300"
                                        : "bg-white border-gray-200"
                                    }`}
                                  >
                                    {coreProductDocuments.length === 0 ? (
                                      <div className="text-center py-6 text-muted-foreground">
                                        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{lang('companySettings.documentCIs.dropToCoreDevice')}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {coreProductDocuments.map((document, index) => (
                                          <Draggable
                                            key={`core-doc-${document.id}`}
                                            draggableId={`core-doc-${document.id}`}
                                            index={index}
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`flex items-start justify-between p-3 bg-white border border-green-200 rounded-md hover:shadow-sm transition-shadow min-h-[60px] ${
                                                  snapshot.isDragging && "shadow-lg"
                                                }`}
                                              >
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                  <FileText className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                                  <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-medium leading-tight break-words block text-green-900">
                                                      {document.name}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        {document.type}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleRemoveCoreProductDocument(document)}
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                      </div>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>

                        <Separator className="my-4" />

                        {/* Phase-Related Documents */}
                        <EnhancedPhaseDropZones
                          documentsByPhase={documentsByPhase}
                          phases={phaseNames.map(phase => phase)}
                          onRemoveDocument={handleRemoveDocument}
                          isDragging={isDragging}
                          phaseToKeepOpen={phaseToKeepOpen}
                          complianceSections={complianceSections || []}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>

              {/* Right Column - Document Library */}
              <Card>
                <CardHeader>
                  <CardTitle>{lang('companySettings.documentCIs.documentCIsLibrary')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lang('companySettings.documentCIs.librarySubtitle')}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <DocumentLibraryPanel documents={allDocuments} onDocumentUpdated={async () => {
                    await Promise.all([refreshPhases(), fetchAllDocuments(), fetchCompanySpecificDocuments(), fetchCoreProductDocuments()]);
                  }} companyId={companyId} />
                </CardContent>
              </Card>
            </div>
          </div> : <div className="space-y-6">
            {/* Product Documents Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Device Documents
                      <Button onClick={() => setShowProductDocumentDialog(true)} variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 whitespace-nowrap">
                        <Package className="h-4 w-4 mr-2" />
                        Add Device Document
                      </Button>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct === 'all' ? 'Documents for all products' : `Documents for ${products.find(p => p.id === selectedProduct)?.name || 'selected product'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {productDocuments.length} documents
                    </Badge>
                    {selectedProduct !== 'all' && <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {productDocuments.filter(doc => doc.product_id === selectedProduct).length} for this Device
                      </Badge>}
                  </div>
                </div>
                {/* Search bar for product documents */}
                <div className="mt-4 flex items-center gap-2">
                  <Input placeholder="Search product documents..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className="max-w-xs" />
                  {productSearchTerm && <Button variant="ghost" size="sm" onClick={() => setProductSearchTerm("")} className="h-8 w-8 p-0" title="Clear search">
                      <X className="h-4 w-4" />
                    </Button>}
                </div>
              </CardHeader>
              <CardContent>
                {productDocuments.length === 0 ? <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">NoDevice documents found</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedProduct === 'all' ? 'No product documents have been created yet.' : 'No documents found for this product.'}
                    </p>
                    <Button onClick={() => setShowProductDocumentDialog(true)} className="bg-green-600 hover:bg-green-700">
                      <Package className="h-4 w-4 mr-2" />
                      Create Product Document
                    </Button>
                  </div> : <div className="space-y-4">
                    {productDocuments.filter(doc => selectedProduct === 'all' || doc.product_id === selectedProduct).filter(doc => {
                if (!productSearchTerm.trim()) return true;
                const search = productSearchTerm.toLowerCase();
                return doc.name?.toLowerCase().includes(search) || doc.description?.toLowerCase().includes(search);
              }).map(doc => {
                const product = products.find(p => p.id === doc.product_id);
                return <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                <p className="text-sm text-gray-500">{doc.description || 'No description'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {doc.document_type || 'Standard'}
                                  </Badge>
                                  {selectedProduct === 'all' && <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                      {product?.name || 'Unknown Product'}
                                    </Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.status === 'Completed' ? 'default' : 'secondary'} className={doc.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}>
                                {doc.status || 'Not Started'}
                              </Badge>
                            </div>
                          </div>;
              })}
                    {/* Show message if no results after filtering */}
                    {productDocuments.filter(doc => selectedProduct === 'all' || doc.product_id === selectedProduct).filter(doc => {
                if (!productSearchTerm.trim()) return true;
                const search = productSearchTerm.toLowerCase();
                return doc.name?.toLowerCase().includes(search) || doc.description?.toLowerCase().includes(search);
              }).length === 0 && <div className="text-center py-8 text-gray-500">No documents match your search.</div>}
                  </div>}
              </CardContent>
            </Card>
          </div>}

        {/* Dialogs */}
        <SmartAppendCsvImport open={importDialogOpen} onOpenChange={handleImportDialogOpen} companyId={companyId} existingPhases={phases} onImportComplete={refreshPhases} />

        <AddPhaseDocumentTemplateDialog open={addTemplateDialogOpen} onOpenChange={handleAddTemplateDialogOpen} companyId={companyId} onDocumentCreated={async () => {
        await Promise.all([refreshPhases(), fetchAllDocuments(), fetchCompanySpecificDocuments(), fetchCoreProductDocuments()]);
        // If the AG Grid dialog was open, refresh its data too
        if (showAgGridDialog) {
          await refreshAllData();
        }
      }} />
        
        {/* AITemplateImporterDialog moved to Templates tab */}
        
        <DocumentImportDialog open={showImportDialog} onOpenChange={handleShowImportDialogOpen} companyId={companyId} onImportComplete={refreshPhases} />

        {/* Hierarchical AG Grid Dialog */}
        <Dialog open={showAgGridDialog} onOpenChange={handleAgGridDialogOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedView === 'company' ? 'Company Document CI Management View' : selectedProduct === 'all' ? 'Product Document CIs View' : `Product Document CIs - ${products.find(p => p.id === selectedProduct)?.name}`}
              </DialogTitle>
            </DialogHeader>

            {isLoading ? <div className="flex items-center justify-center h-64">
                <LoadingSpinner className="mr-2" />
                <span className="ml-2">Loading document data...</span>
              </div> : <>
                {/* Enhanced Filtering UI */}
                <div className="mb-6 space-y-4">
                  {/* Editing Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Edit className="h-4 w-4" />
                      <span className="font-medium">Inline Editing:</span>
                      <span>Double-click on document names, descriptions, types, or tech applicability to edit them directly in the grid.</span>
                    </div>
                  </div>

                  {/* Search and Control Row */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search phases or documents..." value={searchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-10 pr-4" />
                        {searchTerm && <Button variant="ghost" size="sm" onClick={() => handleSearchChange("")} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {
                  // canAddPhases && (
                  <Button onClick={handleAddDocumentFromGrid} variant="outline" style={{
                    float: 'right'
                  }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Document CI
                        </Button>
                  // )
                  }
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={expandAllPhases}
                        className="flex items-center gap-1"
                       >
                        <ChevronDown className="h-3 w-3" />
                        Expand All
                       </Button>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={collapseAllPhases}
                        className="flex items-center gap-1"
                       >
                        <ChevronRight className="h-3 w-3" />
                        Collapse All
                       </Button> */}

                      {searchTerm && <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Clear Search
                        </Button>}
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      {selectedView === 'company' ? <>
                          <span>Phases: {phases?.length || 0}</span>
                          <span>Total Documents: {totalDocuments}</span>
                        </> : <>
                          <span>Device: {products.length}</span>
                          <span>Device Documents: {productDocuments.length}</span>
                          {selectedProduct !== 'all' && <span>Selected Device: {products.find(p => p.id === selectedProduct)?.name}</span>}
                        </>}
                      {searchTerm && <span className="text-blue-600 font-medium flex items-center gap-1">
                          {isFiltering && <LoadingSpinner className="h-3 w-3 animate-spin" />}
                          Showing: {hierarchicalData.filter(row => row.type === 'document').length} documents
                        </span>}
                    </div>

                    {/* <div className="flex items-center gap-2">
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        disabled={hierarchicalData.length === 0}
                      >
                        <FileDown className="h-3 w-3" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        disabled={hierarchicalData.length === 0}
                      >
                        <Download className="h-3 w-3" />
                        Export Excel
                      </Button>
                     </div> */}
                  </div>
                </div>

                {/* Enhanced Hierarchical TanStack Table */}
                <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Click on any document row to view details. All document fields are displayed.</span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <DocumentDataTable data={hierarchicalData} phases={phases} onDeleteDocument={handleDeleteDocument} onPhaseChange={async (documentId, newPhaseId) => {
                try {
                  toast.success('Document phase updated successfully');
                } catch (error) {
                  console.error('Error updating document phase:', error);
                  toast.error('Failed to update document phase');
                }
              }} onTogglePhaseExpansion={togglePhaseExpansion} />
                </div>
              </>}

            <div className="flex justify-end items-center pt-4 border-t">
              <Button onClick={() => handleAgGridDialogOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Document Creation Dialog */}
        <Dialog open={showProductDocumentDialog} onOpenChange={setShowProductDocumentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Device Document</DialogTitle>
            </DialogHeader>
            <ProductDocumentForm products={products} isLoadingProducts={isLoadingProducts} onSubmit={handleCreateProductDocument} onCancel={() => setShowProductDocumentDialog(false)} />
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialogs */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Permanently Delete Document</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete <strong>"{documentToDelete?.documentName}"</strong>?
              </p>
              <p className="text-sm text-red-600 font-medium">
                ⚠️ This action cannot be undone and the document will be completely removed from the system.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
              setShowDeleteConfirmDialog(false);
              setDocumentToDelete(null);
            }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Permanently Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showMoveConfirmDialog} onOpenChange={setShowMoveConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Move Document to Unassigned</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to move <strong>"{documentToDelete?.documentName}"</strong> from <strong>"{documentToDelete?.phaseName}"</strong> to unassigned documents?
              </p>
              <p className="text-sm text-blue-600 font-medium">
                ℹ️ This will remove the document from the current phase and make it available for reassignment.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
              setShowMoveConfirmDialog(false);
              setDocumentToDelete(null);
            }}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleConfirmMove}>
                Move to Unassigned
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Refresh Confirmation Dialog */}
        <Dialog open={showRefreshConfirmDialog} onOpenChange={setShowRefreshConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-500" />
                Sync Document Templates
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to sync document templates? This will refresh all template data from the global library and may overwrite local changes.
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRefreshConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={async () => {
                setShowRefreshConfirmDialog(false);
                setIsRefreshing(true);
                try {
                  await refreshAllData();
                  toast.success('Document templates synced successfully');
                } catch (error) {
                  console.error('Error syncing:', error);
                  toast.error('Failed to sync document templates');
                } finally {
                  setIsRefreshing(false);
                }
              }}>
                Yes, Sync Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>;
}