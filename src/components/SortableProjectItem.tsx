import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, MoreVertical, Trash2, Edit, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortableProjectItemProps {
  board: any;
  stats: { drafts: number; ready: number };
  groups: any[];
  onDelete: (id: string) => void;
  onMoveToGroup: (boardId: string, groupSlug: string | null) => void;
  clientId?: string;
  department?: "marketing" | "advertising" | "operations" | "sales" | "strategy" | "financials";
}

export function SortableProjectItem({
  board,
  stats,
  groups,
  onDelete,
  onMoveToGroup,
  clientId,
  department,
}: SortableProjectItemProps) {
  const navigate = useNavigate();
  
  // Use correct route based on context
  const getProjectPath = (tab: string) => {
    if (clientId) {
      if (department === "marketing") {
        return `/client/${clientId}/marketing/projects/${board.id}/${tab}`;
      }
      if (department === "advertising") {
        return `/client/${clientId}/advertising/projects/${board.id}/${tab}`;
      }
      return `/client/${clientId}/projects/${board.id}/${tab}`;
    }
    return `/projects/${board.id}/${tab}`;
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isTopFive = board.group_name === "top5";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors group bg-card"
      onClick={() => navigate(getProjectPath("chat"))}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        <Target className="w-5 h-5 text-primary shrink-0" />
        
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{board.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {board.description || "No description"}
          </p>
          {board.goal && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3" />
              <span className="truncate">{board.goal}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {stats.drafts} Concepts
          </Badge>
          <Badge variant="default" className="text-xs">
            {stats.ready} Ready
          </Badge>
        </div>
        
        <span className="text-sm text-muted-foreground min-w-[80px] text-right">
          {board.default_platform}
        </span>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Move to Group
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {isTopFive ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToGroup(board.id, null);
                      }}
                    >
                      Remove from Top 5
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToGroup(board.id, "top5");
                      }}
                    >
                      Top 5
                    </DropdownMenuItem>
                  )}
                  {groups
                    .filter((g) => g.slug !== "top5")
                    .map((group) => (
                      <DropdownMenuItem
                        key={group.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToGroup(board.id, group.slug);
                        }}
                      >
                        {group.name}
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToGroup(board.id, null);
                    }}
                  >
                    No Group
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(getProjectPath("settings"));
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this project?")) {
                    onDelete(board.id);
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}



