
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProductDocumentInstances(productId: string | undefined, companyId: string | undefined, currentLifecyclePhase: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [documentInstances, setDocumentInstances] = useState<any[]>([]);
  const [isCreatingInstances, setIsCreatingInstances] = useState(false);

  // Updated standard phase names to match the numbered format
  const standardPhaseNames = [
    '(1) Concept & Feasibility',
    '(2) Design Planning', 
    '(3) Design Input',
    '(4) Design Output',
    '(5) Verification',
    '(6) Validation (Design, Clinical, Usability)',
    '(7) Design Transfer',
    '(8) Design Change Control',
    '(9) Risk Management',
    '(10) Configuration Management',
    '(11) Technical Documentation',
    '(12) Clinical Evaluation',
    '(13) Post-Market Surveillance',
    '(14) Design Review',
    '(15) Design History File'
  ];

  // Enhanced phase name normalization for better matching
  const normalizePhaseNameForMatching = (phaseName: string): string => {
    return phaseName
      .toLowerCase()
      .replace(/^\(\d+\)\s*/, '') // Remove number prefix like "(1) "
      .replace(/[\(\)]/g, '') // Remove parentheses
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/&/g, '') // Remove ampersands
      .replace(/_+/g, '_') // Normalize multiple underscores to single
      .trim();
  };

  // Find best matching standard phase name
  const findMatchingStandardPhase = (phaseName: string): string | null => {
    // First try exact match
    if (standardPhaseNames.includes(phaseName)) {
      return phaseName;
    }

    // Try case-insensitive exact match
    const exactMatch = standardPhaseNames.find(sp => 
      sp.toLowerCase() === phaseName.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Try normalized matching
    const normalizedInput = normalizePhaseNameForMatching(phaseName);
    
    for (const standardPhase of standardPhaseNames) {
      const normalizedStandard = normalizePhaseNameForMatching(standardPhase);
      
      // Exact normalized match
      if (normalizedInput === normalizedStandard) {
        return standardPhase;
      }
      
      // Partial matching - check if they contain each other
      if (normalizedInput.includes(normalizedStandard) || 
          normalizedStandard.includes(normalizedInput)) {
        return standardPhase;
      }
    }

    return null;
  };

  const fetchProductDocumentInstances = async () => {
    if (!productId || !companyId || !currentLifecyclePhase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Fetching product document instances for product: ${productId}, phase: ${currentLifecyclePhase}`);

      // Get the product's lifecycle phase
      const { data: productPhase, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .eq('name', currentLifecyclePhase)
        .single();

      if (phaseError || !productPhase) {
        console.error("Product lifecycle phase not found:", phaseError);
        setDocumentInstances([]);
        setIsLoading(false);
        return;
      }

      // Get existing product document instances for this phase
      const { data: existingInstances, error: instancesError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)
        .eq('company_id', companyId)
        .eq('phase_id', productPhase.id);

      if (instancesError) {
        console.error("Error fetching product document instances:", instancesError);
        toast.error("Failed to load product documents");
        setIsLoading(false);
        return;
      }

      console.log(`Found ${existingInstances?.length || 0} existing product document instances`);
      
      // If no instances exist, automatically create them from templates
      if (!existingInstances || existingInstances.length === 0) {
        console.log("No instances found, automatically syncing with templates...");
        const result = await createInstancesFromTemplates();
        
        if (result.success && result.created > 0) {
          // Fetch the newly created instances
          const { data: newInstances, error: newInstancesError } = await supabase
            .from('documents')
            .select('*')
            .eq('product_id', productId)
            .eq('company_id', companyId)
            .eq('phase_id', productPhase.id);

          if (!newInstancesError && newInstances) {
            setDocumentInstances(newInstances);
            toast.success(`Automatically created ${result.created} document instances from company templates`);
          }
        } else {
          setDocumentInstances([]);
        }
      } else {
        setDocumentInstances(existingInstances);
      }

    } catch (error) {
      console.error("Error in fetchProductDocumentInstances:", error);
      toast.error("Failed to load product documents");
    } finally {
      setIsLoading(false);
    }
  };

  const createInstancesFromTemplates = async () => {
    if (!productId || !companyId || !currentLifecyclePhase) {
      return { success: false, created: 0 };
    }

    setIsCreatingInstances(true);
    try {
      console.log("Creating product document instances from company templates...");
      
      // Find the best matching standard phase name
      const matchingStandardPhase = findMatchingStandardPhase(currentLifecyclePhase);
      
      if (!matchingStandardPhase) {
        console.error(`No matching standard phase found for "${currentLifecyclePhase}"`);
        toast.error(`No matching phase template found for "${currentLifecyclePhase}".`);
        return { success: false, created: 0 };
      }

      console.log(`Mapped "${currentLifecyclePhase}" to standard phase: "${matchingStandardPhase}"`);

      // Get company phases that match the standard phase name
      const { data: companyPhases, error: phasesError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('name', matchingStandardPhase);

      if (phasesError) {
        console.error("Error fetching company phases:", phasesError);
        return { success: false, created: 0 };
      }

      if (!companyPhases || companyPhases.length === 0) {
        console.error(`No company phase found matching "${matchingStandardPhase}"`);
        toast.error(`No company templates found for phase "${matchingStandardPhase}". Please configure this phase in company settings.`);
        return { success: false, created: 0 };
      }

      const matchingCompanyPhase = companyPhases[0];
      console.log(`Found matching company phase: "${matchingCompanyPhase.name}"`);

      // Get company document templates for this phase
      const { data: templates, error: templatesError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', matchingCompanyPhase.id);

      if (templatesError) {
        console.error("Error fetching company templates:", templatesError);
        return { success: false, created: 0 };
      }

      if (!templates || templates.length === 0) {
        console.log(`No company templates found for phase "${matchingCompanyPhase.name}"`);
        toast.info(`No document templates configured for phase "${matchingCompanyPhase.name}". Please add templates in company settings.`);
        return { success: true, created: 0 };
      }

      console.log(`Found ${templates.length} templates for company phase "${matchingCompanyPhase.name}"`);

      // Get the product's lifecycle phase
      const { data: productPhase, error: productPhaseError } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .eq('name', currentLifecyclePhase)
        .single();

      if (productPhaseError || !productPhase) {
        console.error("Product lifecycle phase not found:", productPhaseError);
        return { success: false, created: 0 };
      }

      // Create product document instances from templates
      const instancesToCreate = templates.map(template => ({
        product_id: productId,
        company_id: companyId,
        phase_id: productPhase.id,
        name: template.name,
        status: 'In Review', // Start as In Review when assigned to product
        document_type: template.document_type || 'Standard',
        description: `Based on company template: ${template.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('documents')
        .insert(instancesToCreate);

      if (insertError) {
        console.error("Error creating document instances:", insertError);
        return { success: false, created: 0 };
      }

      console.log(`Successfully created ${instancesToCreate.length} document instances from company phase "${matchingCompanyPhase.name}"`);
      return { success: true, created: instancesToCreate.length };

    } catch (error) {
      console.error("Error in createInstancesFromTemplates:", error);
      return { success: false, created: 0 };
    } finally {
      setIsCreatingInstances(false);
    }
  };

  const syncWithTemplates = async () => {
    const result = await createInstancesFromTemplates();
    
    if (result.success) {
      if (result.created > 0) {
        toast.success(`Created ${result.created} new document instances from templates`);
        await fetchProductDocumentInstances(); // Refresh the list
      } else {
        toast.info("All templates are already instantiated for this product");
      }
    } else {
      toast.error("Failed to sync with company templates");
    }
    
    return result;
  };

  const updateDocumentInstance = (documentId: string, updates: any) => {
    setDocumentInstances(prev => 
      prev.map(doc => doc.id === documentId ? { ...doc, ...updates } : doc)
    );
  };

  useEffect(() => {
    fetchProductDocumentInstances();
  }, [productId, companyId, currentLifecyclePhase]);

  return {
    isLoading,
    documentInstances,
    isCreatingInstances,
    fetchProductDocumentInstances,
    syncWithTemplates,
    updateDocumentInstance
  };
}
