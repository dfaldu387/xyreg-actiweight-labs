import { useEffect } from 'react';
import { isMac } from '@/utils/keyboard';

export function useNavigationSearch(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = isMac() ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === 'j' && !isInputElement(e.target as HTMLElement)) {
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
