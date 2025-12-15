import { LayoutGrid, Plus, GripVertical, Trash2, Copy, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tab } from "@/types/tab";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onReorderTabs: (tabs: Tab[]) => void;
  onRenameTab: (id: string) => void;
  onDuplicateTab: (id: string) => void;
  onDeleteTab: (id: string) => void;
  isEditMode?: boolean;
}

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  getLabel: (key: string) => string;
}

const SortableTab = ({ tab, isActive, isEditMode, onSelect, onRename, onDuplicate, onDelete, getLabel }: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = LayoutGrid;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={{
            ...style,
            backgroundColor: isActive ? 'var(--tab-active-bg)' : 'transparent',
            color: isActive ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
            borderBottomColor: isActive ? 'var(--tab-active-border)' : 'transparent',
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer transition-all duration-200 ease-out",
            !isActive && "hover:-translate-y-0.5",
            isDragging && "z-50 scale-105 shadow-lg"
          )}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'var(--tab-hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onClick={onSelect}
        >
          {isEditMode && (
            <GripVertical
              size={16}
              className="text-muted-foreground cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            />
          )}
          <span className="text-sm font-medium whitespace-nowrap">{tab.name}</span>
          {isEditMode && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 ml-2 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X size={12} className="text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Edit2 size={14} className="mr-2" />
          {getLabel('action.rename')}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy size={14} className="mr-2" />
          {getLabel('action.duplicate')}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 size={14} className="mr-2" />
          {getLabel('action.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const TabBar = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onReorderTabs,
  onRenameTab,
  onDuplicateTab,
  onDeleteTab,
  isEditMode = false,
}: TabBarProps) => {
  const { getLabel } = useOrganization();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over.id);
      
      const reordered = arrayMove(tabs, oldIndex, newIndex).map((tab, index) => ({
        ...tab,
        order: index,
      }));
      
      onReorderTabs(reordered);
    }
  };

  return (
    <div 
      className="sticky top-0 z-40 shadow-sm"
      style={{ 
        backgroundColor: 'var(--tab-bar-bg)',
        borderBottom: `var(--divider-width) var(--divider-style) var(--divider-color)`
      }}
    >
      <div className="flex items-center overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                isEditMode={isEditMode}
                onSelect={() => onSelectTab(tab.id)}
                onRename={() => onRenameTab(tab.id)}
                onDuplicate={() => onDuplicateTab(tab.id)}
                onDelete={() => onDeleteTab(tab.id)}
                getLabel={getLabel}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddTab}
          className="ml-2 shrink-0"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};
