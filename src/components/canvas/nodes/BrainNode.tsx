import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Brain, Search, FolderOpen, FileText, Image, Lightbulb, Package, Loader2, RefreshCw, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanvasNodeData } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

interface BrainItem {
  id: string;
  title: string;
  type: 'knowledge' | 'swipe' | 'asset' | 'template' | 'offer';
  preview?: string;
  content?: string;
  imageUrl?: string;
}

const typeIcons = {
  knowledge: FileText,
  swipe: Lightbulb,
  asset: Image,
  template: FolderOpen,
  offer: Package,
};

const typeColors = {
  knowledge: 'text-blue-500',
  swipe: 'text-amber-500',
  asset: 'text-green-500',
  template: 'text-purple-500',
  offer: 'text-pink-500',
};

const BrainNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Central Brain');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<BrainItem[]>(
    (nodeData.metadata?.linkedItems as BrainItem[]) || []
  );
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<BrainItem[]>([]);

  // Fetch content from database
  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const allItems: BrainItem[] = [];

      // Fetch knowledge base items
      const { data: kbItems } = await supabase
        .from('knowledge_base_items')
        .select('id, title, description, category')
        .eq('is_archived', false)
        .limit(30);

      if (kbItems) {
        allItems.push(...kbItems.map(item => ({
          id: item.id,
          title: item.title,
          type: 'knowledge' as const,
          preview: item.description || item.category || '',
          content: item.description || '',
        })));
      }

      // Fetch swipe files
      const { data: swipes } = await supabase
        .from('swipe_files')
        .select('id, title, description, image_url, content')
        .eq('is_archived', false)
        .limit(30);

      if (swipes) {
        allItems.push(...swipes.map(item => ({
          id: item.id,
          title: item.title,
          type: 'swipe' as const,
          preview: item.description || '',
          content: item.content || item.description || '',
          imageUrl: item.image_url || undefined,
        })));
      }

      // Fetch assets
      const { data: assets } = await supabase
        .from('assets')
        .select('id, title, description, file_url, thumbnail_url')
        .eq('is_archived', false)
        .limit(30);

      if (assets) {
        allItems.push(...assets.map(item => ({
          id: item.id,
          title: item.title,
          type: 'asset' as const,
          preview: item.description || '',
          imageUrl: item.file_url || item.thumbnail_url || undefined,
        })));
      }

      // Fetch templates
      const { data: templates } = await supabase
        .from('prompt_templates')
        .select('id, title, description, prompt_text')
        .limit(30);

      if (templates) {
        allItems.push(...templates.map(item => ({
          id: item.id,
          title: item.title,
          type: 'template' as const,
          preview: item.description || '',
          content: item.prompt_text || '',
        })));
      }

      // Fetch offers
      const { data: offers } = await supabase
        .from('offers')
        .select('id, title, description, price, discount')
        .eq('is_active', true)
        .limit(30);

      if (offers) {
        allItems.push(...offers.map(item => ({
          id: item.id,
          title: item.title,
          type: 'offer' as const,
          preview: item.description || '',
          content: `${item.description || ''}\nPrice: ${item.price || 'N/A'}${item.discount ? `\nDiscount: ${item.discount}` : ''}`,
        })));
      }

      setItems(allItems);
    } catch (err) {
      console.error('Failed to fetch brain content:', err);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Update nodeData when selected items change
  useEffect(() => {
    // Build combined content from selected items for AI context
    const combinedContent = selectedItems.map(item => {
      const prefix = `[${item.type.toUpperCase()}: ${item.title}]`;
      return `${prefix}\n${item.content || item.preview || ''}`;
    }).join('\n\n---\n\n');

    nodeData.onContentChange?.(combinedContent);
  }, [selectedItems, nodeData]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleToggleItem = useCallback((item: BrainItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(s => s.id === item.id);
      if (isSelected) {
        return prev.filter(s => s.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || item.type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [items, searchQuery, activeTab]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color="#8b5cf6"
      showSourceHandle={true}
      showTargetHandle={false}
      className="min-w-[320px]"
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Brain className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate"
            placeholder="Brain reference..."
          />
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {selectedItems.length} linked
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={fetchContent}
            disabled={isLoading}
            title="Refresh content"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brain content..."
            className="pl-7 text-xs h-8"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-7 w-full">
            <TabsTrigger value="all" className="text-[10px] flex-1 h-5">All</TabsTrigger>
            <TabsTrigger value="knowledge" className="text-[10px] flex-1 h-5">KB</TabsTrigger>
            <TabsTrigger value="swipe" className="text-[10px] flex-1 h-5">Swipes</TabsTrigger>
            <TabsTrigger value="asset" className="text-[10px] flex-1 h-5">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-2">
            {isLoading ? (
              <div className="h-[140px] flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[140px]">
                <div className="space-y-1">
                  {filteredItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No items found
                    </p>
                  ) : (
                    filteredItems.map((item) => {
                      const Icon = typeIcons[item.type];
                      const isSelected = selectedItems.some(s => s.id === item.id);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleToggleItem(item)}
                          className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                            isSelected 
                              ? 'bg-primary/20 border border-primary/50' 
                              : 'hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${typeColors[item.type]}`} />
                            <span className="font-medium truncate flex-1">{item.title}</span>
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {item.preview && (
                            <p className="text-muted-foreground truncate mt-0.5 pl-5">
                              {item.preview}
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Selected items summary */}
        {selectedItems.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground mb-1">Linked content (flows to connected Chat):</p>
            <div className="flex flex-wrap gap-1">
              {selectedItems.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <Badge 
                    key={item.id} 
                    variant="secondary" 
                    className="text-[10px] h-5 gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Icon className={`h-2.5 w-2.5 ${typeColors[item.type]}`} />
                    {item.title}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default BrainNode;
