
import { useState, useCallback } from 'react';

interface CommentPosition {
  x: number;
  y: number;
}

// Simplified hook for direct comment creation without positioning mode
export function useCommentPositioning() {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState<CommentPosition | null>(null);

  const startPositioning = useCallback((position: CommentPosition) => {
    setCommentPosition(position);
    setShowCommentInput(true);
  }, []);

  const clearPosition = useCallback(() => {
    setShowCommentInput(false);
    setCommentPosition(null);
  }, []);

  return {
    showCommentInput,
    commentPosition,
    startPositioning,
    clearPosition,
    // Legacy properties for compatibility - now simplified
    temporaryPins: [],
    isPositioningMode: false,
    activeInputPinId: null,
    addTemporaryPin: () => {},
    removeTemporaryPin: () => {},
    clearAllTemporaryPins: clearPosition,
    handleDocumentClick: () => {}
  };
}
