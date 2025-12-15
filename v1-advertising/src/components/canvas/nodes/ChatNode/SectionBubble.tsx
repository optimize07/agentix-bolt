import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowRight } from "lucide-react";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { ParsedSection } from "./sectionParser";
import { ItemCard } from "./ItemCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConnectedCreativeNode {
  id: string;
  title?: string;
}

interface SectionBubbleProps {
  section: ParsedSection;
  onCopy: (content: string) => void;
  onPushToCreative?: (content: string, nodeId?: string) => void;
  onRegenerate?: (sectionId: string) => void;
  connectedCreativeNodes?: ConnectedCreativeNode[];
}

const sectionTypeConfig = {
  'intro': { label: 'Intro', color: 'bg-muted' },
  'ad-concept': { label: 'Ad Concept', color: 'bg-primary/10' },
  'headline-variants': { label: 'Headlines', color: 'bg-accent/10' },
  'copy': { label: 'Copy', color: 'bg-secondary/10' },
  'generic': { label: 'Section', color: 'bg-muted' }
};

export const SectionBubble = memo(({
  section,
  onCopy,
  onPushToCreative,
  onRegenerate,
  connectedCreativeNodes = []
}: SectionBubbleProps) => {
  const config = sectionTypeConfig[section.type];
  const hasMultipleCreativeNodes = connectedCreativeNodes.length > 1;
  const hasSingleCreativeNode = connectedCreativeNodes.length === 1;
  const hasItems = section.items && section.items.length > 0;
  
  return (
    <Card className={`group/section relative p-3 ${config.color} border-border/50`}>
      {/* Action buttons on hover - only show if no individual items */}
      {!hasItems && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6 shadow-sm"
            onClick={() => onCopy(section.content)}
            title="Copy section"
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          {hasSingleCreativeNode && onPushToCreative && (
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 shadow-sm"
              onClick={() => onPushToCreative(section.content, connectedCreativeNodes[0].id)}
              title={`Push to ${connectedCreativeNodes[0].title || 'creative node'}`}
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
          
          {hasMultipleCreativeNodes && onPushToCreative && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 shadow-sm"
                  title="Push to creative node"
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {connectedCreativeNodes.map((node) => (
                  <DropdownMenuItem
                    key={node.id}
                    onClick={() => onPushToCreative(section.content, node.id)}
                  >
                    Push to {node.title || 'Creative Node'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      
      {/* Header with title and type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {section.title && (
            <h4 className="font-semibold text-sm mb-1">
              {section.title}
            </h4>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {config.label}
          </Badge>
        </div>
      </div>
      
      {/* Ad metadata if available */}
      {section.metadata && Object.keys(section.metadata).length > 0 && (
        <div className="mb-2 p-2 bg-background/50 rounded text-xs space-y-1 border border-border/30">
          {section.metadata.angle && (
            <div><span className="font-medium text-muted-foreground">Angle:</span> {section.metadata.angle}</div>
          )}
          {section.metadata.headline && (
            <div><span className="font-medium text-muted-foreground">Headline:</span> {section.metadata.headline}</div>
          )}
          {section.metadata.primaryText && (
            <div><span className="font-medium text-muted-foreground">Primary:</span> {section.metadata.primaryText}</div>
          )}
          {section.metadata.cta && (
            <div><span className="font-medium text-muted-foreground">CTA:</span> {section.metadata.cta}</div>
          )}
        </div>
      )}
      
      {/* Section content - either items grid or markdown */}
      {hasItems ? (
        <div className="space-y-2">
          {section.items!.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onCopy={onCopy}
              onPushToCreative={onPushToCreative}
              connectedCreativeNodes={connectedCreativeNodes}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm">
          <MarkdownMessage content={section.content} />
        </div>
      )}
    </Card>
  );
});

SectionBubble.displayName = "SectionBubble";
