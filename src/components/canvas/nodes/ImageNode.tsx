import React, { useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Image as ImageIcon, Upload, MessageSquare, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CanvasNodeData } from '@/types/canvas';
import BaseNode from './BaseNode';

const ImageNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Image');
  const [imageUrl, setImageUrl] = useState(nodeData.fileUrl || nodeData.url || '');
  const [instructionPrompt, setInstructionPrompt] = useState(nodeData.instructionPrompt || '');
  const [isDragging, setIsDragging] = useState(false);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const url = URL.createObjectURL(files[0]);
      setImageUrl(url);
      nodeData.onContentChange?.(url);
    }
  }, [nodeData]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    nodeData.onContentChange?.(e.target.value);
  }, [nodeData]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={nodeData.color}
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <ImageIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Image title..."
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
                  placeholder="e.g., Match this color palette, use similar composition..."
                  className="text-xs min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Tell the AI how to use this image as reference.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <div className="space-y-2">
        {imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt={localTitle}
              className="w-full h-auto rounded-md object-cover max-h-[200px]"
              onError={() => setImageUrl('')}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(imageUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-2">
              Drag & drop an image or paste a URL
            </p>
            <Input
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              className="text-xs"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default ImageNode;
