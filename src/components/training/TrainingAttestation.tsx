import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { useSignAndComplete } from "@/hooks/useTrainingPhase";

interface Props {
  recordId: string;
  moduleId: string;
  moduleVersion: string;
  attestationText: string;
  userId: string;
  userEmail: string;
  onSigned: () => void;
}

export function TrainingAttestation(props: Props) {
  const [pwd, setPwd] = useState("");
  const [agreed, setAgreed] = useState(false);
  const sign = useSignAndComplete();

  const submit = () => {
    sign.mutate(
      {
        recordId: props.recordId,
        moduleId: props.moduleId,
        userId: props.userId,
        email: props.userEmail,
        password: pwd,
        attestationText: props.attestationText,
        moduleVersion: props.moduleVersion,
      },
      { onSuccess: props.onSigned }
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
        <h3 className="text-lg font-semibold">Electronic signature</h3>
        <p className="text-xs text-muted-foreground">
          Re-enter your password to legally attest. This generates a permanent training record (21 CFR Part 11).
        </p>
      </div>
      <div className="rounded-md border p-3 bg-muted/30 text-sm">
        {props.attestationText}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-1" />
        <Label htmlFor="agree" className="text-sm cursor-pointer">
          I agree to the statement above for module version {props.moduleVersion}.
        </Label>
      </div>
      <div className="space-y-1">
        <Label htmlFor="pwd">Password</Label>
        <Input
          id="pwd"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <Button
        className="w-full"
        disabled={!agreed || pwd.length < 4 || sign.isPending}
        onClick={submit}
      >
        {sign.isPending ? "Signing…" : "Sign and complete"}
      </Button>
    </div>
  );
}