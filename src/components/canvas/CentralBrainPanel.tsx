import React, { useState } from 'react';
import { Brain, ChevronLeft, ChevronRight, Search, FileText, Image, FileType, Tag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CentralBrainPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onDragStart: (type: string, item: any) => void;
}

const CentralBrainPanel: React.FC<CentralBrainPanelProps> = ({
  isOpen,
  onToggle,
  onDragStart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch knowledge base items
  const { data: knowledgeItems = [] } = useQuery({
    queryKey: ['canvas-knowledge-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_items')
        .select('id, title, description, category, file_path')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch swipe files
  const { data: swipeFiles = [] } = useQuery({
    queryKey: ['canvas-swipe-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swipe_files')
        .select('id, title, description, image_url, category')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ['canvas-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('id, title, description, asset_type, file_url, thumbnail_url')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['canvas-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('id, title, description, prompt_text, category')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch offers
  const { data: offers = [] } = useQuery({
    queryKey: ['canvas-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, title, description, price, discount')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const filterItems = <T extends { title: string; description?: string | null }>(items: T[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  };

  const DraggableItem: React.FC<{
    type: string;
    item: any;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
  }> = ({ type, item, icon, title, subtitle }) => (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, item }));
        onDragStart(type, item);
      }}
      className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="absolute right-3 top-3 z-10 h-8 w-8 bg-background/95 backdrop-blur"
        onClick={onToggle}
      >
        <Brain className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur border-l border-border z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Central Brain</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-5 m-2 h-8">
          <TabsTrigger value="knowledge" className="text-[10px] px-1">
            <FileText className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="swipe" className="text-[10px] px-1">
            <Image className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-[10px] px-1">
            <FileType className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-[10px] px-1">
            <Tag className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="offers" className="text-[10px] px-1">
            <Package className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-2 pb-2">
          <TabsContent value="knowledge" className="mt-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-2 py-1">
              Drag items to canvas as Brain nodes
            </p>
            {filterItems(knowledgeItems).map((item) => (
              <DraggableItem
                key={item.id}
                type="knowledge"
                item={item}
                icon={<FileText className="h-3.5 w-3.5" />}
                title={item.title}
                subtitle={item.category}
              />
            ))}
            {filterItems(knowledgeItems).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No knowledge items found
              </p>
            )}
          </TabsContent>

          <TabsContent value="swipe" className="mt-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-2 py-1">
              Drag swipe files as Image or Brain nodes
            </p>
            {filterItems(swipeFiles).map((item) => (
              <DraggableItem
                key={item.id}
                type="swipe"
                item={item}
                icon={<Image className="h-3.5 w-3.5" />}
                title={item.title}
                subtitle={item.category || undefined}
              />
            ))}
            {filterItems(swipeFiles).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No swipe files found
              </p>
            )}
          </TabsContent>

          <TabsContent value="assets" className="mt-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-2 py-1">
              Drag assets to canvas
            </p>
            {filterItems(assets).map((item) => (
              <DraggableItem
                key={item.id}
                type="asset"
                item={item}
                icon={<FileType className="h-3.5 w-3.5" />}
                title={item.title}
                subtitle={item.asset_type}
              />
            ))}
            {filterItems(assets).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No assets found
              </p>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-2 py-1">
              Drag templates as Text nodes
            </p>
            {filterItems(templates).map((item) => (
              <DraggableItem
                key={item.id}
                type="template"
                item={item}
                icon={<Tag className="h-3.5 w-3.5" />}
                title={item.title}
                subtitle={item.category || undefined}
              />
            ))}
            {filterItems(templates).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No templates found
              </p>
            )}
          </TabsContent>

          <TabsContent value="offers" className="mt-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-2 py-1">
              Drag offers as Brain nodes
            </p>
            {filterItems(offers).map((item) => (
              <DraggableItem
                key={item.id}
                type="offer"
                item={item}
                icon={<Package className="h-3.5 w-3.5" />}
                title={item.title}
                subtitle={item.price ? `$${item.price}` : undefined}
              />
            ))}
            {filterItems(offers).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No offers found
              </p>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default CentralBrainPanel;
