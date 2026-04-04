/**
 * Shared helper for resolving the "current step" from the URL.
 *
 * Why: some step routes are intentionally less specific (e.g. only `tab=purpose`).
 * A naive `findIndex` will match those first and incorrectly snap back to Step 1.
 *
 * This matcher picks the MOST SPECIFIC match by scoring how many query params
 * the route pins down (tab/subtab/section).
 */

export interface RouteMatchItem {
  route: string;
}

function getSubTab(params: URLSearchParams): string | undefined {
  return params.get('subTab') ?? params.get('subtab') ?? undefined;
}

export function findBestMatchingStepIndex<T extends RouteMatchItem>(
  items: T[],
  currentPathname: string,
  currentSearchParams: URLSearchParams
): number {
  const currentTab = currentSearchParams.get('tab') ?? undefined;
  const currentSubTab = getSubTab(currentSearchParams);
  const currentSection = currentSearchParams.get('section') ?? undefined;

  let bestIndex = -1;
  let bestScore = -1;

  items.forEach((item, index) => {
    const routeUrl = new URL(item.route, 'http://dummy');
    if (routeUrl.pathname !== currentPathname) return;

    const routeTab = routeUrl.searchParams.get('tab') ?? undefined;
    const routeSubTab = getSubTab(routeUrl.searchParams);
    const routeSection = routeUrl.searchParams.get('section') ?? undefined;

    // If the route pins a param down, it MUST match.
    if (routeTab && routeTab !== currentTab) return;
    if (routeSubTab && routeSubTab !== currentSubTab) return;
    if (routeSection && routeSection !== currentSection) return;

    // Prefer more-specific routes (the ones that pin more params down).
    let score = 0;
    if (routeTab) score += 1;
    if (routeSubTab) score += 1;
    if (routeSection) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}
