import { supabase } from "@/integrations/supabase/client";
import { EnhancedSunburstNode } from "./portfolioSunburstService";

interface ProductWithPhase {
  id: string;
  name: string;
  status: string;
  progress: number;
  currentPhase?: {
    id: string;
    name: string;
    position: number;
  };
}

export async function getPortfolioPhasesData(companyId: string): Promise<EnhancedSunburstNode> {
  
  
  if (!companyId) {
    throw new Error('Company ID is required for portfolio data');
  }

  try {
    // Step 1: Fetch products with their current phases
    
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        status,
        progress,
        lifecycle_phases!inner(
          phase_id,
          is_current_phase,
          company_phases!inner(id, name, position)
        )
      `)
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .eq('lifecycle_phases.is_current_phase', true);

    if (productsError) {
      console.error('[PortfolioPhasesService] ❌ Products query failed:', productsError);
      throw new Error(`Failed to fetch products with phases: ${productsError.message}`);
    }

    // Step 2: Fetch all company phases to include empty ones
    const { data: allPhases, error: phasesError } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name)
      `)
      .eq('company_id', companyId)
      .order('position');

    if (phasesError) {
      console.error('[PortfolioPhasesService] ❌ Phases query failed:', phasesError);
      throw new Error(`Failed to fetch phases: ${phasesError.message}`);
    }

    

    // Step 3: Transform data
    const transformedProducts: ProductWithPhase[] = (products || []).map(product => {
      const currentPhaseRecord = product.lifecycle_phases?.[0];
      const phaseData = currentPhaseRecord?.company_phases;
      
      return {
        id: product.id,
        name: product.name,
        status: product.status || 'On Track',
        progress: product.progress || 0,
        currentPhase: phaseData ? {
          id: phaseData.id,
          name: phaseData.name,
          position: (currentPhaseRecord.company_phases as { position?: number })?.position || 0
        } : undefined
      };
    });

    // Step 4: Build phase-based sunburst structure
    const sunburstData = transformToPhaseSunburstData(transformedProducts, allPhases || []);
    
    
    return sunburstData;
    
  } catch (error) {
    console.error('[PortfolioPhasesService] 💥 Fatal error:', error);
    throw error;
  }
}

function transformToPhaseSunburstData(
  products: ProductWithPhase[], 
  allPhases: Array<{ position: number; company_phases: { id: string; name: string } }>
): EnhancedSunburstNode {
  
  
  // Create phase structure: Phase -> Status -> Products
  const phaseGroups: { [phaseName: string]: { [status: string]: ProductWithPhase[] } } = {};
  
  // Initialize all phases (including empty ones)
  allPhases.forEach(phaseInfo => {
    const phaseName = phaseInfo.company_phases.name;
    phaseGroups[phaseName] = {
      'On Track': [],
      'At Risk': [],
      'Needs Attention': []
    };
  });

  // Add "Unassigned" phase for products without a phase
  phaseGroups['Unassigned'] = {
    'On Track': [],
    'At Risk': [],
    'Needs Attention': []
  };

  // Group products by phase and status
  products.forEach(product => {
    const phaseName = product.currentPhase?.name || 'Unassigned';
    const status = product.status || 'On Track';
    
    // Ensure phase exists
    if (!phaseGroups[phaseName]) {
      phaseGroups[phaseName] = {
        'On Track': [],
        'At Risk': [],
        'Needs Attention': []
      };
    }
    
    // Ensure status exists
    if (!phaseGroups[phaseName][status]) {
      phaseGroups[phaseName][status] = [];
    }
    
    phaseGroups[phaseName][status].push(product);
  });

  // Build sunburst structure
  const phaseNodes: EnhancedSunburstNode[] = Object.entries(phaseGroups)
    .filter(([phaseName, statuses]) => {
      // Include phase if it has products or if it's a defined phase
      const hasProducts = Object.values(statuses).some(products => products.length > 0);
      const isDefinedPhase = allPhases.some(p => p.company_phases.name === phaseName);
      return hasProducts || isDefinedPhase;
    })
    .map(([phaseName, statuses]) => {
      const statusNodes: EnhancedSunburstNode[] = Object.entries(statuses)
        .filter(([_, products]) => products.length > 0) // Only include statuses with products
        .map(([status, products]) => {
          const productNodes: EnhancedSunburstNode[] = products.map(product => ({
            name: product.name,
            value: 1,
            productId: product.id
          }));

          return {
            name: status,
            children: productNodes
          };
        });

      // If no products in this phase, create empty structure
      if (statusNodes.length === 0) {
        return {
          name: phaseName,
          value: 0,
          children: []
        };
      }

      return {
        name: phaseName,
        children: statusNodes
      };
    });

  // Sort phases by their defined order
  phaseNodes.sort((a, b) => {
    const phaseA = allPhases.find(p => p.company_phases.name === a.name);
    const phaseB = allPhases.find(p => p.company_phases.name === b.name);
    
    // Put Unassigned at the end
    if (a.name === 'Unassigned') return 1;
    if (b.name === 'Unassigned') return -1;
    
    const positionA = phaseA?.position ?? 999;
    const positionB = phaseB?.position ?? 999;
    
    return positionA - positionB;
  });

  return {
    name: "Product Portfolio by Phases",
    children: phaseNodes
  };
}