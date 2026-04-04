import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MDR Annex I comprehensive requirements data
const comprehensiveMdrAnnexI = {
  name: "MDR Annex I",
  framework: "EU MDR 2017/745",
  description: "Complete EU MDR Annex I General Safety and Performance Requirements",
  importance: "high" as const,
  scope: "product" as const,
  items: [
    {
      requirement: "GSPR 1 - Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose",
      section: "Chapter I - General Requirements",
      clauseId: "GSPR 1",
      clauseSummary: "General performance and safety requirements for medical devices",
      checklistItems: [
        {
          description: "Device achieves intended performance as specified by manufacturer",
          category: "verification" as const
        },
        {
          description: "Device is suitable for intended purpose under normal conditions of use",
          category: "verification" as const
        },
        {
          description: "Design and manufacturing processes ensure consistent performance",
          category: "documentation" as const
        }
      ]
    },
    {
      requirement: "GSPR 2 - The devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons",
      section: "Chapter I - General Requirements", 
      clauseId: "GSPR 2",
      clauseSummary: "Safety requirements for patients, users and other persons",
      checklistItems: [
        {
          description: "Design ensures patient clinical condition is not compromised",
          category: "verification" as const
        },
        {
          description: "Device does not compromise patient safety",
          category: "verification" as const
        },
        {
          description: "User safety and health protection measures implemented",
          category: "verification" as const
        },
        {
          description: "Third party safety considerations addressed where applicable",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 3 - The devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that the risks which may be associated with their use constitute an acceptable risk when weighed against the benefits to the patient",
      section: "Chapter I - General Requirements",
      clauseId: "GSPR 3", 
      clauseSummary: "Risk-benefit analysis requirements",
      checklistItems: [
        {
          description: "Risk-benefit analysis conducted and documented",
          category: "documentation" as const
        },
        {
          description: "Risks constitute acceptable level when weighed against patient benefits",
          category: "verification" as const
        },
        {
          description: "Risk management process implemented throughout device lifecycle",
          category: "compliance" as const
        }
      ]
    },
    {
      requirement: "GSPR 4 - Devices shall be designed, manufactured and packaged in such a way that their characteristics and performance during intended use are not adversely affected during transport and storage",
      section: "Chapter I - General Requirements",
      clauseId: "GSPR 4",
      clauseSummary: "Transport and storage stability requirements", 
      checklistItems: [
        {
          description: "Transport conditions validation and testing performed",
          category: "verification" as const
        },
        {
          description: "Storage conditions validated for shelf life",
          category: "verification" as const
        },
        {
          description: "Packaging design protects device characteristics during transport/storage",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 5 - Devices shall be designed and manufactured in such a way that all known and foreseeable risks, and any undesirable side effects, are minimised and are acceptable when weighed against the evaluated benefits",
      section: "Chapter I - General Requirements",
      clauseId: "GSPR 5",
      clauseSummary: "Risk minimisation and acceptability requirements",
      checklistItems: [
        {
          description: "All known and foreseeable risks identified and assessed",
          category: "documentation" as const
        },
        {
          description: "Risk minimisation measures implemented and validated", 
          category: "verification" as const
        },
        {
          description: "Undesirable side effects identified and minimised",
          category: "verification" as const
        },
        {
          description: "Residual risks are acceptable when weighed against benefits",
          category: "compliance" as const
        }
      ]
    },
    {
      requirement: "GSPR 6 - Devices shall be designed, manufactured and supplied in such a way that they comply with the provisions of this Regulation during their intended lifetime",
      section: "Chapter I - General Requirements", 
      clauseId: "GSPR 6",
      clauseSummary: "Lifetime compliance requirements",
      checklistItems: [
        {
          description: "Device intended lifetime defined and validated",
          category: "documentation" as const
        },
        {
          description: "Compliance maintained throughout entire intended lifetime",
          category: "verification" as const
        },
        {
          description: "End-of-life considerations and disposal instructions provided",
          category: "documentation" as const
        }
      ]
    },
    {
      requirement: "GSPR 7.1 - Devices shall be designed and manufactured in such a way that they can be used safely and effectively by lay persons, where that is the intended use",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 7.1", 
      clauseSummary: "Lay person use safety requirements",
      checklistItems: [
        {
          description: "Usability validation conducted for lay person use",
          category: "verification" as const
        },
        {
          description: "Instructions for use appropriate for lay person understanding",
          category: "documentation" as const
        },
        {
          description: "Safety features prevent misuse by untrained users",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 7.2 - Devices shall be designed and manufactured in such a way that they are suitable for their intended purpose and do not transfer contaminants to the patient or user",
      section: "Chapter II - Requirements regarding design and construction", 
      clauseId: "GSPR 7.2",
      clauseSummary: "Contamination prevention requirements",
      checklistItems: [
        {
          description: "Contamination risks assessed and controlled",
          category: "verification" as const
        },
        {
          description: "Materials and design prevent contaminant transfer",
          category: "verification" as const
        },
        {
          description: "Cleaning and disinfection procedures validated where applicable",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 7.3 - Devices shall be designed and manufactured in such a way that they do not adversely affect the environment in which they are intended to be used",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 7.3", 
      clauseSummary: "Environmental compatibility requirements",
      checklistItems: [
        {
          description: "Environmental impact assessment conducted",
          category: "documentation" as const
        },
        {
          description: "Device operation does not adversely affect intended use environment",
          category: "verification" as const
        },
        {
          description: "Environmental conditions for use defined and validated",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 7.4 - Devices shall be designed and manufactured in such a way that use under abnormal conditions is either prevented or the consequences are made evident to the user",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 7.4",
      clauseSummary: "Abnormal conditions prevention and indication requirements", 
      checklistItems: [
        {
          description: "Abnormal use conditions identified and assessed",
          category: "documentation" as const
        },
        {
          description: "Design features prevent use under abnormal conditions where possible",
          category: "verification" as const
        },
        {
          description: "Clear indication systems alert user to abnormal conditions",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 8.1 - Devices shall be designed and manufactured in such a way that they provide an appropriate degree of protection against mechanical risks",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 8.1",
      clauseSummary: "Mechanical protection requirements",
      checklistItems: [
        {
          description: "Mechanical risks identified and assessed",
          category: "documentation" as const
        },
        {
          description: "Mechanical protection measures implemented and tested",
          category: "verification" as const
        },
        {
          description: "Structural integrity validated under expected mechanical stresses",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 8.2 - Where devices are intended to be used together with other devices or equipment, the whole combination shall be safe and shall not impair the specified performance of the devices",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 8.2",
      clauseSummary: "Device combination safety requirements",
      checklistItems: [
        {
          description: "Device combinations identified and risk assessed",
          category: "documentation" as const
        },
        {
          description: "Safety of device combinations validated",
          category: "verification" as const
        },
        {
          description: "Performance maintained when used in specified combinations",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 8.3 - Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks posed by substances or particles that may be released from the device",
      section: "Chapter II - Requirements regarding design and construction", 
      clauseId: "GSPR 8.3",
      clauseSummary: "Substance/particle release minimisation requirements",
      checklistItems: [
        {
          description: "Potential substance/particle releases identified and assessed",
          category: "documentation" as const
        },
        {
          description: "Design minimises risks from released substances/particles",
          category: "verification" as const
        },
        {
          description: "Biocompatibility testing conducted for substances in contact with body",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 8.4 - Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks posed by the unintentional ingress of substances into the device",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 8.4", 
      clauseSummary: "Ingress protection requirements",
      checklistItems: [
        {
          description: "Ingress risks identified and protection measures implemented", 
          category: "verification" as const
        },
        {
          description: "IP rating determined and validated where applicable",
          category: "verification" as const
        },
        {
          description: "Sealing and protective barriers tested for effectiveness",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 8.5 - Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks arising from the reasonably foreseeable misuse of the device",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 8.5",
      clauseSummary: "Misuse risk reduction requirements",
      checklistItems: [
        {
          description: "Reasonably foreseeable misuse scenarios identified",
          category: "documentation" as const
        },
        {
          description: "Design features implemented to prevent or mitigate misuse",
          category: "verification" as const
        },
        {
          description: "Use error analysis conducted and mitigation measures validated",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 9.1 - For devices which incorporate software or which are medical device software, the software shall be developed and manufactured in accordance with the state of the art",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 9.1",
      clauseSummary: "Software development state of art requirements",
      checklistItems: [
        {
          description: "Software development follows current state of the art practices",
          category: "compliance" as const
        },
        {
          description: "Software lifecycle processes documented and followed",
          category: "documentation" as const
        },
        {
          description: "Software architecture and design documented",
          category: "documentation" as const
        }
      ]
    },
    {
      requirement: "GSPR 9.2 - Software referred to in the first subparagraph shall be developed according to a software lifecycle process and risk management system",
      section: "Chapter II - Requirements regarding design and construction", 
      clauseId: "GSPR 9.2",
      clauseSummary: "Software lifecycle and risk management requirements",
      checklistItems: [
        {
          description: "Software lifecycle process established and documented",
          category: "documentation" as const
        },
        {
          description: "Software risk management system implemented",
          category: "compliance" as const
        },
        {
          description: "Software verification and validation activities conducted",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 10.1 - Devices that deliver energy or substances to the patient shall be designed and manufactured in such a way that the amount delivered can be controlled by the user",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 10.1", 
      clauseSummary: "Energy/substance delivery control requirements",
      checklistItems: [
        {
          description: "User control mechanisms for energy/substance delivery implemented",
          category: "verification" as const
        },
        {
          description: "Delivery amount control accuracy validated",
          category: "verification" as const
        },
        {
          description: "Safety limits and alarms implemented for delivery control",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 10.2 - Where the amount of energy delivered or substances delivered by a device to a patient may be hazardous, the device shall be equipped with the means of controlling and/or limiting the amount delivered",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 10.2",
      clauseSummary: "Hazardous delivery control and limiting requirements", 
      checklistItems: [
        {
          description: "Hazardous delivery levels identified and risk assessed",
          category: "documentation" as const
        },
        {
          description: "Control and limiting mechanisms implemented and validated",
          category: "verification" as const
        },
        {
          description: "Safety systems prevent hazardous delivery levels",
          category: "verification" as const
        }
      ]
    },
    {
      requirement: "GSPR 10.3 - Devices shall be designed and manufactured in such a way that the output can be verified by the user",
      section: "Chapter II - Requirements regarding design and construction",
      clauseId: "GSPR 10.3",
      clauseSummary: "Output verification requirements",
      checklistItems: [
        {
          description: "Output verification mechanisms provided for user",
          category: "verification" as const
        },
        {
          description: "Output measurement accuracy validated",
          category: "verification" as const
        },
        {
          description: "User instructions for output verification provided",
          category: "documentation" as const
        }
      ]
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId } = await req.json();
    
    if (!templateId) {
      return new Response(
        JSON.stringify({ error: 'Template ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting bulk import for template: ${templateId}`);

    // Verify template exists
    const { data: template, error: templateError } = await supabaseClient
      .from('gap_analysis_templates')
      .select('id, name')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing items for this template
    const { error: deleteError } = await supabaseClient
      .from('gap_template_items')
      .delete()
      .eq('template_id', templateId);

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Existing items cleared successfully');

    // Prepare all items for bulk insert
    const allItems = [];
    let itemIndex = 0;

    for (const item of comprehensiveMdrAnnexI.items) {
      for (const checklistItem of item.checklistItems) {
        allItems.push({
          template_id: templateId,
          clause: item.clauseId,
          section: item.section,
          requirement: item.requirement,
          description: checklistItem.description,
          category: checklistItem.category,
          framework: comprehensiveMdrAnnexI.framework,
          chapter: item.section,
          clause_description: item.clauseSummary,
          priority: 'high', // All MDR requirements are high priority
          question_number: (itemIndex + 1).toString()
        });
        itemIndex++;
      }
    }

    console.log(`Prepared ${allItems.length} items for insertion`);

    // Bulk insert all items
    const { data: insertedItems, error: insertError } = await supabaseClient
      .from('gap_template_items')
      .insert(allItems)
      .select('id');

    if (insertError) {
      console.error('Error inserting items:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert items', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      success: true,
      template_name: template.name,
      items_imported: insertedItems?.length || 0,
      total_requirements: comprehensiveMdrAnnexI.items.length,
      framework: comprehensiveMdrAnnexI.framework,
      scope: comprehensiveMdrAnnexI.scope,
      importance: comprehensiveMdrAnnexI.importance
    };

    console.log('Bulk import completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in bulk-import-mdr-requirements function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});