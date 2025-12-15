import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { ExternalLink, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BlockHoverActions } from "./BlockHoverActions";
import { InstructionsBalloon } from "./InstructionsBalloon";

interface UrlNodeData {
  url?: string;
  title?: string;
  content?: string;
  instruction_prompt?: string;
  blockId?: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    markdown?: string;
    hasFirecrawl?: boolean;
  };
  selected?: boolean;
  onEdit?: () => void;
}

interface UrlNodeProps {
  data: UrlNodeData;
  selected: boolean;
}

export const UrlNode = memo(({ data, selected }: UrlNodeProps) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const previewImage = data.metadata?.image;
  const displayTitle = data.title || data.metadata?.title || "URL";
  const displayDescription = data.content || data.metadata?.description;
  const markdownContent = data.content || data.metadata?.markdown;
  const hasFirecrawl = data.metadata?.hasFirecrawl;

  return (
    <>
      <NodeResizer
        minWidth={280}
        minHeight={120}
        isVisible={selected}
        lineClassName="border-primary border-2"
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      <Card
        className={cn(
          "p-0 bg-card transition-all group relative flex flex-col",
          selected ? "ring-2 ring-primary shadow-lg" : "shadow-md"
        )}
        style={{ width: "100%", height: "100%" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={(e) => e.stopPropagation()}
      >
        <div 
          className={cn(
            "flex-1 transition-all",
            isHovered ? "overflow-auto block-scroll" : "overflow-hidden"
          )}
        >
          <BlockHoverActions
            isHovered={isHovered}
            onEdit={data.onEdit}
            content={displayDescription}
            showDownload={false}
          />
          {previewImage && !imageError && (
            <div className="w-full h-32 bg-muted overflow-hidden">
              <img
                src={previewImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                draggable={false}
              />
            </div>
          )}
          {(!previewImage || imageError) && (
            <div className="w-full h-32 bg-muted flex items-center justify-center">
              <Globe className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {displayTitle}
                </h3>
                {hasFirecrawl && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Firecrawl
                  </Badge>
                )}
              </div>
              {data.url && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(data.url, "_blank");
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
            {!isExpanded && displayDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {displayDescription}
              </p>
            )}
            {data.url && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {new URL(data.url).hostname}
              </p>
            )}
            {markdownContent && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide content
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    View content
                  </>
                )}
              </Button>
            )}
            {isExpanded && markdownContent && (
              <div className="mt-3 p-3 bg-muted rounded-md text-xs overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap font-mono text-foreground">
                  {markdownContent}
                </pre>
              </div>
            )}
          </div>
        </div>
        {data.blockId && (
          <InstructionsBalloon
            blockId={data.blockId}
            instructions={data.instruction_prompt}
            placeholder="e.g., Use landing page structure, Focus on their headlines..."
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

UrlNode.displayName = "UrlNode";
