import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyMember } from "@/hooks/useCompanyMembers";

export interface MentionTextareaHandle { focus: () => void; }

interface Props {
  value: string;
  onChange: (v: string, mentioned: CompanyMember[]) => void;
  members: CompanyMember[];
  placeholder?: string;
  rows?: number;
}

export const MentionTextarea = forwardRef<MentionTextareaHandle, Props>(function MentionTextarea(
  { value, onChange, members, placeholder, rows = 3 }, ref
) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const triggerStartRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({ focus: () => taRef.current?.focus() }));

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q)).slice(0, 6);
  }, [members, query]);

  useEffect(() => { setActiveIdx(0); }, [query, open]);

  const detectMentions = (text: string): CompanyMember[] => {
    const found: CompanyMember[] = [];
    for (const m of members) {
      const token = `@${m.name}`;
      if (text.includes(token) && !found.some(x => x.id === m.id)) found.push(m);
    }
    return found;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const caret = e.target.selectionStart ?? text.length;
    // Find @ before caret
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at >= 0) {
      const seg = before.slice(at + 1);
      const charBefore = at === 0 ? " " : before[at - 1];
      if (/^[\w .-]{0,30}$/.test(seg) && /\s|^$/.test(charBefore)) {
        triggerStartRef.current = at;
        setQuery(seg);
        setOpen(true);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
    onChange(text, detectMentions(text));
  };

  const insertMention = (m: CompanyMember) => {
    const ta = taRef.current; if (!ta) return;
    const start = triggerStartRef.current ?? 0;
    const caret = ta.selectionStart ?? value.length;
    const newText = value.slice(0, start) + `@${m.name} ` + value.slice(caret);
    onChange(newText, detectMentions(newText));
    setOpen(false);
    requestAnimationFrame(() => {
      const pos = start + m.name.length + 2;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(matches.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(matches[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div className="relative">
      <Textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="text-sm"
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
          {matches.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
              className={`w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 ${i === activeIdx ? "bg-accent" : "hover:bg-accent/50"}`}
            >
              <span className="font-medium">{m.name}</span>
              {m.email && <span className="text-xs text-muted-foreground truncate">{m.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});