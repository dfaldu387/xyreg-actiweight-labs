import React, { useState, useEffect } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'xyreg_mobile_banner_dismissed';

/**
 * Detects if the user is on a mobile or tablet device
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;

  // Check for mobile/tablet user agents
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // Also check screen width (tablets and phones typically < 1024px)
  const isSmallScreen = window.innerWidth < 1024;

  // Check for touch capability as additional signal
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isMobile || (isSmallScreen && hasTouch);
}

export function MobileDeviceBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setIsVisible(false);
      return;
    }

    // Check if mobile/tablet
    const checkDevice = () => {
      const mobile = isMobileOrTablet();
      setIsMobile(mobile);
      setIsVisible(mobile);
    };

    checkDevice();

    // Re-check on resize (in case user rotates device or resizes window)
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 opacity-60" />
            <span className="text-lg font-medium">→</span>
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base">
              Best viewed on desktop
            </p>
            <p className="text-xs sm:text-sm opacity-90">
              XYREG is optimized for desktop browsers for the best experience
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 hover:text-white shrink-0"
        >
          <X className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
