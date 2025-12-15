import React, { useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CanvasNodeData } from '@/types/canvas';
import BaseNode from './BaseNode';

const TextNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localContent, setLocalContent] = useState(nodeData.content || '');
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Text Block');
  const [instructionPrompt, setInstructionPrompt] = useState(nodeData.instructionPrompt || '');

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    nodeData.onContentChange?.(e.target.value);
  }, [nodeData]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={nodeData.color}
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Title..."
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-5 w-5 flex-shrink-0 ${instructionPrompt ? 'text-amber-500' : 'text-muted-foreground'}`}
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-2">
                <label className="text-xs font-medium">AI Instructions</label>
                <Textarea
                  value={instructionPrompt}
                  onChange={(e) => setInstructionPrompt(e.target.value)}
                  placeholder="e.g., Use as inspiration only, analyze writing style..."
                  className="text-xs min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions tell the AI how to use this content.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <Textarea
        value={localContent}
        onChange={handleContentChange}
        placeholder="Enter your text content here..."
        className="min-h-[100px] text-sm resize-none border-0 bg-transparent focus-visible:ring-0 p-0"
      />
    </BaseNode>
  );
};

export default TextNode;
