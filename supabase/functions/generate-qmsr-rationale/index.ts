import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackTokenUsage, extractLovableAIUsage, checkAiCredits, logAiTokenUsage } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Context interfaces for each RBR type
interface ValidationContext {
  activity_description: string;
  process_type: string;
  hazard_identified: string;
  severity_of_harm: 'Critical' | 'Major' | 'Minor';
  probability_of_occurrence: 'Frequent' | 'Occasional' | 'Remote';
}

interface SupplierContext {
  supplier_name: string;
  component_role: string;
  safety_impact: 'Direct Impact' | 'Indirect Impact' | 'No Impact';
  criticality_class: string;
}

interface SampleSizeContext {
  failure_mode: string;
  severity_level: 'Critical' | 'Major' | 'Minor';
  sample_size: number;
  statistical_method: string;
  test_description?: string;
}

interface DesignChangeContext {
  change_description: string;
  affected_design_outputs: string[];
  risk_impact: 'critical' | 'high' | 'medium' | 'low';
  product_name?: string;
}

interface CAPAPriorityContext {
  event_description: string;
  source_type: 'NCR' | 'Audit Finding' | 'Customer Complaint';
  severity: number;
  probability: number;
  is_recurring: boolean;
  similar_events_count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, companyId } = await req.json();
    console.log('[generate-qmsr-rationale] Request received:', { type, companyId });

    if (!type || !context) {
      throw new Error('Type and context are required');
    }

    // Check AI credits before processing
    if (companyId) {
      const creditCheck = await checkAiCredits(companyId);
      if (!creditCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "NO_CREDITS",
            message: "No AI credits remaining. Purchase an AI Booster Pack to continue.",
            used: creditCheck.used,
            limit: creditCheck.limit,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt: string;
    let userPrompt: string;

    // ============= VALIDATION RATIONALE =============
    if (type === 'validation') {
      const ctx = context as ValidationContext;
      systemPrompt = `You are an expert FDA QMSR and ISO 13485 compliance specialist generating Risk-Based Rationale documents.

Your task is to generate a QMSR-compliant rationale explaining why the validation rigor level is appropriate for the risk involved.

Key QMSR Principles:
- Under QMSR (effective Feb 2, 2026), organizations must document WHY the level of effort applied was appropriate for the risk
- Risk-Based Thinking is a documented requirement for every decision
- Reference QMSR Clause 7.1 for process validation requirements
- Use 95/95 Confidence/Reliability for Critical risks, 90/90 for Major, 80/80 for Minor

CRITICAL: Return ONLY a JSON object with the following structure - no markdown, no code blocks:
{
  "rationale_text": "The complete rationale paragraph explaining the validation approach",
  "validation_rigor": "High" | "Medium" | "Low",
  "confidence_interval": "95/95" | "90/90" | "80/80",
  "qmsr_clause_reference": "7.1",
  "determination": "Proceed with High Rigor Validation" | "Proceed with Standard Verification"
}`;

      userPrompt = `Generate a QMSR-compliant Process Validation Rationale for:

Activity Description: ${ctx.activity_description}
Process Type: ${ctx.process_type}
Hazard Identified: ${ctx.hazard_identified}
Severity of Harm: ${ctx.severity_of_harm}
Probability of Occurrence: ${ctx.probability_of_occurrence}

The rationale should:
1. Explain why the validation effort has been scaled to the appropriate level
2. Reference the specific risk factors
3. Justify the confidence interval based on severity
4. Reference QMSR Clause 7.1
5. Be written in formal regulatory language suitable for FDA inspection`;

    // ============= SUPPLIER RATIONALE =============
    } else if (type === 'supplier') {
      const ctx = context as SupplierContext;
      systemPrompt = `You are an expert FDA QMSR and ISO 13485 compliance specialist generating Risk-Based Rationale documents for supplier oversight.

Your task is to generate a QMSR-compliant rationale explaining why the supplier oversight level is appropriate for the component risk.

Key QMSR Principles:
- Under QMSR 820.10 (incorporating ISO 13485:2016 7.4.1), supplier oversight must be proportionate to risk
- Class A (Critical) components require On-Site Quality Audits and Quality Agreements
- Class B (Important) components may use Paper Audits
- Class C (Standard) components may use Certificate monitoring only
- Direct Impact on device safety requires highest oversight

CRITICAL: Return ONLY a JSON object with the following structure - no markdown, no code blocks:
{
  "rationale_text": "The complete rationale paragraph explaining the oversight approach",
  "oversight_level": "On-Site Audit" | "Paper Audit" | "Certificate Only",
  "qmsr_clause_reference": "820.10 / ISO 13485:2016 7.4.1",
  "decision": "Approved for ASL with High Oversight" | "Approved with Standard Monitoring"
}`;

      userPrompt = `Generate a QMSR-compliant Supplier Criticality Rationale for:

Supplier Name: ${ctx.supplier_name}
Component Role: ${ctx.component_role}
Safety Impact: ${ctx.safety_impact}
Criticality Class: ${ctx.criticality_class}

The rationale should:
1. Explain why the oversight level is proportionate to the risk
2. Reference the component's role in device safety
3. Justify the monitoring approach based on criticality
4. Reference QMSR 820.10 and ISO 13485:2016 7.4.1
5. Be written in formal regulatory language suitable for FDA inspection`;

    // ============= SAMPLE SIZE RATIONALE =============
    } else if (type === 'sample_size') {
      const ctx = context as SampleSizeContext;
      systemPrompt = `You are an expert FDA QMSR and ISO 13485 compliance specialist generating Risk-Based Rationale documents for sample size justification.

Your task is to generate a QMSR-compliant rationale explaining why the chosen sample size is appropriate for the failure mode severity.

Key QMSR Principles:
- Under QMSR Clause 7.3.6, statistical techniques must be proportionate to the risk
- Critical severity requires 95/95 confidence/reliability (n≥59 for zero-defect acceptance)
- Major severity typically uses 90/90 confidence/reliability (n≥32)
- Minor severity may use 80/80 confidence/reliability (n≥15)
- Sample size must be justified based on the failure mode's potential harm to patients

CRITICAL: Return ONLY a JSON object with the following structure - no markdown, no code blocks:
{
  "rationale_text": "The complete rationale paragraph explaining the sample size justification",
  "confidence_level": "95/95" | "90/90" | "80/80",
  "qmsr_clause_reference": "7.3.6",
  "determination": "Sample Size Justified" | "Increased Sample Required"
}`;

      userPrompt = `Generate a QMSR-compliant Sample Size Rationale for:

Failure Mode: ${ctx.failure_mode}
Severity Level: ${ctx.severity_level}
Proposed Sample Size: n=${ctx.sample_size}
Statistical Method: ${ctx.statistical_method}
${ctx.test_description ? `Test Description: ${ctx.test_description}` : ''}

The rationale should:
1. Explain why the sample size is statistically valid for the severity level
2. Reference binomial sampling or appropriate statistical basis
3. Justify the confidence/reliability level based on patient risk
4. Reference QMSR Clause 7.3.6
5. Be written in formal regulatory language suitable for FDA inspection`;

    // ============= DESIGN CHANGE RATIONALE =============
    } else if (type === 'design_change') {
      const ctx = context as DesignChangeContext;
      systemPrompt = `You are an expert FDA QMSR and ISO 13485 compliance specialist generating Risk-Based Rationale documents for design change classification.

Your task is to generate a QMSR-compliant rationale explaining why a design change is classified as Minor or Major.

Key QMSR Principles:
- Under QMSR Clause 7.3.9, design changes must be evaluated for impact on safety and performance
- Major changes affect intended use, safety, or performance characteristics
- Minor changes do not affect device safety or fundamental performance
- Changes affecting multiple design outputs or critical risks typically require Major classification
- Clinical data may be required for Major changes affecting safety claims

CRITICAL: Return ONLY a JSON object with the following structure - no markdown, no code blocks:
{
  "rationale_text": "The complete rationale paragraph explaining the change classification",
  "change_classification": "Minor" | "Major",
  "clinical_data_required": true | false,
  "regulatory_submission_required": true | false,
  "qmsr_clause_reference": "7.3.9",
  "determination": "Proceed as Minor Change" | "Requires Full Re-Validation"
}`;

      userPrompt = `Generate a QMSR-compliant Design Change Rationale for:

Change Description: ${ctx.change_description}
Affected Design Outputs: ${ctx.affected_design_outputs.length > 0 ? ctx.affected_design_outputs.join(', ') : 'None specified'}
Risk Impact Level: ${ctx.risk_impact}
${ctx.product_name ? `Product: ${ctx.product_name}` : ''}

The rationale should:
1. Explain why the change classification is appropriate
2. Assess impact on device safety and performance
3. Justify whether clinical data is needed
4. Reference QMSR Clause 7.3.9
5. Be written in formal regulatory language suitable for FDA inspection`;

    // ============= CAPA PRIORITY RATIONALE =============
    } else if (type === 'capa_priority') {
      const ctx = context as CAPAPriorityContext;
      const rpn = ctx.severity * ctx.probability;
      
      systemPrompt = `You are an expert FDA QMSR and ISO 13485 compliance specialist generating Risk-Based Rationale documents for CAPA promotion decisions.

IMPORTANT: This is a HIGH-SCRUTINY node for FDA inspectors. CAPA exemption decisions are closely reviewed during inspections.

Your task is to generate a QMSR-compliant rationale explaining why a nonconformance was or was not promoted to a full CAPA.

Key QMSR Principles:
- Under QMSR Clause 8.5.2, corrective action shall eliminate the cause of nonconformities
- CAPA is required when: RPN ≥ 15, severity ≥ 4, issue is recurring, or pattern detected
- Correction-only is appropriate when: low risk, isolated event, no systemic cause
- All CAPA exemption decisions must be documented with clear justification
- FDA inspectors specifically review why CAPAs were NOT initiated

CRITICAL: Return ONLY a JSON object with the following structure - no markdown, no code blocks:
{
  "rationale_text": "The complete rationale paragraph explaining the CAPA decision",
  "promoted_to_capa": true | false,
  "qmsr_clause_reference": "8.5.2",
  "determination": "CAPA Required" | "CAPA Not Required - Correction Sufficient"
}`;

      userPrompt = `Generate a QMSR-compliant CAPA Priority Rationale for:

Event Description: ${ctx.event_description}
Source Type: ${ctx.source_type}
Severity Score: ${ctx.severity}/5
Probability Score: ${ctx.probability}/5
Risk Priority Number (RPN): ${rpn}
Is Recurring: ${ctx.is_recurring ? 'Yes' : 'No'}
${ctx.similar_events_count ? `Similar Events Count: ${ctx.similar_events_count}` : ''}

The rationale should:
1. Explain why CAPA was or was not initiated based on the risk assessment
2. Reference the RPN calculation and threshold logic
3. Address whether the issue is systemic or isolated
4. Justify that correction-only is sufficient (if applicable) OR explain why CAPA is required
5. Reference QMSR Clause 8.5.2
6. Be written in formal regulatory language suitable for FDA inspection - THIS WILL BE CLOSELY REVIEWED`;

    } else {
      throw new Error('Invalid rationale type. Must be "validation", "supplier", "sample_size", "design_change", or "capa_priority"');
    }

    console.log('[generate-qmsr-rationale] Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-qmsr-rationale] AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('[generate-qmsr-rationale] AI response received');

    const generatedContent = aiData.choices?.[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error('No content generated by AI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response - remove any markdown code blocks if present
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('[generate-qmsr-rationale] Failed to parse AI response:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Track token usage in background if company_id provided
    if (companyId) {
      const usage = extractLovableAIUsage(aiData);
      if (usage) {
        EdgeRuntime.waitUntil(
          Promise.all([
            trackTokenUsage(companyId, 'gemini', usage),
            logAiTokenUsage({
              companyId,
              source: 'generate_qmsr_rationale',
              model: 'gemini-2.5-flash',
              usage: {
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
                thinkingTokens: 0,
                totalTokens: usage.totalTokens,
              },
            }),
          ])
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: parsedResponse
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[generate-qmsr-rationale] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});