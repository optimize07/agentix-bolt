import { CanvasComponent } from "@/types/tab";
import StatsCard from "@/components/StatsCard";
import { Plus, Activity, Copy, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatsRowProps {
  statsCards: CanvasComponent[];
  onAddStatsCard?: () => void;
  onSelectComponent?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  onDuplicateComponent?: (id: string) => void;
  onAskAi?: (id: string) => void;
  selectedComponentId?: string | null;
  isEditMode?: boolean;
  sheetData?: any[][];
}

export const StatsRow = ({
  statsCards,
  onAddStatsCard,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onAskAi,
  selectedComponentId,
  isEditMode = false,
  sheetData,
}: StatsRowProps) => {
  const maxStatsCards = 5;
  const canAddMore = statsCards.length < maxStatsCards;

  if (statsCards.length === 0 && !isEditMode) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((component) => (
          <div
            key={component.id}
            className={`relative group transition-all rounded-xl ${
              isEditMode
                ? selectedComponentId === component.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 ring-offset-background cursor-pointer"
                : ""
            }`}
            onClick={() => isEditMode && onSelectComponent?.(component.id)}
          >
            {isEditMode && (
              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border rounded-md shadow-lg p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAi?.(component.id);
                  }}
                >
                  <Sparkles size={14} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateComponent?.(component.id);
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
                    onDeleteComponent?.(component.id);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            <StatsCard
              title={component.config.title || ""}
              value={component.config.value || "0"}
              change={component.config.change}
              comparison=""
              icon={Activity}
              trend={component.config.trend}
              formula={component.formula}
              sheetData={sheetData}
              component={component}
            />
          </div>
        ))}
        
        {isEditMode && canAddMore && (
          <Button
            variant="outline"
            className="h-full min-h-[120px] border-dashed hover:border-primary hover:bg-primary/5"
            onClick={onAddStatsCard}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Stats Card</span>
              <span className="text-xs text-muted-foreground">
                ({statsCards.length}/{maxStatsCards})
              </span>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};
