import { Lightbulb } from "lucide-react";
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
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-lg">Ready-to-Use Content Ideas</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded w-16" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-lg">Ready-to-Use Content Ideas</h3>
      </div>
      {ideas.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Click "Generate Ideas" to get AI-powered content suggestions</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea, index) => (
            <IdeaCard
              key={index}
              idea={idea}
              onSave={onSaveIdea}
              onSchedule={onScheduleIdea}
            />
          ))}
        </div>
      )}
    </div>
  );
}
