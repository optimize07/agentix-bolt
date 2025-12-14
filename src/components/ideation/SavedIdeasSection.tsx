import { BookmarkCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  platform: string | null;
  format: string | null;
  status: string;
}

interface SavedIdeasSectionProps {
  ideas: SavedIdea[];
  onDelete: (id: string) => void;
}

export function SavedIdeasSection({ ideas, onDelete }: SavedIdeasSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookmarkCheck className="w-5 h-5 text-primary" />
          Saved Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved ideas yet</p>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold">{idea.title}</h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(idea.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{idea.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {idea.platform && <span>{idea.platform}</span>}
                {idea.format && <span>• {idea.format}</span>}
                <span className="capitalize">• {idea.status || "active"}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
