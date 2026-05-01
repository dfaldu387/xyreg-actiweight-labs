import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * Handles token-based auto-login when redirected from the admin dashboard.
 * Reads access_token, refresh_token, and company_name from URL query params,
 * sets the Supabase session, then redirects to the correct company dashboard.
 */
export function TokenAuthHandler({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get("access_token") && params.get("refresh_token"));
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const companyName = params.get("company_name");

    if (!accessToken || !refreshToken) {
      setIsProcessing(false);
      return;
    }

    const handleTokenAuth = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Token auth failed:", error.message);
          setIsProcessing(false);
          return;
        }

        // Redirect to the company dashboard URL so the URL-based company
        // detection in useCompanyRoles picks the correct company
        if (companyName) {
          window.location.replace(`/app/company/${encodeURIComponent(companyName)}`);
        } else {
          window.location.replace('/app');
        }
      } catch (err) {
        console.error("Token auth error:", err);
        setIsProcessing(false);
      }
    };

    handleTokenAuth();
  }, []);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
