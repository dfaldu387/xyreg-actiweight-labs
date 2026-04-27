import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TestCase } from "@/services/vvService";

type ReqType = "system" | "software" | "hardware" | "user_need";

interface CreateRequirementFromFailureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testCase: TestCase | null;
  executionId: string | null;
  productId: string;
  companyId: string;
  onCreated?: () => void;
}

const REQ_CONFIG: Record<
  ReqType,
  { label: string; table: string; idField: string; prefix: string; targetType: string }
> = {
  system: {
    label: "System Requirement",
    table: "system_requirements",
    idField: "requirement_id",
    prefix: "SYSR",
    targetType: "system_requirement",
  },
  software: {
    label: "Software Requirement",
    table: "software_requirements",
    idField: "requirement_id",
    prefix: "SWR",
    targetType: "software_requirement",
  },
  hardware: {
    label: "Hardware Requirement",
    table: "hardware_requirements",
    idField: "requirement_id",
    prefix: "HWR",
    targetType: "hardware_requirement",
  },
  user_need: {
    label: "User Need",
    table: "user_needs",
    idField: "user_need_id",
    prefix: "UN",
    targetType: "user_need",
  },
};

async function generateNextId(
  table: string,
  idField: string,
  prefix: string,
  productId: string,
): Promise<string> {
  const { data } = await supabase
    .from(table as any)
    .select(idField)
    .eq("product_id", productId)
    .ilike(idField, `${prefix}-%`)
    .order(idField, { ascending: false })
    .limit(50);

  let max = 0;
  (data || []).forEach((row: any) => {
    const id: string = row[idField] || "";
    const segs = id.split("-");
    const n = parseInt(segs[segs.length - 1], 10);
    if (!isNaN(n) && n > max) max = n;
  });

  return `${prefix}-${(max + 1).toString().padStart(3, "0")}`;
}

export function CreateRequirementFromFailureDialog({
  open,
  onOpenChange,
  testCase,
  executionId,
  productId,
  companyId,
  onCreated,
}: CreateRequirementFromFailureDialogProps) {
  const [reqType, setReqType] = useState<ReqType>("software");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const provenancePrefill = useMemo(() => {
    if (!testCase) return "";
    const tcId = testCase.test_case_id;
    const execHint = executionId ? ` (Execution ${executionId.slice(0, 8)})` : "";
    return `Originated from failed test ${tcId}${execHint}.\n\nReason: spec gap — failure indicated a missing or incomplete requirement.\n\nProposed requirement: `;
  }, [testCase, executionId]);

  useEffect(() => {
    if (open) {
      setReqType("software");
      setTitle("");
      setDescription(provenancePrefill);
    }
  }, [open, provenancePrefill]);

  const handleSubmit = async () => {
    if (!testCase || !title.trim() || !description.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cfg = REQ_CONFIG[reqType];
      const newId = await generateNextId(cfg.table, cfg.idField, cfg.prefix, productId);

      // Build base insert payload (common columns across all four tables)
      const insertPayload: Record<string, any> = {
        company_id: companyId,
        product_id: productId,
        [cfg.idField]: newId,
        description: `${title.trim()}\n\n${description.trim()}`,
        status: "Draft",
        created_by: user.id,
      };

      // user_needs requires a category; default to 'General'
      if (reqType === "user_need") {
        insertPayload.category = "General";
      }

      const { data: created, error: insertErr } = await supabase
        .from(cfg.table as any)
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Create traceability link: requirement -> test_case
      const { error: linkErr } = await supabase
        .from("traceability_links")
        .insert({
          company_id: companyId,
          product_id: productId,
          source_type: cfg.targetType,
          source_id: (created as any).id,
          target_type: "test_case",
          target_id: testCase.id,
          link_type: "verified_by",
          rationale: `Created from failed test ${testCase.test_case_id}${executionId ? ` (execution ${executionId.slice(0, 8)})` : ""}.`,
          created_by: user.id,
        });

      if (linkErr) {
        console.warn("Failed to create traceability link:", linkErr);
        toast.warning(`${newId} created, but linking to ${testCase.test_case_id} failed.`);
      } else {
        toast.success(`${newId} created and linked to ${testCase.test_case_id}.`);
      }

      onCreated?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to create requirement from failure:", err);
      toast.error(err.message || "Failed to create requirement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Requirement from Failed Test</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Requirement Type</Label>
            <RadioGroup
              value={reqType}
              onValueChange={(v) => setReqType(v as ReqType)}
              className="grid grid-cols-2 gap-2"
            >
              {(Object.keys(REQ_CONFIG) as ReqType[]).map((key) => (
                <label
                  key={key}
                  htmlFor={`req-${key}`}
                  className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/40"
                >
                  <RadioGroupItem value={key} id={`req-${key}`} />
                  <span className="text-sm">{REQ_CONFIG[key].label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Display shall show error code on sensor timeout"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Provenance link to <strong>{testCase?.test_case_id}</strong> will be saved
              automatically. The new requirement is created in <strong>Draft</strong> state.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !description.trim()}
          >
            {saving ? "Creating..." : "Create Requirement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}