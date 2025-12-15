import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableFormField } from "./DraggableFormField";
import { Plus } from "lucide-react";

interface FormField {
  id: string;
  glossary_term_id?: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  is_required: boolean;
  placeholder?: string;
}

interface FormCanvasProps {
  fields: FormField[];
  onUpdateField: (id: string, updates: Partial<FormField>) => void;
  onDeleteField: (id: string) => void;
  onReorderFields: (oldIndex: number, newIndex: number) => void;
}

export const FormCanvas = ({ fields, onUpdateField, onDeleteField, onReorderFields }: FormCanvasProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderFields(oldIndex, newIndex);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Form Builder</h3>
        <p className="text-sm text-muted-foreground">
          Click glossary terms to add fields
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {fields.length === 0 ? (
          <div className="h-full min-h-[400px] border-2 border-dashed rounded-lg flex items-center justify-center border-muted-foreground/20">
            <div className="text-center space-y-2">
              <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                No fields yet
              </p>
              <p className="text-xs text-muted-foreground">
                Click glossary terms on the left to add fields
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {fields.map((field) => (
                  <DraggableFormField
                    key={field.id}
                    field={field}
                    onUpdate={(updates) => onUpdateField(field.id, updates)}
                    onDelete={() => onDeleteField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
