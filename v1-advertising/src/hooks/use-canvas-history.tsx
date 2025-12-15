import { useState, useCallback, useEffect } from "react";

interface Block {
  id: string;
  type: "image" | "text" | "url" | "document" | "video" | "group" | "chat";
  content?: string;
  title?: string;
  url?: string;
  file_path?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color?: string;
  metadata?: any;
  group_id?: string | null;
  instruction_prompt?: string;
}

interface HistoryState {
  blocks: Block[];
  timestamp: number;
}

interface UseCanvasHistoryProps {
  currentBlocks: Block[];
  onRestore: (blocks: Block[]) => void;
}

export function useCanvasHistory({ currentBlocks, onRestore }: UseCanvasHistoryProps) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRestoring, setIsRestoring] = useState(false);

  const MAX_HISTORY = 50; // Keep last 50 states

  // Save current state to history
  const saveState = useCallback(() => {
    if (isRestoring) return; // Don't save while restoring

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      const newState: HistoryState = {
        blocks: JSON.parse(JSON.stringify(currentBlocks)),
        timestamp: Date.now(),
      };
      
      // Add to history and limit size
      const updatedHistory = [...newHistory, newState].slice(-MAX_HISTORY);
      
      return updatedHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, MAX_HISTORY - 1);
      return newIndex;
    });
  }, [currentBlocks, currentIndex, isRestoring]);

  // Undo to previous state
  const undo = useCallback(() => {
    if (currentIndex <= 0) return false;

    const previousState = history[currentIndex - 1];
    if (!previousState) return false;

    setIsRestoring(true);
    setCurrentIndex(prev => prev - 1);
    onRestore(previousState.blocks);
    
    setTimeout(() => setIsRestoring(false), 100);
    return true;
  }, [currentIndex, history, onRestore]);

  // Redo to next state
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return false;

    const nextState = history[currentIndex + 1];
    if (!nextState) return false;

    setIsRestoring(true);
    setCurrentIndex(prev => prev + 1);
    onRestore(nextState.blocks);
    
    setTimeout(() => setIsRestoring(false), 100);
    return true;
  }, [currentIndex, history, onRestore]);

  // Check if undo/redo is available
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Initialize with first state
  useEffect(() => {
    if (history.length === 0 && currentBlocks.length >= 0) {
      setHistory([{
        blocks: JSON.parse(JSON.stringify(currentBlocks)),
        timestamp: Date.now(),
      }]);
      setCurrentIndex(0);
    }
  }, [currentBlocks.length]); // Only run when blocks are first loaded

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    isRestoring,
    historyLength: history.length,
    currentIndex,
  };
}
