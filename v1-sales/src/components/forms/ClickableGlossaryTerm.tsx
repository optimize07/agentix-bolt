import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
  category: string;
}

interface ClickableGlossaryTermProps {
  term: GlossaryTerm;
  isUsed: boolean;
  onAdd: (term: GlossaryTerm) => void;
}

export const ClickableGlossaryTerm = ({ term, isUsed, onAdd }: ClickableGlossaryTermProps) => {
  return (
    <div
      onClick={() => !isUsed && onAdd(term)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border bg-card transition-all",
        isUsed 
          ? "opacity-50 bg-muted cursor-not-allowed" 
          : "hover:bg-accent hover:border-accent-foreground cursor-pointer hover:shadow-sm"
      )}
    >
      {isUsed ? (
        <Check className="w-4 h-4 text-primary flex-shrink-0" />
      ) : (
        <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{term.default_label}</p>
        <p className="text-xs text-muted-foreground truncate">{term.term_key}</p>
      </div>
    </div>
  );
};
