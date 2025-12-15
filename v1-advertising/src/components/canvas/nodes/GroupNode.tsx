import React, { useState, memo, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { Folder, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface GroupNodeData {
  blockId: string;
  title?: string;
  color?: string;
  childCount?: number;
  instructions?: string;
  boardId?: string;
  onUpdateNodeData?: (nodeId: string, data: Partial<any>) => void;
}

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

export const GroupNode = memo(({ data, selected }: GroupNodeProps) => {
  const [localInstructions, setLocalInstructions] = useState(data.instructions || "");
  const [localTitle, setLocalTitle] = useState(data.title || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasInstructions = Boolean(data.instructions?.trim());
  const bgColor = data.color;

  useEffect(() => {
    setLocalTitle(data.title || "");
  }, [data.title]);

  const handleInstructionsBlur = useCallback(async () => {
    if (localInstructions !== data.instructions) {
      await supabase
        .from("canvas_blocks")
        .update({ instruction_prompt: localInstructions })
        .eq("id", data.blockId);
    }
  }, [localInstructions, data.instructions, data.blockId]);

  const handleTitleBlur = useCallback(async () => {
    setIsEditingTitle(false);
    if (localTitle !== data.title) {
      await supabase
        .from("canvas_blocks")
        .update({ title: localTitle })
        .eq("id", data.blockId);
      
      // Update React Flow node data immediately
      data.onUpdateNodeData?.(data.blockId, { title: localTitle });
    }
  }, [localTitle, data.title, data.blockId, data.onUpdateNodeData]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setLocalTitle(data.title || "");
      setIsEditingTitle(false);
    }
  }, [handleTitleBlur, data.title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="relative w-full h-full">
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={selected}
        lineClassName="border-primary border-2"
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      
      <Card
        className={cn(
          "w-full h-full flex flex-col border-2 border-dashed transition-all",
          selected && "ring-2 ring-primary ring-offset-2",
          hasInstructions && "border-accent shadow-lg shadow-accent/20",
          isDragOver && "ring-4 ring-primary ring-offset-2 bg-primary/10 border-primary",
          bgColor || "bg-card/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Drop overlay indicator */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 z-10 pointer-events-none rounded-lg">
            <span className="text-primary font-semibold text-lg">Drop to add to group</span>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border/50 bg-card/80">
          <Folder className="h-4 w-4 text-primary flex-shrink-0" />
          {isEditingTitle ? (
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="h-6 text-sm font-semibold px-1 py-0 flex-1 nodrag"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span 
              className="font-semibold text-sm truncate cursor-pointer hover:text-primary"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Double-click to rename"
            >
              {data.title || "Untitled Group"}
            </span>
          )}
          {hasInstructions && (
            <Sparkles className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          )}
          {data.childCount !== undefined && data.childCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {data.childCount} items
            </span>
          )}
        </div>

        {/* Content Area - Children render here via ReactFlow parentNode */}
        <div className="flex-1 p-4 min-h-[100px]">
          {/* ReactFlow will render child nodes here automatically */}
        </div>

        {/* Sticky Note Instructions at Bottom */}
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-accent flex-shrink-0 mt-2" />
            <Textarea
              value={localInstructions}
              onChange={(e) => setLocalInstructions(e.target.value)}
              onBlur={handleInstructionsBlur}
              onWheel={(e) => e.stopPropagation()}
              placeholder="Add instructions... (e.g., Compare Q3 data with budget)"
              className="min-h-[60px] resize-none text-xs bg-background/50 border-accent/20 focus:border-accent nodrag"
            />
          </div>
        </div>
      </Card>

      {/* Right Connection Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          right: '-12px',
          width: '24px',
          height: '24px',
          background: 'hsl(var(--accent))',
          border: '2px solid hsl(var(--accent-foreground))',
          zIndex: 50,
        }}
        className="hover:scale-125 transition-transform cursor-grab"
      />
    </div>
  );
});

GroupNode.displayName = "GroupNode";
