import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Image, FileText, Layers, Wrench, BookOpen, Target, UserCircle, Sparkles, Lightbulb } from "lucide-react";

interface BrainContentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAssetGroup?: (groupId: string, assets: any[]) => void;
  onSelectSwipeGroup?: (groupId: string, swipes: any[]) => void;
  onSelectAdSpyBoard?: (board: any, ads: any[]) => void;
  onSelectTool?: (tool: any) => void;
  onSelectKnowledge?: (knowledge: any) => void;
  onSelectStrategy?: (strategy: any) => void;
  onSelectRole?: (role: any) => void;
  onSelectPrompt?: (prompt: any) => void;
  onSelectResearch?: (research: any) => void;
}

export function BrainContentSelector({
  open,
  onOpenChange,
  onSelectAssetGroup,
  onSelectSwipeGroup,
  onSelectAdSpyBoard,
  onSelectTool,
  onSelectKnowledge,
  onSelectStrategy,
  onSelectRole,
  onSelectPrompt,
  onSelectResearch,
}: BrainContentSelectorProps) {
  const { selectedProjectId } = useProject();
  const [activeTab, setActiveTab] = useState("asset_groups");

  // Fetch global content groups for assets
  const { data: assetGroups = [] } = useQuery({
    queryKey: ["asset-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "asset")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global content groups for swipe files
  const { data: swipeGroups = [] } = useQuery({
    queryKey: ["swipe-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "swipe")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch Ad Spy boards
  const { data: adSpyBoards = [] } = useQuery({
    queryKey: ["ad-spy-boards-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spy_boards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global tools
  const { data: tools = [] } = useQuery({
    queryKey: ["project-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .is("project_id", null)
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global knowledge entries
  const { data: knowledgeEntries = [] } = useQuery({
    queryKey: ["knowledge-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .is("project_id", null)
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global strategies
  const { data: strategies = [] } = useQuery({
    queryKey: ["project-strategies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_strategies")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global AI roles
  const { data: aiRoles = [] } = useQuery({
    queryKey: ["ai-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_roles")
        .select("*")
        .is("project_id", null)
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch prompt templates
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompt-templates", selectedProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global market research
  const { data: research = [] } = useQuery({
    queryKey: ["market-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_research")
        .select("*")
        .is("project_id", null)
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global assets for counting
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .is("agent_board_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global swipe files for counting
  const { data: swipeFiles = [] } = useQuery({
    queryKey: ["swipe-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swipe_files")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getAssetCount = (groupId: string) => {
    return assets.filter((a) => a.group_id === groupId).length;
  };

  const getSwipeCount = (groupId: string) => {
    return swipeFiles.filter((s) => s.group_id === groupId).length;
  };

  const handleSelectAssetGroup = async (group: any) => {
    const groupAssets = assets.filter((a) => a.group_id === group.id);
    onSelectAssetGroup?.(group.id, groupAssets);
    onOpenChange(false);
  };

  const handleSelectSwipeGroup = async (group: any) => {
    const groupSwipes = swipeFiles.filter((s) => s.group_id === group.id);
    onSelectSwipeGroup?.(group.id, groupSwipes);
    onOpenChange(false);
  };

  const handleSelectBoard = async (board: any) => {
    const { data: boardItems, error } = await supabase
      .from("ad_spy_board_items")
      .select("*, ad_spy_ads(*)")
      .eq("board_id", board.id);

    if (!error && boardItems) {
      const ads = boardItems.map((item: any) => item.ad_spy_ads);
      onSelectAdSpyBoard?.(board, ads);
      onOpenChange(false);
    }
  };

  const handleSelectTool = (tool: any) => {
    onSelectTool?.(tool);
    onOpenChange(false);
  };

  const handleSelectKnowledge = (knowledge: any) => {
    onSelectKnowledge?.(knowledge);
    onOpenChange(false);
  };

  const handleSelectStrategy = (strategy: any) => {
    onSelectStrategy?.(strategy);
    onOpenChange(false);
  };

  const handleSelectRole = (role: any) => {
    onSelectRole?.(role);
    onOpenChange(false);
  };

  const handleSelectPrompt = (prompt: any) => {
    onSelectPrompt?.(prompt);
    onOpenChange(false);
  };

  const handleSelectResearch = (item: any) => {
    onSelectResearch?.(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-4 pb-2">
          <DialogTitle>Select Content for Brain Node</DialogTitle>
          <DialogDescription>
            Choose content to connect to this brain node
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pb-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="asset_groups" className="gap-2">
                <Image className="w-4 h-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="swipe_groups" className="gap-2">
                <FileText className="w-4 h-4" />
                Swipes
              </TabsTrigger>
              <TabsTrigger value="ad_spy_boards" className="gap-2">
                <Layers className="w-4 h-4" />
                Ad Boards
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Wrench className="w-4 h-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="strategies" className="gap-2">
                <Target className="w-4 h-4" />
                Strategy
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <UserCircle className="w-4 h-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="prompts" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Prompts
              </TabsTrigger>
              <TabsTrigger value="research" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Research
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="asset_groups" className="mt-0 space-y-3">
              {assetGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No asset groups found</p>
                </div>
              ) : (
                assetGroups.map((group: any) => (
                  <Card key={group.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Image className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{group.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {getAssetCount(group.id)} assets
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectAssetGroup(group)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="swipe_groups" className="mt-0 space-y-3">
              {swipeGroups.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No swipe groups found</p>
                </div>
              ) : (
                swipeGroups.map((group: any) => (
                  <Card key={group.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{group.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {getSwipeCount(group.id)} swipe files
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectSwipeGroup(group)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="ad_spy_boards" className="mt-0 space-y-3">
              {adSpyBoards.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No ad spy boards found</p>
                </div>
              ) : (
                adSpyBoards.map((board: any) => (
                  <Card key={board.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{board.name}</h4>
                          {board.description && (
                            <p className="text-xs text-muted-foreground">{board.description}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectBoard(board)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="tools" className="mt-0 space-y-3">
              {tools.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No tools found</p>
                </div>
              ) : (
                tools.map((tool: any) => (
                  <Card key={tool.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Wrench className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{tool.name}</h4>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectTool(tool)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0 space-y-3">
              {knowledgeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No knowledge entries found</p>
                </div>
              ) : (
                knowledgeEntries.map((entry: any) => (
                  <Card key={entry.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{entry.title}</h4>
                          {entry.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectKnowledge(entry)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="strategies" className="mt-0 space-y-3">
              {strategies.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No strategies found</p>
                </div>
              ) : (
                strategies.map((strategy: any) => (
                  <Card key={strategy.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{strategy.title}</h4>
                          <Badge variant="outline" className="mb-2">{strategy.category}</Badge>
                          {strategy.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{strategy.content}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectStrategy(strategy)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="roles" className="mt-0 space-y-3">
              {aiRoles.length === 0 ? (
                <div className="text-center py-12">
                  <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No AI roles found</p>
                </div>
              ) : (
                aiRoles.map((role: any) => (
                  <Card key={role.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <UserCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{role.name}</h4>
                          {role.description && (
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectRole(role)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="prompts" className="mt-0 space-y-3">
              {prompts.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No prompts found</p>
                </div>
              ) : (
                prompts.map((prompt: any) => (
                  <Card key={prompt.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{prompt.name}</h4>
                          {prompt.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{prompt.content}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectPrompt(prompt)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="research" className="mt-0 space-y-3">
              {research.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No research found</p>
                </div>
              ) : (
                research.map((item: any) => (
                  <Card key={item.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Lightbulb className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                          <Badge variant="outline" className="mb-2">{item.type}</Badge>
                          {item.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectResearch(item)}>
                        Select
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}