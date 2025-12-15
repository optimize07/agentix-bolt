import { cn } from "@/lib/utils";
import { HandlePosition } from "@/lib/edgeCalculations";

interface ConnectionHandleProps {
  position: HandlePosition;
  blockId: string;
  isActive: boolean;
  isSource: boolean;
  isTarget: boolean;
  onClick: (blockId: string, position: HandlePosition) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const handleStyles: Record<HandlePosition, string> = {
  top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  right: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  left: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
};

export function ConnectionHandle({
  position,
  blockId,
  isActive,
  isSource,
  isTarget,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ConnectionHandleProps) {
  return (
    <button
      className={cn(
        "absolute w-3 h-3 rounded-full border-2 border-primary bg-background transition-all duration-200 z-20",
        handleStyles[position],
        isActive && "opacity-100 scale-125",
        !isActive && "opacity-0 group-hover:opacity-100",
        isSource && "bg-primary border-primary-foreground ring-2 ring-primary/50",
        isTarget && "bg-accent border-accent-foreground ring-2 ring-accent/50 hover:scale-150"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick(blockId, position);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`${position} connection handle`}
    />
  );
}
