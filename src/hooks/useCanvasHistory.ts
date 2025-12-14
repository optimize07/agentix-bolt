import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseCanvasHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  clear: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useCanvasHistory(): UseCanvasHistoryReturn {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const isUndoingRef = useRef(false);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Skip if we're in the middle of an undo/redo operation
    if (isUndoingRef.current) return;

    const state: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    setPast(prev => {
      const newPast = [...prev, state];
      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        return newPast.slice(-MAX_HISTORY_SIZE);
      }
      return newPast;
    });

    // Clear future when new state is pushed
    setFuture([]);
  }, []);

  const undo = useCallback((): HistoryState | null => {
    if (past.length === 0) return null;

    isUndoingRef.current = true;

    const newPast = [...past];
    const previousState = newPast.pop()!;

    setPast(newPast);
    setFuture(prev => [previousState, ...prev]);

    // Return the state before the one we're undoing
    const stateToRestore = newPast[newPast.length - 1] || null;

    // Reset flag after a tick
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return stateToRestore;
  }, [past]);

  const redo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null;

    isUndoingRef.current = true;

    const newFuture = [...future];
    const nextState = newFuture.shift()!;

    setFuture(newFuture);
    setPast(prev => [...prev, nextState]);

    // Reset flag after a tick
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return nextState;
  }, [future]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clear,
  };
}
