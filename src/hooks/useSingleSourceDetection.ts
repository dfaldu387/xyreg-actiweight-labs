import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Material {
  id: string;
  componentRole: string;
  materialName: string;
  leadTimeDays?: number;
}

interface DeviceComponent {
  name: string;
  description: string;
  materials?: Material[];
}

export interface SingleSourceMaterial {
  componentName: string;
  materialId: string;
  materialName: string;
  materialRole: string;
  supplierName: string | null;
  supplierCount: number;
  leadTimeDays?: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface MaterialWithNoSupplier {
  componentName: string;
  materialId: string;
  materialName: string;
  materialRole: string;
}

export interface SingleSourceDetectionResult {
  singleSourceMaterials: SingleSourceMaterial[];
  materialsWithNoSupplier: MaterialWithNoSupplier[];
  totalMaterials: number;
}

async function detectSingleSourceMaterials(
  productId: string,
  companyId: string
): Promise<SingleSourceDetectionResult> {
  // 1. Fetch product's device_components JSONB
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('device_components')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  const deviceComponents = (product?.device_components as DeviceComponent[]) || [];
  
  // 2. Extract all materials with their component context
  const allMaterials: Array<{
    componentName: string;
    material: Material;
  }> = [];

  deviceComponents.forEach((component) => {
    (component.materials || []).forEach((material) => {
      if (material.id) {
        allMaterials.push({
          componentName: component.name,
          material,
        });
      }
    });
  });

  if (allMaterials.length === 0) {
    return {
      singleSourceMaterials: [],
      materialsWithNoSupplier: [],
      totalMaterials: 0,
    };
  }

  // 3. Fetch supplier counts for all materials
  const materialIds = allMaterials.map((m) => m.material.id);
  
  const { data: supplierLinks, error: supplierError } = await supabase
    .from('material_suppliers')
    .select(`
      material_id,
      supplier:suppliers(name)
    `)
    .eq('company_id', companyId)
    .in('material_id', materialIds);

  if (supplierError) throw supplierError;

  // 4. Count suppliers per material and get supplier names
  const supplierCountMap: Record<string, { count: number; supplierName: string | null }> = {};
  
  (supplierLinks || []).forEach((link) => {
    if (!supplierCountMap[link.material_id]) {
      supplierCountMap[link.material_id] = {
        count: 0,
        supplierName: null,
      };
    }
    supplierCountMap[link.material_id].count++;
    // Store the first supplier name (for single-source display)
    if (!supplierCountMap[link.material_id].supplierName && link.supplier) {
      supplierCountMap[link.material_id].supplierName = (link.supplier as any).name;
    }
  });

  // 5. Categorize materials
  const singleSourceMaterials: SingleSourceMaterial[] = [];
  const materialsWithNoSupplier: MaterialWithNoSupplier[] = [];

  allMaterials.forEach(({ componentName, material }) => {
    const supplierInfo = supplierCountMap[material.id];
    const supplierCount = supplierInfo?.count || 0;

    if (supplierCount === 0) {
      materialsWithNoSupplier.push({
        componentName,
        materialId: material.id,
        materialName: material.materialName,
        materialRole: material.componentRole,
      });
    } else if (supplierCount === 1) {
      // Determine risk level based on lead time and other factors
      let riskLevel: 'high' | 'medium' | 'low' = 'medium';
      if (material.leadTimeDays && material.leadTimeDays > 30) {
        riskLevel = 'high';
      } else if (material.leadTimeDays && material.leadTimeDays <= 14) {
        riskLevel = 'low';
      }

      singleSourceMaterials.push({
        componentName,
        materialId: material.id,
        materialName: material.materialName,
        materialRole: material.componentRole,
        supplierName: supplierInfo.supplierName,
        supplierCount: 1,
        leadTimeDays: material.leadTimeDays,
        riskLevel,
      });
    }
  });

  return {
    singleSourceMaterials,
    materialsWithNoSupplier,
    totalMaterials: allMaterials.length,
  };
}

export function useSingleSourceDetection(productId: string, companyId: string) {
  return useQuery({
    queryKey: ['single-source-detection', productId, companyId],
    queryFn: () => detectSingleSourceMaterials(productId, companyId),
    enabled: !!productId && !!companyId,
    staleTime: 30000, // 30 seconds
  });
}
