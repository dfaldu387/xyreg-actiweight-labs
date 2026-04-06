import { Product } from '@/types/client';
import { DocumentSection } from '@/types/documentComposer';

function makeParagraph(id: string, text: string, isAI = false) {
  return { id, type: 'paragraph' as const, content: text, isAIGenerated: isAI };
}

function makeSection(id: string, title: string, order: number, lines: string[]): DocumentSection {
  const filtered = lines.filter(Boolean);
  const content = filtered.length > 0
    ? filtered.map((line, i) => makeParagraph(`${id}-${i}`, line))
    : [makeParagraph(`${id}-0`, '')];
  return { id, title, content, order };
}

function fmt(label: string, value: string | undefined | null): string {
  return value ? `**${label}:** ${value}` : '';
}

function fmtOrTbd(label: string, value: string | undefined | null): string {
  return `**${label}:** ${value || '*[To be completed]*'}`;
}

function fmtBool(label: string, value: boolean | undefined): string {
  if (value === undefined || value === null) return '';
  return `**${label}:** ${value ? 'Yes' : 'No'}`;
}

function fmtBoolOrTbd(label: string, value: boolean | undefined): string {
  if (value === undefined || value === null) return `**${label}:** *[To be completed]*`;
  return `**${label}:** ${value ? 'Yes' : 'No'}`;
}

function fmtList(label: string, items: string[] | undefined | null): string {
  if (!Array.isArray(items) || items.length === 0) return '';
  return `**${label}:**\n${items.map(i => `• ${i}`).join('\n')}`;
}

function fmtListOrTbd(label: string, items: string[] | undefined | null): string {
  if (!Array.isArray(items) || items.length === 0) return `**${label}:** *[To be completed]*`;
  return `**${label}:**\n${items.map(i => `• ${i}`).join('\n')}`;
}

/** Strip HTML tags for plain-text rendering in document */
function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// ── Tab-specific builders (concise, no regulatory preamble) ────────

function buildOverviewSection(product: Product): DocumentSection {
  return makeSection('overview', '1. Device Description', 0, [
    fmt('Device Name', product.name),
    fmt('Trade Name', product.trade_name),
    fmt('Model / Reference', product.model_reference || product.model_version),
    fmt('Article Number', product.article_number),
    fmt('Description', product.description),
    fmt('Device Summary', product.device_summary),
    fmt('Device Category', product.device_category),
    fmt('Risk Class', product.class),
    fmt('Version', product.version),
    fmt('Product Platform', product.product_platform),
    fmt('Current Lifecycle Phase', product.current_lifecycle_phase),
  ]);
}

function buildPurposeSection(product: Product): DocumentSection {
  const ipd = product.intended_purpose_data || {};
  return makeSection('purpose', '2. Intended Purpose & Clinical Benefits', 1, [
    fmt('Intended Use', product.intended_use),
    fmt('Clinical Purpose', ipd.clinicalPurpose),
    fmt('Indications', ipd.indications),
    fmt('Target Population', ipd.targetPopulation),
    fmt('User Profile', ipd.userProfile),
    fmt('Use Environment', ipd.useEnvironment),
    fmt('Duration of Use', ipd.durationOfUse),
    fmt('Mode of Action', ipd.modeOfAction),
    fmtList('Indications for Use', product.indications_for_use),
    fmtList('Contraindications', product.contraindications),
    fmtList('Clinical Benefits', product.clinical_benefits),
    fmtList('Intended Users', product.intended_users),
    fmtList('Warnings', ipd.warnings),
    fmtList('Essential Performance', ipd.essentialPerformance),
  ]);
}

function buildBasicsSection(product: Product): DocumentSection {
  const dc = (typeof product.device_type === 'object' ? product.device_type : {}) as Record<string, any>;
  const boolFields: string[] = [];
  const boolMap: Record<string, string> = {
    isImplantable: 'Implantable', isActive: 'Active Device', isNonInvasive: 'Non-Invasive',
    isSingleUse: 'Single Use', isReusable: 'Reusable', isSoftwareAsaMedicalDevice: 'Software as Medical Device',
    isCustomMade: 'Custom Made', isInVitroDiagnostic: 'In Vitro Diagnostic',
    isDeliveredSterile: 'Delivered Sterile', hasMeasuringFunction: 'Measuring Function',
  };
  Object.entries(boolMap).forEach(([key, label]) => {
    if (dc[key] === true) boolFields.push(`• ${label}`);
  });

  return makeSection('basics', '3. Device Classification & Characteristics', 2, [
    fmt('Device Category', product.device_category),
    fmt('Risk Class', product.class),
    fmt('Invasiveness Level', dc.invasivenessLevel),
    fmt('Duration of Contact', dc.durationOfContact),
    fmt('Anatomical Location', dc.anatomicalLocation),
    fmt('Energy Type', dc.energyType),
    fmt('Expected Service Life', dc.expectedServiceLife),
    fmt('Operating Temperature', dc.operatingTempRange),
    boolFields.length > 0 ? `**Device Characteristics:**\n${boolFields.join('\n')}` : '',
    fmtList('Key Features', Array.isArray(product.key_features) ? product.key_features as string[] : []),
  ]);
}

function buildIdentificationSection(product: Product): DocumentSection {
  return makeSection('identification', '4. Device Identification (UDI)', 3, [
    fmt('Basic UDI-DI', product.basic_udi_di),
    fmt('UDI-DI', product.udi_di),
    fmt('UDI-PI', product.udi_pi),
    fmt('GTIN', product.gtin),
    fmt('Article Number', product.article_number),
    fmt('EUDAMED Registration Number', product.eudamed_registration_number),
    fmt('Registration Status', product.registration_status),
    fmt('Registration Date', product.registration_date ? String(product.registration_date) : undefined),
  ]);
}

function buildRegulatorySection(product: Product): DocumentSection {
  return makeSection('regulatory', '5. Conformity Assessment & Standards', 4, [
    fmt('Conformity Assessment Route', product.conformity_assessment_route || product.conformity_route),
    fmt('CE Mark Status', product.ce_mark_status),
    fmt('Notified Body', product.notified_body),
    fmt('Regulatory Status', product.regulatory_status),
    fmt('Market Authorization Holder', product.market_authorization_holder),
    fmtList('ISO Certifications', product.iso_certifications),
    fmtList('Device Compliance Standards', product.device_compliance),
  ]);
}

function buildMarketsSection(product: Product): DocumentSection {
  const markets = product.markets;
  const lines: string[] = [];

  if (Array.isArray(markets) && markets.length > 0) {
    markets.forEach((m: any) => {
      if (typeof m === 'string') {
        lines.push(`• ${m}`);
      } else if (m?.code || m?.name) {
        const name = m.name || m.code;
        const riskClass = m.riskClass || m.risk_class || '';
        lines.push(`• **${name}**${riskClass ? ` — Risk Class: ${riskClass}` : ''}`);
      }
    });
  }

  return makeSection('markets', '7. Regulatory & Market Information', 6, [
    fmt('Conformity Assessment Route', product.conformity_assessment_route || product.conformity_route),
    fmt('Notified Body', product.notified_body),
    fmt('CE Mark Status', product.ce_mark_status),
    fmt('Regulatory Status', product.regulatory_status),
    lines.length > 0 ? `**Target Markets:**\n${lines.join('\n')}` : '',
    fmtList('ISO Certifications', product.iso_certifications),
    fmtList('Device Compliance Standards', product.device_compliance),
  ]);
}

function buildRiskSection(product: Product): DocumentSection {
  return makeSection('risk', '6. Risk Management Summary', 5, [
    fmt('Risk Class', product.class),
    fmt('Device Category', product.device_category),
    '*(Refer to the product risk management file for detailed hazard analysis, risk evaluation, and control measures.)*',
  ]);
}

function buildManufacturerSection(product: Product): DocumentSection {
  return makeSection('manufacturer', '8. Manufacturer & Authorized Representative', 7, [
    fmt('Manufacturer', product.manufacturer),
    fmt('EU Authorized Representative', product.eu_representative),
    fmt('Market Authorization Holder', product.market_authorization_holder),
    fmt('Facility Street Address', product.facility_street_address),
    fmt('City', product.facility_city),
    fmt('State / Province', product.facility_state_province),
    fmt('Postal Code', product.facility_postal_code),
    fmt('Country', product.facility_country),
    fmt('Facility Locations', product.facility_locations),
  ]);
}

function buildComponentsSection(product: Product): DocumentSection {
  const comps = Array.isArray(product.device_components) ? product.device_components : [];
  const lines = comps.map(c => `• **${c.name}**: ${c.description || 'N/A'}`);
  return makeSection('components', '5. Device Architecture & Components', 4, [
    lines.length > 0 ? lines.join('\n') : '*(No components defined)*',
  ]);
}

function buildVariantsSection(product: Product): DocumentSection {
  const variants = (product as any).variants;
  const lines: string[] = [];
  if (Array.isArray(variants) && variants.length > 0) {
    variants.forEach((v: any) => {
      lines.push(`• **${v.name || v.variant_name || 'Variant'}**: ${v.description || 'N/A'}`);
    });
  }
  return makeSection('variants', '9. Product Variants & Configurations', 8, [
    lines.length > 0 ? lines.join('\n') : '*(No variants defined for this device)*',
  ]);
}

function buildBundlesSection(product: Product): DocumentSection {
  const bundles = (product as any).bundles;
  const lines: string[] = [];
  if (Array.isArray(bundles) && bundles.length > 0) {
    bundles.forEach((b: any) => {
      lines.push(`• **${b.name || b.bundle_name || 'Bundle'}**: ${b.description || 'N/A'}`);
    });
  }
  return makeSection('bundles', '9. Product Variants & Configurations', 8, [
    lines.length > 0 ? `**Bundles:**\n${lines.join('\n')}` : '*(No bundle configurations defined)*',
  ]);
}

// ── Tab ID to builder mapping ──────────────────────────────────────

const TAB_BUILDERS: Record<string, (p: Product) => DocumentSection[]> = {
  overview: (p) => [buildOverviewSection(p), buildManufacturerSection({ ...p } as Product)],
  purpose: (p) => [buildPurposeSection(p)],
  basics: (p) => [buildBasicsSection(p), buildComponentsSection(p)],
  identification: (p) => [buildIdentificationSection(p)],
  'markets-regulatory': (p) => [buildMarketsSection(p)],
  regulatory: (p) => [buildRegulatorySection(p)],
  risk: (p) => [buildRiskSection(p)],
  variants: (p) => [buildVariantsSection(p)],
  bundles: (p) => [buildBundlesSection(p)],
};

const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  purpose: 'Intended Purpose',
  basics: 'General Information',
  identification: 'Identification',
  'markets-regulatory': 'Markets & Regulatory',
  regulatory: 'Regulatory',
  risk: 'Risk Management',
  variants: 'Variants',
  bundles: 'Bundles',
};

/** Build sections for a single tab */
export function buildTabDeviceInfoSections(product: Product, tabId: string): DocumentSection[] {
  const builder = TAB_BUILDERS[tabId];
  if (!builder) {
    return TAB_BUILDERS.overview(product);
  }
  const sections = builder(product);
  return sections.map((s, i) => ({ ...s, order: i }));
}

// ── helpers for building the FULL document's device-characteristic flags ──

function buildAllCharacteristicFlags(dc: Record<string, any>): string {
  const fullBoolMap: Record<string, string> = {
    isImplantable: 'Implantable',
    isActive: 'Active Device',
    isNonInvasive: 'Non-Invasive',
    isSingleUse: 'Single Use',
    isReusable: 'Reusable',
    isSoftwareAsaMedicalDevice: 'Software as a Medical Device (SaMD)',
    isSoftwareMobileApp: 'Software / Mobile Application',
    isCustomMade: 'Custom Made',
    isInVitroDiagnostic: 'In Vitro Diagnostic (IVD)',
    isDeliveredSterile: 'Delivered Sterile',
    isIntendedToBeSterile: 'Intended to Be Sterile',
    isNonSterile: 'Non-Sterile',
    canBeSterilized: 'Can Be Sterilized / Re-sterilized',
    hasMeasuringFunction: 'Has Measuring Function',
    isReusableSurgicalInstrument: 'Reusable Surgical Instrument',
    isSystemOrProcedurePack: 'System / Procedure Pack',
    containsHumanAnimalMaterial: 'Contains Human/Animal-Origin Material',
    incorporatesMedicinalSubstance: 'Incorporates Medicinal Substance',
    isAccessoryToMedicalDevice: 'Accessory to a Medical Device',
    containsNanomaterials: 'Contains Nanomaterials',
    isAbsorbedByBody: 'Absorbed by the Body',
    administersMedicine: 'Administers Medicine',
    deliversTherapeuticEnergy: 'Delivers Therapeutic Energy',
    deliversDiagnosticEnergy: 'Delivers Diagnostic Energy',
    // Power source
    isBatteryPowered: 'Battery Powered',
    isMainsPowered: 'Mains Powered',
    isManualOperation: 'Manual Operation',
    isWirelessCharging: 'Wireless Charging',
    // Connectivity
    hasBluetooth: 'Bluetooth Connectivity',
    hasWifi: 'Wi-Fi Connectivity',
    hasCellular: 'Cellular Connectivity',
    hasUsb: 'USB Connectivity',
    hasNoConnectivity: 'No Connectivity',
    // AI/ML
    hasImageAnalysis: 'AI/ML — Image Analysis',
    hasPredictiveAnalytics: 'AI/ML — Predictive Analytics',
    hasNaturalLanguageProcessing: 'AI/ML — Natural Language Processing',
    hasPatternRecognition: 'AI/ML — Pattern Recognition',
    hasNoAiMlFeatures: 'No AI/ML Features',
  };

  const yesItems: string[] = [];
  const noItems: string[] = [];
  Object.entries(fullBoolMap).forEach(([key, label]) => {
    if (dc[key] === true) yesItems.push(`• ✅ ${label}`);
    else if (dc[key] === false) noItems.push(`• ❌ ${label}`);
  });
  if (yesItems.length === 0 && noItems.length === 0) return '';
  return `**Device Type Characteristics:**\n${yesItems.join('\n')}${noItems.length > 0 ? '\n' + noItems.join('\n') : ''}`;
}

/** Build sections for the full device definition (ISO 13485 / MDR Annex II compliant) */
export function buildFullDeviceInfoSections(product: Product): DocumentSection[] {
  const p = product as any; // access fields not on strict TS type
  const deviceName = product.name || '*[Device Name]*';

  // ────────────────────────────────────────────────────────────────
  // Chapter 1: Scope & Purpose
  // ────────────────────────────────────────────────────────────────
  const scopeSection = makeSection('scope', '1. Scope & Purpose', 0, [
    `*Per MDR Annex II, Section 1 and ISO 13485:2016 §7.3, the manufacturer shall maintain a device description and specification document as part of the technical documentation.*`,
    '',
    `This document provides the complete Device Description and Specification for **${deviceName}**. It serves as the primary reference within the technical file, consolidating all essential device information required for regulatory review and conformity assessment.`,
    '',
    fmtOrTbd('Product Name', product.name),
    fmtOrTbd('Risk Class', product.class),
    fmtOrTbd('Current Lifecycle Phase', product.current_lifecycle_phase),
    fmt('Product Platform', product.product_platform),
    fmt('Base Product Name', product.base_product_name),
    fmtBool('Line Extension', product.is_line_extension),
    fmt('Parent Product ID', product.parent_product_id),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 2: Device Description
  // ────────────────────────────────────────────────────────────────
  const descSection = makeSection('device-description', '2. Device Description', 1, [
    `*Per MDR Annex II §1.1(a), a general description of the device shall be provided, including its intended purpose, trade name, and any variants.*`,
    '',
    fmtOrTbd('Device Name', product.name),
    fmtOrTbd('Trade Name', product.trade_name),
    fmtOrTbd('Model / Reference', product.model_reference || product.model_version),
    fmt('Article Number', product.article_number),
    fmtOrTbd('Description', product.description),
    fmt('Device Summary', product.device_summary),
    fmtOrTbd('Device Category', product.device_category),
    fmt('Version', product.version),
    fmt('Product Platform', product.product_platform),
    fmt('Base Product Name', product.base_product_name),
    // EMDN
    fmt('EMDN Code', p.emdn_code),
    fmt('EMDN Category', p.emdn_description || p.emdn_category),
    // Reference number
    fmt('Reference Number', p.reference_number),
    // TRL
    fmt('Technology Readiness Level (TRL)', p.trl_level),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 3: Intended Purpose & Clinical Benefits
  // ────────────────────────────────────────────────────────────────
  const ipd = product.intended_purpose_data || {} as any;

  // Handle structured arrays for target population, use environment, intended users
  const targetPopArr = Array.isArray(ipd.targetPopulationItems)
    ? ipd.targetPopulationItems.map((t: any) => typeof t === 'string' ? t : t.label || t.name || JSON.stringify(t))
    : [];
  const useEnvArr = Array.isArray(ipd.useEnvironmentItems)
    ? ipd.useEnvironmentItems.map((e: any) => typeof e === 'string' ? e : e.label || e.name || JSON.stringify(e))
    : [];
  const intendedUserArr = Array.isArray(ipd.intendedUserItems)
    ? ipd.intendedUserItems.map((u: any) => typeof u === 'string' ? u : u.label || u.name || JSON.stringify(u))
    : [];

  const purposeSection = makeSection('intended-purpose', '3. Intended Purpose & Clinical Benefits', 2, [
    `*Per MDR Annex II §1.1(b), the intended purpose including medical indications, target patient population, intended user, and use environment shall be specified.*`,
    '',
    fmtOrTbd('Intended Use', product.intended_use ? stripHtml(product.intended_use) : undefined),
    fmtOrTbd('Clinical Purpose', ipd.clinicalPurpose),
    fmt('Intended Function', ipd.intendedFunction),
    fmt('Value Proposition', ipd.valueProposition),
    fmt('Intended Use Category', ipd.intendedUseCategory),
    fmtOrTbd('Indications', ipd.indications),
    fmtOrTbd('Mode of Action', ipd.modeOfAction),
    '',
    '**3.1 Target Population**',
    fmtOrTbd('Target Population', ipd.targetPopulation),
    targetPopArr.length > 0 ? fmtList('Structured Target Population', targetPopArr) : '',
    fmt('Target Population Description', ipd.targetPopulationDescription ? stripHtml(ipd.targetPopulationDescription) : undefined),
    '',
    '**3.2 Intended Users**',
    fmtListOrTbd('Intended Users', product.intended_users),
    intendedUserArr.length > 0 ? fmtList('Structured Intended Users', intendedUserArr) : '',
    fmt('Intended Users Description', ipd.intendedUsersDescription ? stripHtml(ipd.intendedUsersDescription) : undefined),
    fmtOrTbd('User Profile', ipd.userProfile),
    '',
    '**3.3 Use Environment & Duration**',
    fmtOrTbd('Use Environment', ipd.useEnvironment),
    useEnvArr.length > 0 ? fmtList('Structured Use Environment', useEnvArr) : '',
    fmt('Use Environment Description', ipd.useEnvironmentDescription ? stripHtml(ipd.useEnvironmentDescription) : undefined),
    fmtOrTbd('Duration of Use', ipd.durationOfUse),
    fmt('Use Trigger', ipd.useTrigger),
    fmt('Use Trigger Description', ipd.useTriggerDescription ? stripHtml(ipd.useTriggerDescription) : undefined),
    '',
    '**3.4 Clinical Benefits & Indications**',
    fmtListOrTbd('Indications for Use', product.indications_for_use),
    fmtListOrTbd('Contraindications', product.contraindications),
    fmtListOrTbd('Clinical Benefits', product.clinical_benefits),
    fmtList('Warnings', ipd.warnings),
    fmtList('Essential Performance', ipd.essentialPerformance),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 4: Safety & Usage
  // ────────────────────────────────────────────────────────────────
  const safetySection = makeSection('safety-usage', '4. Safety & Usage Information', 3, [
    `*Per MDR Annex I General Safety & Performance Requirements, the manufacturer shall document known side effects, residual risks, interactions, and disposal instructions.*`,
    '',
    fmtListOrTbd('Side Effects', ipd.sideEffects),
    fmtListOrTbd('Residual Risks', ipd.residualRisks),
    fmtListOrTbd('Interactions', ipd.interactions),
    fmtOrTbd('Disposal Instructions', ipd.disposalInstructions),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 5: Device Classification & Characteristics
  // ────────────────────────────────────────────────────────────────
  const dc = (typeof product.device_type === 'object' ? product.device_type : {}) as Record<string, any>;
  const charFlags = buildAllCharacteristicFlags(dc);

  const classificationSection = makeSection('classification', '5. Device Classification & Characteristics', 4, [
    `*Per MDR Annex VIII and ISO 13485:2016 §7.3.3, the classification rationale and device characteristics shall be documented.*`,
    '',
    '**5.1 Classification**',
    fmtOrTbd('Device Category', product.device_category),
    fmtOrTbd('Risk Class', product.class),
    fmt('Primary Regulatory Type', p.primary_regulatory_type),
    fmt('Core Device Nature', dc.invasivenessLevel || p.core_device_nature),
    fmt('EMDN Code', p.emdn_code),
    fmt('EMDN Category', p.emdn_description || p.emdn_category),
    fmt('Technology Readiness Level (TRL)', p.trl_level),
    '',
    '**5.2 Physical & Environmental Characteristics**',
    fmt('Invasiveness Level', dc.invasivenessLevel),
    fmt('Duration of Contact', dc.durationOfContact),
    fmt('Anatomical Location', dc.anatomicalLocation),
    fmt('Surface Area (cm²)', dc.surfaceArea != null ? String(dc.surfaceArea) : undefined),
    fmt('Energy Type', dc.energyType),
    fmt('Energy Transfer Direction', dc.energyTransferDirection),
    fmt('Energy Transfer Type', dc.energyTransferType),
    fmt('Biological Origin', dc.biologicalOrigin),
    fmt('Expected Service Life', dc.expectedServiceLife),
    '',
    '**5.3 Operating Conditions**',
    fmt('Operating Temperature Range', dc.operatingTempRange),
    fmt('Operating Humidity', dc.operatingHumidity),
    fmt('Operating Pressure', dc.operatingPressure),
    fmt('Transport Temperature Range', dc.transportTempRange),
    fmt('Transport Humidity', dc.transportHumidity),
    fmt('Transport Pressure', dc.transportPressure),
    '',
    '**5.4 Electrical Characteristics**',
    fmt('Rated Voltage', dc.ratedVoltage),
    fmt('Rated Frequency', dc.ratedFrequency),
    fmt('Rated Current / Power', dc.ratedCurrentPower),
    fmt('Protection Class', dc.protectionClass),
    fmt('Applied Part Type', dc.appliedPartType),
    fmt('IP Water Rating', dc.ipWaterRating),
    fmt('Portability Class', dc.portabilityClass),
    fmt('Operation Mode', dc.operationMode),
    fmt('Duty Cycle', dc.dutyCycle),
    '',
    '**5.5 Device Type Flags**',
    charFlags || '*[To be completed]*',
    '',
    '**5.6 IVD-Specific Information**',
    fmt('Specimen Type', p.specimen_type || ipd.specimenType),
    fmt('Testing Environment', p.testing_environment || ipd.testingEnvironment),
    fmt('Analytical Performance', p.analytical_performance || ipd.analyticalPerformance),
    fmt('Clinical Performance', p.clinical_performance || ipd.clinicalPerformance),
    '',
    '**5.7 Software Classification**',
    fmt('Software Classification', p.software_classification || ipd.softwareClassification),
    fmt('SaMD Category', p.samd_category),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 6: Device Architecture & Components
  // ────────────────────────────────────────────────────────────────
  const comps = product.device_components || [];
  const compHeaderRow = '| Component | Type | Material / Construction | Description |';
  const compSepRow = '| --- | --- | --- | --- |';
  const compRows = comps.map((c: any) => {
    const type = c.type || c.component_type || '—';
    const material = c.material_construction || c.material || '—';
    const desc = c.description || '—';
    return `| ${c.name} | ${type} | ${material} | ${desc} |`;
  });
  const compTable = comps.length > 0
    ? `${compHeaderRow}\n${compSepRow}\n${compRows.join('\n')}`
    : '*(No components defined — to be completed)*';

  // Key features — structured
  const keyFeatures = product.key_features || [];
  let keyFeaturesBlock = '';
  if (keyFeatures.length > 0) {
    // Check if structured objects
    const structured = keyFeatures.map((f: any) => {
      if (typeof f === 'string') return `• ${f}`;
      const name = f.name || f.label || f.feature || 'Feature';
      const cat = f.category ? ` [${f.category}]` : '';
      const ep = f.isEssentialPerformance ? ' ⚡ Essential Performance' : '';
      const gov = f.governance ? ` (${f.governance})` : '';
      return `• **${name}**${cat}${ep}${gov}`;
    });
    keyFeaturesBlock = `**Key Features:**\n${structured.join('\n')}`;
  }

  // Essential Performance
  const epItems = ipd.essentialPerformance || p.essential_performance || [];
  const epBlock = Array.isArray(epItems) && epItems.length > 0
    ? `**Essential Performance:**\n${epItems.map((e: any) => typeof e === 'string' ? `• ${e}` : `• ${e.name || e.label || JSON.stringify(e)}`).join('\n')}`
    : '';

  const archSection = makeSection('architecture', '6. Device Architecture & Components', 5, [
    `*Per MDR Annex II §1.1(c), the design and manufacturing specifications including materials of construction shall be described.*`,
    '',
    '**6.1 Components**',
    compTable,
    '',
    keyFeaturesBlock || '**Key Features:** *[To be completed]*',
    '',
    epBlock,
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 7: Device Identification (UDI/EUDAMED)
  // ────────────────────────────────────────────────────────────────
  const udiSection = makeSection('udi', '7. Device Identification (UDI/EUDAMED)', 6, [
    `*Per MDR Article 27 and Regulation (EU) 2017/745, devices shall be assigned a unique device identifier in accordance with the UDI system.*`,
    '',
    fmtOrTbd('Basic UDI-DI', product.basic_udi_di),
    fmtOrTbd('UDI-DI', product.udi_di),
    fmt('UDI-PI', product.udi_pi),
    fmt('GTIN', product.gtin),
    fmt('Article Number', product.article_number),
    fmtOrTbd('EUDAMED Registration Number', product.eudamed_registration_number),
    fmtOrTbd('Registration Status', product.registration_status),
    fmt('Registration Date', product.registration_date ? String(product.registration_date) : undefined),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 8: Storage, Sterility & Handling
  // ────────────────────────────────────────────────────────────────
  const ssh = p.storage_sterility_handling || {};
  const sterileMethods: Record<string, string> = {
    gamma: 'Gamma Irradiation', eto: 'Ethylene Oxide (EtO)', e_beam: 'E-Beam',
    x_ray: 'X-Ray', steam: 'Steam/Autoclave', other: 'Other',
  };
  const sterileMethodLabel = ssh.sterilizationMethod
    ? (sterileMethods[ssh.sterilizationMethod] || ssh.sterilizationMethod)
    : undefined;

  const envControls = Array.isArray(ssh.specialEnvironmentalControls)
    ? ssh.specialEnvironmentalControls.map((c: string) => {
        const map: Record<string, string> = {
          keep_dry: 'Keep Dry', protect_light: 'Protect from Light / UV',
          protect_heat: 'Protect from Heat', keep_frozen: 'Keep Frozen',
          protect_radiation: 'Protect from Radiation',
        };
        return map[c] || c;
      })
    : [];

  const handlingPrec = Array.isArray(ssh.handlingPrecautions)
    ? ssh.handlingPrecautions.map((h: string) => {
        const map: Record<string, string> = {
          fragile: 'Fragile / Handle with Care',
          this_way_up: 'This Way Up ⬆️',
          no_damaged_package: 'Do Not Use if Package is Damaged',
        };
        return map[h] || h;
      })
    : [];

  const tempUnit = ssh.storageTemperatureUnit === 'fahrenheit' ? '°F' : '°C';
  const tempRange = (ssh.storageTemperatureMin != null || ssh.storageTemperatureMax != null)
    ? `${ssh.storageTemperatureMin ?? '—'} to ${ssh.storageTemperatureMax ?? '—'} ${tempUnit}`
    : undefined;
  const humRange = (ssh.storageHumidityMin != null || ssh.storageHumidityMax != null)
    ? `${ssh.storageHumidityMin ?? '—'}% to ${ssh.storageHumidityMax ?? '—'}%`
    : undefined;
  const shelfLife = ssh.shelfLifeValue
    ? `${ssh.shelfLifeValue} ${ssh.shelfLifeUnit || 'months'}`
    : undefined;

  const storageSection = makeSection('storage-sterility', '8. Storage, Sterility & Handling', 7, [
    `*Per MDR Annex I §10.3 and ISO 13485:2016 §7.5.11, the manufacturer shall document storage conditions, sterility requirements, and handling instructions.*`,
    '',
    '**8.1 Sterility Information**',
    fmtBoolOrTbd('Device is Delivered Sterile', ssh.isSterile),
    fmt('Sterilization Method', sterileMethodLabel),
    ssh.sterilizationMethod === 'other' ? fmt('Sterilization Method (Other)', ssh.sterilizationMethodOther) : '',
    fmt('Sterility Assurance Level (SAL)', ssh.sterilityAssuranceLevel),
    fmt('Sterile Barrier System Description', ssh.sterileBarrierSystemDescription),
    '',
    '**8.2 Storage & Transport Conditions**',
    fmt('Storage Temperature Range', tempRange),
    fmt('Storage Humidity Range', humRange),
    fmtList('Special Environmental Controls', envControls),
    fmt('Other Storage Requirements', ssh.otherStorageRequirements),
    '',
    '**8.3 Shelf Life & Handling**',
    fmt('Shelf Life', shelfLife),
    fmtList('Handling Precautions', handlingPrec),
    fmt('Other Handling Instructions', ssh.otherHandlingInstructions),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 9: User Instructions & Additional Information
  // ────────────────────────────────────────────────────────────────
  const ui = product.user_instructions || {} as any;
  const customFields = p.custom_fields || ipd.customFields;
  let customFieldsBlock = '';
  if (customFields && typeof customFields === 'object') {
    const entries = Array.isArray(customFields)
      ? customFields.map((cf: any) => `• **${cf.label || cf.key}:** ${cf.value || '*[To be completed]*'}`)
      : Object.entries(customFields).map(([k, v]) => `• **${k}:** ${v || '*[To be completed]*'}`);
    if (entries.length > 0) customFieldsBlock = `**Custom Fields:**\n${entries.join('\n')}`;
  }

  const instructionsSection = makeSection('user-instructions', '9. User Instructions & Additional Information', 8, [
    `*Per MDR Annex I §23 and ISO 13485:2016 §7.3.2, instructions for use shall be documented.*`,
    '',
    fmtOrTbd('How to Use', ui.how_to_use),
    fmt('Charging Instructions', ui.charging),
    fmt('Maintenance Instructions', ui.maintenance),
    '',
    customFieldsBlock,
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 10: Regulatory & Market Information
  // ────────────────────────────────────────────────────────────────
  const marketLines: string[] = [];
  const markets = product.markets;
  if (Array.isArray(markets) && markets.length > 0) {
    markets.forEach((m: any) => {
      if (typeof m === 'string') {
        marketLines.push(`• ${m}`);
      } else if (m?.code || m?.name) {
        const name = m.name || m.code;
        const riskClass = m.riskClass || m.risk_class || '';
        const nb = m.notifiedBody || m.notified_body || '';
        const route = m.conformityAssessmentRoute || m.conformity_assessment_route || '';
        const launch = m.launchDate || m.launch_date || '';
        const status = m.regulatoryStatus || m.regulatory_status || '';
        let line = `• **${name}**`;
        if (riskClass) line += ` — Risk Class: ${riskClass}`;
        if (nb) line += ` | Notified Body: ${nb}`;
        if (route) line += ` | Route: ${route}`;
        if (status) line += ` | Status: ${status}`;
        if (launch) line += ` | Launch: ${launch}`;
        marketLines.push(line);
      }
    });
  }

  // Strategic partners
  const sp = p.strategic_partners || {};
  const spLines: string[] = [];
  if (sp.distributionPartners) spLines.push(`• **Distribution:** ${sp.distributionPartners}`);
  if (sp.manufacturingPartners) spLines.push(`• **Manufacturing:** ${sp.manufacturingPartners}`);
  if (sp.clinicalPartners) spLines.push(`• **Clinical:** ${sp.clinicalPartners}`);
  if (sp.regulatoryPartners) spLines.push(`• **Regulatory:** ${sp.regulatoryPartners}`);

  const regSection = makeSection('reg-markets', '10. Regulatory & Market Information', 9, [
    `*Per MDR Annex II §1.2, the manufacturer shall identify the markets and applicable regulatory requirements for each intended market.*`,
    '',
    fmtOrTbd('Conformity Assessment Route', product.conformity_assessment_route || product.conformity_route),
    fmtOrTbd('Notified Body', product.notified_body),
    fmtOrTbd('CE Mark Status', product.ce_mark_status),
    fmtOrTbd('Regulatory Status', product.regulatory_status),
    fmt('Market Authorization Holder', product.market_authorization_holder),
    '',
    marketLines.length > 0 ? `**Target Markets:**\n${marketLines.join('\n')}` : '**Target Markets:** *[To be completed]*',
    '',
    fmtListOrTbd('ISO Certifications', product.iso_certifications),
    fmtListOrTbd('Device Compliance Standards', product.device_compliance),
    '',
    spLines.length > 0 ? `**Strategic Partners:**\n${spLines.join('\n')}` : '',
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 11: Manufacturer & Authorized Representative
  // ────────────────────────────────────────────────────────────────
  const mfgSection = makeSection('manufacturer', '11. Manufacturer & Authorized Representative', 10, [
    `*Per MDR Article 10 and ISO 13485:2016 §4.2.2, the manufacturer and any authorized representative shall be clearly identified.*`,
    '',
    fmtOrTbd('Manufacturer', product.manufacturer),
    fmtOrTbd('EU Authorized Representative', product.eu_representative),
    fmt('Market Authorization Holder', product.market_authorization_holder),
    fmtOrTbd('Facility Street Address', product.facility_street_address),
    fmtOrTbd('City', product.facility_city),
    fmt('State / Province', product.facility_state_province),
    fmtOrTbd('Postal Code', product.facility_postal_code),
    fmtOrTbd('Country', product.facility_country),
    fmt('Facility Locations', product.facility_locations),
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 12: Product Variants & Configurations
  // ────────────────────────────────────────────────────────────────
  const variants = (product as any).variants;
  const variantLines: string[] = [];
  if (Array.isArray(variants) && variants.length > 0) {
    variants.forEach((v: any) => {
      const name = v.name || v.variant_name || 'Variant';
      const desc = v.description || 'N/A';
      const udi = v.udi_di ? ` | UDI-DI: ${v.udi_di}` : '';
      variantLines.push(`• **${name}**: ${desc}${udi}`);
    });
  }
  const bundles = (product as any).bundles;
  const bundleLines: string[] = [];
  if (Array.isArray(bundles) && bundles.length > 0) {
    bundles.forEach((b: any) => {
      bundleLines.push(`• **${b.name || b.bundle_name || 'Bundle'}**: ${b.description || 'N/A'}`);
    });
  }

  // Family / master device
  const familyLine = p.parent_product_id
    ? fmt('Parent / Master Device', p.parent_product_id)
    : '';

  const variantsSection = makeSection('variants-config', '12. Product Variants & Configurations', 11, [
    `*Per MDR Annex II §1.1(a), all variants and configurations of the device shall be documented.*`,
    '',
    familyLine,
    variantLines.length > 0 ? `**Variants:**\n${variantLines.join('\n')}` : '**Variants:** *(No variants defined)*',
    bundleLines.length > 0 ? `**Bundle Configurations:**\n${bundleLines.join('\n')}` : '',
  ]);

  // ────────────────────────────────────────────────────────────────
  // Chapter 13: References
  // ────────────────────────────────────────────────────────────────
  const referencesSection = makeSection('references', '13. References', 12, [
    `*This section lists applicable standards, regulations, and linked documents referenced throughout this specification.*`,
    '',
    fmtList('ISO Certifications', product.iso_certifications),
    fmtList('Device Compliance Standards', product.device_compliance),
    '• EU Regulation 2017/745 (MDR)',
    '• ISO 13485:2016 — Medical devices — Quality management systems',
    '• ISO 14971:2019 — Application of risk management to medical devices',
    '*(Additional referenced documents should be listed as they are linked to the device record.)*',
  ]);

  return [
    scopeSection,
    descSection,
    purposeSection,
    safetySection,
    classificationSection,
    archSection,
    udiSection,
    storageSection,
    instructionsSection,
    regSection,
    mfgSection,
    variantsSection,
    referencesSection,
  ];
}

/** Get a human label for a tab */
export function getTabLabel(tabId: string): string {
  return TAB_LABELS[tabId] || 'Device Information';
}
