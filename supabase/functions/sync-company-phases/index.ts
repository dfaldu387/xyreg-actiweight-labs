import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PhaseDocument {
  id?: string | null;
  name: string;
  document_type?: string;
  tech_applicability?: string;
  document_scope?: string;
}

interface PhaseData {
  id?: string | null;
  name: string;
  description?: string;
  position: number;
  category_id?: string | null;
  is_active: boolean;
  documents?: PhaseDocument[];
}

interface SyncPayload {
  company_id: string;
  phases: PhaseData[];
}

interface SyncResult {
  success: boolean;
  phases: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  documents: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  active_phases: {
    activated: number;
    deactivated: number;
  };
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[sync-company-phases] Starting sync operation');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: SyncPayload = await req.json();
    const { company_id, phases } = payload;

    if (!company_id || !phases) {
      throw new Error('Missing required fields: company_id and phases');
    }

    console.log(`[sync-company-phases] Syncing ${phases.length} phases for company: ${company_id}`);

    const result: SyncResult = {
      success: false,
      phases: { inserted: 0, updated: 0, deleted: 0 },
      documents: { inserted: 0, updated: 0, deleted: 0 },
      active_phases: { activated: 0, deactivated: 0 },
      errors: []
    };

    // Start transaction-like operation by fetching current state
    console.log('[sync-company-phases] Fetching current database state');

    // Fetch existing phases
    const { data: existingPhases, error: phasesError } = await supabase
      .from('company_phases')
      .select('*')
      .eq('company_id', company_id);

    if (phasesError) {
      throw new Error(`Failed to fetch existing phases: ${phasesError.message}`);
    }

    // Fetch existing documents
    const existingPhaseIds = existingPhases?.map(p => p.id) || [];
    let existingDocuments: any[] = [];
    
    if (existingPhaseIds.length > 0) {
      const { data: docs, error: docsError } = await supabase
        .from('phase_document_templates')
        .select('*')
        .in('company_phase_id', existingPhaseIds);

      if (docsError) {
        throw new Error(`Failed to fetch existing documents: ${docsError.message}`);
      }
      existingDocuments = docs || [];
    }

    // Fetch existing active phases
    const { data: existingActivePhases, error: activeError } = await supabase
      .from('company_chosen_phases')
      .select('*')
      .eq('company_id', company_id);

    if (activeError) {
      throw new Error(`Failed to fetch existing active phases: ${activeError.message}`);
    }

    console.log(`[sync-company-phases] Current state: ${existingPhases?.length || 0} phases, ${existingDocuments.length} documents, ${existingActivePhases?.length || 0} active phases`);

    // Process phases
    const payloadPhaseIds = new Set();
    const processedPhaseIds = new Map(); // Map old ID to new ID for document processing

    for (const phase of phases) {
      if (phase.id && phase.id !== null) {
        // Existing phase - check for updates
        payloadPhaseIds.add(phase.id);
        const existingPhase = existingPhases?.find(p => p.id === phase.id);
        
        if (existingPhase) {
          // Check if update is needed
          const needsUpdate = 
            existingPhase.name !== phase.name ||
            existingPhase.description !== phase.description ||
            existingPhase.position !== phase.position ||
            existingPhase.category_id !== phase.category_id;

          if (needsUpdate) {
            console.log(`[sync-company-phases] Updating phase: ${phase.name}`);
            const { error: updateError } = await supabase
              .from('company_phases')
              .update({
                name: phase.name,
                description: phase.description,
                position: phase.position,
                category_id: phase.category_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', phase.id);

            if (updateError) {
              result.errors.push(`Failed to update phase ${phase.name}: ${updateError.message}`);
            } else {
              result.phases.updated++;
            }
          }
          processedPhaseIds.set(phase.id, phase.id);
        }
      } else {
        // New phase - insert
        console.log(`[sync-company-phases] Inserting new phase: ${phase.name}`);
        const { data: newPhase, error: insertError } = await supabase
          .from('company_phases')
          .insert({
            company_id: company_id,
            name: phase.name,
            description: phase.description,
            position: phase.position,
            category_id: phase.category_id,
            is_active: true
          })
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Failed to insert phase ${phase.name}: ${insertError.message}`);
        } else {
          result.phases.inserted++;
          processedPhaseIds.set(phase.id, newPhase.id);
          payloadPhaseIds.add(newPhase.id);
        }
      }
    }

    // Delete phases not in payload
    const phasesToDelete = existingPhases?.filter(p => !payloadPhaseIds.has(p.id)) || [];
    for (const phaseToDelete of phasesToDelete) {
      console.log(`[sync-company-phases] Deleting phase: ${phaseToDelete.name}`);
      
      // First delete associated documents
      const { error: docDeleteError } = await supabase
        .from('phase_document_templates')
        .delete()
        .eq('company_phase_id', phaseToDelete.id);

      if (docDeleteError) {
        result.errors.push(`Failed to delete documents for phase ${phaseToDelete.name}: ${docDeleteError.message}`);
      }

      // Delete from chosen phases
      const { error: chosenDeleteError } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('phase_id', phaseToDelete.id)
        .eq('company_id', company_id);

      if (chosenDeleteError) {
        result.errors.push(`Failed to remove phase from chosen phases ${phaseToDelete.name}: ${chosenDeleteError.message}`);
      }

      // Delete the phase
      const { error: phaseDeleteError } = await supabase
        .from('company_phases')
        .delete()
        .eq('id', phaseToDelete.id);

      if (phaseDeleteError) {
        result.errors.push(`Failed to delete phase ${phaseToDelete.name}: ${phaseDeleteError.message}`);
      } else {
        result.phases.deleted++;
      }
    }

    // Process documents for each phase
    for (const phase of phases) {
      if (!phase.documents) continue;
      
      const phaseId = processedPhaseIds.get(phase.id);
      if (!phaseId) continue;

      const existingPhaseDocuments = existingDocuments.filter(d => d.company_phase_id === phaseId);
      const payloadDocumentIds = new Set();

      for (const doc of phase.documents) {
        if (doc.id && doc.id !== null) {
          // Existing document - check for updates
          payloadDocumentIds.add(doc.id);
          const existingDoc = existingPhaseDocuments.find(d => d.id === doc.id);
          
          if (existingDoc) {
            const needsUpdate = 
              existingDoc.name !== doc.name ||
              existingDoc.document_type !== doc.document_type ||
              existingDoc.tech_applicability !== doc.tech_applicability;

            if (needsUpdate) {
              console.log(`[sync-company-phases] Updating document: ${doc.name}`);
              const { error: updateError } = await supabase
                .from('phase_document_templates')
                .update({
                  name: doc.name,
                  document_type: doc.document_type || 'Standard',
                  tech_applicability: doc.tech_applicability || 'All device types',
                  updated_at: new Date().toISOString()
                })
                .eq('id', doc.id);

              if (updateError) {
                result.errors.push(`Failed to update document ${doc.name}: ${updateError.message}`);
              } else {
                result.documents.updated++;
              }
            }
          }
        } else {
          // New document - insert
          console.log(`[sync-company-phases] Inserting new document: ${doc.name}`);
          const { error: insertError } = await supabase
            .from('phase_document_templates')
            .insert({
              company_phase_id: phaseId,
              name: doc.name,
              document_type: doc.document_type || 'Standard',
              tech_applicability: doc.tech_applicability || 'All device types',
              document_scope: doc.document_scope || 'company_template',
              status: 'Not Started'
            });

          if (insertError) {
            result.errors.push(`Failed to insert document ${doc.name}: ${insertError.message}`);
          } else {
            result.documents.inserted++;
          }
        }
      }

      // Delete documents not in payload for this phase
      const documentsToDelete = existingPhaseDocuments.filter(d => !payloadDocumentIds.has(d.id));
      for (const docToDelete of documentsToDelete) {
        console.log(`[sync-company-phases] Deleting document: ${docToDelete.name}`);
        const { error: deleteError } = await supabase
          .from('phase_document_templates')
          .delete()
          .eq('id', docToDelete.id);

        if (deleteError) {
          result.errors.push(`Failed to delete document ${docToDelete.name}: ${deleteError.message}`);
        } else {
          result.documents.deleted++;
        }
      }
    }

    // Update active phases based on is_active flag
    const currentActivePhaseIds = new Set(existingActivePhases?.map(ap => ap.phase_id) || []);
    
    for (const phase of phases) {
      const phaseId = processedPhaseIds.get(phase.id);
      if (!phaseId) continue;

      const isCurrentlyActive = currentActivePhaseIds.has(phaseId);
      
      if (phase.is_active && !isCurrentlyActive) {
        // Activate phase
        console.log(`[sync-company-phases] Activating phase: ${phase.name}`);
        const { error: activateError } = await supabase
          .from('company_chosen_phases')
          .insert({
            company_id: company_id,
            phase_id: phaseId,
            position: phase.position
          });

        if (activateError) {
          result.errors.push(`Failed to activate phase ${phase.name}: ${activateError.message}`);
        } else {
          result.active_phases.activated++;
        }
      } else if (!phase.is_active && isCurrentlyActive) {
        // Deactivate phase
        console.log(`[sync-company-phases] Deactivating phase: ${phase.name}`);
        const { error: deactivateError } = await supabase
          .from('company_chosen_phases')
          .delete()
          .eq('company_id', company_id)
          .eq('phase_id', phaseId);

        if (deactivateError) {
          result.errors.push(`Failed to deactivate phase ${phase.name}: ${deactivateError.message}`);
        } else {
          result.active_phases.deactivated++;
        }
      } else if (phase.is_active && isCurrentlyActive) {
        // Update position if needed
        const existingActivePhase = existingActivePhases?.find(ap => ap.phase_id === phaseId);
        if (existingActivePhase && existingActivePhase.position !== phase.position) {
          console.log(`[sync-company-phases] Updating phase position: ${phase.name}`);
          const { error: updateError } = await supabase
            .from('company_chosen_phases')
            .update({ position: phase.position })
            .eq('company_id', company_id)
            .eq('phase_id', phaseId);

          if (updateError) {
            result.errors.push(`Failed to update phase position ${phase.name}: ${updateError.message}`);
          }
        }
      }
    }

    result.success = result.errors.length === 0;
    
    console.log(`[sync-company-phases] Sync completed:`, {
      phases: result.phases,
      documents: result.documents,
      active_phases: result.active_phases,
      errors: result.errors.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 207 // 207 for partial success
    });

  } catch (error) {
    console.error('[sync-company-phases] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        phases: { inserted: 0, updated: 0, deleted: 0 },
        documents: { inserted: 0, updated: 0, deleted: 0 },
        active_phases: { activated: 0, deactivated: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
