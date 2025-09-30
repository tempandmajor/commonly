import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean | undefined;
  shift?: boolean | undefined;
  alt?: boolean | undefined;
  meta?: boolean | undefined;
  callback: () => void;
  description?: string | undefined;
  enabled?: boolean | undefined;
  preventDefault?: boolean | undefined;
}

interface UseKeyboardShortcutsOptions {
  // Whether to enable shortcuts when input elements are focused
  enableInInputs?: boolean | undefined;
  // Global enable/disable
  enabled?: boolean | undefined;
  // Debug mode logs key events
  debug?: boolean | undefined;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enableInInputs = false, enabled = true, debug = false } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if we're in an input element
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.contentEditable === 'true';

      if (!enableInInputs && (isInput || isContentEditable)) {
        return;
      }

      if (debug) {
      }

      const matchingShortcut = shortcutsRef.current.find(shortcut => {
        if (shortcut.enabled === false) return false;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = (shortcut.ctrl ?? false) === event.ctrlKey;
        const shiftMatches = (shortcut.shift ?? false) === event.shiftKey;
        const altMatches = (shortcut.alt ?? false) === event.altKey;
        const metaMatches = (shortcut.meta ?? false) === event.metaKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        matchingShortcut.callback();
      }
    },
    [enabled, enableInInputs, debug]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return a formatted list of shortcuts for display
  const getShortcutsList = useCallback(() => {
    return shortcuts
      .filter(s => s.enabled !== false && s.description)
      .map(shortcut => {
        const keys = [];
        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.alt) keys.push('Alt');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.meta) keys.push('⌘');
        keys.push(shortcut.key.toUpperCase());

        return {
          keys: keys.join('+'),
          description: shortcut.description,
        };
      });
  }, [shortcuts]);

  return { getShortcutsList };
};

// Common shortcuts factory functions
export const createSaveShortcut = (callback: () => void): KeyboardShortcut => ({
  key: 's',
  ctrl: true,
  callback,
  description: 'Save',
});

export const createSubmitShortcut = (callback: () => void): KeyboardShortcut => ({
  key: 'Enter',
  ctrl: true,
  callback,
  description: 'Submit',
});

export const createCancelShortcut = (callback: () => void): KeyboardShortcut => ({
  key: 'Escape',
  callback,
  description: 'Cancel',
});

export const createSearchShortcut = (callback: () => void): KeyboardShortcut => ({
  key: 'k',
  ctrl: true,
  callback,
  description: 'Search',
});

export const createNavigationShortcuts = (
  onNext: () => void,
  onPrev: () => void
): KeyboardShortcut[] => [
  {
    key: 'ArrowRight',
    alt: true,
    callback: onNext,
    description: 'Next',
  },
  {
    key: 'ArrowLeft',
    alt: true,
    callback: onPrev,
    description: 'Previous',
  },
];
