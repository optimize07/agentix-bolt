import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Image, FileText, Video, File } from "lucide-react";

interface PreviewPanelProps {
  item: { item: any; type: string } | null;
  onAddToCanvas?: (item: any, type: string) => void;
}

export function PreviewPanel({ item, onAddToCanvas }: PreviewPanelProps) {
  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-6">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Hover over an item to preview</p>
          <p className="text-xs mt-2">Drag items directly to canvas</p>
        </div>
      </div>
    );
  }

  const { item: data, type } = item;

  const renderPreview = () => {
    switch (type) {
      case 'asset':
        return (
          <div className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {data.type === 'image' && data.url_or_path ? (
                <img
                  src={data.url_or_path}
                  alt={data.name}
                  className="w-full h-full object-contain"
                />
              ) : data.type === 'video' && data.url_or_path ? (
                <video src={data.url_or_path} controls className="w-full h-full" />
              ) : (
                <File className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.name}</h3>
              <Badge variant="secondary" className="mb-3">{data.type}</Badge>
              {data.description && (
                <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
              )}
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'swipe_file':
        return (
          <div className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {data.image_url ? (
                <img
                  src={data.image_url}
                  alt={data.title}
                  className="w-full h-full object-contain"
                />
              ) : data.video_url ? (
                <video src={data.video_url} controls className="w-full h-full" />
              ) : (
                <FileText className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.title}</h3>
              <Badge variant="secondary" className="mb-3">{data.type}</Badge>
              {data.description && (
                <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
              )}
              {data.text_content && (
                <Card className="p-3 bg-muted/50">
                  <p className="text-xs font-mono whitespace-pre-wrap">{data.text_content}</p>
                </Card>
              )}
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'prompt':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{data.name}</h3>
            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap font-mono">{data.content}</p>
            </Card>
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'role':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.name}</h3>
              {data.description && (
                <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">System Prompt</h4>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm whitespace-pre-wrap font-mono">{data.system_prompt}</p>
              </Card>
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'tool':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.name}</h3>
              <Badge variant={data.enabled ? "secondary" : "outline"} className="mb-3">
                {data.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {data.description && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">{data.description}</p>
              </Card>
            )}
            {data.config && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Configuration</h4>
                <Card className="p-4 bg-muted/50">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(data.config, null, 2)}
                  </pre>
                </Card>
              </div>
            )}
          </div>
        );

      case 'knowledge':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-2">{data.title}</h3>
            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{data.content}</p>
            </Card>
            {data.source_url && (
              <div>
                <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Source</h4>
                <a 
                  href={data.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline break-all"
                >
                  {data.source_url}
                </a>
              </div>
            )}
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'strategy':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.title}</h3>
              <Badge variant="outline" className="mb-3">{data.category}</Badge>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{data.content}</p>
            </Card>
          </div>
        );

      case 'research':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{data.name}</h3>
              <Badge variant="outline" className="mb-3">{data.type}</Badge>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">
                {typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2)}
              </p>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Preview not available for this type</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col border-l bg-background overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Preview
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderPreview()}
        </div>
      </ScrollArea>
      {onAddToCanvas && (
        <div className="p-4 border-t">
          <Button 
            className="w-full" 
            onClick={() => onAddToCanvas(data, type)}
          >
            Add to Canvas
          </Button>
        </div>
      )}
    </div>
  );
}
