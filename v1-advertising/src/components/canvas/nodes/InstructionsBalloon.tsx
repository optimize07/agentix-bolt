import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InstructionsBalloonProps {
  blockId: string;
  instructions?: string;
  onInstructionsChange?: (instructions: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function InstructionsBalloon({
  blockId,
  instructions = "",
  onInstructionsChange,
  placeholder = "Add instructions for how AI should use this block...",
  compact = false,
}: InstructionsBalloonProps) {
  const [isExpanded, setIsExpanded] = useState(!!instructions);
  const [localValue, setLocalValue] = useState(instructions);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("canvas_blocks")
        .update({ instruction_prompt: value || null })
        .eq("id", blockId);

      if (error) throw error;

      onInstructionsChange?.(value);
      if (value) {
        toast.success("Instructions saved");
      }
    } catch (error) {
      console.error("Failed to save instructions:", error);
      toast.error("Failed to save instructions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-border/50 mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all rounded-sm",
          instructions 
            ? "bg-accent/20 text-foreground hover:bg-accent/30" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
        )}
      >
        <Sparkles className={cn("h-3.5 w-3.5", instructions && "text-accent")} />
        <span className="flex-1 text-left font-medium">
          {instructions ? "Edit instructions" : "Add instructions"}
        </span>
        {instructions && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-accent-foreground">
            ✓
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              if (localValue !== instructions) {
                handleSave(localValue);
              }
            }}
            placeholder={placeholder}
            className="min-h-[60px] text-xs resize-none"
            disabled={isSaving}
          />
          {instructions && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              AI will consider these instructions
            </p>
          )}
        </div>
      )}
    </div>
  );
}
