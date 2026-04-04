
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarStateHook {
  expandedMenus: Record<string, boolean>;
  manuallyCollapsedMenus: Record<string, boolean>;
  toggleMenuExpansion: (menuName: string) => void;
  setAutoExpansion: (menuName: string, shouldExpand: boolean) => void;
  collapseMenu: (menuName: string) => void;
}

export function useSidebarState(): SidebarStateHook {
  const location = useLocation();
  const [manuallyCollapsedMenus, setManuallyCollapsedMenus] = useState<Record<string, boolean>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "Products": false
  });

  // Track the last manual action timestamp for each menu to ensure it takes priority
  const [lastManualAction, setLastManualAction] = useState<Record<string, number>>({});

  // This effect handles collapsing menus when navigating to deep-level pages.
  useEffect(() => {
    const pathnameSegments = location.pathname.split('/');
    const isCompanyDeepView = pathnameSegments.length > 3 && pathnameSegments[1] === 'app' && pathnameSegments[2] === 'company';
    const isProductDeepView = pathnameSegments.length > 3 && pathnameSegments[1] === 'app' && pathnameSegments[2] === 'product';

    const now = Date.now();
    const MANUAL_ACTION_PROTECTION_MS = 5000; // Protect manual actions for 5 seconds


    if (isProductDeepView) {
      const lastAction = lastManualAction["Products"];
      const isRecentManualAction = lastAction && (now - lastAction) < MANUAL_ACTION_PROTECTION_MS;
      
      if (!isRecentManualAction && !manuallyCollapsedMenus["Products"]) {
        setExpandedMenus(prev => ({ ...prev, "Products": false }));
        setManuallyCollapsedMenus(prev => ({ ...prev, "Products": true }));
      }
    }

    // Only reset manual flags if we navigate completely away from product sections
    if (pathnameSegments[2] !== 'product') {
      // But respect recent manual actions even during resets
      const productLastAction = lastManualAction["Products"];
      const isRecentProductAction = productLastAction && (now - productLastAction) < MANUAL_ACTION_PROTECTION_MS;
      
      if (!isRecentProductAction) {
        setManuallyCollapsedMenus({});
      }
    }
  }, [location.pathname]); // Only depend on pathname to prevent infinite loops

  const toggleMenuExpansion = useCallback((menuName: string) => {
    

    const now = Date.now();
    setLastManualAction(prev => ({ ...prev, [menuName]: now }));

    setManuallyCollapsedMenus(prev => {
      if (expandedMenus[menuName]) {
        // If menu is currently expanded, this action will collapse it.
        return { ...prev, [menuName]: true };
      } else {
        // If menu is currently collapsed, this action will expand it.
        const newState = { ...prev };
        delete newState[menuName];
        return newState;
      }
    });

    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  }, [expandedMenus]);

  const setAutoExpansion = useCallback((menuName: string, shouldExpand: boolean) => {
    const now = Date.now();
    const lastAction = lastManualAction[menuName];
    const MANUAL_ACTION_PROTECTION_MS = 5000;
    
    // Check if there was a recent manual action
    const isRecentManualAction = lastAction && (now - lastAction) < MANUAL_ACTION_PROTECTION_MS;
    
    // NEVER auto-expand if manually collapsed, especially if it's a recent action
    if (manuallyCollapsedMenus[menuName] || isRecentManualAction) {
      
      return;
    }

    if (shouldExpand) {
      setExpandedMenus(prev => ({
        ...prev,
        [menuName]: shouldExpand
      }));
    }
  }, [manuallyCollapsedMenus, lastManualAction]);

  const collapseMenu = useCallback((menuName: string) => {
    
    
    const now = Date.now();
    setLastManualAction(prev => ({ ...prev, [menuName]: now }));
    
    // Set both states immediately and mark as manually collapsed
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: false
    }));
    
    // Set a strong manual collapse flag that persists
    setManuallyCollapsedMenus(prev => ({
      ...prev,
      [menuName]: true
    }));
  }, []);

  return {
    expandedMenus,
    manuallyCollapsedMenus,
    toggleMenuExpansion,
    setAutoExpansion,
    collapseMenu
  };
}
