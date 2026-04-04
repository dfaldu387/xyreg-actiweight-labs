import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BasicUDIDIGroup {
  id: string;
  company_id: string;
  basic_udi_di: string;
  internal_reference: string;
  check_character: string;
  issuing_agency: string;
  company_prefix: string;
  intended_purpose?: string;
  risk_class?: string;
  essential_characteristics?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBasicUDIAssignment {
  id: string;
  product_id: string;
  basic_udi_di_group_id: string;
  assigned_at: string;
  assigned_by?: string;
  product?: ProductInfo;
}

export interface ProductInfo {
  id: string;
  name: string;
  description?: string;
  status?: string;
  basic_udi_di?: string;
}

export function useBasicUDIDI(companyId: string) {
  const [basicUDIGroups, setBasicUDIGroups] = useState<BasicUDIDIGroup[]>([]);
  const [productAssignments, setProductAssignments] = useState<ProductBasicUDIAssignment[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Basic UDI-DI groups for the company
  const fetchBasicUDIGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('basic_udi_di_groups')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch Basic UDI-DI groups');
      return [];
    }
  }, [companyId]);

  // Fetch company products
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, status, basic_udi_di')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch products');
      return [];
    }
  }, [companyId]);

  // Compute product assignments by matching products.basic_udi_di to groups
  const computeProductAssignments = (groups: BasicUDIDIGroup[], allProducts: ProductInfo[]) => {
    const assignments: ProductBasicUDIAssignment[] = [];
    
    allProducts.forEach(product => {
      if (!product.basic_udi_di) return;
      
      // Find the group that matches this product's basic_udi_di
      const matchingGroup = groups.find(g => g.basic_udi_di === product.basic_udi_di);
      if (matchingGroup) {
        assignments.push({
          id: `${product.id}-${matchingGroup.id}`,
          product_id: product.id,
          basic_udi_di_group_id: matchingGroup.id,
          assigned_at: new Date().toISOString(),
          product: product
        });
      }
    });

    return assignments;
  };

  // Create a new Basic UDI-DI group
  const createBasicUDIGroup = async (groupData: Omit<BasicUDIDIGroup, 'id' | 'created_at' | 'updated_at'>) => {
    // Validate company_prefix is provided (stores the common prefix pattern like 1569431111NOX_)
    if (!groupData.company_prefix || groupData.company_prefix.length < 1) {
      const errorMsg = 'company_prefix is required for Basic UDI-DI group';
      console.error(errorMsg, { provided: groupData.company_prefix });
      toast.error('Company prefix pattern is required.');
      throw new Error(errorMsg);
    }

    try {
      const { data, error } = await supabase
        .from('basic_udi_di_groups')
        .insert([groupData])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh data
      const groups = await fetchBasicUDIGroups();
      setBasicUDIGroups(groups);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(groups, allProducts));
      
      toast.success('Basic UDI-DI group created successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to create Basic UDI-DI group');
      throw err;
    }
  };

  // Update a Basic UDI-DI group
  const updateBasicUDIGroup = async (groupId: string, updates: Partial<BasicUDIDIGroup>) => {
    try {
      const { data, error } = await supabase
        .from('basic_udi_di_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh data
      const groups = await fetchBasicUDIGroups();
      setBasicUDIGroups(groups);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(groups, allProducts));
      
      toast.success('Basic UDI-DI group updated successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to update Basic UDI-DI group');
      throw err;
    }
  };

  // Delete a Basic UDI-DI group
  const deleteBasicUDIGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('basic_udi_di_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      
      // Refresh data
      const groups = await fetchBasicUDIGroups();
      setBasicUDIGroups(groups);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(groups, allProducts));
      
      toast.success('Basic UDI-DI group deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to delete Basic UDI-DI group');
      throw err;
    }
  };

  // Assign products to a Basic UDI-DI group by updating products.basic_udi_di
  // AND inserting into product_basic_udi_assignments (Single Source of Truth for overview)
  // Can pass either groupId (will lookup in state or DB) or directly pass basicUdiDi
  const assignProductsToGroup = async (groupId: string, productIds: string[], basicUdiDi?: string) => {
    try {
      let udiValue = basicUdiDi;
      
      if (!udiValue) {
        // Try to find in local state first
        const group = basicUDIGroups.find(g => g.id === groupId);
        if (group) {
          udiValue = group.basic_udi_di;
        } else {
          // Fallback: query database for freshly created group
          const { data: dbGroup, error: dbError } = await supabase
            .from('basic_udi_di_groups')
            .select('basic_udi_di')
            .eq('id', groupId)
            .single();
          
          if (dbError || !dbGroup) throw new Error('Group not found');
          udiValue = dbGroup.basic_udi_di;
        }
      }

      // Update each product's basic_udi_di (legacy field)
      const { error } = await supabase
        .from('products')
        .update({ basic_udi_di: udiValue })
        .in('id', productIds);

      if (error) throw error;

      // Insert records into product_basic_udi_assignments (SSOT for overview display)
      // First delete any existing assignments for these products to this group
      const { error: deleteAssignmentsError } = await supabase
        .from('product_basic_udi_assignments')
        .delete()
        .in('product_id', productIds);

      if (deleteAssignmentsError) {
        // Keep going: we can still try inserting/updating assignments.
        console.error('Error deleting existing Basic UDI-DI assignments:', deleteAssignmentsError);
        toast.warning('Could not clear existing Basic UDI-DI assignments (permissions).');
      }

      // Insert fresh assignments
      const assignmentRecords = productIds.map(productId => ({
        product_id: productId,
        basic_udi_di_group_id: groupId,
      }));

      const { error: assignmentError } = await supabase
        .from('product_basic_udi_assignments')
        .insert(assignmentRecords);

      if (assignmentError) {
        console.error('Error inserting assignments:', assignmentError);
        toast.warning('Basic UDI-DI was saved, but the Overview link could not be recorded.');
        // Don't throw - the legacy field is already updated
      }
      
      // Refresh data
      const groups = await fetchBasicUDIGroups();
      setBasicUDIGroups(groups);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(groups, allProducts));
      
      toast.success('Products assigned to Basic UDI-DI group');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to assign products to group');
      throw err;
    }
  };

  // Remove product from a Basic UDI-DI group by clearing products.basic_udi_di
  const removeProductFromGroup = async (productId: string, _groupId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ basic_udi_di: null })
        .eq('id', productId);

      if (error) throw error;
      
      // Refresh data
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(basicUDIGroups, allProducts));
      
      toast.success('Product removed from Basic UDI-DI group');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to remove product from group');
      throw err;
    }
  };

  // Get products assigned to a specific group
  const getProductsForGroup = (groupId: string) => {
    return productAssignments.filter(assignment => 
      assignment.basic_udi_di_group_id === groupId
    );
  };

  // Get unassigned products (products without basic_udi_di)
  const getUnassignedProducts = () => {
    return products.filter(product => !product.basic_udi_di);
  };

  // Get next suggested internal reference number
  const getNextInternalReference = () => {
    const existingRefs = basicUDIGroups.map(group => group.internal_reference);
    const numericRefs = existingRefs
      .map(ref => parseInt(ref, 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    if (numericRefs.length === 0) return '001';
    
    const nextNum = numericRefs[numericRefs.length - 1] + 1;
    return nextNum.toString().padStart(3, '0');
  };

  // Get common prefix from existing Basic UDI-DI codes
  const getCommonPrefix = (): string | null => {
    if (basicUDIGroups.length === 0) return null;
    
    // Get all basic_udi_di values
    const codes = basicUDIGroups.map(g => g.basic_udi_di);
    if (codes.length === 0) return null;
    
    // Find common prefix across all codes
    const firstCode = codes[0];
    let commonPrefix = '';
    
    for (let i = 0; i < firstCode.length; i++) {
      const char = firstCode[i];
      if (codes.every(code => code[i] === char)) {
        commonPrefix += char;
      } else {
        break;
      }
    }
    
    // Return the common prefix (should be something like "1569431111NOX_")
    return commonPrefix.length > 0 ? commonPrefix : null;
  };

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [groups, allProducts] = await Promise.all([
        fetchBasicUDIGroups(),
        fetchProducts()
      ]);
      
      setBasicUDIGroups(groups);
      setProducts(allProducts);
      setProductAssignments(computeProductAssignments(groups, allProducts));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBasicUDIGroups, fetchProducts]);

  useEffect(() => {
    if (companyId) {
      refresh();
    }
  }, [companyId, refresh]);

  return {
    basicUDIGroups,
    productAssignments,
    products,
    isLoading,
    error,
    createBasicUDIGroup,
    updateBasicUDIGroup,
    deleteBasicUDIGroup,
    assignProductsToGroup,
    removeProductFromGroup,
    getProductsForGroup,
    getUnassignedProducts,
    getNextInternalReference,
    getCommonPrefix,
    refresh
  };
}
