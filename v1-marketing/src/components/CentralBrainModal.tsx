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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PreviewPanel } from "@/components/PreviewPanel";
import {
  Search,
  Target,
  Settings,
  Wand2,
  BookOpen,
  Image,
  Package,
  Network,
  Lightbulb,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Layers,
  UserCircle,
} from "lucide-react";

interface CentralBrainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt?: (prompt: string) => void;
  onSelectAsset?: (asset: any) => void;
  onSelectKnowledge?: (knowledge: any) => void;
  onSelectStrategy?: (strategy: any) => void;
  onSelectMarketResearch?: (research: any) => void;
  onSelectTool?: (tool: any) => void;
  onSelectRole?: (role: any) => void;
  onSelectGroup?: (groupId: string, contentType: string) => void;
  onSelectAllType?: (contentType: string) => void;
  onSelectSwipeFile?: (swipeFile: any) => void;
  onSelectAdSpyBoard?: (board: any, ads: any[]) => void;
  onAddToCanvas?: (item: any, type: string) => void;
  // NEW: Brain node specific selections
  onSelectAssetGroup?: (groupId: string, assets: any[]) => void;
  onSelectSwipeGroup?: (groupId: string, swipes: any[]) => void;
  selectingForBrainNode?: boolean; // Flag to indicate brain node selection mode
  selectedItems?: {
    assets: string[];
    knowledge: string[];
    strategies: string[];
    research: string[];
    prompts: string[];
    tools: string[];
    roles: string[];
  };
  selectedGroups?: {
    assets: string[];
    knowledge: string[];
    strategies: string[];
    research: string[];
    prompts: string[];
    tools: string[];
    roles: string[];
  };
}

export function CentralBrainModal({
  open,
  onOpenChange,
  onSelectPrompt,
  onSelectAsset,
  onSelectKnowledge,
  onSelectStrategy,
  onSelectMarketResearch,
  onSelectTool,
  onSelectRole,
  onSelectGroup,
  onSelectAllType,
  onSelectSwipeFile,
  onSelectAdSpyBoard,
  onAddToCanvas,
  onSelectAssetGroup,
  onSelectSwipeGroup,
  selectingForBrainNode = false,
  selectedItems = { assets: [], knowledge: [], strategies: [], research: [], prompts: [], tools: [], roles: [] },
  selectedGroups = { assets: [], knowledge: [], strategies: [], research: [], prompts: [], tools: [], roles: [] },
}: CentralBrainModalProps) {
  const { selectedProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("strategy");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [previewItem, setPreviewItem] = useState<{ item: any; type: string } | null>(null);

  // Fetch global content groups
  const { data: contentGroups = [] } = useQuery({
    queryKey: ["content-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch global data sections
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

  const { data: tools = [] } = useQuery({
    queryKey: ["project-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const { data: knowledge = [] } = useQuery({
    queryKey: ["knowledge-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .is("agent_board_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: swipeFiles = [] } = useQuery({
    queryKey: ["swipe-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swipe_files")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: adSpyBoards = [] } = useQuery({
    queryKey: ["ad-spy-boards"],
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

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: marketResearch = [] } = useQuery({
    queryKey: ["market-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_research")
        .select("*")
        .is("project_id", null);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Helper function to organize items by groups
  const organizeByGroups = (items: any[], contentType: string) => {
    const groups = contentGroups.filter((g: any) => g.content_type === contentType);
    const groupedItems: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    // Initialize groups
    groups.forEach((group: any) => {
      groupedItems[group.id] = [];
    });

    // Organize items
    items.forEach((item: any) => {
      if (item.group_id && groupedItems[item.group_id]) {
        groupedItems[item.group_id].push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return { groups, groupedItems, ungrouped };
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string, contentType: string) => {
    if (onSelectGroup) {
      onSelectGroup(groupId, contentType);
    }
  };

  // Handle "select all" for a content type
  const handleSelectAll = (contentType: string) => {
    if (onSelectAllType) {
      onSelectAllType(contentType);
    }
  };

  // Check if a group is selected
  const isGroupSelected = (groupId: string, contentType: string) => {
    const key = contentType as keyof typeof selectedGroups;
    return selectedGroups[key]?.includes(groupId) || false;
  };

  // Check if "all" is selected for a type
  const isAllSelected = (contentType: string) => {
    const key = contentType as keyof typeof selectedGroups;
    return selectedGroups[key]?.includes('all') || false;
  };

  // Render hierarchical content section
  const renderHierarchicalSection = (
    items: any[],
    contentType: string,
    renderItem: (item: any) => JSX.Element,
    emptyIcon: any,
    emptyMessage: string
  ) => {
    const { groups, groupedItems, ungrouped } = organizeByGroups(items, contentType);
    const totalItems = items.length;

    if (totalItems === 0) {
      const Icon = emptyIcon;
      return (
        <div className="text-center py-12">
          <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Select All Option */}
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected(contentType)}
              onCheckedChange={() => handleSelectAll(contentType)}
            />
            <Layers className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="font-semibold text-sm">All {contentType}</span>
              <span className="text-xs text-muted-foreground ml-2">({totalItems} items)</span>
            </div>
          </div>
        </Card>

        {/* Groups */}
        {groups.map((group: any) => {
          const groupItems = groupedItems[group.id] || [];
          if (groupItems.length === 0) return null;

          return (
            <Collapsible
              key={group.id}
              open={expandedGroups[group.id] ?? false}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isGroupSelected(group.id, contentType)}
                        onCheckedChange={() => handleGroupSelect(group.id, contentType)}
                      />
                    </div>
                    {expandedGroups[group.id] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-sm">{group.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({groupItems.length} items)
                      </span>
                    </div>
                    {group.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {onAddToCanvas && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectGroup?.(group.id, contentType)}
                          className="h-7"
                        >
                          Add to Canvas
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-2 border-t">
                    {groupItems.map((item: any) => (
                      <div key={item.id} className="pl-8">
                        {renderItem(item)}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Ungrouped Items */}
        {ungrouped.length > 0 && (
          <Collapsible
            open={expandedGroups['ungrouped'] ?? true}
            onOpenChange={() => toggleGroup('ungrouped')}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                  {expandedGroups['ungrouped'] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-6" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-6" />
                  )}
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm">Ungrouped</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({ungrouped.length} items)
                    </span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2 border-t">
                  {ungrouped.map((item: any) => (
                    <div key={item.id} className="pl-8">
                      {renderItem(item)}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    );
  };

  // Draggable wrapper component
  const DraggableItem = ({ item, type, children }: { item: any; type: string; children: React.ReactNode }) => (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/central-brain-item', JSON.stringify({ item, type }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onMouseEnter={() => setPreviewItem({ item, type })}
      onMouseLeave={() => setPreviewItem(null)}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );

  // Render individual item cards
  const renderStrategyItem = (strategy: any) => (
    <DraggableItem item={strategy} type="strategy">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{strategy.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{strategy.content}</p>
            <Badge variant="outline" className="text-xs mt-2">{strategy.category}</Badge>
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(strategy, 'strategy')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderResearchItem = (research: any) => (
    <DraggableItem item={research} type="research">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{research.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {typeof research.content === 'string' ? research.content : JSON.stringify(research.content)}
            </p>
            <Badge variant="outline" className="text-xs mt-2">{research.type}</Badge>
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(research, 'research')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderAssetItem = (asset: any) => (
    <DraggableItem item={asset} type="asset">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            {asset.type === "image" && asset.url_or_path && (
              <img
                src={asset.url_or_path}
                alt={asset.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{asset.name}</h4>
              <p className="text-xs text-muted-foreground">{asset.type}</p>
              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(asset, 'asset')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderPromptItem = (prompt: any) => (
    <DraggableItem item={prompt} type="prompt">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{prompt.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{prompt.content}</p>
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {prompt.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(prompt, 'prompt')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderKnowledgeItem = (entry: any) => (
    <DraggableItem item={entry} type="knowledge">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{entry.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(entry, 'knowledge')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderToolItem = (tool: any) => (
    <DraggableItem item={tool} type="tool">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{tool.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
            <Badge variant={tool.enabled ? "secondary" : "outline"} className="text-xs mt-2">
              {tool.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(tool, 'tool')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderRoleItem = (role: any) => (
    <DraggableItem item={role} type="role">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{role.name}</h4>
            {role.description && (
              <p className="text-xs text-muted-foreground mb-1">{role.description}</p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2">
              {role.system_prompt.substring(0, 100)}...
            </p>
            {role.tags && role.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {role.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(role, 'role')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderSwipeFileItem = (swipe: any) => (
    <DraggableItem item={swipe} type="swipe_file">
      <Card className="p-3 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            {swipe.image_url && (
              <img
                src={swipe.image_url}
                alt={swipe.title}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{swipe.title}</h4>
              <p className="text-xs text-muted-foreground">{swipe.type}</p>
              {swipe.tags && swipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {swipe.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {onAddToCanvas && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToCanvas(swipe, 'swipe_file')}
                className="h-7"
              >
                Canvas
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DraggableItem>
  );

  const renderAdSpyBoardItem = (board: any) => (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{board.name}</h4>
          {board.description && (
            <p className="text-xs text-muted-foreground mb-2">{board.description}</p>
          )}
          {board.color && (
            <Badge variant="outline" style={{ borderColor: board.color }}>
              <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: board.color }} />
              {board.name}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            const { data: boardItems } = await supabase
              .from("ad_spy_board_items")
              .select("*, ad_spy_ads(*)")
              .eq("board_id", board.id);
            
            const ads = boardItems?.map((item: any) => item.ad_spy_ads) || [];
            onSelectAdSpyBoard?.(board, ads);
          }}
          className="shrink-0"
        >
          Insert Board
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-4 pb-2">
          <DialogTitle>Central Brain</DialogTitle>
          <DialogDescription>
            Drag items to canvas or select to inject context
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Items List (60%) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search across all sections..."
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pb-2 border-b">
                <TabsList className="w-full h-auto grid grid-cols-5 gap-1">
                  <TabsTrigger value="strategy" className="gap-2">
                    <Target className="w-4 h-4" />
                    Strategy
                  </TabsTrigger>
                  <TabsTrigger value="specialists" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Specialists
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="gap-2">
                    <UserCircle className="w-4 h-4" />
                    Roles
                  </TabsTrigger>
                  <TabsTrigger value="prompts" className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Prompts
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Knowledge
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="gap-2">
                    <Image className="w-4 h-4" />
                    Assets
                  </TabsTrigger>
                  <TabsTrigger value="swipes" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Swipe Files
                  </TabsTrigger>
                  <TabsTrigger value="adspy" className="gap-2">
                    <Layers className="w-4 h-4" />
                    Ad Spy Boards
                  </TabsTrigger>
                  <TabsTrigger value="offers" className="gap-2">
                    <Package className="w-4 h-4" />
                    Offers
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="gap-2">
                    <Network className="w-4 h-4" />
                    Integrations
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="strategy" className="mt-2">
              {renderHierarchicalSection(
                [...strategies, ...marketResearch],
                'strategy',
                (item) => item.title ? renderStrategyItem(item) : renderResearchItem(item),
                Lightbulb,
                "No strategy items found"
              )}
            </TabsContent>

            <TabsContent value="specialists" className="mt-2">
              {renderHierarchicalSection(
                tools,
                'tool',
                renderToolItem,
                Settings,
                "No tools found"
              )}
            </TabsContent>

            <TabsContent value="roles" className="mt-2">
              {renderHierarchicalSection(
                aiRoles,
                'role',
                renderRoleItem,
                UserCircle,
                "No AI roles found"
              )}
            </TabsContent>

            <TabsContent value="prompts" className="mt-2">
              {renderHierarchicalSection(
                prompts,
                'prompt',
                renderPromptItem,
                FileText,
                "No prompts found"
              )}
            </TabsContent>

            <TabsContent value="knowledge" className="mt-2">
              {renderHierarchicalSection(
                knowledge,
                'knowledge',
                renderKnowledgeItem,
                BookOpen,
                "No knowledge entries found"
              )}
            </TabsContent>

            <TabsContent value="assets" className="mt-2">
              {renderHierarchicalSection(
                assets,
                'asset',
                renderAssetItem,
                Image,
                "No assets found"
              )}
            </TabsContent>

            <TabsContent value="swipes" className="mt-2">
              {renderHierarchicalSection(
                swipeFiles,
                'swipe',
                renderSwipeFileItem,
                FileText,
                "No swipe files found"
              )}
            </TabsContent>

            <TabsContent value="adspy" className="mt-2 space-y-3">
              {adSpyBoards.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No ad spy boards found</p>
                </div>
              ) : (
                adSpyBoards.map((board: any) => (
                  <div key={board.id}>
                    {renderAdSpyBoardItem(board)}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="offers" className="mt-2">
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Offers section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="mt-2 space-y-3">
              {integrations.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No integrations found</p>
                </div>
              ) : (
                integrations.map((integration: any) => (
                  <Card key={integration.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{integration.name}</h4>
                        <p className="text-xs text-muted-foreground">{integration.platform}</p>
                        <Badge
                          variant={integration.is_connected ? "secondary" : "outline"}
                          className="text-xs mt-2"
                        >
                          {integration.is_connected ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Right: Preview Panel - Fixed Width */}
      <div className="w-[400px] shrink-0 overflow-hidden">
        <PreviewPanel item={previewItem} onAddToCanvas={onAddToCanvas} />
      </div>
    </div>
  </DialogContent>
</Dialog>
  );
}
