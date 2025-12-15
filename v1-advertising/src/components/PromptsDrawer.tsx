import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ArrowRight } from "lucide-react";

interface PromptsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertPrompt?: (prompt: string) => void;
}

export function PromptsDrawer({ open, onOpenChange, onInsertPrompt }: PromptsDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInsert = (content: string) => {
    if (onInsertPrompt) {
      onInsertPrompt(content);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Prompt Library</SheetTitle>
          <SheetDescription>
            Browse and insert prompt templates into your conversation
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prompts..."
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 pr-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No prompts found</p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInsert(template.content)}
                        className="shrink-0"
                      >
                        Insert
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>

                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
