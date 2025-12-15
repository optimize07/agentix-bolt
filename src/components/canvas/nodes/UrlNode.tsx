import React, { useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Link, Loader2, RefreshCw, ExternalLink, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CanvasNodeData } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

const UrlNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'URL');
  const [url, setUrl] = useState(nodeData.url || '');
  const [content, setContent] = useState(nodeData.content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [instructionPrompt, setInstructionPrompt] = useState(nodeData.instructionPrompt || '');

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  }, []);

  const handleInstructionChange = useCallback((value: string) => {
    setInstructionPrompt(value);
    nodeData.onInstructionChange?.(value);
  }, [nodeData]);

  const scrapeUrl = useCallback(async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-url-content', {
        body: { url }
      });

      if (error) throw error;

      const scraped = result?.content || result?.markdown || '';
      setContent(scraped);
      nodeData.onContentChange?.(scraped);
      
      if (result?.title && !localTitle) {
        setLocalTitle(result.title);
        nodeData.onTitleChange?.(result.title);
      }
      
      toast.success('URL scraped successfully');
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error('Failed to scrape URL');
    } finally {
      setIsLoading(false);
    }
  }, [url, localTitle, nodeData]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={nodeData.color}
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Link className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Page title..."
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
                  onChange={(e) => handleInstructionChange(e.target.value)}
                  placeholder="e.g., Extract key messaging points, analyze competitor positioning..."
                  className="text-xs min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Tell the AI how to use this scraped content.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className="text-xs flex-1"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={scrapeUrl}
            disabled={isLoading}
            className="h-8 px-2"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : content ? (
              <RefreshCw className="h-3 w-3" />
            ) : (
              'Scrape'
            )}
          </Button>
          {url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(url, '_blank')}
              className="h-8 px-2"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>

        {content ? (
          <ScrollArea className="h-[120px] rounded-md border bg-muted/30 p-2">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {content.slice(0, 1000)}
              {content.length > 1000 && '...'}
            </p>
          </ScrollArea>
        ) : (
          <div className="h-[80px] rounded-md border border-dashed flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Enter a URL and click Scrape
            </p>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default UrlNode;
