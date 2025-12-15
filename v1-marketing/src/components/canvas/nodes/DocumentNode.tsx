import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileText, Download, Folder, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockHoverActions } from "./BlockHoverActions";
import { InstructionsBalloon } from "./InstructionsBalloon";

interface DocumentNodeData {
  file_path?: string;
  title?: string;
  content?: string;
  instruction_prompt?: string;
  metadata?: {
    file_size?: number;
    mime_type?: string;
  };
  selected?: boolean;
  isGroupChild?: boolean;
  parentGroupId?: string;
  blockId?: string;
  onUnlinkFromGroup?: (blockId: string) => void;
  onEdit?: () => void;
}

interface DocumentNodeProps {
  data: DocumentNodeData;
  selected: boolean;
}

export const DocumentNode = memo(({ data, selected }: DocumentNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <NodeResizer
        minWidth={250}
        minHeight={150}
        isVisible={selected}
        lineClassName="border-primary border-2"
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      <Card
        className={cn(
          "p-0 bg-card transition-all group relative flex flex-col",
          selected ? "ring-2 ring-primary shadow-lg" : "shadow-md",
          data.isGroupChild && "opacity-90 border-2 border-accent/40 shadow-sm"
        )}
        style={{ width: "100%", height: "100%" }}
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
            downloadUrl={data.file_path}
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
          {/* Show PDF preview if it's a PDF file */}
          {data.file_path?.toLowerCase().endsWith('.pdf') ? (
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-foreground line-clamp-1">
                    {data.title || "Document"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(data.metadata?.file_size)}
                  </p>
                </div>
              </div>
              <div 
                className="flex-1 min-h-[150px] rounded-lg border bg-muted overflow-hidden"
                onWheel={(e) => e.stopPropagation()}
              >
                <iframe 
                  src={data.file_path} 
                  className="w-full h-full min-h-[150px]"
                  title={data.title}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {data.title || "Document"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(data.metadata?.file_size)}
                  </p>
                  {data.metadata?.mime_type && (
                    <p className="text-xs text-muted-foreground">
                      {data.metadata.mime_type}
                    </p>
                  )}
                </div>
              </div>
              {data.content && (
                <div className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {data.content}
                </div>
              )}
            </>
          )}
          {data.file_path && (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                window.open(data.file_path, "_blank");
              }}
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          )}
        </div>
        {data.blockId && (
          <InstructionsBalloon
            blockId={data.blockId}
            instructions={data.instruction_prompt}
            placeholder="e.g., Focus on data insights, Use as reference material..."
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

DocumentNode.displayName = "DocumentNode";
