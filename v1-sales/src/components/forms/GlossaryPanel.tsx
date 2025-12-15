import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ClickableGlossaryTerm } from "./ClickableGlossaryTerm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
  category: string;
  description?: string;
}

interface GlossaryPanelProps {
  glossaryTerms: GlossaryTerm[];
  usedTermIds: string[];
  onAddTerm: (term: GlossaryTerm) => void;
}

export const GlossaryPanel = ({ glossaryTerms, usedTermIds, onAddTerm }: GlossaryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const groupedTerms = useMemo(() => {
    const filtered = glossaryTerms.filter(term => 
      term.default_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.term_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped: Record<string, GlossaryTerm[]> = {};
    filtered.forEach(term => {
      const category = term.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(term);
    });

    return grouped;
  }, [glossaryTerms, searchQuery]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Glossary Terms</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.keys(groupedTerms).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No glossary terms found
          </p>
        ) : (
          Object.entries(groupedTerms).map(([category, terms]) => (
            <Collapsible 
              key={category}
              open={openCategories[category] !== false}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                <span className="text-sm font-medium">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{terms.length}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    openCategories[category] !== false && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1 pl-2">
                {terms.map(term => (
                  <ClickableGlossaryTerm
                    key={term.id}
                    term={term}
                    isUsed={usedTermIds.includes(term.id)}
                    onAdd={onAddTerm}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
};
