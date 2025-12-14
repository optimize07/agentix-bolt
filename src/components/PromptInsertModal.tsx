import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[] | null;
}

interface PromptInsertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: PromptTemplate) => void;
}

export default function PromptInsertModal({
  open,
  onOpenChange,
  onSelect,
}: PromptInsertModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromptTemplate[];
    },
  });

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (template: PromptTemplate) => {
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Prompt Template</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelect(template)}
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {template.content}
                    </p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

