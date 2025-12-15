import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Folder, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockHoverActions } from "./BlockHoverActions";
import { InstructionsBalloon } from "./InstructionsBalloon";

interface ImageNodeData {
  url?: string;
  file_path?: string;
  title?: string;
  instruction_prompt?: string;
  selected?: boolean;
  isGroupChild?: boolean;
  parentGroupId?: string;
  blockId?: string;
  onUnlinkFromGroup?: (blockId: string) => void;
  onEdit?: () => void;
}

interface ImageNodeProps {
  data: ImageNodeData;
  selected: boolean;
}

export const ImageNode = memo(({ data, selected }: ImageNodeProps) => {
  const imageUrl = data.url || data.file_path;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={150}
        isVisible={selected}
        lineClassName="border-primary border-2"
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      <Card
        className={cn(
          "overflow-hidden bg-card transition-all group relative",
          selected ? "ring-2 ring-primary shadow-lg" : "shadow-md",
          data.isGroupChild && "opacity-90 border-2 border-accent/40 shadow-sm"
        )}
        style={{ width: "100%", height: "100%" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={(e) => e.stopPropagation()}
      >
        <BlockHoverActions
          isHovered={isHovered}
          onEdit={data.onEdit}
          downloadUrl={imageUrl}
          showCopy={false}
          showDownload={true}
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
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={data.title || "Image"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 min-h-[44px] flex flex-col justify-end">
          {data.title && (
            <div className="px-3 py-2 text-sm font-medium text-foreground">
              {data.title}
            </div>
          )}
          {data.blockId && (
            <InstructionsBalloon
              blockId={data.blockId}
              instructions={data.instruction_prompt}
              placeholder="e.g., Use as inspiration, Match this style..."
              compact
            />
          )}
        </div>
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

ImageNode.displayName = "ImageNode";
