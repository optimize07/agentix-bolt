import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { Video, Play, Folder, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockHoverActions } from "./BlockHoverActions";
import { InstructionsBalloon } from "./InstructionsBalloon";

interface VideoNodeData {
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

interface VideoNodeProps {
  data: VideoNodeData;
  selected: boolean;
}

export const VideoNode = memo(({ data, selected }: VideoNodeProps) => {
  const videoUrl = data.url || data.file_path;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <NodeResizer
        minWidth={280}
        minHeight={200}
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
          downloadUrl={videoUrl}
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
        {videoUrl ? (
          <div className="relative w-full h-full group">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-foreground ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Video className="w-12 h-12 text-muted-foreground" />
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
              placeholder="e.g., Use as inspiration, Focus on the hook style..."
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

VideoNode.displayName = "VideoNode";
