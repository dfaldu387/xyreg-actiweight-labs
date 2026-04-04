import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, CheckCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { PasswordExpirationService } from '@/services/passwordExpirationService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function ForcePasswordChange() {
  const { user, signOut } = useAuth();
  const { lang } = useTranslation();
  const queryClient = useQueryClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: { requires_password_change: false },
      });

      if (updateError) throw updateError;

      // Record the password change
      if (user?.id) {
        await PasswordExpirationService.recordPasswordChange(user.id, 'expiry_forced');
      }

      // Invalidate the expiration cache so the gate re-evaluates
      await queryClient.invalidateQueries({ queryKey: ['password-expiration'] });

      toast.success(lang('auth.passwordExpired.success'));
    } catch (err: any) {
      console.error('Force password change error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Security Banner */}
      <div className="w-full bg-orange-500 text-white py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium whitespace-nowrap">
            For your security, your password has expired and must be updated. This is required by your organization's security policy.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-100 mb-4">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">{lang('auth.passwordExpired.title')}</CardTitle>
            <CardDescription>
              {lang('auth.passwordExpired.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">{lang('auth.passwordExpired.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {newPassword.length > 0 && (() => {
                  const rules = [
                    { label: "At least 8 characters", met: newPassword.length >= 8 },
                    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
                    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
                    { label: "Number (0-9)", met: /[0-9]/.test(newPassword) },
                    { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(newPassword) },
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
                              <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-muted-foreground shrink-0" />
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
                <Label htmlFor="confirm-password">{lang('auth.passwordExpired.confirmPassword')}</Label>
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
                  <div className="flex items-center gap-2">
                    {newPassword === confirmPassword ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs ${
                      newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)}
              >
                {isLoading ? 'Updating...' : lang('auth.passwordExpired.changeButton')}
              </Button>

              <div className="text-center">
                <Button type="button" variant="ghost" onClick={handleSignOut}>
                  {lang('auth.passwordExpired.signOut')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
