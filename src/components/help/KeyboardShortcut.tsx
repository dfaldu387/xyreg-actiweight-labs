import { parseShortcut } from '@/utils/keyboard';

interface KeyboardShortcutProps {
  shortcut: string;
  className?: string;
}

export function KeyboardShortcut({ shortcut, className = '' }: KeyboardShortcutProps) {
  const parsedShortcut = parseShortcut(shortcut);
  const keys = parsedShortcut.split(/\s*\+\s*/);
  
  return (
    <code className={`text-sm font-mono bg-background px-3 py-1.5 rounded border font-semibold inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center">
          {index > 0 && <span className="mx-1 opacity-50">+</span>}
          <kbd className="font-semibold">{key.trim()}</kbd>
        </span>
      ))}
    </code>
  );
}
