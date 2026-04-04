import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Shield,
  Users,
  ArrowRight,
  Home,
  Loader2,
  Sparkles,
  Heart,
  Star
} from "lucide-react";
import { credentialsEmailService } from "@/services/credentialsEmailService";
import { supabase } from "@/integrations/supabase/client";


// Placeholder async functions for API calls
async function acceptInvitation(token: string) {
  // TODO: Replace with real API call
  await new Promise((res) => setTimeout(res, 1200));
  // throw new Error('Invalid or expired token'); // Uncomment to test error
  return { success: true };
}

async function rejectInvitation(token: string) {
  // TODO: Replace with real API call
  await new Promise((res) => setTimeout(res, 1200));
  return { success: true };
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "accepting" | "accepted" | "rejecting" | "rejected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    if (status === "accepted") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [status]);

  useEffect(() => {
    const fetchInvitationData = async () => {
      if (token) {
        const { data: inviteData, error: inviteError } = await supabase
          .from("user_invitations")
          .select(`
            *,
            companies!inner(name)
          `)
          .eq("invitation_token", token)
          .single();

        if (inviteError) {
          console.error("Error fetching invitation:", inviteError);
        } else {
          console.log('inviteData inviteData', inviteData);
          setInviteData(inviteData);
        }
      }
    };

    fetchInvitationData();
  }, [token]);
  const handleAccept = async () => {
    setStatus("accepting");
    setError(null);
    try {
      const res = await acceptInvitation(token!);
      if (res.success) {
        setStatus("accepted");
        toast.success("Invitation accepted! Welcome aboard. 🎉");
        if (inviteData) {
          // Extract first name and last name from email
          const firstName = inviteData.first_name;
          const lastName = inviteData.last_name;

          const emailresult = await credentialsEmailService.sendCredentialsEmail(
            inviteData.email,
            firstName,
            lastName,
            inviteData.company_id,
            inviteData.companies.name,
            inviteData.access_level,
            token,
          );
          if ((emailresult as any).existing) {
            toast.success('Welcome back!', {
              description: 'Your account already exists. You can now login to your account.',
            });
            // Sign out any existing session so user can log in with the invited account
            await supabase.auth.signOut();
            setTimeout(() => navigate("/login"), 2000);
          } else if (emailresult.success && !(emailresult as any).existing) {
            // Sign out any existing session so user can log in with new credentials
            await supabase.auth.signOut();
            setTimeout(() => navigate("/invitation-accepted"), 2000);
          } else if (!emailresult.success) {
            const errorMsg = emailresult.error || 'Failed to create user account';
            if (errorMsg.includes('already')) {
              setStatus("error");
              setError(errorMsg);
              toast.info('This email is already registered. Please log in with your existing credentials.');
            } else {
              setStatus("error");
              setError(errorMsg);
              toast.error(errorMsg);
            }
          }
        }
      } else {
        throw new Error("Failed to accept invitation");
      }
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Unknown error");
      toast.error("Failed to accept invitation");
    }
  };

  const handleReject = async () => {
    setStatus("rejecting");
    setError(null);
    try {
      const res = await rejectInvitation(token!);
      if (res.success) {
        setStatus("rejected");
        toast("Invitation declined. Thank you for letting us know.");
        setTimeout(() => navigate("/"), 2000);
      } else {
        throw new Error("Failed to reject invitation");
      }
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Unknown error");
      toast.error("Failed to reject invitation");
    }
  };

  if (!token) {
    return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-muted">
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-muted rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-muted rounded-full opacity-30 animate-bounce"></div>

        <div className="relative bg-card p-8 rounded-2xl shadow-2xl border border-border text-center max-w-md w-full mx-4">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <XCircle className="text-destructive" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Oops! Invalid Link</h2>
            <p className="text-muted-foreground leading-relaxed">
              The invitation link appears to be missing or invalid. Please check your email for the correct link or contact the person who invited you.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Need help? <a href="mailto:support@xyreg.com" className="text-primary hover:text-primary/80 font-medium">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {Math.random() > 0.5 ? (
                <Star className="text-primary h-4 w-4 fill-current" />
              ) : (
                <Sparkles className="text-primary h-4 w-4" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="bg-card p-8 md:p-10 rounded-2xl shadow-2xl border border-border backdrop-blur-sm max-w-lg w-full mx-4 text-center space-y-8">

          {/* Header Section */}
          <div className="space-y-4">
            {status === "idle" && (
              <div className="relative">
                <div className="mx-auto w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg transform transition-transform hover:scale-110">
                  <Mail className="text-primary-foreground" size={36} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="text-primary-foreground h-3 w-3" />
                </div>
              </div>
            )}

            {status === "accepting" && (
              <div className="mx-auto w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
                <Loader2 className="text-primary-foreground animate-spin" size={36} />
              </div>
            )}

            {status === "accepted" && (
              <div className="mx-auto w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                <CheckCircle className="text-primary-foreground" size={36} />
              </div>
            )}

            {status === "rejecting" && (
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
                <Clock className="text-muted-foreground" size={36} />
              </div>
            )}

            {status === "rejected" && (
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-lg">
                <XCircle className="text-muted-foreground" size={36} />
              </div>
            )}

            {status === "error" && (
              <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Shield className="text-amber-600" size={36} />
              </div>
            )}

            <div className="space-y-3">
              {status === "idle" && (
                <>
                  <h1 className="text-3xl font-bold text-foreground">
                    You're Invited! 🎉
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                    You've been invited to join our amazing platform. We're excited to have you on board!
                  </p>
                </>
              )}

              {status === "accepting" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Processing Invitation...</h2>
                  <p className="text-muted-foreground">Setting up your account and preparing your workspace</p>
                </>
              )}

              {status === "accepted" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Welcome Aboard! 🚀</h2>
                  <p className="text-muted-foreground">Your invitation has been accepted. Redirecting you to the platform...</p>
                </>
              )}

              {status === "rejecting" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Processing...</h2>
                  <p className="text-muted-foreground">Declining the invitation</p>
                </>
              )}

              {status === "rejected" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Invitation Declined</h2>
                  <p className="text-muted-foreground">Thank you for letting us know. Redirecting you back...</p>
                </>
              )}

              {status === "error" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Account Already Exists</h2>
                  <p className="text-amber-700 font-medium">
                    {error?.includes('already')
                      ? 'An account with this email address is already registered.'
                      : error}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {error?.includes('already')
                      ? 'You can log in with your existing credentials. If you forgot your password, use the reset option on the login page.'
                      : 'Please try again or contact support if the problem persists.'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Benefits Section (only show on idle) */}
          {status === "idle" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">What you'll get:</h3>
              <div className="grid gap-3">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Access to collaborative workspace</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Secure document management</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">24/7 support from our team</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {status === "idle" && (
              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Accept Invitation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 font-medium py-4 rounded-xl transition-all duration-300 hover:bg-gray-50"
                  size="lg"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline Invitation
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                {error?.includes('already') ? (
                  <>
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Go to Login
                    </Button>
                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-medium py-3 rounded-xl transition-all duration-300"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go Home
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setStatus("idle")}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-medium py-3 rounded-xl transition-all duration-300"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Progress indicator for loading states */}
            {(status === "accepting" || status === "rejecting") && (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-gray-500">Please wait while we process your request...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {status === "idle" && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Need help? <a href="mailto:support@xyreg.com" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Contact our support team</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}