
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConsolidatedPhaseDataService, Phase, PhaseCategory } from "@/components/settings/phases/ConsolidatedPhaseDataService";

export function usePhaseManagementData() {
  const { companyName } = useParams<{ companyName: string }>();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activePhases, setActivePhases] = useState<Phase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
  const [categories, setCategories] = useState<PhaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Get company ID from company name
  useEffect(() => {
    const getCompanyId = async () => {
      if (!companyName) return;
      
      try {
        const decodedName = decodeURIComponent(companyName);
        const { data: company, error } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodedName)
          .single();
          
        if (error) throw error;
        if (company) {
          setCompanyId(company.id);
        }
      } catch (error) {
        console.error('Error getting company ID:', error);
        setLoadingError('Failed to load company information');
      }
    };

    getCompanyId();
  }, [companyName]);

  const loadData = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setLoadingError(null);

      // Load phases and categories using ConsolidatedPhaseDataService
      console.log('[usePhaseManagementData] Loading phases for company:', companyId);
      const phasesResult = await ConsolidatedPhaseDataService.loadPhases(companyId);
      
      console.log('[usePhaseManagementData] Loading categories for company:', companyId);
      const categoriesResult = await ConsolidatedPhaseDataService.loadCategories(companyId);

      // Validate phase data integrity before setting state
      const activePhaseIds = new Set(phasesResult.activePhases.map(p => p.id));
      const availablePhaseIds = new Set(phasesResult.availablePhases.map(p => p.id));
      
      // Check for overlapping phases (should not happen with new logic)
      const overlapping = [...activePhaseIds].filter(id => availablePhaseIds.has(id));
      if (overlapping.length > 0) {
        console.error('[usePhaseManagementData] Found overlapping phases:', overlapping);
      }

      setActivePhases(phasesResult.activePhases);
      setAvailablePhases(phasesResult.availablePhases);
      setCategories(categoriesResult);

      console.log('[usePhaseManagementData] Data loaded successfully - Active:', phasesResult.activePhases.length, 'Available:', phasesResult.availablePhases.length);
    } catch (error) {
      console.error('[usePhaseManagementData] Error loading data:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load phase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  return {
    companyId,
    activePhases,
    setActivePhases,
    availablePhases,
    categories,
    loading,
    loadingError,
    loadData
  };
}
