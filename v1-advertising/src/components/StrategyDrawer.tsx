import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbulb, Users, DollarSign, FileText, Globe } from "lucide-react";

interface StrategyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StrategySection {
  id: string;
  title: string;
  content: string;
  category: string;
}

export function StrategyDrawer({ open, onOpenChange }: StrategyDrawerProps) {
  const { selectedProjectId } = useProject();

  const { data: strategies = [] } = useQuery({
    queryKey: ["project-strategies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_strategies")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const groupedStrategies = strategies.reduce((acc, strategy) => {
    if (!acc[strategy.category]) {
      acc[strategy.category] = [];
    }
    acc[strategy.category].push(strategy);
    return acc;
  }, {} as Record<string, StrategySection[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tips": return Lightbulb;
      case "audience": return Users;
      case "budget": return DollarSign;
      case "prompts": return FileText;
      case "platform": return Globe;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "tips": return "Tips & Best Practices";
      case "audience": return "Audience Insights";
      case "budget": return "Budget Guidelines";
      case "prompts": return "Prompt Suggestions";
      case "platform": return "Platform Guidelines";
      default: return category;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Strategy Reference</SheetTitle>
          <SheetDescription>
            Quick reference to your board's strategy and guidelines
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="pr-4 space-y-4">
            {Object.keys(groupedStrategies).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  No strategy sections defined yet
                </p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(groupedStrategies).map(([category, sections]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                      <div className="p-2">
                        {sections.map((section, idx) => (
                          <AccordionItem key={section.id} value={section.id} className="border-none">
                            <AccordionTrigger className="text-sm hover:no-underline px-2">
                              {section.title}
                            </AccordionTrigger>
                            <AccordionContent className="px-2 text-sm text-muted-foreground">
                              {section.content}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
