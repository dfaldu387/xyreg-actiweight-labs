import * as React from "react";
import { Languages, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appendLanguageSuffix, TRANSLATION_LANGUAGES } from "@/utils/documentNumbering";

interface TranslateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName?: string;
  documentNumber?: string | null;
  isTranslating?: boolean;
  onConfirm: (langCode: string) => void;
}

export function TranslateDocumentDialog({
  open,
  onOpenChange,
  documentName,
  documentNumber,
  isTranslating = false,
  onConfirm,
}: TranslateDocumentDialogProps) {
  const [lang, setLang] = React.useState<string>("FI");

  React.useEffect(() => {
    if (open) setLang("FI");
  }, [open]);

  const previewNumber = appendLanguageSuffix(documentNumber || "", lang);
  const previewName = documentName
    ? (previewNumber ? `${previewNumber} ${documentName} (${lang})` : `${documentName} (${lang})`)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate copy
          </DialogTitle>
          <DialogDescription>
            Creates a separate, AI-translated copy of this document. The English master
            remains the authoritative version — translations should be re-generated when
            the master changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">{documentName || "Untitled"}</div>
              {documentNumber && (
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{documentNumber}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="translate-lang">Target language</Label>
            <Select value={lang} onValueChange={setLang} disabled={isTranslating}>
              <SelectTrigger id="translate-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATION_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label} <span className="font-mono text-muted-foreground">— {l.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Will be created as</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">{previewName}</div>
              {previewNumber && (
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{previewNumber}</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTranslating}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(lang)} disabled={isTranslating}>
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating…
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Create translated copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}