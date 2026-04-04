import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];

export interface ProductHierarchyNode {
  id: string;
  name: string;
  model_reference?: string;
  parent_product_id?: string;
  children: ProductHierarchyNode[];
  level: number;
  path: string[];
}

export class HierarchyService {
  // Get all products for a company with hierarchy information
  static async getCompanyProductHierarchy(companyId: string): Promise<ProductHierarchyNode[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, model_reference, parent_product_id')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .order('name');

    if (error) throw error;

    return this.buildHierarchy(products || []);
  }

  // Build hierarchy tree from flat product list
  static buildHierarchy(products: Pick<Product, 'id' | 'name' | 'model_reference' | 'parent_product_id'>[]): ProductHierarchyNode[] {
    const productMap = new Map<string, ProductHierarchyNode>();
    const rootProducts: ProductHierarchyNode[] = [];

    // First pass: create all nodes
    products.forEach(product => {
      const node: ProductHierarchyNode = {
        id: product.id,
        name: product.name,
        model_reference: product.model_reference || undefined,
        parent_product_id: product.parent_product_id || undefined,
        children: [],
        level: 0,
        path: []
      };
      productMap.set(product.id, node);
    });

    // Second pass: build parent-child relationships and calculate levels
    products.forEach(product => {
      const node = productMap.get(product.id)!;
      
      if (product.parent_product_id) {
        const parent = productMap.get(product.parent_product_id);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
          node.path = [...parent.path, parent.id];
        } else {
          // Parent not found, treat as root
          rootProducts.push(node);
        }
      } else {
        rootProducts.push(node);
      }
    });

    // Third pass: update paths to include self
    const updatePaths = (node: ProductHierarchyNode) => {
      node.path = [...node.path, node.id];
      node.children.forEach(updatePaths);
    };

    rootProducts.forEach(updatePaths);

    return rootProducts;
  }

  // Get all ancestors of a product (from root to parent)
  static async getProductAncestors(productId: string): Promise<Product[]> {
    const ancestors: Product[] = [];
    let currentId: string | null = productId;

    while (currentId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error || !product) break;

      ancestors.unshift(product); // Add to beginning for root-to-leaf order
      currentId = product.parent_product_id;
    }

    return ancestors;
  }

  // Get all descendants of a product (children and their children)
  static async getProductDescendants(productId: string): Promise<Product[]> {
    const descendants: Product[] = [];
    const toProcess = [productId];

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      
      const { data: children, error } = await supabase
        .from('products')
        .select('*')
        .eq('parent_product_id', currentId);

      if (error) throw error;

      if (children) {
        descendants.push(...children);
        toProcess.push(...children.map(child => child.id));
      }
    }

    return descendants;
  }

  // Get the full path from root to a specific product
  static async getProductPath(productId: string): Promise<Product[]> {
    const path: Product[] = [];
    let currentId: string | null = productId;

    while (currentId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error || !product) break;

      path.unshift(product); // Add to beginning for root-to-leaf order
      currentId = product.parent_product_id;
    }

    return path;
  }

  // Get siblings of a product (products with same parent)
  static async getProductSiblings(productId: string): Promise<Product[]> {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('parent_product_id')
      .eq('id', productId)
      .single();

    if (productError || !product) throw productError || new Error('Product not found');

    const { data: siblings, error } = await supabase
      .from('products')
      .select('*')
      .eq('parent_product_id', product.parent_product_id || '')
      .neq('id', productId);

    if (error) throw error;
    return siblings || [];
  }

  // Get root products (products with no parent)
  static async getRootProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .is('parent_product_id', null)
      .eq('is_archived', false)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Check if product A is an ancestor of product B
  static async isAncestor(ancestorId: string, descendantId: string): Promise<boolean> {
    let currentId: string | null = descendantId;

    while (currentId && currentId !== ancestorId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('parent_product_id')
        .eq('id', currentId)
        .single();

      if (error || !product) return false;
      currentId = product.parent_product_id;
    }

    return currentId === ancestorId;
  }

  // Get hierarchy depth for a product
  static async getProductDepth(productId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = productId;

    while (currentId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('parent_product_id')
        .eq('id', currentId)
        .single();

      if (error || !product) break;
      
      if (product.parent_product_id) {
        depth++;
        currentId = product.parent_product_id;
      } else {
        break;
      }
    }

    return depth;
  }

  // Find common ancestor of two products
  static async findCommonAncestor(productId1: string, productId2: string): Promise<Product | null> {
    const path1 = await this.getProductPath(productId1);
    const path2 = await this.getProductPath(productId2);

    // Find the last common product in both paths
    let commonAncestor: Product | null = null;
    const minLength = Math.min(path1.length, path2.length);

    for (let i = 0; i < minLength; i++) {
      if (path1[i].id === path2[i].id) {
        commonAncestor = path1[i];
      } else {
        break;
      }
    }

    return commonAncestor;
  }

  // Flatten hierarchy tree to a linear list with level information
  static flattenHierarchy(nodes: ProductHierarchyNode[]): ProductHierarchyNode[] {
    const flattened: ProductHierarchyNode[] = [];

    const traverse = (node: ProductHierarchyNode) => {
      flattened.push(node);
      node.children.forEach(traverse);
    };

    nodes.forEach(traverse);
    return flattened;
  }

  // Get products by model reference
  static async getProductsByModel(companyId: string, modelReference: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('model_reference', modelReference)
      .eq('is_archived', false)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}