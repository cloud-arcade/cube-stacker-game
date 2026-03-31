/**
 * Stacker Input Hook
 * Handles keyboard (Space) and touch input for stopping blocks
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseStackerInputOptions {
  onAction: () => void;
  enabled?: boolean;
}

export function useStackerInput({ onAction, enabled = true }: UseStackerInputOptions) {
  const onActionRef = useRef(onAction);
  const lastActionTime = useRef(0);
  const DEBOUNCE_MS = 100; // Prevent double-triggers
  
  // Keep callback ref updated
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const triggerAction = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_MS) return;
    lastActionTime.current = now;
    onActionRef.current();
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        triggerAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, triggerAction]);

  // Touch/click handler to attach to elements
  const handleTap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (enabled) {
      triggerAction();
    }
  }, [enabled, triggerAction]);

  return { handleTap };
}
