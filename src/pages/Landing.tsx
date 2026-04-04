
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useDevMode } from "@/context/DevModeContext";
import { DevModeEnhancedControls } from "@/components/dev/DevModeEnhancedControls";
import { DevModeBadge } from "@/components/dev/DevModeBadge";
import {
  Loader2,
  Settings,
  LogIn,
  Shield,
  FileText,
  Users,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Lock
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { LoginForm } from "@/components/auth/LoginForm";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";

export default function Landing() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const { isDevMode, toggleDevMode, primaryCompany, selectedCompanies } = useDevMode();
  const [showRegister, setShowRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { isLoadingCompany } = useRegistrationFlow();

  // Redirect authenticated users to /app
  useEffect(() => {
    if (!isLoading && user) {
      // If this is a password recovery flow, redirect to reset-password page
      // instead of dashboard so the user can set their new password
      if (sessionStorage.getItem('pending_password_recovery') === 'true') {
        navigate('/reset-password', { replace: true });
        return;
      }

      navigate('/app', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDelay: '-0.3s' }}></div>
        </div>
        <p className="text-lg text-muted-foreground mt-6 font-medium">Loading XYREG...</p>
      </div>
    );
  }



  const handleDevSettingsClick = () => {
    if (isDevMode) {
      toast.success("Developer mode controls available below");
      const devControls = document.getElementById('dev-controls');
      if (devControls) {
        devControls.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      toggleDevMode();
      toast.success("Developer mode activated");
    }
  };

  const handleDevModeLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out of DevMode");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Enhanced Header */}
      <header className="bg-background/95 backdrop-blur-md border-b border-border/40 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <img src="/asset/nav_bar-removebg-preview-logo.png" alt="Company Logo" className="w-[145px] object-contain" onError={e => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }} />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            
            {isDevMode && (
              <div className="flex items-center space-x-3">
                <DevModeBadge />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDevSettingsClick}
                  className="border-warning/30 bg-warning/10 text-warning-foreground hover:bg-warning/20 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dev Settings
                </Button>
              </div>
            )}

            {user && isDevMode ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-warning-foreground">DevMode</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDevModeLogout} className="hover:bg-warning/10">
                  Exit
                </Button>
              </div>
            ) : user ? (
              <Button onClick={() => navigate("/app/clients")} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg">
                Dashboard
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          {/* Two Column Layout - Hero Left, Auth Right */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Hero Section */}
            <div className="space-y-8">
              <div className="text-left">
                <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Patent Pending</span>
                </div>

                {/* <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-8 leading-tight">
                  <img src="/asset/nav_bar-removebg-preview-logo.png" alt="Company Logo" className="w-[145px] object-contain" onError={e => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'block';
                    }
                  }} />
                </h1> */}

                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8 font-light">
                  The Strategic Operations Platform for Medical Device Innovators.
                  <span className="font-medium text-foreground"> Accelerate your journey from concept to market</span> and manage your portfolio post-launch.
                </p>

                {/* <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                  <Button 
                    onClick={handleLogin} 
                    size="lg" 
                    className="text-lg px-6 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    <LogIn className="h-5 w-5 mr-3" />
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-3" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setIsRegisterOpen(true)}
                    className="text-lg px-6 py-4 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Create Account
                  </Button>
                </div> */}

                {/* Trust Indicators */}
                {/* <div className="flex flex-col space-y-3 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">SOC 2 Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Enterprise Security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Global Compliance</span>
                  </div>
                </div> */}
              </div>

              {/* Feature Highlights */}
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-2 text-foreground">Compliance Tracking</h3>
                      <p className="text-muted-foreground text-sm">
                        Monitor regulatory requirements with real-time alerts and automated compliance checks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-2 text-foreground">Document Management</h3>
                      <p className="text-muted-foreground text-sm">
                        Centralized document control with version management and regulatory submission tracking.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-2 text-foreground">Team Collaboration</h3>
                      <p className="text-muted-foreground text-sm">
                        Secure collaboration tools for internal teams, consultants, and regulatory experts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Direct Login/Register Forms */}
            <div className="space-y-8">
              {user && isDevMode ? (
                <div className="bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/40 rounded-2xl p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-warning" />
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-warning-foreground mb-3">
                      Developer Session Active
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Testing as <span className="font-semibold text-foreground">{user.email}</span>
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/app/clients")}
                      className="w-full bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-foreground font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                      Access Dashboard
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={handleDevSettingsClick} size="lg" className="border-warning/40 hover:bg-warning/10">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" onClick={handleDevModeLogout} size="lg" className="border-warning/40 hover:bg-warning/10">
                        Exit DevMode
                      </Button>
                    </div>
                  </div>
                </div>
              ) : user && isLoadingCompany ? (
                <div className="bg-gradient-to-br from-success/20 to-success/10 border border-success/40 rounded-2xl p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-success-foreground mb-3">
                      Creating your account...
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Please wait while we create your account...
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/app/clients")}
                      className="w-full bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                      Go to Dashboard
                    </Button>
                    {!isDevMode && (
                      <Button variant="outline" onClick={handleDevSettingsClick} className="w-full border-success/40 hover:bg-success/10 text-black" size="lg">
                        <Settings className="h-4 w-4 mr-2" />
                        Enable Developer Mode
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {!showRegister ? (
                    /* Login Form with Remember Me and Create Account Button */
                    <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-8 shadow-xl">
                      <div className="text-center mb-6">
                        {/* <div className="flex items-center justify-center">
                          <img src="/asset/nav_bar-removebg-preview-logo.png" alt="Company Logo" className="h-[145px] w-[145px] object-contain" onError={e => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }} />
                        </div> */}
                        <h2 className="font-heading font-bold text-2xl mb-3">Sign In</h2>
                        <p className="text-muted-foreground">
                          Access your regulatory compliance dashboard
                        </p>
                      </div>
                      <LoginForm onClose={() => { }} setShowRegister={setShowRegister} />

                      {/* Remember Me and Create Account Section */}
                      {/* <div className="mt-6 space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="remember-me" 
                              checked={rememberMe}
                              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <label 
                              htmlFor="remember-me" 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Remember me for 30 days
                            </label>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              Don't have an account?
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => setShowRegister(true)}
                              className="w-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                            >
                              Create Account
                            </Button>
                          </div>
                        </div> */}
                    </div>
                  ) : (
                    /* Register Redirect Card */
                    <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-8 shadow-xl">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="font-heading font-bold text-2xl mb-3">Create Account</h2>
                        <p className="text-muted-foreground mb-6">
                          Join XYREG and start your compliance journey
                        </p>
                        <Button
                          onClick={() => navigate('/register')}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                          size="lg"
                        >
                          Get Started - Choose Your Plan
                        </Button>
                      </div>

                      {/* Back to Login Button */}
                      <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Already have an account?
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setShowRegister(false)}
                          className="w-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Developer Mode Access */}
                  {/* <div className="bg-gradient-to-br from-muted/40 to-muted/20 border border-border/50 rounded-2xl p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-warning" />
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-3">Developer & Testing</h3>
                      <p className="text-muted-foreground mb-6">
                        Explore the platform without registration
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDevSettingsClick}
                        className="border-warning/50 bg-warning/10 text-black hover:bg-warning/20 font-semibold py-4 px-6 transition-all duration-200 transform hover:-translate-y-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Enable Developer Mode
                      </Button>
                    </div>
                  </div> */}
                </div>
              )}
            </div>
          </div>

          {/* Developer Controls - Integrated into right column when in dev mode */}
          {isDevMode && (
            <div id="dev-controls" className="lg:col-span-2 mt-16 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-8 shadow-xl">
                <h3 className="font-heading font-bold text-2xl mb-6 text-center">Developer Controls</h3>
                <DevModeEnhancedControls />
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  );
}
