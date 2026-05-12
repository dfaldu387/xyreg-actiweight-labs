
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Google } from "@mui/icons-material";
import { activeTenant } from "@/config/tenants";

interface LoginFormProps {
  onClose: () => void;
  setShowRegister: (show: boolean) => void;
}

export function LoginForm({ onClose, setShowRegister }: LoginFormProps) {
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Check if user is on Genesis plan and return the appropriate redirect URL
  const getGenesisRedirect = async (userId: string | undefined): Promise<string | null> => {
    if (!userId) return null;
    try {
      // Get user's primary company
      const { data: access } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .limit(1)
        .single();
      if (!access?.company_id) return null;

      // Check if company is on Genesis plan
      const { data: companyPlan } = await supabase
        .from('new_pricing_company_plans')
        .select('plan:new_pricing_plans(name)')
        .eq('company_id', access.company_id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const planName = (companyPlan?.plan as any)?.name;
      if (!planName || planName.toLowerCase() !== 'genesis') return null;

      // Genesis user — find their first product for redirect
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', access.company_id)
        .eq('is_archived', false)
        .limit(1)
        .single();

      if (product?.id) {
        return `/app/product/${product.id}/business-case?tab=genesis`;
      }

      // No product yet — redirect to company genesis page
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', access.company_id)
        .single();

      if (company?.name) {
        return `/app/company/${encodeURIComponent(company.name)}/genesis`;
      }

      return '/app/genesis';
    } catch (err) {
      console.error('Genesis redirect check failed:', err);
      return null; // Fall back to normal redirect on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate that both email and password are provided
      if (!email.trim() || !password.trim()) {
        setError("Please enter both email and password.");
        return;
      }

      if (activeTenant.features.genesis) {
        sessionStorage.setItem('genesis_login', 'checking');
      }

      const result = await signIn(email, password);
      if (result.success) {
        const user = result.user;
        let redirectUrl = '/app/clients';

        if (email === 'superadmin@gmail.com') {
          sessionStorage.removeItem('genesis_login');
          redirectUrl = '/super-admin/app/users';
        } else if (activeTenant.features.investor && result.isInvestor) {
          sessionStorage.removeItem('genesis_login');
          redirectUrl = '/investor/deal-flow';
        } else {
          const genesisRedirect = activeTenant.features.genesis
            ? await getGenesisRedirect(user?.id)
            : null;
          if (genesisRedirect) {
            redirectUrl = genesisRedirect;
            sessionStorage.setItem('genesis_login', genesisRedirect);
          } else {
            sessionStorage.removeItem('genesis_login');
            const tenantHasAllowList = (result.tenantAllowedCompanyIds?.length ?? 0) > 0;
            const lastSelectedCompany = (user?.user_metadata as any)?.lastSelectedCompany;
            if (!tenantHasAllowList && lastSelectedCompany) {
              const companyPath = activeTenant.features.genesis
                ? `/app/company/${encodeURIComponent(lastSelectedCompany)}/mission-control`
                : `/app/company/${encodeURIComponent(lastSelectedCompany)}`;
              redirectUrl = companyPath;
            } else {
              // Tenant with allow list — let Index.tsx pick the primary company.
              redirectUrl = '/';
            }
          }
        }

        onClose();
        navigate(redirectUrl);
        sessionStorage.removeItem('genesis_login');
      }
      else {
        sessionStorage.removeItem('genesis_login');
        setError(result.error || activeTenant.errorMessage);
      }


      // if (user) {
      //   // Check user metadata or a specific field to determine if they're a super admin
      //   // You might need to adjust this based on how super admin status is stored
      //   const isSuperAdmin = user.user_metadata?.role === 'super_admin' || 
      //                      user.email === 'superadmin@gmail.com'; // Adjust this email as needed

      //   onClose();

      //   if (isSuperAdmin) {
      //     navigate('/super-admin/app/users'); // Redirect to super admin panel
      //   } else {
      //     navigate('/app/clients'); // Redirect to regular app
      //     navigate(0);
      //   }
      // } else {
      //   // Fallback to regular app if user data is not available
      //   onClose();
      //   navigate('/app/clients');
      //   navigate(0);
      // }

    } catch (error: any) {
      sessionStorage.removeItem('genesis_login');
      console.error("Login error:", error);

      // Check for specific error codes and messages
      if (error.code === 'user_banned') {
        setError("Your session has expired. Please contact support.");
      } else if (error.code === 'invalid_credentials') {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else if (error.code === 'user_not_found') {
        setError("No account found with this email address. Please check your email or create a new account.");
      } else if (error.code === 'email_not_confirmed') {
        setError("Please check your email and confirm your account before signing in.");
      } else if (error.message && error.message.includes("Email logins are disabled")) {
        setError("Email logins are currently disabled in Supabase settings. For testing purposes, please enable email sign-in in the Supabase dashboard under Authentication > Providers.");
      } else if (error.message && error.message.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account before signing in.");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("  ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);
    setError(null);

    try {
      const appUrl = window.location.origin || 'https://app.xyreg.com';
      const redirectUrl = `${appUrl}/reset-password?source=email`;

      if (activeTenant.features.edgeFnResetEmail) {
        const { data, error } = await supabase.functions.invoke("send-reset-password-email", {
          body: { email: resetEmail, redirectUrl, appUrl },
        });

        if (error) {
          throw error;
        }

        if (data && !data.success) {
          throw new Error(data.error || "Failed to send reset email");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: redirectUrl,
        });

        if (error) {
          throw error;
        }
      }

      setResetSuccess(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a password reset link. If you don't see it, check your spam folder.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Failed to send password reset email. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSuccess(false);
    setError(null);
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Get the current origin for redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;

      // Try OAuth without queryParams first (some Supabase configurations don't support them)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        
        // If error is about provider not enabled, provide specific guidance
        if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
          setError('Google sign-in is not properly configured. Please ensure Google provider is enabled and credentials are saved in Supabase dashboard.');
        } else {
          setError(error.message || 'Failed to sign in with Google. Please try again.');
        }
        setIsGoogleLoading(false);
        return;
      }

      // If we get a URL, the redirect will happen automatically
      // The user will be redirected to Google, then back to our callback
      if (data?.url) {
        // The redirect happens automatically, so we don't need to do anything here
        // The loading state will be cleared when the page redirects
      } else {
        // No URL returned, which shouldn't happen but handle it
        setError('Failed to initiate Google sign-in. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };



  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="space-y-4 py-2">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Forgot Password?</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resetSuccess ? (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Password reset email sent! Check your inbox and follow the link to reset your password.
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBackToLogin}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isResettingPassword}>
              {isResettingPassword ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Show login form
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={handleShowForgotPassword}
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="text-sm font-normal">
            Remember me for 30 days
          </Label>
        </div>
        <button
          type="button"
          onClick={() => setShowRegister(true)}
          className="text-sm font-normal text-primary hover:underline"
        >
          Don't have an account?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !email.trim() || !password.trim()}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      {activeTenant.features.google && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                Signing in with Google...
              </>
            ) : (
              <>
                <Google className="mr-2 h-4 w-4" />
                Sign in with Google
              </>
            )}
          </Button>
        </>
      )}
    </form>
  );
}
