import React, { memo } from 'react';
import { Copy, Target, FileText, PlayCircle, Lightbulb, ClipboardList, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ParsedItem {
  id: string;
  label: string;
  content: string;
  type: 'headline' | 'copy' | 'cta' | 'angle' | 'description' | 'generic';
}

interface ConnectedCreativeNode {
  id: string;
  title?: string;
}

interface ItemCardProps {
  item: ParsedItem;
  onCopy: (content: string) => void;
  onPushToCreative?: (content: string, nodeId: string) => void;
  connectedCreativeNodes?: ConnectedCreativeNode[];
}

const itemTypeConfig: Record<ParsedItem['type'], { icon: React.ElementType; label: string; className: string }> = {
  headline: { icon: Target, label: 'Headline', className: 'bg-primary/20 text-primary border-primary/30' },
  copy: { icon: FileText, label: 'Copy', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  cta: { icon: PlayCircle, label: 'CTA', className: 'bg-accent/20 text-accent border-accent/30' },
  angle: { icon: Lightbulb, label: 'Angle', className: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
  description: { icon: ClipboardList, label: 'Description', className: 'bg-muted text-muted-foreground border-border' },
  generic: { icon: FileText, label: 'Item', className: 'bg-muted text-muted-foreground border-border' },
};

export const ItemCard = memo(function ItemCard({
  item,
  onCopy,
  onPushToCreative,
  connectedCreativeNodes = [],
}: ItemCardProps) {
  const config = itemTypeConfig[item.type];
  const Icon = config.icon;
  const hasCreativeNodes = connectedCreativeNodes.length > 0;

  const handlePush = (nodeId: string) => {
    if (onPushToCreative) {
      onPushToCreative(item.content, nodeId);
    }
  };

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
      {/* Type Icon */}
      <div className={cn('flex-shrink-0 p-1.5 rounded-md border', config.className)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.className)}>
            {config.label}
          </Badge>
          {item.label && item.label !== config.label && (
            <span className="text-xs text-muted-foreground">{item.label}</span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCopy(item.content)}
          title="Copy"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>

        {hasCreativeNodes && onPushToCreative && (
          connectedCreativeNodes.length === 1 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePush(connectedCreativeNodes[0].id)}
              title={`Push to ${connectedCreativeNodes[0].title || 'Creative'}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Push to Creative">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {connectedCreativeNodes.map((node) => (
                  <DropdownMenuItem key={node.id} onClick={() => handlePush(node.id)}>
                    {node.title || `Creative ${node.id.slice(0, 6)}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
      </div>
    </div>
  );
});
