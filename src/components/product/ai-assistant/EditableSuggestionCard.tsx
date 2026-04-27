import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Info } from "lucide-react";

export type EditableField = {
  key: string;
  label: string;
  value: string;
  type: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export interface EditableSuggestionCardProps {
  selected: boolean;
  onToggle: () => void;
  confidence?: number;
  edited?: boolean;
  rationale?: string;
  readOnly: React.ReactNode;
  fields: EditableField[];
  onSave: (values: Record<string, string>) => void;
}

const getConfidenceColor = (c: number) => {
  if (c >= 0.9) return "text-green-600 dark:text-green-400";
  if (c >= 0.8) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export function EditableSuggestionCard({
  selected,
  onToggle,
  confidence,
  edited,
  rationale,
  readOnly,
  fields,
  onSave,
}: EditableSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    setIsEditing(true);
  };

  const cancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const save = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(draft);
    setIsEditing(false);
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      } ${isEditing ? "" : "cursor-pointer"}`}
      onClick={() => {
        if (!isEditing) onToggle();
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle()}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <div className="flex-1 space-y-2 min-w-0">
            {!isEditing ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">{readOnly}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {edited && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                      >
                        Edited
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={startEdit}
                      aria-label="Edit suggestion"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {typeof confidence === "number" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
                              {Math.round(confidence * 100)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Confidence Score</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                {rationale && (
                  <div className="flex items-start gap-1">
                    <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{rationale}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                    {f.type === "textarea" && (
                      <Textarea
                        value={draft[f.key] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="min-h-[70px] text-sm"
                      />
                    )}
                    {f.type === "text" && (
                      <Input
                        value={draft[f.key] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="text-sm"
                      />
                    )}
                    {f.type === "select" && (
                      <Select
                        value={draft[f.key] ?? ""}
                        onValueChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options || []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={cancel}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={save}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
