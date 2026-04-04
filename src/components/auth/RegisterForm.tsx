
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Chrome, Sparkles, Eye, EyeOff, Check, XCircle } from "lucide-react";
import { newPricingService } from "@/services/newPricingService";

type PricingPlan = 'genesis' | 'core' | 'enterprise' | 'investor';

interface RegisterFormProps {
  userType: string;
  onClose: () => void;
  // Optional props for pricing plan signup flow
  selectedPlan?: PricingPlan;
  signupId?: string;
  prefilledEmail?: string;
  prefilledName?: string;
  prefilledCompany?: string;
}

export function RegisterForm({
  userType,
  onClose,
  selectedPlan: propSelectedPlan,
  signupId: propSignupId,
  prefilledEmail,
  prefilledName,
  prefilledCompany
}: RegisterFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get plan info from URL params or props
  const selectedPlan = propSelectedPlan || searchParams.get('plan') as PricingPlan | null;
  const signupId = propSignupId || searchParams.get('signup_id');
  const urlEmail = searchParams.get('email');
  const urlName = searchParams.get('name');
  const urlCompany = searchParams.get('company');

  // Parse name into first and last name
  const parseName = (fullName: string | null) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  const initialName = parseName(prefilledName || urlName);

  const [formData, setFormData] = useState({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
    email: prefilledEmail || urlEmail || "",
    password: "",
    confirmPassword: "",
    companyName: prefilledCompany || urlCompany || (userType === "company" ? "" : undefined),
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update form when URL params change
  useEffect(() => {
    const newEmail = prefilledEmail || urlEmail;
    const newName = parseName(prefilledName || urlName);
    const newCompany = prefilledCompany || urlCompany;

    if (newEmail || newName.firstName || newCompany) {
      setFormData(prev => ({
        ...prev,
        email: newEmail || prev.email,
        firstName: newName.firstName || prev.firstName,
        lastName: newName.lastName || prev.lastName,
        companyName: newCompany || prev.companyName,
      }));
    }
  }, [prefilledEmail, prefilledName, prefilledCompany, urlEmail, urlName, urlCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const pw = formData.password;
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      // Map user type to role for metadata
      let role = 'company_user';
      switch (userType) {
        case 'consultant':
          role = 'consultant';
          break;
        case 'expert':
          role = 'expert';
          break;
        default:
          role = 'company_user';
      }

      // In a real implementation, this would use Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            role: role,
            // Include selected plan in metadata
            selected_plan: selectedPlan || null,
            signup_id: signupId || null
          }
        }
      });

      if (error) throw error;

      // Create company and assign plan if user has a company name
      let companyId: string | null = null;
      if (formData.companyName && data.user) {
        try {
          // Sign in to establish session (needed for RLS policies)
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          // Create the company
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({ name: formData.companyName })
            .select('id')
            .single();

          if (companyError) {
            console.error('[RegisterForm] Error creating company:', companyError);
          } else {
            companyId = companyData.id;

            // Link user to company as admin
            await supabase.from('user_company_access').insert({
              user_id: data.user.id,
              company_id: companyId,
              access_level: 'admin',
              affiliation_type: 'internal',
              is_internal: true,
              is_primary: true,
            });

            // Assign the selected plan to the company (default to Genesis if no plan selected)
            const planToAssign = selectedPlan || 'genesis';
            try {
              await newPricingService.assignPlanToCompany(companyId, planToAssign, data.user.id);
              console.log('[RegisterForm] Plan assigned:', planToAssign, 'to company:', companyId);
            } catch (planError) {
              console.error('[RegisterForm] Error assigning plan:', planError);
            }

            // Update signup status if we have a signupId
            if (signupId) {
              try {
                await newPricingService.convertSignup(signupId, data.user.id, companyId);
              } catch (convertError) {
                console.error('[RegisterForm] Error converting signup:', convertError);
              }
            }
          }
        } catch (companyCreationError) {
          console.error('[RegisterForm] Error in company creation flow:', companyCreationError);
        }
      }

      toast({
        title: "Account created successfully",
        description: selectedPlan === 'genesis'
          ? "Welcome to XYREG Genesis! Let's build your business case."
          : selectedPlan === 'core'
            ? "Welcome to Helix OS! Your 14-day trial has started."
            : "Welcome to XYREG! You're now logged in.",
      });

      onClose();

      // Route based on user role and plan
      if (selectedPlan === 'genesis') {
        navigate('/app/genesis');
      } else if (selectedPlan === 'core') {
        navigate('/app/dashboard');
      } else {
        switch (role) {
          case 'consultant':
            navigate('/clients');
            break;
          case 'expert':
            navigate('/review-panel');
            break;
          default:
            navigate('/app/dashboard');
            break;
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Get the current origin for redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;

      // Map user type to role for metadata
      let role = 'company_user';
      switch (userType) {
        case 'consultant':
          role = 'consultant';
          break;
        case 'expert':
          role = 'expert';
          break;
        default:
          role = 'company_user';
      }

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
          setError(error.message || 'Failed to sign up with Google. Please try again.');
        }
        setIsGoogleLoading(false);
        return;
      }

      // If we get a URL, the redirect will happen automatically
      if (data?.url) {
        // The redirect happens automatically
      } else {
        // No URL returned, which shouldn't happen but handle it
        setError('Failed to initiate Google sign-up. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Show selected plan banner */}
      {selectedPlan && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${selectedPlan === 'genesis'
          ? 'bg-teal-50 border border-teal-200'
          : selectedPlan === 'core'
            ? 'bg-cyan-50 border border-cyan-200'
            : selectedPlan === 'enterprise'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-violet-50 border border-violet-200'
          }`}>
          <Sparkles className={`w-5 h-5 ${selectedPlan === 'genesis' ? 'text-teal-600' :
            selectedPlan === 'core' ? 'text-cyan-600' :
              selectedPlan === 'enterprise' ? 'text-amber-600' :
                'text-violet-600'
            }`} />
          <div>
            <p className={`font-semibold text-sm ${selectedPlan === 'genesis' ? 'text-teal-800' :
              selectedPlan === 'core' ? 'text-cyan-800' :
                selectedPlan === 'enterprise' ? 'text-amber-800' :
                  'text-violet-800'
              }`}>
              {selectedPlan === 'genesis' ? 'Genesis Plan (Free)' :
                selectedPlan === 'core' ? 'Helix OS Plan' :
                  selectedPlan === 'enterprise' ? 'Enterprise Plan' :
                    'Investor Plan'}
            </p>
            <p className={`text-xs ${selectedPlan === 'genesis' ? 'text-teal-600' :
              selectedPlan === 'core' ? 'text-cyan-600' :
                selectedPlan === 'enterprise' ? 'text-amber-600' :
                  'text-violet-600'
              }`}>
              {selectedPlan === 'genesis'
                ? 'Build your business case and connect with investors'
                : selectedPlan === 'core'
                  ? 'Full design controls & risk management'
                  : selectedPlan === 'enterprise'
                    ? 'Custom enterprise solution'
                    : 'Access deal flow and portfolio monitoring'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {userType === "company" && (
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {formData.password.length > 0 && (() => {
          const pw = formData.password;
          const rules = [
            { label: "At least 8 characters", met: pw.length >= 8 },
            { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(pw) },
            { label: "Lowercase letter (a-z)", met: /[a-z]/.test(pw) },
            { label: "Number (0-9)", met: /[0-9]/.test(pw) },
            { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(pw) },
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
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
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
        {formData.confirmPassword.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs mt-1">
            {formData.password === formData.confirmPassword ? (
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="agreeTerms"
          name="agreeTerms"
          checked={formData.agreeTerms}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: checked as boolean }))}
          required
        />
        <Label htmlFor="agreeTerms" className="text-sm font-normal">
          I agree to the <a href="https://www.xyreg.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a> and <a href="https://www.xyreg.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>

      {/* Divider */}
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

      {/* Google Sign Up Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading || isLoading}
      >
        {isGoogleLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            Signing up with Google...
          </>
        ) : (
          <>
            <Chrome className="mr-2 h-4 w-4" />
            Sign up with Google
          </>
        )}
      </Button>
    </form>
  );
}
