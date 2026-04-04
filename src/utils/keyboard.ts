/**
 * Detect if user is on macOS
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || 
         /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Get the modifier key name for the current OS
 */
export function getModifierKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Get the modifier key symbol for the current OS
 */
export function getModifierSymbol(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Parse a keyboard shortcut string and return OS-specific version
 * Replaces "Ctrl/Cmd" or "Ctrl" with the appropriate key for current OS
 */
export function parseShortcut(shortcut: string): string {
  if (isMac()) {
    return shortcut
      .replace(/Ctrl\/Cmd/g, '⌘')
      .replace(/Ctrl/g, '⌘');
  } else {
    return shortcut.replace(/Ctrl\/Cmd/g, 'Ctrl');
  }
}
