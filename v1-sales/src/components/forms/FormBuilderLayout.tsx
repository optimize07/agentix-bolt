import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { GlossaryPanel } from "./GlossaryPanel";
import { FormCanvas } from "./FormCanvas";
import { RoleAssignmentPanel } from "./RoleAssignmentPanel";
import { useToast } from "@/hooks/use-toast";

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
  category: string;
}

interface FormField {
  id: string;
  glossary_term_id?: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  is_required: boolean;
  placeholder?: string;
  display_order: number;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface FormBuilderLayoutProps {
  glossaryTerms: GlossaryTerm[];
  fields: FormField[];
  roles: Role[];
  selectedRoleIds: string[];
  onFieldsChange: (fields: FormField[]) => void;
  onRolesChange: (roleIds: string[]) => void;
}

const suggestFieldType = (termKey: string, category?: string): FormField['field_type'] => {
  const key = termKey.toLowerCase();
  const cat = category?.toLowerCase() || '';
  
  // Date/Time fields
  if (key.includes('date') || key.includes('time') || key.includes('scheduled') || key.includes('deadline')) {
    return 'date';
  }
  
  // Number fields
  if (key.includes('revenue') || key.includes('price') || key.includes('amount') || 
      key.includes('calls') || key.includes('sets') || key.includes('count') || 
      key.includes('number') || key.includes('quantity') || key.includes('total') ||
      cat.includes('metric') || cat.includes('kpi')) {
    return 'number';
  }
  
  // Textarea fields
  if (key.includes('description') || key.includes('notes') || key.includes('comments') || 
      key.includes('feedback') || key.includes('message')) {
    return 'textarea';
  }
  
  // Select fields
  if (key.includes('role') || key.includes('status') || key.includes('type') || 
      key.includes('category') || key.includes('stage') || key.includes('priority')) {
    return 'select';
  }
  
  // Checkbox fields
  if (key.includes('is_') || key.includes('has_') || key.includes('completed') || 
      key.includes('active') || key.includes('enabled')) {
    return 'checkbox';
  }
  
  return 'text';
};

const generatePlaceholder = (fieldType: FormField['field_type'], label: string): string => {
  switch (fieldType) {
    case 'number':
      return '0';
    case 'date':
      return 'Select date...';
    case 'select':
      return 'Choose an option...';
    case 'textarea':
      return `Enter ${label.toLowerCase()} details...`;
    case 'checkbox':
      return '';
    case 'text':
    default:
      if (label.toLowerCase().includes('email')) return 'name@example.com';
      if (label.toLowerCase().includes('phone')) return '(555) 123-4567';
      if (label.toLowerCase().includes('url') || label.toLowerCase().includes('website')) return 'https://example.com';
      return `Enter ${label.toLowerCase()}...`;
  }
};

export const FormBuilderLayout = ({
  glossaryTerms,
  fields,
  roles,
  selectedRoleIds,
  onFieldsChange,
  onRolesChange,
}: FormBuilderLayoutProps) => {
  const { toast } = useToast();

  const handleAddTerm = (term: GlossaryTerm) => {
    const fieldType = suggestFieldType(term.term_key, term.category);
    const newField: FormField = {
      id: crypto.randomUUID(),
      glossary_term_id: term.id,
      field_label: term.default_label,
      field_type: fieldType,
      is_required: false,
      placeholder: generatePlaceholder(fieldType, term.default_label),
      display_order: fields.length,
    };
    onFieldsChange([...fields, newField]);
    toast({
      title: "Field added",
      description: `${term.default_label} has been added to your form`,
    });
  };

  const handleReorderFields = (oldIndex: number, newIndex: number) => {
    const reordered = arrayMove(fields, oldIndex, newIndex).map((f, idx) => ({
      ...f,
      display_order: idx,
    }));
    onFieldsChange(reordered);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    onFieldsChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteField = (id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id).map((f, idx) => ({
      ...f,
      display_order: idx,
    })));
  };

  const handleToggleRole = (roleId: string, checked: boolean) => {
    if (checked) {
      onRolesChange([...selectedRoleIds, roleId]);
    } else {
      onRolesChange(selectedRoleIds.filter(id => id !== roleId));
    }
  };

  const usedTermIds = fields
    .map(f => f.glossary_term_id)
    .filter((id): id is string => id !== undefined);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-300px)] min-h-[500px] rounded-lg border">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
        <GlossaryPanel 
          glossaryTerms={glossaryTerms} 
          usedTermIds={usedTermIds}
          onAddTerm={handleAddTerm}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={35}>
        <FormCanvas
          fields={fields}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
          onReorderFields={handleReorderFields}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
        <RoleAssignmentPanel
          roles={roles}
          selectedRoleIds={selectedRoleIds}
          onToggleRole={handleToggleRole}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
