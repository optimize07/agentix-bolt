import { useState, useCallback, useRef } from "react";
import { Node, Edge } from "reactflow";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface UseReactFlowHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => { nodes: Node[]; edges: Edge[] } | null;
  redo: () => { nodes: Node[]; edges: Edge[] } | null;
  saveState: (nodes: Node[], edges: Edge[]) => void;
  clearHistory: () => void;
  isRestoring: boolean;
  markRestoringComplete: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useReactFlowHistory(): UseReactFlowHistoryReturn {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [, forceUpdate] = useState(0);

  // Phase 1: Explicit method to mark restoration complete (replaces setTimeout)
  const markRestoringComplete = useCallback(() => {
    console.log('[History] Marking restoration complete');
    isRestoringRef.current = false;
    setIsRestoringState(false);
    forceUpdate(prev => prev + 1);
  }, []);

  // Phase 1: Helper to compare states (duplicate detection)
  const statesAreEqual = useCallback((state1: HistoryState, state2: HistoryState): boolean => {
    // Compare node and edge counts first (quick check)
    if (state1.nodes.length !== state2.nodes.length || state1.edges.length !== state2.edges.length) {
      return false;
    }

    // Deep comparison of serialized state
    const str1 = JSON.stringify({
      nodes: state1.nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: state1.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    });
    const str2 = JSON.stringify({
      nodes: state2.nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: state2.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    });

    return str1 === str2;
  }, []);

  const saveState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Don't save during undo/redo operations
    if (isRestoringRef.current) {
      console.log('[History] Skipping save - restore in progress');
      return;
    }

    // Validate nodes have positions
    const invalidNodes = nodes.filter(n => typeof n.position?.x !== 'number' || typeof n.position?.y !== 'number');
    if (invalidNodes.length > 0) {
      console.warn('[History] Invalid nodes detected, skipping save:', invalidNodes);
      return;
    }

    // Phase 1: Check for duplicate state (don't save if identical to current)
    const currentState = historyRef.current[currentIndexRef.current];
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    };

    if (currentState && statesAreEqual(currentState, newState)) {
      console.log('[History] Skipping duplicate state save');
      return;
    }

    // Remove any states after current index (redo stack)
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(newState);
    
    // Phase 1: Better logging with node IDs
    console.log('[History] Saved state:', {
      nodeCount: nodes.length,
      nodeIds: nodes.map(n => n.id).join(', '),
      edgeCount: edges.length,
      historyIndex: currentIndexRef.current + 1,
      totalHistory: historyRef.current.length,
    });
    
    // Keep history size under limit
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current.shift();
      currentIndexRef.current = historyRef.current.length - 2;
    } else {
      currentIndexRef.current = historyRef.current.length - 1;
    }
    
    // Force re-render to update canUndo/canRedo
    forceUpdate(prev => prev + 1);
  }, [statesAreEqual]);

  const undo = useCallback(() => {
    if (currentIndexRef.current <= 0) {
      console.log('[History] Cannot undo - at start of history');
      return null;
    }

    isRestoringRef.current = true;
    setIsRestoringState(true);
    currentIndexRef.current = currentIndexRef.current - 1;
    const previousState = historyRef.current[currentIndexRef.current];

    console.log('[History] Undo:', {
      newIndex: currentIndexRef.current,
      nodeCount: previousState.nodes.length,
      nodeIds: previousState.nodes.map(n => n.id).join(', '),
      edgeCount: previousState.edges.length,
    });

    // Phase 1: Don't use setTimeout - caller will call markRestoringComplete()
    // Force re-render to update canUndo/canRedo
    forceUpdate(prev => prev + 1);

    return {
      nodes: JSON.parse(JSON.stringify(previousState.nodes)),
      edges: JSON.parse(JSON.stringify(previousState.edges)),
    };
  }, []);

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) {
      console.log('[History] Cannot redo - at end of history');
      return null;
    }

    isRestoringRef.current = true;
    setIsRestoringState(true);
    currentIndexRef.current = currentIndexRef.current + 1;
    const nextState = historyRef.current[currentIndexRef.current];

    console.log('[History] Redo:', {
      newIndex: currentIndexRef.current,
      nodeCount: nextState.nodes.length,
      nodeIds: nextState.nodes.map(n => n.id).join(', '),
      edgeCount: nextState.edges.length,
    });

    // Phase 1: Don't use setTimeout - caller will call markRestoringComplete()
    // Force re-render to update canUndo/canRedo
    forceUpdate(prev => prev + 1);

    return {
      nodes: JSON.parse(JSON.stringify(nextState.nodes)),
      edges: JSON.parse(JSON.stringify(nextState.edges)),
    };
  }, []);

  const clearHistory = useCallback(() => {
    console.log('[History] Clearing all history');
    historyRef.current = [];
    currentIndexRef.current = -1;
    isRestoringRef.current = false;
    setIsRestoringState(false);
    forceUpdate(prev => prev + 1);
  }, []);

  return {
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
    undo,
    redo,
    saveState,
    clearHistory,
    isRestoring: isRestoringState,
    markRestoringComplete,
  };
}
