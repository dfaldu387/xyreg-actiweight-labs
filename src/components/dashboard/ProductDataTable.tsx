import React, { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Info,
  FileX,
  Clock,
  ShieldAlert,
  CircleCheck,
  Zap,
  TrendingUp,
  MoreHorizontal,
  Archive,
  Copy
} from "lucide-react";
import { detectProductType, getProductTypeLabel } from "@/utils/productTypeDetection";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { toast } from "sonner";
import { ProductDataTableService } from "@/services/productDataTableService";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateFamilyDialog } from "./CreateFamilyDialog";
import { CopyProductDialog } from "./CopyProductDialog";

interface ProductGridProps {
  products: any[];
  getProductCardBg: (status: string) => string;
  refetch?: () => Promise<void>;
}

const columnHelper = createColumnHelper<any>();

export function ProductDataTable({ products, getProductCardBg, refetch }: ProductGridProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [allProductPlatforms, setAllProductPlatforms] = useState<string[]>([]);
  const [allProductCategories, setAllProductCategories] = useState<string[]>([]);
  const [allProductVariants, setAllProductVariants] = useState<Array<{ id: string, name: string }>>([]);
  const [allProductVariantsOptions, setAllProductVariantsOptions] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedCategoryValue, setSelectedCategoryValue] = useState<string>("all");
  const [selectedPlatformValue, setSelectedPlatformValue] = useState<string>("all");
  const [selectedVariantValue, setSelectedVariantValue] = useState<string>("all");
  const [selectedVariantOptionValue, setSelectedVariantOptionValue] = useState<string>("");
  const [selectedPlatformOption, setSelectedPlatformOption] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargetProduct, setCopyTargetProduct] = useState<any>(null);
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  // Set up the query client for cache invalidation
  React.useEffect(() => {
    ProductDataTableService.setQueryClient(queryClient);
  }, [queryClient]);
  
  // Fetch company-specific platforms
  const { data: companyPlatforms = [] } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_platforms')
        .select('name')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) {
        console.error('Error fetching company platforms:', error);
        return [];
      }
      
      return data.map(p => p.name);
    },
    enabled: !!companyId,
  });

  // Fetch company-specific model references
  const { data: companyModelReferences = [] } = useQuery({
    queryKey: ['company-model-references', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_product_models')
        .select('name')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) {
        console.error('Error fetching company model references:', error);
        return [];
      }
      
      return data.map(m => m.name);
    },
    enabled: !!companyId,
  });
  
  const processedData = useMemo(() => {
    return products.map(product => ({
      ...product,
      productType: detectProductType(product),
      product_category: (product as any).device_category || (product as any).product_category || null
    }));
  }, [products]);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    processedData.forEach(product => {
      const category = product.product_platform || "Custom";
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [processedData]);
  useEffect(() => {
    const productPlatforms = products
      .map(product => product.model_reference)
      .filter(platform => platform && typeof platform === 'string' && platform.trim() !== '')
      .filter((platform, index, arr) => arr.indexOf(platform) === index);
    setAllProductPlatforms(productPlatforms);
  }, [products])
  useEffect(() => {
    const fetchCompanyCategory = async () => {
      if (!companyId) {
        console.warn('[ProductDataTable] No companyId available, skipping category fetch');
        return;
      }
      
      const { success, data } = await ProductDataTableService.getCompanyCategory(companyId);
      const { success: variantsSuccess, data: variantsData } = await ProductDataTableService.getProductVariantsdimensions(companyId);
      if (success) {
        setAllProductCategories(data.map((category: any) => category.name));
      }
      if (variantsSuccess) {
        setAllProductVariants(variantsData.map((variant: any) => ({
          id: variant.id,
          name: variant.name
        })));
      }
    }
    fetchCompanyCategory();
  }, [companyId])

  // Filter data based on all filters
  const filteredData = useMemo(() => {
    return processedData.filter(product => {
      // Global search filter
      const matchesSearch = globalFilter === "" ||
        product.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        product.status?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        product.product_platform?.toLowerCase().includes(globalFilter.toLowerCase());

      // Type filter
      const matchesType = typeFilter === "all" ||
        product.productType === typeFilter ||
        product.category === typeFilter ||
        product.product_category === typeFilter ||
        (typeFilter === "legacy_product" && (product.legacy || product.is_legacy));

      // Product type filter
      const matchesProductType = productTypeFilter === "all" ||
        product.productType === productTypeFilter;

      // Category filter
      const matchesCategory = categoryFilter === "all" ||
        (product.product_category || "Custom") === categoryFilter;

      return matchesSearch && matchesType && matchesProductType && matchesCategory;
    });
  }, [processedData, globalFilter, typeFilter, productTypeFilter, categoryFilter]);

  const handleActionChange = (action: string) => {
    if (action === 'create_family') {
      const selectedProducts = table.getFilteredSelectedRowModel().rows.map(r => r.original);
      if (selectedProducts.length < 2) {
        toast.error('Select at least 2 products to create a family');
        return;
      }
      setShowCreateFamilyDialog(true);
      setSelectedAction("");
      return;
    }
    
    setSelectedAction(action);
    // Reset all selected values when action changes
    setSelectedCategoryValue("all");
    setSelectedPlatformValue("all");
    setSelectedVariantValue("all");
    setSelectedPlatformOption("all");
  };

  const handleProductUpdate = async (action: string) => {
    const selectedProductIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);

    if (selectedProductIds.length === 0) {
      toast.error("No products selected");
      return;
    }

    setIsUpdating(true);

    if (action === "product_category") {
      setIsUpdating(true);
      try {
        for (const id of selectedProductIds) {
          const { success, data } = await ProductDataTableService.updateProductCategory(id, selectedCategoryValue);
          if (!success) {
            console.error(`Error updating product ${id}:`, data);
            throw new Error('Failed to update product category');
          }
        }
        toast.success(`Successfully updated ${selectedProductIds.length} products with category: ${selectedCategoryValue}`)
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (error) {
        console.error('Error updating products:', error);
        toast.error('Error updating products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
    if (action === "product_platform") {
      setIsUpdating(true);
      try {
        
        
        for (const id of selectedProductIds) {
          const { success, data } = await ProductDataTableService.updateProductPlatform(id, selectedPlatformValue);

          if (!success) {
            console.error(`Error updating product ${id}:`, data);
            throw new Error('Failed to update product platform');
          }
        }
        toast.success(`Successfully updated ${selectedProductIds.length} products with platform: ${selectedPlatformValue}`)
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        // Reset selection and action
        setSelectedAction("");
        setSelectedPlatformValue("all");
        table.toggleAllPageRowsSelected(false);

      } catch (error) {
        console.error('Error updating products:', error);
        alert('Error updating products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }

    if (action === "model_reference") {
      setIsUpdating(true);
      try {
        
        
        for (const id of selectedProductIds) {
          const { success, data } = await ProductDataTableService.updateProductModelReference(id, selectedPlatformValue);

          if (!success) {
            console.error(`Error updating product ${id}:`, data);
            throw new Error('Failed to update product model reference');
          }
        }
        toast.success(`Successfully updated ${selectedProductIds.length} products with model reference: ${selectedPlatformValue}`)
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        // Reset selection and action
        setSelectedAction("");
        setSelectedPlatformValue("all");
        table.toggleAllPageRowsSelected(false);

      } catch (error) {
        console.error('Error updating products:', error);
        alert('Error updating products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
    if (action === "product_variant") {
      setIsUpdating(true);
      try {
        // Find the selected variant option to get both id and name
        const selectedVariantOption = allProductVariantsOptions.find(variant => variant.id === selectedVariantOptionValue);

        if (!selectedVariantOption) {
          toast.error('Please select a valid variant option');
          return;
        }

        if (!selectedVariantValue || selectedVariantValue === "all") {
          toast.error('Please select a variant dimension');
          return;
        }

        for (const id of selectedProductIds) {
          const { success, data } = await ProductDataTableService.updateProductVariantOption(
            id,
            selectedVariantValue, // dimensionId
            selectedVariantOption.id // optionId
          );

          if (!success) {
            console.error(`Error updating product ${id}:`, data);
            throw new Error('Failed to update product variant');
          }
        }

        toast.success(`Successfully updated ${selectedProductIds.length} products with variant: ${selectedVariantOption.name}`);
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        // Reset selection and action
        setSelectedAction("");
        setSelectedVariantValue("all");
        setSelectedVariantOptionValue("");
        setAllProductVariantsOptions([]);
        table.toggleAllPageRowsSelected(false);
      } catch (error) {
        console.error('Error updating products:', error);
        toast.error('Error updating products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
    
    if (action === "archive") {
      const count = selectedProductIds.length;
      const confirmed = await confirm({
        title: "Archive Products",
        description: `Are you sure you want to archive ${count} product${count > 1 ? 's' : ''}? This action can be reversed later.`,
        confirmLabel: "Archive",
        variant: "destructive",
      });
      if (!confirmed) {
        setIsUpdating(false);
        return;
      }
      try {
        for (const id of selectedProductIds) {
          await ProductDataTableService.archiveProduct(id);
        }
        toast.success(`Successfully archived ${count} product${count > 1 ? 's' : ''}`);
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] });
        setSelectedAction("");
        table.toggleAllPageRowsSelected(false);
      } catch (error) {
        console.error('Error archiving products:', error);
        toast.error('Failed to archive products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (action === "platform") {
      setIsUpdating(true);
      try {
        if (!selectedPlatformOption || selectedPlatformOption === "all") {
          toast.error('Please select a platform option');
          return;
        }

        for (const id of selectedProductIds) {
          const { success, data } = await ProductDataTableService.updateProductPlatform(id, selectedPlatformOption);

          if (!success) {
            console.error(`Error updating product ${id}:`, data);
            throw new Error('Failed to update product platform');
          }
        }

        toast.success(`Successfully updated ${selectedProductIds.length} products with platform: ${selectedPlatformOption}`);
        if (refetch) await refetch();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        // Reset selection and action
        setSelectedAction("");
        setSelectedPlatformOption("all");
        table.toggleAllPageRowsSelected(false);
      } catch (error) {
        console.error('Error updating products:', error);
        toast.error('Error updating products. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };
  const handleVariantChange = async (value: string) => {
    
    if (value === "all") {
      setSelectedVariantValue("all");
      setAllProductVariantsOptions([]);
      return;
    }

    const { success, data } = await ProductDataTableService.getProductVariantsOptions(value);
    if (success) {
      setAllProductVariantsOptions(data.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
      })));
    }
    setSelectedVariantValue(value);
  }
  // Get unique values for the selected action dropdown
  const getUniqueValuesForAction = (action: string) => {
    if (!action || action === "all") return [];

    const values = new Set<string>();
    filteredData.forEach(product => {
      let value = "";
      switch (action) {
        case "product_category":
          value = product.product_category || product.category || "Uncategorized";
          break;
        case "product_platform":
          value = product.product_platform || "Custom";
          break;
        case "product_variant":
          value = product.variant || product.product_variant || "Standard";
          break;
        default:
          return;
      }
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  const handleCopyProduct = (product: any) => {
    setCopyTargetProduct(product);
    setCopyDialogOpen(true);
  };

  const handleCopyConfirm = async (targetCompanyId: string, attachToFamily: boolean, customName?: string, selectedFamilyId?: string) => {
    const product = copyTargetProduct;
    if (!product) return;

    try {
      // Fetch full product data from Supabase (table row may only have selected columns)
      const { data: fullProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      if (fetchError || !fullProduct) throw fetchError || new Error('Product not found');

      // Use custom name if provided, otherwise auto-generate with incrementing suffix
      let copyName: string;
      if (customName) {
        copyName = customName;
      } else {
        const baseName = fullProduct.name.replace(/\s*copy\d*$/i, '').trim();
        const existingCopies = products.filter(p => {
          const name = p.name || '';
          return name === `${baseName} copy` || (/^.+ copy\d+$/i.test(name) && name.startsWith(baseName));
        });

        if (existingCopies.length === 0) {
          const hasCopy = products.some(p => p.name === `${baseName} copy`);
          copyName = hasCopy ? `${baseName} copy2` : `${baseName} copy`;
        } else {
          let maxNum = 1;
          existingCopies.forEach(p => {
            const match = p.name.match(/copy(\d+)$/i);
            if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
          });
          copyName = `${baseName} copy${maxNum + 1}`;
        }
      }

      // Strip system/auto-generated fields, keep everything else
      const {
        id: _id,
        created_at: _ca,
        inserted_at: _ia,
        updated_at: _ua,
        archived_at: _aa,
        archived_by: _ab,
        company_id: _cid,
        name: _name,
        parent_product_id: _ppid,
        master_product_id: _mpid,
        // Strip joined/computed fields that may appear from queries
        company: _company,
        profiles: _profiles,
        lifecycle_phases: _lp,
        ...productData
      } = fullProduct as any;

      // Set target company and name
      (productData as any).company_id = targetCompanyId;
      (productData as any).name = copyName;

      // Handle family attachment
      if (!attachToFamily || !selectedFamilyId) {
        (productData as any).is_master_device = false;
        (productData as any).is_master_product = false;
        (productData as any).is_variant = false;
        (productData as any).parent_product_id = null;
        (productData as any).parent_relationship_type = null;
      } else {
        (productData as any).parent_product_id = selectedFamilyId;
        (productData as any).parent_relationship_type = 'variant';
        (productData as any).is_master_device = false;
        (productData as any).is_master_product = false;
        (productData as any).is_variant = true;
      }

      // Insert the copied product and get the new ID
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (error || !newProduct) throw error || new Error('Failed to insert copy');

      const newProductId = newProduct.id;

      // Copy device_components
      const { data: components } = await supabase
        .from('device_components')
        .select('*')
        .eq('product_id', product.id);

      if (components && components.length > 0) {
        const idMap = new Map<string, string>();

        // Insert components with new product_id, track old->new ID mapping
        for (const comp of components) {
          const { id: oldId, created_at, updated_at, ...compData } = comp;
          const { data: newComp } = await supabase
            .from('device_components')
            .insert({ ...compData, product_id: newProductId })
            .select('id')
            .single();
          if (newComp) idMap.set(oldId, newComp.id);
        }

        // Copy device_component_hierarchy with remapped IDs
        const { data: hierarchy } = await supabase
          .from('device_component_hierarchy')
          .select('*')
          .in('parent_id', Array.from(idMap.keys()));

        if (hierarchy && hierarchy.length > 0) {
          const newHierarchy = hierarchy
            .filter(h => idMap.has(h.parent_id) && idMap.has(h.child_id))
            .map(h => ({
              parent_id: idMap.get(h.parent_id)!,
              child_id: idMap.get(h.child_id)!,
            }));
          if (newHierarchy.length > 0) {
            await supabase.from('device_component_hierarchy').insert(newHierarchy);
          }
        }
      }

      // Copy feature_user_needs
      const { data: featureNeeds } = await supabase
        .from('feature_user_needs')
        .select('*')
        .eq('product_id', product.id);

      if (featureNeeds && featureNeeds.length > 0) {
        const newFeatureNeeds = featureNeeds.map(({ id, created_at, ...fn }) => ({
          ...fn,
          product_id: newProductId,
        }));
        await supabase.from('feature_user_needs').insert(newFeatureNeeds);
      }

      toast.success(`Created copy: ${copyName}`);
      if (refetch) await refetch();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sidebarCompanyProducts'] });
    } catch (error) {
      console.error('Error copying product:', error);
      toast.error('Failed to create copy');
    }
  };

  const handleArchiveProduct = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'Archived' })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(`Archived: ${product.name}`);
      if (refetch) await refetch();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Failed to archive product');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols = [
    // Checkbox column
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      size: 50,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    }),

    // Thumbnail column
    columnHelper.display({
      id: "thumbnail",
      header: "",
      size: 60,
      cell: ({ row }) => {
        const product = row.original;
        const selectedImage = localStorage.getItem(`selectedImage_${product.id}`);
        const imageUrls = sanitizeImageArray(product.image);
        const urlParts = imageUrls[0]?.split(',');
        const primaryImage = selectedImage || (imageUrls.length > 0 ? decodeURIComponent(urlParts[0]) : undefined);

        return (
          <div className="flex items-center justify-center h-12 w-12">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/40x40?text=N/A";
                }}
              />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 shadow-sm">
                <Package className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableResizing: false,
    }),

    // Product Name column
    columnHelper.accessor("name", {
      header: lang('productDataTable.deviceName'),
      size: 250,
      cell: ({ getValue, row }) => {
        const product = row.original;
        const productName = getValue() as string;
        let tradeName = product.eudamed_trade_names || 
                       product.trade_name || 
                       product.key_features?.eudamed_data?.trade_names;
        
        
        
        // Clean up trade name if it exists
        if (tradeName) {
          tradeName = typeof tradeName === 'string' ? tradeName.trim() : String(tradeName).trim();
          if (tradeName && tradeName !== productName) {
            
            return (
              <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                {productName} ({tradeName})
              </div>
            );
          }
        }
        
        
        return (
          <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
            {productName}
          </div>
        );
      },
    }),

    // Trade Name column
    columnHelper.display({
      id: "trade_name",
      header: lang('productDataTable.tradeName'),
      size: 220,
      cell: ({ row }) => {
        const product = row.original;
        let tradeName = product.eudamed_trade_names || 
                       product.trade_name || 
                       product.key_features?.eudamed_data?.trade_names;
        
        // Handle different data types for eudamed_trade_names
        if (typeof tradeName === 'object' && tradeName !== null) {
          if (Array.isArray(tradeName)) {
            tradeName = tradeName.join(', ');
          } else if (tradeName.trade_names) {
            tradeName = tradeName.trade_names;
          } else if (typeof tradeName === 'object') {
            tradeName = Object.values(tradeName).join(', ');
          }
        }
        
        // Clean up the trade name string
        if (typeof tradeName === 'string') {
          tradeName = tradeName.trim();
          if (tradeName === '' || tradeName === 'null' || tradeName === 'undefined') {
            tradeName = null;
          }
        }
        
        
        return (
          <div className="text-gray-700 truncate" title={tradeName || lang('productDataTable.noTradeNameAvailable')}>
            {tradeName || "-"}
          </div>
        );
      },
    }),

    // Status column
    columnHelper.accessor("status", {
      header: lang('productDataTable.status'),
      cell: ({ getValue }) => {
        const status = getValue();
        const getStatusConfig = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'active':
              return {
                color: 'bg-emerald-500',
                textColor: 'text-emerald-700',
                bgColor: 'bg-emerald-50',
                icon: <Zap className="w-3 h-3" />
              };
            case 'concept':
              return {
                color: 'bg-blue-500',
                textColor: 'text-blue-700',
                bgColor: 'bg-blue-50',
                icon: <TrendingUp className="w-3 h-3" />
              };
            case 'pending':
              return {
                color: 'bg-amber-500',
                textColor: 'text-amber-700',
                bgColor: 'bg-amber-50',
                icon: <Clock className="w-3 h-3" />
              };
            case 'completed':
              return {
                color: 'bg-green-600',
                textColor: 'text-green-700',
                bgColor: 'bg-green-50',
                icon: <CircleCheck className="w-3 h-3" />
              };
            case 'cancelled':
              return {
                color: 'bg-red-500',
                textColor: 'text-red-700',
                bgColor: 'bg-red-50',
                icon: <FileX className="w-3 h-3" />
              };
            default:
              return {
                color: 'bg-gray-500',
                textColor: 'text-gray-700',
                bgColor: 'bg-gray-50',
                icon: <Info className="w-3 h-3" />
              };
          }
        };

        const config = getStatusConfig(status as string);

        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
            <span className={`text-sm font-medium ${config.textColor}`}>
              {status as string}
            </span>
          </div>
        );
      },
    }),

    // Product Type column
    columnHelper.accessor("productType", {
      header: lang('productDataTable.type'),
      cell: ({ getValue }) => {
        const productType = getValue() as any;
        const productTypeLabel = getProductTypeLabel(productType);

        const getTypeConfig = (type: string) => {
          switch (type) {
            case 'new_product':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300';
            case 'existing_product':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300';
            case 'line_extension':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300';
            case 'legacy_product':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300';
            default:
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300';
          }
        };

        return (
          <span className={getTypeConfig(productType as string)}>
            {productTypeLabel}
          </span>
        );
      },
    }),

    // Category column
    columnHelper.accessor("product_category", {
      header: lang('productDataTable.category'),
      cell: ({ getValue, row }) => {
        const category = getValue() || row.original.product_category || "Uncategorized";
        

        if (!category || category === "Uncategorized") {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        const getCategoryConfig = (category: string) => {
          switch (category) {
            case 'Accessories':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-300';
            case 'Tinnitus Solutions':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300';
            case 'Hearing Aids':
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300';
            default:
              return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300';
          }
        };
        return (
          <span className={getCategoryConfig(category as string)}>
            {category as string}
          </span>
        );
      },
    }),

    // Progress column
    // columnHelper.accessor("progress", {
    //   header: "Progress",
    //   cell: ({ getValue }) => {
    //     const progress = (getValue() as number) || 0;

    //     const getProgressColor = (progress: number) => {
    //       if (progress < 25) return 'bg-red-500';
    //       if (progress < 50) return 'bg-orange-500';
    //       if (progress < 75) return 'bg-yellow-500';
    //       return 'bg-green-500';
    //     };

    //     const getProgressBg = (progress: number) => {
    //       if (progress < 25) return 'bg-red-100';
    //       if (progress < 50) return 'bg-orange-100';
    //       if (progress < 75) return 'bg-yellow-100';
    //       return 'bg-green-100';
    //     };

    //     return (
    //       <div className="flex items-center gap-3 w-full">
    //         <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
    //           <div
    //             className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
    //             style={{ width: `${progress}%` }}
    //           ></div>
    //         </div>
    //         <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getProgressBg(progress as number)}`}>
    //           {progress}%
    //         </span>
    //       </div>
    //     );
    //   },
    // }),

    // Target Date column
    // columnHelper.accessor("targetDate", {
    //   header: "Target Date",
    //   cell: ({ getValue }) => {
    //     const targetDate = getValue();
    //     if (!targetDate) {
    //       return <span className="text-gray-400 text-sm">Not set</span>;
    //     }

    //     return (
    //       <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border">
    //         {targetDate as string}
    //       </span>
    //     );
    //   },
    // }),

    // Platform column
    columnHelper.accessor("product_platform", {
      header: lang('productDataTable.platform'),
      cell: ({ getValue }) => {
        const platform = getValue();
        if (!platform) {
          return <span className="text-gray-400">{lang('productDataTable.custom')}</span>;
        }

        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 ring-1 ring-indigo-600/20">
            {platform as string}
          </span>
        );
      },
    }),

    // Model Reference column
    columnHelper.accessor("model_reference", {
      header: lang('productDataTable.modelReference'),
      cell: ({ getValue }) => {
        const modelReference = getValue();
        if (!modelReference) {
          return <span className="text-gray-400">{lang('productDataTable.notSet')}</span>;
        }

        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 ring-1 ring-blue-600/20">
            {modelReference as string}
          </span>
        );
      },
    }),

    // Product Variant column
    columnHelper.accessor("variant", {
      header: lang('productDataTable.productVariant'),
      cell: ({ getValue, row }) => {
        const variant = getValue() || row.original.variant;
        if (!variant) {
          return <span className="text-gray-400">{lang('productDataTable.notSet')}</span>;
        }

        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 ring-1 ring-purple-600/20">
            {variant as string}
          </span>
        );
      },
    }),

    // Alerts column
    columnHelper.display({
      id: "alerts",
      header: lang('productDataTable.alerts'),
      cell: ({ row }) => {
        const product = row.original;
        const alerts = [];

        if (product.documents && Array.isArray(product.documents)) {
          if (product.documents.some(doc => doc.status === "Overdue")) {
            alerts.push({ icon: FileX, label: lang('productDataTable.overdueDocuments'), color: "text-red-500" });
          }
        }

        if (product.audits && Array.isArray(product.audits)) {
          if (product.audits.some(audit => audit.status === "Unscheduled")) {
            alerts.push({ icon: Clock, label: lang('productDataTable.unscheduledAudit'), color: "text-amber-500" });
          }
        }

        if (product.certifications && Array.isArray(product.certifications)) {
          if (product.certifications.some(cert => cert.status === "Expiring")) {
            alerts.push({ icon: ShieldAlert, label: lang('productDataTable.expiringCertification'), color: "text-amber-500" });
          }
        }

        if (alerts.length === 0) {
          return (
            <div className="flex items-center justify-center">
              <CircleCheck className="h-4 w-4 text-green-500" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center gap-1">
            {alerts.slice(0, 2).map((alert, idx) => (
              <div key={idx} title={alert.label} className="hover:scale-110 transition-transform">
                <alert.icon className={`h-4 w-4 ${alert.color}`} />
              </div>
            ))}
            {alerts.length > 2 && (
              <span className="text-xs text-gray-500 font-medium">+{alerts.length - 2}</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    }),
    // Actions column
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCopyProduct(product)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Create Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleArchiveProduct(product)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      size: 50,
    }),
  ];
  
  return cols;
}, [lang]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      globalFilter,
    },
  });

  const handleRowClick = (product: any) => {
    navigate(`/app/product/${product.id}/device-information`);
    navigate(0)
  };

  const hasSelectedRows = selectedRows.size > 0 || table.getFilteredSelectedRowModel().rows.length > 0;

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{lang('productDataTable.title')}</h2>
        <p className="text-sm text-gray-600">
          {lang('productDataTable.showingProducts', { showing: table.getPaginationRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={lang('productDataTable.searchProducts')}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="legacy_product">Legacy Product</SelectItem>
          </SelectContent>
        </Select> */}

        <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('productDataTable.productType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('productDataTable.allProductTypes')}</SelectItem>
            <SelectItem value="new_product">{lang('productDataTable.newProduct')}</SelectItem>
            <SelectItem value="existing_product">{lang('productDataTable.productUpgrade')}</SelectItem>
            <SelectItem value="line_extension">{lang('productDataTable.lineExtension')}</SelectItem>
            <SelectItem value="legacy_product">{lang('productDataTable.legacyDevice')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('productDataTable.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('productDataTable.allCategories')}</SelectItem>
            {allProductCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Products Action Dropdown */}
      {hasSelectedRows && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {lang('productDataTable.productsSelected', { count: table.getFilteredSelectedRowModel().rows.length })}
              </span>
            </div>

            <Select value={selectedAction} onValueChange={handleActionChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={lang('productDataTable.selectAction')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang('productDataTable.allActions')}</SelectItem>
                <SelectItem value="product_category">{lang('productDataTable.deviceCategory')}</SelectItem>
                <SelectItem value="model_reference">{lang('productDataTable.modelReference')}</SelectItem>
                <SelectItem value="product_platform">{lang('productDataTable.platform')}</SelectItem>
                <SelectItem value="product_variant">{lang('productDataTable.productVariant')}</SelectItem>
                <SelectItem value="create_family" disabled={table.getFilteredSelectedRowModel().rows.length < 2}>Create Product Family</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
              </SelectContent>
            </Select>

            {/* Action-specific UI */}
            {
              selectedAction === "product_category" && (
                <Select value={selectedCategoryValue} onValueChange={setSelectedCategoryValue}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={lang('productDataTable.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang('productDataTable.allCategories')}</SelectItem>
                    {allProductCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }

            {
              selectedAction === "model_reference" && (
                <div className="flex items-center gap-2">
                  <Select value={selectedPlatformValue} onValueChange={setSelectedPlatformValue}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={lang('productDataTable.selectModelReference')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang('productDataTable.allModelReferences')}</SelectItem>
                      {companyModelReferences.map((modelReference) => (
                        <SelectItem key={modelReference} value={modelReference}>
                          {modelReference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              )
            }
            {
              selectedAction === "product_platform" && (
                <div className="flex items-center gap-2">
                  <Select value={selectedPlatformValue} onValueChange={setSelectedPlatformValue}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={lang('productDataTable.selectPlatform')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang('productDataTable.allPlatforms')}</SelectItem>
                      {allProductPlatforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              )
            }
            {
              selectedAction === "product_variant" && (
                <Select value={selectedVariantValue} onValueChange={(value) => handleVariantChange(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={lang('productDataTable.selectVariant')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang('productDataTable.allVariants')}</SelectItem>
                    {allProductVariants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            {
              selectedAction === "platform" && (
                <Select value={selectedPlatformOption} onValueChange={setSelectedPlatformOption}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={lang('productDataTable.selectPlatform')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang('productDataTable.allPlatforms')}</SelectItem>
                    {companyPlatforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            {
              allProductVariantsOptions && selectedAction === "product_variant" && (
                <Select value={selectedVariantOptionValue} onValueChange={(value) => setSelectedVariantOptionValue(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={lang('productDataTable.selectVariant')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang('productDataTable.allVariants')}</SelectItem>
                    {allProductVariantsOptions.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            {selectedAction && (
              <Button
                onClick={() => handleProductUpdate(selectedAction)}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? lang('productDataTable.updating') : lang('productDataTable.update')}
              </Button>
            )}


          </div>

          {/* Update Summary */}
          {selectedAction === "product_platform" && selectedPlatformValue !== "all" && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">{lang('productDataTable.updateSummary')}:</span>
                <span>
                  {lang('productDataTable.willUpdateWithModelReference', { count: table.getFilteredSelectedRowModel().rows.length, value: selectedPlatformValue })}
                </span>
              </div>
            </div>
          )}

          {selectedAction === "platform" && selectedPlatformOption !== "all" && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-purple-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">{lang('productDataTable.updateSummary')}:</span>
                <span>
                  {lang('productDataTable.willUpdateWithPlatform', { count: table.getFilteredSelectedRowModel().rows.length, value: selectedPlatformOption })}
                </span>
              </div>
            </div>
          )}

          {selectedAction === "product_variant" && selectedVariantValue !== "all" && selectedVariantOptionValue && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">{lang('productDataTable.updateSummary')}:</span>
                <span>
                  {lang('productDataTable.willUpdateWithVariant', { count: table.getFilteredSelectedRowModel().rows.length })} <strong>
                    {allProductVariants.find(v => v.id === selectedVariantValue)?.name} - {allProductVariantsOptions.find(o => o.id === selectedVariantOptionValue)?.name}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Table */}
      <div className="rounded-md border overflow-x-auto max-w-full">
        <Table style={{ width: '100%', minWidth: 0 }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="bg-gray-50 relative"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${header.column.getCanSort() ? "cursor-pointer select-none" : ""
                          }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                    {/* Column resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize select-none touch-none hover:bg-blue-500 ${
                          header.column.getIsResizing() ? 'bg-blue-500' : ''
                        }`}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {lang('productDataTable.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {lang('productDataTable.rowsSelected', { selected: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{lang('productDataTable.rowsPerPage')}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50, 100, 200, 300, 400, 500].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {lang('productDataTable.pageOf', { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{lang('productDataTable.goToFirstPage')}</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{lang('productDataTable.goToPreviousPage')}</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{lang('productDataTable.goToNextPage')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{lang('productDataTable.goToLastPage')}</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CreateFamilyDialog
        isOpen={showCreateFamilyDialog}
        onClose={() => setShowCreateFamilyDialog(false)}
        products={table.getFilteredSelectedRowModel().rows.map(r => ({
          id: r.original.id,
          name: r.original.name,
          basic_udi_di: r.original.basic_udi_di,
        }))}
        refetch={refetch}
      />

      <CopyProductDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        product={copyTargetProduct}
        currentCompanyId={companyId || ''}
        onConfirm={handleCopyConfirm}
      />
    </div>
  );
}