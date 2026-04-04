
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CompanyInitializationService } from '@/services/companyInitializationService';

type Tier = 'genesis' | 'core' | 'enterprise' | 'investor';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSuccess?: () => void;
  submitLabel?: string;
  successMessage?: string;
  tier?: Tier;
}

const ContactForm = ({ onSuccess, submitLabel = "Request Demo", successMessage, tier = 'core' }: ContactFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);
  const [signupId, setSignupId] = useState<string | null>(null);

  // Signup form states
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    console.log('Contact form submitted:', data, 'tier:', tier);
    setIsLoading(true);

    try {
      // Save signup to new_pricing_signups table
      const { data: signupData, error } = await supabase
        .from('new_pricing_signups')
        .insert({
          email: data.email,
          name: data.name,
          company_name: data.company,
          phone: data.phone || null,
          selected_plan: tier,
          message: data.message,
          status: 'pending',
          metadata: {
            source: 'pricing_page',
            submitted_at: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving signup:', error);
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('Signup saved with ID:', signupData?.id);
      setSignupId(signupData?.id || null);
      setSubmittedData(data);
      setIsSubmitted(true);

      // For Genesis plan, go directly to password step (no 24-hour wait)
      if (tier === 'genesis') {
        setShowSignupForm(true);
      } else {
        toast({
          title: "Request Submitted!",
          description: "We'll get back to you within 24 hours.",
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    setSubmittedData(null);
    setSignupId(null);
    setShowSignupForm(false);
    setPassword('');
    setConfirmPassword('');
    setSignupError(null);
    form.reset();
  };

  const handleShowSignupForm = () => {
    setShowSignupForm(true);
    setSignupError(null);
  };

  const handleCreateAccount = async () => {
    setSignupError(null);

    // Validation
    if (!password) {
      setSignupError('Password is required');
      return;
    }

    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    const email = submittedData?.email;
    const companyName = submittedData?.company;
    if (!email) {
      setSignupError('Email is required');
      return;
    }

    if (!companyName) {
      setSignupError('Company name is required');
      return;
    }

    setIsSigningUp(true);

    try {
      // Step 1: Create Supabase user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: submittedData?.name?.split(' ')[0] || '',
            last_name: submittedData?.name?.split(' ').slice(1).join(' ') || '',
            company_name: companyName,
            role: 'company_user',
            selected_plan: tier,
            signup_id: signupId,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        setSignupError(error.message || 'Failed to create account');
        setIsSigningUp(false);
        return;
      }

      console.log("Sign up successful:", data);

      if (!data.user) {
        setSignupError('Failed to create user account');
        setIsSigningUp(false);
        return;
      }

      // Step 2: Sign in to establish session (needed for RLS policies)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in after signup failed:', signInError);
        // If email confirmation is required, this will fail - proceed anyway
        // The company creation might still work if there's a permissive policy
      }

      // Step 3: Create company (user is now authenticated)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        setSignupError('Failed to create company. Please contact support.');
        setIsSigningUp(false);
        return;
      }

      console.log('Company created:', companyData);

      // Step 3b: Link user to company as admin
      const { error: accessError } = await supabase
        .from('user_company_access')
        .insert({
          user_id: data.user.id,
          company_id: companyData.id,
          access_level: 'admin',
          affiliation_type: 'internal',
          is_internal: true,
          is_primary: true,
        });

      if (accessError) {
        console.error('Error linking user to company:', accessError);
        // Don't fail - company was created, user can be linked manually if needed
      }

      // Step 4: Initialize company with standard phases, document types, etc.
      try {
        const initResult = await CompanyInitializationService.initializeCompany(
          companyData.id,
          companyName,
          (progress) => {
            console.log(`[Genesis Signup] Initialization: ${progress.stepName} (${progress.percentage}%)`);
          }
        );

        if (!initResult.success) {
          console.error('Company initialization failed:', initResult.error);
          // Don't fail the signup, just log the error
        } else {
          console.log('Company initialization successful:', initResult.message);
        }
      } catch (initError) {
        console.error('Error during company initialization:', initError);
        // Don't fail the signup, just log the error
      }

      // Step 5: Update signup status in database
      if (signupId) {
        try {
          await supabase
            .from('new_pricing_signups')
            .update({
              status: 'converted',
              user_id: data.user.id,
              converted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', signupId);
        } catch (updateError) {
          console.error('Error updating signup status:', updateError);
        }
      }

      toast({
        title: "Account Created Successfully!",
        description: `Welcome to XYREG Genesis! Your account and company "${companyName}" have been created.`,
      });

      // Navigate to Genesis page
      navigate('/app/genesis');

    } catch (error: any) {
      console.error('Error signing up:', error);
      setSignupError(error.message || 'Failed to create account');
    } finally {
      setIsSigningUp(false);
    }
  };

  if (isSubmitted && submittedData) {
    // Show signup form with password fields for Genesis
    if (showSignupForm && tier === 'genesis') {
      return (
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Set a password for <strong>{submittedData.email}</strong>
            </p>
          </div>

          {/* Error message */}
          {signupError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {signupError}
            </div>
          )}

          <div className="space-y-4">
            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password *</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSigningUp}
              />
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSigningUp}
              />
            </div>

            {/* Submit button */}
            <Button
              onClick={handleCreateAccount}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      );
    }

    // Show success screen
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h3 className="text-2xl font-bold text-foreground">Request Submitted!</h3>
          <p className="text-muted-foreground">
            {successMessage || "Thank you for your interest in Xyreg. We've received your request and will contact you within 24 hours."}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left">
          <h4 className="font-semibold text-foreground">Your Submission Details:</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {submittedData.name}</div>
            <div><span className="font-medium">Company:</span> {submittedData.company}</div>
            <div><span className="font-medium">Email:</span> {submittedData.email}</div>
            {submittedData.phone && (
              <div><span className="font-medium">Phone:</span> {submittedData.phone}</div>
            )}
            <div><span className="font-medium">Selected Plan:</span> <span className="capitalize font-semibold text-primary">{tier}</span></div>
          </div>
        </div>

        {/* Show Create Account button for Genesis plan */}
        {tier === 'genesis' && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 space-y-4">
            <h4 className="font-semibold text-teal-800">Ready to Get Started?</h4>
            <p className="text-sm text-teal-700">
              Create your free Genesis account now and start building your business case.
            </p>
            <Button
              onClick={handleShowSignupForm}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Create Free Account
            </Button>
          </div>
        )}

        {tier !== 'genesis' && (
          <div className="bg-primary/10 rounded-lg p-6 space-y-4">
            <h4 className="font-semibold text-foreground">What's Next?</h4>
            <p className="text-sm text-muted-foreground">
              Our team will review your request and contact you within 24 hours to set up your account.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@xybel.com</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>Available during business hours</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleNewRequest} variant="outline" className="flex-1">
            Submit Another Request
          </Button>
          <Button onClick={onSuccess} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
                <FormControl>
                  <Input placeholder="Your Company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="john@company.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your project and what you'd like to see in the demo..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Submitting..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ContactForm;
