import { supabase } from '@/integrations/supabase/client';

const NA = 'Not provided';

/** Strip HTML tags and decode a few common entities so rich-text fields don't
 *  leak markup like `<p><strong>111</strong></p>` into the AI prompt. */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function fmtString(v: unknown): string {
  if (v == null) return NA;
  const s = stripHtml(String(v));
  return s ? s : NA;
}

function fmtArray(v: unknown): string {
  if (!Array.isArray(v) || v.length === 0) return NA;
  const parts = v
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return stripHtml(item);
      if (typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const raw = (o.label || o.name || o.title || o.text || o.value || JSON.stringify(o)) as string;
        return stripHtml(String(raw));
      }
      return String(item);
    })
    .filter(Boolean);
  return parts.length ? parts.join('; ') : NA;
}

function fmtJson(v: unknown): string {
  if (v == null) return NA;
  if (Array.isArray(v)) return fmtArray(v);
  if (typeof v === 'string') return fmtString(v);
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val != null && val !== '' && !(Array.isArray(val) && val.length === 0),
    );
    if (entries.length === 0) return NA;
    return entries
      .map(([k, val]) => {
        const label = k.replace(/_/g, ' ');
        let out: string;
        if (Array.isArray(val)) out = fmtArray(val);
        else if (typeof val === 'object') out = fmtJson(val);
        else out = String(val);
        return `${label}: ${out}`;
      })
      .join('; ');
  }
  return String(v);
}

function fmtMarkets(markets: unknown): string {
  if (!Array.isArray(markets) || markets.length === 0) return NA;
  const selected = (markets as any[]).filter((m) => m?.selected);
  const src = selected.length ? selected : (markets as any[]);
  const rows = src.map((m: any) => {
    const parts: string[] = [];
    parts.push(m.code || m.name || m.country || 'Unknown');
    if (m.status) parts.push(`status=${m.status}`);
    if (m.launch_status) parts.push(`launch=${m.launch_status}`);
    if (m.launched === true) parts.push('launched');
    if (m.launched === false) parts.push('planned');
    if (m.launch_date) parts.push(`on ${m.launch_date}`);
    return parts.join(' ');
  });
  return rows.join('; ');
}

/**
 * Fetches the currently selected device (product) and returns a Markdown-styled
 * context block for injection into an AI prompt. Missing fields render as
 * "Not provided" rather than being omitted, so the model can't silently
 * hallucinate values.
 */
export async function fetchLiveDeviceSnapshot(productId: string): Promise<string> {
  if (!productId) return '';
  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        [
          'name',
          'trade_name',
          'device_category',
          'device_type',
          'description',
          'device_summary',
          'class',
          'current_lifecycle_phase',
          'markets',
          'key_features',
          'key_technology_characteristics',
          'model_reference',
          'model_version',
          'images',
          'intended_use',
          'intended_purpose_data',
          'intended_users',
          'contraindications',
          'clinical_benefits',
          'user_instructions',
          'primary_regulatory_type',
          'regulatory_status',
          'conformity_assessment_route',
          'ce_mark_status',
          'notified_body',
          'basic_udi_di',
          'udi_di',
          'udi_pi',
          'gtin',
        ].join(', '),
      )
      .eq('id', productId)
      .maybeSingle();
    if (error || !data) {
      console.warn('[liveDeviceSnapshot] fetch failed', error);
      return '';
    }
    const p = data as any;
    const ipd = (p.intended_purpose_data || {}) as Record<string, unknown>;

    const lines: string[] = [];
    lines.push('--- CURRENT DEVICE CONTEXT (LIVE) ---');
    lines.push(`Fetched at: ${new Date().toISOString()} (this snapshot overrides ANY device values mentioned in earlier assistant messages in this chat — always trust the values below)`);
    lines.push(`Device: ${fmtString(p.name)}${p.trade_name ? ` (trade name: ${p.trade_name})` : ''}`);
    lines.push('');

    lines.push('### 1. Overview');
    lines.push(`- Device Category: ${fmtString(p.device_category)}`);
    lines.push(`- Risk Class: ${fmtString(p.class)}`);
    lines.push(`- Lifecycle Phase: ${fmtString(p.current_lifecycle_phase)}`);
    lines.push(`- Trade Name: ${fmtString(p.trade_name)}`);
    lines.push('');

    lines.push('### 2. General');
    lines.push(`- Definition / Description: ${fmtString(p.description || p.device_summary)}`);
    lines.push(`- Type: ${fmtString(p.device_type)}`);
    lines.push(`- Features & Components: ${fmtJson(p.key_features)}`);
    lines.push(`- Technical Specifications: ${fmtJson(p.key_technology_characteristics)}`);
    lines.push(`- Model Reference: ${fmtString(p.model_reference)}`);
    lines.push(`- Model Version: ${fmtString(p.model_version)}`);
    lines.push(`- Media: ${Array.isArray(p.images) && (p.images as any[]).length > 0 ? `${(p.images as any[]).length} image(s) attached` : NA}`);
    lines.push('');

    lines.push('### 3. Intended Purpose');
    lines.push('#### 3a. Statement of Use');
    lines.push(`- Clinical Purpose: ${fmtJson((ipd as any).clinicalPurpose)}`);
    lines.push(`- Indications: ${fmtJson((ipd as any).indications ?? p.intended_use)}`);
    lines.push(`- Mode of Action: ${fmtJson((ipd as any).modeOfAction)}`);
    lines.push(`- Value Proposition / Clinical Benefits: ${fmtJson((ipd as any).valueProposition ?? p.clinical_benefits)}`);
    lines.push(`- Intended Use Category: ${fmtString((ipd as any).intended_use_category)}`);
    lines.push('#### 3b. Context of Use');
    lines.push(`- Intended Patient Population (On Whom): ${fmtJson((ipd as any).targetPopulation)}`);
    if ((ipd as any).targetPopulationDescription) {
      lines.push(`  - Detailed description: ${fmtString((ipd as any).targetPopulationDescription)}`);
    }
    lines.push(`- Intended Users (By Whom): ${fmtJson(p.intended_users ?? (ipd as any).intendedUsers)}`);
    if ((ipd as any).intendedUsersDescription) {
      lines.push(`  - Detailed description: ${fmtString((ipd as any).intendedUsersDescription)}`);
    }
    lines.push(`- Duration of Use (How Long): ${fmtString((ipd as any).durationOfUse)}`);
    lines.push(`- Environment of Use (The Where): ${fmtJson((ipd as any).useEnvironment)}`);
    if ((ipd as any).useEnvironmentDescription) {
      lines.push(`  - Detailed description: ${fmtString((ipd as any).useEnvironmentDescription)}`);
    }
    lines.push(`- Trigger for Use (The When): ${fmtJson((ipd as any).useTrigger)}`);
    if ((ipd as any).useTriggerDescription) {
      lines.push(`  - Detailed description: ${fmtString((ipd as any).useTriggerDescription)}`);
    }
    lines.push('#### 3c. Safety & Usage');
    lines.push(`- Contraindications: ${fmtJson(p.contraindications)}`);
    lines.push(`- Warnings: ${fmtJson((ipd as any).warnings)}`);
    lines.push(`- Side Effects: ${fmtJson((ipd as any).side_effects)}`);
    lines.push(`- Residual Risks: ${fmtJson((ipd as any).residual_risks)}`);
    lines.push(`- Interactions: ${fmtJson((ipd as any).interactions)}`);
    lines.push(`- Disposal Instructions: ${fmtString((ipd as any).disposal_instructions)}`);
    lines.push(`- User Instructions: ${fmtJson(p.user_instructions)}`);
    lines.push('');

    lines.push('### 4. Market & Regulatory');
    lines.push(`- Markets: ${fmtMarkets(p.markets)}`);
    lines.push(`- Primary Regulatory Type: ${fmtString(p.primary_regulatory_type)}`);
    lines.push(`- Regulatory Status: ${fmtString(p.regulatory_status)}`);
    lines.push(`- Conformity Assessment Route: ${fmtString(p.conformity_assessment_route)}`);
    lines.push(`- CE Mark Status: ${fmtString(p.ce_mark_status)}`);
    lines.push(`- Notified Body: ${fmtString(p.notified_body)}`);
    lines.push('');

    lines.push('### 5. Identification');
    lines.push(`- Basic UDI-DI: ${fmtString(p.basic_udi_di)}`);
    lines.push(`- UDI-DI: ${fmtString(p.udi_di)}`);
    lines.push(`- UDI-PI: ${fmtString(p.udi_pi)}`);
    lines.push(`- GTIN: ${fmtString(p.gtin)}`);
    lines.push('');

    lines.push('When the user asks device-specific questions, ground answers strictly in this snapshot. If a field is "Not provided", say so — do not invent values.');
    lines.push('--- END CURRENT DEVICE CONTEXT ---');

    return lines.join('\n');
  } catch (err) {
    console.warn('[liveDeviceSnapshot] unexpected error', err);
    return '';
  }
}
