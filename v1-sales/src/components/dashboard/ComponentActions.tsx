import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComponentActionsProps {
  onCopy: () => void;
  onDelete: () => void;
}

export const ComponentActions = ({ onCopy, onDelete }: ComponentActionsProps) => {
  return (
    <div className="absolute -top-10 right-0 flex gap-1 bg-background border rounded-md shadow-lg p-1 z-50">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
      >
        <Copy size={14} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
};
