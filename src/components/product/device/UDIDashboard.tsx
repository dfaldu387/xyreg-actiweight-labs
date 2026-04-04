import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Search, 
  Download, 
  Barcode, 
  Filter,
  Database,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Lock,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BasicUDIEditDialog } from "./BasicUDIEditDialog";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { UDIExportDialog } from "./UDIExportDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyBasicUDIGroups } from "@/hooks/useCompanyBasicUDIGroups";

interface UDIDashboardProps {
  companyId: string;
}

interface BasicUDIDI {
  id: string;
  basic_udi_di: string;
  internal_reference: string;
  created_at: string;
  issuing_agency: string;
  company_prefix: string;
  check_character: string;
  risk_class?: string;
  intended_purpose?: string;
  essential_characteristics?: string;
  display_as_merged?: boolean;
  company_id: string;
}

interface ProductUDIDI {
  id: string;
  product_id: string;
  generated_udi_di: string;
  packaging_level: string;
  item_reference: string;
  company_prefix: string;
  created_at: string;
  updated_at: string;
  basic_udi_di?: string;
  products?: {
    name: string;
    status: string;
  };
}

export function UDIDashboard({ companyId }: UDIDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBasicUDI, setSelectedBasicUDI] = useState<BasicUDIDI | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedProductUDI, setSelectedProductUDI] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'item_reference', desc: true }]);

  // Fetch Basic UDI-DI data from products table (grouped by basic_udi_di)
  const { data: basicUDIClusters, isLoading: isLoadingBasic } = useCompanyBasicUDIGroups(companyId);

  const companyPrefix = useMemo(() => {
    if (basicUDIClusters && basicUDIClusters.length > 0) {
      const firstUDI = basicUDIClusters[0].basicUDI;
      if (firstUDI && firstUDI.length >= 10) {
        return firstUDI.substring(0, 10);
      }
    }
    return '1569431111';
  }, [basicUDIClusters]);

  // Fetch Product UDI-DI data - from products table where udi_di is set
  const { data: productUDIData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product-udi-di', companyId, companyPrefix],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, udi_di, basic_udi_di, status, inserted_at, updated_at')
        .eq('company_id', companyId)
        .not('udi_di', 'is', null)
        .order('inserted_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(product => {
        const udiDi = product.udi_di || '';
        let itemRef = '';
        if (udiDi && companyPrefix && udiDi.includes(companyPrefix)) {
          const afterPrefix = udiDi.slice(udiDi.indexOf(companyPrefix) + companyPrefix.length);
          itemRef = afterPrefix.slice(0, -1);
        } else {
          itemRef = udiDi.slice(-5, -1);
        }
        
        return {
          id: product.id,
          product_id: product.id,
          generated_udi_di: udiDi,
          packaging_level: 'Each',
          item_reference: itemRef,
          company_prefix: companyPrefix,
          created_at: product.inserted_at,
          updated_at: product.updated_at,
          basic_udi_di: product.basic_udi_di,
          products: {
            name: product.name,
            status: product.status || 'active'
          }
        };
      }) as ProductUDIDI[];
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('UDI copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'discontinued':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Discontinued</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Filter basic UDI clusters by search
  const filteredBasicUDIClusters = useMemo(() => {
    if (!basicUDIClusters) return [];
    if (!searchTerm) return basicUDIClusters;
    const lower = searchTerm.toLowerCase();
    return basicUDIClusters.filter(cluster =>
      cluster.basicUDI.toLowerCase().includes(lower) ||
      (cluster.groupName && cluster.groupName.toLowerCase().includes(lower)) ||
      cluster.products.some(p => p.name.toLowerCase().includes(lower))
    );
  }, [basicUDIClusters, searchTerm]);

  const filteredProductUDIs = useMemo(() => {
    return productUDIData?.filter(udi => {
      const matchesSearch = udi.generated_udi_di.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           udi.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           udi.packaging_level.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || udi.products?.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [productUDIData, searchTerm, statusFilter]);

  // TanStack Table column definitions for Product UDI-DI tab
  const productUDIColumns = useMemo<ColumnDef<ProductUDIDI>[]>(() => [
    {
      accessorKey: 'product_name',
      header: 'Product',
      size: 280,
      minSize: 120,
      maxSize: 500,
      accessorFn: (row) => row.products?.name || '',
      cell: ({ row }) => (
        <div className="font-medium truncate max-w-[260px]" title={row.original.products?.name}>
          {row.original.products?.name}
        </div>
      ),
    },
    {
      id: 'company_prefix',
      header: () => (
        <div>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-amber-600" />
            Company Prefix
          </div>
          <span className="text-[10px] text-muted-foreground font-normal">(Fixed)</span>
        </div>
      ),
      size: 100,
      minSize: 80,
      maxSize: 200,
      enableSorting: false,
      cell: () => (
        <span className="font-mono text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">{companyPrefix}</span>
      ),
    },
    {
      accessorKey: 'item_reference',
      header: () => (
        <div>
          <div className="flex items-center gap-1">
            <span className="text-green-700 dark:text-green-400 font-bold">Item Reference</span>
          </div>
          <span className="text-[10px] text-green-600 dark:text-green-500 font-normal">(Unique - You chose this!)</span>
        </div>
      ),
      size: 100,
      minSize: 60,
      maxSize: 200,
      sortingFn: (rowA, rowB) => {
        return parseInt(rowA.original.item_reference || '0', 10) - parseInt(rowB.original.item_reference || '0', 10);
      },
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded border-2 border-green-500">
          {row.original.item_reference || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'generated_udi_di',
      header: 'Full UDI-DI',
      size: 180,
      minSize: 100,
      maxSize: 350,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={row.original.generated_udi_di}>
            ...{row.original.generated_udi_di.slice(-8)}
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(row.original.generated_udi_di)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 90,
      minSize: 70,
      maxSize: 150,
      accessorFn: (row) => row.products?.status || '',
      cell: ({ row }) => getStatusBadge(row.original.products?.status || 'unknown'),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      size: 80,
      enableResizing: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedProductUDI(row.original.id); setShowBarcodeGenerator(true); }} title="Generate Barcode">
            <Barcode className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [companyPrefix, copyToClipboard, getStatusBadge]);

  const productUDITable = useReactTable({
    data: filteredProductUDIs,
    columns: productUDIColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting },
  });

  // Group products by Basic UDI-DI for the Product UDI-DI tab (cards view)
  const groupedProductUDIs = useMemo(() => {
    const groups: Record<string, ProductUDIDI[]> = {};
    filteredProductUDIs.forEach(udi => {
      const groupKey = udi.basic_udi_di || 'Unassigned';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(udi);
    });
    return groups;
  }, [filteredProductUDIs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">UDI Management Hub</h1>
          <p className="text-muted-foreground">
            Manage all your UDI codes and regulatory database preparation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={() => setShowBarcodeGenerator(true)} className="flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            Generate Barcode
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search UDI codes, products, or references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs - 2 tabs only */}
      <Tabs defaultValue="basic-udi" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic-udi">Basic UDI-DI</TabsTrigger>
          <TabsTrigger value="product-udi">Product UDI-DI</TabsTrigger>
        </TabsList>

        {/* Basic UDI-DI Tab - Products grouped by basic_udi_di */}
        <TabsContent value="basic-udi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Basic UDI-DI Groups
                <Badge variant="secondary" className="ml-2">
                  {filteredBasicUDIClusters.length} groups
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBasic ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredBasicUDIClusters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products with Basic UDI-DI codes found</p>
                  <p className="text-sm mt-1">Assign Basic UDI-DI codes to your products to see them here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBasicUDIClusters.map((cluster) => {
                    const isExpanded = expandedGroups.has(cluster.basicUDI);
                    return (
                      <Collapsible key={cluster.basicUDI} open={isExpanded} onOpenChange={() => toggleGroup(cluster.basicUDI)}>
                        <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <Package2 className="h-5 w-5 text-primary" />
                          <div className="flex-1 text-left">
                            <div className="font-mono font-medium">
                              {cluster.basicUDI}
                            </div>
                            {cluster.groupName && (
                              <div className="text-xs text-muted-foreground">
                                {cluster.groupName}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {cluster.totalCount} {cluster.totalCount === 1 ? 'product' : 'products'}
                          </Badge>
                          {cluster.siblingGroups.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {cluster.siblingGroups.length} sibling groups
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(cluster.basicUDI);
                            }}
                            title="Copy Basic UDI-DI"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-12">
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead>Product Name</TableHead>
                                  <TableHead>UDI-DI</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cluster.products.map((product) => (
                                  <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {product.udi_di || '—'}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(product.status || 'unknown')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {product.udi_di && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => copyToClipboard(product.udi_di!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product UDI-DI Tab */}
        <TabsContent value="product-udi" className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <p className="font-medium">Understanding Your UDI-DI Numbers</p>
                <p className="text-sm">
                  Each UDI-DI = <span className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded text-amber-700 dark:text-amber-300">Company Prefix</span> (fixed) + 
                  <span className="font-mono bg-green-100 dark:bg-green-900/30 px-1 rounded text-green-700 dark:text-green-300 font-bold ml-1">Item Reference</span> (you choose) + Check Digit
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-3 w-3" />
                  <span>Your company prefix: <span className="font-mono font-bold">{companyPrefix}</span></span>
                  <span className="text-muted-foreground">• The <strong>Item Reference</strong> column shows the unique part YOU assigned to each product.</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Product UDI-DI Master List
                  <Badge variant="secondary" className="ml-2">
                    {filteredProductUDIs.length} items
                  </Badge>
                </CardTitle>
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'table' | 'cards')}>
                  <ToggleGroupItem value="table" aria-label="Table view" size="sm">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cards" aria-label="Cards view" size="sm">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProduct ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProductUDIs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Barcode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product UDI-DI codes found</p>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="space-y-4">
                  {Object.entries(groupedProductUDIs).map(([groupKey, items]) => {
                    const isExpanded = expandedGroups.has(groupKey) || expandedGroups.size === 0;
                    const clusterInfo = basicUDIClusters?.find(c => c.basicUDI === groupKey);
                    
                    return (
                      <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                        <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <div className="flex-1 text-left">
                            <span className="font-medium">
                              {groupKey === 'Unassigned' ? 'Unassigned Products' : `Basic: ${clusterInfo?.groupName || groupKey}`}
                            </span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {items.length} products
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-7">
                            {items.map((udi) => (
                              <Card key={udi.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="truncate flex-1">
                                        <p className="font-medium truncate" title={udi.products?.name}>
                                          {udi.products?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{udi.packaging_level}</p>
                                      </div>
                                      {getStatusBadge(udi.products?.status || 'unknown')}
                                    </div>
                                    
                                    <div className="p-2 bg-muted/30 rounded-lg">
                                      <p className="text-xs text-muted-foreground mb-1">Item Reference (Your SKU)</p>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded border-2 border-green-500">
                                          {udi.item_reference || '—'}
                                        </span>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(udi.generated_udi_di)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="font-mono truncate" title={udi.generated_udi_di}>
                                        Full: ...{udi.generated_udi_di.slice(-10)}
                                      </span>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedProductUDI(udi.id); setShowBarcodeGenerator(true); }} title="Generate Barcode">
                                        <Barcode className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table style={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHeader>
                      {productUDITable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-muted/50">
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="relative"
                              style={{ width: header.getSize() }}
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  className={`flex items-center ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-muted/80 transition-colors' : ''}`}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {header.column.getCanSort() && (
                                    header.column.getIsSorted() === 'asc'
                                      ? <ArrowUp className="h-3 w-3 ml-1" />
                                      : header.column.getIsSorted() === 'desc'
                                        ? <ArrowDown className="h-3 w-3 ml-1" />
                                        : <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                                  )}
                                </div>
                              )}
                              {/* Column resize handle */}
                              {header.column.getCanResize() && (
                                <div
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                  className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 ${
                                    header.column.getIsResizing() ? 'bg-blue-500' : 'bg-border'
                                  }`}
                                />
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {productUDITable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEditDialog && selectedBasicUDI && (
        <BasicUDIEditDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setSelectedBasicUDI(null);
          }}
          basicUDI={selectedBasicUDI}
        />
      )}

      {showBarcodeGenerator && (
        <BarcodeGenerator
          udiId={selectedProductUDI}
          onClose={() => {
            setShowBarcodeGenerator(false);
            setSelectedProductUDI(null);
          }}
        />
      )}

      {showExportDialog && (
        <UDIExportDialog
          companyId={companyId}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
