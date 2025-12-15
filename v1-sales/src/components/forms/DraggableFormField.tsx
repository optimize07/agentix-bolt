import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FormField {
  id: string;
  glossary_term_id?: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  is_required: boolean;
  placeholder?: string;
}

interface DraggableFormFieldProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  isDragOverlay?: boolean;
}

export const DraggableFormField = ({ field, onUpdate, onDelete, isDragOverlay = false }: DraggableFormFieldProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: field.id,
    disabled: isDragOverlay 
  });

  if (isDragOverlay) {
    return (
      <Card className="p-4 bg-card border-2 border-primary shadow-2xl w-[400px] cursor-grabbing rotate-2 scale-105">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{field.field_label}</p>
            <p className="text-xs text-muted-foreground capitalize">{field.field_type}</p>
          </div>
        </div>
      </Card>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 bg-card border">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-6">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Field Label</Label>
              <Input
                value={field.field_label}
                onChange={(e) => onUpdate({ field_label: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Field Type</Label>
              <Select
                value={field.field_type}
                onValueChange={(value: any) => onUpdate({ field_type: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text..."
              className="h-9"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.is_required}
              onCheckedChange={(checked) => onUpdate({ is_required: !!checked })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-sm font-normal">
              Required field
            </Label>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="mt-4 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
