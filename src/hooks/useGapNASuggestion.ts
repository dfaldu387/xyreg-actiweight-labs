import { useMemo } from "react";
import {
  resolveAnnexIClause,
  type AnnexIDeviceContext,
} from "@/utils/annexIContextRules";

export interface GapNADeviceContext {
  deviceClass?: string | null;
  hasSoftware?: boolean | null;
  isImplantable?: boolean | null;
  hasMeasuringFunction?: boolean | null;
  isSterile?: boolean | null;
  isActive?: boolean | null;
  isInVitroDiagnostic?: boolean | null;
  // --- additional optional fields used by Annex I context rules.
  bodyContactType?: string | null;
  materialsInBodyContact?: string[] | null;
  releasesParticles?: boolean | null;
  cmrSubstances?: boolean | null;
  intendedToBeSterilised?: boolean | null;
  containsMedicinalSubstance?: boolean | null;
  absorbedDispersedInBody?: boolean | null;
  isPowered?: boolean | null;
  hasConnectivity?: boolean | null;
  emcProfile?: string | null;
  hasMovingParts?: boolean | null;
  surfaceTemperatureRisk?: boolean | null;
  emitsRadiation?: boolean | null;
  hasDiagnosticOrMonitoringFunction?: boolean | null;
  containsAnimalTissue?: boolean | null;
  containsHumanTissue?: boolean | null;
  containsMicroOrgs?: boolean | null;
}

export interface GapNASuggestion {
  suggested: boolean;
  reason?: string;
  /** When true, the rule cannot decide because device context is incomplete. */
  needsContext?: boolean;
  /** Friendly list of fields the user should fill to enable classification. */
  missingFields?: string[];
  /** Sub-tab inside Device Information where the missing fields live. */
  contextDeepLink?: { tab: string; label: string };
}

interface UseGapNASuggestionArgs {
  framework?: string | null;
  clause?: string | null;
  itemTitle?: string | null;
  deviceContext?: GapNADeviceContext | null;
}

/**
 * Lightweight, local, pattern-based suggestion of whether a clause is a
 * candidate for N/A based on the device context. Returns `{ suggested: false }`
 * whenever no strong signal is available — the UI should render nothing in that
 * case. No network calls.
 */
export function useGapNASuggestion({
  framework,
  clause,
  itemTitle,
  deviceContext,
}: UseGapNASuggestionArgs): GapNASuggestion {
  return useMemo<GapNASuggestion>(() => {
    if (!framework || !deviceContext) return { suggested: false };

    const fw = framework.toLowerCase();
    const cl = (clause || "").toLowerCase();
    const title = (itemTitle || "").toLowerCase();
    const hay = `${cl} ${title}`;

    const {
      deviceClass,
      hasSoftware,
      isImplantable,
      hasMeasuringFunction,
      isSterile,
      isActive,
      isInVitroDiagnostic,
    } = deviceContext;

    // --- Annex I — delegate to deterministic rule table when applicable.
    const isAnnexI =
      (fw.includes("annex i") &&
        !fw.includes("annex ii") &&
        !fw.includes("annex iii")) ||
      fw.includes("gspr") ||
      fw.includes("mdr_annex_i");
    if (isAnnexI && clause) {
      const result = resolveAnnexIClause(
        clause,
        deviceContext as AnnexIDeviceContext
      );
      if (result.status === "suggested_na") {
        return { suggested: true, reason: result.reason };
      }
      if (result.status === "unknown_needs_context") {
        return {
          suggested: false,
          needsContext: true,
          reason: result.reason,
          missingFields: result.missingFields,
          contextDeepLink: result.contextDeepLink,
        };
      }
      // status === "applies" → fall through to legacy patterns below.
    }

    // 1) IEC 62304 / software-specific frameworks → N/A when device has no software.
    if ((fw.includes("62304") || hay.includes("software")) && hasSoftware === false) {
      return { suggested: true, reason: "Device contains no software" };
    }

    // 2) Implantable-specific clauses → N/A for non-implantable devices.
    if (hay.includes("implant") && isImplantable === false) {
      return { suggested: true, reason: "Device is not implantable" };
    }

    // 3) Measuring function clauses.
    if (hay.includes("measuring function") && hasMeasuringFunction === false) {
      return { suggested: true, reason: "Device has no measuring function" };
    }

    // 4) Sterile / sterilization clauses.
    if ((hay.includes("steril") || hay.includes("sterili")) && isSterile === false) {
      return { suggested: true, reason: "Device is not supplied sterile" };
    }

    // 5) Active-device clauses (electrical safety etc.).
    if (hay.includes("active device") && isActive === false) {
      return { suggested: true, reason: "Device is not an active device" };
    }

    // 6) IVD-specific frameworks.
    if ((fw.includes("ivdr") || hay.includes("in vitro")) && isInVitroDiagnostic === false) {
      return { suggested: true, reason: "Device is not an in-vitro diagnostic" };
    }

    // 7) Class I — Notified Body review clauses typically N/A.
    if (
      (deviceClass || "").toString().toLowerCase().replace(/\s+/g, "") === "classi" &&
      (hay.includes("notified body") || hay.includes("conformity assessment by a notified body"))
    ) {
      return { suggested: true, reason: "Class I — no Notified Body review required" };
    }

    return { suggested: false };
  }, [framework, clause, itemTitle, deviceContext]);
}