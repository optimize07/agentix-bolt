import React, { useState, useCallback, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Folder, ChevronDown, ChevronRight, FileText, Image, Link2, FileType, Video, Brain, MessageCircle, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CanvasNodeData, CanvasBlock } from '@/types/canvas';
import BaseNode from './BaseNode';

const GROUP_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
];

const typeIcons: Record<string, React.ElementType> = {
  text: FileText,
  image: Image,
  url: Link2,
  document: FileType,
  video: Video,
  brain: Brain,
  chat: MessageCircle,
  creative: Sparkles,
};

const GroupNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData & {
    childBlocks?: CanvasBlock[];
    onRemoveChild?: (childId: string) => void;
  };
  
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Group');
  const [isExpanded, setIsExpanded] = useState(true);
  const [color, setColor] = useState(nodeData.color || GROUP_COLORS[0].value);

  // Get child blocks from nodeData (passed from Canvas2)
  const childBlocks = useMemo(() => nodeData.childBlocks || [], [nodeData.childBlocks]);
  const childCount = childBlocks.length;

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor);
    nodeData.onContentChange?.(newColor);
  }, [nodeData]);

  const handleRemoveChild = useCallback((childId: string) => {
    nodeData.onRemoveChild?.(childId);
  }, [nodeData]);

  // Get icon for block type
  const getBlockIcon = (type: string) => {
    const Icon = typeIcons[type] || FileText;
    return <Icon className="h-3 w-3" />;
  };

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={color}
      showSourceHandle={true}
      showTargetHandle={true}
      className="min-w-[300px]"
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
          <Folder className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate"
            placeholder="Group name..."
          />
          {childCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {childCount} items
            </Badge>
          )}
        </div>
      }
    >
      {isExpanded && (
        <div className="space-y-3">
          {/* Color selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Color:</span>
            <div className="flex gap-1">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c.value ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Child blocks list */}
          {childCount > 0 ? (
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {childBlocks.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <span className="text-muted-foreground">
                      {getBlockIcon(child.type)}
                    </span>
                    <span className="text-xs font-medium flex-1 truncate">
                      {child.title || child.type}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveChild(child.id)}
                      title="Remove from group"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div
              className="min-h-[80px] rounded-md border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: color + '40', backgroundColor: color + '10' }}
            >
              <p className="text-xs text-muted-foreground text-center px-4">
                Connect nodes to this group.
                <br />
                All content flows as one unit.
              </p>
            </div>
          )}

          {/* Context summary for AI */}
          {childCount > 0 && (
            <div className="text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
              <span className="font-medium">AI Context:</span> {childCount} blocks will be included when connected to a Chat node
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
};

export default GroupNode;
