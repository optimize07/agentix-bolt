import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Image, Layers, Search } from "lucide-react";

interface LibrarySelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt?: (template: { id: string; name: string; content: string }) => void;
  onSelectAsset?: (asset: any) => void;
  onSelectCanvasBlock?: (block: any) => void;
}

export default function LibrarySelectorModal({
  open,
  onOpenChange,
  onSelectPrompt,
  onSelectAsset,
  onSelectCanvasBlock,
}: LibrarySelectorModalProps) {
  const { boardId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("prompts");

  // Fetch prompts
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ["assets", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!boardId,
  });

  // Fetch canvas blocks
  const { data: canvasBlocks = [] } = useQuery({
    queryKey: ["canvas-blocks-selector", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!boardId,
  });

  const filteredPrompts = prompts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCanvasBlocks = canvasBlocks.filter((b) =>
    (b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
          <DialogDescription>
            Access prompts, assets, and knowledge base
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompts" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Prompts
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompts" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredPrompts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No prompts found
                    </p>
                  ) : (
                    filteredPrompts.map((prompt) => (
                      <Card
                        key={prompt.id}
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          onSelectPrompt?.(prompt);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{prompt.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {prompt.content}
                            </p>
                            {prompt.tags && prompt.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {prompt.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assets" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredAssets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No assets found
                    </p>
                  ) : (
                    filteredAssets.map((asset) => (
                      <Card
                        key={asset.id}
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          onSelectAsset?.(asset);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{asset.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {asset.type}
                              </Badge>
                            </div>
                            {asset.text_content && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {asset.text_content}
                              </p>
                            )}
                            {asset.tags && asset.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {asset.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="canvas" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredCanvasBlocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No canvas blocks found
                    </p>
                  ) : (
                    filteredCanvasBlocks.map((block) => (
                      <Card
                        key={block.id}
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          onSelectCanvasBlock?.(block);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {block.title || `${block.type} block`}
                              </h4>
                              <Badge variant="secondary" className="text-xs uppercase">
                                {block.type}
                              </Badge>
                            </div>
                            {block.content && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {block.content}
                              </p>
                            )}
                            {block.url && (
                              <p className="text-xs text-primary truncate mt-1">
                                {block.url}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
