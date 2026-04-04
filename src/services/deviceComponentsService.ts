import { supabase } from '@/integrations/supabase/client';

export interface DbDeviceComponent {
  id: string;
  product_id: string;
  company_id: string;
  parent_id: string | null; // deprecated — kept for backward compat
  parent_ids: string[]; // many-to-many parents from hierarchy table
  name: string;
  description: string;
  component_type: 'hardware' | 'software' | 'sub_assembly';
  sort_order: number;
  part_number: string | null;
  is_master_source: boolean;
  is_root_level: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  linked_features?: { id: string; feature_name: string }[];
  children?: DbDeviceComponent[];
}

export interface CreateDeviceComponentData {
  product_id: string;
  company_id: string;
  parent_ids?: string[];
  parent_id?: string | null; // deprecated — use parent_ids
  name: string;
  description?: string;
  component_type?: 'hardware' | 'software' | 'sub_assembly';
  sort_order?: number;
  part_number?: string | null;
  is_master_source?: boolean;
}

export interface UpdateDeviceComponentData {
  name?: string;
  description?: string;
  component_type?: 'hardware' | 'software' | 'sub_assembly';
  parent_ids?: string[];
  parent_id?: string | null; // deprecated — use parent_ids
  sort_order?: number;
  part_number?: string | null;
  is_master_source?: boolean;
}

export class DeviceComponentsService {
  /** Fetch all components for a product, flat list with linked features and parent_ids */
  static async getByProduct(productId: string): Promise<DbDeviceComponent[]> {
    // Fetch components
    const { data, error } = await supabase
      .from('device_components')
      .select('*, linked_features:device_component_features(id, feature_name)')
      .eq('product_id', productId)
      .order('sort_order')
      .order('name');
    if (error) throw error;

    const components = (data || []) as unknown as DbDeviceComponent[];

    // Fetch hierarchy links for all these components
    const compIds = components.map(c => c.id);
    if (compIds.length > 0) {
      const { data: links } = await supabase
        .from('device_component_hierarchy')
        .select('parent_id, child_id')
        .in('child_id', compIds);

      const parentMap = new Map<string, string[]>();
      (links || []).forEach((link: any) => {
        const existing = parentMap.get(link.child_id) || [];
        existing.push(link.parent_id);
        parentMap.set(link.child_id, existing);
      });

      components.forEach(c => {
        c.parent_ids = parentMap.get(c.id) || [];
        c.parent_id = c.parent_ids[0] || null; // backward compat
      });
    } else {
      components.forEach(c => {
        c.parent_ids = [];
        c.parent_id = null;
      });
    }

    return components;
  }

  /** Build a tree from a flat list — components with multiple parents appear under each parent */
  static buildTree(components: DbDeviceComponent[]): DbDeviceComponent[] {
    const map = new Map<string, DbDeviceComponent>();
    components.forEach(c => map.set(c.id, { ...c, children: [] }));

    // Pass 1: attach each component under ALL its parents
    components.forEach(c => {
      (c.parent_ids || []).forEach(pid => {
        const parent = map.get(pid);
        if (parent) {
          parent.children!.push(map.get(c.id)!);
        }
      });
    });

    // Pass 2: collect roots and deep-clone to break shared references
    const deepClone = (node: DbDeviceComponent): DbDeviceComponent => ({
      ...node,
      children: (node.children || []).map(deepClone),
    });

    return components
      .filter(c => (c.parent_ids || []).length === 0 || c.is_root_level)
      .map(c => deepClone(map.get(c.id)!));
  }

  static async create(input: CreateDeviceComponentData): Promise<DbDeviceComponent> {
    const { data, error } = await supabase
      .from('device_components')
      .insert({
        product_id: input.product_id,
        company_id: input.company_id,
        parent_id: null, // keep column null, use hierarchy table
        name: input.name,
        description: input.description || '',
        component_type: input.component_type || 'hardware',
        sort_order: input.sort_order || 0,
        part_number: input.part_number || null,
        is_master_source: input.is_master_source ?? false,
      })
      .select('*, linked_features:device_component_features(id, feature_name)')
      .single();
    if (error) throw error;

    const comp = data as unknown as DbDeviceComponent;
    comp.parent_ids = [];
    comp.parent_id = null;
    comp.is_root_level = true;

    // Set parents via hierarchy table
    const parentIds = input.parent_ids || (input.parent_id ? [input.parent_id] : []);
    if (parentIds.length > 0) {
      await this.setParents(comp.id, parentIds);
      comp.parent_ids = parentIds;
      comp.parent_id = parentIds[0];
      // Components created with parents are not root-level
      await supabase.from('device_components').update({ is_root_level: false }).eq('id', comp.id);
      comp.is_root_level = false;
    }

    return comp;
  }

  static async update(id: string, updates: UpdateDeviceComponentData): Promise<DbDeviceComponent> {
    // Extract parent_ids before passing to DB update (not a column)
    const { parent_ids, parent_id, ...dbUpdates } = updates;

    let comp: DbDeviceComponent;

    // Parent-only updates would send an empty payload to PostgREST and fail.
    if (Object.keys(dbUpdates).length > 0) {
      const { data, error } = await supabase
        .from('device_components')
        .update(dbUpdates)
        .eq('id', id)
        .select('*, linked_features:device_component_features(id, feature_name)')
        .single();
      if (error) throw error;
      comp = data as unknown as DbDeviceComponent;
    } else {
      const { data, error } = await supabase
        .from('device_components')
        .select('*, linked_features:device_component_features(id, feature_name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      comp = data as unknown as DbDeviceComponent;
    }

    // Update hierarchy if parent_ids provided
    if (parent_ids !== undefined) {
      await this.setParents(id, parent_ids);
      comp.parent_ids = parent_ids;
      comp.parent_id = parent_ids[0] || null;
      // When explicitly setting parents via edit dialog, update root status
      const newIsRoot = parent_ids.length === 0;
      await supabase.from('device_components').update({ is_root_level: newIsRoot }).eq('id', id);
      comp.is_root_level = newIsRoot;
    } else if (parent_id !== undefined) {
      // Legacy single parent_id support
      await this.setParents(id, parent_id ? [parent_id] : []);
      comp.parent_ids = parent_id ? [parent_id] : [];
      comp.parent_id = parent_id;
    }

    return comp;
  }

  static async delete(id: string): Promise<void> {
    // Hierarchy rows will cascade-delete automatically
    const { error } = await supabase.from('device_components').delete().eq('id', id);
    if (error) throw error;
  }

  /** Set the parent components for a child (replace all) */
  static async setParents(childId: string, parentIds: string[]): Promise<void> {
    // Delete existing parent links
    await supabase.from('device_component_hierarchy').delete().eq('child_id', childId);
    // Insert new
    if (parentIds.length > 0) {
      const rows = parentIds.map(pid => ({ parent_id: pid, child_id: childId }));
      const { error } = await supabase.from('device_component_hierarchy').insert(rows);
      if (error) throw error;
    }
  }

  /** Add a single parent link (for drag-to-reparent) */
  static async addParent(childId: string, parentId: string): Promise<void> {
    const { error } = await supabase
      .from('device_component_hierarchy')
      .upsert({ parent_id: parentId, child_id: childId }, { onConflict: 'parent_id,child_id' });
    if (error) throw error;
  }

  /** Remove a single parent link */
  static async removeParent(childId: string, parentId: string): Promise<void> {
    const { error } = await supabase
      .from('device_component_hierarchy')
      .delete()
      .eq('parent_id', parentId)
      .eq('child_id', childId);
    if (error) throw error;
  }

  /** Set the linked features for a component (replace all) */
  static async setLinkedFeatures(componentId: string, featureNames: string[]): Promise<void> {
    // Delete existing
    await supabase.from('device_component_features').delete().eq('component_id', componentId);
    // Insert new
    if (featureNames.length > 0) {
      const rows = featureNames.map(fn => ({ component_id: componentId, feature_name: fn }));
      const { error } = await supabase.from('device_component_features').insert(rows);
      if (error) throw error;
    }
  }
}
