import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileText, Folder, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockHoverActions } from "./BlockHoverActions";
import { InstructionsBalloon } from "./InstructionsBalloon";

interface TextNodeData {
  content?: string;
  title?: string;
  color?: string;
  instruction_prompt?: string;
  selected?: boolean;
  isGroupChild?: boolean;
  parentGroupId?: string;
  blockId?: string;
  onUnlinkFromGroup?: (blockId: string) => void;
  onEdit?: () => void;
}

interface TextNodeProps {
  data: TextNodeData;
  selected: boolean;
}

export const TextNode = memo(({ data, selected }: TextNodeProps) => {
  const bgColor = data.color || "hsl(var(--card))";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-primary border-2"
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      <Card
        className={cn(
          "p-0 transition-all group relative flex flex-col",
          selected ? "ring-2 ring-primary shadow-lg" : "shadow-md",
          data.isGroupChild && "opacity-90 border-2 border-accent/40 shadow-sm"
        )}
        style={{ 
          width: "100%", 
          height: "100%",
          backgroundColor: bgColor
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={(e) => e.stopPropagation()}
      >
        <div 
          className={cn(
            "flex-1 p-4 transition-all",
            isHovered ? "overflow-auto block-scroll" : "overflow-hidden"
          )}
        >
          <BlockHoverActions
            isHovered={isHovered}
            onEdit={data.onEdit}
            content={data.content}
            showDownload={false}
          />
          {data.isGroupChild && (
            <div className="absolute top-1 left-1 z-10 flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onUnlinkFromGroup?.(data.blockId!);
                }}
              >
                <Unlink className="w-3 h-3" />
              </Button>
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                <Folder className="w-3 h-3 text-accent" />
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            {data.title && (
              <h3 className="font-semibold text-sm text-foreground">{data.title}</h3>
            )}
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.content || "Empty text block"}
          </div>
        </div>
        {data.blockId && (
          <InstructionsBalloon
            blockId={data.blockId}
            instructions={data.instruction_prompt}
            placeholder="e.g., Use as inspiration only, This is my competitor's ad..."
          />
        )}
      </Card>
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
    </>
  );
});

TextNode.displayName = "TextNode";
