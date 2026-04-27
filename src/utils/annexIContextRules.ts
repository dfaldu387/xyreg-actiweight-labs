/**
 * MDR Annex I (GSPR) — context-aware classification rules.
 *
 * Pure, deterministic, no React. Given a clause section ("10", "11", …) and the
 * device context loaded from `products.key_technology_characteristics` and a
 * few sibling fields, returns one of three statuses:
 *
 *   - "suggested_na"          → context positively excludes this clause
 *   - "unknown_needs_context" → context is silent on inputs the clause needs
 *   - "applies"               → clause is in scope
 *
 * Used by both `useGapNASuggestion` (per-clause hint) and
 * `AnnexIContextPanel` (bucketed launch-page summary).
 */

export type GapNAStatus =
  | "suggested_na"
  | "applies"
  | "unknown_needs_context";

/** Subset of `key_technology_characteristics` plus a few derived fields. */
export interface AnnexIDeviceContext {
  // --- base device classification
  deviceClass?: string | null;
  isInVitroDiagnostic?: boolean | null;

  // --- physical / contact
  isImplantable?: boolean | null;
  bodyContactType?: string | null;            // 'none' | 'surface' | 'mucosal' | 'invasive' …
  materialsInBodyContact?: string[] | null;
  /** User has deliberately confirmed the device has no body-contact materials. */
  materialsInBodyContactExplicitlyEmpty?: boolean | null;
  releasesParticles?: boolean | null;
  cmrSubstances?: boolean | null;

  // --- sterility
  isSterile?: boolean | null;                 // delivered sterile
  intendedToBeSterilised?: boolean | null;

  // --- substances
  containsMedicinalSubstance?: boolean | null;
  absorbedDispersedInBody?: boolean | null;

  // --- power / connectivity / EMC
  isPowered?: boolean | null;
  isActive?: boolean | null;
  hasConnectivity?: boolean | null;
  emcProfile?: string | null;

  // --- mechanical / thermal
  hasMovingParts?: boolean | null;
  surfaceTemperatureRisk?: boolean | null;

  // --- radiation
  emitsRadiation?: boolean | null;

  // --- software
  hasSoftware?: boolean | null;

  // --- functions
  hasMeasuringFunction?: boolean | null;
  hasDiagnosticOrMonitoringFunction?: boolean | null;

  // --- biological materials
  containsAnimalTissue?: boolean | null;
  containsHumanTissue?: boolean | null;
  containsMicroOrgs?: boolean | null;
}

export interface AnnexIRuleResult {
  status: GapNAStatus;
  /** Why the clause is N/A (suggested_na) or what it needs (unknown). */
  reason?: string;
  /** Human-readable list of fields the rule needs answered. */
  missingFields?: string[];
  /** Deep-link sub-tab inside Device Information for fixing missing fields. */
  contextDeepLink?: { tab: string; subtab?: string; anchor?: string; label: string };
}

/** Map clause → which Device Information tab the user should open to fill the gap. */
const CONTEXT_DEEP_LINKS: Record<string, { tab: string; subtab: string; anchor?: string; label: string }> = {
  "10": { tab: "basics", subtab: "technical", anchor: "materials-body-contact-section", label: "Device basics → materials & body contact" },
  "11": { tab: "basics", subtab: "technical", anchor: "sterility-section", label: "Device basics → sterility" },
  "12": { tab: "basics", subtab: "technical", anchor: "medicinal-substance-section", label: "Device basics → medicinal substance" },
  "13": { tab: "basics", subtab: "technical", anchor: "absorbed-dispersed-section", label: "Device basics → absorbed/dispersed substances" },
  "14": { tab: "basics", subtab: "technical", anchor: "connectivity-emc-section", label: "Device basics → connectivity & EMC" },
  "15": { tab: "basics", subtab: "technical", anchor: "mechanical-thermal-section", label: "Device basics → mechanical & thermal" },
  "16": { tab: "basics", subtab: "technical", anchor: "power-source-section", label: "Device basics → power & energy" },
  "17": { tab: "basics", subtab: "technical", anchor: "emits-radiation-section", label: "Device basics → radiation profile" },
  "18": { tab: "basics", subtab: "technical", anchor: "software-classification-section", label: "Device basics → software" },
  "19": { tab: "basics", subtab: "classification", anchor: "active-device-section", label: "Device basics → active device" },
  "20": { tab: "basics", subtab: "technical", anchor: "measuring-function-section", label: "Device basics → measuring function" },
  "21": { tab: "basics", subtab: "technical", anchor: "diagnostic-monitoring-section", label: "Device basics → diagnostic/monitoring" },
  "22": { tab: "basics", subtab: "technical", anchor: "biological-origin-section", label: "Device basics → biological-origin materials" },
};

const isFalse = (v: unknown): v is false => v === false;
const isUndef = (v: unknown): boolean => v === undefined || v === null;

/**
 * Resolve a single Annex I clause against the device context.
 * Returns `applies` when no rule matches — the safe default.
 */
export function resolveAnnexIClause(
  section: string,
  ctx: AnnexIDeviceContext | null | undefined
): AnnexIRuleResult {
  if (!ctx) return { status: "applies" };

  const link = CONTEXT_DEEP_LINKS[section];

  switch (section) {
    // 10 — Chemical/physical/biological
    case "10": {
      const noContact =
        (ctx.bodyContactType || "").toLowerCase() === "none";
      if (noContact && isFalse(ctx.releasesParticles)) {
        return {
          status: "suggested_na",
          reason: "No body contact and no particle release",
        };
      }
      // User has explicitly confirmed "no body-contact materials" via the
      // toggle on Technical Specs → treat materials as a definitive empty.
      const materialsAnswered =
        (Array.isArray(ctx.materialsInBodyContact) && ctx.materialsInBodyContact.length > 0) ||
        ctx.materialsInBodyContactExplicitlyEmpty === true;
      const missing: string[] = [];
      if (isUndef(ctx.bodyContactType)) missing.push("Body contact type");
      if (!materialsAnswered) missing.push("Materials in body contact");
      if (isUndef(ctx.cmrSubstances)) missing.push("CMR / endocrine substances");
      if (missing.length > 0) {
        // If body contact / anatomical location isn't set yet, route to the
        // Classification subtab where that prerequisite lives — otherwise the
        // downstream "materials in body contact" section won't even render.
        // The materials-in-body-contact input on Technical Specs is only
        // rendered when anatomicalLocation is a positive value. If the user
        // hasn't established body contact yet (bodyContactType missing OR
        // explicitly "none") AND there are no materials recorded, send them
        // to the gating Anatomical Location selector first so they don't
        // land on a Technical Specs page where the field is invisible.
        const noMaterialsRecorded =
          !materialsAnswered;
        const bodyContactNotEstablished =
          isUndef(ctx.bodyContactType) ||
          (ctx.bodyContactType || "").toLowerCase() === "none";
        const needsBodyContactFirst =
          bodyContactNotEstablished && noMaterialsRecorded;
        const dynamicLink = needsBodyContactFirst
          ? {
              tab: "basics",
              subtab: "classification",
              anchor: "anatomical-location-section",
              label: "Device basics → anatomical location (body contact)",
            }
          : link;
        return {
          status: "unknown_needs_context",
          reason: "Cannot classify chemical/biological exposure",
          missingFields: missing,
          contextDeepLink: dynamicLink,
        };
      }
      return { status: "applies" };
    }

    // 11 — Sterility & microbial
    case "11": {
      if (isFalse(ctx.isSterile) && isFalse(ctx.intendedToBeSterilised)) {
        return {
          status: "suggested_na",
          reason: "Device is not supplied sterile and is not intended to be sterilised",
        };
      }
      if (isUndef(ctx.isSterile) && isUndef(ctx.intendedToBeSterilised)) {
        return {
          status: "unknown_needs_context",
          reason: "Sterility status unknown",
          missingFields: ["Delivered sterile", "Intended to be sterilised"],
          contextDeepLink: link,
        };
      }
      return { status: "applies" };
    }

    // 12 — Medicinal substance
    case "12": {
      if (isFalse(ctx.containsMedicinalSubstance))
        return { status: "suggested_na", reason: "Device incorporates no medicinal substance" };
      if (isUndef(ctx.containsMedicinalSubstance))
        return {
          status: "unknown_needs_context",
          reason: "Medicinal substance status unknown",
          missingFields: ["Incorporates medicinal substance"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 13 — Absorbed / dispersed substances
    case "13": {
      if (isFalse(ctx.absorbedDispersedInBody))
        return { status: "suggested_na", reason: "No substances absorbed or dispersed in the body" };
      if (isUndef(ctx.absorbedDispersedInBody))
        return {
          status: "unknown_needs_context",
          reason: "Absorbed/dispersed substance status unknown",
          missingFields: ["Substances absorbed/dispersed in body"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 14 — Connection to other devices, EMC, IT
    case "14": {
      if (isFalse(ctx.isPowered) && isFalse(ctx.hasConnectivity))
        return { status: "suggested_na", reason: "Device is not powered and has no connectivity" };
      const missing: string[] = [];
      if (isUndef(ctx.hasConnectivity)) missing.push("Connectivity (Bluetooth/Wi-Fi/wired)");
      // EMC profile is only relevant for powered devices
      if (ctx.isPowered === true && isUndef(ctx.emcProfile)) missing.push("EMC profile");
      if (missing.length > 0)
        return {
          status: "unknown_needs_context",
          reason: "Connectivity / EMC profile unknown",
          missingFields: missing,
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 15 — Mechanical / thermal
    case "15": {
      if (isFalse(ctx.hasMovingParts) && isFalse(ctx.surfaceTemperatureRisk))
        return { status: "suggested_na", reason: "No moving parts and no surface temperature risk" };
      return { status: "applies" };
    }

    // 16 — Energy / electrical / fire
    case "16": {
      if (isFalse(ctx.isPowered))
        return { status: "suggested_na", reason: "Device is not powered" };
      if (isUndef(ctx.isPowered))
        return {
          status: "unknown_needs_context",
          reason: "Power source unknown",
          missingFields: ["Is powered"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 17 — Radiation
    case "17": {
      if (isFalse(ctx.emitsRadiation))
        return { status: "suggested_na", reason: "Device emits no radiation" };
      if (isUndef(ctx.emitsRadiation))
        return {
          status: "unknown_needs_context",
          reason: "Radiation profile unknown",
          missingFields: ["Emits radiation"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 18 — Software
    case "18": {
      if (isFalse(ctx.hasSoftware))
        return { status: "suggested_na", reason: "Device contains no software" };
      if (isUndef(ctx.hasSoftware))
        return {
          status: "unknown_needs_context",
          reason: "Software classification unknown",
          missingFields: ["Contains software (yes/no)", "SaMD vs SiMD"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 19 — Active devices / alarms
    case "19": {
      if (isFalse(ctx.isActive))
        return { status: "suggested_na", reason: "Device is not an active device" };
      if (isUndef(ctx.isActive))
        return {
          status: "unknown_needs_context",
          reason: "Active-device status unknown",
          missingFields: ["Is active device"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 20 — Measuring function
    case "20": {
      if (isFalse(ctx.hasMeasuringFunction))
        return { status: "suggested_na", reason: "Device has no measuring function" };
      if (isUndef(ctx.hasMeasuringFunction))
        return {
          status: "unknown_needs_context",
          reason: "Measuring function unknown",
          missingFields: ["Has measuring function"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 21 — Diagnostic / monitoring
    case "21": {
      if (
        ctx.hasDiagnosticOrMonitoringFunction === true ||
        ctx.hasMeasuringFunction === true
      )
        return { status: "applies" };
      if (isFalse(ctx.hasDiagnosticOrMonitoringFunction))
        return { status: "suggested_na", reason: "Device has no diagnostic or monitoring function" };
      if (isUndef(ctx.hasDiagnosticOrMonitoringFunction))
        return {
          status: "unknown_needs_context",
          reason: "Diagnostic/monitoring function unknown",
          missingFields: ["Has diagnostic/monitoring function"],
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    // 22 — Biological-origin materials
    case "22": {
      if (
        isFalse(ctx.containsAnimalTissue) &&
        isFalse(ctx.containsHumanTissue) &&
        isFalse(ctx.containsMicroOrgs)
      ) {
        return {
          status: "suggested_na",
          reason: "No biological-origin materials present",
        };
      }
      const missing: string[] = [];
      if (isUndef(ctx.containsAnimalTissue)) missing.push("Contains animal tissue");
      if (isUndef(ctx.containsHumanTissue)) missing.push("Contains human tissue");
      if (isUndef(ctx.containsMicroOrgs)) missing.push("Contains micro-organisms");
      if (missing.length > 0)
        return {
          status: "unknown_needs_context",
          reason: "Biological-origin material status incomplete",
          missingFields: missing,
          contextDeepLink: link,
        };
      return { status: "applies" };
    }

    default:
      return { status: "applies" };
  }
}

/** Build a deep-link URL into Device Information for a given clause. */
export function buildDeviceContextDeepLink(
  productId: string,
  result: AnnexIRuleResult,
  returnTo?: string
): string | null {
  if (!result.contextDeepLink) return null;
  const { tab, subtab, anchor } = result.contextDeepLink;
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (subtab) params.set("subtab", subtab);
  if (anchor) params.set("highlight", anchor);
  if (returnTo) params.set("returnTo", returnTo);
  return `/app/product/${productId}/device-information?${params.toString()}`;
}