import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  FileCode,
  Video,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  MessageSquare,
  Trash2,
  Copy,
  Folder,
  Brain,
  Sparkles,
} from "lucide-react";

interface CanvasToolbarProps {
  onAddBlock: (type: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedCount?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onClearSelection?: () => void;
  onOpenBrain?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
}

export function CanvasToolbar({
  onAddBlock,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  selectedCount = 0,
  onDelete,
  onDuplicate,
  onGroup,
  onClearSelection,
  onOpenBrain,
  onZoomIn,
  onZoomOut,
  onFitView,
}: CanvasToolbarProps) {
  const blockTypes = [
    { type: "image", icon: ImageIcon, label: "Image", description: "Add images and screenshots" },
    { type: "text", icon: FileText, label: "Text", description: "Add text notes and content" },
    { type: "url", icon: LinkIcon, label: "URL", description: "Embed links and websites" },
    { type: "document", icon: FileCode, label: "Doc", description: "Add documents and files" },
    { type: "video", icon: Video, label: "Video", description: "Embed video content" },
    { type: "creative", icon: Sparkles, label: "Creative", description: "AI creative factory with adaptive display" },
  ];

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/block-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <TooltipProvider>
      <Card className="absolute top-4 left-4 z-10 p-2 shadow-lg bg-card/95 backdrop-blur-sm border-border">
        <div className="flex flex-col gap-2">
          {/* Block Types */}
          <div className="flex flex-col gap-1">
            {blockTypes.map(({ type, icon: Icon, label, description }) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9 cursor-grab active:cursor-grabbing"
                    onClick={() => onAddBlock(type)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-muted-foreground">{description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator />

          {/* History Controls */}
          {(onUndo || onRedo) && (
            <>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!canUndo}
                  onClick={onUndo}
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!canRedo}
                  onClick={onRedo}
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* Brain & Chat */}
          {onOpenBrain && (
            <>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 cursor-grab active:cursor-grabbing"
                      onClick={onOpenBrain}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/brain-drop", "brain");
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-muted-foreground">Access your central knowledge base</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 cursor-grab active:cursor-grabbing"
                      onClick={() => onAddBlock("chat")}
                      draggable
                      onDragStart={(e) => handleDragStart(e, "chat")}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-muted-foreground">Add AI chat block</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Separator />
            </>
          )}

          {/* Zoom Controls & Group - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onZoomIn}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-muted-foreground">Zoom in</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onZoomOut}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-muted-foreground">Zoom out</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onFitView}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-muted-foreground">Fit view</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 cursor-grab active:cursor-grabbing"
                  onClick={() => onAddBlock("group")}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "group")}
                >
                  <Folder className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-muted-foreground">Add logic block to organize and program groups</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Bulk Actions - Only when nodes are selected */}
          {selectedCount > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-1">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {selectedCount} selected
                </div>
                
                <div className="grid grid-cols-2 gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={onDuplicate}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-muted-foreground">Duplicate selection</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-muted-foreground">Delete selection</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}



