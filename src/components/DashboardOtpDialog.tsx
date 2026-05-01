import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DashboardOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  userEmail: string;
  userId: string;
  userName?: string;
  companyName: string;
}

export function DashboardOtpDialog({
  open,
  onOpenChange,
  onVerified,
  userEmail,
  userId,
  userName,
  companyName,
}: DashboardOtpDialogProps) {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const sendOtp = useCallback(async () => {
    setSending(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "send-dashboard-otp",
        {
          body: {
            action: "send",
            email: userEmail,
            userId,
            companyName,
            userName,
          },
        }
      );
      if (fnError || !data?.success) {
        setError(data?.message || "Failed to send verification code");
        return;
      }
      setResendCooldown(60);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setSending(false);
    }
  }, [userEmail, userId, companyName]);

  // Send OTP when dialog opens
  useEffect(() => {
    if (open) {
      setOtpCode("");
      setError("");
      sendOtp();
    }
  }, [open, sendOtp]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "send-dashboard-otp",
        {
          body: {
            action: "verify",
            email: userEmail,
            code: otpCode,
          },
        }
      );
      if (fnError || !data?.verified) {
        setError(data?.message || "Invalid verification code");
        setLoading(false);
        return;
      }
      onVerified();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setOtpCode("");
    sendOtp();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard Access Verification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A 6-digit verification code has been sent to{" "}
            <strong>{userEmail}</strong>. Enter it below to access the{" "}
            <strong>{companyName}</strong> dashboard.
          </p>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value);
                setError("");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={otpCode.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Access Dashboard"
            )}
          </Button>

          <div className="text-center">
            {sending ? (
              <span className="text-sm text-muted-foreground">
                Sending code...
              </span>
            ) : resendCooldown > 0 ? (
              <span className="text-sm text-muted-foreground">
                Resend code in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={handleResend}
              >
                Resend code
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
