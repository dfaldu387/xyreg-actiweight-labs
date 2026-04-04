import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, Mail, Eye, EyeOff, Check, XCircle } from "lucide-react";
import { PersonalDetails as PersonalDetailsType, UserType } from '@/hooks/useRegistrationFlow';
import { toast } from 'sonner';

interface PersonalDetailsProps {
  personalDetails: PersonalDetailsType;
  selectedUserType: UserType;
  isLoading: boolean;
  error: string | null;
  onDetailsChange: (updates: Partial<PersonalDetailsType>) => void;
  onSubmit: () => Promise<{ status: boolean, message: string }>;
}

export function PersonalDetails({
  personalDetails,
  selectedUserType,
  isLoading,
  error,
  onDetailsChange,
  onSubmit
}: PersonalDetailsProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onDetailsChange({
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstName = personalDetails.firstName.trim();
    const lastName = personalDetails.lastName.trim();
    const phone = personalDetails.phone.trim();
    const password = personalDetails.password.trim();

    if (!firstName) {
      toast.error("First name cannot be blank or whitespace.");
      return;
    }

    if (!lastName) {
      toast.error("Last name cannot be blank or whitespace.");
      return;
    }

    if (!phone) {
      toast.error("Phone number cannot be blank or whitespace.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    const result = await onSubmit();
    if (result.status === false && result.message.includes("Company already exists")) {
      toast.error('Company already exists. Please use the "Sign In" button to access your existing account.');
    }
    // if (result.status === false && result.message.includes("User already registered")) {
    //   toast.error('An account with this email already exists. Please use the "Sign In" button to access your existing account.');
    // }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        {/* <h3 className="text-lg font-semibold">Personal Details</h3>
        <p className="text-sm text-muted-foreground">
          {selectedUserType === 'consultant' ? 'Enter your consultant information' : 'Enter your business information'}
        </p> */}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={personalDetails.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={personalDetails.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            name="email"
            autoComplete="new-email"
            type="email"
            placeholder="you@example.com"
            value={personalDetails.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={personalDetails.phone}
            onChange={handleInputChange}
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
              autoComplete="new-password"
              value={personalDetails.password}
              onChange={handleInputChange}
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
          {personalDetails.password.length > 0 && (() => {
            const pw = personalDetails.password;
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
              value={personalDetails.confirmPassword}
              onChange={handleInputChange}
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
          {personalDetails.confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs mt-1">
              {personalDetails.password === personalDetails.confirmPassword ? (
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
            checked={personalDetails.agreeTerms}
            onCheckedChange={(checked) => onDetailsChange({ agreeTerms: checked as boolean })}
            required
          />
          <Label htmlFor="agreeTerms" className="text-sm font-normal">
            I agree to the{' '}
            <button type="button" onClick={() => setTermsOpen(true)} className="text-primary hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button type="button" onClick={() => setPrivacyOpen(true)} className="text-primary hover:underline">Privacy Policy</button>
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* Terms of Service Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-sm text-muted-foreground">Last Updated: February 2026</p>
              <p>These Terms of Service govern your use of Xyreg's platform and services. By accessing or using our services, you agree to these terms.</p>
              <h3 className="text-base font-semibold">1. Acceptance of Terms</h3>
              <p>By creating an account or using Xyreg, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</p>
              <h3 className="text-base font-semibold">2. Description of Services</h3>
              <p>Xyreg provides a software platform for MedTech product and project management, including document control, regulatory tracking, and team collaboration tools. We reserve the right to modify or discontinue features with reasonable notice.</p>
              <h3 className="text-base font-semibold">3. User Accounts</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and current information</li>
                <li>Notifying us of any unauthorized access</li>
              </ul>
              <h3 className="text-base font-semibold">4. Data Protection</h3>
              <p>We process personal data in accordance with applicable data protection regulations, including GDPR. Your data is stored securely and used only for the purposes described in our Privacy Policy.</p>
              <h3 className="text-base font-semibold">5. Intellectual Property</h3>
              <p>All content, features, and functionality of the Xyreg platform are owned by Xyreg and protected by international copyright, trademark, and other intellectual property laws.</p>
              <h3 className="text-base font-semibold">6. Limitation of Liability</h3>
              <p>Xyreg shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.</p>
              <h3 className="text-base font-semibold">7. Governing Law</h3>
              <p>These terms shall be governed by and construed in accordance with the laws of the European Union and applicable national laws.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-sm text-muted-foreground">Last Updated: February 2026</p>
              <p>This Privacy Policy describes how Xyreg collects, uses, and protects your personal information.</p>
              <h3 className="text-base font-semibold">1. Information We Collect</h3>
              <p>We collect information you provide directly, such as name, email, company details, and usage data when you interact with our platform.</p>
              <h3 className="text-base font-semibold">2. How We Use Your Information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide and maintain our services</li>
                <li>To communicate with you about your account</li>
                <li>To improve and personalize your experience</li>
                <li>To comply with legal obligations</li>
              </ul>
              <h3 className="text-base font-semibold">3. Data Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
              <h3 className="text-base font-semibold">4. Your Rights</h3>
              <p>Under GDPR, you have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data.</p>
              <h3 className="text-base font-semibold">5. Contact Us</h3>
              <p>For any privacy-related questions, please contact us at privacy@xyreg.com.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}