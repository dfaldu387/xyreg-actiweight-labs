import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Helper function to redirect based on user
      const redirectUser = (user: any) => {
        if (user.email === 'superadmin@gmail.com') {
          navigate('/super-admin/app/users');
          return;
        }
        const lastSelectedCompany = (user.user_metadata as any)?.lastSelectedCompany;
        if (lastSelectedCompany) {
          navigate(`/app/company/${encodeURIComponent(lastSelectedCompany)}`);
        } else {
          navigate('/app/clients');
        }
      };

      try {
        // Handle the OAuth callback - Supabase automatically processes the URL hash
        // Wait a bit for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the session from Supabase - single call with retry logic
        let session = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (!session && retryCount < maxRetries) {
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('Auth callback error:', sessionError);
            navigate('/?error=auth_failed');
            return;
          }

          session = data.session;

          if (!session && retryCount < maxRetries - 1) {
            // Check URL hash for access token before retrying
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const error = hashParams.get('error');

            if (error) {
              console.error('OAuth error in URL:', error);
              navigate('/?error=auth_failed');
              return;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retryCount++;
        }

        if (session?.user) {
          redirectUser(session.user);
        } else {
          // No session found after retries, redirect to landing
          navigate('/');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}

