import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { AskAIWidget } from "./AskAIWidget";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeBaseItem = Database["public"]["Tables"]["knowledge_base_items"]["Row"];

interface FloatingAskAIProps {
  preselectedItems?: KnowledgeBaseItem[];
  clientId?: string;
}

export function FloatingAskAI({ preselectedItems = [], clientId }: FloatingAskAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleClick = () => {
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="fixed z-50 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group cursor-move"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          background: 'var(--button-bg)',
        }}
        aria-label="Ask AI"
      >
        {/* Pulsing Ring */}
        {!isOpen && (
          <span 
            className="absolute inset-0 rounded-full animate-ping opacity-75" 
            style={{ background: 'var(--button-bg)' }}
          />
        )}

        {/* Inner Glow */}
        <span 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
          style={{ background: 'var(--button-hover)' }}
        />

        {/* Icon */}
        <Sparkles 
          className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform duration-300" 
          style={{ color: 'var(--button-text)' }}
        />

        {/* Tooltip */}
        <span 
          className="absolute right-full mr-3 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
          }}
        >
          Ask AI
        </span>
      </button>

      {/* Modal */}
      <AskAIWidget
        open={isOpen}
        onOpenChange={setIsOpen}
        preselectedItems={preselectedItems}
        clientId={clientId}
      />
    </>
  );
}
