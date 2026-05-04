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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const REMEMBER_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "120", label: "2 hours" },
  { value: "480", label: "8 hours" },
  { value: "1440", label: "24 hours" },
] as const;

/**
 * Check if OTP is still remembered for this user.
 * Looks at the latest used OTP code with remember_minutes set.
 * Returns true if created_at + remember_minutes > now.
 */
export async function isOtpRemembered(userId: string, companyId: string): Promise<boolean> {
  try {
    // Check via edge function (service_role) — no direct DB access needed
    const { data, error } = await supabase.functions.invoke("send-dashboard-otp", {
      body: { action: "check", userId, companyId, email: "" },
    });

    if (error || !data) return false;
    return data.remembered === true;
  } catch {
    return false;
  }
}

interface DashboardOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  userEmail: string;
  userId: string;
  userName?: string;
  companyName: string;
  companyId: string;
}

export function DashboardOtpDialog({
  open,
  onOpenChange,
  onVerified,
  userEmail,
  userId,
  userName,
  companyName,
  companyId,
}: DashboardOtpDialogProps) {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberMinutes, setRememberMinutes] = useState("60");

  // Load user's last preferred duration via edge function
  useEffect(() => {
    if (!open || !userId || !companyId) return;
    supabase.functions.invoke("send-dashboard-otp", {
      body: { action: "get-preference", userId, companyId, email: "" },
    }).then(({ data }) => {
      if (data?.remember_minutes) {
        setRememberMinutes(String(data.remember_minutes));
      }
    });
  }, [open, userId, companyId]);

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
            companyId,
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
      const parsedMinutes = rememberMe ? parseInt(rememberMinutes, 10) : undefined;
      const { data, error: fnError } = await supabase.functions.invoke(
        "send-dashboard-otp",
        {
          body: {
            action: "verify",
            email: userEmail,
            code: otpCode,
            rememberMinutes: parsedMinutes,
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="otp-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="otp-remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Don't ask again for
              </label>
              <Select
                value={rememberMinutes}
                onValueChange={setRememberMinutes}
                disabled={!rememberMe}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMEMBER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rememberMe && (
              <p className="text-[11px] text-muted-foreground/70 pl-6">
                Applies to this company — no OTP needed for {REMEMBER_OPTIONS.find(o => o.value === rememberMinutes)?.label || rememberMinutes + " min"}
              </p>
            )}
          </div>

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
