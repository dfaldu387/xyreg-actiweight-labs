
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuditForm, AuditFormData } from "./AuditForm";

interface AuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AuditFormData) => Promise<void>;
  initialData?: AuditFormData;
  formType: "company" | "product";
  title: string;
  description?: string;
  companyId?: string;
}

export function AuditDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  formType,
  title,
  description,
  companyId,
}: AuditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AuditFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <AuditForm
          formType={formType}
          onSubmit={handleSubmit}
          initialData={initialData}
          isSubmitting={isSubmitting}
          companyId={companyId}
        />
      </DialogContent>
    </Dialog>
  );
}
