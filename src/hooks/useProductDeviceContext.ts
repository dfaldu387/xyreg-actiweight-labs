import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnnexIDeviceContext } from "@/utils/annexIContextRules";

/**
 * Loads the product's key technology characteristics + a few sibling fields
 * and shapes them into the `AnnexIDeviceContext` envelope used by Annex I
 * rule resolution. Reused by both the per-clause `GapClauseNAControls` and
 * the launch-page `AnnexIContextPanel` so the rule input is consistent.
 */
export function useProductDeviceContext(productId?: string | null) {
  const query = useQuery({
    queryKey: ["product-device-context", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from("products")
        .select(
          "class, primary_regulatory_type, key_technology_characteristics"
        )
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 60_000,
  });

  const context = useMemo<AnnexIDeviceContext | null>(() => {
    if (!query.data) return null;
    const product: any = query.data;
    const k = (product.key_technology_characteristics || {}) as Record<string, any>;
    const regType = (product.primary_regulatory_type || "").toString().toLowerCase();

    const pickBool = (...keys: string[]): boolean | undefined => {
      for (const key of keys) {
        if (typeof k[key] === "boolean") return k[key];
      }
      return undefined;
    };

    // --- GSPR 10: derive bodyContactType from anatomicalLocation ---
    // 'none' → no contact; 'not_defined' / empty → unknown (prompt user);
    // any specific anatomical location → invasive/contact
    const NO_CONTACT_LOCATIONS = new Set(["none", "not_defined", ""]);
    const anatomicalLocation = (k.anatomicalLocation || "").toString();
    let derivedBodyContactType: string | undefined;
    if (typeof k.bodyContactType === "string" && k.bodyContactType) {
      derivedBodyContactType = k.bodyContactType;
    } else if (anatomicalLocation === "none") {
      derivedBodyContactType = "none";
    } else if (!NO_CONTACT_LOCATIONS.has(anatomicalLocation)) {
      derivedBodyContactType = "invasive";
    }

    // --- GSPR 10: materials — coerce existing free-text material fields ---
    // Supports both the new structured shape ({ name, bomItemId, … }) and the
    // legacy `string[]` shape, so existing GSPR §10 logic keeps receiving a
    // flat list of names.
    const rawMaterialsList = k.materialsInBodyContact;
    const derivedMaterials: string[] | null = Array.isArray(rawMaterialsList)
      ? rawMaterialsList
          .map((m: any) =>
            typeof m === 'string' ? m : m && typeof m.name === 'string' ? m.name : null,
          )
          .filter((s: string | null): s is string => !!s && s.trim().length > 0)
      : k.materialComposition || k.bodyContactMaterials
        ? [String(k.materialComposition || k.bodyContactMaterials)]
        : null;
    const materialsExplicitlyEmpty: boolean =
      k.materialsInBodyContactExplicitlyEmpty === true ||
      // Part C: when Anatomical Location is explicitly "No direct body contact",
      // there can't be any body-contact materials by definition. Treat the
      // materials list as explicitly empty so GSPR §10 / ISO 10993 resolve to
      // "Suggested N/A" without forcing the user to also tick the toggle.
      anatomicalLocation === "none";

    // --- GSPR 14: roll up connectivity from granular protocol flags ---
    const derivedHasConnectivity: boolean | undefined =
      k.hasNoConnectivity === true
        ? false
        : k.hasBluetooth === true ||
            k.hasWifi === true ||
            k.hasCellular === true ||
            k.hasUsb === true
          ? true
          : pickBool("hasConnectivity", "hasWirelessConnectivity");

    // --- GSPR 17: derive emitsRadiation from energyType keywords ---
    const RADIATION_ENERGY = ["x-ray", "laser", "rf", "radiation", "ionising", "ionizing", "uv", "gamma"];
    const energyTypeStr = (k.energyType || "").toString().toLowerCase();
    const explicitEmitsRadiation = pickBool("emitsRadiation", "emitsIonisingRadiation");
    const derivedEmitsRadiation: boolean | undefined =
      explicitEmitsRadiation ?? (energyTypeStr ? RADIATION_ENERGY.some((r) => energyTypeStr.includes(r)) : undefined);

    // --- GSPR 21: diagnostic/monitoring — accept deliversDiagnosticEnergy as positive signal ---
    const explicitDiagMon = pickBool("hasDiagnosticOrMonitoringFunction");
    const derivedDiagMon: boolean | undefined =
      explicitDiagMon ?? (k.deliversDiagnosticEnergy === true ? true : undefined);

    // --- GSPR 22: split lumped containsHumanAnimalMaterial flag when false ---
    const lumpedBio = pickBool("containsHumanAnimalMaterial");
    const derivedAnimalTissue =
      pickBool("containsAnimalTissue") ?? (lumpedBio === false ? false : undefined);
    const derivedHumanTissue =
      pickBool("containsHumanTissue") ?? (lumpedBio === false ? false : undefined);
    const derivedMicroOrgs =
      pickBool("containsMicroOrgs", "containsMicroorganisms") ??
      (lumpedBio === false ? false : undefined);

    return {
      deviceClass: product.class ?? null,
      isInVitroDiagnostic:
        typeof k.isInVitroDiagnostic === "boolean"
          ? k.isInVitroDiagnostic
          : regType.includes("ivd") || regType.includes("in vitro")
            ? true
            : undefined,

      isImplantable: pickBool("isImplantable"),
      bodyContactType: derivedBodyContactType ?? null,
      materialsInBodyContact: derivedMaterials,
      materialsInBodyContactExplicitlyEmpty: materialsExplicitlyEmpty,
      releasesParticles: pickBool("releasesParticles"),
      cmrSubstances: pickBool("cmrSubstances", "containsCMR"),

      isSterile: pickBool("isDeliveredSterile", "isSterile"),
      intendedToBeSterilised: pickBool(
        "isIntendedToBeSterile",
        "canBeSterilized",
        "intendedToBeSterilised"
      ),

      containsMedicinalSubstance: pickBool(
        "containsMedicinalSubstance",
        "incorporatesMedicinalSubstance"
      ),
      absorbedDispersedInBody: pickBool(
        "absorbedDispersedInBody",
        "isAbsorbedByBody"
      ),

      isPowered: pickBool("isPowered", "isActive", "isActiveDevice"),
      isActive: pickBool("isActive", "isActiveDevice"),
      hasConnectivity: derivedHasConnectivity,
      emcProfile: k.emcProfile ?? null,

      hasMovingParts: pickBool("hasMovingParts"),
      surfaceTemperatureRisk: pickBool("surfaceTemperatureRisk"),

      emitsRadiation: derivedEmitsRadiation,

      hasSoftware: pickBool(
        "hasSoftware",
        "containsSoftware",
        "isSoftwareAsaMedicalDevice"
      ),

      hasMeasuringFunction: pickBool("hasMeasuringFunction"),
      hasDiagnosticOrMonitoringFunction: derivedDiagMon,

      containsAnimalTissue: derivedAnimalTissue,
      containsHumanTissue: derivedHumanTissue,
      containsMicroOrgs: derivedMicroOrgs,
    };
  }, [query.data]);

  return {
    context,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}