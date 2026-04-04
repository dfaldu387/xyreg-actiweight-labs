// DEPRECATED: This file is now deprecated in favor of Supabase-based data
// It remains as a fallback for testing and development purposes only

import { NotifiedBody } from "@/types/notifiedBody";

// This is now only used as a fallback if Supabase is unavailable
export const notifiedBodiesBackup: NotifiedBody[] = [
  // Keeping a minimal set for fallback purposes
  {
    id: "tuv-sud-product-service",
    name: "TÜV SÜD Product Service GmbH",
    nb_number: 123,
    address: "Ridlerstraße 65, 80339 München, Germany",
    contactNumber: "+49 89 5791-0",
    email: "info@tuvsud.com",
    website: "https://www.tuvsud.com",
    country: "Germany",
    scope: {
      mdr: true,
      ivdr: true,
      highRiskActiveImplantables: true,
      highRiskImplantsNonActive: true,
      medicalSoftware: true,
      sterilizationMethods: true,
      drugDeviceCombinations: false,
    }
  }
  // Additional entries removed - data now comes from Supabase
];

/**
 * @deprecated Use the notifiedBodyService instead
 * This function remains for backward compatibility only
 */
export function searchNotifiedBodies(query: string): NotifiedBody[] {
  console.warn('searchNotifiedBodies from notifiedBodyData.ts is deprecated. Use notifiedBodyService instead.');
  
  if (!query.trim()) {
    return notifiedBodiesBackup;
  }

  return notifiedBodiesBackup.filter(nb => 
    nb.name.toLowerCase().includes(query.toLowerCase()) ||
    nb.nb_number.toString().includes(query) ||
    nb.country.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * @deprecated Use the notifiedBodyService instead
 * This function remains for backward compatibility only
 */
export function getNotifiedBodyById(id: string): NotifiedBody | undefined {
  console.warn('getNotifiedBodyById from notifiedBodyData.ts is deprecated. Use notifiedBodyService instead.');
  return notifiedBodiesBackup.find(nb => nb.id === id);
}
