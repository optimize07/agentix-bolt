import React, { useState, useCallback, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Video, Play, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CanvasNodeData } from '@/types/canvas';
import BaseNode from './BaseNode';

// Extract YouTube video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const VideoNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Video');
  const [videoUrl, setVideoUrl] = useState(nodeData.url || '');

  const youtubeId = useMemo(() => getYouTubeId(videoUrl), [videoUrl]);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    nodeData.onContentChange?.(e.target.value);
  }, [nodeData]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={nodeData.color}
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Video className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Video title..."
          />
        </div>
      }
    >
      <div className="space-y-2">
        <Input
          value={videoUrl}
          onChange={handleUrlChange}
          placeholder="Paste YouTube URL..."
          className="text-xs"
        />

        {thumbnailUrl ? (
          <div className="relative group rounded-md overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={localTitle}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-red-600 rounded-full p-2">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`https://youtube.com/watch?v=${youtubeId}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Watch
              </Button>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="h-[100px] rounded-md border bg-muted/30 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Invalid YouTube URL
            </p>
          </div>
        ) : (
          <div className="h-[100px] rounded-md border border-dashed flex items-center justify-center">
            <div className="text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube URL above
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default VideoNode;
