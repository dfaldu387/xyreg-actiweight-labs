import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, Check, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PasswordExpirationService } from "@/services/passwordExpirationService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, label: "", color: "bg-gray-200" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
    
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)]
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // Helper function to parse hash fragments
  const parseHashParams = (hash: string) => {
    const params = new URLSearchParams(hash.substring(1)); // Remove the # and parse
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      type: params.get('type'),
      expires_at: params.get('expires_at'),
      expires_in: params.get('expires_in'),
      token_type: params.get('token_type')
    };
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    try {
      // Parse the manual URL
      const url = new URL(manualUrl);
      console.log("url",url);
      const accessToken = url.searchParams.get('access_token') || url.hash.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = url.searchParams.get('refresh_token') || url.hash.match(/refresh_token=([^&]+)/)?.[1];
      const type = url.searchParams.get('type') || url.hash.match(/type=([^&]+)/)?.[1];

      console.log('Manual URL parsing result:', { 
        accessToken: accessToken ? '***' + accessToken.slice(-10) : null,
        refreshToken: refreshToken ? '***' + refreshToken.slice(-10) : null,
        type 
      });

      if (accessToken && refreshToken && type === 'recovery') {
        console.log('Manual URL parsing successful, setting up session...');
        
        // Set the session for password reset using the same logic
        const setSession = async () => {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session from manual URL:', error);
              setError(`Session setup failed: ${error.message}. Please request a new password reset link.`);
              return;
            }

            if (data.session) {
              console.log('Session set successfully from manual URL:', {
                user: data.user?.email,
                sessionId: data.session.access_token ? '***' + data.session.access_token.slice(-10) : 'none'
              });
              setIsValidToken(true);
              setShowManualInput(false);
            } else {
              console.error('No session data returned from manual URL session setup');
              setError('Session setup failed: No session data returned. Please request a new password reset link.');
            }
          } catch (sessionError: any) {
            console.error('Exception during manual URL session setup:', sessionError);
            setError(`Session setup failed: ${sessionError.message}. Please request a new password reset link.`);
          }
        };

        setSession();
      } else {
        setError('Invalid URL format. Please check the reset link and try again.');
      }
    } catch (error) {
      console.error('Error parsing manual URL:', error);
      setError('Invalid URL format. Please check the reset link and try again.');
    }
  };

  useEffect(() => {
    // Check if we have the necessary parameters for password reset
    // First try query parameters, then hash fragments
    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');
    let type = searchParams.get('type');

    console.log('Initial params from searchParams:', { accessToken, refreshToken, type });

    // If not found in query params, check hash fragments
    if (!accessToken || !refreshToken || !type) {
      console.log('Params not found in searchParams, checking hash fragments...');
      const hashParams = parseHashParams(location.hash);
      accessToken = hashParams.access_token;
      refreshToken = hashParams.refresh_token;
      type = hashParams.type;
      console.log('Params from hash fragments:', { accessToken, refreshToken, type });
    }

    // If still no parameters found, check if we're in a recovery flow
    if (!accessToken || !refreshToken || !type) {
      // Check if we have any hash content that might contain the tokens
      if (location.hash && location.hash.length > 1) {
        console.log('Attempting to parse hash content manually...');
        // Try to extract tokens from the hash manually
        const hashContent = location.hash.substring(1); // Remove the #
        
        // Look for access_token pattern
        const accessTokenMatch = hashContent.match(/access_token=([^&]+)/);
        const refreshTokenMatch = hashContent.match(/refresh_token=([^&]+)/);
        const typeMatch = hashContent.match(/type=([^&]+)/);
        
        if (accessTokenMatch && refreshTokenMatch && typeMatch) {
          accessToken = accessTokenMatch[1];
          refreshToken = refreshTokenMatch[1];
          type = typeMatch[1];
          console.log('Manually extracted params:', { 
            accessToken: accessToken ? '***' + accessToken.slice(-10) : null,
            refreshToken: refreshToken ? '***' + refreshToken.slice(-10) : null,
            type 
          });
        }
      }
    }

    console.log('Final reset password params:', { 
      accessToken: accessToken ? '***' + accessToken.slice(-10) : null, 
      refreshToken: refreshToken ? '***' + refreshToken.slice(-10) : null, 
      type,
      hash: location.hash ? location.hash.substring(0, 50) + '...' : 'none'
    });

    if (accessToken && refreshToken && type === 'recovery') {
      console.log('Valid parameters found, setting Supabase session...');

      // Validate token format (basic check)
      if (accessToken.length < 100 || refreshToken.length < 10) {
        console.error('Token format appears invalid:', {
          accessTokenLength: accessToken.length,
          refreshTokenLength: refreshToken.length
        });
        setError('Invalid token format detected. Please request a new password reset link.');
        return;
      }

      // First, check if we're already authenticated
      supabase.auth.getSession().then(({ data: currentSession, error: sessionError }) => {
        if (sessionError) {
          console.log('Error getting current session:', sessionError);
        } else if (currentSession.session) {
          console.log('User already has a session, checking if it matches...');
          // If user already has a session, we might not need to set a new one
          if (currentSession.session.access_token === accessToken) {
            console.log('Current session matches reset tokens, proceeding...');
            setIsValidToken(true);
            return;
          }
        }

        // Set the session for password reset
        const setSession = async () => {
          try {
            console.log('Attempting to set session with tokens...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              setError(`Session setup failed: ${error.message}. Please request a new password reset link.`);
              return;
            }

            if (data.session) {
              console.log('Session set successfully for password reset:', {
                user: data.user?.email,
                sessionId: data.session.access_token ? '***' + data.session.access_token.slice(-10) : 'none'
              });
              setIsValidToken(true);
            } else {
              console.error('No session data returned from setSession');
              setError('Session setup failed: No session data returned. Please request a new password reset link.');
            }
          } catch (sessionError: any) {
            console.error('Exception during session setup:', sessionError);
            setError(`Session setup failed: ${sessionError.message}. Please request a new password reset link.`);
          }
        };

        setSession();
      });
    } else if (sessionStorage.getItem('pending_password_recovery') === 'true') {
      // Arrived via PASSWORD_RECOVERY event (Supabase redirected to root,
      // Landing page redirected here). Session is already established.
      console.log('Password recovery detected via session flag, checking existing session...');
      sessionStorage.removeItem('pending_password_recovery');

      supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (sessionError) {
          console.error('Error getting session for recovery:', sessionError);
          setError('Session expired. Please request a new password reset link.');
          return;
        }
        if (data.session) {
          console.log('Valid session found for password recovery:', data.session.user?.email);
          setIsValidToken(true);
        } else {
          setError('Session expired. Please request a new password reset link.');
        }
      });
    } else {
      console.error('Missing required parameters for password reset:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type,
        searchParams: Object.fromEntries(searchParams.entries()),
        hash: location.hash,
        url: window.location.href
      });

      // Provide more helpful error message
      if (location.hash && location.hash.length > 1) {
        setError('Reset link detected but parameters could not be parsed. Please try requesting a new password reset link.');
      } else {
        // setError('Invalid reset link. Please check your email and try again.');
      }
    }
  }, [searchParams, location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: { requires_password_change: false },
      });

      if (error) {
        throw error;
      }

      // Record password change for expiration tracking
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        await PasswordExpirationService.recordPasswordChange(sessionData.session.user.id, 'forgot_password');
      }

      // Clean up recovery flag
      sessionStorage.removeItem('pending_password_recovery');

      setSuccess(true);
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      // Sign out and redirect to login so user logs in with new password
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Verifying Reset Link</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Reset Link Invalid</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>
            
            {/* Manual URL input option */}
            {!showManualInput ? (
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setShowManualInput(true)}
              >
                Try Manual URL Input
              </Button>
            ) : (
              <form onSubmit={handleManualUrlSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-url">Paste Reset Link URL</Label>
                  <Input
                    id="manual-url"
                    type="url"
                    placeholder="Paste the complete reset link URL here"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Parse URL
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowManualInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            
            <Button 
              className="mt-4" 
              onClick={() => navigate('/')}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-green-900">Password Reset Successfully!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been updated. You will be redirected to the login page shortly.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/')}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Reset Your Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password.length > 0 && (() => {
              const rules = [
                { label: "At least 8 characters", met: password.length >= 8 },
                { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
                { label: "Lowercase letter (a-z)", met: /[a-z]/.test(password) },
                { label: "Number (0-9)", met: /[0-9]/.test(password) },
                { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
              ];
              const metCount = rules.filter(r => r.met).length;
              const strengthPercent = (metCount / rules.length) * 100;
              const strengthColor = strengthPercent <= 40 ? "bg-red-500" : strengthPercent <= 80 ? "bg-yellow-500" : "bg-green-500";
              const strengthLabel = strengthPercent <= 40 ? "Weak" : strengthPercent <= 80 ? "Medium" : "Strong";

              return (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={`font-medium ${strengthPercent <= 40 ? "text-red-500" : strengthPercent <= 80 ? "text-yellow-600" : "text-green-600"}`}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-1 mt-1">
                    {rules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {rule.met ? (
                          <Check className="h-3 w-3 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className={rule.met ? "text-green-600" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                {password === confirmPassword ? (
                  <>
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || password !== confirmPassword || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)}
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </Button>

          <div className="text-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate('/')}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
