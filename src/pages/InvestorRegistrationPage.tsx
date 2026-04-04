import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Briefcase, Linkedin, CheckCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { INVESTMENT_FOCUS_OPTIONS, CHECK_SIZE_OPTIONS } from '@/types/investor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company_name: z.string().optional(),
  linkedin_url: z.string().url('Please enter a valid LinkedIn URL').includes('linkedin.com', { message: 'Must be a LinkedIn URL' }),
  typical_check_size: z.string().optional(),
  accredited_self_cert: z.boolean().refine(val => val === true, 'You must certify as an accredited investor'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function InvestorRegistrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, isLoading, createProfile, isCreating } = useInvestorProfile();
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authStep, setAuthStep] = useState<'signup' | 'profile'>('signup');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      accredited_self_cert: false,
    },
  });

  // Check if user is already logged in - wait for profile loading to complete
  React.useEffect(() => {
    const checkAuth = async () => {
      // Wait until profile loading is complete before making decisions
      if (isLoading) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (profile) {
          // Already has profile, redirect to deal flow
          navigate('/investor/deal-flow');
        } else {
          // Logged in but no profile confirmed, show profile form
          setAuthStep('profile');
          setValue('email', user.email || '');
        }
      }
    };
    checkAuth();
  }, [profile, isLoading, navigate, setValue]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/investor/register`,
        },
      });

      if (error) throw error;

      toast.success('Check your email to verify your account');
      setAuthStep('profile');
      setValue('email', signupEmail);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (error) throw error;

      // Get the logged-in user
      const user = data.user;
      if (!user) {
        throw new Error('Login failed - no user returned');
      }

      // Invalidate the investor profile cache to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['investor-profile'] });

      // Check if profile exists for this specific user
      const { data: existingProfile, error: profileError } = await supabase
        .from('investor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking investor profile:', profileError);
      }

      if (existingProfile) {
        navigate('/investor/deal-flow');
      } else {
        setAuthStep('profile');
        setValue('email', user.email || signupEmail);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    // Safety check: verify profile doesn't already exist to prevent duplicate key error
    const { data: existingProfile } = await supabase
      .from('investor_profiles')
      .select('id')
      .maybeSingle();

    if (existingProfile) {
      toast.info('You already have an investor profile!');
      navigate('/investor/deal-flow');
      return;
    }

    createProfile({
      ...data,
      investment_focus: selectedFocus,
      company_name: data.company_name || null,
      typical_check_size: data.typical_check_size || null,
    }, {
      onSuccess: () => {
        navigate('/investor/deal-flow');
      },
    });
  };

  const toggleFocus = (focus: string) => {
    setSelectedFocus(prev =>
      prev.includes(focus)
        ? prev.filter(f => f !== focus)
        : [...prev, focus]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">XYREG Deal Flow</h1>
          <p className="text-muted-foreground mt-2">
            Access vetted MedTech investment opportunities
          </p>
        </div>

        {authStep === 'signup' ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Investor Account</CardTitle>
              <CardDescription>
                Sign up to access the MedTech deal flow marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSigningUp || isLoggingIn}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoggingIn || isSigningUp}
                >
                  {isLoggingIn ? 'Signing In...' : 'Already have an account? Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Investor Profile</CardTitle>
              <CardDescription>
                Provide your details to access the deal flow marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      placeholder="John Smith"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="john@example.com"
                      disabled
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">Investment Firm / Organization</Label>
                    <Input
                      id="company_name"
                      {...register('company_name')}
                      placeholder="Optional - your fund or angel group"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile *
                    </Label>
                    <Input
                      id="linkedin_url"
                      {...register('linkedin_url')}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                    {errors.linkedin_url && (
                      <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Required for investor verification
                    </p>
                  </div>
                </div>

                {/* Investment Focus */}
                <div className="space-y-3">
                  <Label>Investment Focus</Label>
                  <div className="flex flex-wrap gap-2">
                    {INVESTMENT_FOCUS_OPTIONS.map((focus) => (
                      <Badge
                        key={focus}
                        variant={selectedFocus.includes(focus) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFocus(focus)}
                      >
                        {selectedFocus.includes(focus) && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Check Size */}
                <div className="space-y-2">
                  <Label htmlFor="check_size">Typical Check Size</Label>
                  <Select onValueChange={(value) => setValue('typical_check_size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your typical investment size" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHECK_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Accreditation Certification */}
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Accredited Investor Certification</h4>
                      <p className="text-sm text-muted-foreground">
                        By checking the box below, you certify that you meet the criteria 
                        for an accredited investor as defined by your jurisdiction's securities regulations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accredited"
                      checked={watch('accredited_self_cert')}
                      onCheckedChange={(checked) => setValue('accredited_self_cert', checked as boolean)}
                    />
                    <Label htmlFor="accredited" className="text-sm">
                      I certify that I am an accredited investor *
                    </Label>
                  </div>
                  {errors.accredited_self_cert && (
                    <p className="text-sm text-destructive">{errors.accredited_self_cert.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating Profile...' : 'Access Deal Flow'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Verified Startups</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Secure Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
