import { ProductWithBasicUDI } from './useProductsByBasicUDI';

interface FamilyPortfolioStatus {
  total: number;
  launched: number;
  inDevelopment: number;
  retired: number;
}

interface PipelineHealth {
  activeDevCount: number;
  summary: string;
  progressPercentage: number;
}

interface ComplianceMetrics {
  onMarket: number;
  activeCAPAs: number;
  criticalHolds: number;
}

interface ActionItems {
  overdueCount: number;
  criticalCount: number;
}

export interface PhaseDistribution {
  concept: number;
  designVV: number;
  regulatory: number;
  launched: number;
  retired: number;
}

export function useFamilyMetrics() {
  const calculateFamilyPortfolioStatus = (products: ProductWithBasicUDI[]): FamilyPortfolioStatus => {
    const total = products.length;
    const launched = products.filter(p => p.status?.toLowerCase().includes('launched') || p.status?.toLowerCase() === 'active').length;
    const inDevelopment = products.filter(p => p.status?.toLowerCase().includes('development') || p.status?.toLowerCase() === 'in_development').length;
    const retired = products.filter(p => p.status?.toLowerCase() === 'retired' || p.status?.toLowerCase() === 'archived').length;

    return { total, launched, inDevelopment, retired };
  };

  const calculatePipelineHealth = (products: ProductWithBasicUDI[]): PipelineHealth => {
    const devProducts = products.filter(p => 
      p.status?.toLowerCase().includes('development') || 
      p.current_lifecycle_phase?.toLowerCase().includes('design') ||
      p.current_lifecycle_phase?.toLowerCase().includes('v&v')
    );
    
    const activeDevCount = devProducts.length;
    
    // Simple categorization based on phase names
    const approachingVV = devProducts.filter(p => 
      p.current_lifecycle_phase?.toLowerCase().includes('v&v') ||
      p.current_lifecycle_phase?.toLowerCase().includes('verification')
    ).length;
    
    const inConcept = devProducts.filter(p => 
      p.current_lifecycle_phase?.toLowerCase().includes('concept') ||
      p.current_lifecycle_phase?.toLowerCase().includes('ideation')
    ).length;
    
    let summary = '';
    if (approachingVV > 0 && inConcept > 0) {
      summary = `${approachingVV} approaching V&V, ${inConcept} in Concept`;
    } else if (approachingVV > 0) {
      summary = `${approachingVV} approaching V&V`;
    } else if (inConcept > 0) {
      summary = `${inConcept} in Concept`;
    } else if (activeDevCount > 0) {
      summary = 'In various development phases';
    } else {
      summary = 'No active development';
    }
    
    const progressPercentage = products.length > 0 
      ? Math.round((products.filter(p => p.status?.toLowerCase().includes('launched')).length / products.length) * 100)
      : 0;

    return { activeDevCount, summary, progressPercentage };
  };

  const calculateComplianceMetrics = (products: ProductWithBasicUDI[]): ComplianceMetrics => {
    const onMarket = products.filter(p => p.status?.toLowerCase().includes('launched') || p.status?.toLowerCase() === 'active').length;
    
    // TODO: Replace with real CAPA data from compliance tables
    const activeCAPAs = Math.floor(Math.random() * 5); // Mocked
    const criticalHolds = 0; // Mocked
    
    return { onMarket, activeCAPAs, criticalHolds };
  };

  const calculateActionItems = (products: ProductWithBasicUDI[]): ActionItems => {
    // TODO: Replace with real overdue task/document data
    const overdueCount = Math.floor(Math.random() * 15); // Mocked
    const criticalCount = Math.floor(overdueCount * 0.3); // Mocked: ~30% critical
    
    return { overdueCount, criticalCount };
  };

  const groupProductsByPhase = (products: ProductWithBasicUDI[]): PhaseDistribution => {
    const distribution: PhaseDistribution = {
      concept: 0,
      designVV: 0,
      regulatory: 0,
      launched: 0,
      retired: 0
    };

    products.forEach(product => {
      const phase = product.current_lifecycle_phase?.toLowerCase() || '';
      const status = product.status?.toLowerCase() || '';

      if (status === 'retired' || status === 'archived') {
        distribution.retired++;
      } else if (status.includes('launched') || status === 'active') {
        distribution.launched++;
      } else if (phase.includes('concept') || phase.includes('ideation') || phase.includes('feasibility')) {
        distribution.concept++;
      } else if (phase.includes('regulatory') || phase.includes('submission') || phase.includes('approval')) {
        distribution.regulatory++;
      } else if (phase.includes('design') || phase.includes('v&v') || phase.includes('verification') || phase.includes('validation')) {
        distribution.designVV++;
      } else {
        // Default to design/development if unclear
        distribution.designVV++;
      }
    });

    return distribution;
  };

  const getPrimaryRegulatoryClass = (products: ProductWithBasicUDI[]): string => {
    if (products.length === 0) return 'Unknown';
    
    // Count occurrences of each class
    const classCounts = products.reduce((acc, p) => {
      const deviceClass = p.device_category || 'Unknown';
      acc[deviceClass] = (acc[deviceClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find most common
    const mostCommon = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : 'Unknown';
  };

  const getLifecycleStatus = (products: ProductWithBasicUDI[]): string => {
    if (products.length === 0) return 'Unknown';
    
    const statusCounts = products.reduce((acc, p) => {
      const status = p.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const uniqueStatuses = Object.keys(statusCounts).length;
    
    if (uniqueStatuses === 1) {
      const singleStatus = Object.keys(statusCounts)[0];
      if (singleStatus.toLowerCase().includes('launched')) return 'All Launched';
      if (singleStatus.toLowerCase().includes('development')) return 'In Development';
      if (singleStatus.toLowerCase() === 'retired') return 'Retired';
    }
    
    return 'Mixed';
  };

  return {
    calculateFamilyPortfolioStatus,
    calculatePipelineHealth,
    calculateComplianceMetrics,
    calculateActionItems,
    groupProductsByPhase,
    getPrimaryRegulatoryClass,
    getLifecycleStatus
  };
}
