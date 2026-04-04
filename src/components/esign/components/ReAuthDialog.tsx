import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, Lock, Mail, Smartphone, Eye, EyeOff, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ESignService } from '../lib/esign.service';
import type { AuthMethod } from '../lib/esign.types';

interface ReAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onAuthenticated: (authMethod: AuthMethod) => void;
}

export function ReAuthDialog({ open, onOpenChange, email, onAuthenticated }: ReAuthDialogProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'totp' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // TOTP enrollment state
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpQrCode, setTotpQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  const resetState = useCallback(() => {
    setPassword('');
    setOtpCode('');
    setTotpCode('');
    setError('');
    setOtpSent(false);
    setIsAuthenticating(false);
    setIsSendingOtp(false);
    setShowPassword(false);
    setTotpQrCode(null);
    setTotpSecret(null);
    setIsEnrolling(false);
    setCopiedSecret(false);
  }, []);

  // Check if user already has TOTP enrolled when switching to TOTP tab
  useEffect(() => {
    if (open && activeTab === 'totp') {
      checkTotpEnrollment();
    }
  }, [open, activeTab]);

  const checkTotpEnrollment = async () => {
    setCheckingEnrollment(true);
    try {
      const { data, error: mfaError } = await supabase.auth.mfa.listFactors();
      if (mfaError) {
        console.error('MFA list error:', mfaError);
        setCheckingEnrollment(false);
        return;
      }

      const verifiedTotp = data.totp?.find(f => f.status === 'verified');
      if (verifiedTotp) {
        setTotpFactorId(verifiedTotp.id);
        setIsEnrolled(true);
      } else {
        setTotpFactorId(null);
        setIsEnrolled(false);
      }
    } catch (err) {
      console.error('Error checking TOTP enrollment:', err);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  // --- Password Re-Authentication ---
  const handlePasswordAuth = async () => {
    setError('');
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsAuthenticating(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid password. Please try again.');
        setIsAuthenticating(false);
        return;
      }

      resetState();
      onOpenChange(false);
      onAuthenticated('password_reauth');
    } catch {
      setError('Authentication failed. Please try again.');
      setIsAuthenticating(false);
    }
  };

  // --- TOTP Enrollment ---
  const handleEnrollTotp = async () => {
    setError('');
    setIsEnrolling(true);

    try {
      // Unenroll any unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const unverified = factors?.totp?.filter(f => (f.status as string) === 'unverified') ?? [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'XYREG Authenticator',
      });

      if (enrollError) {
        setError('Failed to set up authenticator. ' + enrollError.message);
        setIsEnrolling(false);
        return;
      }

      setTotpFactorId(data.id);
      setTotpQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
    } catch {
      setError('Failed to set up authenticator. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  // --- TOTP Verification (for both enrollment verification and re-auth) ---
  const handleVerifyTotp = async () => {
    setError('');
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    if (!totpFactorId) {
      setError('No authenticator factor found. Please set up first.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactorId,
      });

      if (challengeError) {
        setError('Authentication challenge failed. ' + challengeError.message);
        setIsAuthenticating(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: totpCode,
      });

      if (verifyError) {
        setError('Invalid code. Please check your authenticator app and try again.');
        setIsAuthenticating(false);
        return;
      }

      // If we were enrolling, now the factor is verified
      if (!isEnrolled) {
        setIsEnrolled(true);
      }

      resetState();
      onOpenChange(false);
      onAuthenticated('totp_authenticator');
    } catch {
      setError('Verification failed. Please try again.');
      setIsAuthenticating(false);
    }
  };

  const handleCopySecret = async () => {
    if (totpSecret) {
      await navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  // --- Email OTP ---
  const handleSendOTP = async () => {
    setError('');
    setIsSendingOtp(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User session not found. Please sign in again.');
        setIsSendingOtp(false);
        return;
      }

      const success = await ESignService.sendOTP(email, user.id);
      if (success) {
        setOtpSent(true);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch {
      setError('Failed to send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsAuthenticating(true);
    try {
      const verified = await ESignService.verifyOTP(email, otpCode);

      if (!verified) {
        setError('Invalid or expired code. Please try again.');
        setIsAuthenticating(false);
        return;
      }

      resetState();
      onOpenChange(false);
      onAuthenticated('email_otp');
    } catch {
      setError('Verification failed. Please try again.');
      setIsAuthenticating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); else onOpenChange(true); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Re-Authentication Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Per FDA 21 CFR Part 11, please verify your identity to confirm your electronic signature.
          </p>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} disabled className="bg-muted" />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setError(''); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="password" className="gap-1.5 text-xs">
                <Lock className="h-3 w-3" />
                Password
              </TabsTrigger>
              <TabsTrigger value="totp" className="gap-1.5 text-xs">
                <Smartphone className="h-3 w-3" />
                Authenticator
              </TabsTrigger>
              <TabsTrigger value="otp" className="gap-1.5 text-xs">
                <Mail className="h-3 w-3" />
                Email OTP
              </TabsTrigger>
            </TabsList>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="reauth-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reauth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordAuth()}
                    autoFocus
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handlePasswordAuth} disabled={isAuthenticating} className="w-full gap-2">
                {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {isAuthenticating ? 'Verifying...' : 'Confirm with Password'}
              </Button>
            </TabsContent>

            {/* Authenticator (TOTP) Tab */}
            <TabsContent value="totp" className="space-y-3 mt-3">
              {checkingEnrollment ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Checking authenticator status...</span>
                </div>
              ) : isEnrolled ? (
                /* Already enrolled — just ask for code */
                <>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.).
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="totp-code">Authenticator Code</Label>
                    <Input
                      id="totp-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyTotp()}
                      className="text-center text-lg tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleVerifyTotp}
                    disabled={isAuthenticating || totpCode.length !== 6}
                    className="w-full gap-2"
                  >
                    {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {isAuthenticating ? 'Verifying...' : 'Verify Authenticator Code'}
                  </Button>
                </>
              ) : totpQrCode ? (
                /* Enrollment step — show QR code and ask for verification code */
                <>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to complete setup.
                  </p>
                  <div className="flex justify-center py-2">
                    <img src={totpQrCode} alt="TOTP QR Code" className="w-48 h-48 border rounded-lg" />
                  </div>
                  {totpSecret && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all select-all">
                          {totpSecret}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={handleCopySecret}
                        >
                          {copiedSecret ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="totp-setup-code">Verification Code</Label>
                    <Input
                      id="totp-setup-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyTotp()}
                      className="text-center text-lg tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleVerifyTotp}
                    disabled={isAuthenticating || totpCode.length !== 6}
                    className="w-full gap-2"
                  >
                    {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {isAuthenticating ? 'Verifying...' : 'Verify & Complete Setup'}
                  </Button>
                </>
              ) : (
                /* Not enrolled — prompt to set up */
                <>
                  <div className="text-center py-2">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Set up an authenticator app for stronger security. You'll need Google Authenticator, Authy, or a similar TOTP app.
                    </p>
                  </div>
                  <Button
                    onClick={handleEnrollTotp}
                    disabled={isEnrolling}
                    className="w-full gap-2"
                  >
                    {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                    {isEnrolling ? 'Setting up...' : 'Set Up Authenticator'}
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Email OTP Tab */}
            <TabsContent value="otp" className="space-y-3 mt-3">
              {!otpSent ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    We will send a 6-digit verification code to <strong>{email}</strong>.
                  </p>
                  <Button
                    onClick={handleSendOTP}
                    disabled={isSendingOtp}
                    className="w-full gap-2"
                  >
                    {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {isSendingOtp ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to <strong>{email}</strong>.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                      className="text-center text-lg tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                      disabled={isAuthenticating}
                      className="flex-1"
                    >
                      Resend Code
                    </Button>
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={isAuthenticating || otpCode.length !== 6}
                      className="flex-1 gap-2"
                    >
                      {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                      {isAuthenticating ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-800">
              Your signature is legally binding and constitutes an electronic record under 21 CFR Part 11.
              Your identity, timestamp, IP address, and authentication method will be permanently recorded.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isAuthenticating}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
