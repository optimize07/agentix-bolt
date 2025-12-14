import { Lightbulb, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "./IdeaCard";

interface ContentIdea {
  title: string;
  description: string;
  platform: string;
  format: string;
  cta: string;
}

interface ContentIdeasSectionProps {
  ideas: ContentIdea[];
  onSaveIdea: (idea: ContentIdea) => void;
  onScheduleIdea: (idea: ContentIdea) => void;
  isLoading?: boolean;
}

export function ContentIdeasSection({ ideas, onSaveIdea, onScheduleIdea, isLoading }: ContentIdeasSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Content Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Content Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate ideas to see suggestions</p>
        ) : (
          ideas.map((idea, index) => (
            <div key={index} className="space-y-2">
              <IdeaCard
                title={idea.title}
                description={idea.description}
                metadata={`${idea.platform} • ${idea.format}`}
                cta={idea.cta}
                onSave={() => onSaveIdea(idea)}
                onShare={() => onScheduleIdea(idea)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => onSaveIdea(idea)}>
                  <BookOpen className="w-4 h-4" />
                  Save to Library
                </Button>
                <Button size="sm" variant="ghost" className="gap-2" onClick={() => onScheduleIdea(idea)}>
                  Schedule <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
