import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ThinkingIndicatorProps {
  hasConnectedBlocks?: boolean;
  hasInstructions?: boolean;
}

const phases = [
  { text: "Thinking...", delay: 0 },
  { text: "Analyzing your request...", delay: 500 },
  { text: "Looking at connected blocks...", delay: 1000, condition: "hasConnectedBlocks" },
  { text: "Reviewing instructions...", delay: 1500, condition: "hasInstructions" },
  { text: "Crafting your response...", delay: 2000 },
];

export function ThinkingIndicator({ hasConnectedBlocks, hasInstructions }: ThinkingIndicatorProps) {
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const filteredPhases = phases.filter((phase) => {
      if (phase.condition === "hasConnectedBlocks") return hasConnectedBlocks;
      if (phase.condition === "hasInstructions") return hasInstructions;
      return true;
    });

    const timers = filteredPhases.map((phase, index) => {
      return setTimeout(() => {
        setCurrentPhase(index);
      }, phase.delay);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [hasConnectedBlocks, hasInstructions]);

  const filteredPhases = phases.filter((phase) => {
    if (phase.condition === "hasConnectedBlocks") return hasConnectedBlocks;
    if (phase.condition === "hasInstructions") return hasInstructions;
    return true;
  });

  const currentText = filteredPhases[currentPhase]?.text || "Thinking...";

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground animate-pulse">{currentText}</span>
    </div>
  );
}
