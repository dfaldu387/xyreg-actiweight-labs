import { useEffect } from 'react';

export function useHelpKeyboardShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open help with ? key (Shift + /) when not in an input
      if (e.key === '?' && !isInputElement(e.target as HTMLElement)) {
        e.preventDefault();
        onOpen();
      }
    };

    const isInputElement = (element: HTMLElement): boolean => {
      const tagName = element.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        element.isContentEditable
      );
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
