import { cn } from "@/lib/utils";

interface EdgeProps {
  id: string;
  path: string;
  color?: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function Edge({
  id,
  path,
  color,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeProps) {
  const strokeColor = color || "hsl(var(--primary))";
  
  return (
    <g>
      {/* Invisible wider path for easier clicking/hovering */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="50"
        strokeLinecap="round"
        fill="none"
        onClick={() => onClick(id)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="cursor-pointer"
      />
      
      {/* Visible edge path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
        strokeLinecap="round"
        fill="none"
        style={{
          transition: "stroke-width 150ms ease-out, filter 150ms ease-out",
        }}
        className={cn(
          "pointer-events-none",
          isSelected && "drop-shadow-lg",
          isHovered && "drop-shadow-md"
        )}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Selection indicator */}
      {isSelected && (
        <path
          d={path}
          stroke="hsl(var(--accent))"
          strokeWidth="5"
          fill="none"
          opacity="0.3"
          className="pointer-events-none"
        />
      )}
    </g>
  );
}
